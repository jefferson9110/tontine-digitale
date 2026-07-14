import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  RiMenuLine, RiBellLine, RiSunLine, RiMoonLine,
  RiSettings3Line, RiLogoutBoxLine, RiUserLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';
import { useAuth }           from '../../contexts/AuthContext';
import { useNotifications,
         useMarquerToutesLues } from '../../hooks/useNotifications';
import { getInitiales, cn }   from '../../lib/utils';
import toast                  from 'react-hot-toast';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Tableau de bord',
  '/tontines':           'Mes tontines',
  '/tontines/creer':     'Créer une tontine',
  '/cotisations':        'Cotisations',
  '/beneficiaires':      'Bénéficiaires',
  '/messages':           'Messages',
  '/notifications':      'Notifications',
  '/paiements':          'Paiements',
  '/score':              'Mon TontineScore',
  '/parametres':         'Paramètres',
  '/admin/dashboard':    'Dashboard',
  '/admin/tontines':     'Gestion des tontines',
  '/admin/utilisateurs': 'Utilisateurs',
  '/admin/rapports':     'Rapports & Analyses',
};

interface Props { setSidebarOpen: (v: boolean) => void; nbNonLues: number; notifs: any[]; }

export function Header({ setSidebarOpen, notifs }: Props) {
  const { profile, signOut } = useAuth();
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  const notifResult = useNotifications(profile?.id);
  const notifications: any[] = Array.isArray(notifResult?.data) 
  ? notifResult.data 
  : Array.isArray(notifResult) 
  ? notifResult as any[]
  : [];
  const marquerToutesLues            = useMarquerToutesLues();

  const nbNonLues = (notifs ?? []).filter((n: any) => !n.lu).length;
  const initiales      = profile ? getInitiales(profile.nom, profile.prenom) : 'U';

  // Trouver le titre de la page courante
  const title = PAGE_TITLES[pathname]
    ?? (pathname.startsWith('/tontines/') ? 'Détail tontine' : 'TontineDigitale');

  // Salutation selon l'heure
  const heure = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Dropdown notifs
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleSignOut() {
    await signOut();
    toast.success('À bientôt !');
    navigate('/login');
  }

  const dernieresNotifs = (notifs ?? []).slice(0, 5);

  return (
    <header className={cn(
      'sticky top-0 z-20 flex items-center gap-4 px-4 md:px-6 py-3.5',
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md',
      'border-b border-gray-100 dark:border-slate-700/50',
      'transition-colors duration-200'
    )}>
      {/* Menu burger (mobile) */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 lg:hidden transition-colors"
      >
        <RiMenuLine className="w-5 h-5 text-gray-600 dark:text-slate-400" />
      </button>

      {/* Titre + salutation */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-bold text-gray-900 dark:text-slate-100 text-lg leading-none truncate">
          {title}
        </h1>
        {profile && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {salutation},{' '}
            <span className="font-semibold text-gray-600 dark:text-slate-300">
              {profile.prenom}
            </span>
          </p>
        )}
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Cloche notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(s => !s); setShowProfile(false); }}
            className={cn(
              'relative p-2.5 rounded-xl transition-colors',
              showNotifs
                ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-600 dark:text-slate-400'
            )}
          >
            {/* Icône cloche SVG identique à l'image */}
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {/* Badge rouge */}
            {nbNonLues > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900">
                {nbNonLues > 99 ? '99+' : nbNonLues}
              </span>
            )}
          </button>

          {/* Dropdown notifications */}
          {showNotifs && (
            <div className={cn(
              'absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl border z-50',
              'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700',
              'animate-fade-in'
            )}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Notifications</p>
                  {nbNonLues > 0 && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">{nbNonLues} non lue{nbNonLues > 1 ? 's' : ''}</p>
                  )}
                </div>
                {nbNonLues > 0 && (
                  <button
                    onClick={() => marquerToutesLues.mutate(profile?.id ?? '')}
                    className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <RiCheckDoubleLine className="w-3.5 h-3.5" /> Tout lire
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {dernieresNotifs.length === 0 ? (
                  <div className="text-center py-8">
                    <RiBellLine className="w-8 h-8 text-gray-200 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 dark:text-slate-500">Aucune notification</p>
                  </div>
                ) : (
                  dernieresNotifs.map((n: any) => (
                    <div key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0',
                        'hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer',
                        !n.lu && 'bg-primary-50/50 dark:bg-primary-500/5'
                      )}
                      onClick={() => { navigate('/notifications'); setShowNotifs(false); }}
                    >
                      {!n.lu && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                      <div className={cn('flex-1 min-w-0', n.lu && 'ml-5')}>
                        <p className={cn('text-sm font-medium truncate',
                          n.lu ? 'text-gray-600 dark:text-slate-400' : 'text-gray-900 dark:text-slate-100'
                        )}>
                          {n.titre}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline block text-center"
                >
                  Voir toutes les notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + dropdown profil */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(s => !s); setShowNotifs(false); }}
            className={cn(
              'flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl transition-colors',
              showProfile
                ? 'bg-primary-100 dark:bg-primary-500/20'
                : 'hover:bg-gray-100 dark:hover:bg-slate-700/50'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 border-2 border-primary-200 dark:border-primary-500/30 flex items-center justify-center">
              <span className="text-primary-700 dark:text-primary-400 font-bold text-xs">{initiales}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 leading-none">
                {profile?.prenom} {profile?.nom}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 capitalize mt-0.5">
                {profile?.role_global}
              </p>
            </div>
          </button>

          {showProfile && (
            <div className={cn(
              'absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border z-50',
              'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700',
              'animate-fade-in'
            )}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                  {profile?.prenom} {profile?.nom}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">{profile?.email}</p>
              </div>

              <div className="py-2">
                <Link to="/parametres" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <RiSettings3Line className="w-4 h-4" /> Paramètres
                </Link>
                <Link to="/score" onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <RiUserLine className="w-4 h-4" /> Mon profil
                </Link>
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 py-2">
                <button onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <RiLogoutBoxLine className="w-4 h-4" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}