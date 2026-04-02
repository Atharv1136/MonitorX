import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Clock, HelpCircle, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/shared/Navbar';
import type { Session } from '@/types';

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
      toast({ title: 'Session created!', description: `Code: ${code}` });
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
      <div className="pt-14">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Host Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
            </div>
            <Button variant="hero" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Session
            </Button>
          </div>

          {/* Create Session Modal */}
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="rounded-xl border border-border bg-card p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-foreground mb-4">Create New Session</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Session Name</Label>
                    <Input placeholder="React Training Lab" value={sessionName} onChange={e => setSessionName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Max Participants</Label>
                    <Input type="number" min={2} max={500} value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="hero" className="flex-1" onClick={createSession} disabled={creating}>
                      {creating ? 'Creating...' : 'Create'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Sessions */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-4">Active Sessions</h2>
            {activeSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active sessions. Start one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSessions.map(session => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{session.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === 'active' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <p className="font-mono text-lg text-primary mb-3">{session.code}</p>
                    <p className="text-sm text-muted-foreground mb-4">Max: {session.max_participants} participants</p>
                    <div className="flex gap-2">
                      {session.status === 'waiting' ? (
                        <Button variant="success" size="sm" onClick={() => startSession(session.id)}>Start</Button>
                      ) : (
                        <Button variant="hero" size="sm" onClick={() => navigate(`/session/${session.id}`)}>
                          <Eye className="h-3 w-3 mr-1" /> Monitor
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => endSession(session.id)}>End</Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Stats */}
          <section className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Monitor, label: 'Total Sessions', value: sessions.length },
                { icon: Users, label: 'Active Now', value: activeSessions.length },
                { icon: Clock, label: 'Past Sessions', value: pastSessions.length },
                { icon: HelpCircle, label: 'Help Resolved', value: '—' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                  <stat.icon className="h-5 w-5 text-primary mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Past Sessions</h2>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-3 text-muted-foreground font-medium">Session</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Code</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessions.map(s => (
                      <tr key={s.id} className="border-t border-border">
                        <td className="p-3 text-foreground">{s.name}</td>
                        <td className="p-3 font-mono text-primary">{s.code}</td>
                        <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => deleteSession(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Monitor(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>;
}
