import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiGroupLine, RiMoneyDollarCircleLine,
  RiSettings3Line, RiChatLine, RiTrophyLine, RiAddCircleLine,
  RiEditLine, RiShareLine, RiMoreLine, RiCheckLine,
  RiAlertLine, RiCalendarLine, RiFilePdfLine, RiLoader4Line,
  RiUserAddLine, RiDeleteBinLine, RiShieldLine, RiStarLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, getFrequenceLabel, cn } from '../../lib/utils';
import type { Tontine, MembreTontine, Cotisation, TourBeneficiaire } from '../../types';

// ── Mock data ────────────────────────────────────
const MOCK_TONTINE: Tontine = {
  id: '1', nom: 'Njangi Fonctionnaires Yaoundé',
  description: 'Tontine mensuelle des fonctionnaires du ministère des finances. Objectif : soutien financier mutuel.',
  type: 'rotatif', statut: 'active', montant_cotisation: 25000, devise: 'XAF',
  frequence: 'mensuel', date_debut: '2026-01-01', nombre_membres_max: 12,
  cycle_actuel: 8, total_cycles: 12, organisateur_id: 'u1',
  penalite_retard: 5, delai_grace_jours: 3,
  regles: 'Cotisation due le 1er de chaque mois. Paiement via MTN MoMo ou Orange Money. Pénalité de 5% après 3 jours de retard.',
  lien_invitation: 'https://app.tontinedigitale.cm/rejoindre/dGVzdC0x',
  created_at: '2025-12-20', updated_at: '2026-07-01',
};

const MOCK_MEMBRES: (MembreTontine & { score: number })[] = [
  { id: 'm1', tontine_id: '1', user_id: 'u1', role: 'organisateur', statut: 'actif', ordre_beneficiaire: 1, a_beneficie: true,  date_adhesion: '2025-12-20', score: 98, user: { id: 'u1', email: 'marcelline@exemple.cm', nom: 'Tsague', prenom: 'Marcelline', role_global: 'organisateur', is_active: true, created_at: '', updated_at: '' } },
  { id: 'm2', tontine_id: '1', user_id: 'u2', role: 'tresorier',    statut: 'actif', ordre_beneficiaire: 2, a_beneficie: true,  date_adhesion: '2025-12-20', score: 92, user: { id: 'u2', email: 'patrick@exemple.fr',  nom: 'Nkoa',   prenom: 'Patrick',    role_global: 'membre', is_active: true, created_at: '', updated_at: '' } },
  { id: 'm3', tontine_id: '1', user_id: 'u3', role: 'membre',       statut: 'actif', ordre_beneficiaire: 3, a_beneficie: false, date_adhesion: '2026-01-05', score: 74, user: { id: 'u3', email: 'solange@exemple.cm',   nom: 'Kamga',  prenom: 'Solange',    role_global: 'membre', is_active: true, created_at: '', updated_at: '' } },
  { id: 'm4', tontine_id: '1', user_id: 'u4', role: 'membre',       statut: 'actif', ordre_beneficiaire: 4, a_beneficie: false, date_adhesion: '2026-01-05', score: 88, user: { id: 'u4', email: 'jpaul@exemple.cm',      nom: 'Mballa', prenom: 'Jean-Paul',  role_global: 'membre', is_active: true, created_at: '', updated_at: '' } },
  { id: 'm5', tontine_id: '1', user_id: 'u5', role: 'membre',       statut: 'suspendu', ordre_beneficiaire: 5, a_beneficie: false, date_adhesion: '2026-01-10', score: 41, user: { id: 'u5', email: 'armand@exemple.cm', nom: 'Biya',   prenom: 'Armand',     role_global: 'membre', is_active: true, created_at: '', updated_at: '' } },
];

