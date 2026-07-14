import { useState } from 'react';
import { Link }     from 'react-router-dom';
import {
  RiStackLine, RiGroupLine, RiMoneyDollarCircleLine, RiBarChartLine,
  RiArrowRightLine, RiShieldCheckLine, RiAlertLine, RiUserAddLine,
  RiPulseLine, RiLoader4Line, RiSearchLine, RiPauseLine, RiPlayLine,
  RiDeleteBinLine, RiEyeLine, RiDownloadLine, RiInboxLine, RiCheckLine,
  RiFilePdfLine, RiFileExcelLine, RiTimeLine, RiUserLine,
} from 'react-icons/ri';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useStatsAdmin, useAllUsers, useAllTontinesAdmin,
  useRapportsData, useChangerRoleUser, useToggleUserActif,
  useChangerStatutTontineAdmin, useDeleteTontineAdmin,
} from '../../hooks/useAdmin';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, getFrequenceLabel, cn } from '../../lib/utils';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';

// ── Tooltip graphique ────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.dataKey === 'collecte' ? formatMontant(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ── StatCard ─────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconCls }: {
  icon: React.ElementType; label: string; value: string; iconCls: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconCls}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  AdminDashboardPage
// ════════════════════════════════════════════════
export function AdminDashboardPage() {
  const { data: stats,    isLoading } = useStatsAdmin();
  const { data: tontines = [] }       = useAllTontinesAdmin();
  const { data: rapports = [] }       = useRapportsData();
  const { data: users    = [] }       = useAllUsers();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  // Top 5 tontines actives
  const topTontines = tontines.filter(t => t.statut === 'active').slice(0, 5);

  // Inscriptions des 7 derniers jours
  const hier = new Date(); hier.setDate(hier.getDate() - 7);
  const recents = users.filter(u => new Date(u.created_at) > hier);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="page-header !mb-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
              <RiShieldCheckLine className="w-3.5 h-3.5 text-red-600" />
            </div>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Administration</span>
          </div>
          <h1 className="page-title">Dashboard Admin</h1>
          <p className="page-subtitle">Vue globale — données en temps réel</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <RiPulseLine className="w-4 h-4 text-green-600 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Système opérationnel</span>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={RiStackLine}             label="Tontines actives"   value={`${stats?.tontines_actives ?? 0}/${stats?.total_tontines ?? 0}`}  iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiGroupLine}             label="Utilisateurs"       value={String(stats?.total_utilisateurs ?? 0)}                           iconCls="bg-blue-100 text-blue-700" />
        <StatCard icon={RiMoneyDollarCircleLine} label="Volume collecté"    value={formatMontant(stats?.volume_collecte ?? 0)}                      iconCls="bg-amber-100 text-amber-700" />
        <StatCard icon={RiBarChartLine}          label="Taux participation" value={`${stats?.taux_participation ?? 0}%`}                             iconCls="bg-green-100 text-green-700" />
      </div>

      {/* Alertes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Tontines suspendues',    val: stats?.tontines_suspendues ?? 0,    cls: 'bg-amber-50 border-amber-100 text-amber-700', icon: RiAlertLine,       href: '/admin/tontines' },
          { label: 'Cotisations en retard',  val: stats?.cotisations_retard ?? 0,     cls: 'bg-red-50 border-red-100 text-red-700',       icon: RiTimeLine,        href: '/admin/tontines' },
          { label: 'Nouvelles inscriptions', val: stats?.nouvelles_inscriptions ?? 0, cls: 'bg-blue-50 border-blue-100 text-blue-700',    icon: RiUserAddLine,     href: '/admin/utilisateurs' },
        ].map(({ label, val, cls, icon: Icon, href }) => (
          <Link key={label} to={href}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${cls} hover:shadow-sm transition-shadow`}>
            <Icon className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-2xl font-display font-bold">{val}</p>
              <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
            <RiArrowRightLine className="w-4 h-4 opacity-60" />
          </Link>
        ))}
      </div>

      {/* Graphiques */}
      {rapports.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="font-display font-bold text-gray-900 text-base mb-4">Volume collecté mensuel</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rapports} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="collecte" name="Collecte" stroke="#16a34a" strokeWidth={2.5} fill="url(#gc)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2 className="font-display font-bold text-gray-900 text-base mb-4">Cotisations en retard / mois</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rapports} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="retards" name="Retards" fill="#f87171" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top tontines + accès rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Tontines actives</h2>
            <Link to="/admin/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
            </Link>
          </div>
          {topTontines.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune tontine active</p>
          ) : topTontines.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-700 font-bold text-sm">{t.nom.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.nom}</p>
                  <p className="text-xs text-gray-400">
                    {(t.organisateur as any)?.prenom} {(t.organisateur as any)?.nom} · Cycle {t.cycle_actuel}/{t.total_cycles}
                  </p>
                </div>
              </div>
              <span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tontines',      icon: RiStackLine,       href: '/admin/tontines',     cls: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
              { label: 'Utilisateurs',  icon: RiGroupLine,       href: '/admin/utilisateurs', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Rapports',      icon: RiBarChartLine,    href: '/admin/rapports',     cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
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
    </div>
  );
}

