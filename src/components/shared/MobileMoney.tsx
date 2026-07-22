import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  RiLoader4Line, RiCheckDoubleLine, RiAlertLine,
  RiSmartphoneLine, RiShieldCheckLine, RiCloseLine,
  RiMoneyDollarCircleLine, RiFileDownloadLine,
} from 'react-icons/ri';
import { supabase }    from '../../lib/supabase';
import { useAuth }     from '../../contexts/AuthContext';
import { formatMontant, cn } from '../../lib/utils';
import { genererRecuPdf } from '../../utils/supabase/genererRecuPdf';
import toast from 'react-hot-toast';

// ── SVG logos réels ──────────────────────────────

const LogoMTN = () => (
  <svg viewBox="0 0 60 60" fill="none" className="w-8 h-8">
    <circle cx="30" cy="30" r="30" fill="#FFCC00"/>
    <text x="30" y="22" textAnchor="middle" fill="#000" fontSize="9" fontWeight="900" fontFamily="Arial">MTN</text>
    <text x="30" y="34" textAnchor="middle" fill="#000" fontSize="6.5" fontFamily="Arial">Mobile</text>
    <text x="30" y="43" textAnchor="middle" fill="#000" fontSize="6.5" fontFamily="Arial">Money</text>
  </svg>
);

const LogoOrange = () => (
  <svg viewBox="0 0 60 60" fill="none" className="w-8 h-8">
    <circle cx="30" cy="30" r="30" fill="#FF6600"/>
    <rect x="14" y="18" width="32" height="24" rx="3" fill="white"/>
    <text x="30" y="34" textAnchor="middle" fill="#FF6600" fontSize="9" fontWeight="900" fontFamily="Arial">orange</text>
  </svg>
);

const LogoCamtel = () => (
  <svg viewBox="0 0 60 60" fill="none" className="w-8 h-8">
    <circle cx="30" cy="30" r="30" fill="#003087"/>
    <text x="30" y="25" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="900" fontFamily="Arial">CAMTEL</text>
    <text x="30" y="36" textAnchor="middle" fill="#FFD700" fontSize="6" fontFamily="Arial">Mobile</text>
    <text x="30" y="45" textAnchor="middle" fill="#FFD700" fontSize="6" fontFamily="Arial">Money</text>
  </svg>
);

// ── Config opérateurs ────────────────────────────
const OPERATEURS = [
  {
    id:       'mtn',
    nom:      'MTN MoMo',
    Logo:     LogoMTN,
    bg:       'bg-yellow-50',
    border:   'border-yellow-300',
    selected: 'border-yellow-500 bg-yellow-100 ring-2 ring-yellow-400',
    prefixes: '670–679',
  },
  {
    id:       'orange',
    nom:      'Orange Money',
    Logo:     LogoOrange,
    bg:       'bg-orange-50',
    border:   'border-orange-300',
    selected: 'border-orange-500 bg-orange-100 ring-2 ring-orange-400',
    prefixes: '655–659',
  },
  {
    id:       'camtel',
    nom:      'Camtel Mobile',
    Logo:     LogoCamtel,
    bg:       'bg-blue-50',
    border:   'border-blue-300',
    selected: 'border-blue-500 bg-blue-100 ring-2 ring-blue-400',
    prefixes: '620–621',
  },
];

