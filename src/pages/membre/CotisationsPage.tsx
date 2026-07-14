// ════════════════════════════════════════════════
//  CotisationsPage — Version complète avec
//  paiement Mobile Money intégré
//  Remplace src/pages/membre/CotisationsPage.tsx
// ════════════════════════════════════════════════

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiMoneyDollarCircleLine, RiCheckDoubleLine, RiTimeLine,
  RiAlertLine, RiCalendarLine, RiLoader4Line, RiInboxLine,
  RiSmartphoneLine, RiHistoryLine, RiFilterLine,
} from 'react-icons/ri';
import { useAuth }                    from '../../contexts/AuthContext';
import { useQuery }                   from '@tanstack/react-query';
import { supabase }                   from '../../lib/supabase';
import { ModalPaiementMobileMoney,
         HistoriqueTransactions }      from '../../components/shared/MobileMoney';
import { formatMontant, formatDate,
         getStatutColor, getStatutLabel, cn } from '../../lib/utils';

type Onglet  = 'cotisations' | 'historique';
type Filtre  = 'toutes' | 'en_attente' | 'payee' | 'en_retard';

function useMesCotisations(userId?: string) {
  return useQuery({
    queryKey: ['mes_cotisations_full', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('cotisations')
        .select('id, tontine_id, cycle_numero, montant_du, montant_paye, penalite, statut, date_echeance, date_paiement, reference')
        .eq('user_id', userId)
        .order('date_echeance', { ascending: false });

      if (error || !data) return [];

      // Récupérer les noms de tontines séparément
      const tontineIds = [...new Set(data.map(c => c.tontine_id))];
      const { data: tontines } = await supabase
        .from('tontines')
        .select('id, nom, devise, montant_cotisation')
        .in('id', tontineIds);

      return data.map(c => ({
        ...c,
        tontine: tontines?.find(t => t.id === c.tontine_id) ?? null,
      }));
    },
  });
}

