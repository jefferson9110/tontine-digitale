import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RiGroupLine, RiMoneyDollarCircleLine, RiCalendarLine,
  RiCheckLine, RiLoader4Line, RiShieldCheckLine,
  RiUserLine, RiErrorWarningLine, RiArrowRightLine,
  RiLockLine,
} from 'react-icons/ri';
import { useAuth }     from '../../contexts/AuthContext';
import { supabase }    from '../../lib/supabase';
import { formatMontant, getFrequenceLabel, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────
interface TontinePreview {
  id:                 string;
  nom:                string;
  description:        string;
  montant_cotisation: number;
  devise:             string;
  frequence:          string;
  nombre_membres_max: number;
  cycle_actuel:       number;
  total_cycles:       number;
  penalite_retard:    number;
  statut:             string;
  organisateur_nom:   string;
  membres_count:      number;
}

type PageState = 'loading' | 'invalide' | 'complete' | 'apercu' | 'succes';

export function RejoindreInvitationPage() {
  const { token }               = useParams<{ token: string }>();
  const { session, profile }    = useAuth();
  const navigate                = useNavigate();

  const [state,    setState]    = useState<PageState>('loading');
  const [tontine,  setTontine]  = useState<TontinePreview | null>(null);
  const [joining,  setJoining]  = useState(false);

  // ── Valider le token et charger la tontine ──────
  useEffect(() => {
    async function chargerTontine() {
      if (!token) { setState('invalide'); return; }

      try {
        // Chercher la tontine via son lien_invitation
        const { data, error } = await supabase
          .from('tontines')
          .select(`
            id, nom, description, montant_cotisation, devise,
            frequence, nombre_membres_max, cycle_actuel,
            total_cycles, penalite_retard, statut,
            organisateur:profiles(nom, prenom)
          `)
          .eq('lien_invitation', token)
          .single();

        if (error || !data) {
          setState('invalide');
          return;
        }

        // Compter les membres actifs
        const { count } = await supabase
          .from('membres_tontine')
          .select('id', { count: 'exact', head: true })
          .eq('tontine_id', data.id)
          .in('statut', ['actif', 'en_attente']);

        // Vérifier si l'utilisateur est déjà membre
        if (session && profile) {
          const { data: existant } = await supabase
            .from('membres_tontine')
            .select('id, statut')
            .eq('tontine_id', data.id)
            .eq('user_id', profile.id)
            .maybeSingle();

          if (existant) {
            setState('complete');
            return;
          }
        }

        const orga = data.organisateur as any;

        setTontine({
          id:                 data.id,
          nom:                data.nom,
          description:        data.description ?? '',
          montant_cotisation: data.montant_cotisation,
          devise:             data.devise,
          frequence:          data.frequence,
          nombre_membres_max: data.nombre_membres_max,
          cycle_actuel:       data.cycle_actuel,
          total_cycles:       data.total_cycles,
          penalite_retard:    data.penalite_retard,
          statut:             data.statut,
          organisateur_nom:   `${orga?.prenom ?? ''} ${orga?.nom ?? ''}`.trim(),
          membres_count:      count ?? 0,
        });

        setState('apercu');
      } catch {
        setState('invalide');
      }
    }

    chargerTontine();
  }, [token, session, profile]);

  // ── Rejoindre la tontine ────────────────────────
  async function handleRejoindre() {
    if (!session || !profile || !tontine) {
      // Sauvegarder la page pour rediriger après login
      sessionStorage.setItem('redirect_after_login', window.location.pathname);
      navigate('/login');
      return;
    }

    if (tontine.membres_count >= tontine.nombre_membres_max) {
      toast.error('Cette tontine est complète.');
      return;
    }

    setJoining(true);
    try {
      // Vérifier doublon
      const { data: existing } = await supabase
        .from('membres_tontine')
        .select('id')
        .eq('tontine_id', tontine.id)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existing) {
        toast.error('Vous êtes déjà membre de cette tontine.');
        setState('complete');
        return;
      }

      // Insérer le membre avec statut en_attente
      const { error } = await supabase
        .from('membres_tontine')
        .insert({
          tontine_id: tontine.id,
          user_id:    profile.id,
          role:       'membre',
          statut:     'en_attente',
        });

      if (error) throw error;

      // Notifier l'organisateur
      const { data: tontineData } = await supabase
        .from('tontines')
        .select('organisateur_id')
        .eq('id', tontine.id)
        .single();

      if (tontineData?.organisateur_id) {
        await supabase.from('notifications').insert({
          user_id: tontineData.organisateur_id,
          type:    'nouveau_membre',
          titre:   'Nouvelle demande d\'adhésion',
          message: `${profile.prenom} ${profile.nom} souhaite rejoindre votre tontine "${tontine.nom}".`,
          lu:      false,
        });
      }

      setState('succes');
    } catch (err: any) {
      toast.error(err.message ?? 'Une erreur est survenue.');
    } finally {
      setJoining(false);
    }
  }

  // ── Écran chargement ─────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Vérification de l'invitation…</p>
      </div>
    );
  }

  // ── Lien invalide ─────────────────────────────────
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
            Ce lien d'invitation n'est pas valide. Demandez un nouveau lien à l'organisateur.
          </p>
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  // ── Déjà membre ───────────────────────────────────
  if (state === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RiCheckLine className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Vous êtes déjà membre
          </h1>
          <p className="text-gray-500 mb-8">
            Vous faites déjà partie de cette tontine ou votre demande est en cours de traitement.
          </p>
          <Link to="/tontines" className="btn-primary">Voir mes tontines</Link>
        </div>
      </div>
    );
  }

  // ── Succès ─────────────────────────────────────────
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
            L'organisateur doit valider votre adhésion. Vous recevrez une notification dès que c'est fait.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="btn-primary justify-center">
              Aller à mon tableau de bord
              <RiArrowRightLine className="w-4 h-4" />
            </Link>
            <Link to="/notifications" className="btn-outline justify-center">
              Voir mes notifications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Aperçu tontine ─────────────────────────────────
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

        {tontine && (
          <div className="card">
            {/* En-tête */}
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
                {tontine.organisateur_nom && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <RiUserLine className="w-3.5 h-3.5" />
                    Organisé par <strong className="text-gray-600 ml-1">{tontine.organisateur_nom}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Barre de places */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Places disponibles</span>
                <span className="text-sm font-bold text-gray-800">
                  {tontine.membres_count}/{tontine.nombre_membres_max} membres
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    tontine.membres_count >= tontine.nombre_membres_max
                      ? 'bg-red-400'
                      : 'bg-primary-500'
                  )}
                  style={{ width: `${(tontine.membres_count / tontine.nombre_membres_max) * 100}%` }}
                />
              </div>
              {tontine.membres_count >= tontine.nombre_membres_max && (
                <p className="text-xs text-red-500 mt-1">Cette tontine est complète.</p>
              )}
            </div>

            {/* Infos en grille */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                {
                  icon: RiMoneyDollarCircleLine,
                  label: 'Cotisation',
                  val: formatMontant(tontine.montant_cotisation, tontine.devise as any),
                  cls: 'bg-primary-50 text-primary-800',
                },
                {
                  icon: RiCalendarLine,
                  label: 'Fréquence',
                  val: getFrequenceLabel(tontine.frequence as any),
                  cls: 'bg-amber-50 text-amber-800',
                },
                {
                  icon: RiGroupLine,
                  label: 'Cagnotte par tour',
                  val: formatMontant(
                    tontine.montant_cotisation * tontine.nombre_membres_max,
                    tontine.devise as any
                  ),
                  cls: 'bg-green-50 text-green-800',
                },
                {
                  icon: RiCalendarLine,
                  label: 'Progression',
                  val: `Cycle ${tontine.cycle_actuel}/${tontine.total_cycles}`,
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

            {/* Règle pénalité */}
            {tontine.penalite_retard > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
                <RiShieldCheckLine className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>Pénalité de retard :</strong> {tontine.penalite_retard}% du montant dû
                  ({formatMontant(tontine.montant_cotisation * tontine.penalite_retard / 100, tontine.devise as any)})
                  après délai de grâce.
                </p>
              </div>
            )}

            {/* Tontine suspendue */}
            {tontine.statut === 'suspendue' && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5 flex items-start gap-2.5">
                <RiErrorWarningLine className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  Cette tontine est actuellement suspendue. Les nouvelles adhésions ne sont pas possibles.
                </p>
              </div>
            )}

            {/* Bouton rejoindre */}
            {tontine.statut !== 'suspendue' &&
             tontine.membres_count < tontine.nombre_membres_max ? (
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
                  <><RiLockLine className="w-5 h-5" /> Se connecter pour rejoindre</>
                )}
              </button>
            ) : (
              <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed">
                {tontine.statut === 'suspendue' ? 'Tontine suspendue' : 'Tontine complète'}
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

        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <RiShieldCheckLine className="w-3.5 h-3.5" />
          Plateforme sécurisée · Vos données sont protégées
        </div>
      </div>
    </div>
  );
}