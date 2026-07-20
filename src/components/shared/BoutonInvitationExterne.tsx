// ════════════════════════════════════════════════
//  BoutonInvitationExterne.tsx
//  À ajouter dans OngletMembres de TontineDetailPage
//  Génère un lien partageable via WhatsApp/SMS/email
//  Ne modifie aucune autre logique existante
// ════════════════════════════════════════════════

import { useState } from 'react';
import {
  RiShareLine, RiWhatsappLine, RiFileCopyLine,
  RiLoader4Line, RiCheckLine, RiCloseLine,
  RiLinkM,
} from 'react-icons/ri';
import { supabase }  from '../../lib/supabase';
import { useAuth }   from '../../contexts/AuthContext';
import { cn }        from '../../lib/utils';
import toast         from 'react-hot-toast';

interface Props {
  tontineId:   string;
  tontineNom:  string;
}

export function BoutonInvitationExterne({ tontineId, tontineNom }: Props) {
  const { profile }         = useAuth();
  const [loading,  setLoading]  = useState(false);
  const [lien,     setLien]     = useState<string | null>(null);
  const [show,     setShow]     = useState(false);
  const [copied,   setCopied]   = useState(false);

  async function genererLien() {
    if (lien) { setShow(true); return; } // Réutiliser le lien déjà généré
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('creer_invitation_externe', {
          p_tontine_id: tontineId,
          p_email_cible: null,
        });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;
      const url = `${baseUrl}/invitation/${data.token}`;
      setLien(url);
      setShow(true);
    } catch (err: any) {
      toast.error(err.message ?? 'Erreur lors de la génération du lien');
    } finally {
      setLoading(false);
    }
  }

  function copierLien() {
    if (!lien) return;
    navigator.clipboard.writeText(lien);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success('Lien copié !');
  }

  function partagerWhatsApp() {
    if (!lien) return;
    const msg = encodeURIComponent(
      `🤝 *${profile?.prenom} ${profile?.nom}* vous invite à rejoindre la tontine *"${tontineNom}"* sur TontineDigitale.\n\nCliquez ici pour voir les détails et rejoindre :\n${lien}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  function partagerSMS() {
    if (!lien) return;
    const msg = encodeURIComponent(
      `${profile?.prenom} vous invite à rejoindre "${tontineNom}" sur TontineDigitale : ${lien}`
    );
    window.open(`sms:?body=${msg}`, '_blank');
  }

  return (
    <>
      <button
        onClick={genererLien}
        disabled={loading}
        className="btn-outline"
      >
        {loading
          ? <RiLoader4Line className="w-4 h-4 animate-spin" />
          : <RiShareLine className="w-4 h-4" />}
        Inviter par lien
      </button>

      {/* Modal partage */}
      {show && lien && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h3 className="font-display font-bold text-gray-900 dark:text-slate-100">
                  Partager l'invitation
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Valable 7 jours · Sans inscription préalable
                </p>
              </div>
              <button onClick={() => setShow(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <RiCloseLine className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Lien copiable */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                  Lien d'invitation
                </label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 rounded-xl p-3 border border-gray-200 dark:border-slate-600">
                  <RiLinkM className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-600 dark:text-slate-300 font-mono flex-1 truncate">
                    {lien}
                  </p>
                </div>
              </div>

              {/* Bouton copier */}
              <button onClick={copierLien} className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-primary-600 text-white hover:bg-primary-500'
              )}>
                {copied
                  ? <><RiCheckLine className="w-4 h-4" /> Lien copié !</>
                  : <><RiFileCopyLine className="w-4 h-4" /> Copier le lien</>
                }
              </button>

              {/* Partage direct */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Partager directement
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={partagerWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 font-semibold text-sm transition-colors">
                    <RiWhatsappLine className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button onClick={partagerSMS}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 font-semibold text-sm transition-colors">
                    <RiShareLine className="w-4 h-4" />
                    SMS
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>Comment ça marche :</strong> La personne clique sur le lien,
                  voit les détails de la tontine, et peut créer son compte si elle n'en a pas.
                  Elle rejoint automatiquement après inscription.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}