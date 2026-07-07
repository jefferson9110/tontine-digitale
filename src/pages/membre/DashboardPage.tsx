import { Link } from 'react-router-dom';
import {
  RiGroupLine, RiMoneyDollarCircleLine, RiAddCircleLine,
  RiArrowRightLine, RiShieldCheckLine, RiBarChartLine,
  RiCalendarCheckLine, RiAlertLine, RiCheckDoubleLine,
  RiTimeLine, RiWalletLine, RiTrophyLine, RiStarLine,
  RiFileChartLine, RiUserLine, RiStackLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontant, formatDate, getStatutColor, getStatutLabel } from '../../lib/utils';
import type { UserRole } from '../../types';

// ═══════════════════════════════════════════════
//  MOCK DATA (à remplacer par hooks Supabase)
// ═══════════════════════════════════════════════

const MOCK_STATS_ADMIN = {
  total_tontines:       24,
  tontines_actives:     18,
  total_utilisateurs:   137,
  total_collecte:       14_750_000,
  taux_participation:   91,
  nouvelles_inscriptions: 12,
};

const MOCK_STATS_ORGA = {
  mes_tontines:         3,
  membres_total:        28,
  total_collecte:       3_250_000,
  taux_participation:   88,
  cotisations_retard:   2,
  prochain_beneficiaire: 'Solange K.',
};

const MOCK_STATS_MEMBRE = {
  tontines_actives:     2,
  cotisations_payees:   8,
  cotisations_dues:     1,
  mon_score:            84,
  prochain_tour:        'Cycle 9 — dans 12 jours',
  total_cotise:         200_000,
};

const MOCK_COTISATIONS_RECENTES = [
  { id: '1', membre: 'Marcelline T.', tontine: 'Njangi Fonctionnaires', montant: 25_000, statut: 'payee', date: '2026-07-01' },
  { id: '2', membre: 'Patrick N.',    tontine: 'Njangi Fonctionnaires', montant: 25_000, statut: 'payee', date: '2026-07-01' },
  { id: '3', membre: 'Solange K.',    tontine: 'Njangi Fonctionnaires', montant: 25_000, statut: 'en_retard', date: '2026-06-30' },
  { id: '4', membre: 'Jean-Paul M.',  tontine: 'Tontine Amis',         montant: 15_000, statut: 'en_attente', date: '2026-07-05' },
];

const MOCK_MES_COTISATIONS = [
  { id: '1', tontine: 'Njangi Fonctionnaires', montant: 25_000, statut: 'payee',     date_echeance: '2026-07-01', cycle: 8 },
  { id: '2', tontine: 'Tontine Amis',          montant: 15_000, statut: 'en_attente', date_echeance: '2026-07-10', cycle: 5 },
];

const MOCK_TONTINES_ORGA = [
  { id: '1', nom: 'Njangi Fonctionnaires', membres: 12, cycle: 8, total: 12, statut: 'active', collecte: 2_400_000 },
  { id: '2', nom: 'Tontine Amis Lycée',   membres: 8,  cycle: 4, total: 8,  statut: 'active', collecte: 480_000 },
  { id: '3', nom: 'Épargne Famille',      membres: 8,  cycle: 1, total: 12, statut: 'active', collecte: 370_000 },
];

const MOCK_ALERTES_ADMIN = [
  { id: '1', type: 'retard',    msg: '3 cotisations en retard sur Njangi Fonctionnaires', date: '2026-07-06' },
  { id: '2', type: 'nouveau',   msg: '5 nouvelles inscriptions cette semaine', date: '2026-07-05' },
  { id: '3', type: 'activite',  msg: 'Tontine "Épargne Famille" vient d\'être créée', date: '2026-07-04' },
];

// ═══════════════════════════════════════════════
//  COMPOSANTS PARTAGÉS
// ═══════════════════════════════════════════════

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  iconClass?: string;
}

