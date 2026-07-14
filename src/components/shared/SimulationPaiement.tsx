// ════════════════════════════════════════════════
//  SimulationPaiement.tsx
//  Composant modal de simulation paiement Mobile Money
//  Utilisé dans CotisationsPage (onglet organisateur)
//  Autonome — n'affecte aucune autre page
//  À créer dans : src/components/shared/SimulationPaiement.tsx
// ════════════════════════════════════════════════

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  RiCloseLine, RiLoader4Line, RiCheckDoubleLine,
  RiAlertLine, RiShieldCheckLine, RiSmartphoneLine,
} from 'react-icons/ri';
import { supabase }      from '../../lib/supabase';
import { useAuth }       from '../../contexts/AuthContext';
import { formatMontant, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ── SVG Logos opérateurs ─────────────────────────
const LogoMTN = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10">
    <circle cx="24" cy="24" r="24" fill="#FFCC00"/>
    <text x="24" y="20" textAnchor="middle" fill="#000"
      fontSize="8" fontWeight="900" fontFamily="Arial">MTN</text>
    <text x="24" y="30" textAnchor="middle" fill="#000"
      fontSize="6" fontFamily="Arial">MoMo</text>
  </svg>
);

const LogoOrange = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10">
    <circle cx="24" cy="24" r="24" fill="#FF6600"/>
    <rect x="10" y="16" width="28" height="16" rx="2" fill="white"/>
    <text x="24" y="28" textAnchor="middle" fill="#FF6600"
      fontSize="7" fontWeight="900" fontFamily="Arial">orange</text>
  </svg>
);

const LogoCamtel = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10">
    <circle cx="24" cy="24" r="24" fill="#003087"/>
    <text x="24" y="22" textAnchor="middle" fill="#fff"
      fontSize="6" fontWeight="900" fontFamily="Arial">CAMTEL</text>
    <text x="24" y="32" textAnchor="middle" fill="#FFD700"
      fontSize="6" fontFamily="Arial">Mobile</text>
  </svg>
);

// ── Config opérateurs ────────────────────────────
const OPERATEURS = [
  {
    id:       'mtn',
    nom:      'MTN MoMo',
    Logo:     LogoMTN,
    selected: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 ring-2 ring-yellow-400',
    default:  'border-gray-200 dark:border-slate-600 hover:border-yellow-300',
    prefixes: '670-679',
  },
  {
    id:       'orange',
    nom:      'Orange Money',
    Logo:     LogoOrange,
    selected: 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 ring-2 ring-orange-400',
    default:  'border-gray-200 dark:border-slate-600 hover:border-orange-300',
    prefixes: '655-659',
  },
  {
    id:       'camtel',
    nom:      'Camtel Mobile',
    Logo:     LogoCamtel,
    selected: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-400',
    default:  'border-gray-200 dark:border-slate-600 hover:border-blue-300',
    prefixes: '620-621',
  },
];

