import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { ROUTES } from '../../constants';

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage(): React.JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const returnTo = searchParams.get('returnTo') ?? ROUTES.DASHBOARD;
  const sessionExpired = searchParams.get('session') === 'expired';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setServerError(null);

    try {
      await login(values.email, values.password);
      toast.success('Welcome back!');
      navigate(returnTo, { replace: true });
    } catch (error: unknown) {
      setServerError('Authentication failed. Please verify your email and password.');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ─── Header ─── */}
      <div className="mb-7">
        <h2 className="text-xl font-semibold text-text-primary">Sign in</h2>
        <p className="text-sm text-text-secondary mt-1">
          Access your TransitOps workspace
        </p>
      </div>

      {/* ─── Session Expired Banner ─── */}
      {sessionExpired && (
        <div className="flex items-center gap-2 p-3 mb-5 bg-status-warning-bg border border-yellow-200 rounded text-sm text-status-warning">
          <AlertCircle size={15} className="flex-shrink-0" />
          Your session has expired. Please sign in again.
        </div>
      )}

      {/* ─── Server Error ─── */}
      {serverError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 mb-5 bg-status-danger-bg border border-red-200 rounded text-sm text-status-danger"
        >
          <AlertCircle size={15} className="flex-shrink-0" />
          {serverError}
        </div>
      )}

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          {...register('email')}
          label="Email Address"
          type="email"
          id="email"
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          required
          error={errors.email?.message}
          leftIcon={<Mail size={14} />}
        />

        <div>
          <Input
            {...register('password')}
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            leftIcon={<Lock size={14} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full mt-2 py-2.5"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* ─── Help ─── */}
      <div className="mt-6 pt-5 border-t border-border text-center">
        <p className="text-xs text-text-muted">
          Need access?{' '}
          <span className="text-text-secondary">
            Contact your system administrator
          </span>
        </p>
      </div>

      {/* ─── Demo Account Card ─── */}
      <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs animate-fade-in">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Demo Account
        </div>
        <div className="grid grid-cols-2 gap-3 text-slate-600">
          <div>
            <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Email</span>
            <code className="text-slate-800 font-mono text-[11px] select-all">admin@transitops.com</code>
          </div>
          <div>
            <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wider mb-0.5">Password</span>
            <code className="text-slate-800 font-mono text-[11px] select-all">TransitOps@2024!</code>
          </div>
        </div>
      </div>
    </div>
  );
}