function StatCard({ icon: Icon, label, value, sub, iconClass = 'bg-primary-100 text-primary-700' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-xl font-display font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  DASHBOARD ADMIN
// ═══════════════════════════════════════════════

function AdminDashboard({ prenom }: { prenom: string }) {
  const s = MOCK_STATS_ADMIN;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
            <RiShieldCheckLine className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Administration plateforme</span>
        </div>
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Bonjour {prenom} — Vue globale de TontineDigitale</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RiStackLine}       label="Tontines actives"      value={`${s.tontines_actives} / ${s.total_tontines}`}  iconClass="bg-primary-100 text-primary-700" />
        <StatCard icon={RiGroupLine}       label="Utilisateurs"          value={s.total_utilisateurs.toString()}                iconClass="bg-blue-100 text-blue-700" />
        <StatCard icon={RiWalletLine}      label="Volume total collecté" value={formatMontant(s.total_collecte)}               iconClass="bg-amber-100 text-amber-700" />
        <StatCard icon={RiBarChartLine}    label="Taux de participation" value={`${s.taux_participation}%`}                    iconClass="bg-green-100 text-green-700" />
        <StatCard icon={RiUserLine}        label="Nouvelles inscriptions" value={`+${s.nouvelles_inscriptions}`} sub="ce mois" iconClass="bg-violet-100 text-violet-700" />
        <StatCard icon={RiCheckDoubleLine} label="Santé plateforme"       value="Opérationnelle"                               iconClass="bg-emerald-100 text-emerald-700" />
      </div>

      {/* Alertes + Raccourcis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alertes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-base">Alertes récentes</h2>
            <span className="badge-red">{MOCK_ALERTES_ADMIN.length}</span>
          </div>
          <div className="space-y-3">
            {MOCK_ALERTES_ADMIN.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  a.type === 'retard' ? 'bg-red-100' : a.type === 'nouveau' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <RiAlertLine className={`w-3.5 h-3.5 ${
                    a.type === 'retard' ? 'text-red-600' : a.type === 'nouveau' ? 'text-blue-600' : 'text-green-600'
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{a.msg}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accès rapides */}
        <div className="card">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Accès rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Toutes les tontines', icon: RiStackLine, href: '/admin/tontines', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
              { label: 'Utilisateurs',        icon: RiGroupLine, href: '/admin/utilisateurs', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Rapports',            icon: RiFileChartLine, href: '/admin/rapports', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
              { label: 'Sécurité',            icon: RiShieldCheckLine, href: '/admin/securite', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
            ].map(({ label, icon: Icon, href, color }) => (
              <Link key={href} to={href} className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors cursor-pointer ${color}`}>
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Dernières cotisations */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900 text-base">Cotisations récentes</h2>
          <Link to="/admin/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
            Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Tontine</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COTISATIONS_RECENTES.map(c => (
                <tr key={c.id}>
                  <td className="font-medium text-gray-800">{c.membre}</td>
                  <td className="text-gray-500">{c.tontine}</td>
                  <td className="font-mono font-medium">{formatMontant(c.montant)}</td>
                  <td><span className={getStatutColor(c.statut)}>{getStatutLabel(c.statut)}</span></td>
                  <td className="text-gray-400 text-xs">{formatDate(c.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  DASHBOARD ORGANISATEUR
// ═══════════════════════════════════════════════

function OrgaDashboard({ prenom }: { prenom: string }) {
  const s = MOCK_STATS_ORGA;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={RiStackLine}         label="Mes tontines"          value={s.mes_tontines.toString()}             iconClass="bg-primary-100 text-primary-700" />
        <StatCard icon={RiGroupLine}         label="Membres au total"      value={s.membres_total.toString()}            iconClass="bg-blue-100 text-blue-700" />
        <StatCard icon={RiWalletLine}        label="Total collecté"        value={formatMontant(s.total_collecte)}       iconClass="bg-amber-100 text-amber-700" />
        <StatCard icon={RiBarChartLine}      label="Taux de participation" value={`${s.taux_participation}%`}            iconClass="bg-green-100 text-green-700" />
        <StatCard icon={RiAlertLine}         label="Cotisations en retard" value={s.cotisations_retard.toString()}       iconClass="bg-red-100 text-red-700" />
        <StatCard icon={RiTrophyLine}        label="Prochain bénéficiaire" value={s.prochain_beneficiaire} sub="Cycle 9" iconClass="bg-violet-100 text-violet-700" />
      </div>

      {/* CTA Créer tontine */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-display font-bold text-base">Créer une nouvelle tontine</p>
          <p className="text-primary-300 text-sm mt-0.5">Configurez les règles, invitez vos membres en quelques clics.</p>
        </div>
        <Link to="/tontines/creer" className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold flex-shrink-0">
          <RiAddCircleLine className="w-4 h-4" />
          Créer
        </Link>
      </div>

      {/* Mes tontines */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900 text-base">Mes tontines actives</h2>
          <Link to="/tontines" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
            Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {MOCK_TONTINES_ORGA.map(t => (
            <Link key={t.id} to={`/tontines/${t.id}`}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 font-display font-bold text-sm">
                    {t.nom.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-700">{t.nom}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.membres} membres · Cycle {t.cycle}/{t.total}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatMontant(t.collecte)}</p>
                <span className={`${getStatutColor(t.statut)} text-xs`}>{getStatutLabel(t.statut)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Cotisations récentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900 text-base">Cotisations à valider</h2>
          <span className="badge-yellow">{MOCK_COTISATIONS_RECENTES.filter(c => c.statut === 'en_attente' || c.statut === 'en_retard').length} en attente</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COTISATIONS_RECENTES.map(c => (
                <tr key={c.id}>
                  <td className="font-medium text-gray-800">{c.membre}</td>
                  <td className="font-mono font-medium">{formatMontant(c.montant)}</td>
                  <td><span className={getStatutColor(c.statut)}>{getStatutLabel(c.statut)}</span></td>
                  <td className="text-gray-400 text-xs">{formatDate(c.date)}</td>
                  <td>
                    {c.statut === 'en_attente' && (
                      <button className="btn-primary btn-sm">Valider</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  DASHBOARD MEMBRE
// ═══════════════════════════════════════════════

function MembreDashboard({ prenom }: { prenom: string }) {
  const s = MOCK_STATS_MEMBRE;

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
        <StatCard icon={RiGroupLine}        label="Tontines actives"    value={s.tontines_actives.toString()}          iconClass="bg-primary-100 text-primary-700" />
        <StatCard icon={RiCheckDoubleLine}   label="Cotisations payées"  value={`${s.cotisations_payees} cycles`}       iconClass="bg-green-100 text-green-700" />
        <StatCard icon={RiTimeLine}          label="À payer"             value={`${s.cotisations_dues} cotisation`}     iconClass={s.cotisations_dues > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'} />
        <StatCard icon={RiWalletLine}        label="Total cotisé"        value={formatMontant(s.total_cotise)}          iconClass="bg-amber-100 text-amber-700" />
        <StatCard icon={RiCalendarCheckLine} label="Prochain tour"       value={s.prochain_tour}                        iconClass="bg-violet-100 text-violet-700" />
        <StatCard icon={RiStarLine}          label="Mon TontineScore"    value={`${s.mon_score} / 100`} sub="Fiable"   iconClass="bg-teal-100 text-teal-700" />
      </div>

      {/* Score de fiabilité */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base">Mon TontineScore</h2>
            <p className="text-xs text-gray-400 mt-0.5">Basé sur votre régularité de paiement</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-bold text-primary-700">{s.mon_score}</p>
            <p className="text-xs text-gray-400">/ 100</p>
          </div>
        </div>
        {/* Barre de score */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-700"
            style={{ width: `${s.mon_score}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Peu fiable</span>
          <span className="text-xs text-gray-400">Excellent</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Paiements à temps', val: '8/9', color: 'text-green-700 bg-green-50' },
            { label: 'Cycles honorés',    val: '8',    color: 'text-blue-700 bg-blue-50' },
            { label: 'Pénalités reçues',  val: '0',    color: 'text-gray-700 bg-gray-50' },
          ].map(({ label, val, color }) => (
            <div key={label} className={`rounded-xl p-3 ${color}`}>
              <p className="text-lg font-display font-bold">{val}</p>
              <p className="text-xs mt-0.5 opacity-75">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mes cotisations à venir */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900 text-base">Mes prochaines cotisations</h2>
          <Link to="/cotisations" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
            Tout voir <RiArrowRightLine className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {MOCK_MES_COTISATIONS.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  c.statut === 'payee' ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {c.statut === 'payee'
                    ? <RiCheckDoubleLine className="w-4 h-4 text-green-600" />
                    : <RiTimeLine className="w-4 h-4 text-amber-600" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{c.tontine}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Cycle {c.cycle} · Échéance {formatDate(c.date_echeance)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-sm">{formatMontant(c.montant)}</p>
                <span className={`${getStatutColor(c.statut)} text-xs mt-0.5 inline-block`}>{getStatutLabel(c.statut)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejoindre une tontine */}
      <div className="bg-gradient-to-r from-teal-600 to-primary-700 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-display font-bold text-base">Rejoindre une tontine</p>
          <p className="text-primary-200 text-sm mt-0.5">Utilisez un lien d'invitation pour rejoindre un groupe.</p>
        </div>
        <Link to="/tontines" className="btn bg-white text-primary-700 hover:bg-primary-50 font-bold flex-shrink-0">
          Voir les invitations
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  COMPOSANT PRINCIPAL — switch sur le rôle
// ═══════════════════════════════════════════════

export function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const prenom = profile.prenom || profile.nom || 'Utilisateur';
  const role: UserRole = profile.role_global;

  switch (role) {
    case 'admin':
      return <AdminDashboard prenom={prenom} />;
    case 'organisateur':
      return <OrgaDashboard prenom={prenom} />;
    case 'membre':
    case 'tresorier':
    default:
      return <MembreDashboard prenom={prenom} />;
  }
}