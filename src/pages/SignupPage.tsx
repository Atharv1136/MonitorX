import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight, GraduationCap, User } from 'lucide-react';
import logo from '@/assets/logo.png';

const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = [
  'bg-destructive',
  'bg-warning',
  'bg-amber-400',
  'bg-success',
];

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'host' | 'participant'>('participant');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, fullName, role);
      toast({ title: 'Account created!', description: 'Please check your email to confirm.' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg" />
        <div className="absolute inset-0 scan-line opacity-30 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(hsl(214 32% 91%) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {[
          { x: 12, y: 15, w: 100, h: 64, delay: 0.4 },
          { x: 68, y: 8, w: 88, h: 56, delay: 0.9 },
          { x: 8, y: 55, w: 76, h: 48, delay: 0.7 },
          { x: 72, y: 60, w: 104, h: 66, delay: 1.2 },
          { x: 40, y: 78, w: 92, h: 58, delay: 0.5 },
        ].map((tile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.35, y: 0 }}
            transition={{ delay: tile.delay, duration: 1 }}
            style={{
              position: 'absolute',
              left: `${tile.x}%`,
              top: `${tile.y}%`,
              width: tile.w,
              height: tile.h,
              animationDelay: `${tile.delay}s`,
            }}
            className="rounded-xl glass border border-accent/20 animate-float-delayed overflow-hidden"
          >
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent animate-breathe" />
            <div className="grid grid-cols-3 gap-0.5 p-2 h-full opacity-40">
              {Array.from({ length: 9 }).map((_, j) => (
                <div key={j} className="rounded-sm bg-accent/30" />
              ))}
            </div>
          </motion.div>
        ))}

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
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ background: 'radial-gradient(ellipse, hsl(187 82% 53% / 0.4) 0%, transparent 70%)' }}
              />
              <img src={logo} alt="MonitorX" className="relative h-20 w-20 object-contain drop-shadow-[0_0_24px_hsl(187_82%_53%/0.5)]" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Join <span className="text-gradient">MonitorX</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-muted-foreground max-w-xs leading-relaxed"
          >
            The most powerful real-time monitoring platform for educators and learners
          </motion.p>
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
              Create account
            </h1>
            <p className="text-muted-foreground">Start monitoring in minutes — it's free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground/80">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="h-11 bg-card/60 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 bg-card/60 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 bg-card/60 border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < strength ? strengthColors[strength - 1] : 'bg-muted'}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i < strength ? 1 : 0.3 }}
                        transition={{ duration: 0.2, delay: i * 0.05 }}
                        style={{ transformOrigin: 'left' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength: <span className={strength > 0 ? 'text-foreground font-medium' : ''}>{strengthLabels[strength - 1] || 'Too short'}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground/80">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'host' as const, label: 'Instructor', sublabel: 'Create & monitor sessions', icon: GraduationCap, color: 'border-primary bg-primary/10 text-primary' },
                  { value: 'participant' as const, label: 'Learner', sublabel: 'Join & share screen', icon: User, color: 'border-success bg-success/10 text-success' },
                ].map(opt => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    whileTap={{ scale: 0.97 }}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                      role === opt.value
                        ? opt.color
                        : 'border-border/60 text-muted-foreground hover:border-border bg-card/40'
                    }`}
                  >
                    {role === opt.value && (
                      <motion.div
                        layoutId="roleIndicator"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: role === 'host' ? 'hsl(217 91% 60% / 0.05)' : 'hsl(160 64% 40% / 0.05)' }}
                      />
                    )}
                    <opt.icon className="h-5 w-5 mb-2" />
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{opt.sublabel}</p>
                  </motion.button>
                ))}
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
                    Creating account...
                  </>
                ) : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </span>
            </motion.button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