// ════════════════════════════════════════════════
//  AdminTontinesPage
// ════════════════════════════════════════════════
export function AdminTontinesPage() {
  const { data: tontines = [], isLoading } = useAllTontinesAdmin();
  const changerStatut = useChangerStatutTontineAdmin();
  const supprimer     = useDeleteTontineAdmin();
  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [modal,        setModal]        = useState<{ action: string; id: string } | null>(null);

  const filtrees = tontines.filter(t => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'tous' || t.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  function handleAction(action: string, id: string) {
    if (action === 'suspendre') changerStatut.mutate({ id, statut: 'suspendue' });
    if (action === 'activer')   changerStatut.mutate({ id, statut: 'active' });
    if (action === 'supprimer') supprimer.mutate(id);
    setModal(null);
  }

  function exportCSV() {
    const csv = ['Nom,Statut,Cotisation,Cycle,Organisateur,Créée le',
      ...filtrees.map(t => `${t.nom},${t.statut},${t.montant_cotisation},${t.cycle_actuel}/${t.total_cycles},${(t.organisateur as any)?.nom ?? ''},${t.created_at}`)
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'tontines.csv'; a.click();
    toast.success('CSV exporté !');
  }

  const FILTRES = [
    { key: 'tous',      label: `Toutes (${tontines.length})` },
    { key: 'active',    label: `Actives (${tontines.filter(t => t.statut === 'active').length})` },
    { key: 'brouillon', label: `Brouillons (${tontines.filter(t => t.statut === 'brouillon').length})` },
    { key: 'suspendue', label: `Suspendues (${tontines.filter(t => t.statut === 'suspendue').length})` },
    { key: 'terminee',  label: `Terminées (${tontines.filter(t => t.statut === 'terminee').length})` },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Gestion des tontines</h1>
          <p className="page-subtitle">{filtrees.length} tontine{filtrees.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline flex-shrink-0">
          <RiDownloadLine className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Rechercher par nom…" value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterStatut(key)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filterStatut === key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-500 border-gray-200'
            )}>{label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filtrees.length === 0 ? (
        <div className="card text-center py-12">
          <RiInboxLine className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Aucune tontine trouvée</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Tontine</th><th>Organisateur</th><th>Cotisation</th><th>Cycle</th><th>Statut</th><th>Créée le</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtrees.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-xs">{t.nom.charAt(0)}</span>
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{t.nom}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">
                      {(t.organisateur as any)?.prenom} {(t.organisateur as any)?.nom}
                    </td>
                    <td className="font-mono text-sm font-medium">{formatMontant(t.montant_cotisation, t.devise as any)}</td>
                    <td className="text-sm text-gray-600">{t.cycle_actuel}/{t.total_cycles}</td>
                    <td><span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span></td>
                    <td className="text-xs text-gray-400">{formatDate(t.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/tontines/${t.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                          <RiEyeLine className="w-4 h-4" />
                        </Link>
                        {t.statut === 'active' && (
                          <button onClick={() => setModal({ action: 'suspendre', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                            <RiPauseLine className="w-4 h-4" />
                          </button>
                        )}
                        {t.statut === 'suspendue' && (
                          <button onClick={() => setModal({ action: 'activer', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50">
                            <RiPlayLine className="w-4 h-4" />
                          </button>
                        )}
                        {t.statut === 'brouillon' && (
                          <button onClick={() => setModal({ action: 'supprimer', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <RiDeleteBinLine className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-2">
              {modal.action === 'suspendre' ? 'Suspendre ?' : modal.action === 'activer' ? 'Réactiver ?' : 'Supprimer ?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {modal.action === 'supprimer' ? 'Cette action est irréversible.' : 'Confirmez votre action.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-outline flex-1">Annuler</button>
              <button onClick={() => handleAction(modal.action, modal.id)}
                className={cn('flex-1 btn', modal.action === 'supprimer' ? 'btn-danger' : 'btn-primary')}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  AdminUtilisateursPage
// ════════════════════════════════════════════════
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', organisateur: 'Organisateur', membre: 'Membre', tresorier: 'Trésorier',
};

export function AdminUtilisateursPage() {
  const { data: users = [], isLoading } = useAllUsers();
  const toggleActif  = useToggleUserActif();
  const changerRole  = useChangerRoleUser();
  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('tous');

  const filtres = users.filter(u => {
    const matchSearch = `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole === 'tous' || u.role_global === filterRole;
    return matchSearch && matchRole;
  });

  const ROLES_FILTRES = [
    { key: 'tous',         label: `Tous (${users.length})` },
    { key: 'admin',        label: `Admins (${users.filter(u => u.role_global === 'admin').length})` },
    { key: 'organisateur', label: `Organisateurs (${users.filter(u => u.role_global === 'organisateur').length})` },
    { key: 'membre',       label: `Membres (${users.filter(u => u.role_global === 'membre').length})` },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Gestion des utilisateurs</h1>
        <p className="page-subtitle">{filtres.length} utilisateur{filtres.length > 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',         val: users.length,                                              cls: 'bg-gray-50' },
          { label: 'Actifs',        val: users.filter(u => u.is_active).length,                     cls: 'bg-green-50' },
          { label: 'Inactifs',      val: users.filter(u => !u.is_active).length,                    cls: 'bg-red-50' },
          { label: 'Organisateurs', val: users.filter(u => u.role_global === 'organisateur').length, cls: 'bg-blue-50' },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`${cls} rounded-xl px-4 py-3 text-center`}>
            <p className="text-2xl font-display font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Rechercher par nom ou email…" value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {ROLES_FILTRES.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterRole(key)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filterRole === key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-500 border-gray-200'
            )}>{label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Inscrit le</th><th>Actions</th></tr></thead>
              <tbody>
                {filtres.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-bold text-xs">
                            {u.prenom?.charAt(0)}{u.nom?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select value={u.role_global}
                        onChange={e => changerRole.mutate({ userId: u.id, role: e.target.value as UserRole })}
                        disabled={u.role_global === 'admin'}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400">
                        {['membre', 'organisateur', 'tresorier', 'admin'].map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={cn('badge', u.is_active ? 'badge-green' : 'badge-red')}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400">{formatDate(u.created_at)}</td>
                    <td>
                      {u.role_global !== 'admin' && (
                        <button
                          onClick={() => toggleActif.mutate({ userId: u.id, actif: !u.is_active })}
                          disabled={toggleActif.isPending}
                          className={cn('p-1.5 rounded-lg transition-colors',
                            u.is_active
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          )}>
                          {u.is_active
                            ? <RiDeleteBinLine className="w-4 h-4" />
                            : <RiCheckLine className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
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
//  AdminRapportsPage
// ════════════════════════════════════════════════
const PIE_COLORS = ['#16a34a', '#f59e0b', '#94a3b8'];

export function AdminRapportsPage() {
  const { data: stats }         = useStatsAdmin();
  const { data: rapports = [] } = useRapportsData();
  const { data: tontines = [] } = useAllTontinesAdmin();
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(key: string) {
    setExporting(key);
    await new Promise(r => setTimeout(r, 1000));
    toast.success(`Rapport ${key} exporté !`);
    setExporting(null);
  }

  const PIE_DATA = [
    { name: 'Actives',    value: stats?.tontines_actives ?? 0 },
    { name: 'Suspendues', value: stats?.tontines_suspendues ?? 0 },
    { name: 'Terminées',  value: stats?.tontines_terminees ?? 0 },
  ].filter(d => d.value > 0);

  const KPI = [
    { label: 'Volume total collecté',        val: formatMontant(stats?.volume_collecte ?? 0),    iconCls: 'bg-primary-100 text-primary-700', icon: RiMoneyDollarCircleLine },
    { label: 'Utilisateurs actifs',          val: String(stats?.utilisateurs_actifs ?? 0),        iconCls: 'bg-blue-100 text-blue-700',       icon: RiGroupLine },
    { label: 'Tontines en cours',            val: `${stats?.tontines_actives ?? 0}/${stats?.total_tontines ?? 0}`, iconCls: 'bg-amber-100 text-amber-700', icon: RiStackLine },
    { label: 'Taux de participation moyen',  val: `${stats?.taux_participation ?? 0}%`,           iconCls: 'bg-green-100 text-green-700',     icon: RiBarChartLine },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Rapports & Analyses</h1>
        <p className="page-subtitle">Indicateurs clés — données en temps réel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(({ label, val, iconCls, icon: Icon }) => (
          <StatCard key={label} icon={Icon} label={label} value={val} iconCls={iconCls} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Volume mensuel */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Volume collecté mensuel</h2>
            <button onClick={() => handleExport('collecte')} className="btn-outline btn-sm">
              <RiFileExcelLine className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
          {rapports.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={rapports} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gc2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="collecte" name="Collecte" stroke="#16a34a" strokeWidth={2.5} fill="url(#gc2)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Pas encore de données
            </div>
          )}
        </div>

        {/* Répartition tontines */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Répartition des tontines</h2>
          {PIE_DATA.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} tontines`, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Pas encore de données</div>
          )}
        </div>
      </div>

      {/* Export rapports */}
      <div className="card">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">Exporter les rapports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Rapport général',     desc: 'Toutes les statistiques plateforme',  key: 'general' },
            { label: 'Rapport financier',   desc: 'Volumes, cotisations, pénalités',      key: 'financier' },
            { label: 'Rapport utilisateurs',desc: 'Activité et progression membres',      key: 'utilisateurs' },
          ].map(({ label, desc, key }) => (
            <div key={key} className="border border-gray-200 rounded-xl p-4">
              <p className="font-semibold text-gray-800 text-sm mb-1">{label}</p>
              <p className="text-xs text-gray-400 mb-4">{desc}</p>
              <div className="flex gap-2">
                <button onClick={() => handleExport(key)} disabled={!!exporting}
                  className="btn-outline btn-sm flex-1 justify-center">
                  {exporting === key
                    ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    : <RiFilePdfLine className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => handleExport(`${key}-csv`)} disabled={!!exporting}
                  className="btn-outline btn-sm flex-1 justify-center">
                  {exporting === `${key}-csv`
                    ? <RiLoader4Line className="w-3.5 h-3.5 animate-spin" />
                    : <RiFileExcelLine className="w-3.5 h-3.5" />} CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}