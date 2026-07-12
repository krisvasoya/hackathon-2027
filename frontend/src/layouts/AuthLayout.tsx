import React from 'react';
import { Outlet } from 'react-router-dom';
import { Truck } from 'lucide-react';

// ─── Auth Layout ──────────────────────────────────────────────────────────────
// Used only by public pages: Login, Forgot Password.
// Centered card on neutral background — clean, professional.

export function AuthLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ─── Auth Header ─── */}
      <div className="flex items-center gap-2.5 px-8 h-[60px] border-b border-border bg-white">
        <div className="w-7 h-7 bg-brand rounded flex items-center justify-center">
          <Truck size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-text-primary">TransitOps</span>
        <span className="text-text-muted text-sm ml-1">Enterprise</span>
      </div>

      {/* ─── Centered Form Area ─── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <Outlet />
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center py-4 text-xs text-text-muted border-t border-border">
        © {new Date().getFullYear()} TransitOps. Enterprise Transport Operations Platform.
      </div>
    </div>
  );
}
