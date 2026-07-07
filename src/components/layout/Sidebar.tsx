import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiGroupLine, RiMoneyDollarCircleLine,
  RiBellLine, RiFileChartLine, RiChat4Line, RiSettings3Line,
  RiLogoutBoxLine, RiCloseLine, RiAddCircleLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { cn, getInitiales } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props { onClose?: () => void; }

const navItems = [
  { to: '/dashboard',           icon: RiDashboardLine,         label: 'Tableau de bord' },
  { to: '/tontines',            icon: RiGroupLine,             label: 'Mes tontines' },
  { to: '/cotisations',         icon: RiMoneyDollarCircleLine, label: 'Cotisations' },
  { to: '/beneficiaires',       icon: RiFileChartLine,         label: 'Bénéficiaires' },
  { to: '/messages',            icon: RiChat4Line,              label: 'Messages' },
  { to: '/notifications',       icon: RiBellLine,              label: 'Notifications' },
];

export function Sidebar({ onClose }: Props) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success('À bientôt !');
    navigate('/login');
  }

  const initiales = profile
    ? getInitiales(profile.nom, profile.prenom)
    : 'U';

  return (
    <div className="h-full bg-white border-r border-gray-100 shadow-sidebar flex flex-col">
      {/* Logo + close */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">
            Tontine<span className="text-primary-600">Digitale</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 lg:hidden">
            <RiCloseLine className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Créer une tontine CTA */}
      <div className="px-4 py-3">
        <button
          onClick={() => { navigate('/tontines/creer'); onClose?.(); }}
          className="btn-primary w-full text-sm"
        >
          <RiAddCircleLine className="w-4 h-4" />
          Créer une tontine
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn('sidebar-item', isActive && 'active')
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="divider !my-3" />

        <NavLink
          to="/parametres"
          onClick={onClose}
          className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
        >
          <RiSettings3Line className="w-5 h-5" />
          <span>Paramètres</span>
        </NavLink>
      </nav>

      {/* Profil + déconnexion */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-sm">{initiales}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {profile?.prenom} {profile?.nom}
            </p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Déconnexion"
          >
            <RiLogoutBoxLine className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
