import { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Monitor, MessageSquare, HelpCircle, Users, ArrowRight, ChevronRight, Zap, Shield, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/shared/Navbar';
import logo from '@/assets/logo.png';

const features = [
  {
    icon: Monitor,
    title: 'Grid Monitoring',
    description: 'View up to 20 screens simultaneously in a configurable grid. Click any tile for instant fullscreen focus.',
    color: 'from-blue-500/20 to-blue-600/10',
    glow: 'group-hover:shadow-[0_0_30px_hsl(217_91%_60%/0.3)]',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Chat',
    description: 'Bi-directional chat between Host and each Participant. Message history persisted per session.',
    color: 'from-cyan-500/20 to-cyan-600/10',
    glow: 'group-hover:shadow-[0_0_30px_hsl(187_82%_53%/0.3)]',
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15',
  },
  {
    icon: HelpCircle,
    title: 'Help Requests',
    description: 'One-click help request from Participant triggers pulsing amber alert on Host grid tile.',
    color: 'from-amber-500/20 to-amber-600/10',
    glow: 'group-hover:shadow-[0_0_30px_hsl(38_92%_50%/0.3)]',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
  },
  {
    icon: Users,
    title: 'Scalable Sessions',
    description: 'From 10-seat classroom sessions to 500-participant enterprise deployments on the same infrastructure.',
    color: 'from-violet-500/20 to-violet-600/10',
    glow: 'group-hover:shadow-[0_0_30px_hsl(270_70%_55%/0.3)]',
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/15',
  },
];

const steps = [
  { num: 1, title: 'Create Session', desc: 'Host creates a training session and gets a unique 6-character join code.', icon: Zap },
  { num: 2, title: 'Participants Join', desc: 'Learners enter the code and share their screen with one click.', icon: Users },
  { num: 3, title: 'Monitor & Assist', desc: 'View all screens in real-time, chat, and resolve help requests instantly.', icon: Eye },
];

const marqueeItems = [
  '500+ Organizations', '10K+ Sessions', '99.9% Uptime', 'Real-Time Monitoring',
  'Zero Latency', 'Enterprise Ready', 'WebRTC Powered', 'Instant Help Alerts',
  '500+ Organizations', '10K+ Sessions', '99.9% Uptime', 'Real-Time Monitoring',
  'Zero Latency', 'Enterprise Ready', 'WebRTC Powered', 'Instant Help Alerts',
];

// Floating grid tile component
function FloatingTile({ delay = 0, x = 0, y = 0, size = 'normal' }: { delay?: number; x?: number; y?: number; size?: string }) {
  const sizeClass = size === 'large' ? 'w-32 h-20' : size === 'small' ? 'w-16 h-10' : 'w-24 h-14';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8 }}
      style={{ left: `${x}%`, top: `${y}%`, position: 'absolute', animationDelay: `${delay}s` }}
      className={`${sizeClass} rounded-lg glass border border-primary/20 overflow-hidden animate-float`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-success animate-breathe" style={{ animationDelay: `${delay * 0.3}s` }} />
      <div className="grid grid-cols-3 gap-0.5 p-1.5 h-full opacity-30">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-sm bg-primary/20" />
        ))}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [logoRevealDone, setLogoRevealDone] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoRevealDone(true), 1200);
    const t2 = setTimeout(() => setShowContent(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Aurora background */}
        <div className="absolute inset-0 aurora-bg" />

        {/* Scan line overlay */}
        <div className="absolute inset-0 scan-line pointer-events-none opacity-40" />

        {/* Animated mesh orbs */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(ellipse, hsl(217 91% 60% / 0.12) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 0.9, 1], x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(ellipse, hsl(187 82% 53% / 0.10) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], y: [0, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(ellipse, hsl(270 70% 55% / 0.07) 0%, transparent 70%)' }}
        />

        {/* Floating background tiles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingTile delay={1.5} x={5} y={15} size="large" />
          <FloatingTile delay={2} x={88} y={10} size="normal" />
          <FloatingTile delay={2.5} x={3} y={65} size="small" />
          <FloatingTile delay={1.8} x={85} y={60} size="large" />
          <FloatingTile delay={3} x={50} y={5} size="small" />
          <FloatingTile delay={2.2} x={70} y={80} size="normal" />
        </div>

        {/* Grid dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(hsl(214 32% 91%) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* HERO CONTENT */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center max-w-4xl mx-auto px-4">


          {/* LOGO REVEAL — stamp/badge style */}
          <motion.div
            className="flex items-center justify-center mb-10"
            initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>

              {/* ── Glow bloom behind everything ── */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.6, 0.15], scale: [0.6, 1.6, 1.1] }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
                style={{ background: 'radial-gradient(ellipse, hsl(217 91% 60% / 0.45) 0%, hsl(187 82% 53% / 0.2) 50%, transparent 75%)' }}
              />

              {/* ── Outermost dashed ring (slowly spins) ── */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px dashed hsl(217 91% 60% / 0.35)',
                  borderRadius: '9999px',
                }}
              />

              {/* ── Pulse ring (entrance only) ── */}
              <motion.div
                className="absolute rounded-full border border-primary/30"
                style={{ inset: 10 }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: [0, 1, 0], scale: [0.7, 1.3, 1.6] }}
                transition={{ duration: 1.6, delay: 0.4, ease: 'easeOut' }}
              />

              {/* ── Solid glowing inner ring ── */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: 18,
                  border: '2.5px solid hsl(217 91% 60% / 0.9)',
                  borderRadius: '9999px',
                  boxShadow: '0 0 18px hsl(217 91% 60% / 0.6), 0 0 40px hsl(217 91% 60% / 0.25), inset 0 0 14px hsl(217 91% 60% / 0.1)',
                }}
              />

              {/* ── SVG for curved text ── */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 260 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <path id="topArc"    d="M 40,130 A 90,90 0 0,1 220,130" />
                  <path id="bottomArc" d="M 55,148 A 90,90 0 0,0 205,148" />
                </defs>
                {/* Top curved label */}
                <text fontSize="13" fontWeight="700" fill="hsl(217 91% 75%)" letterSpacing="4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                  <textPath href="#topArc" startOffset="50%" textAnchor="middle">MONITOR X</textPath>
                </text>
                {/* Bottom curved label */}
                <text fontSize="9.5" fontWeight="500" fill="hsl(217 91% 60% / 0.65)" letterSpacing="3"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
                  <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">REAL · TIME · MONITORING</textPath>
                </text>
                {/* Dot separators on inner ring (like the stamp reference) */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                  const r = 91;
                  const rad = (angle * Math.PI) / 180;
                  const cx = 130 + r * Math.cos(rad);
                  const cy = 130 + r * Math.sin(rad);
                  return <circle key={angle} cx={cx} cy={cy} r="2" fill="hsl(217 91% 60% / 0.5)" />;
                })}
              </svg>

              {/* ── Logo clipped into circle (fills the badge face) ── */}
              <div
                className="absolute z-10 rounded-full overflow-hidden"
                style={{
                  inset: 24,
                  background: 'radial-gradient(ellipse at 40% 35%, hsl(222 47% 11%) 0%, hsl(222 47% 6%) 100%)',
                  boxShadow: 'inset 0 0 30px hsl(217 91% 60% / 0.08)',
                }}
              >
                <img
                  src={logo}
                  alt="MonitorX"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    filter: 'drop-shadow(0 0 16px hsl(217 91% 60% / 0.9)) drop-shadow(0 0 6px hsl(187 82% 53% / 0.6))',
                  }}
                />
              </div>

            </div>
          </motion.div>


          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Real-Time Classroom Monitoring
            <span className="text-primary font-medium">Beta</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Monitor Every Screen.{' '}
            <span className="text-gradient-shimmer">Instantly.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Real-time classroom & training monitoring platform for labs, bootcamps, and corporate training.
            <span className="text-foreground/70"> Watch, chat, and help — all in one place.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative group overflow-hidden flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-base"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                <span className="absolute inset-0 overflow-hidden">
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 animate-shimmer" />
                </span>
                <Zap className="h-4 w-4" />
                Get Started Free
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-foreground border border-border/80 bg-secondary/50 backdrop-blur-sm hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-base"
              >
                <Monitor className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                Join Session
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2"
          >
            <Shield className="h-3.5 w-3.5 text-success" />
            Trusted by 500+ training organizations worldwide
          </motion.p>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* MARQUEE STRIP */}
      <div className="relative border-y border-border/50 bg-secondary/30 backdrop-blur-sm overflow-hidden py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {marqueeItems.map((item, i) => (
            <span key={i} className="mx-6 text-sm text-muted-foreground font-medium flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary/60 inline-block" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES SECTION */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 mesh-bg pointer-events-none opacity-50" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything you need to{' '}
              <span className="text-gradient">monitor</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Powerful tools designed for instructors and training professionals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className={`group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 overflow-hidden card-hover ${f.glow} transition-all duration-300`}
              >
                {/* Gradient top accent */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                {/* Inner glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`relative h-12 w-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="relative text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-28 px-4 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm text-muted-foreground mb-6">
              <Eye className="h-3.5 w-3.5 text-accent" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              How it <span className="text-gradient">works</span>
            </h2>
            <p className="text-muted-foreground text-lg">Three simple steps to get started</p>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.7 }}
                  className="text-center group"
                >
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <motion.div
                      className="h-20 w-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                      style={{ background: 'var(--gradient-primary)' }}
                      whileHover={{ scale: 1.08, rotate: 3 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      <step.icon className="h-8 w-8 text-white relative z-10" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border-2 border-primary/60 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{step.num}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

            <div className="relative z-10 text-center py-16 px-8">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-6"
              >
                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Ready to take control?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Start monitoring your training sessions in minutes. No setup, no credit card required.
              </p>
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 rounded-xl bg-white text-primary font-bold text-base hover:bg-white/95 transition-colors shadow-lg"
                >
                  Start Monitoring Free →
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-14 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-sm" />
                  <img src={logo} alt="MonitorX" className="relative h-9 w-9 object-contain" />
                </div>
                <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Monitor<span className="text-gradient">X</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Real-time screen monitoring for modern training environments. Built for educators, loved by learners.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {['Features', 'Pricing', 'Changelog', 'Roadmap'].map(item => (
                  <li key={item} className="hover:text-foreground transition-colors cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {['About', 'Privacy Policy', 'Terms of Service', 'Contact'].map(item => (
                  <li key={item} className="hover:text-foreground transition-colors cursor-pointer">{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 MonitorX, Inc. Made with ❤️ for educators.</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
