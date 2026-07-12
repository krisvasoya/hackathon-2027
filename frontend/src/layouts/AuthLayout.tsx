import React from 'react';
import { Outlet } from 'react-router-dom';

// ─── Auth Layout ──────────────────────────────────────────────────────────────
// Used only by public pages: Login, Forgot Password.
// Centered card on neutral background — clean, professional.

export function AuthLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ─── Auth Header ─── */}
      <div className="flex flex-col justify-center px-8 py-3.5 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="TransitOps Logo" className="h-12 w-auto object-contain" />
        </div>
        <p className="text-xs text-text-muted mt-1 font-medium">
          Enterprise Fleet Operations Platform
        </p>
      </div>

      {/* ─── Centered Form Area ─── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[420px] bg-white border border-border rounded-xl shadow-sm p-8">
          <Outlet />
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="text-center py-4 text-xs text-text-muted border-t border-border bg-white">
        © {new Date().getFullYear()} TransitOps. Enterprise Fleet Operations Platform.
      </div>
    </div>
  );
}
