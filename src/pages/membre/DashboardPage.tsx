import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiGroupLine, RiMoneyDollarCircleLine, RiAddCircleLine,
  RiArrowRightLine, RiCheckDoubleLine, RiTimeLine,
  RiAlertLine, RiCalendarLine, RiWalletLine, RiTrophyLine,
  RiStarLine, RiStackLine, RiUserLine, RiShieldCheckLine,
  RiBarChartLine, RiLoader4Line, RiFileChartLine,
} from 'react-icons/ri';
import { useAuth }              from '../../contexts/AuthContext';
import { useTontines, useAllTontines, useStatsTontine } from '../../hooks/useTontines';
import { useMesCotisations }    from '../../hooks/useCotisations';
import { useTontineScore }      from '../../hooks/useMembres';
import { useStatsAdmin }        from '../../hooks/useAdmin';
import { useNotifications }     from '../../hooks/useNotifications';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';
import type { UserRole }        from '../../types';

// ── Spinner centralisé ───────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Stat card partagée ───────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconCls = 'bg-primary-100 text-primary-700' }: {
  icon: React.ElementType; label: string; value: string; sub?: string; iconCls?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconCls}`}><Icon className="w-5 h-5" /></div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-xl font-display font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  DASHBOARD ADMIN
// ════════════════════════════════════════════════
function AdminDashboard({ prenom }: { prenom: string }) {
  const { data: stats, isLoading } = useStatsAdmin();
  const { data: tontines = [] }    = useAllTontines();
  const { data: notifs = [] }      = useNotifications(undefined);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
            <RiShieldCheckLine className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Administration</span>
        </div>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Bonjour {prenom} — Vue globale de TontineDigitale</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RiStackLine}             label="Tontines actives"      value={`${stats?.tontines_actives ?? 0}/${stats?.total_tontines ?? 0}`}  iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiGroupLine}             label="Utilisateurs"          value={String(stats?.total_utilisateurs ?? 0)}                            iconCls="bg-blue-100 text-blue-700" />
        <StatCard icon={RiWalletLine}            label="Volume collecté"       value={formatMontant(stats?.volume_collecte ?? 0)}                       iconCls="bg-amber-100 text-amber-700" />
        <StatCard icon={RiBarChartLine}          label="Taux participation"    value={`${stats?.taux_participation ?? 0}%`}                              iconCls="bg-green-100 text-green-700" />
        <StatCard icon={RiAlertLine}             label="Cotisations en retard" value={String(stats?.cotisations_retard ?? 0)}                            iconCls="bg-red-100 text-red-700" />
        <StatCard icon={RiUserLine}              label="Inscriptions ce mois"  value={`+${stats?.nouvelles_inscriptions ?? 0}`}                          iconCls="bg-violet-100 text-violet-700" />
      </div>

      {/* Top tontines */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900 text-base">Tontines actives</h2>
          <Link to="/admin/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
            Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
          </Link>
        </div>
        {tontines.slice(0, 5).map(t => (
          <Link key={t.id} to={`/tontines/${t.id}`}
            className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-1 rounded-lg transition-colors group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-bold text-sm">{t.nom.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-700">{t.nom}</p>
                <p className="text-xs text-gray-400">Cycle {t.cycle_actuel}/{t.total_cycles}</p>
              </div>
            </div>
            <span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span>
          </Link>
        ))}
      </div>

      {/* Accès rapides */}
      <div className="card">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tontines',      icon: RiStackLine,       href: '/admin/tontines',     cls: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
            { label: 'Utilisateurs',  icon: RiGroupLine,       href: '/admin/utilisateurs', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'Rapports',      icon: RiFileChartLine,   href: '/admin/rapports',     cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            { label: 'Sécurité',      icon: RiShieldCheckLine, href: '/admin/securite',     cls: 'bg-red-50 text-red-700 hover:bg-red-100' },
          ].map(({ label, icon: Icon, href, cls }) => (
            <Link key={href} to={href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center ${cls}`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  DASHBOARD ORGANISATEUR
