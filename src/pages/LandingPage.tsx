import { motion } from 'framer-motion';
import { Monitor, MessageSquare, HelpCircle, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/shared/Navbar';
import logo from '@/assets/logo.png';

const features = [
  {
    icon: Monitor,
    title: 'Grid Monitoring',
    description: 'View up to 20 screens simultaneously in a configurable grid. Click any tile for instant fullscreen focus.',
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Chat',
    description: 'Bi-directional chat between Host and each Participant. Message history persisted per session.',
  },
  {
    icon: HelpCircle,
    title: 'Help Requests',
    description: 'One-click help request from Participant triggers pulsing amber alert on Host grid tile.',
  },
  {
    icon: Users,
    title: 'Scalable Sessions',
    description: 'From 10-seat classroom sessions to 500-participant enterprise deployments on the same infrastructure.',
  },
];

const steps = [
  { num: 1, title: 'Create Session', desc: 'Host creates a training session and gets a unique 6-character join code.' },
  { num: 2, title: 'Participants Join', desc: 'Learners enter the code and share their screen with one click.' },
  { num: 3, title: 'Monitor & Assist', desc: 'View all screens in real-time, chat, and resolve help requests instantly.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="grid grid-cols-6 gap-2 p-4 h-full animate-grid-float">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-primary/30 bg-primary/5" />
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <span className="h-2 w-2 rounded-full bg-success animate-breathe" />
              Real-Time Classroom Monitoring
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Monitor Every Screen.{' '}
              <span className="text-gradient">Instantly.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Real-time classroom & training monitoring platform for labs, bootcamps, and corporate training.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero">
                  Get Started <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline">
                  Join Session
                </Button>
              </Link>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
              Trusted by 500+ training organizations
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need to monitor</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Powerful tools designed for instructors and training professionals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to get started</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="MonitorX" className="h-8 w-8 object-contain" />
                <span className="text-lg font-bold text-foreground">
                  Monitor<span className="text-primary">X</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time screen monitoring for modern training environments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Features</li>
                <li>Pricing</li>
                <li>Changelog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 MonitorX, Inc. Made with ❤️ for educators.
          </div>
        </div>
      </footer>
    </div>
  );
}