export function CotisationsPage() {
  const { profile } = useAuth();
  const { data: cotisations = [], isLoading, refetch } = useMesCotisations(profile?.id);

  const [onglet,    setOnglet]    = useState<Onglet>('cotisations');
  const [filtre,    setFiltre]    = useState<Filtre>('toutes');
  const [paiement,  setPaiement]  = useState<{
    cotisationId: string;
    tontineId:    string;
    montant:      number;
    devise:       string;
  } | null>(null);

  // Calculs stats
  const totalDu       = cotisations.filter(c => c.statut !== 'payee').reduce((s, c) => s + Number(c.montant_du), 0);
  const totalPaye     = cotisations.filter(c => c.statut === 'payee').reduce((s, c) => s + Number(c.montant_paye), 0);
  const enRetard      = cotisations.filter(c => c.statut === 'en_retard').length;
  const enAttente     = cotisations.filter(c => c.statut === 'en_attente').length;

  const cotisationsFiltrees = cotisations.filter(c =>
    filtre === 'toutes' || c.statut === filtre
  );

  const FILTRES: { key: Filtre; label: string }[] = [
    { key: 'toutes',     label: `Toutes (${cotisations.length})` },
    { key: 'en_attente', label: `À payer (${enAttente})` },
    { key: 'en_retard',  label: `En retard (${enRetard})` },
    { key: 'payee',      label: `Payées (${cotisations.filter(c => c.statut === 'payee').length})` },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Mes cotisations</h1>
        <p className="page-subtitle">Gérez vos paiements Mobile Money</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-700"><RiTimeLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">Reste à payer</p>
            <p className="text-xl font-display font-bold text-amber-700">{formatMontant(totalDu)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-700"><RiCheckDoubleLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">Total payé</p>
            <p className="text-xl font-display font-bold text-green-700">{formatMontant(totalPaye)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-100 text-red-700"><RiAlertLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">En retard</p>
            <p className="text-xl font-display font-bold text-red-700">{enRetard}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 text-primary-700"><RiCalendarLine className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-400">En attente</p>
            <p className="text-xl font-display font-bold text-primary-700">{enAttente}</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'cotisations', label: 'Mes cotisations', icon: RiMoneyDollarCircleLine },
          { key: 'historique',  label: 'Historique Mobile Money', icon: RiHistoryLine },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setOnglet(key as Onglet)}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              onglet === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Onglet cotisations */}
      {onglet === 'cotisations' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTRES.map(({ key, label }) => (
              <button key={key} onClick={() => setFiltre(key)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
                  filtre === key
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300'
                )}>
                {label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : cotisationsFiltrees.length === 0 ? (
            <div className="card text-center py-12">
              <RiInboxLine className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">Aucune cotisation trouvée</p>
              {filtre === 'toutes' && (
                <p className="text-sm text-gray-400 mt-1 mb-4">
                  Rejoignez une tontine pour commencer à cotiser.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {cotisationsFiltrees.map(c => {
                const tontine  = c.tontine as any;
                const montantTotal = Number(c.montant_du) + Number(c.penalite);
                const peutPayer = c.statut === 'en_attente' || c.statut === 'en_retard';

                return (
                  <div key={c.id} className={cn('card',
                    c.statut === 'en_retard' && 'border-2 border-red-200',
                    c.statut === 'payee' && 'opacity-80'
                  )}>
                    <div className="flex items-start gap-4">
                      {/* Icône statut */}
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        c.statut === 'payee'     ? 'bg-green-100' :
                        c.statut === 'en_retard' ? 'bg-red-100' : 'bg-amber-100'
                      )}>
                        {c.statut === 'payee'
                          ? <RiCheckDoubleLine className="w-6 h-6 text-green-600" />
                          : c.statut === 'en_retard'
                          ? <RiAlertLine className="w-6 h-6 text-red-600" />
                          : <RiTimeLine className="w-6 h-6 text-amber-600" />}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {tontine?.nom ?? 'Tontine'} — Cycle {c.cycle_numero}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Échéance : {formatDate(c.date_echeance)}
                            </p>
                          </div>
                          <span className={cn('badge flex-shrink-0', getStatutColor(c.statut))}>
                            {getStatutLabel(c.statut)}
                          </span>
                        </div>

                        {/* Montants */}
                        <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">
                              {c.statut === 'payee' ? 'Payé le' : 'À payer'}
                            </p>
                            <p className="font-display font-bold text-gray-900 text-lg">
                              {formatMontant(montantTotal, tontine?.devise)}
                            </p>
                            {Number(c.penalite) > 0 && (
                              <p className="text-xs text-red-500">
                                dont {formatMontant(Number(c.penalite))} de pénalité
                              </p>
                            )}
                          </div>
                          {c.statut === 'payee' && c.reference && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Référence</p>
                              <p className="font-mono text-xs text-gray-600">{c.reference}</p>
                            </div>
                          )}
                        </div>

                        {/* Bouton payer */}
                        {peutPayer && (
                          <button
                            onClick={() => setPaiement({
                              cotisationId: c.id,
                              tontineId:    c.tontine_id,
                              montant:      montantTotal,
                              devise:       tontine?.devise ?? 'XAF',
                            })}
                            className="btn-primary w-full justify-center mt-3"
                          >
                            <RiSmartphoneLine className="w-4 h-4" />
                            Payer via Mobile Money
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Onglet historique */}
      {onglet === 'historique' && profile && (
        <div className="card animate-fade-in">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">
            Transactions Mobile Money
          </h2>
          <HistoriqueTransactions userId={profile.id} />
        </div>
      )}

      {/* Modal paiement */}
      {paiement && (
        <ModalPaiementMobileMoney
          cotisationId={paiement.cotisationId}
          tontineId={paiement.tontineId}
          montant={paiement.montant}
          devise={paiement.devise}
          type="depot"
          onClose={() => setPaiement(null)}
          onSuccess={() => {
            setPaiement(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}