import { NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiGroupLine, RiMoneyDollarCircleLine,
  RiBellLine, RiFileChartLine, RiChat4Line, RiSettings3Line,
  RiLogoutBoxLine, RiCloseLine, RiAddCircleLine, RiStarLine,
  RiWalletLine, RiTrophyLine, RiShieldCheckLine,
  RiStackLine, RiUserLine, RiBarChartLine, RiCalendarEventLine,
} from 'react-icons/ri';
import { useAuth }         from '../../contexts/AuthContext';
import { useTontineScore,
         getScoreColor }   from '../../hooks/useTontineScore';
import { useNotifications } from '../../hooks/useNotifications';
import { cn, getInitiales } from '../../lib/utils';
import toast from 'react-hot-toast';


interface Props { onClose?: () => void; }

// ── Sections de navigation par rôle ─────────────
const NAV_MEMBRE = [
  {
    label: 'PRINCIPAL',
    items: [
      { to: '/dashboard',     icon: RiDashboardLine,         label: 'Tableau de bord' },
      { to: '/tontines',      icon: RiGroupLine,             label: 'Mes tontines' },
      { to: '/paiements',     icon: RiWalletLine,            label: 'Paiements' },
    ],
  },
  {
    label: 'ACTIVITÉ',
    items: [
      { to: '/cotisations',   icon: RiMoneyDollarCircleLine, label: 'Cotisations' },
      { to: '/beneficiaires', icon: RiTrophyLine,            label: 'Bénéficiaires' },
      { to: '/messages',      icon: RiChat4Line,             label: 'Messages' },
      { to: '/notifications', icon: RiBellLine,              label: 'Notifications', badge: true },
      { to: '/calendrier',    icon: RiCalendarEventLine,     label: 'Calendrier' },
    ],
  },
  {
    label: 'MON COMPTE',
    items: [
      { to: '/score',         icon: RiStarLine,              label: 'Mon TontineScore', score: true },
      { to: '/parametres',    icon: RiSettings3Line,         label: 'Paramètres' },
    ],
  },
];

const NAV_ORGA = [
  {
    label: 'PRINCIPAL',
    items: [
      { to: '/dashboard',     icon: RiDashboardLine,         label: 'Tableau de bord' },
      { to: '/tontines',      icon: RiGroupLine,             label: 'Mes tontines' },
      { to: '/paiements',     icon: RiWalletLine,            label: 'Paiements' },
    ],
  },
  {
    label: 'GESTION',
    items: [
      { to: '/cotisations',   icon: RiMoneyDollarCircleLine, label: 'Cotisations' },
      { to: '/beneficiaires', icon: RiTrophyLine,            label: 'Bénéficiaires' },
      { to: '/messages',      icon: RiChat4Line,             label: 'Messages' },
      { to: '/calendrier',    icon: RiCalendarEventLine,     label: 'Calendrier' },
      { to: '/notifications', icon: RiBellLine,              label: 'Notifications', badge: true },
    ],
  },
  {
    label: 'MON COMPTE',
    items: [
      { to: '/score',         icon: RiStarLine,              label: 'Mon TontineScore', score: true },
      { to: '/parametres',    icon: RiSettings3Line,         label: 'Paramètres' },
    ],
  },
];

const NAV_ADMIN = [
  {
    label: 'ADMINISTRATION',
    items: [
      { to: '/admin/dashboard',    icon: RiDashboardLine,  label: 'Dashboard' },
      { to: '/admin/tontines',     icon: RiStackLine,      label: 'Tontines' },
      { to: '/messages',      icon: RiChat4Line,             label: 'Messages' },
      { to: '/admin/utilisateurs', icon: RiGroupLine,      label: 'Utilisateurs' },
      { to: '/admin/rapports',     icon: RiBarChartLine,   label: 'Rapports' },
    ],
  },
  {
    label: 'MON COMPTE',
    items: [
      { to: '/parametres',         icon: RiSettings3Line,  label: 'Paramètres' },
    ],
  },
];

export function Sidebar({ onClose }: Props) {
  const { profile, signOut } = useAuth();
  const navigate             = useNavigate();
  const { data: scoreData }  = useTontineScore(profile?.id);
  const { data: notifs = [] } = useNotifications(profile?.id);

  const score      = scoreData?.score ?? null;
  const scoreColor = score !== null ? getScoreColor(score) : null;
  const initiales  = profile ? getInitiales(profile.nom, profile.prenom) : 'U';
  const nbNonLues  = notifs.filter((n: any) => !n.lu).length;

  const role = profile?.role_global ?? 'membre';
  const peutCreer = role === 'organisateur' || role === 'admin';

  const sections = role === 'admin' ? NAV_ADMIN
    : role === 'organisateur' ? NAV_ORGA
    : NAV_MEMBRE;

  async function handleSignOut() {
    await signOut();
    toast.success('À bientôt et à la prochaine !');
    navigate('/login');
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 dark:bg-slate-950 text-white">

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-black text-lg">T</span>
          </div>
          <div>
            <span className="font-display font-bold text-white text-base tracking-tight">
              Tontine<span className="text-primary-400">Digitale</span>
            </span>
            {role === 'admin' && (
              <p className="text-xs text-slate-400 -mt-0.5">Administration</p>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 lg:hidden">
            <RiCloseLine className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      {/* Navigation par sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-hide">
        {sections.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-slate-500 tracking-widest px-3 mb-2">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, badge, score: isScore }: any) => (
                <NavLink key={to} to={to} onClick={onClose}
                  className={({ isActive }) => cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
                  )}>
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', isActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-slate-200')} />
                      <span className="flex-1">{label}</span>

                      {/* Badge notifications non lues */}
                      {badge && nbNonLues > 0 && (
                        <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {nbNonLues > 99 ? '99+' : nbNonLues}
                        </span>
                      )}

                      {/* Badge TontineScore */}
                      {isScore && score !== null && (
                        <span className={cn(
                          'text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full',
                          score >= 80 ? 'bg-green-500/20 text-green-400' :
                          score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {score}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profil + déconnexion */}
      <div className="border-t border-slate-700/50 p-3">
        {/* Mini score */}
        {score !== null && role !== 'admin' && (
          <button
            onClick={() => { navigate('/score'); onClose?.(); }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-2 transition-colors',
              'bg-slate-800/50 hover:bg-slate-700/50'
            )}
          >
            <RiStarLine className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">TontineScore</span>
                <span className={cn('text-xs font-bold font-mono',
                  score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
                )}>{score}/100</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all',
                    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </button>
        )}

        {/* Avatar + nom + déco */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-400 font-bold text-sm">{initiales}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">
              {profile?.prenom} {profile?.nom}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Déconnexion"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
          >
            <RiLogoutBoxLine className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}