import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiSearchLine, RiFilterLine, RiEyeLine, RiEditLine,
  RiPauseLine, RiPlayLine, RiDeleteBinLine, RiArrowRightLine,
  RiDownloadLine, RiGroupLine, RiInboxLine,
} from 'react-icons/ri';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, getFrequenceLabel, cn } from '../../lib/utils';
import type { Tontine } from '../../types';
import toast from 'react-hot-toast';

// ── Mock data ─────────────────────────────────────
const MOCK_TONTINES: (Tontine & { membres: number; collecte: number; taux: number; organisateur_nom: string })[] = [
  { id: '1', nom: 'Njangi Fonctionnaires Yaoundé', description: '', type: 'rotatif', statut: 'active',    montant_cotisation: 25000, devise: 'XAF', frequence: 'mensuel',      date_debut: '2026-01-01', nombre_membres_max: 12, cycle_actuel: 8,  total_cycles: 12, organisateur_id: 'u1', penalite_retard: 5,  delai_grace_jours: 3, created_at: '2025-12-20', updated_at: '2026-07-01', membres: 12, collecte: 2400000, taux: 96,  organisateur_nom: 'Marcelline T.' },
  { id: '2', nom: 'Tontine Amis Lycée Bafoussam',  description: '', type: 'rotatif', statut: 'active',    montant_cotisation: 15000, devise: 'XAF', frequence: 'mensuel',      date_debut: '2026-03-01', nombre_membres_max: 8,  cycle_actuel: 4,  total_cycles: 8,  organisateur_id: 'u2', penalite_retard: 10, delai_grace_jours: 5, created_at: '2026-02-15', updated_at: '2026-07-01', membres: 7,  collecte: 480000,  taux: 100, organisateur_nom: 'Patrick N.' },
  { id: '3', nom: 'Épargne Famille Tenkam',        description: '', type: 'fixe',    statut: 'active',    montant_cotisation: 50000, devise: 'XAF', frequence: 'trimestriel',  date_debut: '2026-01-15', nombre_membres_max: 6,  cycle_actuel: 2,  total_cycles: 4,  organisateur_id: 'u3', penalite_retard: 0,  delai_grace_jours: 7, created_at: '2026-01-10', updated_at: '2026-06-15', membres: 5,  collecte: 370000,  taux: 88,  organisateur_nom: 'Jean-Paul M.' },
  { id: '4', nom: 'Njangi Diaspora Paris',          description: '', type: 'rotatif', statut: 'suspendue', montant_cotisation: 200,   devise: 'EUR', frequence: 'mensuel',      date_debut: '2025-06-01', nombre_membres_max: 10, cycle_actuel: 6,  total_cycles: 10, organisateur_id: 'u4', penalite_retard: 5,  delai_grace_jours: 3, created_at: '2025-05-20', updated_at: '2026-05-01', membres: 9,  collecte: 9600,    taux: 78,  organisateur_nom: 'Solange K.' },
  { id: '5', nom: 'Tontine Commerçantes Marché',   description: '', type: 'rotatif', statut: 'terminee',  montant_cotisation: 10000, devise: 'XAF', frequence: 'hebdomadaire', date_debut: '2025-01-01', nombre_membres_max: 20, cycle_actuel: 20, total_cycles: 20, organisateur_id: 'u1', penalite_retard: 5,  delai_grace_jours: 1, created_at: '2024-12-15', updated_at: '2026-06-01', membres: 20, collecte: 800000,  taux: 95,  organisateur_nom: 'Marcelline T.' },
  { id: '6', nom: 'Épargne Jeunes Entrepreneurs',  description: '', type: 'rotatif', statut: 'brouillon', montant_cotisation: 30000, devise: 'XAF', frequence: 'mensuel',      date_debut: '2026-08-01', nombre_membres_max: 10, cycle_actuel: 0,  total_cycles: 10, organisateur_id: 'u5', penalite_retard: 5,  delai_grace_jours: 3, created_at: '2026-07-05', updated_at: '2026-07-05', membres: 3,  collecte: 0,       taux: 0,   organisateur_nom: 'Cécile A.' },
];

type FilterStatut = 'tous' | 'active' | 'suspendue' | 'terminee' | 'brouillon';

