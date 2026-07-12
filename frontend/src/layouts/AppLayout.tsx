import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/sidebar/Sidebar';
import { TopNavbar } from '../components/navbar/TopNavbar';

// ─── App Shell Layout ─────────────────────────────────────────────────────────
// Used by all authenticated pages.
// Renders: fixed sidebar (240px) + fixed top navbar (60px) + scrollable main area

export function AppLayout(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopNavbar />

      {/* ─── Main Content Area ─── */}
      <main
        className="ml-[240px] pt-[60px] min-h-screen"
        id="main-content"
        role="main"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
