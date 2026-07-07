import { useState } from 'react';
import {
  RiTrophyLine, RiCheckDoubleLine, RiTimeLine,
  RiGroupLine, RiCalendarLine, RiMoneyDollarCircleLine,
  RiThumbUpLine, RiThumbDownLine, RiInboxLine,
  RiFilterLine, RiStarLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontant, formatDate, cn } from '../../lib/utils';

// ── Types locaux ─────────────────────────────────
interface TourVM {
  id: string;
  tontine_nom: string;
  tontine_id: string;
  beneficiaire_nom: string;
  beneficiaire_initiales: string;
  cycle_numero: number;
  total_cycles: number;
  montant_total: number;
  devise: 'XAF' | 'EUR' | 'USD';
  date_prevue: string;
  date_versement?: string;
  statut: 'verse' | 'planifie' | 'reporte';
  est_moi: boolean;
  membres_total: number;
  membres_paye: number;
}

interface VoteVM {
  id: string;
  tontine_nom: string;
  cycle_cible: number;
  candidats: { id: string; nom: string; score: number; votes: number }[];
  mon_vote?: string;
  date_limite: string;
  total_votants: number;
  a_vote: number;
}

// ── Mock data ────────────────────────────────────
const MOCK_TOURS: TourVM[] = [
  {
    id: 't1', tontine_nom: 'Njangi Fonctionnaires', tontine_id: '1',
    beneficiaire_nom: 'Marcelline Tsague', beneficiaire_initiales: 'MT',
    cycle_numero: 1, total_cycles: 12, montant_total: 300000, devise: 'XAF',
    date_prevue: '2026-01-31', date_versement: '2026-01-31', statut: 'verse',
    est_moi: false, membres_total: 12, membres_paye: 12,
  },
  {
    id: 't2', tontine_nom: 'Njangi Fonctionnaires', tontine_id: '1',
    beneficiaire_nom: 'Patrick Nkoa', beneficiaire_initiales: 'PN',
    cycle_numero: 2, total_cycles: 12, montant_total: 300000, devise: 'XAF',
    date_prevue: '2026-02-28', date_versement: '2026-02-28', statut: 'verse',
    est_moi: false, membres_total: 12, membres_paye: 12,
  },
  {
    id: 't8', tontine_nom: 'Njangi Fonctionnaires', tontine_id: '1',
    beneficiaire_nom: 'Jean-Paul Mballa', beneficiaire_initiales: 'JM',
    cycle_numero: 8, total_cycles: 12, montant_total: 300000, devise: 'XAF',
    date_prevue: '2026-08-31', statut: 'planifie',
    est_moi: false, membres_total: 12, membres_paye: 9,
  },
  {
    id: 't9', tontine_nom: 'Njangi Fonctionnaires', tontine_id: '1',
    beneficiaire_nom: 'Moi (Solange K.)', beneficiaire_initiales: 'SK',
    cycle_numero: 9, total_cycles: 12, montant_total: 300000, devise: 'XAF',
    date_prevue: '2026-09-30', statut: 'planifie',
    est_moi: true, membres_total: 12, membres_paye: 0,
  },
  {
    id: 'ta1', tontine_nom: 'Tontine Amis Lycée', tontine_id: '2',
    beneficiaire_nom: 'Cécile Atanga', beneficiaire_initiales: 'CA',
    cycle_numero: 3, total_cycles: 8, montant_total: 120000, devise: 'XAF',
    date_prevue: '2026-06-10', date_versement: '2026-06-10', statut: 'verse',
    est_moi: false, membres_total: 8, membres_paye: 8,
  },
  {
    id: 'ta2', tontine_nom: 'Tontine Amis Lycée', tontine_id: '2',
    beneficiaire_nom: 'Jean-Paul Mballa', beneficiaire_initiales: 'JM',
    cycle_numero: 4, total_cycles: 8, montant_total: 120000, devise: 'XAF',
    date_prevue: '2026-07-10', statut: 'planifie',
    est_moi: false, membres_total: 8, membres_paye: 5,
  },
];