const MOCK_COTISATIONS_CYCLE: Cotisation[] = [
  { id: 'c1', tontine_id: '1', membre_id: 'm1', user_id: 'u1', cycle_numero: 8, montant_du: 25000, montant_paye: 25000, penalite: 0, statut: 'payee', date_echeance: '2026-07-01', date_paiement: '2026-07-01', reference: 'MTN-001', created_at: '2026-06-25' },
  { id: 'c2', tontine_id: '1', membre_id: 'm2', user_id: 'u2', cycle_numero: 8, montant_du: 25000, montant_paye: 25000, penalite: 0, statut: 'payee', date_echeance: '2026-07-01', date_paiement: '2026-07-02', reference: 'OM-002',  created_at: '2026-06-25' },
  { id: 'c3', tontine_id: '1', membre_id: 'm3', user_id: 'u3', cycle_numero: 8, montant_du: 25000, montant_paye: 0,     penalite: 1250, statut: 'en_retard', date_echeance: '2026-06-30', created_at: '2026-06-25' },
  { id: 'c4', tontine_id: '1', membre_id: 'm4', user_id: 'u4', cycle_numero: 8, montant_du: 25000, montant_paye: 0,     penalite: 0, statut: 'en_attente', date_echeance: '2026-07-10', created_at: '2026-07-01' },
];

const MOCK_TOURS: TourBeneficiaire[] = [
  { id: 't1', tontine_id: '1', membre_id: 'm1', cycle_numero: 1, montant_total: 300000, date_prevue: '2026-01-31', date_versement: '2026-01-31', statut: 'verse' },
  { id: 't2', tontine_id: '1', membre_id: 'm2', cycle_numero: 2, montant_total: 300000, date_prevue: '2026-02-28', date_versement: '2026-02-28', statut: 'verse' },
  { id: 't3', tontine_id: '1', membre_id: 'm4', cycle_numero: 8, montant_total: 300000, date_prevue: '2026-08-31', statut: 'planifie' },
];

type Onglet = 'apercu' | 'membres' | 'cotisations' | 'beneficiaires' | 'regles';

// ── Score badge ──────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`badge ${color} font-mono`}>{score}</span>;
}

