import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiGroupLine, RiAddCircleLine,
  RiArrowRightLine, RiCheckDoubleLine, RiTimeLine,
  RiAlertLine, RiWalletLine, RiSearchLine, RiCheckLine,
  RiStarLine, RiStackLine, RiUserLine, RiShieldCheckLine,
  RiBarChartLine, RiLoader4Line, RiFileChartLine,
} from 'react-icons/ri';
import { useAuth }           from '../../contexts/AuthContext';
import { supabase }          from '../../lib/supabase';
import { useQuery }          from '@tanstack/react-query';
import toast             from 'react-hot-toast'
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';
import type { UserRole }     from '../../types';

// ── Spinner ──────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Stat card ────────────────────────────────────
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

// ── Hooks locaux simples ─────────────────────────
function useMonScore(userId?: string) {
  return useQuery({
    queryKey: ['mon_score', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 50;
      const { data, error } = await supabase
        .from('cotisations')
        .select('statut, montant_du, montant_paye, penalite')
        .eq('user_id', userId);
      if (error || !data || data.length === 0) return 50;
      const total   = data.length;
      const payees  = data.filter(c => c.statut === 'payee').length;
      const retards = data.filter(c => c.statut === 'en_retard').length;
      const score   = Math.max(0, Math.min(100,
        Math.round((payees / total) * 60 + Math.min(total * 1.5, 20) - retards * 5)
      ));
      return score;
    },
  });
}

function useMesTontines(userId?: string) {
  return useQuery({
    queryKey: ['mes_tontines_dashboard', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('membres_tontine')
        .select('tontine_id, statut, role')
        .eq('user_id', userId)
        .in('statut', ['actif', 'en_attente']);
      if (error || !data) return [];

      // Récupérer les tontines séparément
      const ids = data.map(m => m.tontine_id);
      if (ids.length === 0) return [];

      const { data: tontines, error: te } = await supabase
        .from('tontines')
        .select('id, nom, statut, montant_cotisation, devise, cycle_actuel, total_cycles, frequence')
        .in('id', ids);
      if (te || !tontines) return [];
      return tontines;
    },
  });
}

function useMesCotisationsSimple(userId?: string) {
  return useQuery({
    queryKey: ['mes_cotisations_dashboard', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('cotisations')
        .select('id, tontine_id, cycle_numero, montant_du, montant_paye, statut, date_echeance')
        .eq('user_id', userId)
        .order('date_echeance', { ascending: false })
        .limit(10);
      if (error || !data) return [];
      return data;
    },
  });
}

function useStatsPlateforme() {
  return useQuery({
    queryKey: ['stats_admin_dashboard'],
    queryFn: async () => {
      const [t, u, c] = await Promise.all([
        supabase.from('tontines').select('id, statut'),
        supabase.from('profiles').select('id, created_at'),
        supabase.from('cotisations').select('montant_paye, statut'),
      ]);
      const tontines    = t.data ?? [];
      const users       = u.data ?? [];
      const cotisations = c.data ?? [];
      return {
        total_tontines:     tontines.length,
        tontines_actives:   tontines.filter(t => t.statut === 'active').length,
        tontines_suspendues: tontines.filter(t => t.statut === 'suspendue').length,
        total_utilisateurs: users.length,
        nouvelles_inscriptions: users.filter(u => {
          const d = new Date(u.created_at);
          const m = new Date(); m.setMonth(m.getMonth() - 1);
          return d > m;
        }).length,
        volume_collecte: cotisations.reduce((s, c) => s + (Number(c.montant_paye) || 0), 0),
        taux_participation: cotisations.length > 0
          ? Math.round((cotisations.filter(c => c.statut === 'payee').length / cotisations.length) * 100)
          : 0,
        cotisations_retard: cotisations.filter(c => c.statut === 'en_retard').length,
      };
    },
  });
}

function useToutesLesTontines() {
  return useQuery({
    queryKey: ['toutes_tontines_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select('id, nom, statut, cycle_actuel, total_cycles, montant_cotisation, devise, frequence')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error || !data) return [];
      return data;
    },
  });
}