// ══════════════════════════════════════════════════
//  Hook useMobileMoney
// ══════════════════════════════════════════════════
export function useMobileMoney() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  const initierPaiement = useMutation({
    mutationFn: async ({
      cotisationId, tontineId, montant, operateur, telephone, type = 'depot',
    }: {
      cotisationId?: string;
      tontineId:     string;
      montant:       number;
      operateur:     string;
      telephone:     string;
      type?:         'depot' | 'retrait';
    }) => {
      if (!profile) throw new Error('Non connecté');

      // 1. Initier la transaction côté serveur (RPC — écrit exclusivement côté serveur)
      const { data: init, error: e1 } = await supabase.rpc('initier_transaction_mobile', {
        p_cotisation_id: cotisationId ?? null,
        p_tontine_id:    tontineId,
        p_montant:       montant,
        p_operateur:     operateur,
        p_telephone:     telephone,
        p_type:          type,
      });
      if (e1) throw new Error(e1.message);
      if (!init.success) throw new Error(init.message ?? "Impossible d'initier la transaction.");

      // 2. Délai UX (simulation du traitement réseau côté opérateur).
      //    À remplacer, en production, par l'attente du webhook de
      //    l'agrégateur de paiement (CinetPay, PawaPay…).
      await new Promise(r => setTimeout(r, 2000));

      // 3. Confirmer/échouer + générer le reçu signé — tout est décidé
      //    et écrit côté serveur, hors d'atteinte du client.
      const { data: res, error: e2 } = await supabase.rpc('confirmer_transaction_mobile', {
        p_transaction_id: init.transaction_id,
      });
      if (e2) throw new Error(e2.message);
      if (!res.success) throw new Error(res.message ?? 'Transaction échouée.');

      return {
        reference:  res.reference as string,
        numeroRecu: res.numero_recu as string,
        montant, operateur, type,
        statut: 'confirmee',
      };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['cotisations'] });
      qc.invalidateQueries({ queryKey: ['mes_cotisations_full'] });
      qc.invalidateQueries({ queryKey: ['cotisations_impayees'] });
      qc.invalidateQueries({ queryKey: ['cotisations_payees'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(`Paiement confirmé ! Réf: ${data.reference}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { initierPaiement };
}

// ══════════════════════════════════════════════════
//  HistoriqueTransactions
// ══════════════════════════════════════════════════
export function HistoriqueTransactions({ userId }: { userId: string }) {
  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions_mobile')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const OP = { mtn: LogoMTN, orange: LogoOrange, camtel: LogoCamtel } as Record<string, React.FC>;

  if (isLoading) return (
    <div className="flex items-center justify-center h-20">
      <RiLoader4Line className="w-6 h-6 text-primary-500 animate-spin" />
    </div>
  );
  if (txs.length === 0) return (
    <p className="text-center text-sm text-gray-400 py-8">Aucune transaction pour le moment.</p>
  );

  return (
    <div className="space-y-2">
      {txs.map((t: any) => {
        const OpLogo = OP[t.operateur];
        return (
          <div key={t.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              {OpLogo && <OpLogo />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 text-sm">
                  {t.type === 'depot' ? 'Dépôt' : 'Retrait'}
                </p>
                <span className={cn('badge text-xs',
                  t.statut === 'confirmee' ? 'badge-green' :
                  t.statut === 'echec' ? 'badge-red' : 'badge-yellow'
                )}>
                  {t.statut === 'confirmee' ? 'Confirmée' :
                   t.statut === 'echec' ? 'Échec' : 'En cours'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.reference} · {new Date(t.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <p className={cn('font-display font-bold text-base flex-shrink-0',
              t.type === 'depot' ? 'text-green-700' : 'text-red-600'
            )}>
              {t.type === 'depot' ? '+' : '-'}{formatMontant(t.montant)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════
//  ModalPaiementMobileMoney
// ══════════════════════════════════════════════════
interface ModalProps {
  cotisationId?: string;
  tontineId:     string;
  tontineNom?:   string;
  montant:       number;
  devise?:       string;
  type?:         'depot' | 'retrait';
  onClose:       () => void;
  onSuccess?:    () => void;
}

export function ModalPaiementMobileMoney({
  cotisationId, tontineId, tontineNom = 'Tontine', montant, devise = 'XAF',
  type = 'depot', onClose, onSuccess,
}: ModalProps) {
  const { profile }          = useAuth();
  const { initierPaiement }  = useMobileMoney();
  const [operateur, setOperateur] = useState('mtn');
  const [telephone, setTelephone] = useState('');
  const [etape,     setEtape]     = useState<'form'|'traitement'|'succes'|'echec'>('form');
  const [refResult,  setRefResult]  = useState('');
  const [numeroRecu, setNumeroRecu] = useState('');
  const [telSubmitted, setTelSubmitted] = useState('');
  const [errMsg,    setErrMsg]    = useState('');
  const [telecharge, setTelecharge] = useState(false);

  const teleValid = telephone.replace(/\s/g, '').length >= 9;
  const opCourant = OPERATEURS.find(o => o.id === operateur)!;

  async function handlePayer() {
    if (!teleValid) return;
    setEtape('traitement');
    try {
      const telNettoye = telephone.replace(/\s/g, '');
      const result = await initierPaiement.mutateAsync({
        cotisationId, tontineId, montant, operateur,
        telephone: telNettoye, type,
      });
      setRefResult(result.reference);
      setNumeroRecu(result.numeroRecu);
      setTelSubmitted(telNettoye);
      setEtape('succes');
      onSuccess?.();
    } catch (err: any) {
      setErrMsg(err.message ?? 'Erreur');
      setEtape('echec');
    }
  }

  async function handleTelechargerRecu() {
    if (!numeroRecu || !profile) return;
    try {
      await genererRecuPdf({
        numero_recu:   numeroRecu,
        reference:     refResult,
        montant,
        devise,
        operateur,
        type,
        date:          new Date(),
        tontine_nom:   tontineNom,
        membre_nom:    profile.nom,
        membre_prenom: profile.prenom,
      });
      setTelecharge(true);
    } catch {
      toast.error('Impossible de générer le reçu PDF.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-gray-900">
              {type === 'depot' ? 'Payer ma cotisation' : 'Retrait'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Paiement Mobile Money</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <RiCloseLine className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Formulaire */}
        {etape === 'form' && (
          <div className="p-6 space-y-5">
            {/* Montant */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center">
              <p className="text-xs text-primary-600 font-medium mb-1">Montant à payer</p>
              <p className="text-3xl font-display font-bold text-primary-800">
                {formatMontant(montant, devise as any)}
              </p>
            </div>

            {/* Opérateurs avec vrais logos */}
            <div>
              <label className="label">Choisir l'opérateur</label>
              <div className="grid grid-cols-3 gap-3">
                {OPERATEURS.map(op => {
                  const Logo = op.Logo;
                  return (
                    <button key={op.id} onClick={() => setOperateur(op.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        operateur === op.id ? op.selected : `${op.bg} ${op.border}`
                      )}>
                      <Logo />
                      <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                        {op.nom}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="label">Numéro {opCourant.nom}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">+237</span>
                <input type="tel" placeholder="6XX XXX XXX" value={telephone}
                  onChange={e => setTelephone(e.target.value.replace(/[^0-9\s]/g, ''))}
                  className="input pl-16" maxLength={13} />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Préfixes {opCourant.nom} : {opCourant.prefixes}
              </p>
            </div>

            {/* Sécurité */}
            <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3">
              <RiShieldCheckLine className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Vous recevrez un message de confirmation sur votre téléphone pour valider le paiement.
              </p>
            </div>

            <button onClick={handlePayer} disabled={!teleValid}
              className="btn-primary w-full justify-center btn-lg">
              <RiMoneyDollarCircleLine className="w-5 h-5" />
              Payer {formatMontant(montant, devise as any)}
            </button>
          </div>
        )}

        {/* Traitement */}
        {etape === 'traitement' && (
          <div className="p-12 flex flex-col items-center gap-5">
            <div className="relative">
              {operateur === 'mtn'    && <LogoMTN />}
              {operateur === 'orange' && <LogoOrange />}
              {operateur === 'camtel' && <LogoCamtel />}
              <div className="absolute -inset-3 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Traitement en cours…</p>
              <p className="text-sm text-gray-400 mt-1">Vérifiez votre téléphone pour confirmer</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                <RiSmartphoneLine className="w-3.5 h-3.5" /> +237 {telephone}
              </p>
            </div>
          </div>
        )}

        {/* Succès */}
        {etape === 'succes' && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <RiCheckDoubleLine className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-xl">Paiement réussi !</p>
              <p className="text-sm text-gray-500 mt-1">Cotisation enregistrée avec succès.</p>
              <div className="mt-3 bg-gray-50 rounded-xl px-4 py-2 inline-block">
                <p className="text-xs text-gray-400">Référence</p>
                <p className="font-mono text-sm font-bold text-gray-800">{refResult}</p>
              </div>
            </div>

            <button
              onClick={handleTelechargerRecu}
              className="btn-outline w-full justify-center"
            >
              <RiFileDownloadLine className="w-4 h-4" />
              {telecharge ? 'Télécharger à nouveau le reçu' : 'Télécharger mon reçu (PDF)'}
            </button>
            <p className="text-[11px] text-gray-400 -mt-2">
              Reçu signé électroniquement, vérifiable via QR code.
            </p>

            <button onClick={onClose} className="btn-primary w-full justify-center">Fermer</button>
          </div>
        )}

        {/* Échec */}
        {etape === 'echec' && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <RiAlertLine className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-xl">Paiement échoué</p>
              <p className="text-sm text-red-500 mt-1">{errMsg}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="btn-outline flex-1">Fermer</button>
              <button onClick={() => setEtape('form')} className="btn-primary flex-1 justify-center">Réessayer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
