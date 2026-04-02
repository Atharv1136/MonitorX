import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/shared/Navbar';

export default function ParticipantDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchRecent();
  }, [user]);

  const fetchRecent = async () => {
    const { data } = await supabase
      .from('session_participants')
      .select('*, sessions(*)')
      .eq('user_id', user!.id)
      .order('joined_at', { ascending: false })
      .limit(5);
    if (data) setRecentSessions(data);
  };

  const joinSession = async () => {
    if (code.length !== 6) return;
    setJoining(true);

    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .in('status', ['waiting', 'active'])
      .single();

    if (error || !session) {
      toast({ title: 'Session not found', description: 'Check the code and try again.', variant: 'destructive' });
      setJoining(false);
      return;
    }

    // Join as participant
    await supabase.from('session_participants').upsert({
      session_id: session.id,
      user_id: user!.id,
    });

    navigate(`/session/${session.id}`);
    setJoining(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-14">
        <div className="container mx-auto max-w-2xl px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-8 text-center"
          >
            <h1 className="text-2xl font-bold text-foreground mb-2">Enter Session Code</h1>
            <p className="text-muted-foreground mb-8">Ask your instructor for the 6-character code</p>

            <div className="flex justify-center mb-6">
              <Input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="text-center font-mono text-3xl tracking-[0.5em] w-64 h-16 bg-secondary border-border"
                maxLength={6}
              />
            </div>

            <Button
              variant="success"
              className="w-full max-w-xs h-12 text-base"
              onClick={joinSession}
              disabled={code.length !== 6 || joining}
            >
              {joining ? 'Joining...' : 'Join Session'}
            </Button>
          </motion.div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Sessions</h2>
              <div className="space-y-2">
                {recentSessions.map((sp: any) => (
                  <div key={sp.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{sp.sessions?.name || 'Session'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sp.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-mono text-sm text-primary">{sp.sessions?.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
