import { useState } from 'react';
import { Link }     from 'react-router-dom';
import {
  RiSearchLine, RiPauseLine, RiPlayLine, RiDeleteBinLine,
  RiEyeLine, RiDownloadLine, RiInboxLine, RiLoader4Line,
} from 'react-icons/ri';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase }      from '../../lib/supabase';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

function useAdminTontines() {
  return useQuery({
    queryKey: ['admin_tontines'],
    queryFn: async () => {
      const { data: tontines, error } = await supabase
        .from('tontines')
        .select('id, nom, statut, montant_cotisation, devise, frequence, cycle_actuel, total_cycles, created_at, organisateur_id')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ids = [...new Set((tontines ?? []).map(t => t.organisateur_id))];
      if (ids.length === 0) return tontines ?? [];

      const { data: profils } = await supabase
        .from('profiles').select('id, nom, prenom').in('id', ids);

      return (tontines ?? []).map(t => ({
        ...t,
        organisateur: profils?.find(p => p.id === t.organisateur_id) ?? null,
      }));
    },
  });
}

function useChangerStatutTontine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase.from('tontines').update({ statut }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_tontines'] });
      toast.success('Statut mis à jour.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useDeleteTontine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tontines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_tontines'] });
      toast.success('Tontine supprimée.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function AdminTontinesPage() {
  const { data: tontines = [], isLoading } = useAdminTontines();
  const changerStatut = useChangerStatutTontine();
  const supprimer     = useDeleteTontine();

  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('tous');
  const [modal,  setModal]  = useState<{ action: string; id: string } | null>(null);

  const filtrees = tontines.filter(t =>
    (filtre === 'tous' || t.statut === filtre) &&
    t.nom.toLowerCase().includes(search.toLowerCase())
  );

  const FILTRES = [
    { key: 'tous',      label: `Toutes (${tontines.length})` },
    { key: 'active',    label: `Actives (${tontines.filter(t => t.statut === 'active').length})` },
    { key: 'brouillon', label: `Brouillons (${tontines.filter(t => t.statut === 'brouillon').length})` },
    { key: 'suspendue', label: `Suspendues (${tontines.filter(t => t.statut === 'suspendue').length})` },
    { key: 'terminee',  label: `Terminées (${tontines.filter(t => t.statut === 'terminee').length})` },
  ];

  function exportCSV() {
    const csv = [
      'Nom,Statut,Cotisation,Cycle,Organisateur,Créée le',
      ...filtrees.map(t =>
        `${t.nom},${t.statut},${t.montant_cotisation},${t.cycle_actuel}/${t.total_cycles},${(t.organisateur_id as any)?.nom ?? ''},${t.created_at}`
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'tontines.csv';
    a.click();
    toast.success('CSV exporté !');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
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
          <button key={key} onClick={() => setFiltre(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              filtre === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600'
            )}>
            {label}
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
                <tr>
                  <th>Tontine</th>
                  <th>Organisateur</th>
                  <th>Cotisation</th>
                  <th>Cycle</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtrees.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-xs">{t.nom.charAt(0)}</span>
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{t.nom}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-slate-400">
                      {(t.organisateur_id as any)?.prenom} {(t.organisateur_id as any)?.nom}
                    </td>
                    <td className="font-mono text-sm">{formatMontant(t.montant_cotisation, t.devise as any)}</td>
                    <td className="text-sm">{t.cycle_actuel}/{t.total_cycles}</td>
                    <td><span className={cn('badge', getStatutColor(t.statut))}>{getStatutLabel(t.statut)}</span></td>
                    <td className="text-xs text-gray-400">{formatDate(t.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/tontines/${t.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors">
                          <RiEyeLine className="w-4 h-4" />
                        </Link>
                        {t.statut === 'active' && (
                          <button onClick={() => setModal({ action: 'suspendre', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                            <RiPauseLine className="w-4 h-4" />
                          </button>
                        )}
                        {t.statut === 'suspendue' && (
                          <button onClick={() => changerStatut.mutate({ id: t.id, statut: 'active' })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors">
                            <RiPlayLine className="w-4 h-4" />
                          </button>
                        )}
                        {(t.statut === 'brouillon' || t.statut === 'terminee') && (
                          <button onClick={() => setModal({ action: 'supprimer', id: t.id })}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-slate-100 text-lg mb-2">
              {modal.action === 'suspendre' ? 'Suspendre la tontine ?' : 'Supprimer définitivement ?'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              {modal.action === 'supprimer' ? 'Cette action est irréversible.' : 'Les membres seront notifiés.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="btn-outline flex-1">Annuler</button>
              <button
                onClick={() => {
                  if (modal.action === 'suspendre') changerStatut.mutate({ id: modal.id, statut: 'suspendue' });
                  else supprimer.mutate(modal.id);
                  setModal(null);
                }}
                className={cn('flex-1 btn justify-center',
                  modal.action === 'supprimer' ? 'btn-danger' : 'btn-primary'
                )}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}