// ════════════════════════════════════════════════
//  DASHBOARD ADMIN
// ════════════════════════════════════════════════
function AdminDashboard({ prenom }: { prenom: string }) {
  const { data: stats,    isLoading } = useStatsPlateforme();
  const { data: tontines = [] }       = useToutesLesTontines();

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
        <StatCard icon={RiAlertLine}             label="Retards"              value={String(stats?.cotisations_retard ?? 0)}                            iconCls="bg-red-100 text-red-700" />
        <StatCard icon={RiUserLine}              label="Inscriptions ce mois" value={`+${stats?.nouvelles_inscriptions ?? 0}`}                          iconCls="bg-violet-100 text-violet-700" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900 text-base">Tontines récentes</h2>
          <Link to="/admin/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
            Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
          </Link>
        </div>
        {tontines.map(t => (
          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-700 font-bold text-sm">{t.nom.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t.nom}</p>
                <p className="text-xs text-gray-400">Cycle {t.cycle_actuel}/{t.total_cycles}</p>
              </div>
            </div>
            <span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tontines',      icon: RiStackLine,       href: '/admin/tontines',     cls: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
            { label: 'Utilisateurs',  icon: RiGroupLine,       href: '/admin/utilisateurs', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'Rapports',      icon: RiFileChartLine,   href: '/admin/rapports',     cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            { label: 'Sécurité',      icon: RiShieldCheckLine, href: '/admin/securite',     cls: 'bg-red-50 text-red-700 hover:bg-red-100' },
          ].map(({ label, icon: Icon, href, cls }) => (
            <Link key={href} to={href} className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors text-center ${cls}`}>
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
  const { data: tontines = [],    isLoading } = useMesTontines(userId);
  const { data: cotisations = [] }            = useMesCotisationsSimple(userId);

  if (isLoading) return <Spinner />;

  const enRetard  = cotisations.filter(c => c.statut === 'en_retard').length;
  const enAttente = cotisations.filter(c => c.statut === 'en_attente').length;

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
        <StatCard icon={RiStackLine}     label="Mes tontines"  value={String(tontines.length)}  iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiAlertLine}     label="Retards"       value={String(enRetard)}         iconCls={enRetard > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'} />
        <StatCard icon={RiTimeLine}      label="En attente"    value={String(enAttente)}        iconCls="bg-amber-100 text-amber-700" />
      </div>

      <div className="bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-display font-bold text-base">Créer une nouvelle tontine</p>
          <p className="text-primary-300 text-sm mt-0.5">Invitez vos membres en quelques clics.</p>
        </div>
        <Link to="/tontines/creer" className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold flex-shrink-0">
          <RiAddCircleLine className="w-4 h-4" /> Créer
        </Link>
      </div>

      {tontines.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 text-sm mb-4">Vous n'avez pas encore de tontine.</p>
          <Link to="/tontines/creer" className="btn-primary inline-flex">
            <RiAddCircleLine className="w-4 h-4" /> Créer ma première tontine
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Mes tontines</h2>
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
    </div>
  );
}

// ════════════════════════════════════════════════
//  DASHBOARD MEMBRE
// ════════════════════════════════════════════════
// ════════════════════════════════════════════════
//  REMPLACEMENT CIBLÉ — MembreDashboard uniquement
//  Dans DashboardPage.tsx, remplace la fonction
//  MembreDashboard par celle-ci
// ════════════════════════════════════════════════

function useTontinesDisponibles(userId?: string) {
  return useQuery({
    queryKey: ['tontines_disponibles', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Récupérer les IDs des tontines dont l'utilisateur est déjà membre
      const { data: dejaJointes } = await supabase
        .from('membres_tontine')
        .select('tontine_id')
        .eq('user_id', userId);

      const idsDejaJoints = (dejaJointes ?? []).map(m => m.tontine_id);

      // Récupérer les tontines actives de la plateforme
      // créées par d'autres utilisateurs (organisateurs)
      let query = supabase
        .from('tontines')
        .select(`
          id, nom, description, montant_cotisation, devise,
          frequence, nombre_membres_max, cycle_actuel, total_cycles,
          organisateur_id,
          organisateur:profiles(nom, prenom)
        `)
        .eq('statut', 'active')
        .neq('organisateur_id', userId) // Pas les siennes
        .order('created_at', { ascending: false })
        .limit(20);

      const { data, error } = await query;
      if (error || !data) return [];

      // Filtrer celles qu'il n'a pas encore rejointes
      return data.filter(t => !idsDejaJoints.includes(t.id));
    },
  });
}

function MembreDashboard({ prenom, userId }: { prenom: string; userId: string }) {
  const { data: tontines = [],    isLoading }  = useMesTontines(userId);
  const { data: cotisations = [] }             = useMesCotisationsSimple(userId);
  const { data: score = 50 }                   = useMonScore(userId);
  const { data: disponibles = [], isLoading: loadingDispo } = useTontinesDisponibles(userId);

  const [search,    setSearch]    = useState('');
  const [rejoindre, setRejoindre] = useState<string | null>(null);
  const [joining,   setJoining]   = useState(false);
  const navigate = useNavigate();

  if (isLoading) return <Spinner />;

  const payees      = cotisations.filter(c => c.statut === 'payee').length;
  const enAttente   = cotisations.filter(c =>
    c.statut === 'en_attente' || c.statut === 'en_retard'
  ).length;
  const totalCotise = cotisations.reduce((s, c) => s + (Number(c.montant_paye) || 0), 0);
  const scoreNum    = typeof score === 'object'
    ? ((score as any)?.score ?? 50)
    : (Number(score) || 50);

  const tontinesFiltrees = disponibles.filter(t =>
    t.nom.toLowerCase().includes(search.toLowerCase()) ||
    ((t.organisateur as any)?.prenom + ' ' + (t.organisateur as any)?.nom)
      .toLowerCase().includes(search.toLowerCase())
  );

  async function handleRejoindre(tontineId: string) {
    setJoining(true);
    try {
      // Vérifier doublon
      const { data: existing } = await supabase
        .from('membres_tontine')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        toast.error('Vous êtes déjà membre de cette tontine.');
        setRejoindre(null);
        return;
      }

      // Insérer avec statut en_attente
      const { error } = await supabase
        .from('membres_tontine')
        .insert({
          tontine_id: tontineId,
          user_id:    userId,
          role:       'membre',
          statut:     'en_attente',
        });

      if (error) throw error;

      // Notifier l'organisateur
      const tontine = disponibles.find(t => t.id === tontineId);
      if (tontine?.organisateur_id) {
        await supabase.from('notifications').insert({
          user_id: tontine.organisateur_id,
          type:    'nouveau_membre',
          titre:   'Nouvelle demande d\'adhésion',
          message: `Un membre souhaite rejoindre votre tontine "${tontine.nom}". Validez sa demande dans l'onglet Membres.`,
          lu:      false,
        });
      }

      toast.success('Demande envoyée ! En attente de validation par l\'organisateur.');
      setRejoindre(null);
    } catch (err: any) {
      toast.error(err.message ?? 'Une erreur est survenue.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RiGroupLine}       label="Tontines rejointes"  value={String(tontines.length)}    iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiCheckDoubleLine} label="Cotisations payées"  value={`${payees} cycle${payees > 1 ? 's' : ''}`} iconCls="bg-green-100 text-green-700" />
        <StatCard icon={RiTimeLine}        label="À payer"             value={String(enAttente)}           iconCls={enAttente > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'} />
        <StatCard icon={RiWalletLine}      label="Total cotisé"        value={formatMontant(totalCotise)} iconCls="bg-amber-100 text-amber-700" />
        <StatCard icon={RiStarLine}        label="TontineScore"        value={`${scoreNum}/100`}
          sub={scoreNum >= 80 ? 'Excellent' : scoreNum >= 60 ? 'Bon' : 'À améliorer'}
          iconCls="bg-teal-100 text-teal-700" />
      </div>

      {/* TontineScore */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base">Mon TontineScore</h2>
            <p className="text-xs text-gray-400 mt-0.5">Basé sur votre régularité de paiement</p>
          </div>
          <p className="text-3xl font-display font-bold text-primary-700">
            {scoreNum}<span className="text-base text-gray-400">/100</span>
          </p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={cn(
            'h-full rounded-full transition-all duration-700',
            scoreNum >= 80 ? 'bg-green-500' : scoreNum >= 60 ? 'bg-amber-400' : 'bg-red-400'
          )} style={{ width: `${scoreNum}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Peu fiable</span>
          <Link to="/score" className="text-xs text-primary-600 hover:underline">Voir le détail →</Link>
          <span className="text-xs text-gray-400">Excellent</span>
        </div>
      </div>

      {/* Mes cotisations */}
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
                    c.statut === 'payee'     ? 'bg-green-100' :
                    c.statut === 'en_retard' ? 'bg-red-100'   : 'bg-amber-100'
                  )}>
                    {c.statut === 'payee'
                      ? <RiCheckDoubleLine className="w-4 h-4 text-green-600" />
                      : c.statut === 'en_retard'
                      ? <RiAlertLine className="w-4 h-4 text-red-600" />
                      : <RiTimeLine className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Cycle {c.cycle_numero}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Échéance {formatDate(c.date_echeance)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{formatMontant(Number(c.montant_du) || 0)}</p>
                  <span className={cn('badge text-xs', getStatutColor(c.statut))}>{getStatutLabel(c.statut)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rejoindre une tontine existante ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base flex items-center gap-2">
              <RiSearchLine className="w-5 h-5 text-primary-600" />
              Tontines disponibles
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Rejoignez une tontine créée par un organisateur
            </p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative mb-4">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher par nom ou organisateur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {loadingDispo ? (
          <div className="flex items-center justify-center h-24">
            <RiLoader4Line className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : tontinesFiltrees.length === 0 ? (
          <div className="text-center py-8">
            <RiGroupLine className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {search
                ? 'Aucune tontine trouvée pour cette recherche.'
                : 'Aucune tontine disponible pour le moment.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tontinesFiltrees.map(t => {
              const orga = t.organisateur as any;
              const orgaNom = `${orga?.prenom ?? ''} ${orga?.nom ?? ''}`.trim();

              function getFrequenceLabel(frequence: any): string {
                if (!frequence && frequence !== 0) return '—';
                const f = String(frequence).toLowerCase();
                const map: Record<string, string> = {
                  jour: 'Quotidienne',
                  quotidien: 'Quotidienne',
                  quotidienne: 'Quotidienne',
                  hebdo: 'Hebdomadaire',
                  semaine: 'Hebdomadaire',
                  hebdomadaire: 'Hebdomadaire',
                  mensuel: 'Mensuelle',
                  mensuelle: 'Mensuelle',
                  mois: 'Mensuelle',
                  trimestriel: 'Trimestrielle',
                  trimestrielle: 'Trimestrielle',
                  semestriel: 'Semestrielle',
                  semestrielle: 'Semestrielle',
                  annuel: 'Annuelle',
                  annuelle: 'Annuelle',
                };
                if (map[f]) return map[f];
                const n = Number(frequence);
                if (!isNaN(n)) {
                  if (n === 1) return 'Quotidienne';
                  if (n === 7) return 'Hebdomadaire';
                  if (n >= 28 && n <= 31) return 'Mensuelle';
                  if (n >= 90 && n <= 92) return 'Trimestrielle';
                  if (n >= 180 && n <= 184) return 'Semestrielle';
                  if (n >= 365) return 'Annuelle';
                  return `${n} jours`;
                }
                return f.charAt(0).toUpperCase() + f.slice(1);
              }

              return (
                <div key={t.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-bold text-sm">{t.nom.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{t.nom}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        <span className="flex items-center gap-1">
                          <RiUserLine className="w-3 h-3 flex-shrink-0" />
                          {orgaNom || 'Organisateur'} ·{' '}
                          {formatMontant(t.montant_cotisation, t.devise as any)} ·{' '}
                          {getFrequenceLabel(t.frequence as any)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRejoindre(t.id)}
                    className="btn-primary btn-sm flex-shrink-0 ml-3"
                  >
                    Rejoindre
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal confirmation rejoindre */}
      {rejoindre && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
            {(() => {
              const t = disponibles.find(t => t.id === rejoindre);
              const orga = (t?.organisateur as any);
              const orgaNom = `${orga?.prenom ?? ''} ${orga?.nom ?? ''}`.trim();
              function getFrequenceLabel(frequence: any) {
                if (!frequence && frequence !== 0) return '—';
                // Accept common string codes or numbers
                const f = String(frequence).toLowerCase();
                const map: Record<string, string> = {
                  jour: 'Quotidienne',
                  quotidien: 'Quotidienne',
                  quotidienne: 'Quotidienne',
                  hebdo: 'Hebdomadaire',
                  semaine: 'Hebdomadaire',
                  hebdomadaire: 'Hebdomadaire',
                  mensuel: 'Mensuelle',
                  mensuelle: 'Mensuelle',
                  mois: 'Mensuelle',
                  trimestriel: 'Trimestrielle',
                  trimestrielle: 'Trimestrielle',
                  semestriel: 'Semestrielle',
                  semestrielle: 'Semestrielle',
                  annuel: 'Annuelle',
                  annuelle: 'Annuelle',
                };

                if (map[f]) return map[f];

                // If it's a number (e.g. days between cycles)
                const n = Number(frequence);
                if (!isNaN(n)) {
                  if (n === 1) return 'Quotidienne';
                  if (n === 7) return 'Hebdomadaire';
                  if (n >= 28 && n <= 31) return 'Mensuelle';
                  if (n >= 90 && n <= 92) return 'Trimestrielle';
                  if (n >= 180 && n <= 184) return 'Semestrielle';
                  if (n >= 365) return 'Annuelle';
                  return `${n} jours`;
                }

                // Fallback: capitalize first letter
                return f.charAt(0).toUpperCase() + f.slice(1);
              }

              return (
                <>
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="font-display font-bold text-gray-900 text-lg">
                      Rejoindre cette tontine ?
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t?.nom}
                    </p>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {[
                        { label: 'Organisateur', val: orgaNom || '—' },
                        { label: 'Cotisation', val: formatMontant(t?.montant_cotisation ?? 0, t?.devise as any) },
                        { label: 'Fréquence', val: getFrequenceLabel(t?.frequence as any) },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-gray-400">{label}</span>
                          <span className="font-semibold text-gray-800">{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs text-amber-700">
                        Votre demande sera envoyée à l'organisateur qui devra la valider avant que vous puissiez cotiser.
                      </p>
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button onClick={() => setRejoindre(null)} className="btn-outline flex-1">
                      Annuler
                    </button>
                    <button
                      onClick={() => handleRejoindre(rejoindre)}
                      disabled={joining}
                      className="btn-primary flex-1 justify-center"
                    >
                      {joining
                        ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                        : <RiCheckLine className="w-4 h-4" />}
                      Confirmer
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════
export function DashboardPage() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Promotion automatique membre → organisateur
  useEffect(() => {
    async function verifierPromotion() {
      if (!profile || profile.role_global !== 'membre') return;

      const { data } = await supabase
        .from('tontines')
        .select('id')
        .eq('organisateur_id', profile.id)
        .limit(1);

      if (data && data.length > 0) {
        await supabase
          .from('profiles')
          .update({ role_global: 'organisateur' })
          .eq('id', profile.id);
        await refreshProfile();
      }
    }
    verifierPromotion();
  }, [profile, refreshProfile]);

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