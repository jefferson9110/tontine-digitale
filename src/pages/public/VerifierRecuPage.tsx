import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  RiShieldCheckLine, RiCloseCircleLine, RiLoader4Line,
  RiFileTextLine, RiCalendarLine, RiSmartphoneLine,
  RiGroupLine, RiUserLine,
} from 'react-icons/ri';
import { supabase } from '../../lib/supabase';
import { formatMontant } from '../../lib/utils';

interface RecuVerifie {
  valide:           boolean;
  message?:         string;
  numero_recu?:     string;
  reference?:       string;
  montant?:         number;
  operateur?:       string;
  type?:            string;
  statut?:          string;
  date_paiement?:   string;
  tontine_nom?:     string;
  membre?:          string;
  telephone_masque?: string;
}

const OPERATEUR_LABEL: Record<string, string> = {
  mtn: 'MTN Mobile Money',
  orange: 'Orange Money',
  camtel: 'Camtel Mobile Money',
};

export function VerifierRecuPage() {
  const { numero } = useParams<{ numero: string }>();
  const [loading, setLoading] = useState(true);
  const [result,  setResult]  = useState<RecuVerifie | null>(null);

  useEffect(() => {
    async function verifier() {
      if (!numero) { setResult({ valide: false, message: 'Numéro de reçu manquant.' }); setLoading(false); return; }

      const { data, error } = await supabase.rpc('verifier_recu', { p_numero_recu: numero });

      if (error) {
        setResult({ valide: false, message: "Erreur lors de la vérification." });
      } else {
        setResult(data as RecuVerifie);
      }
      setLoading(false);
    }
    verifier();
  }, [numero]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Vérification du reçu…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-display font-bold text-gray-900">
            Tontine<span className="text-primary-600">Digitale</span>
          </span>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-5">
        {result?.valide ? (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <RiShieldCheckLine className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-gray-900">Reçu authentique</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Ce document a été vérifié et signé par TontineDigitale.
                </p>
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="text-xs text-gray-400 font-medium">N° de reçu</span>
                <span className="font-mono font-bold text-gray-900">{result.numero_recu}</span>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-green-700 font-medium mb-1">Montant payé</p>
                <p className="text-2xl font-display font-bold text-green-800">
                  {formatMontant(result.montant ?? 0)}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <RiGroupLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Tontine :</span>
                  <span className="font-semibold text-gray-800 ml-auto text-right">{result.tontine_nom}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RiUserLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Membre :</span>
                  <span className="font-semibold text-gray-800 ml-auto text-right">{result.membre}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RiSmartphoneLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Opérateur :</span>
                  <span className="font-semibold text-gray-800 ml-auto text-right">
                    {OPERATEUR_LABEL[result.operateur ?? ''] ?? result.operateur} · {result.telephone_masque}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RiCalendarLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Date :</span>
                  <span className="font-semibold text-gray-800 ml-auto text-right">
                    {result.date_paiement
                      ? new Date(result.date_paiement).toLocaleString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RiFileTextLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Référence :</span>
                  <span className="font-mono text-xs font-semibold text-gray-800 ml-auto text-right">
                    {result.reference}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400">
              Cette page recalcule la signature cryptographique du reçu à chaque consultation :
              toute modification du document original serait immédiatement détectée.
            </p>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <RiCloseCircleLine className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900">Reçu invalide</h1>
              <p className="text-sm text-gray-500 mt-1">
                {result?.message ?? "Ce reçu n'a pas pu être vérifié."}
              </p>
            </div>
            <Link to="/" className="btn-primary inline-flex">Retour à l'accueil</Link>
          </div>
        )}
      </div>
    </div>
  );
}
