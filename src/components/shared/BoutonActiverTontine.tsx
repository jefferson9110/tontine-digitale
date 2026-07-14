// ════════════════════════════════════════════════
//  Bouton "Activer la tontine" + "Cycle suivant"
//  À ajouter dans TontineDetailPage — OngletApercu
//  ou dans le header de la page détail
// ════════════════════════════════════════════════

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiPlayCircleLine, RiSkipRightLine, RiLoader4Line, RiAlertLine } from 'react-icons/ri';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface Props {
  tontineId: string;
  statut:    string;
  cycleActuel: number;
  totalCycles: number;
  isOrga:    boolean;
}

export function BoutonActiverTontine({ tontineId, statut, cycleActuel, totalCycles, isOrga }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<'activer' | 'cycle' | null>(null);

  if (!isOrga) return null;
  if (statut === 'terminee') return null;

  async function activerTontine() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('activer_tontine', { p_tontine_id: tontineId });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      toast.success(data?.message ?? 'Tontine activée !');
      qc.invalidateQueries({ queryKey: ['tontines'] });
      qc.invalidateQueries({ queryKey: ['tontine', tontineId] });
      qc.invalidateQueries({ queryKey: ['tours', tontineId] });
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur d\'activation');
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  async function ouvrirCycleSuivant() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('ouvrir_cycle_suivant', { p_tontine_id: tontineId });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      if (data?.terminee) {
        toast.success('Tontine terminée — tous les cycles ont été complétés !');
      } else {
        toast.success(data?.message ?? `Cycle ${data?.nouveau_cycle} ouvert !`);
      }
      qc.invalidateQueries({ queryKey: ['tontines'] });
      qc.invalidateQueries({ queryKey: ['tontine', tontineId] });
      qc.invalidateQueries({ queryKey: ['cotisations', tontineId] });
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur');
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  return (
    <>
      {/* Bouton Activer si brouillon */}
      {statut === 'brouillon' && (
        <button
          onClick={() => setConfirm('activer')}
          className="btn-primary"
        >
          <RiPlayCircleLine className="w-4 h-4" />
          Activer la tontine
        </button>
      )}

      {/* Bouton Cycle suivant si active */}
      {statut === 'active' && cycleActuel < totalCycles && (
        <button
          onClick={() => setConfirm('cycle')}
          className="btn-outline"
        >
          <RiSkipRightLine className="w-4 h-4" />
          Ouvrir cycle {cycleActuel + 1}
        </button>
      )}

      {/* Modal confirmation */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <RiAlertLine className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-display font-bold text-gray-900">
                  {confirm === 'activer' ? 'Activer la tontine ?' : 'Ouvrir le cycle suivant ?'}
                </h3>
              </div>
              <p className="text-sm text-gray-500">
                {confirm === 'activer'
                  ? 'Les tours et cotisations seront générés automatiquement pour tous les membres actifs. Cette action est irréversible.'
                  : `Le cycle ${cycleActuel + 1} sera ouvert et les cotisations générées pour tous les membres actifs.`
                }
              </p>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => setConfirm(null)} className="btn-outline flex-1">
                Annuler
              </button>
              <button
                onClick={confirm === 'activer' ? activerTontine : ouvrirCycleSuivant}
                disabled={loading}
                className="btn-primary flex-1 justify-center"
              >
                {loading
                  ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                  : confirm === 'activer' ? 'Activer' : 'Ouvrir'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}