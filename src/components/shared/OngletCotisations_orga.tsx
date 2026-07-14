// ════════════════════════════════════════════════
//  OngletCotisations — Version organisateur
//  Remplace l'onglet Cotisations dans TontineDetailPage
//  Bouton "Valider" → ouvre SimulationPaiement
//  Aucun effet sur les autres onglets
// ════════════════════════════════════════════════

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  RiCheckLine, RiAlertLine, RiTimeLine,
  RiCalendarLine, RiLoader4Line, RiSmartphoneLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';
import { useQuery }              from '@tanstack/react-query';
import { supabase }              from '../../lib/supabase';
import { useAuth }               from '../../contexts/AuthContext';
import { SimulationPaiement,
         type CotisationAValider } from '../../components/shared/SimulationPaiement';
import { formatMontant, formatDate, getStatutColor, getStatutLabel, cn } from '../../lib/utils';

// ── Hook cotisations d'un cycle ─────────────────
function useCotisationsCycle(tontineId: string, cycle: number) {
  return useQuery({
    queryKey: ['cotisations', tontineId, cycle],
    enabled: !!tontineId,
    queryFn: async () => {
      // Requête 1 : cotisations
      const { data: rows, error } = await supabase
        .from('cotisations')
        .select('id, tontine_id, membre_id, user_id, cycle_numero, montant_du, montant_paye, penalite, statut, date_echeance, date_paiement, reference')
        .eq('tontine_id', tontineId)
        .eq('cycle_numero', cycle)
        .order('created_at', { ascending: true });

      if (error || !rows) return [];

      // Requête 2 : profils séparément
      const userIds = rows.map(r => r.user_id);
      const { data: profils } = await supabase
        .from('profiles')
        .select('id, nom, prenom')
        .in('id', userIds);

      return rows.map(r => ({
        ...r,
        user: profils?.find(p => p.id === r.user_id) ?? null,
      }));
    },
  });
}

interface Props {
  tontineId:   string;
  cycleActuel: number;
  devise:      string;
  isOrga:      boolean;
}

export function OngletCotisations({ tontineId, cycleActuel, devise, isOrga }: Props) {
  const { profile } = useAuth();
  const qc          = useQueryClient();

  const { data: cotisations = [], isLoading } = useCotisationsCycle(tontineId, cycleActuel);
  const [simulation, setSimulation] = useState<CotisationAValider | null>(null);

  // Stats du cycle
  const payees   = cotisations.filter(c => c.statut === 'payee').length;
  const total    = cotisations.length;
  const collecte = cotisations.filter(c => c.statut === 'payee')
    .reduce((s, c) => s + Number(c.montant_paye), 0);
  const enRetard = cotisations.filter(c => c.statut === 'en_retard').length;
  const taux     = total > 0 ? Math.round((payees / total) * 100) : 0;

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  if (cotisations.length === 0) return (
    <div className="card text-center py-12">
      <RiCalendarLine className="w-12 h-12 text-gray-200 dark:text-slate-600 mx-auto mb-3" />
      <p className="font-semibold text-gray-500 dark:text-slate-400">
        Aucune cotisation pour le cycle {cycleActuel}
      </p>
      <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
        {isOrga
          ? 'Activez la tontine pour générer les cotisations.'
          : 'Les cotisations apparaîtront ici une fois le cycle ouvert.'
        }
      </p>
    </div>
  );

  return (
    <>
      {/* Stats cycle */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary-700 dark:text-primary-400">
            {payees}/{total}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Payées</p>
        </div>
        <div className="card !p-4 text-center">
          <p className={cn('text-2xl font-display font-bold',
            taux === 100 ? 'text-green-600' : taux >= 50 ? 'text-amber-600' : 'text-red-600'
          )}>
            {taux}%
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Taux</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-lg font-display font-bold text-gray-800 dark:text-slate-200">
            {formatMontant(collecte, devise as any)}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Collecté</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="card !p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Cycle {cycleActuel}
          </span>
          {enRetard > 0 && (
            <span className="badge badge-red text-xs">
              {enRetard} en retard
            </span>
          )}
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500',
              taux === 100 ? 'bg-green-500' : 'bg-primary-500'
            )}
            style={{ width: `${taux}%` }}
          />
        </div>
      </div>

      {/* Liste cotisations */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            {total} membre{total > 1 ? 's' : ''}
          </p>
        </div>

        {cotisations.map(c => {
          const montantTotal = Number(c.montant_du) + Number(c.penalite);
          const peutValider  = isOrga && (c.statut === 'en_attente' || c.statut === 'en_retard');

          return (
            <div key={c.id}
              className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-slate-700/50 last:border-0">

              {/* Icône statut */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                c.statut === 'payee'     ? 'bg-green-100 dark:bg-green-500/20'  :
                c.statut === 'en_retard' ? 'bg-red-100 dark:bg-red-500/20'      :
                                           'bg-amber-100 dark:bg-amber-500/20'
              )}>
                {c.statut === 'payee'
                  ? <RiCheckDoubleLine className="w-5 h-5 text-green-600 dark:text-green-400" />
                  : c.statut === 'en_retard'
                  ? <RiAlertLine className="w-5 h-5 text-red-600 dark:text-red-400" />
                  : <RiTimeLine className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                }
              </div>

              {/* Infos membre */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
                  {(c.user as any)?.prenom} {(c.user as any)?.nom}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Échéance {formatDate(c.date_echeance)}
                  </p>
                  {c.statut === 'payee' && c.reference && (
                    <p className="text-xs font-mono text-gray-400 dark:text-slate-500 truncate max-w-[100px]">
                      {c.reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Montant */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                  {formatMontant(montantTotal, devise as any)}
                </p>
                {Number(c.penalite) > 0 && (
                  <p className="text-xs text-red-500">
                    +{formatMontant(Number(c.penalite))} pénalité
                  </p>
                )}
              </div>

              {/* Statut + action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('badge hidden sm:inline-flex', getStatutColor(c.statut))}>
                  {getStatutLabel(c.statut)}
                </span>

                {peutValider && (
                  <button
                    onClick={() => setSimulation({
                      id:           c.id,
                      tontine_id:   c.tontine_id,
                      membre_id:    c.membre_id,
                      user_id:      c.user_id,
                      cycle_numero: c.cycle_numero,
                      montant_du:   Number(c.montant_du),
                      penalite:     Number(c.penalite),
                      devise,
                      user:         c.user as any,
                    })}
                    className="btn-primary btn-sm"
                  >
                    <RiSmartphoneLine className="w-3.5 h-3.5" />
                    Valider
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal simulation paiement */}
      {simulation && (
        <SimulationPaiement
          cotisation={simulation}
          onClose={() => setSimulation(null)}
          onSuccess={() => {
            setSimulation(null);
            qc.invalidateQueries({ queryKey: ['cotisations', tontineId, cycleActuel] });
          }}
        />
      )}
    </>
  );
}