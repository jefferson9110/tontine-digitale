import { useState } from 'react';
import {
  RiSmartphoneLine, RiMoneyDollarCircleLine, RiCheckDoubleLine,
  RiTimeLine, RiAlertLine, RiHistoryLine, RiLoader4Line,
  RiArrowRightLine, RiCalendarLine, RiWalletLine,
} from 'react-icons/ri';
import { useAuth }                        from '../../contexts/AuthContext';
import { useQuery, useQueryClient }       from '@tanstack/react-query';
import { supabase }                       from '../../lib/supabase';
import { ModalPaiementMobileMoney,
         HistoriqueTransactions }          from '../../components/shared/MobileMoney';
import { formatMontant, formatDate,
         getStatutColor, getStatutLabel, cn } from '../../lib/utils';

// ── Hook cotisations impayées ────────────────────
function useCotisationsImpayees(userId?: string) {
  return useQuery({
    queryKey: ['cotisations_impayees', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('cotisations')
        .select('id, tontine_id, cycle_numero, montant_du, montant_paye, penalite, statut, date_echeance')
        .eq('user_id', userId)
        .in('statut', ['en_attente', 'en_retard'])
        .order('date_echeance', { ascending: true });

      if (error || !data) return [];

      const ids = [...new Set(data.map(c => c.tontine_id))];
      const { data: tontines } = await supabase
        .from('tontines')
        .select('id, nom, devise')
        .in('id', ids);

      return data.map(c => ({
        ...c,
        tontine: tontines?.find(t => t.id === c.tontine_id) ?? null,
      }));
    },
  });
}

function useCotisationsPayees(userId?: string) {
  return useQuery({
    queryKey: ['cotisations_payees', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('cotisations')
        .select('id, tontine_id, cycle_numero, montant_paye, date_paiement, reference, statut')
        .eq('user_id', userId)
        .eq('statut', 'payee')
        .order('date_paiement', { ascending: false })
        .limit(20);

      if (error || !data) return [];

      const ids = [...new Set(data.map(c => c.tontine_id))];
      const { data: tontines } = await supabase
        .from('tontines')
        .select('id, nom, devise')
        .in('id', ids);

      return data.map(c => ({
        ...c,
        tontine: tontines?.find(t => t.id === c.tontine_id) ?? null,
      }));
    },
  });
}

type Onglet = 'a_payer' | 'historique' | 'transactions';

