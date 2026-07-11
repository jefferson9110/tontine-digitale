import { useState } from 'react';
import {
  RiTrophyLine, RiCheckDoubleLine, RiTimeLine,
  RiMoneyDollarCircleLine, RiThumbUpLine, RiInboxLine,
  RiLoader4Line, RiStarLine, RiCalendarLine,
} from 'react-icons/ri';
import { useAuth }                from '../../contexts/AuthContext';
import { useMesTours,
         useToursBeneficiaires,
         useVotes, useVoter }     from '../../hooks/useBeneficiaires';
import { useTontines }            from '../../hooks/useTontines';
import { formatMontant, formatDate, cn } from '../../lib/utils';
import type { TourBeneficiaire }  from '../../types';

type FiltreStatut = 'tous' | 'planifie' | 'verse' | 'reporte';

// ── Carte tour ───────────────────────────────────
function TourCard({ tour, userId }: { tour: any; userId: string }) {
  const estMoi      = tour.membre?.user_id === userId;
  const tauxColl    = tour.membres_total > 0
    ? Math.round((tour.membres_paye / tour.membres_total) * 100) : 0;

  return (
    <div className={cn(
      'card relative overflow-hidden',
      estMoi && 'ring-2 ring-primary-400',
      tour.statut === 'verse' && 'opacity-80'
    )}>
      {estMoi && (
        <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
          Mon tour
        </div>
      )}
      <div className="flex items-start gap-3 mb-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
          tour.statut === 'verse' ? 'bg-green-100 text-green-700' :
          estMoi ? 'bg-primary-100 text-primary-700' : 'bg-violet-100 text-violet-700'
        )}>
          {tour.statut === 'verse'
            ? <RiCheckDoubleLine className="w-6 h-6" />
            : `${tour.membre?.user?.prenom?.charAt(0) ?? ''}${tour.membre?.user?.nom?.charAt(0) ?? ''}`
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-gray-900 truncate">
            {tour.membre?.user?.prenom} {tour.membre?.user?.nom}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Cycle {tour.cycle_numero}</p>
        </div>
        <span className={cn('badge',
          tour.statut === 'verse' ? 'badge-green' :
          tour.statut === 'reporte' ? 'badge-yellow' : 'badge-purple'
        )}>
          {tour.statut === 'verse' ? 'Versé' : tour.statut === 'planifie' ? 'Planifié' : 'Reporté'}
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-gray-400 mb-1">Cagnotte</p>
        <p className="text-2xl font-display font-bold text-gray-900">
          {formatMontant(tour.montant_total, tour.tontine?.devise ?? 'XAF')}
        </p>
      </div>

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
      </div>
    </div>
  );
}

