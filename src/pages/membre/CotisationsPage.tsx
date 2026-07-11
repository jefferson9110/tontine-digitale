import { useState } from 'react';
import {
  RiMoneyDollarCircleLine, RiSearchLine, RiCheckLine,
  RiTimeLine, RiAlertLine, RiDownloadLine, RiCalendarLine,
  RiLoader4Line, RiInboxLine, RiArrowUpLine, RiArrowDownLine,
} from 'react-icons/ri';
import { useAuth }                                        from '../../contexts/AuthContext';
import { useCotisations, useMesCotisations,
         useValiderCotisation, useResumeCotisations }     from '../../hooks/useCotisations';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';
import type { Cotisation } from '../../types';
import toast from 'react-hot-toast';

type FilterStatut = 'tous' | 'payee' | 'en_attente' | 'en_retard' | 'partiellement_payee';
type SortField    = 'date_echeance' | 'montant_du';
type SortDir      = 'asc' | 'desc';

// ── Modal validation ─────────────────────────────
function ModalValidation({
  cotisation, validePar, onClose,
}: {
  cotisation: Cotisation & { user?: any; tontine?: any };
  validePar:  string;
  onClose:    () => void;
}) {
  const [reference, setReference] = useState('');
  const valider = useValiderCotisation();

  async function handle() {
    await valider.mutateAsync({
      cotisationId: cotisation.id,
      montantPaye:  cotisation.montant_du + cotisation.penalite,
      reference:    reference || undefined,
      validePar,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900 text-lg">Valider la cotisation</h2>
          <p className="text-sm text-gray-500 mt-1">
            {cotisation.user?.prenom} {cotisation.user?.nom}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant dû</span>
              <span className="font-bold text-gray-800">{formatMontant(cotisation.montant_du)}</span>
            </div>
            {cotisation.penalite > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-500">Pénalité</span>
                <span className="font-bold text-red-600">+{formatMontant(cotisation.penalite)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2">
              <span className="text-gray-700">Total</span>
              <span className="text-primary-700">{formatMontant(cotisation.montant_du + cotisation.penalite)}</span>
            </div>
          </div>
          <div>
            <label className="label">Référence de paiement</label>
            <input type="text" placeholder="Ex: MTN-20260706-001"
              value={reference} onChange={e => setReference(e.target.value)} className="input" />
            <p className="text-xs text-gray-400 mt-1">Numéro de transaction Mobile Money</p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Annuler</button>
          <button onClick={handle} disabled={valider.isPending} className="btn-primary flex-1">
            {valider.isPending ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiCheckLine className="w-4 h-4" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Résumé ───────────────────────────────────────
function Resume({ tontineId }: { tontineId?: string }) {
  const { data } = useResumeCotisations(tontineId);
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total dû',     val: formatMontant(data.total_du),     icon: RiMoneyDollarCircleLine, cls: 'bg-gray-100 text-gray-700' },
        { label: 'Total payé',   val: formatMontant(data.total_paye),   icon: RiCheckLine,             cls: 'bg-green-100 text-green-700' },
        { label: 'En retard',    val: `${data.en_retard} cotisation${data.en_retard > 1 ? 's' : ''}`, icon: RiAlertLine, cls: 'bg-red-100 text-red-700' },
        { label: 'En attente',   val: `${data.en_attente} cotisation${data.en_attente > 1 ? 's' : ''}`, icon: RiTimeLine, cls: 'bg-amber-100 text-amber-700' },
      ].map(({ label, val, icon: Icon, cls }) => (
        <div key={label} className="stat-card">
          <div className={`stat-icon ${cls}`}><Icon className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="font-display font-bold text-gray-900 text-base leading-tight mt-0.5">{val}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page principale ──────────────────────────────
export function CotisationsPage() {
  const { profile } = useAuth();
  const isOrga = profile?.role_global === 'organisateur' || profile?.role_global === 'admin';

  // Pour l'orga → toutes les cotisations de ses tontines
  // Pour le membre → ses propres cotisations
  const { data: mesCots = [],  isLoading: loadingMembre } = useMesCotisations(
    !isOrga ? profile?.id : undefined
  );

  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [sortField,    setSortField]    = useState<SortField>('date_echeance');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');
  const [selected,     setSelected]     = useState<typeof mesCots[0] | null>(null);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <RiArrowUpLine className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <RiArrowUpLine className="w-3 h-3 text-primary-600" />
      : <RiArrowDownLine className="w-3 h-3 text-primary-600" />;
  }

  const cotisations = mesCots
    .filter(c => {
      const tontineNom = (c as any).tontine?.nom ?? '';
      const matchSearch =
        tontineNom.toLowerCase().includes(search.toLowerCase()) ||
        (c.reference ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatut = filterStatut === 'tous' || c.statut === filterStatut;
      return matchSearch && matchStatut;
    })
    .sort((a, b) => {
      const va = sortField === 'date_echeance' ? a.date_echeance : String(a.montant_du);
      const vb = sortField === 'date_echeance' ? b.date_echeance : String(b.montant_du);
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function exportCSV() {
    const headers = ['Tontine', 'Cycle', 'Montant dû', 'Payé', 'Pénalité', 'Statut', 'Échéance', 'Référence'];
    const rows = cotisations.map(c => [
      (c as any).tontine?.nom ?? '—', c.cycle_numero,
      c.montant_du, c.montant_paye, c.penalite,
      getStatutLabel(c.statut), c.date_echeance, c.reference ?? '',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `cotisations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const FILTRES: { key: FilterStatut; label: string }[] = [
    { key: 'tous',                label: 'Toutes' },
    { key: 'payee',               label: 'Payées' },
    { key: 'en_attente',         label: 'En attente' },
    { key: 'en_retard',          label: 'En retard' },
    { key: 'partiellement_payee', label: 'Partielles' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Cotisations</h1>
          <p className="page-subtitle">{cotisations.length} cotisation{cotisations.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline flex-shrink-0">
          <RiDownloadLine className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <Resume />

      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Rechercher par tontine ou référence…"
          value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
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

      {loadingMembre ? (
        <div className="flex items-center justify-center h-40">
          <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : cotisations.length === 0 ? (
        <div className="empty-state">
          <RiInboxLine className="empty-state-icon" />
          <p className="font-semibold text-gray-500">Aucune cotisation trouvée</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tontine</th>
                  <th>Cycle</th>
                  <th>
                    <button onClick={() => toggleSort('montant_du')} className="flex items-center gap-1 hover:text-primary-600">
                      Montant <SortIcon field="montant_du" />
                    </button>
                  </th>
                  <th>Pénalité</th>
                  <th>Statut</th>
                  <th>
                    <button onClick={() => toggleSort('date_echeance')} className="flex items-center gap-1 hover:text-primary-600">
                      Échéance <SortIcon field="date_echeance" />
                    </button>
                  </th>
                  <th>Référence</th>
                  {isOrga && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {cotisations.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium text-gray-700 text-xs">{(c as any).tontine?.nom ?? '—'}</td>
                    <td><span className="badge-gray">#{c.cycle_numero}</span></td>
                    <td className="font-mono font-semibold text-gray-800">{formatMontant(c.montant_du)}</td>
                    <td>
                      {c.penalite > 0
                        ? <span className="text-red-600 font-medium text-xs">+{formatMontant(c.penalite)}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td><span className={cn('badge', getStatutColor(c.statut))}>{getStatutLabel(c.statut)}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <RiCalendarLine className="w-3.5 h-3.5" />
                        {formatDate(c.date_echeance)}
                      </div>
                    </td>
                    <td>
                      {c.reference
                        ? <span className="font-mono text-xs text-gray-500">{c.reference}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    {isOrga && (
                      <td>
                        {(c.statut === 'en_attente' || c.statut === 'en_retard' || c.statut === 'partiellement_payee') && (
                          <button onClick={() => setSelected(c)} className="btn-primary btn-sm">Valider</button>
                        )}
                        {c.statut === 'payee' && (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <RiCheckLine className="w-3.5 h-3.5" /> Validé
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && profile && (
        <ModalValidation
          cotisation={selected}
          validePar={profile.id}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
