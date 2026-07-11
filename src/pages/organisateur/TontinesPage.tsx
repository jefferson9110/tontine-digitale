import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiAddCircleLine, RiSearchLine, RiGroupLine,
  RiArrowRightLine, RiGridLine, RiListCheck,
  RiLoader4Line, RiInboxLine,
} from 'react-icons/ri';
import { useAuth }     from '../../contexts/AuthContext';
import { useTontines } from '../../hooks/useTontines';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, getFrequenceLabel, cn } from '../../lib/utils';
import type { Tontine } from '../../types';

type ViewMode    = 'grid' | 'list';
type FilterStatut = 'tous' | 'active' | 'suspendue' | 'terminee' | 'brouillon';

// ── Carte tontine (grille) ───────────────────────
function TontineCard({ tontine, membresCount }: { tontine: Tontine; membresCount: number }) {
  const progression = tontine.total_cycles > 0
    ? Math.round((tontine.cycle_actuel / tontine.total_cycles) * 100) : 0;

  return (
    <Link to={`/tontines/${tontine.id}`} className="card-hover group flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-primary-700 font-display font-bold text-lg">{tontine.nom.charAt(0)}</span>
        </div>
        <span className={cn('badge', getStatutColor(tontine.statut))}>{getStatutLabel(tontine.statut)}</span>
      </div>
      <div>
        <h3 className="font-display font-bold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-1">{tontine.nom}</h3>
        {tontine.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tontine.description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">Cotisation</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{formatMontant(tontine.montant_cotisation, tontine.devise)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">Fréquence</p>
          <p className="text-sm font-bold text-gray-800 mt-0.5">{getFrequenceLabel(tontine.frequence)}</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400">Progression</span>
          <span className="text-xs font-semibold text-gray-600">Cycle {tontine.cycle_actuel}/{tontine.total_cycles}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all',
            tontine.statut === 'active' ? 'bg-primary-500' :
            tontine.statut === 'terminee' ? 'bg-gray-400' : 'bg-amber-400'
          )} style={{ width: `${progression}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-400">
          <RiGroupLine className="w-3.5 h-3.5" />
          <span className="text-xs">{membresCount}/{tontine.nombre_membres_max} membres</span>
        </div>
        <div className="flex items-center gap-1 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-medium">Voir</span>
          <RiArrowRightLine className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

// ── Ligne tontine (liste) ────────────────────────
function TontineRow({ tontine, membresCount }: { tontine: Tontine; membresCount: number }) {
  const progression = tontine.total_cycles > 0
    ? Math.round((tontine.cycle_actuel / tontine.total_cycles) * 100) : 0;

  return (
    <Link to={`/tontines/${tontine.id}`}
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 group">
      <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-primary-700 font-bold text-sm">{tontine.nom.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-700 truncate">{tontine.nom}</p>
        <p className="text-xs text-gray-400 mt-0.5">{getFrequenceLabel(tontine.frequence)} · {membresCount}/{tontine.nombre_membres_max} membres</p>
      </div>
      <div className="hidden sm:block text-right w-32">
        <p className="text-sm font-bold text-gray-800">{formatMontant(tontine.montant_cotisation, tontine.devise)}</p>
        <p className="text-xs text-gray-400">/ cotisation</p>
      </div>
      <div className="hidden md:block w-28">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">Cycle</span>
          <span className="text-xs font-medium text-gray-600">{tontine.cycle_actuel}/{tontine.total_cycles}</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progression}%` }} />
        </div>
      </div>
      <span className={cn('badge hidden sm:inline-flex', getStatutColor(tontine.statut))}>{getStatutLabel(tontine.statut)}</span>
      <RiArrowRightLine className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ── Page principale ──────────────────────────────
export function TontinesPage() {
  const { profile } = useAuth();
  const { data: tontines = [], isLoading } = useTontines(profile?.id);

  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [viewMode,     setViewMode]     = useState<ViewMode>('grid');

  const tontinesFiltrees = tontines.filter(t => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'tous' || t.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const counts = {
    tous:      tontines.length,
    active:    tontines.filter(t => t.statut === 'active').length,
    suspendue: tontines.filter(t => t.statut === 'suspendue').length,
    terminee:  tontines.filter(t => t.statut === 'terminee').length,
    brouillon: tontines.filter(t => t.statut === 'brouillon').length,
  };

  const FILTRES: { key: FilterStatut; label: string }[] = [
    { key: 'tous',      label: `Toutes (${counts.tous})` },
    { key: 'active',    label: `Actives (${counts.active})` },
    { key: 'suspendue', label: `Suspendues (${counts.suspendue})` },
    { key: 'terminee',  label: `Terminées (${counts.terminee})` },
    { key: 'brouillon', label: `Brouillons (${counts.brouillon})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Mes tontines</h1>
          <p className="page-subtitle">{tontinesFiltrees.length} tontine{tontinesFiltrees.length > 1 ? 's' : ''} trouvée{tontinesFiltrees.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/tontines/creer" className="btn-primary flex-shrink-0">
          <RiAddCircleLine className="w-4 h-4" /> Créer une tontine
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="search" placeholder="Rechercher une tontine…" value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-all',
            viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600')}>
            <RiGridLine className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={cn('p-2 rounded-lg transition-all',
            viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600')}>
            <RiListCheck className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterStatut(key)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filterStatut === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            )}>{label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : tontinesFiltrees.length === 0 ? (
        <div className="empty-state">
          <RiInboxLine className="empty-state-icon" />
          <p className="font-semibold text-gray-500">Aucune tontine trouvée</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Essayez un autre terme.' : 'Créez votre première tontine.'}
          </p>
          {!search && (
            <Link to="/tontines/creer" className="btn-primary mt-4">
              <RiAddCircleLine className="w-4 h-4" /> Créer une tontine
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tontinesFiltrees.map(t => (
            <TontineCard key={t.id} tontine={t} membresCount={t.nombre_membres_max} />
          ))}
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          {tontinesFiltrees.map(t => (
            <TontineRow key={t.id} tontine={t} membresCount={t.nombre_membres_max} />
          ))}
        </div>
      )}
    </div>
  );
}
