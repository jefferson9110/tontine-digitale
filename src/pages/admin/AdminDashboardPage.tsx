import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiStackLine, RiGroupLine, RiMoneyDollarCircleLine, RiBarChartLine,
  RiArrowUpLine, RiArrowDownLine, RiArrowRightLine, RiShieldCheckLine,
  RiAlertLine, RiUserAddLine, RiCheckDoubleLine, RiPulseLine,
} from 'react-icons/ri';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';

// ── Mock data ────────────────────────────────────
const STATS = {
  total_tontines:        24,
  tontines_actives:      18,
  tontines_delta:        +3,
  total_utilisateurs:    137,
  users_delta:           +12,
  volume_collecte:       14_750_000,
  volume_delta:          +8.4,
  taux_participation:    91,
  participation_delta:   +2.1,
  tontines_suspendues:   3,
  cotisations_retard:    7,
  nouveaux_users_semaine: 5,
};

const DATA_COLLECTE = [
  { mois: 'Jan', collecte: 950000,  membres: 98 },
  { mois: 'Fév', collecte: 1100000, membres: 105 },
  { mois: 'Mar', collecte: 1350000, membres: 112 },
  { mois: 'Avr', collecte: 1200000, membres: 110 },
  { mois: 'Mai', collecte: 1480000, membres: 119 },
  { mois: 'Jun', collecte: 1620000, membres: 128 },
  { mois: 'Jul', collecte: 1750000, membres: 137 },
];

const DATA_TONTINES = [
  { nom: 'Njangi Fonctionnaires', membres: 12, collecte: 2400000, taux: 96 },
  { nom: 'Tontine Amis Lycée',    membres: 8,  collecte: 480000,  taux: 100 },
  { nom: 'Épargne Famille',       membres: 6,  collecte: 370000,  taux: 88 },
  { nom: 'Diaspora Paris',        membres: 9,  collecte: 1620000, taux: 78 },
  { nom: 'Commerçantes Marché',   membres: 20, collecte: 800000,  taux: 95 },
];

const ACTIVITES_RECENTES = [
  { id: '1', type: 'user',     msg: 'Jean-Paul Mballa a créé un compte',               date: '2026-07-07T09:00:00' },
  { id: '2', type: 'tontine',  msg: 'Nouvelle tontine "Épargne Jeunes" créée',         date: '2026-07-07T08:30:00' },
  { id: '3', type: 'alerte',   msg: '3 cotisations en retard sur Njangi Fonctionnaires', date: '2026-07-06T18:00:00' },
  { id: '4', type: 'paiement', msg: 'Cycle 8 clôturé — 300 000 FCFA versés à Jean-Paul', date: '2026-07-06T14:00:00' },
  { id: '5', type: 'user',     msg: 'Solange Kamga a été suspendue (retards répétés)',  date: '2026-07-05T11:00:00' },
];

