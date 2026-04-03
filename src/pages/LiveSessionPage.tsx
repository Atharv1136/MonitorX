import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, HelpCircle, MessageSquare, AlertTriangle, CheckCircle,
  ArrowLeft, Users, Wifi, Monitor, MonitorOff, Maximize2, X,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useMessages } from '@/hooks/useMessages';
import ScreenTile from '@/components/session/ScreenTile';
import type { Session, SessionParticipant, Message, HelpRequest, Profile } from '@/types';
import logo from '@/assets/logo.png';

// ─── Fullscreen overlay for expanded participant ──────────────────────────────
function FullscreenModal({
  stream,
  name,
  onClose,
}: {
  stream: MediaStream;
  name: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col"
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border/40 bg-card/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-breathe inline-block" />
          <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {name} — Live Screen
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>
      {/* Video */}
      <div className="flex-1 flex items-center justify-center p-4 bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
        />
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<(SessionParticipant & { profiles: Profile })[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [msgType, setMsgType] = useState<'group' | 'private'>('group');
  const [activeTab, setActiveTab] = useState<'chat' | 'help'>('chat');
  const [fullscreenParticipant, setFullscreenParticipant] = useState<{
    userId: string;
    name: string;
    stream: MediaStream;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHost = profile?.role === 'host';

  // ── WebRTC screen share ────────────────────────────────────────────────────
  const {
    streams,          // host: Map<userId, MediaStream>
    localStream,      // participant: own preview
    isSharing,
    shareError,
    startSharing,
    stopSharing,
  } = useScreenShare(id ?? '', user?.id ?? '', isHost ? 'host' : 'participant');

  // ── Messaging & Notifications ──────────────────────────────────────────────
  const { messages, tileNotifications, sendMessage: sendMsg, sendReaction } = useMessages(
    id ?? '',
    user?.id ?? '',
    session?.host_id ?? '',
    isHost ? 'host' : 'participant',
    profile?.full_name ?? 'User'
  );

  // ── Show share error toast ────────────────────────────────────────────────
  useEffect(() => {
    if (shareError) {
      toast({ title: 'Screen share error', description: shareError, variant: 'destructive' });
    }
  }, [shareError, toast]);

  // ── Data fetching + Realtime subscriptions ────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;
    fetchSession();
    fetchParticipants();
    fetchHelpRequests();

    const participantsSub = supabase
      .channel(`participants-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'session_participants',
        filter: `session_id=eq.${id}`,
      }, () => fetchParticipants())
      .subscribe();

    const helpSub = supabase
      .channel(`help-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'help_requests',
        filter: `session_id=eq.${id}`,
      }, () => fetchHelpRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(participantsSub);
      supabase.removeChannel(helpSub);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSession      = async () => { const { data } = await supabase.from('sessions').select('*').eq('id', id!).single(); if (data) setSession(data as unknown as Session); };
  const fetchParticipants = async () => { const { data } = await supabase.from('session_participants').select('*, profiles(*)').eq('session_id', id!).is('left_at', null); if (data) setParticipants(data as any); };
  const fetchHelpRequests = async () => { const { data } = await supabase.from('help_requests').select('*, profiles(*)').eq('session_id', id!).eq('status', 'pending').order('requested_at', { ascending: true }); if (data) setHelpRequests(data as any); };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await sendMsg(newMessage, msgType);
    setNewMessage('');
  };

  const requestHelp = async () => {
    await supabase.from('help_requests').insert({ session_id: id!, user_id: user!.id });
    toast({ title: '✋ Help requested', description: 'Your instructor has been notified.' });
  };

  const resolveHelp = async (helpId: string) => {
    await supabase.from('help_requests').update({ status: 'resolved' as const, resolved_at: new Date().toISOString() }).eq('id', helpId);
  };

  const endSession = async () => {
    await supabase.from('sessions').update({ status: 'ended' as const, ended_at: new Date().toISOString() }).eq('id', id!);
    navigate('/dashboard');
  };

  const pendingHelp = helpRequests.filter(h => h.status === 'pending');
  const activeStreams = streams.size;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="h-10 w-10 border-2 border-border border-t-primary rounded-full mx-auto mb-3"
          />
          <p className="text-muted-foreground text-sm">Loading session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate(isHost ? '/dashboard' : '/participant')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>

          <div className="flex items-center gap-4 border-r border-border/50 pr-4 mr-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="MonitorX" className="h-7 w-7 object-contain drop-shadow-[0_0_8px_hsl(217_91%_60%/0.3)] block" />
              <span className="text-lg font-bold text-foreground hidden sm:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Monitor<span className="text-gradient">X</span>
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {session.name}
              </h1>
              <span className="flex items-center gap-1 text-xs bg-success/15 text-success px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-breathe inline-block" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono font-bold text-primary">{session.code}</span>
              <span>·</span>
              <Users className="h-3 w-3" />
              <span>{participants.length} joined</span>
              {isHost && activeStreams > 0 && (
                <>
                  <span>·</span>
                  <Monitor className="h-3 w-3 text-success" />
                  <span className="text-success">{activeStreams} sharing</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground border border-border/40 rounded-lg px-2.5 py-1">
            <Wifi className="h-3 w-3 text-success" /> Real-time
          </div>

          {/* Participant: Share Screen button */}
          {!isHost && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={isSharing ? stopSharing : startSharing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSharing
                  ? 'border border-destructive/40 text-destructive hover:bg-destructive/10'
                  : 'text-white'
              }`}
              style={!isSharing ? { background: 'var(--gradient-primary)' } : {}}
            >
              {isSharing
                ? <><MonitorOff className="h-3.5 w-3.5" /> Stop Sharing</>
                : <><Monitor className="h-3.5 w-3.5" /> Share Screen</>
              }
            </motion.button>
          )}

          {/* Participant: Request Help */}
          {!isHost && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={requestHelp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-warning/40 text-warning hover:bg-warning/10 transition-all"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Help
            </motion.button>
          )}

          {/* Host: End session */}
          {isHost && (
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={endSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-destructive/40 text-destructive hover:bg-destructive/10 transition-all"
            >
              End Session
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Main area ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto p-3">

          {/* HOST VIEW: participant grid */}
          {isHost && (
            <>
              {participants.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-muted-foreground font-medium">Waiting for participants…</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      Share code <span className="text-primary font-mono font-bold">{session.code}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  <AnimatePresence>
                    {participants.map((p, i) => {
                      const hasHelp = pendingHelp.some(h => h.user_id === p.user_id);
                      const liveStream = streams.get(p.user_id);
                      return (
                        <ScreenTile
                          key={p.id}
                          index={i}
                          stream={liveStream}
                          name={p.profiles?.full_name || 'Participant'}
                          initials={(p.profiles?.full_name?.[0] ?? '?').toUpperCase()}
                          hasHelp={hasHelp}
                          streamActive={p.stream_active}
                          notification={tileNotifications.find(n => n.userId === p.user_id)}
                          onFullscreen={() => {
                            if (liveStream) {
                              setFullscreenParticipant({
                                userId: p.user_id,
                                name: p.profiles?.full_name || 'Participant',
                                stream: liveStream,
                              });
                            }
                          }}
                        />
                      );
                    })}
                  </AnimatePresence>

                  {/* Ghost empty tiles to maintain grid rhythm */}
                  {Array.from({
                    length: Math.min(6, Math.max(0, (session.max_participants || 20) - participants.length)),
                  }).map((_, i) => (
                    <div
                      key={`ghost-${i}`}
                      className="aspect-video rounded-xl border border-dashed border-border/25 bg-background/20"
                      style={{ opacity: Math.max(0.1, 0.35 - i * 0.06) }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* PARTICIPANT VIEW */}
          {!isHost && (
            <div className="h-full flex flex-col items-center justify-center gap-6">

              {/* Own screen preview (if sharing) */}
              {isSharing && localStream ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-2xl"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/50 shadow-[0_0_30px_hsl(217_91%_60%/0.25)]">
                    <ParticipantPreviewVideo stream={localStream} />
                    <div className="absolute inset-0 scan-line opacity-10 pointer-events-none" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-background/70 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-breathe inline-block" />
                      Broadcasting your screen…
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Your instructor can see this in real-time
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5"
                  >
                    <Monitor className="h-10 w-10 text-primary/60" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Ready to share?
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                    Click <strong>Share Screen</strong> in the top bar so your instructor can monitor your progress.
                  </p>
                  <motion.button
                    onClick={startSharing}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-white"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Monitor className="h-4 w-4" /> Share Screen
                  </motion.button>
                </motion.div>
              )}

              {/* Connection status */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/40 rounded-lg px-3 py-1.5 mt-2">
                <span className={`h-1.5 w-1.5 rounded-full inline-block ${isSharing ? 'bg-success animate-breathe' : 'bg-muted-foreground/40'}`} />
                {isSharing ? 'Connected to instructor' : 'Session joined — not sharing yet'}
              </div>
            </div>
          )}
        </div>

        {/* ── Side Panel (chat + help) ───────────────────────────────────── */}
        <div className="w-72 xl:w-80 border-l border-border/50 bg-card/60 backdrop-blur-sm flex-col shrink-0 hidden md:flex">

          {/* Tabs */}
          <div className="flex border-b border-border/40">
            {[
              { key: 'chat', label: 'Chat', icon: MessageSquare, badge: 0 },
              { key: 'help', label: 'Help', icon: AlertTriangle, badge: pendingHelp.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 p-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 relative ${
                  activeTab === tab.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="bg-warning text-warning-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="tabLine"
                    className="absolute bottom-0 left-2 right-2 h-px rounded-full"
                    style={{ background: 'var(--gradient-primary)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-auto p-3 space-y-2.5">
                <AnimatePresence initial={false}>
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No messages yet</p>
                    </div>
                  ) : messages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${msg.from_user_id === user!.id ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <span className="text-[10px] font-bold">{msg.from_user_id === user!.id ? 'You' : msg.sender_name}</span>
                        {msg.type === 'private' && (
                          <span className="bg-primary/20 text-primary text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Private</span>
                        )}
                      </div>
                      <div
                        className={`rounded-xl px-3 py-2 max-w-[85%] text-sm ${
                          msg.from_user_id === user!.id ? 'text-white' : 'bg-secondary text-foreground'
                        }`}
                        style={msg.from_user_id === user!.id ? { background: 'var(--gradient-primary)' } : {}}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-center gap-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-border/40 flex flex-col gap-2">
                {!isHost && (
                  <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
                    <button
                      onClick={() => setMsgType('group')}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all ${msgType === 'group' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                    >
                      Group
                    </button>
                    <button
                      onClick={() => setMsgType('private')}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-all ${msgType === 'private' ? 'bg-primary/20 text-primary shadow-sm' : 'text-muted-foreground'}`}
                    >
                      Host Only
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    placeholder={msgType === 'private' ? "Type private message…" : "Type a message…"}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 h-9 px-3 text-sm bg-secondary/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                  <motion.button
                    onClick={handleSendMessage}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    disabled={!newMessage.trim()}
                    className="h-9 w-9 rounded-lg text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            </>
          )}

          {/* Help tab */}
          {activeTab === 'help' && (
            <div className="flex-1 overflow-auto p-3 space-y-2.5">
              {pendingHelp.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-success/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No pending help requests</p>
                </div>
              ) : (
                <AnimatePresence>
                  {pendingHelp.map(h => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="rounded-xl border border-warning/30 bg-warning/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{(h as any).profiles?.full_name || 'Participant'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(h.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {isHost && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => resolveHelp(h.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success/15 text-success hover:bg-success/25 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" /> Resolve
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreenParticipant && (
          <FullscreenModal
            stream={fullscreenParticipant.stream}
            name={fullscreenParticipant.name}
            onClose={() => setFullscreenParticipant(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Small helper: mounts local preview video ────────────────────────────────
function ParticipantPreviewVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-contain bg-black"
    />
  );
}
