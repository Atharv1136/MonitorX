import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, HelpCircle, X, MessageSquare, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Session, SessionParticipant, Message, HelpRequest, Profile } from '@/types';

export default function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<(SessionParticipant & { profiles: Profile })[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'help'>('chat');
  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  const isHost = profile?.role === 'host';

  useEffect(() => {
    if (!id || !user) return;
    fetchSession();
    fetchParticipants();
    fetchMessages();
    fetchHelpRequests();

    // Real-time subscriptions
    const participantsSub = supabase
      .channel('participants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_participants', filter: `session_id=eq.${id}` }, () => fetchParticipants())
      .subscribe();

    const messagesSub = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${id}` }, () => fetchMessages())
      .subscribe();

    const helpSub = supabase
      .channel('help')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests', filter: `session_id=eq.${id}` }, () => fetchHelpRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(participantsSub);
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(helpSub);
    };
  }, [id, user]);

  const fetchSession = async () => {
    const { data } = await supabase.from('sessions').select('*').eq('id', id!).single();
    if (data) setSession(data as unknown as Session);
  };

  const fetchParticipants = async () => {
    const { data } = await supabase
      .from('session_participants')
      .select('*, profiles(*)')
      .eq('session_id', id!)
      .is('left_at', null);
    if (data) setParticipants(data as any);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id!)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as unknown as Message[]);
  };

  const fetchHelpRequests = async () => {
    const { data } = await supabase
      .from('help_requests')
      .select('*, profiles(*)')
      .eq('session_id', id!)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true });
    if (data) setHelpRequests(data as any);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase.from('messages').insert({
      session_id: id!,
      from_user_id: user!.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const requestHelp = async () => {
    await supabase.from('help_requests').insert({
      session_id: id!,
      user_id: user!.id,
    });
    toast({ title: 'Help requested', description: 'Your instructor has been notified.' });
  };

  const resolveHelp = async (helpId: string) => {
    await supabase.from('help_requests').update({ status: 'resolved' as const, resolved_at: new Date().toISOString() }).eq('id', helpId);
  };

  const endSession = async () => {
    await supabase.from('sessions').update({ status: 'ended' as const, ended_at: new Date().toISOString() }).eq('id', id!);
    navigate('/dashboard');
  };

  const pendingHelp = helpRequests.filter(h => h.status === 'pending');

  if (!session) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(isHost ? '/dashboard' : '/participant')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{session.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-primary">{session.code}</span>
              <span>•</span>
              <span>{participants.length} participants</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isHost && (
            <Button variant="outline" size="sm" className="border-warning text-warning hover:bg-warning/10" onClick={requestHelp}>
              <HelpCircle className="h-4 w-4 mr-1" /> Request Help
            </Button>
          )}
          {isHost && (
            <Button variant="destructive" size="sm" onClick={endSession}>End Session</Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Grid View */}
        <div className="flex-1 p-4 overflow-auto">
          {isHost ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {participants.map((p, i) => {
                const hasHelp = pendingHelp.some(h => h.user_id === p.user_id);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedTile(selectedTile === p.user_id ? null : p.user_id)}
                    className={`relative aspect-video rounded-lg border cursor-pointer transition-all overflow-hidden ${
                      hasHelp
                        ? 'border-warning animate-pulse-ring'
                        : selectedTile === p.user_id
                        ? 'border-accent glow-cyan'
                        : 'border-border hover:border-primary/50'
                    } bg-secondary`}
                  >
                    {/* Placeholder for video stream */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-foreground">
                        {p.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    </div>

                    {/* Status dot */}
                    <div className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full ${
                      hasHelp ? 'bg-warning animate-breathe' : p.stream_active ? 'bg-success animate-breathe' : 'bg-muted-foreground'
                    }`} />

                    {/* Name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-background/70 px-2 py-1">
                      <p className="text-xs text-foreground truncate">{p.profiles?.full_name || 'Unknown'}</p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, (session.max_participants || 20) - participants.length) }).slice(0, 8).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-video rounded-lg border border-dashed border-border-subtle bg-background/50" />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">You're connected</h2>
                <p className="text-muted-foreground mb-1">Session: {session.name}</p>
                <p className="text-sm text-muted-foreground">Your instructor can see your screen.</p>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-border bg-card flex flex-col shrink-0 hidden md:flex">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 p-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`flex-1 p-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'help' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              <AlertTriangle className="h-4 w-4" /> Help
              {pendingHelp.length > 0 && (
                <span className="bg-warning text-warning-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingHelp.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.from_user_id === user!.id ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                      msg.from_user_id === user!.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  className="bg-secondary"
                />
                <Button variant="hero" size="icon" onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {pendingHelp.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center mt-8">No pending help requests</p>
              ) : (
                pendingHelp.map(h => (
                  <div key={h.id} className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{(h as any).profiles?.full_name || 'Participant'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isHost && (
                        <Button variant="success" size="sm" onClick={() => resolveHelp(h.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