// ── Composant StatCard ───────────────────────────
function StatCard({ icon: Icon, label, value, delta, iconCls, sub }: {
  icon: React.ElementType; label: string; value: string;
  delta?: number; iconCls: string; sub?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconCls}`}><Icon className="w-5 h-5" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-display font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {delta !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs mt-1',
            delta >= 0 ? 'text-green-600' : 'text-red-500'
          )}>
            {delta >= 0
              ? <RiArrowUpLine className="w-3 h-3" />
              : <RiArrowDownLine className="w-3 h-3" />}
            {Math.abs(delta)}{typeof delta === 'number' && delta % 1 !== 0 ? '%' : ''} ce mois
          </div>
        )}
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Tooltip chart custom ─────────────────────────
function CustomTooltip({ active, payload, label }: any) {
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

// ── Page principale ─────────────────────────────
export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="page-header !mb-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
              <RiShieldCheckLine className="w-3.5 h-3.5 text-red-600" />
            </div>
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Administration</span>
          </div>
          <h1 className="page-title">Dashboard Admin</h1>
          <p className="page-subtitle">Vue globale de la plateforme TontineDigitale</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <RiPulseLine className="w-4 h-4 text-green-600 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Système opérationnel</span>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={RiStackLine}              label="Tontines actives"      value={`${STATS.tontines_actives}/${STATS.total_tontines}`} delta={STATS.tontines_delta}       iconCls="bg-primary-100 text-primary-700" />
        <StatCard icon={RiGroupLine}              label="Utilisateurs"          value={STATS.total_utilisateurs.toString()}               delta={STATS.users_delta}            iconCls="bg-blue-100 text-blue-700" />
        <StatCard icon={RiMoneyDollarCircleLine}  label="Volume collecté"       value={formatMontant(STATS.volume_collecte)}              delta={STATS.volume_delta}           iconCls="bg-amber-100 text-amber-700" />
        <StatCard icon={RiBarChartLine}           label="Taux participation"    value={`${STATS.taux_participation}%`}                    delta={STATS.participation_delta}    iconCls="bg-green-100 text-green-700" />
      </div>

      {/* Alertes rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Tontines suspendues', val: STATS.tontines_suspendues,    icon: RiAlertLine,       cls: 'bg-amber-50 border-amber-100 text-amber-700', link: '/admin/tontines' },
          { label: 'Cotisations en retard', val: STATS.cotisations_retard,   icon: RiMoneyDollarCircleLine, cls: 'bg-red-50 border-red-100 text-red-700', link: '/admin/tontines' },
          { label: 'Nouveaux users / semaine', val: STATS.nouveaux_users_semaine, icon: RiUserAddLine, cls: 'bg-blue-50 border-blue-100 text-blue-700', link: '/admin/utilisateurs' },
        ].map(({ label, val, icon: Icon, cls, link }) => (
          <Link key={label} to={link}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${cls} hover:shadow-sm transition-shadow`}>
            <Icon className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="text-2xl font-display font-bold">{val}</p>
              <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
            <RiArrowRightLine className="w-4 h-4 ml-auto opacity-60" />
          </Link>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Évolution collecte */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Volume collecté mensuel</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={DATA_COLLECTE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCollecte" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="collecte" name="Collecte" stroke="#16a34a"
                strokeWidth={2.5} fill="url(#gradCollecte)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Évolution membres */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Croissance des utilisateurs</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DATA_COLLECTE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="membres" name="Utilisateurs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top tontines + activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top tontines */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Top tontines</h2>
            <Link to="/admin/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {DATA_TONTINES.map((t, i) => (
              <div key={t.nom} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold text-gray-700 truncate">{t.nom}</p>
                    <span className="text-xs font-bold text-primary-700 ml-2 flex-shrink-0">
                      {t.taux}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full',
                      t.taux >= 90 ? 'bg-green-500' : t.taux >= 70 ? 'bg-amber-500' : 'bg-red-400'
                    )} style={{ width: `${t.taux}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.membres} membres · {formatMontant(t.collecte)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Activité récente</h2>
            <Link to="/admin/rapports" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              Journal <RiArrowRightLine className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {ACTIVITES_RECENTES.map(a => {
              const cfg = {
                user:     { cls: 'bg-blue-100 text-blue-600',   icon: RiUserAddLine },
                tontine:  { cls: 'bg-primary-100 text-primary-600', icon: RiStackLine },
                alerte:   { cls: 'bg-red-100 text-red-600',     icon: RiAlertLine },
                paiement: { cls: 'bg-green-100 text-green-600', icon: RiCheckDoubleLine },
              }[a.type] ?? { cls: 'bg-gray-100 text-gray-500', icon: RiAlertLine };
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.cls}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{a.msg}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(a.date, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accès rapides admin */}
      <div className="card">
        <h2 className="font-display font-bold text-gray-900 text-base mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Gérer les tontines',       icon: RiStackLine,     href: '/admin/tontines',     cls: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
            { label: 'Gérer les utilisateurs',   icon: RiGroupLine,     href: '/admin/utilisateurs', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { label: 'Rapports & Analyses',      icon: RiBarChartLine,  href: '/admin/rapports',     cls: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
            { label: 'Journal de sécurité',      icon: RiShieldCheckLine, href: '/admin/securite',   cls: 'bg-red-50 text-red-700 hover:bg-red-100' },
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