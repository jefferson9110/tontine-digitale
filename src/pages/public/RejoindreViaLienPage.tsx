import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RiGroupLine, RiMoneyDollarCircleLine, RiCalendarLine,
  RiUserLine, RiShieldCheckLine, RiLoader4Line,
  RiCheckLine, RiCloseLine, RiErrorWarningLine,
  RiArrowRightLine, RiLoginBoxLine, RiUserAddLine,
} from 'react-icons/ri';
import { supabase }         from '../../lib/supabase';
import { useAuth }          from '../../contexts/AuthContext';
import { formatMontant, getFrequenceLabel, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

type PageState =
  | 'loading'
  | 'invalide'
  | 'expire'
  | 'deja_utilise'
  | 'apercu'       // non connecté — affiche le résumé + boutons
  | 'connecte'     // connecté — prêt à rejoindre
  | 'succes'
  | 'deja_membre';

interface TontineInfo {
  invitation_id: string;
  tontine_id:    string;
  tontine_nom:   string;
  tontine_desc:  string;
  montant:       number;
  devise:        string;
  frequence:     string;
  nb_membres:    number;
  orga_nom:      string;
  email_cible:   string | null;
  expires_at:    string;
}

export function RejoindreViaLienPage() {
  const { token }           = useParams<{ token: string }>();
  const { session, profile } = useAuth();
  const navigate             = useNavigate();

  const [state,    setState]    = useState<PageState>('loading');
  const [info,     setInfo]     = useState<TontineInfo | null>(null);
  const [joining,  setJoining]  = useState(false);

  // ── 1. Valider le token au chargement ──────────
  useEffect(() => {
    async function validerToken() {
      if (!token) { setState('invalide'); return; }

      const { data, error } = await supabase
        .rpc('valider_token_invitation', { p_token: token });

      if (error || !data) { setState('invalide'); return; }

      if (!data.success) {
        if (data.code === 'EXPIRED')      { setState('expire');      return; }
        if (data.code === 'ALREADY_USED') { setState('deja_utilise'); return; }
        setState('invalide'); return;
      }

      setInfo(data as TontineInfo);

      // Si connecté → état connecté, sinon aperçu
      setState(session ? 'connecte' : 'apercu');
    }

    validerToken();
  }, [token, session]);

  // ── 2. Rejoindre la tontine ────────────────────
  async function handleRejoindre() {
    if (!session || !token) return;
    setJoining(true);

    try {
      const { data, error } = await supabase
        .rpc('accepter_invitation_token', { p_token: token });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      setState('succes');
      toast.success(data.message);
    } catch (err: any) {
      if (err.message?.includes('déjà membre')) {
        setState('deja_membre');
      } else {
        toast.error(err.message ?? 'Une erreur est survenue.');
      }
    } finally {
      setJoining(false);
    }
  }

  // ── 3. Sauvegarder token + rediriger ──────────
  function allerSInscrire() {
    // Sauvegarde le token pour y revenir après inscription
    sessionStorage.setItem('invitation_token_pending', token ?? '');
    navigate(`/register?invitation=${token}`);
  }

  function allerSeConnecter() {
    sessionStorage.setItem('invitation_token_pending', token ?? '');
    navigate(`/login?redirect=/invitation/${token}`);
  }

  // ════════════════════════════════════════════════
  //  ÉTATS D'AFFICHAGE
  // ════════════════════════════════════════════════

  // Chargement
  if (state === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Vérification de l'invitation…</p>
    </div>
  );

  // Lien invalide
  if (state === 'invalide') return (
    <CentreMessage
      icon={<RiErrorWarningLine className="w-10 h-10 text-red-500" />}
      iconBg="bg-red-100"
      titre="Lien invalide"
      message="Ce lien d'invitation n'existe pas. Demandez un nouveau lien à l'organisateur."
      action={<Link to="/" className="btn-primary">Retour à l'accueil</Link>}
    />
  );

  // Lien expiré
  if (state === 'expire') return (
    <CentreMessage
      icon={<RiErrorWarningLine className="w-10 h-10 text-amber-500" />}
      iconBg="bg-amber-100"
      titre="Lien expiré"
      message="Ce lien d'invitation a expiré (validité 7 jours). Demandez un nouveau lien à l'organisateur."
      action={<Link to="/" className="btn-primary">Retour à l'accueil</Link>}
    />
  );

  // Déjà utilisé
  if (state === 'deja_utilise') return (
    <CentreMessage
      icon={<RiCheckLine className="w-10 h-10 text-primary-600" />}
      iconBg="bg-primary-100"
      titre="Invitation déjà utilisée"
      message="Ce lien a déjà été utilisé. Rendez-vous dans vos notifications pour voir l'état de votre demande."
      action={
        session
          ? <Link to="/notifications" className="btn-primary">Mes notifications</Link>
          : <Link to="/login" className="btn-primary">Se connecter</Link>
      }
    />
  );

  // Déjà membre
  if (state === 'deja_membre') return (
    <CentreMessage
      icon={<RiCheckLine className="w-10 h-10 text-green-600" />}
      iconBg="bg-green-100"
      titre="Vous êtes déjà membre"
      message={`Vous êtes déjà membre de "${info?.tontine_nom}".`}
      action={<Link to="/tontines" className="btn-primary">Voir mes tontines</Link>}
    />
  );

  // Succès
  if (state === 'succes') return (
    <CentreMessage
      icon={<RiCheckLine className="w-10 h-10 text-green-600" />}
      iconBg="bg-green-100"
      titre="Demande envoyée !"
      message={`Votre demande pour rejoindre "${info?.tontine_nom}" a été envoyée. L'organisateur doit valider votre adhésion. Vous recevrez une notification dès que c'est fait.`}
      action={
        <div className="flex flex-col gap-3 w-full">
          <Link to="/notifications" className="btn-primary justify-center">
            Voir mes notifications <RiArrowRightLine className="w-4 h-4" />
          </Link>
          <Link to="/dashboard" className="btn-outline justify-center">
            Tableau de bord
          </Link>
        </div>
      }
    />
  );

  // ── Aperçu tontine (connecté ou non) ──────────
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
          {session && (
            <span className="ml-auto text-xs text-gray-400">
              Connecté en tant que {profile?.prenom}
            </span>
          )}
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

        {info && (
          <div className="card space-y-5">
            {/* Header tontine */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 font-display font-bold text-2xl">
                  {info.tontine_nom.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-gray-900 text-xl leading-tight">
                  {info.tontine_nom}
                </h1>
                {info.tontine_desc && (
                  <p className="text-sm text-gray-500 mt-1">{info.tontine_desc}</p>
                )}
                {info.orga_nom && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <RiUserLine className="w-3.5 h-3.5" />
                    Organisé par <strong className="text-gray-600 ml-1">{info.orga_nom}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Détails financiers */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: RiMoneyDollarCircleLine,
                  label: 'Cotisation',
                  val: formatMontant(info.montant, info.devise as any),
                  cls: 'bg-primary-50 text-primary-800',
                },
                {
                  icon: RiCalendarLine,
                  label: 'Fréquence',
                  val: getFrequenceLabel(info.frequence as any),
                  cls: 'bg-amber-50 text-amber-800',
                },
                {
                  icon: RiGroupLine,
                  label: 'Cagnotte par tour',
                  val: formatMontant(info.montant * info.nb_membres, info.devise as any),
                  cls: 'bg-green-50 text-green-800',
                },
                {
                  icon: RiUserLine,
                  label: 'Membres max',
                  val: `${info.nb_membres} membres`,
                  cls: 'bg-violet-50 text-violet-800',
                },
              ].map(({ icon: Icon, label, val, cls }) => (
                <div key={label} className={`rounded-xl p-3 ${cls.split(' ')[0]}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${cls.split(' ')[1]}`} />
                    <span className={`text-xs font-medium ${cls.split(' ')[1]}`}>{label}</span>
                  </div>
                  <p className={`font-display font-bold text-sm ${cls.split(' ')[1]}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* Expiration */}
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              <RiShieldCheckLine className="w-3.5 h-3.5 flex-shrink-0" />
              Invitation valable jusqu'au{' '}
              {new Date(info.expires_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>

            {/* ── Actions selon l'état de connexion ── */}

            {/* Connecté → rejoindre directement */}
            {state === 'connecte' && (
              <div className="space-y-3">
                <button
                  onClick={handleRejoindre}
                  disabled={joining}
                  className="btn-primary w-full justify-center btn-lg"
                >
                  {joining
                    ? <><RiLoader4Line className="w-5 h-5 animate-spin" /> Envoi en cours…</>
                    : <><RiCheckLine className="w-5 h-5" /> Rejoindre cette tontine</>
                  }
                </button>
                <p className="text-center text-xs text-gray-400">
                  Connecté en tant que <strong>{profile?.prenom} {profile?.nom}</strong>
                </p>
              </div>
            )}

            {/* Non connecté → s'inscrire ou se connecter */}
            {state === 'apercu' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Pour rejoindre cette tontine
                  </p>
                  <p className="text-xs text-blue-600">
                    Vous devez avoir un compte TontineDigitale. Créez votre compte gratuitement
                    ou connectez-vous — votre invitation sera conservée.
                  </p>
                </div>

                <button
                  onClick={allerSInscrire}
                  className="btn-primary w-full justify-center btn-lg"
                >
                  <RiUserAddLine className="w-5 h-5" />
                  Créer mon compte et rejoindre
                </button>

                <button
                  onClick={allerSeConnecter}
                  className="btn-outline w-full justify-center"
                >
                  <RiLoginBoxLine className="w-4 h-4" />
                  J'ai déjà un compte — Se connecter
                </button>

                <p className="text-center text-xs text-gray-400">
                  Votre invitation sera automatiquement appliquée après connexion.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <RiShieldCheckLine className="w-3.5 h-3.5" />
          Plateforme sécurisée · Données protégées
        </div>
      </div>
    </div>
  );
}

// ── Composant message centré réutilisable ─────────
function CentreMessage({ icon, iconBg, titre, message, action }: {
  icon:    React.ReactNode;
  iconBg:  string;
  titre:   string;
  message: string;
  action:  React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className={`w-20 h-20 ${iconBg} rounded-2xl flex items-center justify-center mx-auto`}>
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">{titre}</h1>
          <p className="text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col items-center gap-3">{action}</div>
      </div>
    </div>
  );
}