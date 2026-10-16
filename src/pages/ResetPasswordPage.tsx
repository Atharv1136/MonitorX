import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function hasRecoveryType() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  return hash.get('type') === 'recovery' || query.get('type') === 'recovery';
}

export default function ResetPasswordPage() {
  const [recoveryReady, setRecoveryReady] = useState(hasRecoveryType());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Enter the same password in both fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: 'Unable to update password', description: error.message, variant: 'destructive' });
      return;
    }
    setUpdated(true);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="border border-border bg-card p-6 sm:p-8">
          <div className="h-11 w-11 flex items-center justify-center bg-primary/10 text-primary mb-6">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Choose a new password</h1>
          {updated ? (
            <div role="status" className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">Your password has been updated.</p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/dashboard">Continue</Link>
              </Button>
            </div>
          ) : !recoveryReady ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">
                This reset link is invalid or has expired. Request a new link to continue.
              </p>
              <Button asChild variant="hero" className="w-full">
                <Link to="/forgot-password">Request a new link</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className="h-11 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                  className="h-11 bg-background"
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}