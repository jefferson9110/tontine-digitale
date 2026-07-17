import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';
 

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nbNonLues, setNbNonLues] = useState<number>(0);
  const [notifs, setNotifs] = useState<any[]>([]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-200">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex-shrink-0',
        'transform transition-transform duration-300 ease-in-out lg:transform-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'shadow-xl lg:shadow-none'
      )}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          setSidebarOpen={setSidebarOpen}
          nbNonLues={nbNonLues}
          notifs={notifs}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}