// ── Onglet Aperçu ────────────────────────────────
function OngletApercu({ tontine }: { tontine: Tontine }) {
  const totalCycle   = tontine.montant_cotisation * MOCK_MEMBRES.filter(m => m.statut === 'actif').length;
  const totalCollecte = totalCycle * tontine.cycle_actuel;
  const tauxPart     = Math.round((MOCK_COTISATIONS_CYCLE.filter(c => c.statut === 'payee').length / MOCK_COTISATIONS_CYCLE.length) * 100);
  const progression  = Math.round((tontine.cycle_actuel / tontine.total_cycles) * 100);

  return (
    <div className="space-y-5">
      {/* Stats clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total collecté', val: formatMontant(totalCollecte, tontine.devise), cls: 'bg-primary-100 text-primary-700' },
          { label: 'Taux participation', val: `${tauxPart}%`, cls: 'bg-green-100 text-green-700' },
          { label: 'Membres actifs', val: `${MOCK_MEMBRES.filter(m => m.statut === 'actif').length}/${tontine.nombre_membres_max}`, cls: 'bg-blue-100 text-blue-700' },
          { label: 'Pénalités cycle', val: formatMontant(MOCK_COTISATIONS_CYCLE.reduce((s, c) => s + c.penalite, 0), tontine.devise), cls: 'bg-red-100 text-red-700' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="card !p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-lg font-display font-bold mt-1 ${cls.split(' ')[1]}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Progression globale */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display font-bold text-gray-800">Progression de la tontine</h3>
          <span className="text-sm font-bold text-primary-600">{progression}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progression}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Cycle {tontine.cycle_actuel} en cours</span>
          <span>{tontine.total_cycles} cycles au total</span>
        </div>
      </div>

      {/* Infos tontine */}
      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-4">Informations</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Type', val: tontine.type === 'rotatif' ? 'Rotatif' : tontine.type === 'fixe' ? 'Fixe' : 'Enchères' },
            { label: 'Cotisation', val: formatMontant(tontine.montant_cotisation, tontine.devise) },
            { label: 'Fréquence', val: getFrequenceLabel(tontine.frequence) },
            { label: 'Date de début', val: formatDate(tontine.date_debut) },
            { label: 'Pénalité retard', val: tontine.penalite_retard > 0 ? `${tontine.penalite_retard}%` : 'Aucune' },
            { label: 'Délai de grâce', val: `${tontine.delai_grace_jours} jours` },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-400">{label}</dt>
              <dd className="text-sm font-semibold text-gray-800">{val}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Prochain bénéficiaire */}
      {MOCK_TOURS.find(t => t.statut === 'planifie') && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiTrophyLine className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Prochain bénéficiaire</p>
            <p className="font-display font-bold text-violet-900 text-base mt-0.5">
              {MOCK_MEMBRES.find(m => m.id === MOCK_TOURS.find(t => t.statut === 'planifie')?.membre_id)?.user?.prenom}{' '}
              {MOCK_MEMBRES.find(m => m.id === MOCK_TOURS.find(t => t.statut === 'planifie')?.membre_id)?.user?.nom}
            </p>
            <p className="text-xs text-violet-500 mt-0.5">
              Cycle {MOCK_TOURS.find(t => t.statut === 'planifie')?.cycle_numero} ·{' '}
              {formatMontant(MOCK_TOURS.find(t => t.statut === 'planifie')?.montant_total ?? 0, tontine.devise)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet Membres ───────────────────────────────
function OngletMembres({ isOrga }: { isOrga: boolean }) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(MOCK_TONTINE.lien_invitation ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Bouton inviter */}
      {isOrga && (
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowInvite(s => !s)} className="btn-primary">
            <RiUserAddLine className="w-4 h-4" /> Inviter par email
          </button>
          <button onClick={copyLink} className="btn-outline">
            <RiShareLine className="w-4 h-4" />
            {copied ? 'Lien copié !' : 'Copier le lien d\'invitation'}
          </button>
        </div>
      )}

      {/* Formulaire invitation */}
      {showInvite && (
        <div className="card animate-fade-in">
          <h3 className="font-semibold text-gray-800 mb-3">Inviter un membre</h3>
          <div className="flex gap-2">
            <input type="email" placeholder="email@exemple.com" value={email}
              onChange={e => setEmail(e.target.value)} className="input flex-1" />
            <button className="btn-primary">Inviter</button>
          </div>
        </div>
      )}

      {/* Liste membres */}
      <div className="card !p-0 overflow-hidden">
        {MOCK_MEMBRES.map((m, i) => (
          <div key={m.id} className={cn(
            'flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0',
            m.statut === 'suspendu' && 'opacity-60 bg-gray-50'
          )}>
            {/* Avatar */}
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-bold text-sm">
                {m.user?.prenom?.charAt(0)}{m.user?.nom?.charAt(0)}
              </span>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {m.user?.prenom} {m.user?.nom}
                </p>
                {m.role === 'organisateur' && (
                  <span className="badge badge-green text-xs">Organisateur</span>
                )}
                {m.role === 'tresorier' && (
                  <span className="badge badge-blue text-xs">Trésorier</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {m.a_beneficie ? '✓ A déjà bénéficié' : `Tour #${m.ordre_beneficiaire ?? '?'}`}
                {' · '}Depuis {formatDate(m.date_adhesion)}
              </p>
            </div>

            {/* Score */}
            <div className="text-center">
              <ScoreBadge score={m.score} />
              <p className="text-xs text-gray-400 mt-0.5">Score</p>
            </div>

            {/* Statut */}
            <span className={cn('badge hidden sm:inline-flex', getStatutColor(m.statut))}>
              {getStatutLabel(m.statut)}
            </span>

            {/* Actions orga */}
            {isOrga && m.role !== 'organisateur' && (
              <div className="flex gap-1">
                {m.statut === 'actif' ? (
                  <button title="Suspendre" className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                    <RiAlertLine className="w-4 h-4" />
                  </button>
                ) : (
                  <button title="Réactiver" className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                    <RiCheckLine className="w-4 h-4" />
                  </button>
                )}
                <button title="Exclure" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <RiDeleteBinLine className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Onglet Cotisations du cycle ──────────────────
function OngletCotisations({ isOrga, tontine }: { isOrga: boolean; tontine: Tontine }) {
  const payees    = MOCK_COTISATIONS_CYCLE.filter(c => c.statut === 'payee').length;
  const total     = MOCK_COTISATIONS_CYCLE.length;
  const collecte  = MOCK_COTISATIONS_CYCLE.reduce((s, c) => s + c.montant_paye, 0);

  return (
    <div className="space-y-4">
      {/* Résumé cycle */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary-700">{payees}/{total}</p>
          <p className="text-xs text-gray-400 mt-1">Payées</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-green-700">
            {Math.round((payees / total) * 100)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Taux</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-lg font-display font-bold text-gray-800">
            {formatMontant(collecte, tontine.devise)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Collecté</p>
        </div>
      </div>

      {/* Liste cotisations */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Cycle {tontine.cycle_actuel}</span>
          <span className="text-xs text-gray-400">Échéance {formatDate('2026-07-10')}</span>
        </div>
        {MOCK_COTISATIONS_CYCLE.map(c => {
          const membre = MOCK_MEMBRES.find(m => m.id === c.membre_id);
          return (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0">
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                c.statut === 'payee' ? 'bg-green-100' : c.statut === 'en_retard' ? 'bg-red-100' : 'bg-amber-100'
              )}>
                {c.statut === 'payee'
                  ? <RiCheckLine className="w-4 h-4 text-green-600" />
                  : c.statut === 'en_retard'
                  ? <RiAlertLine className="w-4 h-4 text-red-600" />
                  : <RiCalendarLine className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {membre?.user?.prenom} {membre?.user?.nom}
                </p>
                {c.reference && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{c.reference}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">{formatMontant(c.montant_du, tontine.devise)}</p>
                {c.penalite > 0 && (
                  <p className="text-xs text-red-500">+{formatMontant(c.penalite, tontine.devise)} pénalité</p>
                )}
              </div>
              <span className={cn('badge', getStatutColor(c.statut))}>
                {getStatutLabel(c.statut)}
              </span>
              {isOrga && c.statut !== 'payee' && (
                <button className="btn-primary btn-sm">Valider</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Onglet Bénéficiaires ─────────────────────────
function OngletBeneficiaires({ tontine }: { tontine: Tontine }) {
  return (
    <div className="space-y-4">
      <div className="card !p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Calendrier des tours</p>
        </div>
        {MOCK_MEMBRES.sort((a, b) => (a.ordre_beneficiaire ?? 99) - (b.ordre_beneficiaire ?? 99)).map(m => {
          const tour = MOCK_TOURS.find(t => t.membre_id === m.id);
          return (
            <div key={m.id} className={cn(
              'flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-0',
              tour?.statut === 'planifie' && 'bg-violet-50'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                m.a_beneficie ? 'bg-green-100 text-green-700' :
                tour?.statut === 'planifie' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
              )}>
                {m.ordre_beneficiaire ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {m.user?.prenom} {m.user?.nom}
                  </p>
                  {tour?.statut === 'planifie' && (
                    <span className="badge badge-purple text-xs">Prochain</span>
                  )}
                </div>
                {tour && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cycle {tour.cycle_numero} · {formatDate(tour.date_prevue)}
                  </p>
                )}
              </div>
              <div className="text-right">
                {tour ? (
                  <>
                    <p className="text-sm font-bold text-gray-800">
                      {formatMontant(tour.montant_total, tontine.devise)}
                    </p>
                    <span className={cn('badge', getStatutColor(tour.statut))}>
                      {getStatutLabel(tour.statut)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">À planifier</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Onglet Règles ────────────────────────────────
function OngletRegles({ tontine }: { tontine: Tontine }) {
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <RiShieldLine className="w-5 h-5 text-primary-600" />
          <h3 className="font-display font-bold text-gray-800">Règlement de la tontine</h3>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {tontine.regles || 'Aucun règlement défini.'}
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <RiCalendarLine className="w-3.5 h-3.5" />
          Créé le {formatDate(tontine.created_at)} · Horodaté et non modifiable
        </p>
      </div>
      <div className="card">
        <h3 className="font-display font-bold text-gray-800 mb-4">Paramètres financiers</h3>
        <dl className="space-y-3">
          {[
            { label: 'Pénalité de retard', val: tontine.penalite_retard > 0 ? `${tontine.penalite_retard}% du montant dû` : 'Aucune' },
            { label: 'Délai de grâce', val: `${tontine.delai_grace_jours} jour${tontine.delai_grace_jours > 1 ? 's' : ''} après l'échéance` },
            { label: 'Montant pénalité', val: tontine.penalite_retard > 0 ? formatMontant(tontine.montant_cotisation * tontine.penalite_retard / 100, tontine.devise) : '—' },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <dt className="text-sm text-gray-400">{label}</dt>
              <dd className="text-sm font-semibold text-gray-800">{val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function TontineDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [onglet, setOnglet] = useState<Onglet>('apercu');

  // TODO: remplacer par useTontine(id)
  const tontine = MOCK_TONTINE;
  const isOrga  = profile?.role_global === 'organisateur' || profile?.role_global === 'admin';

  const ONGLETS: { key: Onglet; label: string; icon: React.ElementType }[] = [
    { key: 'apercu',        label: 'Aperçu',        icon: RiMoneyDollarCircleLine },
    { key: 'membres',       label: 'Membres',        icon: RiGroupLine },
    { key: 'cotisations',   label: 'Cotisations',    icon: RiCalendarLine },
    { key: 'beneficiaires', label: 'Bénéficiaires',  icon: RiTrophyLine },
    { key: 'regles',        label: 'Règles',          icon: RiShieldLine },
  ];

  return (
    <div className="space-y-5">
      {/* Retour */}
      <Link to="/tontines" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <RiArrowLeftLine className="w-4 h-4" /> Retour aux tontines
      </Link>

      {/* Header tontine */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-display font-bold text-2xl">
              {tontine.nom.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display font-bold text-gray-900 text-xl">{tontine.nom}</h1>
              <span className={cn('badge', getStatutColor(tontine.statut))}>
                {getStatutLabel(tontine.statut)}
              </span>
            </div>
            {tontine.description && (
              <p className="text-sm text-gray-500 mb-2">{tontine.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <RiMoneyDollarCircleLine className="w-3.5 h-3.5" />
                {formatMontant(tontine.montant_cotisation, tontine.devise)} / {getFrequenceLabel(tontine.frequence)}
              </span>
              <span className="flex items-center gap-1">
                <RiGroupLine className="w-3.5 h-3.5" />
                {MOCK_MEMBRES.filter(m => m.statut === 'actif').length}/{tontine.nombre_membres_max} membres
              </span>
              <span className="flex items-center gap-1">
                <RiCalendarLine className="w-3.5 h-3.5" />
                Cycle {tontine.cycle_actuel}/{tontine.total_cycles}
              </span>
            </div>
          </div>
          {isOrga && (
            <div className="flex gap-2 flex-shrink-0">
              <button className="btn-outline btn-sm">
                <RiFilePdfLine className="w-4 h-4" /> Rapport
              </button>
              <Link to={`/tontines/${id}/modifier`} className="btn-outline btn-sm">
                <RiEditLine className="w-4 h-4" /> Modifier
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-gray-100 p-1 rounded-xl">
        {ONGLETS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setOnglet(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              onglet === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      <div className="animate-fade-in">
        {onglet === 'apercu'        && <OngletApercu tontine={tontine} />}
        {onglet === 'membres'       && <OngletMembres isOrga={isOrga} />}
        {onglet === 'cotisations'   && <OngletCotisations isOrga={isOrga} tontine={tontine} />}
        {onglet === 'beneficiaires' && <OngletBeneficiaires tontine={tontine} />}
        {onglet === 'regles'        && <OngletRegles tontine={tontine} />}
      </div>
    </div>
  );
}