import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Clock, Monitor } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';

export default function ParticipantDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [focused, setFocused] = useState(false);

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
      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto max-w-2xl px-4 py-6">
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Participant Hub
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Welcome, <span className="text-foreground font-medium">{profile?.full_name}</span>
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-2xl px-4 py-12">
          {/* Join card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-8 text-center overflow-hidden mb-8"
          >
            {/* Glow orb */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(ellipse, hsl(217 91% 60% / 0.12) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Monitor className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Join a Session
              </h2>
              <p className="text-muted-foreground mb-8">Enter the 6-character code from your instructor</p>

              {/* Code input — styled per-character style */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <AnimatePresence>
                    {focused && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute -inset-1 rounded-2xl border border-primary/50 pointer-events-none shadow-[0_0_20px_hsl(217_91%_60%/0.2)]"
                      />
                    )}
                  </AnimatePresence>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={e => e.key === 'Enter' && joinSession()}
                    placeholder="ABC123"
                    maxLength={6}
                    className="relative w-56 h-16 bg-secondary/60 border border-border/60 rounded-xl text-center font-mono text-3xl font-bold tracking-[0.4em] text-foreground placeholder:text-muted-foreground/40 outline-none transition-all duration-200"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Character indicators */}
              <div className="flex justify-center gap-1.5 mb-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor: i < code.length ? 'hsl(217 91% 60%)' : 'hsl(210 40% 20%)',
                      scale: i === code.length - 1 ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="h-1.5 w-6 rounded-full"
                  />
                ))}
              </div>

              <motion.button
                onClick={joinSession}
                disabled={code.length !== 6 || joining}
                whileHover={{ scale: code.length === 6 && !joining ? 1.04 : 1 }}
                whileTap={{ scale: code.length === 6 && !joining ? 0.97 : 1 }}
                className="relative group overflow-hidden flex items-center justify-center gap-2 mx-auto w-full max-w-xs h-12 rounded-xl font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                {joining ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>Join Session <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Sessions
              </h2>
              <div className="space-y-2">
                {recentSessions.map((sp: any, i) => (
                  <motion.div
                    key={sp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-4 hover:border-primary/30 transition-all duration-200 group"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{sp.sessions?.name || 'Session'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(sp.joined_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      {sp.sessions?.code}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
