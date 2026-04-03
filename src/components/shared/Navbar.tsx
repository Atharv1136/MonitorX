import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isLanding = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isLanding
          ? 'bg-background/90 shadow-[0_1px_0_hsl(210_40%_20%/0.4)] backdrop-blur-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {/* Glow behind logo */}
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{ background: 'radial-gradient(ellipse, hsl(217 91% 60% / 0.4) 0%, transparent 70%)', transform: 'scale(1.5)' }}
            />
            <img src={logo} alt="MonitorX" className="relative h-9 w-9 object-contain drop-shadow-[0_0_8px_hsl(217_91%_60%/0.3)] group-hover:drop-shadow-[0_0_16px_hsl(217_91%_60%/0.6)] transition-all duration-300" />
          </motion.div>
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Monitor<span className="text-gradient">X</span>
          </span>
        </Link>

        {/* Desktop nav links (landing only) */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-primary to-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
              </a>
            ))}
          </div>
        )}

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to={profile?.role === 'host' ? '/dashboard' : '/participant'}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary/60">
                  Dashboard
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary/60">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-1.5">
                    <span className="text-xs font-bold text-primary">
                      {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  {profile?.full_name}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-1.5" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary/60">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative group overflow-hidden px-5 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                  Get Started
                </motion.button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <motion.button
          className="md:hidden text-foreground p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-border/40 bg-background/95 backdrop-blur-2xl"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {isLanding && navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-border/40 pt-3 mt-3 space-y-2">
                {user ? (
                  <>
                    <Link to={profile?.role === 'host' ? '/dashboard' : '/participant'} onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full" style={{ background: 'var(--gradient-primary)' }}>Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
