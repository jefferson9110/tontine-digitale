import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiEyeLine, RiEyeOffLine, RiLoader4Line,
  RiCheckLine, RiShieldCheckLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface FormData {
  prenom:          string;
  nom:             string;
  email:           string;
  telephone:       string;
  password:        string;
  confirmPassword: string;
}

const INITIAL: FormData = {
  prenom: '', nom: '', email: '', telephone: '', password: '', confirmPassword: '',
};

// Indicateur force du mot de passe
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { ok: password.length >= 8,          label: '8 caractères minimum' },
    { ok: /[A-Z]/.test(password),        label: 'Une majuscule' },
    { ok: /[0-9]/.test(password),        label: 'Un chiffre' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Un caractère spécial' },
  ];

  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-primary-500'];
  const labels = ['Faible', 'Moyen', 'Bon', 'Fort'];

  return (
    <div className="mt-2 space-y-2">
      {/* Barre de force */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < score ? colors[score - 1] : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Force : <span className="font-medium text-gray-700">{labels[score - 1] ?? 'Trop court'}</span>
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map(({ ok, label }) => (
          <li key={label} className={cn('text-xs flex items-center gap-1.5', ok ? 'text-primary-600' : 'text-gray-400')}>
            <RiCheckLine className={cn('w-3.5 h-3.5', ok ? 'opacity-100' : 'opacity-30')} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [form,     setForm]     = useState<FormData>(INITIAL);
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Partial<FormData>>({});
  const [success,  setSuccess]  = useState(false);

  function update(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    };
  }

  function validate(): boolean {
    const errs: Partial<FormData> = {};

    if (!form.prenom.trim())        errs.prenom = 'Prénom requis.';
    if (!form.nom.trim())           errs.nom    = 'Nom requis.';
    if (!form.email.trim())         errs.email  = 'Email requis.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide.';
    if (!form.password)             errs.password = 'Mot de passe requis.';
    else if (form.password.length < 8) errs.password = '8 caractères minimum.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Les mots de passe ne correspondent pas.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(form.email.trim(), form.password, {
        nom:        form.nom.trim(),
        prenom:     form.prenom.trim(),
        telephone:  form.telephone.trim() || undefined,
        role_global: 'membre',
      } as any);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setErrors({ email: 'Cet email est déjà utilisé.' });
      } else {
        toast.error('Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Écran de succès ───────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RiCheckLine className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Compte créé avec succès !
          </h1>
          <p className="text-gray-500 mb-2">
            Un email de confirmation a été envoyé à <strong className="text-gray-700">{form.email}</strong>.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Vérifiez votre boîte mail (et les spams) puis cliquez sur le lien pour activer votre compte.
          </p>
          <Link to="/login" className="btn-primary w-full justify-center">
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulaire ────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche décoratif */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-700/20 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary-500/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-white font-display font-bold text-xl">
            Tontine<span className="text-primary-300">Digitale</span>
          </span>
        </div>

        {/* Avantages */}
        <div className="relative space-y-5">
          <h2 className="text-2xl font-display font-bold text-white leading-snug mb-6">
            Rejoignez des milliers de tontines<br />
            <span className="text-secondary-400">déjà digitalisées.</span>
          </h2>
          {[
            { emoji: '📊', titre: 'Tableaux de bord complets', desc: 'Visualisez l\'historique de votre tontine cycle par cycle.' },
            { emoji: '🔒', titre: 'Données sécurisées', desc: 'Sécurité au niveau base de données. Vos données vous appartiennent.' },
            { emoji: '🌍', titre: 'Accessible de partout', desc: 'De Yaoundé, Douala, Paris ou Montréal. Aucune contrainte géographique.' },
            { emoji: '⭐', titre: 'Score de fiabilité', desc: 'Construisez votre réputation financière au fil des cycles.' },
          ].map(({ emoji, titre, desc }) => (
            <div key={titre} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{emoji}</span>
              <div>
                <p className="text-white font-semibold text-sm">{titre}</p>
                <p className="text-primary-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative flex items-center gap-2 text-primary-400 text-sm">
          <RiShieldCheckLine className="w-4 h-4 text-primary-500" />
          100% gratuit · Aucune carte bancaire requise
        </div>
      </div>

      {/* Panneau droit formulaire */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-10 bg-gray-50 overflow-y-auto">
        {/* Logo mobile */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">
            Tontine<span className="text-primary-600">Digitale</span>
          </span>
        </div>

        <div className="w-full max-w-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">
              Créer un compte gratuit
            </h1>
            <p className="text-gray-500 text-sm">
              Quelques secondes et votre espace est prêt.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="label">Prénom</label>
                <input
                  id="prenom"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Marie"
                  value={form.prenom}
                  onChange={update('prenom')}
                  className={cn('input', errors.prenom && 'input-error')}
                  disabled={loading}
                />
                {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
              </div>
              <div>
                <label htmlFor="nom" className="label">Nom</label>
                <input
                  id="nom"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Tenkam"
                  value={form.nom}
                  onChange={update('nom')}
                  className={cn('input', errors.nom && 'input-error')}
                  disabled={loading}
                />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="label">Adresse email</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="marie.tenkam@exemple.com"
                value={form.email}
                onChange={update('email')}
                className={cn('input', errors.email && 'input-error')}
                disabled={loading}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Téléphone (optionnel) */}
            <div>
              <label htmlFor="telephone" className="label">
                Téléphone <span className="text-gray-400 font-normal">(facultatif)</span>
              </label>
              <input
                id="telephone"
                type="tel"
                autoComplete="tel"
                placeholder="+237 6XX XXX XXX"
                value={form.telephone}
                onChange={update('telephone')}
                className="input"
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="reg-password" className="label">Mot de passe</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimum 8 caractères"
                  value={form.password}
                  onChange={update('password')}
                  className={cn('input pr-11', errors.password && 'input-error')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  tabIndex={-1}
                >
                  {showPwd ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="label">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Répétez votre mot de passe"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                className={cn('input', errors.confirmPassword && 'input-error')}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                <p className="text-primary-600 text-xs mt-1 flex items-center gap-1">
                  <RiCheckLine className="w-3.5 h-3.5" /> Les mots de passe correspondent
                </p>
              )}
            </div>

            {/* CGU */}
            <p className="text-xs text-gray-400 leading-relaxed">
              En créant un compte, vous acceptez que vos données soient utilisées dans le cadre de la gestion de vos tontines sur cette plateforme.
            </p>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center btn-lg"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-5 h-5 animate-spin" />
                  Création du compte…
                </>
              ) : (
                'Créer mon compte gratuitement'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Se connecter
            </Link>
          </p>

          <div className="mt-6 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}