export function PaiementPage() {
  const { profile }  = useAuth();
  const qc           = useQueryClient();
  const { data: impayees = [], isLoading: loadingImp, refetch: refetchImp } = useCotisationsImpayees(profile?.id);
  const { data: payees   = [], isLoading: loadingPay }                       = useCotisationsPayees(profile?.id);

  const [onglet,   setOnglet]   = useState<Onglet>('a_payer');
  const [paiement, setPaiement] = useState<{
    cotisationId: string;
    tontineId:    string;
    tontineNom:   string;
    montant:      number;
    devise:       string;
  } | null>(null);

  const totalDu    = impayees.reduce((s, c) => s + Number(c.montant_du) + Number(c.penalite), 0);
  const totalPaye  = payees.reduce((s, c) => s + Number(c.montant_paye), 0);
  const enRetard   = impayees.filter(c => c.statut === 'en_retard').length;

  const ONGLETS = [
    { key: 'a_payer',     label: `À payer (${impayees.length})`,     icon: RiMoneyDollarCircleLine },
    { key: 'historique',  label: 'Historique cotisations',            icon: RiCalendarLine },
    { key: 'transactions',label: 'Transactions Mobile Money',         icon: RiHistoryLine },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <RiWalletLine className="w-6 h-6 text-primary-600" />
          Paiements
        </h1>
        <p className="page-subtitle">Gérez vos cotisations via Mobile Money</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-amber-600">{formatMontant(totalDu)}</p>
          <p className="text-xs text-gray-400 mt-1">Reste à payer</p>
        </div>
        <div className="card !p-4 text-center">
          <p className="text-2xl font-display font-bold text-green-600">{formatMontant(totalPaye)}</p>
          <p className="text-xs text-gray-400 mt-1">Total payé</p>
        </div>
        <div className="card !p-4 text-center">
          <p className={cn('text-2xl font-display font-bold', enRetard > 0 ? 'text-red-600' : 'text-gray-300')}>
            {enRetard}
          </p>
          <p className="text-xs text-gray-400 mt-1">En retard</p>
        </div>
      </div>

      {/* Alerte retards */}
      {enRetard > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <RiAlertLine className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">
              {enRetard} cotisation{enRetard > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Des pénalités peuvent s'appliquer. Régularisez dès que possible.
            </p>
          </div>
          <button onClick={() => setOnglet('a_payer')}
            className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex-shrink-0">
            Payer
          </button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
        {ONGLETS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setOnglet(key as Onglet)}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              onglet === key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />{label}
          </button>
        ))}
      </div>

      {/* Onglet À payer */}
      {onglet === 'a_payer' && (
        <div className="space-y-3 animate-fade-in">
          {loadingImp ? (
            <div className="flex items-center justify-center h-40">
              <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : impayees.length === 0 ? (
            <div className="card text-center py-12">
              <RiCheckDoubleLine className="w-12 h-12 text-green-200 mx-auto mb-3" />
              <p className="font-semibold text-gray-500">Tout est à jour !</p>
              <p className="text-sm text-gray-400 mt-1">Aucune cotisation en attente.</p>
            </div>
          ) : (
            impayees.map(c => {
              const tontine      = c.tontine as any;
              const montantTotal = Number(c.montant_du) + Number(c.penalite);
              const estRetard    = c.statut === 'en_retard';
              const echeance     = new Date(c.date_echeance);
              const maintenant   = new Date();
              const joursRestants = Math.ceil((echeance.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div key={c.id} className={cn('card', estRetard && 'border-2 border-red-200 bg-red-50/30')}>
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      estRetard ? 'bg-red-100' : 'bg-amber-100'
                    )}>
                      {estRetard
                        ? <RiAlertLine className="w-6 h-6 text-red-600" />
                        : <RiTimeLine className="w-6 h-6 text-amber-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          {tontine?.nom ?? 'Tontine'} — Cycle {c.cycle_numero}
                        </p>
                        <span className={cn('badge flex-shrink-0', getStatutColor(c.statut))}>
                          {getStatutLabel(c.statut)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <RiCalendarLine className="w-3.5 h-3.5" />
                          Échéance : {formatDate(c.date_echeance)}
                        </span>
                        {!estRetard && joursRestants > 0 && (
                          <span className={cn('font-semibold',
                            joursRestants <= 3 ? 'text-red-500' : 'text-gray-500'
                          )}>
                            J-{joursRestants}
                          </span>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400">Montant total</p>
                          <p className="font-display font-bold text-gray-900">
                            {formatMontant(montantTotal, tontine?.devise)}
                          </p>
                        </div>
                        {Number(c.penalite) > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">dont pénalité</p>
                            <p className="text-sm font-semibold text-red-500">
                              +{formatMontant(Number(c.penalite))}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setPaiement({
                          cotisationId: c.id,
                          tontineId:    c.tontine_id,
                          tontineNom:   tontine?.nom ?? 'Tontine',
                          montant:      montantTotal,
                          devise:       tontine?.devise ?? 'XAF',
                        })}
                        className="btn-primary w-full justify-center"
                      >
                        <RiSmartphoneLine className="w-4 h-4" />
                        Payer via Mobile Money
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Onglet Historique cotisations */}
      {onglet === 'historique' && (
        <div className="space-y-3 animate-fade-in">
          {loadingPay ? (
            <div className="flex items-center justify-center h-40">
              <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : payees.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">Aucun paiement effectué pour le moment.</p>
            </div>
          ) : (
            payees.map(c => {
              const tontine = c.tontine as any;
              return (
                <div key={c.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RiCheckDoubleLine className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      {tontine?.nom ?? 'Tontine'} — Cycle {c.cycle_numero}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.date_paiement ? formatDate(c.date_paiement) : '—'}
                      {c.reference ? ` · Réf: ${c.reference}` : ''}
                    </p>
                  </div>
                  <p className="font-display font-bold text-green-700">
                    +{formatMontant(Number(c.montant_paye), tontine?.devise)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Onglet Transactions Mobile Money */}
      {onglet === 'transactions' && profile && (
        <div className="card animate-fade-in">
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">Transactions Mobile Money</h2>
          <HistoriqueTransactions userId={profile.id} />
        </div>
      )}

      {/* Modal paiement */}
      {paiement && (
        <ModalPaiementMobileMoney
          cotisationId={paiement.cotisationId}
          tontineId={paiement.tontineId}
          tontineNom={paiement.tontineNom}
          montant={paiement.montant}
          devise={paiement.devise}
          type="depot"
          onClose={() => setPaiement(null)}
          onSuccess={() => {
            setPaiement(null);
            refetchImp();
            qc.invalidateQueries({ queryKey: ['cotisations_payees'] });
          }}
        />
      )}
    </div>
  );
}