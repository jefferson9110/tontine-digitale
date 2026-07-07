import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useTontine } from '../../contexts/TontineContext';
import { cn } from '../../lib/utils';

export function AdminLayout() {
  const { sidebarOpen, setSidebarOpen } = useTontine();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0',
        'transform transition-transform duration-300 ease-in-out lg:transform-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
