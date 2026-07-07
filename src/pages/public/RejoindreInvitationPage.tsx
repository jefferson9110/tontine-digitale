import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RiGroupLine, RiMoneyDollarCircleLine, RiCalendarLine,
  RiCheckLine, RiLoader4Line, RiShieldCheckLine,
  RiUserLine, RiErrorWarningLine, RiArrowRightLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontant, getFrequenceLabel, cn } from '../../lib/utils';

// ── Mock tontine depuis le token ─────────────────
const MOCK_TONTINE_INVITE = {
  id: '1',
  nom: 'Njangi Fonctionnaires Yaoundé',
  description: 'Tontine mensuelle des fonctionnaires du ministère des finances.',
  organisateur_nom: 'Marcelline Tsague',
  montant_cotisation: 25000,
  devise: 'XAF' as const,
  frequence: 'mensuel' as const,
  membres_actuels: 9,
  nombre_membres_max: 12,
  cycle_actuel: 8,
  total_cycles: 12,
  date_debut: '2026-01-01',
  penalite_retard: 5,
  statut: 'active' as const,
};

type PageState = 'loading' | 'invalide' | 'deja_membre' | 'apercu' | 'succes';

export function RejoindreInvitationPage() {
  const { token }   = useParams<{ token: string }>();
  const { session, profile } = useAuth();
  const navigate    = useNavigate();

  const [state,    setState]   = useState<PageState>('loading');
  const [joining,  setJoining] = useState(false);
  const [tontine,  setTontine] = useState<typeof MOCK_TONTINE_INVITE | null>(null);

  // Simuler la validation du token
  useEffect(() => {
    async function validateToken() {
      await new Promise(r => setTimeout(r, 1200));
      if (!token) { setState('invalide'); return; }
      // TODO: Supabase — décoder token, vérifier lien_invitation
      setTontine(MOCK_TONTINE_INVITE);
      setState('apercu');
    }
    validateToken();
  }, [token]);

  async function handleRejoindre() {
    if (!session) {
      // Sauvegarder l'URL et rediriger vers login
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
      navigate('/login');
      return;
    }
    setJoining(true);
    // TODO: supabase.from('membres_tontine').insert({ tontine_id, user_id, statut: 'en_attente' })
    await new Promise(r => setTimeout(r, 1000));
    setState('succes');
    setJoining(false);
  }

  // ── Écran chargement ─────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Vérification de l'invitation…</p>
      </div>
    );
  }

  // ── Lien invalide ────────────────────────────
  if (state === 'invalide') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RiErrorWarningLine className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Lien invalide ou expiré
          </h1>
          <p className="text-gray-500 mb-8">
            Ce lien d'invitation n'est pas valide ou a expiré.
            Demandez un nouveau lien à l'organisateur de la tontine.
          </p>
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  // ── Succès ───────────────────────────────────
  if (state === 'succes') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RiCheckLine className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Demande envoyée !
          </h1>
          <p className="text-gray-500 mb-2">
            Votre demande pour rejoindre{' '}
            <strong className="text-gray-800">{tontine?.nom}</strong> a été envoyée.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            L'organisateur doit valider votre adhésion.
            Vous recevrez une notification dès que c'est fait.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="btn-primary justify-center">
              Aller à mon tableau de bord
              <RiArrowRightLine className="w-4 h-4" />
            </Link>
            <Link to="/tontines" className="btn-outline justify-center">
              Voir mes tontines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Aperçu tontine + bouton rejoindre ────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar minimale */}
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
        {/* Badge invitation */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full">
            <RiGroupLine className="w-4 h-4" />
            Invitation à rejoindre une tontine
          </span>
        </div>

        {/* Card principale */}
        {tontine && (
          <div className="card">
            {/* En-tête tontine */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-display font-bold text-2xl">
                  {tontine.nom.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-gray-900 text-xl leading-tight">
                  {tontine.nom}
                </h1>
                {tontine.description && (
                  <p className="text-sm text-gray-500 mt-1">{tontine.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <RiUserLine className="w-3.5 h-3.5" />
                  Organisé par <strong className="text-gray-600 ml-1">{tontine.organisateur_nom}</strong>
                </p>
              </div>
            </div>

            {/* Membres */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Places disponibles</span>
                <span className="text-sm font-bold text-gray-800">
                  {tontine.membres_actuels}/{tontine.nombre_membres_max} membres
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    tontine.membres_actuels >= tontine.nombre_membres_max ? 'bg-red-400' : 'bg-primary-500'
                  )}
                  style={{ width: `${(tontine.membres_actuels / tontine.nombre_membres_max) * 100}%` }}
                />
              </div>
              {tontine.membres_actuels >= tontine.nombre_membres_max && (
                <p className="text-xs text-red-500 mt-1">Cette tontine est complète.</p>
              )}
            </div>

            {/* Grille infos */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                {
                  icon: RiMoneyDollarCircleLine,
                  label: 'Cotisation',
                  val: formatMontant(tontine.montant_cotisation, tontine.devise),
                  cls: 'bg-primary-50 text-primary-700',
                },
                {
                  icon: RiCalendarLine,
                  label: 'Fréquence',
                  val: getFrequenceLabel(tontine.frequence),
                  cls: 'bg-amber-50 text-amber-700',
                },
                {
                  icon: RiGroupLine,
                  label: 'Cagnotte par tour',
                  val: formatMontant(tontine.montant_cotisation * tontine.nombre_membres_max, tontine.devise),
                  cls: 'bg-green-50 text-green-700',
                },
                {
                  icon: RiCalendarLine,
                  label: 'Progression',
                  val: `Cycle ${tontine.cycle_actuel}/${tontine.total_cycles}`,
                  cls: 'bg-violet-50 text-violet-700',
                },
              ].map(({ icon: Icon, label, val, cls }) => (
                <div key={label} className={`rounded-xl p-3 ${cls.split(' ')[0]}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${cls.split(' ')[1]}`} />
                    <span className={`text-xs font-medium ${cls.split(' ')[1]}`}>{label}</span>
                  </div>
                  <p className="font-display font-bold text-gray-900 text-sm">{val}</p>
                </div>
              ))}
            </div>

            {/* Règles si pénalité */}
            {tontine.penalite_retard > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
                <RiShieldCheckLine className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Règle de pénalité :</strong> tout retard de paiement entraîne une pénalité
                  de <strong>{tontine.penalite_retard}%</strong> du montant dû
                  ({formatMontant(tontine.montant_cotisation * tontine.penalite_retard / 100, tontine.devise)}).
                </p>
              </div>
            )}

            {/* Bouton rejoindre */}
            {tontine.membres_actuels < tontine.nombre_membres_max ? (
              <button
                onClick={handleRejoindre}
                disabled={joining}
                className="btn-primary w-full justify-center btn-lg"
              >
                {joining ? (
                  <><RiLoader4Line className="w-5 h-5 animate-spin" /> Envoi en cours…</>
                ) : session ? (
                  <><RiCheckLine className="w-5 h-5" /> Rejoindre cette tontine</>
                ) : (
                  <><RiUserLine className="w-5 h-5" /> Se connecter pour rejoindre</>
                )}
              </button>
            ) : (
              <button disabled className="btn w-full justify-center btn-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                Tontine complète
              </button>
            )}

            {/* Pas de compte */}
            {!session && (
              <p className="text-center text-xs text-gray-400 mt-4">
                Pas encore de compte ?{' '}
                <Link
                  to={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
                  className="text-primary-600 font-semibold hover:underline"
                >
                  Créer un compte gratuit
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Mention sécurité */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <RiShieldCheckLine className="w-3.5 h-3.5" />
          Plateforme sécurisée · Vos données sont protégées
        </div>
      </div>
    </div>
  );
}