// ════════════════════════════════════════════════
function OrgaDashboard({ prenom, userId }: { prenom: string; userId: string }) {
  const { data: tontines = [], isLoading } = useTontines(userId);
  const { data: cotisations = [] }         = useMesCotisations(userId);

  if (isLoading) return <Spinner />;

  const totalCollecte  = cotisations.filter(c => c.statut === 'payee').reduce((s, c) => s + c.montant_paye, 0);
  const enRetard       = cotisations.filter(c => c.statut === 'en_retard').length;
  const membresTotal   = tontines.reduce((s, t) => s + t.nombre_membres_max, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center">
            <RiStackLine className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Organisateur</span>
        </div>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Bonjour {prenom} — Gérez vos tontines</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RiStackLine}   label="Mes tontines"     value={String(tontines.length)}           iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiGroupLine}   label="Membres total"    value={String(membresTotal)}              iconCls="bg-blue-100 text-blue-700" />
        <StatCard icon={RiWalletLine}  label="Total collecté"   value={formatMontant(totalCollecte)}      iconCls="bg-amber-100 text-amber-700" />
        <StatCard icon={RiAlertLine}   label="Retards"          value={String(enRetard)}                  iconCls={enRetard > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'} />
        <StatCard icon={RiCheckDoubleLine} label="Payées"       value={String(cotisations.filter(c => c.statut === 'payee').length)} iconCls="bg-green-100 text-green-700" />
      </div>

      {/* CTA créer tontine */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-display font-bold text-base">Créer une nouvelle tontine</p>
          <p className="text-primary-300 text-sm mt-0.5">Invitez vos membres en quelques clics.</p>
        </div>
        <Link to="/tontines/creer" className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold flex-shrink-0">
          <RiAddCircleLine className="w-4 h-4" /> Créer
        </Link>
      </div>

      {/* Mes tontines */}
      {tontines.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm">Vous n'avez pas encore de tontine.</p>
          <Link to="/tontines/creer" className="btn-primary mt-4 inline-flex">
            <RiAddCircleLine className="w-4 h-4" /> Créer ma première tontine
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Mes tontines actives</h2>
            <Link to="/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {tontines.slice(0, 4).map(t => (
              <Link key={t.id} to={`/tontines/${t.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-display font-bold text-sm">{t.nom.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-700 truncate max-w-[180px]">{t.nom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Cycle {t.cycle_actuel}/{t.total_cycles}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatMontant(t.montant_cotisation, t.devise)}</p>
                  <span className={cn('badge text-xs', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cotisations en attente */}
      {cotisations.filter(c => c.statut === 'en_attente' || c.statut === 'en_retard').length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Cotisations à valider</h2>
            <span className="badge-yellow">
              {cotisations.filter(c => c.statut === 'en_attente' || c.statut === 'en_retard').length} en attente
            </span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Tontine</th><th>Montant</th><th>Statut</th><th>Échéance</th></tr></thead>
              <tbody>
                {cotisations
                  .filter(c => c.statut === 'en_attente' || c.statut === 'en_retard')
                  .slice(0, 5)
                  .map(c => (
                    <tr key={c.id}>
                      <td className="text-sm text-gray-600">{(c as any).tontine?.nom ?? '—'}</td>
                      <td className="font-mono font-semibold">{formatMontant(c.montant_du)}</td>
                      <td><span className={cn('badge', getStatutColor(c.statut))}>{getStatutLabel(c.statut)}</span></td>
                      <td className="text-xs text-gray-400">{formatDate(c.date_echeance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  DASHBOARD MEMBRE
// ════════════════════════════════════════════════
function MembreDashboard({ prenom, userId }: { prenom: string; userId: string }) {
  const { data: tontines = [],    isLoading }  = useTontines(userId);
  const { data: cotisations = [] }             = useMesCotisations(userId);
  const { data: score = 50 }                   = useTontineScore(userId);

  if (isLoading) return <Spinner />;

  const payees    = cotisations.filter(c => c.statut === 'payee').length;
  const enAttente = cotisations.filter(c => c.statut === 'en_attente' || c.statut === 'en_retard').length;
  const totalCotise = cotisations.reduce((s, c) => s + c.montant_paye, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-teal-100 rounded-md flex items-center justify-center">
            <RiUserLine className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Membre</span>
        </div>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Bonjour {prenom} — Votre espace membre</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RiGroupLine}         label="Tontines actives"   value={String(tontines.length)}    iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiCheckDoubleLine}   label="Cotisations payées" value={`${payees} cycles`}          iconCls="bg-green-100 text-green-700" />
        <StatCard icon={RiTimeLine}          label="À payer"            value={`${enAttente}`}              iconCls={enAttente > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'} />
        <StatCard icon={RiWalletLine}        label="Total cotisé"       value={formatMontant(totalCotise)} iconCls="bg-amber-100 text-amber-700" />
        <StatCard icon={RiStarLine}          label="TontineScore"       value={`${score}/100`} sub={score >= 80 ? 'Excellent' : score >= 60 ? 'Bon' : 'À améliorer'} iconCls="bg-teal-100 text-teal-700" />
      </div>

      {/* TontineScore visuel */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base">Mon TontineScore</h2>
            <p className="text-xs text-gray-400 mt-0.5">Basé sur votre régularité de paiement</p>
          </div>
          <p className="text-3xl font-display font-bold text-primary-700">{score}<span className="text-base text-gray-400">/100</span></p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={cn(
            'h-full rounded-full transition-all duration-700',
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
          )} style={{ width: `${score}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>Peu fiable</span>
          <span>{score >= 80 ? '✓ Score excellent' : score >= 60 ? 'Score correct' : 'Score faible'}</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Mes cotisations à venir */}
      {cotisations.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Mes prochaines cotisations</h2>
            <Link to="/cotisations" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {cotisations.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    c.statut === 'payee' ? 'bg-green-100' : c.statut === 'en_retard' ? 'bg-red-100' : 'bg-amber-100'
                  )}>
                    {c.statut === 'payee'
                      ? <RiCheckDoubleLine className="w-4 h-4 text-green-600" />
                      : c.statut === 'en_retard'
                      ? <RiAlertLine className="w-4 h-4 text-red-600" />
                      : <RiTimeLine className="w-4 h-4 text-amber-600" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{(c as any).tontine?.nom ?? 'Tontine'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Cycle {c.cycle_numero} · Échéance {formatDate(c.date_echeance)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{formatMontant(c.montant_du)}</p>
                  <span className={cn('badge text-xs', getStatutColor(c.statut))}>{getStatutLabel(c.statut)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA rejoindre une tontine */}
      {tontines.length === 0 && (
        <div className="bg-gradient-to-r from-teal-600 to-primary-700 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white font-display font-bold text-base">Rejoindre une tontine</p>
            <p className="text-primary-200 text-sm mt-0.5">Utilisez un lien d'invitation reçu par email ou WhatsApp.</p>
          </div>
          <Link to="/tontines" className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold flex-shrink-0">
            Voir mes invitations
          </Link>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL avec logique de promotion
// ════════════════════════════════════════════════
export function DashboardPage() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: tontines = [] } = useTontines(profile?.id);

  // ── Promotion automatique membre → organisateur ──
  useEffect(() => {
    async function verifierPromotion() {
      if (!profile) return;
      if (profile.role_global !== 'membre') return;

      // Si l'utilisateur a créé au moins une tontine → promouvoir
      const aTontine = tontines.some(t => t.organisateur_id === profile.id);
      if (!aTontine) return;

      // Appel Supabase pour changer le rôle
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase
        .from('profiles')
        .update({ role_global: 'organisateur' })
        .eq('id', profile.id);

      if (!error) {
        await refreshProfile(); // Recharger le profil dans AuthContext
      }
    }

    verifierPromotion();
  }, [tontines, profile, refreshProfile]);

  if (loading || !profile) return <Spinner />;

  const prenom = profile.prenom || profile.nom || 'Utilisateur';
  const role: UserRole = profile.role_global;

  switch (role) {
    case 'admin':
      return <AdminDashboard prenom={prenom} />;
    case 'organisateur':
      return <OrgaDashboard prenom={prenom} userId={profile.id} />;
    case 'membre':
    case 'tresorier':
    default:
      return <MembreDashboard prenom={prenom} userId={profile.id} />;
  }
}