const MOCK_VOTES: VoteVM[] = [
  {
    id: 'v1', tontine_nom: 'Njangi Fonctionnaires',
    cycle_cible: 10,
    candidats: [
      { id: 'c1', nom: 'Armand Biya',     score: 41, votes: 2 },
      { id: 'c2', nom: 'Solange Kamga',   score: 74, votes: 5 },
      { id: 'c3', nom: 'Cécile Atanga',   score: 88, votes: 4 },
    ],
    mon_vote: undefined,
    date_limite: '2026-08-15',
    total_votants: 12,
    a_vote: 11,
  },
];

type FiltreStatut = 'tous' | 'planifie' | 'verse' | 'reporte';

// ── Carte tour bénéficiaire ───────────────────────
function TourCard({ tour }: { tour: TourVM }) {
  const tauxColl = Math.round((tour.membres_paye / tour.membres_total) * 100);

  return (
    <div className={cn(
      'card relative overflow-hidden',
      tour.est_moi && 'ring-2 ring-primary-400',
      tour.statut === 'verse' && 'opacity-80'
    )}>
      {/* Bandeau "Mon tour" */}
      {tour.est_moi && (
        <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
          Mon tour
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
          tour.statut === 'verse'   ? 'bg-green-100 text-green-700' :
          tour.est_moi              ? 'bg-primary-100 text-primary-700' :
                                      'bg-violet-100 text-violet-700'
        )}>
          {tour.statut === 'verse'
            ? <RiCheckDoubleLine className="w-6 h-6" />
            : tour.beneficiaire_initiales
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-gray-900 truncate">{tour.beneficiaire_nom}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tour.tontine_nom}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn('badge',
            tour.statut === 'verse'   ? 'badge-green' :
            tour.statut === 'reporte' ? 'badge-yellow' : 'badge-purple'
          )}>
            {tour.statut === 'verse' ? 'Versé' : tour.statut === 'planifie' ? 'Planifié' : 'Reporté'}
          </span>
        </div>
      </div>

      {/* Montant */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-gray-400 mb-1">Cagnotte du cycle {tour.cycle_numero}</p>
        <p className="text-2xl font-display font-bold text-gray-900">
          {formatMontant(tour.montant_total, tour.devise)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {tour.membres_total} membres × {formatMontant(tour.montant_total / tour.membres_total, tour.devise)}
        </p>
      </div>

      {/* Infos */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <RiCalendarLine className="w-4 h-4" />
            {tour.statut === 'verse' ? 'Versé le' : 'Prévu le'}
          </span>
          <span className="font-semibold text-gray-800">
            {formatDate(tour.date_versement ?? tour.date_prevue)}
          </span>
        </div>

        {tour.statut !== 'verse' && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Collecté</span>
              <span className="font-semibold text-gray-800">
                {tour.membres_paye}/{tour.membres_total} membres ({tauxColl}%)
              </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', tauxColl === 100 ? 'bg-green-500' : 'bg-primary-500')}
                style={{ width: `${tauxColl}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Carte vote ───────────────────────────────────
function VoteCard({ vote, onVote }: { vote: VoteVM; onVote: (voteId: string, candidatId: string) => void }) {
  const totalVotes = vote.candidats.reduce((s, c) => s + c.votes, 0);
  const sorted = [...vote.candidats].sort((a, b) => b.votes - a.votes);

  return (
    <div className="card border-2 border-primary-100">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RiGroupLine className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Vote ouvert</span>
          </div>
          <h3 className="font-display font-bold text-gray-900">{vote.tontine_nom}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Ordre des bénéficiaires — Cycle {vote.cycle_cible} ·{' '}
            {vote.a_vote}/{vote.total_votants} ont voté
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">Date limite</p>
          <p className="text-sm font-semibold text-amber-700">{formatDate(vote.date_limite)}</p>
        </div>
      </div>

      {/* Candidats */}
      <div className="space-y-3 mb-4">
        {sorted.map(c => {
          const pct = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
          const estMonVote = vote.mon_vote === c.id;
          return (
            <div key={c.id} className={cn(
              'rounded-xl p-3 border transition-all',
              estMonVote ? 'border-primary-400 bg-primary-50' : 'border-gray-100 bg-gray-50'
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-800">{c.nom}</span>
                  <span className={cn('badge text-xs',
                    c.score >= 80 ? 'badge-green' : c.score >= 60 ? 'badge-yellow' : 'badge-red'
                  )}>
                    <RiStarLine className="w-3 h-3" /> Score {c.score}
                  </span>
                  {estMonVote && <span className="badge badge-blue text-xs">Mon vote</span>}
                </div>
                <span className="text-sm font-bold text-gray-700">{pct}% ({c.votes})</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={cn('h-full rounded-full transition-all',
                  estMonVote ? 'bg-primary-500' : 'bg-gray-400'
                )} style={{ width: `${pct}%` }} />
              </div>
              {!vote.mon_vote && (
                <button
                  onClick={() => onVote(vote.id, c.id)}
                  className="btn-outline btn-sm w-full justify-center mt-1"
                >
                  <RiThumbUpLine className="w-3.5 h-3.5" />
                  Voter pour {c.nom.split(' ')[0]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {vote.mon_vote && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3">
          <RiCheckDoubleLine className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Vous avez voté · Résultats à la clôture</span>
        </div>
      )}
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function BeneficiairesPage() {
  const { profile } = useAuth();
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous');
  const [votes, setVotes] = useState(MOCK_VOTES);

  function handleVote(voteId: string, candidatId: string) {
    setVotes(prev => prev.map(v =>
      v.id === voteId ? { ...v, mon_vote: candidatId, a_vote: v.a_vote + 1 } : v
    ));
  }

  const FILTRES: { key: FiltreStatut; label: string }[] = [
    { key: 'tous',     label: `Tous (${MOCK_TOURS.length})` },
    { key: 'planifie', label: `À venir (${MOCK_TOURS.filter(t => t.statut === 'planifie').length})` },
    { key: 'verse',    label: `Versés (${MOCK_TOURS.filter(t => t.statut === 'verse').length})` },
    { key: 'reporte',  label: `Reportés (${MOCK_TOURS.filter(t => t.statut === 'reporte').length})` },
  ];

  const toursFiltres = MOCK_TOURS.filter(t =>
    filtreStatut === 'tous' || t.statut === filtreStatut
  );

  // Stats
  const monTour   = MOCK_TOURS.find(t => t.est_moi && t.statut === 'planifie');
  const totalVerse = MOCK_TOURS.filter(t => t.statut === 'verse').reduce((s, t) => s + t.montant_total, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="page-header">
        <h1 className="page-title">Bénéficiaires</h1>
        <p className="page-subtitle">Calendrier des tours et votes démocratiques</p>
      </div>

      {/* Mon prochain tour */}
      {monTour && (
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiTrophyLine className="w-7 h-7 text-secondary-400" />
          </div>
          <div className="flex-1">
            <p className="text-primary-300 text-xs font-semibold uppercase tracking-wide mb-1">
              Votre prochain tour
            </p>
            <p className="text-white font-display font-bold text-lg">
              {formatMontant(monTour.montant_total, monTour.devise)}
            </p>
            <p className="text-primary-300 text-sm mt-0.5">
              {monTour.tontine_nom} · Cycle {monTour.cycle_numero} · Prévu le {formatDate(monTour.date_prevue)}
            </p>
          </div>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-violet-100 text-violet-700">
            <RiTrophyLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Tours planifiés</p>
            <p className="text-xl font-display font-bold text-gray-900">
              {MOCK_TOURS.filter(t => t.statut === 'planifie').length}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-700">
            <RiCheckDoubleLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Tours versés</p>
            <p className="text-xl font-display font-bold text-gray-900">
              {MOCK_TOURS.filter(t => t.statut === 'verse').length}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-700">
            <RiMoneyDollarCircleLine className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total versé</p>
            <p className="text-lg font-display font-bold text-gray-900">
              {formatMontant(totalVerse)}
            </p>
          </div>
        </div>
      </div>

      {/* Votes ouverts */}
      {votes.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-gray-900 text-base flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            Votes en cours
          </h2>
          {votes.map(v => (
            <VoteCard key={v.id} vote={v} onVote={handleVote} />
          ))}
        </div>
      )}

      {/* Filtres */}
      <div>
        <h2 className="font-display font-bold text-gray-900 text-base mb-3">Calendrier des tours</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
          {FILTRES.map(({ key, label }) => (
            <button key={key} onClick={() => setFiltreStatut(key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                filtreStatut === key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              )}>
              {label}
            </button>
          ))}
        </div>

        {toursFiltres.length === 0 ? (
          <div className="empty-state">
            <RiInboxLine className="empty-state-icon" />
            <p className="font-semibold text-gray-500">Aucun tour trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toursFiltres.map(t => <TourCard key={t.id} tour={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}