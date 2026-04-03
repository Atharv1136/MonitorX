import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight, Monitor, Shield, Zap } from 'lucide-react';
import logo from '@/assets/logo.png';

const brandStats = [
  { icon: Monitor, value: '10K+', label: 'Sessions hosted' },
  { icon: Shield, value: '99.9%', label: 'Uptime' },
  { icon: Zap, value: '<10ms', label: 'Latency' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 aurora-bg" />
        <div className="absolute inset-0 scan-line opacity-30 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(hsl(214 32% 91%) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Floating tiles */}
        {[
          { x: 10, y: 20, w: 120, h: 72, delay: 0.5 },
          { x: 65, y: 10, w: 96, h: 60, delay: 1.0 },
          { x: 5, y: 60, w: 80, h: 52, delay: 0.8 },
          { x: 70, y: 55, w: 110, h: 68, delay: 1.3 },
          { x: 35, y: 75, w: 88, h: 56, delay: 0.6 },
        ].map((tile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.4, y: 0 }}
            transition={{ delay: tile.delay, duration: 1 }}
            style={{
              position: 'absolute',
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: tile.w,
              height: tile.h,
              animationDelay: `${tile.delay}s`,
            }}
            className="rounded-xl glass border border-primary/20 animate-float overflow-hidden"
          >
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-success animate-breathe" />
            <div className="grid grid-cols-3 gap-0.5 p-2 h-full opacity-40">
              {Array.from({ length: 9 }).map((_, j) => (
                <div key={j} className="rounded-sm bg-primary/30" />
              ))}
            </div>
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ background: 'radial-gradient(ellipse, hsl(217 91% 60% / 0.4) 0%, transparent 70%)' }}
              />
              <img src={logo} alt="MonitorX" className="relative h-20 w-20 object-contain drop-shadow-[0_0_24px_hsl(217_91%_60%/0.5)]" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Monitor<span className="text-gradient">X</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-muted-foreground max-w-xs mb-12 leading-relaxed"
          >
            Real-time classroom monitoring for modern training environments
          </motion.p>

          <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
            {brandStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
                className="glass rounded-xl p-4 text-center"
              >
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <img src={logo} alt="MonitorX" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Monitor<span className="text-gradient">X</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Welcome back
            </h1>
            <p className="text-muted-foreground">Sign in to your MonitorX account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 bg-card/60 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 bg-card/60 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="relative w-full h-11 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </span>
            </motion.button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
