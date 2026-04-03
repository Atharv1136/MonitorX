import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalOffer {
  type: 'screen-offer';
  from: string;
  sdp: RTCSessionDescriptionInit;
}
interface SignalAnswer {
  type: 'screen-answer';
  to: string;
  sdp: RTCSessionDescriptionInit;
}
interface SignalIce {
  type: 'ice-candidate';
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}
interface SignalStop {
  type: 'screen-stopped';
  from: string;
}
type Signal = SignalOffer | SignalAnswer | SignalIce | SignalStop;

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useScreenShare
 *
 * For the HOST   → pass role='host'.   Subscribes to incoming offers and
 *                  builds a peer connection per participant. Returns `streams`
 *                  map of userId → MediaStream.
 *
 * For PARTICIPANT → pass role='participant'. Exposes startSharing /
 *                  stopSharing helpers and own preview stream.
 */
export function useScreenShare(
  sessionId: string,
  userId: string,
  role: 'host' | 'participant'
) {
  // host: map of participantUserId → their MediaStream
  const [streams, setStreams] = useState<Map<string, MediaStream>>(new Map());
  // participant: own preview stream
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // refs so callbacks always see latest state without stale closures
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const channelName = `session:${sessionId}`;

  // ── helper: send a signal via Supabase Broadcast ──────────────────────────
  const broadcast = useCallback(
    (payload: Signal) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: payload.type,
        payload,
      });
    },
    []
  );

  // ── helper: update stream_active flag in DB ───────────────────────────────
  const setStreamActive = useCallback(
    async (active: boolean) => {
      await supabase
        .from('session_participants')
        .update({ stream_active: active })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
    },
    [sessionId, userId]
  );

  // ── HOST: create a peer connection to receive one participant's stream ─────
  const createHostPeerConnection = useCallback(
    (participantId: string) => {
      // reuse existing if already created
      if (peerConnections.current.has(participantId)) {
        return peerConnections.current.get(participantId)!;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnections.current.set(participantId, pc);

      // when remote track arrives → store in streams map
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setStreams((prev) => {
          const next = new Map(prev);
          next.set(participantId, remoteStream);
          return next;
        });
      };

      // send ICE candidates to the participant
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          broadcast({
            type: 'ice-candidate',
            from: userId,
            to: participantId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setStreams((prev) => {
            const next = new Map(prev);
            next.delete(participantId);
            return next;
          });
          peerConnections.current.delete(participantId);
        }
      };

      return pc;
    },
    [userId, broadcast]
  );

  // ── PARTICIPANT: create a peer connection to send our stream ──────────────
  const createParticipantPeerConnection = useCallback(
    (hostId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnections.current.set('host', pc);

      // add all tracks from the display stream
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // send ICE candidates to host
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          broadcast({
            type: 'ice-candidate',
            from: userId,
            to: hostId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      return pc;
    },
    [userId, broadcast]
  );

  // ── Subscribe to Supabase Broadcast channel ───────────────────────────────
  useEffect(() => {
    if (!sessionId || !userId) return;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    // ── HOST: handle incoming offer ────────────────────────────────────────
    if (role === 'host') {
      channel.on('broadcast', { event: 'screen-offer' }, async ({ payload }) => {
        const { from, sdp } = payload as SignalOffer;
        const pc = createHostPeerConnection(from);

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Add any queued ICE candidates for this peer
        const pending = pendingCandidates.current.get(from) || [];
        pending.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error));
        pendingCandidates.current.delete(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        broadcast({ type: 'screen-answer', to: from, sdp: answer });
      });

      channel.on('broadcast', { event: 'screen-stopped' }, ({ payload }) => {
        const { from } = payload as SignalStop;
        const pc = peerConnections.current.get(from);
        if (pc) {
          pc.close();
          peerConnections.current.delete(from);
        }
        setStreams((prev) => {
          const next = new Map(prev);
          next.delete(from);
          return next;
        });
      });
    }

    // ── PARTICIPANT: handle incoming answer from host ───────────────────────
    if (role === 'participant') {
      channel.on('broadcast', { event: 'screen-answer' }, async ({ payload }) => {
        const { to, sdp } = payload as SignalAnswer;
        if (to !== userId) return;

        const pc = peerConnections.current.get('host');
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          
          // Add any queued ICE candidates for host
          const pending = pendingCandidates.current.get('host') || [];
          pending.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error));
          pendingCandidates.current.delete('host');
        }
      });
    }

    // ── BOTH: handle ICE candidates ────────────────────────────────────────
    channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
      const { from, to, candidate } = payload as SignalIce;
      if (to !== userId) return;

      // host: look up pc by participant id; participant: look up by 'host'
      const pcKey = role === 'host' ? from : 'host';
      const pc = peerConnections.current.get(pcKey);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // ignore stale candidates
        }
      } else {
        if (!pendingCandidates.current.has(pcKey)) {
          pendingCandidates.current.set(pcKey, []);
        }
        pendingCandidates.current.get(pcKey)!.push(candidate);
      }
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, userId, role, channelName, createHostPeerConnection, broadcast]);

  // ── PARTICIPANT: startSharing ─────────────────────────────────────────────
  const startSharing = useCallback(async () => {
    setShareError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsSharing(true);
      await setStreamActive(true);

      // we need the host's user_id to route the answer back
      // fetch the session to get host_id
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('host_id')
        .eq('id', sessionId)
        .single();

      const hostId = sessionData?.host_id ?? 'host';
      const pc = createParticipantPeerConnection(hostId, stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      broadcast({ type: 'screen-offer', from: userId, sdp: offer });

      // handle user stopping the share via browser's built-in "Stop sharing" button
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopSharing();
      });
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setShareError(err.message ?? 'Screen share failed');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId, setStreamActive, createParticipantPeerConnection, broadcast]);

  // ── PARTICIPANT: stopSharing ──────────────────────────────────────────────
  const stopSharing = useCallback(async () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setIsSharing(false);

    const pc = peerConnections.current.get('host');
    if (pc) {
      pc.close();
      peerConnections.current.delete('host');
    }

    broadcast({ type: 'screen-stopped', from: userId });
    await setStreamActive(false);
  }, [userId, broadcast, setStreamActive]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
    };
  }, []);

  return {
    // host
    streams,
    // participant
    localStream,
    isSharing,
    shareError,
    startSharing,
    stopSharing,
  };
}
