import { useState } from 'react';
import {
  RiMoneyDollarCircleLine, RiSearchLine, RiFilterLine,
  RiCheckLine, RiTimeLine, RiAlertLine, RiDownloadLine,
  RiCalendarLine, RiLoader4Line, RiInboxLine,
  RiArrowUpLine, RiArrowDownLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';
import type { Cotisation } from '../../types';

// ── Mock data ────────────────────────────────────
const MOCK_COTISATIONS: (Cotisation & { membre_nom: string; tontine_nom: string })[] = [
  { id: '1', tontine_id: '1', membre_id: 'm1', user_id: 'u1', cycle_numero: 8, montant_du: 25000, montant_paye: 25000, penalite: 0, statut: 'payee', date_echeance: '2026-07-01', date_paiement: '2026-07-01', reference: 'MTN-20260701-001', created_at: '2026-06-25', membre_nom: 'Marcelline T.', tontine_nom: 'Njangi Fonctionnaires' },
  { id: '2', tontine_id: '1', membre_id: 'm2', user_id: 'u2', cycle_numero: 8, montant_du: 25000, montant_paye: 25000, penalite: 0, statut: 'payee', date_echeance: '2026-07-01', date_paiement: '2026-07-02', reference: 'OM-20260702-002', created_at: '2026-06-25', membre_nom: 'Patrick N.', tontine_nom: 'Njangi Fonctionnaires' },
  { id: '3', tontine_id: '1', membre_id: 'm3', user_id: 'u3', cycle_numero: 8, montant_du: 25000, montant_paye: 0, penalite: 1250, statut: 'en_retard', date_echeance: '2026-06-30', created_at: '2026-06-25', membre_nom: 'Solange K.', tontine_nom: 'Njangi Fonctionnaires' },
  { id: '4', tontine_id: '2', membre_id: 'm4', user_id: 'u4', cycle_numero: 4, montant_du: 15000, montant_paye: 0, penalite: 0, statut: 'en_attente', date_echeance: '2026-07-10', created_at: '2026-07-01', membre_nom: 'Jean-Paul M.', tontine_nom: 'Tontine Amis Lycée' },
  { id: '5', tontine_id: '2', membre_id: 'm5', user_id: 'u5', cycle_numero: 4, montant_du: 15000, montant_paye: 15000, penalite: 0, statut: 'payee', date_echeance: '2026-07-10', date_paiement: '2026-07-03', reference: 'MTN-20260703-005', created_at: '2026-07-01', membre_nom: 'Cécile A.', tontine_nom: 'Tontine Amis Lycée' },
  { id: '6', tontine_id: '1', membre_id: 'm6', user_id: 'u6', cycle_numero: 8, montant_du: 25000, montant_paye: 10000, penalite: 0, statut: 'partiellement_payee', date_echeance: '2026-07-01', created_at: '2026-06-25', membre_nom: 'Armand B.', tontine_nom: 'Njangi Fonctionnaires' },
  { id: '7', tontine_id: '3', membre_id: 'm7', user_id: 'u7', cycle_numero: 2, montant_du: 50000, montant_paye: 50000, penalite: 0, statut: 'payee', date_echeance: '2026-04-15', date_paiement: '2026-04-12', reference: 'VIR-20260412-007', created_at: '2026-04-01', membre_nom: 'Papa Tenkam', tontine_nom: 'Épargne Famille' },
];

type FilterStatut = 'tous' | 'payee' | 'en_attente' | 'en_retard' | 'partiellement_payee';
type SortField = 'date_echeance' | 'montant_du' | 'membre_nom';
type SortDir = 'asc' | 'desc';

// ── Résumé financier ─────────────────────────────
function ResumeCotisations({ cotisations }: { cotisations: typeof MOCK_COTISATIONS }) {
  const totalDu     = cotisations.reduce((s, c) => s + c.montant_du + c.penalite, 0);
  const totalPaye   = cotisations.reduce((s, c) => s + c.montant_paye, 0);
  const enRetard    = cotisations.filter(c => c.statut === 'en_retard').length;
  const enAttente   = cotisations.filter(c => c.statut === 'en_attente').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total dû', val: formatMontant(totalDu), icon: RiMoneyDollarCircleLine, cls: 'bg-gray-100 text-gray-700' },
        { label: 'Total payé', val: formatMontant(totalPaye), icon: RiCheckLine, cls: 'bg-green-100 text-green-700' },
        { label: 'En retard', val: `${enRetard} cotisation${enRetard > 1 ? 's' : ''}`, icon: RiAlertLine, cls: 'bg-red-100 text-red-700' },
        { label: 'En attente', val: `${enAttente} cotisation${enAttente > 1 ? 's' : ''}`, icon: RiTimeLine, cls: 'bg-amber-100 text-amber-700' },
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

// ── Modal validation ─────────────────────────────
function ModalValidation({
  cotisation, onClose, onValidate,
}: {
  cotisation: typeof MOCK_COTISATIONS[0];
  onClose: () => void;
  onValidate: (ref: string) => void;
}) {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // simuler appel API
    onValidate(reference);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-display font-bold text-gray-900 text-lg">Valider la cotisation</h2>
          <p className="text-sm text-gray-500 mt-1">{cotisation.membre_nom} · {cotisation.tontine_nom}</p>
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
              <span className="text-gray-700">Total à payer</span>
              <span className="text-primary-700">{formatMontant(cotisation.montant_du + cotisation.penalite)}</span>
            </div>
          </div>
          <div>
            <label className="label">Référence de paiement</label>
            <input
              type="text"
              placeholder="Ex: MTN-20260706-001"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">Numéro de transaction Mobile Money ou virement</p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Annuler</button>
          <button onClick={handle} disabled={loading} className="btn-primary flex-1">
            {loading ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiCheckLine className="w-4 h-4" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function CotisationsPage() {
  const { profile } = useAuth();
  const isOrga = profile?.role_global === 'organisateur' || profile?.role_global === 'admin';

  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [sortField,    setSortField]    = useState<SortField>('date_echeance');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');
  const [selected,     setSelected]     = useState<typeof MOCK_COTISATIONS[0] | null>(null);

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

  // Filtrage + tri
  const cotisations = MOCK_COTISATIONS
    .filter(c => {
      const matchSearch =
        c.membre_nom.toLowerCase().includes(search.toLowerCase()) ||
        c.tontine_nom.toLowerCase().includes(search.toLowerCase()) ||
        (c.reference ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatut = filterStatut === 'tous' || c.statut === filterStatut;
      return matchSearch && matchStatut;
    })
    .sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortField === 'date_echeance') { va = a.date_echeance; vb = b.date_echeance; }
      if (sortField === 'montant_du')    { va = a.montant_du;    vb = b.montant_du; }
      if (sortField === 'membre_nom')    { va = a.membre_nom;    vb = b.membre_nom; }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });

  const FILTRES: { key: FilterStatut; label: string }[] = [
    { key: 'tous',               label: 'Toutes' },
    { key: 'payee',              label: 'Payées' },
    { key: 'en_attente',        label: 'En attente' },
    { key: 'en_retard',         label: 'En retard' },
    { key: 'partiellement_payee', label: 'Partielles' },
  ];

  function exportCSV() {
    const headers = ['Membre', 'Tontine', 'Cycle', 'Montant dû', 'Payé', 'Pénalité', 'Statut', 'Échéance', 'Référence'];
    const rows = cotisations.map(c => [
      c.membre_nom, c.tontine_nom, c.cycle_numero,
      c.montant_du, c.montant_paye, c.penalite,
      getStatutLabel(c.statut), c.date_echeance, c.reference ?? '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `cotisations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Cotisations</h1>
          <p className="page-subtitle">{cotisations.length} cotisation{cotisations.length > 1 ? 's' : ''} affichée{cotisations.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline flex-shrink-0">
          <RiDownloadLine className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Résumé */}
      <ResumeCotisations cotisations={MOCK_COTISATIONS} />

      {/* Recherche + filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Rechercher par membre, tontine, référence…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterStatut(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filterStatut === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {cotisations.length === 0 ? (
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
                  <th>
                    <button onClick={() => toggleSort('membre_nom')}
                      className="flex items-center gap-1 hover:text-primary-600">
                      Membre <SortIcon field="membre_nom" />
                    </button>
                  </th>
                  <th>Tontine</th>
                  <th>Cycle</th>
                  <th>
                    <button onClick={() => toggleSort('montant_du')}
                      className="flex items-center gap-1 hover:text-primary-600">
                      Montant <SortIcon field="montant_du" />
                    </button>
                  </th>
                  <th>Pénalité</th>
                  <th>Statut</th>
                  <th>
                    <button onClick={() => toggleSort('date_echeance')}
                      className="flex items-center gap-1 hover:text-primary-600">
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
                    <td className="font-semibold text-gray-800">{c.membre_nom}</td>
                    <td className="text-gray-500 text-xs">{c.tontine_nom}</td>
                    <td className="text-center">
                      <span className="badge-gray">#{c.cycle_numero}</span>
                    </td>
                    <td className="font-mono font-semibold text-gray-800">
                      {formatMontant(c.montant_du)}
                    </td>
                    <td>
                      {c.penalite > 0
                        ? <span className="text-red-600 font-medium text-xs">+{formatMontant(c.penalite)}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td>
                      <span className={cn('badge', getStatutColor(c.statut))}>
                        {getStatutLabel(c.statut)}
                      </span>
                    </td>
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
                          <button
                            onClick={() => setSelected(c)}
                            className="btn-primary btn-sm"
                          >
                            Valider
                          </button>
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

      {/* Modal validation */}
      {selected && (
        <ModalValidation
          cotisation={selected}
          onClose={() => setSelected(null)}
          onValidate={(ref) => {
            console.log('Valider cotisation', selected.id, 'réf:', ref);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}