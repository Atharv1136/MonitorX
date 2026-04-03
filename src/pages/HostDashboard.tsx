import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Clock, HelpCircle, Trash2, Eye, X, Monitor, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/shared/Navbar';
import type { Session } from '@/types';

function StatCard({ icon: Icon, label, value, delay = 0, color = 'primary' }: any) {
  const colorMap: any = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-cyan-500/10',
    warning: 'text-warning bg-warning/10',
    success: 'text-success bg-success/10',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 overflow-hidden hover:border-primary/30 transition-all duration-300 card-hover"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`h-10 w-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function HostDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('host_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setSessions(data as unknown as Session[]);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const createSession = async () => {
    if (!sessionName.trim()) return;
    setCreating(true);
    const code = generateCode();
    const { data, error } = await supabase.from('sessions').insert({
      host_id: user!.id,
      name: sessionName,
      code,
      max_participants: maxParticipants,
      status: 'waiting' as const,
    }).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🎉 Session created!', description: `Join code: ${code}` });
      setShowCreate(false);
      setSessionName('');
      fetchSessions();
    }
    setCreating(false);
  };

  const startSession = async (id: string) => {
    await supabase.from('sessions').update({ status: 'active' as const, started_at: new Date().toISOString() }).eq('id', id);
    navigate(`/session/${id}`);
  };

  const endSession = async (id: string) => {
    await supabase.from('sessions').update({ status: 'ended' as const, ended_at: new Date().toISOString() }).eq('id', id);
    fetchSessions();
  };

  const deleteSession = async (id: string) => {
    await supabase.from('sessions').delete().eq('id', id);
    fetchSessions();
  };

  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'waiting');
  const pastSessions = sessions.filter(s => s.status === 'ended');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Host Dashboard
                </h1>
                <p className="text-muted-foreground mt-0.5">
                  Welcome back, <span className="text-foreground font-medium">{profile?.full_name}</span>
                </p>
              </div>
              <motion.button
                onClick={() => setShowCreate(true)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative group overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <Plus className="h-4 w-4" /> Create Session
              </motion.button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Monitor} label="Total Sessions" value={sessions.length} delay={0} color="primary" />
            <StatCard icon={Activity} label="Active Now" value={activeSessions.length} delay={0.1} color="success" />
            <StatCard icon={Clock} label="Past Sessions" value={pastSessions.length} delay={0.2} color="accent" />
            <StatCard icon={HelpCircle} label="Help Resolved" value="—" delay={0.3} color="warning" />
          </div>

          {/* Active Sessions */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Active Sessions</h2>
              {activeSessions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
                  {activeSessions.length} live
                </span>
              )}
            </div>
            {activeSessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-border/60 p-16 text-center"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                  <MonitorIcon className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-muted-foreground font-medium">No active sessions</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Create one to start monitoring</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {activeSessions.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.08 }}
                      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 hover:border-primary/30 transition-all duration-300 overflow-hidden card-hover"
                    >
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-foreground pr-2 truncate">{session.name}</h3>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${
                          session.status === 'active'
                            ? 'bg-success/15 text-success'
                            : 'bg-warning/15 text-warning'
                        }`}>
                          {session.status === 'active' ? (
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-success animate-breathe inline-block" />
                              Live
                            </span>
                          ) : 'Waiting'}
                        </span>
                      </div>
                      <p className="font-mono text-2xl font-bold text-primary tracking-widest mb-1">{session.code}</p>
                      <p className="text-xs text-muted-foreground mb-4">Max {session.max_participants} participants</p>
                      <div className="flex gap-2">
                        {session.status === 'waiting' ? (
                          <Button
                            size="sm"
                            onClick={() => startSession(session.id)}
                            className="flex-1 text-xs"
                            style={{ background: 'var(--gradient-primary)', color: 'white' }}
                          >
                            <Zap className="h-3 w-3 mr-1" /> Start Session
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="flex-1 text-xs border-primary/40 text-primary hover:bg-primary/10"
                          >
                            <Eye className="h-3 w-3 mr-1" /> Monitor
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => endSession(session.id)}
                          className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          End
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-foreground mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Past Sessions</h2>
              <div className="rounded-2xl border border-border/50 overflow-hidden bg-card/40 backdrop-blur-sm">
                <div className="grid grid-cols-4 py-3 px-4 bg-secondary/40 border-b border-border/40">
                  {['Session', 'Code', 'Date', ''].map(h => (
                    <span key={h} className="text-xs font-medium text-muted-foreground">{h}</span>
                  ))}
                </div>
                {pastSessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-4 items-center py-3 px-4 border-b border-border/30 last:border-0 hover:bg-secondary/20 transition-colors"
                  >
                    <span className="text-sm text-foreground font-medium truncate pr-2">{s.name}</span>
                    <span className="font-mono text-sm text-primary">{s.code}</span>
                    <span className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl p-7 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    New Session
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Configure your monitoring session</p>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="sName">Session Name</Label>
                  <Input
                    id="sName"
                    placeholder="e.g. React Training Lab"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    className="h-11 bg-secondary/40 border-border/60"
                    onKeyDown={e => e.key === 'Enter' && createSession()}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxP">Max Participants <span className="text-muted-foreground font-normal">(2–500)</span></Label>
                  <Input
                    id="maxP"
                    type="number"
                    min={2}
                    max={500}
                    value={maxParticipants}
                    onChange={e => setMaxParticipants(Number(e.target.value))}
                    className="h-11 bg-secondary/40 border-border/60"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <motion.button
                    onClick={createSession}
                    disabled={creating || !sessionName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 h-11 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--gradient-primary)' }}
                  >
                    {creating ? 'Creating...' : '🚀 Create Session'}
                  </motion.button>
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="border-border/60">
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MonitorIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