// ── Modal confirmation action ────────────────────
function ModalConfirm({ titre, message, onConfirm, onClose, danger }: {
  titre: string; message: string;
  onConfirm: () => void; onClose: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
        <div className="p-6">
          <h3 className="font-display font-bold text-gray-900 text-lg mb-2">{titre}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Annuler</button>
          <button onClick={onConfirm} className={`flex-1 btn ${danger ? 'btn-danger' : 'btn-primary'}`}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function AdminTontinesPage() {
  const [tontines,     setTontines]     = useState(MOCK_TONTINES);
  const [search,       setSearch]       = useState('');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [modal,        setModal]        = useState<{ action: string; id: string } | null>(null);

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

  const tontinesFiltrees = tontines.filter(t => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase()) ||
      t.organisateur_nom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'tous' || t.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  function handleAction(action: string, id: string) {
    setTontines(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (action === 'suspendre') return { ...t, statut: 'suspendue' as const };
      if (action === 'activer')   return { ...t, statut: 'active' as const };
      return t;
    }));
    if (action === 'supprimer') setTontines(prev => prev.filter(t => t.id !== id));
    toast.success(
      action === 'suspendre' ? 'Tontine suspendue.' :
      action === 'activer'   ? 'Tontine réactivée.' :
      'Tontine supprimée.'
    );
    setModal(null);
  }

  function exportCSV() {
    const headers = ['Nom', 'Organisateur', 'Type', 'Statut', 'Cotisation', 'Membres', 'Taux', 'Créée le'];
    const rows = tontinesFiltrees.map(t => [
      t.nom, t.organisateur_nom, t.type, t.statut,
      t.montant_cotisation, `${t.membres}/${t.nombre_membres_max}`,
      `${t.taux}%`, t.created_at,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `tontines_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const tontineSelectionnee = modal ? tontines.find(t => t.id === modal.id) : null;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Gestion des tontines</h1>
          <p className="page-subtitle">{tontinesFiltrees.length} tontine{tontinesFiltrees.length > 1 ? 's' : ''} affichée{tontinesFiltrees.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline flex-shrink-0">
          <RiDownloadLine className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Rechercher par nom ou organisateur…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9" />
      </div>

      {/* Filtres */}
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
      {tontinesFiltrees.length === 0 ? (
        <div className="empty-state card">
          <RiInboxLine className="empty-state-icon" />
          <p className="font-semibold text-gray-500">Aucune tontine trouvée</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tontine</th>
                  <th>Organisateur</th>
                  <th>Cotisation</th>
                  <th>Membres</th>
                  <th>Taux</th>
                  <th>Cycle</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tontinesFiltrees.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-xs">{t.nom.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{t.nom}</p>
                          <p className="text-xs text-gray-400">{getFrequenceLabel(t.frequence)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{t.organisateur_nom}</td>
                    <td className="font-mono text-sm font-medium">{formatMontant(t.montant_cotisation, t.devise)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <RiGroupLine className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm">{t.membres}/{t.nombre_membres_max}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full',
                            t.taux >= 90 ? 'bg-green-500' : t.taux >= 70 ? 'bg-amber-400' : 'bg-red-400'
                          )} style={{ width: `${t.taux}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{t.taux}%</span>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{t.cycle_actuel}/{t.total_cycles}</td>
                    <td><span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span></td>
                    <td className="text-xs text-gray-400">{formatDate(t.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/tontines/${t.id}`} title="Voir"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                          <RiEyeLine className="w-4 h-4" />
                        </Link>
                        {t.statut === 'active' && (
                          <button title="Suspendre"
                            onClick={() => setModal({ action: 'suspendre', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                            <RiPauseLine className="w-4 h-4" />
                          </button>
                        )}
                        {t.statut === 'suspendue' && (
                          <button title="Réactiver"
                            onClick={() => setModal({ action: 'activer', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                            <RiPlayLine className="w-4 h-4" />
                          </button>
                        )}
                        {t.statut === 'brouillon' && (
                          <button title="Supprimer"
                            onClick={() => setModal({ action: 'supprimer', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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

      {/* Modal confirmation */}
      {modal && tontineSelectionnee && (
        <ModalConfirm
          titre={
            modal.action === 'suspendre' ? 'Suspendre la tontine' :
            modal.action === 'activer'   ? 'Réactiver la tontine' :
            'Supprimer la tontine'
          }
          message={
            modal.action === 'suspendre'
              ? `Voulez-vous suspendre "${tontineSelectionnee.nom}" ? Les membres ne pourront plus enregistrer de paiements.`
              : modal.action === 'activer'
              ? `Voulez-vous réactiver "${tontineSelectionnee.nom}" ?`
              : `Supprimer définitivement "${tontineSelectionnee.nom}" ? Cette action est irréversible.`
          }
          danger={modal.action === 'supprimer'}
          onConfirm={() => handleAction(modal.action, modal.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}