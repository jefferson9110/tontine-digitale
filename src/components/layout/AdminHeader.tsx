import React from 'react';
import { useLocation } from 'react-router-dom';
import { RiMenuLine, RiBellLine, RiShieldCheckLine } from 'react-icons/ri';
import { useTontine } from '../../contexts/TontineContext';
import { useAuth } from '../../contexts/AuthContext';

const ADMIN_TITLES: Record<string, string> = {
  '/admin/dashboard':    'Dashboard Admin',
  '/admin/tontines':     'Gestion des tontines',
  '/admin/utilisateurs': 'Gestion des utilisateurs',
  '/admin/rapports':     'Rapports & Analyses',
  '/admin/securite':     'Sécurité',
  '/admin/parametres':   'Paramètres système',
};

export function AdminHeader() {
  const { setSidebarOpen } = useTontine();
  const { profile } = useAuth();
  const { pathname } = useLocation();

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3.5 flex items-center gap-4">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 rounded-xl hover:bg-gray-100 lg:hidden"
      >
        <RiMenuLine className="w-5 h-5" />
      </button>

      <div className="flex-1">
        <h1 className="font-display font-bold text-gray-900 text-lg leading-none">
          {ADMIN_TITLES[pathname] ?? 'Administration'}
        </h1>
        <div className="flex items-center gap-1 mt-0.5">
          <RiShieldCheckLine className="w-3 h-3 text-primary-600" />
          <p className="text-xs text-primary-600 font-medium">Administrateur</p>
        </div>
      </div>

      <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <RiBellLine className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  );
}
