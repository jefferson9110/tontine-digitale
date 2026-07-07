import React from 'react';
import { useLocation } from 'react-router-dom';
import { RiMenuLine, RiBellLine } from 'react-icons/ri';
import { useTontine } from '../../contexts/TontineContext';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Tableau de bord',
  '/tontines':        'Mes tontines',
  '/cotisations':     'Cotisations',
  '/beneficiaires':   'Bénéficiaires',
  '/messages':        'Messages',
  '/notifications':   'Notifications',
  '/parametres':      'Paramètres',
};

export function Header() {
  const { setSidebarOpen, unreadCount } = useTontine();
  const { profile } = useAuth();
  const { pathname } = useLocation();

  const title = PAGE_TITLES[pathname] ?? 'TontineDigitale';
  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center gap-4">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 rounded-xl hover:bg-gray-100 lg:hidden"
      >
        <RiMenuLine className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex-1">
        <h1 className="font-display font-bold text-gray-900 text-lg leading-none">{title}</h1>
        {profile && (
          <p className="text-xs text-gray-400 mt-0.5">
            {salutation}, {profile.prenom} 👋
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RiBellLine className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