// ── Carte vote ───────────────────────────────────
function VoteCard({ tontineId, cycleCible, userId }: {
  tontineId:  string;
  cycleCible: number;
  userId:     string;
}) {
  const { data: votes = [] }  = useVotes(tontineId, cycleCible);
  const voter                 = useVoter();

  const monVote    = votes.find(v => v.votant_id === userId);
  const candidats  = votes.reduce<Record<string, { nom: string; count: number }>>((acc, v) => {
    const id = v.candidat_id;
    if (!acc[id]) acc[id] = { nom: `${(v as any).candidat?.prenom ?? ''} ${(v as any).candidat?.nom ?? ''}`, count: 0 };
    acc[id].count++;
    return acc;
  }, {});

  const total = votes.length;

  return (
    <div className="card border-2 border-primary-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
        <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
          Vote ouvert — Cycle {cycleCible}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {Object.entries(candidats).map(([id, { nom, count }]) => {
          const pct     = total > 0 ? Math.round((count / total) * 100) : 0;
          const monChoix = monVote?.candidat_id === id;
          return (
            <div key={id} className={cn('rounded-xl p-3 border transition-all',
              monChoix ? 'border-primary-400 bg-primary-50' : 'border-gray-100 bg-gray-50'
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-800">{nom}</span>
                  {monChoix && <span className="badge badge-blue text-xs">Mon vote</span>}
                </div>
                <span className="text-sm font-bold text-gray-700">{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className={cn('h-full rounded-full',
                  monChoix ? 'bg-primary-500' : 'bg-gray-400'
                )} style={{ width: `${pct}%` }} />
              </div>
              {!monVote && (
                <button
                  onClick={() => voter.mutate({ tontineId, votantId: userId, candidatId: id, cycleCible })}
                  disabled={voter.isPending}
                  className="btn-outline btn-sm w-full justify-center mt-1"
                >
                  <RiThumbUpLine className="w-3.5 h-3.5" />
                  Voter pour {nom.split(' ')[0]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {monVote && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3">
          <RiCheckDoubleLine className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Vote enregistré</span>
        </div>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────
export function BeneficiairesPage() {
  const { profile }  = useAuth();
  const { data: tontines = [] } = useTontines(profile?.id);
  const { data: tours = [], isLoading } = useMesTours(profile?.id);

  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous');

  const toursFiltres = tours.filter(t =>
    filtreStatut === 'tous' || t.statut === filtreStatut
  );

  const monTour    = tours.find(t => t.membre?.user_id === profile?.id && t.statut === 'planifie');
  const totalVerse = tours.filter(t => t.statut === 'verse').reduce((s, t) => s + t.montant_total, 0);

  const FILTRES: { key: FiltreStatut; label: string }[] = [
    { key: 'tous',     label: `Tous (${tours.length})` },
    { key: 'planifie', label: `À venir (${tours.filter(t => t.statut === 'planifie').length})` },
    { key: 'verse',    label: `Versés (${tours.filter(t => t.statut === 'verse').length})` },
    { key: 'reporte',  label: `Reportés (${tours.filter(t => t.statut === 'reporte').length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Bénéficiaires</h1>
        <p className="page-subtitle">Calendrier des tours et votes</p>
      </div>

      {/* Mon prochain tour */}
      {monTour && (
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <RiTrophyLine className="w-7 h-7 text-secondary-400" />
          </div>
          <div className="flex-1">
            <p className="text-primary-300 text-xs font-semibold uppercase tracking-wide mb-1">Votre prochain tour</p>
            <p className="text-white font-display font-bold text-lg">
              {formatMontant(monTour.montant_total)}
            </p>
            <p className="text-primary-300 text-sm mt-0.5">
              Cycle {monTour.cycle_numero} · Prévu le {formatDate(monTour.date_prevue)}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-violet-100 text-violet-700"><RiTrophyLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">Planifiés</p>
            <p className="text-xl font-display font-bold text-gray-900">{tours.filter(t => t.statut === 'planifie').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-700"><RiCheckDoubleLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">Versés</p>
            <p className="text-xl font-display font-bold text-gray-900">{tours.filter(t => t.statut === 'verse').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-700"><RiMoneyDollarCircleLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">Total versé</p>
            <p className="text-lg font-display font-bold text-gray-900">{formatMontant(totalVerse)}</p>
          </div>
        </div>
      </div>

      {/* Votes ouverts par tontine */}
      {tontines.length > 0 && profile && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-gray-900 text-base flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            Votes en cours
          </h2>
          {tontines
            .filter(t => t.statut === 'active')
            .map(t => (
              <VoteCard key={t.id} tontineId={t.id}
                cycleCible={t.cycle_actuel + 1}
                userId={profile.id} />
            ))
          }
        </div>
      )}

      {/* Calendrier */}
      <div>
        <h2 className="font-display font-bold text-gray-900 text-base mb-3">Calendrier des tours</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
          {FILTRES.map(({ key, label }) => (
            <button key={key} onClick={() => setFiltreStatut(key)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                filtreStatut === key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'
              )}>{label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : toursFiltres.length === 0 ? (
          <div className="empty-state">
            <RiInboxLine className="empty-state-icon" />
            <p className="font-semibold text-gray-500">Aucun tour trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toursFiltres.map(t => (
              <TourCard key={t.id} tour={t} userId={profile?.id ?? ''} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}