// ── Génération référence unique ──────────────────
function genRef(op: string): string {
  const pfx = op === 'mtn' ? 'MTN' : op === 'orange' ? 'ORG' : 'CAM';
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${pfx}-${ts}-${rand}`;
}

// ── Types ────────────────────────────────────────
export interface CotisationAValider {
  id:          string;
  tontine_id:  string;
  membre_id:   string;
  user_id:     string;
  cycle_numero: number;
  montant_du:  number;
  penalite:    number;
  devise?:     string;
  user?: {
    prenom?: string;
    nom?:    string;
  } | null;
}

interface Props {
  cotisation: CotisationAValider;
  onClose:   () => void;
  onSuccess?: () => void;
}

type Etape = 'choix' | 'telephone' | 'traitement' | 'succes' | 'echec';

// ════════════════════════════════════════════════
//  Composant principal
// ════════════════════════════════════════════════
export function SimulationPaiement({ cotisation, onClose, onSuccess }: Props) {
  const { profile }        = useAuth();
  const qc                 = useQueryClient();

  const [etape,      setEtape]      = useState<Etape>('choix');
  const [operateur,  setOperateur]  = useState('mtn');
  const [telephone,  setTelephone]  = useState('');
  const [reference,  setReference]  = useState('');
  const [errMsg,     setErrMsg]     = useState('');

  const montantTotal = Number(cotisation.montant_du) + Number(cotisation.penalite);
  const devise       = cotisation.devise ?? 'XAF';
  const membreNom    = cotisation.user
    ? `${cotisation.user.prenom ?? ''} ${cotisation.user.nom ?? ''}`.trim()
    : 'Membre';

  const teleValid = telephone.replace(/\s/g, '').length >= 9;

  // ── Lancer la simulation ─────────────────────
  async function lancerSimulation() {
    if (!teleValid || !profile) return;
    setEtape('traitement');
    setErrMsg('');

    const ref = genRef(operateur);

    try {
      // Simulation du délai de traitement Mobile Money
      await new Promise(r => setTimeout(r, 2500));

      // Simulation : 95% de succès
      const succes = Math.random() > 0.05;

      if (!succes) {
        setErrMsg('Solde insuffisant ou réseau indisponible. Veuillez réessayer.');
        setEtape('echec');
        return;
      }

      // Valider la cotisation en base
      const { error } = await supabase
        .from('cotisations')
        .update({
          statut:        'payee',
          montant_paye:  montantTotal,
          date_paiement: new Date().toISOString(),
          valide_par:    profile.id,
          reference:     ref,
        })
        .eq('id', cotisation.id);

      if (error) throw error;

      // Notifier le membre
      await supabase.from('notifications').insert({
        user_id: cotisation.user_id,
        type:    'paiement_recu',
        titre:   'Cotisation confirmée',
        message: `Votre cotisation du cycle ${cotisation.cycle_numero} a été validée par l'organisateur. Référence : ${ref}.`,
        lu:      false,
      });

      setReference(ref);
      setEtape('succes');

      // Invalider les caches concernés uniquement
      qc.invalidateQueries({ queryKey: ['cotisations', cotisation.tontine_id] });
      qc.invalidateQueries({ queryKey: ['mes_cotisations_full'] });
      qc.invalidateQueries({ queryKey: ['cotisations_impayees'] });

    } catch (err: any) {
      setErrMsg(err.message ?? 'Une erreur est survenue.');
      setEtape('echec');
    }
  }

  // ── Rendu selon l'étape ──────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="font-display font-bold text-gray-900 dark:text-slate-100">
              Valider la cotisation
            </h2>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
              {membreNom} — Cycle {cotisation.cycle_numero}
            </p>
          </div>
          {etape !== 'traitement' && (
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <RiCloseLine className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          )}
        </div>

        {/* ── Étape 1 : Choix opérateur ── */}
        {etape === 'choix' && (
          <div className="p-6 space-y-5">
            {/* Montant */}
            <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
                Montant à valider
              </p>
              <p className="text-3xl font-display font-bold text-primary-800 dark:text-primary-300">
                {formatMontant(montantTotal, devise as any)}
              </p>
              {Number(cotisation.penalite) > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  dont {formatMontant(Number(cotisation.penalite))} de pénalité
                </p>
              )}
            </div>

            {/* Sélection opérateur */}
            <div>
              <label className="label">Opérateur Mobile Money</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {OPERATEURS.map(op => {
                  const Logo = op.Logo;
                  return (
                    <button key={op.id} onClick={() => setOperateur(op.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        operateur === op.id ? op.selected : op.default
                      )}>
                      <Logo />
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 text-center leading-tight">
                        {op.nom}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setEtape('telephone')}
              className="btn-primary w-full justify-center"
            >
              Continuer
            </button>
          </div>
        )}

        {/* ── Étape 2 : Numéro de téléphone ── */}
        {etape === 'telephone' && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3">
              {OPERATEURS.find(o => o.id === operateur)?.Logo &&
                (() => { const Logo = OPERATEURS.find(o => o.id === operateur)!.Logo; return <Logo />; })()
              }
              <div>
                <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
                  {OPERATEURS.find(o => o.id === operateur)?.nom}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Préfixes : {OPERATEURS.find(o => o.id === operateur)?.prefixes}
                </p>
              </div>
            </div>

            <div>
              <label className="label">Numéro du membre</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 text-sm font-semibold">
                  +237
                </span>
                <input
                  type="tel"
                  placeholder="6XX XXX XXX"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value.replace(/[^0-9\s]/g, ''))}
                  className="input pl-16"
                  maxLength={13}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
              <RiShieldCheckLine className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>Simulation</strong> — Aucun vrai paiement ne sera effectué.
                Cette validation met à jour le statut de la cotisation dans la base de données.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEtape('choix')} className="btn-outline flex-1">
                Retour
              </button>
              <button
                onClick={lancerSimulation}
                disabled={!teleValid}
                className="btn-primary flex-1 justify-center"
              >
                <RiSmartphoneLine className="w-4 h-4" />
                Lancer le paiement
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Traitement ── */}
        {etape === 'traitement' && (
          <div className="p-12 flex flex-col items-center gap-5">
            {/* Logo opérateur avec spinner autour */}
            <div className="relative">
              <div className="w-16 h-16 flex items-center justify-center">
                {OPERATEURS.find(o => o.id === operateur)?.Logo &&
                  (() => { const Logo = OPERATEURS.find(o => o.id === operateur)!.Logo; return <Logo />; })()
                }
              </div>
              <div className="absolute -inset-3 border-4 border-gray-100 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
            </div>

            <div className="text-center">
              <p className="font-semibold text-gray-800 dark:text-slate-200">
                Traitement en cours…
              </p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                Validation du paiement Mobile Money
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1">
                <RiSmartphoneLine className="w-3.5 h-3.5" />
                +237 {telephone}
              </p>
            </div>

            {/* Étapes visuelles */}
            <div className="w-full space-y-2 mt-2">
              {[
                'Connexion à l\'opérateur…',
                'Vérification du solde…',
                'Confirmation de la transaction…',
              ].map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                  <RiLoader4Line className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 4 : Succès ── */}
        {etape === 'succes' && (
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
              <RiCheckDoubleLine className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <p className="font-display font-bold text-gray-900 dark:text-slate-100 text-xl">
                Paiement confirmé !
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                La cotisation de {membreNom} a été validée.
              </p>
            </div>

            {/* Récapitulatif */}
            <div className="w-full bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
              {[
                { label: 'Montant',    val: formatMontant(montantTotal, devise as any) },
                { label: 'Opérateur', val: OPERATEURS.find(o => o.id === operateur)?.nom ?? '' },
                { label: 'Téléphone', val: `+237 ${telephone}` },
                { label: 'Cycle',     val: String(cotisation.cycle_numero) },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400 dark:text-slate-500">{label}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{val}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
                <p className="text-xs text-gray-400 dark:text-slate-500">Référence</p>
                <p className="font-mono text-sm font-bold text-gray-800 dark:text-slate-100 mt-0.5">
                  {reference}
                </p>
              </div>
            </div>

            <button
              onClick={() => { onSuccess?.(); onClose(); }}
              className="btn-primary w-full justify-center"
            >
              Fermer
            </button>
          </div>
        )}

        {/* ── Étape 5 : Échec ── */}
        {etape === 'echec' && (
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
              <RiAlertLine className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <div>
              <p className="font-display font-bold text-gray-900 dark:text-slate-100 text-xl">
                Paiement échoué
              </p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">{errMsg}</p>
            </div>

            <div className="flex gap-3 w-full">
              <button onClick={onClose} className="btn-outline flex-1">Fermer</button>
              <button
                onClick={() => { setEtape('telephone'); setErrMsg(''); }}
                className="btn-primary flex-1 justify-center"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}