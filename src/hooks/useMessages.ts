import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageType = 'group' | 'private';

export interface EnrichedMessage {
  id: string;
  session_id: string;
  from_user_id: string;
  to_user_id: string | null;
  content: string;
  created_at: string;
  type: MessageType;
  sender_name?: string;
  /** Only relevant if type === 'reaction' content prefix */
  isReaction?: boolean;
}

/** A short-lived "pop" notification on a participant tile */
export interface TileNotification {
  id: string;
  userId: string;
  emoji: string;
  label: string;
  expiresAt: number; // Date.now() + duration
}

// Reaction broadcast event payload
interface ReactionPayload {
  type: 'raise-hand' | 'tile-reaction';
  from: string;
  from_name: string;
  emoji: string;
  label: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useMessages
 *
 * Manages session messages (group + private) and ephemeral tile reactions.
 *
 * @param sessionId  the live session id
 * @param userId     current user's id
 * @param hostId     the host/instructor's user id
 * @param role       'host' | 'participant'
 * @param myName     display name of the current user
 */
export function useMessages(
  sessionId: string,
  userId: string,
  hostId: string,
  role: 'host' | 'participant',
  myName: string
) {
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [tileNotifications, setTileNotifications] = useState<TileNotification[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const tickerRef = useRef<number | null>(null);

  // ── Prune expired tile notifications every second ─────────────────────────
  useEffect(() => {
    tickerRef.current = window.setInterval(() => {
      setTileNotifications(prev => prev.filter(n => n.expiresAt > Date.now()));
    }, 500);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, []);

  // ── Fetch initial messages ─────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles!messages_from_user_id_fkey(full_name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!data) return;

    const enriched: EnrichedMessage[] = data.map((m: any) => ({
      id: m.id,
      session_id: m.session_id,
      from_user_id: m.from_user_id,
      to_user_id: m.to_user_id,
      content: m.content,
      created_at: m.created_at,
      type: m.to_user_id ? 'private' : 'group',
      sender_name: m.profiles?.full_name ?? 'Unknown',
    }));

    // Participant sees: all group + own private messages
    // Host sees: all group + all private sent to them
    const filtered = enriched.filter(m => {
      if (m.type === 'group') return true;
      if (role === 'host') return m.to_user_id === userId || m.from_user_id === userId;
      return m.from_user_id === userId || m.to_user_id === userId;
    });

    setMessages(filtered);
  }, [sessionId, userId, role]);

  // ── Helper to push a tile notification ────────────────────────────────────
  const pushTileNotification = useCallback(
    (fromUserId: string, emoji: string, label: string) => {
      const notif: TileNotification = {
        id: `${fromUserId}-${Date.now()}`,
        userId: fromUserId,
        emoji,
        label,
        expiresAt: Date.now() + 5000, // visible for 5 seconds
      };
      setTileNotifications(prev => [...prev.filter(n => n.userId !== fromUserId), notif]);
    },
    []
  );

  // ── Supabase Realtime subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !userId) return;

    // Postgres change subscription for persisted messages
    const msgSub = supabase
      .channel(`messages-db-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          const row = payload.new as any;
          // Fetch sender name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', row.from_user_id)
            .single();

          const newMsg: EnrichedMessage = {
            id: row.id,
            session_id: row.session_id,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
            content: row.content,
            created_at: row.created_at,
            type: row.to_user_id ? 'private' : 'group',
            sender_name: (profile as any)?.full_name ?? 'Unknown',
          };

          // Visibility filter
          const visible =
            newMsg.type === 'group' ||
            (role === 'host' && (newMsg.to_user_id === userId || newMsg.from_user_id === userId)) ||
            (role === 'participant' && (newMsg.from_user_id === userId || newMsg.to_user_id === userId));

          if (!visible) return;

          setMessages(prev => [...prev, newMsg]);

          // Host: when a private message arrives from a participant → tile bubble
          if (role === 'host' && newMsg.type === 'private' && newMsg.from_user_id !== userId) {
            pushTileNotification(newMsg.from_user_id, '💬', newMsg.sender_name ?? '');
          }
        }
      )
      .subscribe();

    // Broadcast channel for ephemeral reactions (raise hand, emoji)
    const bcastChannel = supabase.channel(`reactions-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = bcastChannel;

    bcastChannel
      .on('broadcast', { event: 'tile-reaction' }, ({ payload }) => {
        const p = payload as ReactionPayload;
        if (role === 'host') {
          pushTileNotification(p.from, p.emoji, p.label);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(bcastChannel);
    };
  }, [sessionId, userId, role, pushTileNotification]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, type: MessageType) => {
      if (!content.trim()) return;
      await supabase.from('messages').insert({
        session_id: sessionId,
        from_user_id: userId,
        to_user_id: type === 'private' ? hostId : null,
        content: content.trim(),
      });
    },
    [sessionId, userId, hostId]
  );

  // ── Send an ephemeral reaction (raise hand, emoji) ─────────────────────────
  const sendReaction = useCallback(
    (emoji: string, label: string) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'tile-reaction',
        payload: {
          type: 'tile-reaction',
          from: userId,
          from_name: myName,
          emoji,
          label,
        } satisfies ReactionPayload,
      });
      // Participant also sees their own reaction locally (loopback)
      // nothing needed on their side, just host sees the tile bubble
    },
    [userId, myName]
  );

  return {
    messages,
    tileNotifications,
    sendMessage,
    sendReaction,
    refetch: fetchMessages,
  };
}
