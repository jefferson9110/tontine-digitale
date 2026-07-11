import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiEyeLine, RiEyeOffLine, RiLoader4Line, RiCheckLine,
  RiGroupLine, RiStackLine, RiShieldCheckLine, RiArrowRightLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { UserRole } from '../../types';

// ── Types ────────────────────────────────────────
interface FormData {
  prenom:          string;
  nom:             string;
  email:           string;
  telephone:       string;
  password:        string;
  confirmPassword: string;
  role:            'membre' | 'organisateur';
}

const INITIAL: FormData = {
  prenom: '', nom: '', email: '', telephone: '',
  password: '', confirmPassword: '', role: 'membre',
};

// ── Carte de choix de rôle ───────────────────────
function RoleCard({
  selected, value, icon: Icon, titre, description, avantages, onSelect,
}: {
  selected: boolean;
  value: 'membre' | 'organisateur';
  icon: React.ElementType;
  titre: string;
  description: string;
  avantages: string[];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all duration-200',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
          selected ? 'bg-primary-100' : 'bg-gray-100'
        )}>
          <Icon className={cn('w-5 h-5', selected ? 'text-primary-600' : 'text-gray-500')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('font-display font-bold text-sm', selected ? 'text-primary-900' : 'text-gray-800')}>
              {titre}
            </p>
            {/* Radio custom */}
            <div className={cn(
              'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
              selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
            )}>
              {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-0.5 mb-2">{description}</p>

          <ul className="space-y-1">
            {avantages.map(a => (
              <li key={a} className="flex items-center gap-1.5 text-xs">
                <RiCheckLine className={cn('w-3.5 h-3.5 flex-shrink-0', selected ? 'text-primary-500' : 'text-gray-300')} />
                <span className={selected ? 'text-primary-700' : 'text-gray-400'}>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  );
}

// ── Indicateur force mot de passe ────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,          label: '8 caractères min.' },
    { ok: /[A-Z]/.test(password),        label: 'Une majuscule' },
    { ok: /[0-9]/.test(password),        label: 'Un chiffre' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'Caractère spécial' },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-primary-500'];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300',
            i < score ? colors[score - 1] : 'bg-gray-200'
          )} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {checks.map(({ ok, label }) => (
          <span key={label} className={cn('text-xs flex items-center gap-1',
            ok ? 'text-primary-600' : 'text-gray-400'
          )}>
            <RiCheckLine className={cn('w-3 h-3', ok ? 'opacity-100' : 'opacity-30')} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Étape 1 : Choix du rôle ──────────────────────
function EtapeRole({ form, setForm }: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-gray-900 text-lg">Quel est votre rôle ?</h2>
        <p className="text-sm text-gray-400 mt-1">
          Choisissez comment vous souhaitez utiliser TontineDigitale.
          Vous pourrez changer plus tard.
        </p>
      </div>

      <div className="space-y-3">
        <RoleCard
          value="membre"
          selected={form.role === 'membre'}
          icon={RiGroupLine}
          titre="Membre"
          description="Je rejoins des tontines existantes"
          avantages={[
            'Rejoindre des tontines sur invitation',
            'Suivre mes cotisations',
            'Messagerie interne',
            'Recevoir mes cagnottes',
          ]}
          onSelect={() => setForm(f => ({ ...f, role: 'membre' }))}
        />

        <RoleCard
          value="organisateur"
          selected={form.role === 'organisateur'}
          icon={RiStackLine}
          titre="Organisateur"
          description="Je crée et gère mes propres tontines"
          avantages={[
            'Créer des tontines illimitées',
            'Inviter et gérer les membres',
            'Valider les paiements',
            'Rapports PDF & tableaux de bord',
            'Tout ce qu\'a un membre, en plus',
          ]}
          onSelect={() => setForm(f => ({ ...f, role: 'organisateur' }))}
        />
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
        <RiShieldCheckLine className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600">
          <strong>Note :</strong> Les deux rôles sont entièrement gratuits.
          Un organisateur peut aussi être membre dans d'autres tontines.
        </p>
      </div>
    </div>
  );
}

// ── Étape 2 : Informations personnelles ──────────
function EtapeInfos({ form, setForm, errors, showPwd, setShowPwd }: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Partial<FormData>;
  showPwd: boolean;
  setShowPwd: (v: boolean) => void;
}) {
  function update(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-gray-900 text-lg">Vos informations</h2>
        <p className="text-sm text-gray-400 mt-1">
          Vous créez un compte <strong className="text-primary-600">
            {form.role === 'organisateur' ? 'Organisateur' : 'Membre'}
          </strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Prénom <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Marie" value={form.prenom}
            onChange={update('prenom')} autoComplete="given-name"
            className={cn('input', errors.prenom && 'input-error')} />
          {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
        </div>
        <div>
          <label className="label">Nom <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Tenkam" value={form.nom}
            onChange={update('nom')} autoComplete="family-name"
            className={cn('input', errors.nom && 'input-error')} />
          {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
        </div>
      </div>

      <div>
        <label className="label">Email <span className="text-red-500">*</span></label>
        <input type="email" placeholder="marie@exemple.com" value={form.email}
          onChange={update('email')} autoComplete="email"
          className={cn('input', errors.email && 'input-error')} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="label">Téléphone <span className="text-gray-400 font-normal">(facultatif)</span></label>
        <input type="tel" placeholder="+237 6XX XXX XXX" value={form.telephone}
          onChange={update('telephone')} autoComplete="tel" className="input" />
      </div>

      <div>
        <label className="label">Mot de passe <span className="text-red-500">*</span></label>
        <div className="relative">
          <input type={showPwd ? 'text' : 'password'} placeholder="Minimum 8 caractères"
            value={form.password} onChange={update('password')} autoComplete="new-password"
            className={cn('input pr-10', errors.password && 'input-error')} />
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
            {showPwd ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        <PasswordStrength password={form.password} />
      </div>

      <div>
        <label className="label">Confirmer le mot de passe <span className="text-red-500">*</span></label>
        <input type={showPwd ? 'text' : 'password'} placeholder="Répéter le mot de passe"
          value={form.confirmPassword} onChange={update('confirmPassword')}
          autoComplete="new-password"
          className={cn('input', errors.confirmPassword && 'input-error')} />
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        {form.confirmPassword && form.password === form.confirmPassword && (
          <p className="text-primary-600 text-xs mt-1 flex items-center gap-1">
            <RiCheckLine className="w-3.5 h-3.5" /> Mots de passe identiques
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────
export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [etape,    setEtape]    = useState<1 | 2>(1);
  const [form,     setForm]     = useState<FormData>(INITIAL);
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Partial<FormData>>({});
  const [success,  setSuccess]  = useState(false);

  // ── Validation étape 2 ───────────────────────
  function valider(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.prenom.trim())       errs.prenom = 'Prénom requis.';
    if (!form.nom.trim())          errs.nom    = 'Nom requis.';
    if (!form.email.trim())        errs.email  = 'Email requis.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide.';
    if (!form.password)            errs.password = 'Mot de passe requis.';
    else if (form.password.length < 8) errs.password = 'Minimum 8 caractères.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Les mots de passe ne correspondent pas.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSuivant() {
    if (etape === 1) { setEtape(2); return; }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valider()) return;

    setLoading(true);
    try {
      await signUp(form.email.trim(), form.password, {
        nom:        form.nom.trim(),
        prenom:     form.prenom.trim(),
        telephone:  form.telephone.trim() || undefined,
        role_global: form.role,
      } as any);
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setErrors({ email: 'Cet email est déjà utilisé.' });
        setEtape(2);
      } else {
        toast.error('Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Écran succès ─────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RiCheckLine className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-3">
            Compte créé !
          </h1>
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 mb-4">
            {form.role === 'organisateur'
              ? <RiStackLine className="w-4 h-4 text-primary-600" />
              : <RiGroupLine className="w-4 h-4 text-primary-600" />
            }
            <span className="text-sm font-semibold text-primary-700">
              Compte {form.role === 'organisateur' ? 'Organisateur' : 'Membre'} créé
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-2">
            Un email de confirmation a été envoyé à <strong className="text-gray-700">{form.email}</strong>.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Vérifiez votre boîte mail et cliquez sur le lien pour activer votre compte.
          </p>
          <Link to="/login" className="btn-primary w-full justify-center">
            Aller à la connexion <RiArrowRightLine className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulaire en 2 étapes ───────────────────
  return (
    <div className="min-h-screen flex">
      {/* Panneau gauche décoratif */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-700/20 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary-500/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <span className="text-white font-display font-bold text-xl">
            Tontine<span className="text-primary-300">Digitale</span>
          </span>
        </div>

        <div className="relative">
          <h2 className="text-2xl font-display font-bold text-white leading-snug mb-6">
            {form.role === 'organisateur'
              ? <>Créez et gérez<br /><span className="text-secondary-400">vos tontines</span><br />en toute confiance.</>
              : <>Rejoignez des tontines<br /><span className="text-secondary-400">sécurisées</span><br />depuis partout.</>
            }
          </h2>
          {[
            { emoji: '📊', label: 'Tableaux de bord complets' },
            { emoji: '🔒', label: 'Données sécurisées (Supabase RLS)' },
            { emoji: '🌍', label: 'Accessible depuis la diaspora' },
            { emoji: '⭐', label: 'Score de fiabilité TontineScore' },
          ].map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-3 mb-3">
              <span className="text-lg">{emoji}</span>
              <p className="text-primary-200 text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="relative flex items-center gap-2 text-primary-400 text-sm">
          <RiShieldCheckLine className="w-4 h-4 text-primary-500" />
          100% gratuit · Aucune carte bancaire requise
        </div>
      </div>

      {/* Panneau droit */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-10 bg-gray-50 overflow-y-auto">
        {/* Logo mobile */}
        <div className="flex items-center gap-2.5 mb-6 lg:hidden">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">
            Tontine<span className="text-primary-600">Digitale</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Stepper */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0',
                  n < etape  ? 'bg-primary-600 text-white' :
                  n === etape ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                                'bg-gray-200 text-gray-400'
                )}>
                  {n < etape ? <RiCheckLine className="w-4 h-4" /> : n}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block',
                  n === etape ? 'text-primary-600' : 'text-gray-400'
                )}>
                  {n === 1 ? 'Choisir un rôle' : 'Vos informations'}
                </span>
                {n < 2 && <div className={cn('flex-1 h-0.5 mx-1 transition-colors',
                  etape > n ? 'bg-primary-400' : 'bg-gray-200'
                )} />}
              </div>
            ))}
          </div>

          {/* Contenu de l'étape */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {etape === 1 && (
              <EtapeRole form={form} setForm={setForm} />
            )}
            {etape === 2 && (
              <EtapeInfos
                form={form} setForm={setForm}
                errors={errors} showPwd={showPwd} setShowPwd={setShowPwd}
              />
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {etape === 2 && (
                <button type="button" onClick={() => { setEtape(1); setErrors({}); }}
                  className="btn-outline flex-1">
                  Retour
                </button>
              )}

              {etape === 1 ? (
                <button type="button" onClick={handleSuivant} className="btn-primary flex-1 justify-center">
                  Continuer <RiArrowRightLine className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading
                    ? <><RiLoader4Line className="w-4 h-4 animate-spin" /> Création…</>
                    : 'Créer mon compte'
                  }
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Se connecter
            </Link>
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}