import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiGroupLine, RiShieldLine,
  RiFileChartLine, RiSettings3Line, RiLogoutBoxLine,
  RiCloseLine, RiStackLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props { onClose?: () => void; }

const adminNavItems = [
  { to: '/admin/dashboard',    icon: RiDashboardLine, label: 'Dashboard' },
  { to: '/admin/tontines',     icon: RiStackLine,     label: 'Toutes les tontines' },
  { to: '/admin/utilisateurs', icon: RiGroupLine,     label: 'Utilisateurs' },
  { to: '/admin/rapports',     icon: RiFileChartLine, label: 'Rapports' },
  { to: '/admin/securite',     icon: RiShieldLine,    label: 'Sécurité' },
  { to: '/admin/parametres',   icon: RiSettings3Line, label: 'Paramètres' },
];

export function AdminSidebar({ onClose }: Props) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success('À bientôt !');
    navigate('/login');
  }

  return (
    <div className="h-full bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <span className="font-display font-bold text-white text-base">TontineDigitale</span>
            <p className="text-xs text-slate-400">Administration</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 lg:hidden">
            <RiCloseLine className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {adminNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <RiLogoutBoxLine className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
