import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RiEyeLine, RiEyeOffLine, RiLoader4Line, RiShieldCheckLine } from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success('Connexion réussie !');
      // La redirection est gérée par PublicRoute via profile.role_global
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('Invalid login')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Confirmez votre email avant de vous connecter.');
      } else {
        setError('Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Panneau gauche (décoratif) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden flex-col justify-between p-12">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-700/30 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-white font-display font-bold text-xl">
            Tontine<span className="text-primary-300">Digitale</span>
          </span>
        </div>

        {/* Message central */}
        <div className="relative">
          <h2 className="text-3xl font-display font-bold text-white leading-tight mb-5">
            Gérez votre njangi<br />
            <span className="text-secondary-400">sans stress,</span><br />
            depuis n'importe où.
          </h2>
          <p className="text-primary-300 text-base leading-relaxed mb-8">
            Cotisations, bénéficiaires, rapports PDF —<br />
            tout est tracé et transparent.
          </p>

          {/* Mini stats */}
          <div className="flex gap-6">
            {[
              { val: '100%', label: 'Gratuit' },
              { val: '3 rôles', label: 'Admin / Org / Membre' },
              { val: '0 papier', label: 'Tout est numérique' },
            ].map(({ val, label }) => (
              <div key={label}>
                <p className="text-white font-display font-bold text-xl">{val}</p>
                <p className="text-primary-400 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sécurité mention */}
        <div className="relative flex items-center gap-2 text-primary-400 text-sm">
          <RiShieldCheckLine className="w-4 h-4 text-primary-500" />
          Données sécurisées · Chiffrement bout en bout
        </div>
      </div>

      {/* ── Panneau droit (formulaire) ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-12 bg-gray-50">
        {/* Logo mobile */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">
            Tontine<span className="text-primary-600">Digitale</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Entête */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">
              Bon retour 👋
            </h1>
            <p className="text-gray-500 text-sm">
              Connectez-vous pour accéder à votre espace.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Adresse email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className={cn('input', error && 'input-error')}
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="label !mb-0">Mot de passe</label>
                <button
                  type="button"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  tabIndex={-1}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className={cn('input pr-11', error && 'input-error')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  tabIndex={-1}
                >
                  {showPwd
                    ? <RiEyeOffLine className="w-4.5 h-4.5" />
                    : <RiEyeLine className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
                <span className="mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center btn-lg"
            >
              {loading ? (
                <>
                  <RiLoader4Line className="w-5 h-5 animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien inscription */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              Créer un compte gratuit
            </Link>
          </p>

          {/* Retour landing */}
          <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}