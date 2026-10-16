import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: 'Unable to send reset email', description: error.message, variant: 'destructive' });
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="border border-border bg-card p-6 sm:p-8">
          <div className="h-11 w-11 flex items-center justify-center bg-primary/10 text-primary mb-6">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Reset your password</h1>
          {sent ? (
            <p className="text-sm leading-6 text-muted-foreground" role="status">
              If an account exists for <span className="text-foreground">{email}</span>, a password reset link has been sent.
              Check your inbox and spam folder.
            </p>
          ) : (
            <>
              <p className="text-sm leading-6 text-muted-foreground mb-6">
                Enter the email address connected to your account and we’ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="h-11 bg-background"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}