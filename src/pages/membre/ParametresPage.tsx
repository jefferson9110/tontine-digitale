import { useState } from 'react';
import {
  RiUserLine, RiLockLine, RiBellLine, RiGlobalLine,
  RiEditLine, RiSaveLine, RiLoader4Line, RiEyeLine,
  RiEyeOffLine, RiDeleteBinLine, RiCheckLine, RiSmartphoneLine,
} from 'react-icons/ri';
import { useAuth }            from '../../contexts/AuthContext';
import { useUpdateProfile,
         useChangerMotDePasse } from '../../hooks/useProfile';
import { useMarquerToutesLues } from '../../hooks/useNotifications';
import { getInitiales, cn }   from '../../lib/utils';
import toast from 'react-hot-toast';

type Section = 'profil' | 'securite' | 'notifications' | 'preferences';

// ── Toggle switch ────────────────────────────────
function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-primary-600' : 'bg-gray-200'
        )}>
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
    </div>
  );
}

// ── Section Profil ───────────────────────────────
function SectionProfil() {
  const { profile, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    prenom:    profile?.prenom    ?? '',
    nom:       profile?.nom       ?? '',
    telephone: profile?.telephone ?? '',
  });

  const initiales = profile ? getInitiales(profile.nom, profile.prenom) : 'U';

  async function handleSave() {
    if (!profile) return;
    await updateProfile.mutateAsync({ userId: profile.id, updates: form });
    setEdit(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center">
            <span className="text-primary-700 font-display font-bold text-2xl">{initiales}</span>
          </div>
        </div>
        <div>
          <p className="font-display font-bold text-gray-900 text-lg">{profile?.prenom} {profile?.nom}</p>
          <p className="text-sm text-gray-400">{profile?.email}</p>
          <span className={cn('badge mt-1',
            profile?.role_global === 'admin' ? 'badge-red' :
            profile?.role_global === 'organisateur' ? 'badge-blue' : 'badge-green'
          )}>
            {profile?.role_global === 'admin' ? 'Administrateur' :
             profile?.role_global === 'organisateur' ? 'Organisateur' : 'Membre'}
          </span>
        </div>
      </div>

      <div className="divider" />

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Informations personnelles</h3>
          {!edit && (
            <button onClick={() => setEdit(true)} className="btn-outline btn-sm">
              <RiEditLine className="w-3.5 h-3.5" /> Modifier
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Prénom</label>
            <input type="text" value={form.prenom}
              onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
              className="input" disabled={!edit} />
          </div>
          <div>
            <label className="label">Nom</label>
            <input type="text" value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              className="input" disabled={!edit} />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input type="email" value={profile?.email ?? ''} className="input" disabled />
          <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
        </div>

        <div>
          <label className="label">Téléphone</label>
          <input type="tel" placeholder="+237 6XX XXX XXX"
            value={form.telephone}
            onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
            className="input" disabled={!edit} />
        </div>

        {edit && (
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEdit(false)} className="btn-outline flex-1">Annuler</button>
            <button onClick={handleSave} disabled={updateProfile.isPending} className="btn-primary flex-1 justify-center">
              {updateProfile.isPending
                ? <RiLoader4Line className="w-4 h-4 animate-spin" />
                : <RiSaveLine className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section Sécurité ─────────────────────────────
function SectionSecurite() {
  const changerMdp = useChangerMotDePasse();
  const [form, setForm]     = useState({ current: '', nouveau: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);

  async function handleChangePwd() {
    if (form.nouveau !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas.'); return;
    }
    if (form.nouveau.length < 8) {
      toast.error('Minimum 8 caractères.'); return;
    }
    await changerMdp.mutateAsync(form.nouveau);
    setForm({ current: '', nouveau: '', confirm: '' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-800 mb-4">Changer le mot de passe</h3>
        <div className="space-y-4">
          {[
            { key: 'current', label: 'Mot de passe actuel',  placeholder: '••••••••' },
            { key: 'nouveau', label: 'Nouveau mot de passe', placeholder: 'Minimum 8 caractères' },
            { key: 'confirm', label: 'Confirmer',            placeholder: 'Répéter le nouveau' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input pr-10" />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={handleChangePwd} disabled={changerMdp.isPending} className="btn-primary w-full justify-center">
            {changerMdp.isPending ? <RiLoader4Line className="w-4 h-4 animate-spin" /> : <RiLockLine className="w-4 h-4" />}
            Modifier le mot de passe
          </button>
        </div>
      </div>

      <div className="divider" />

      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
        <h3 className="font-semibold text-red-800 mb-1 flex items-center gap-2">
          <RiDeleteBinLine className="w-4 h-4" /> Zone de danger
        </h3>
        <p className="text-sm text-red-600 mb-4">La suppression de votre compte est irréversible.</p>
        <button className="btn btn-danger btn-sm">
          <RiDeleteBinLine className="w-4 h-4" /> Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

// ── Section Notifications ────────────────────────
function SectionNotifications() {
  const { profile } = useAuth();
  const marquerToutesLues = useMarquerToutesLues();

  const [prefs, setPrefs] = useState({
    rappel_paiement: true, paiement_recu: true, nouveau_membre: true,
    cycle_ouvert: true, beneficiaire_annonce: true, penalite_appliquee: true,
    invitation_tontine: true, push_mobile: true, email_digest: false,
  });

  function toggle(key: keyof typeof prefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Notifications in-app</h3>
        <p className="text-xs text-gray-400 mb-4">Choisissez ce que vous souhaitez recevoir.</p>
        <Toggle checked={prefs.rappel_paiement}      onChange={() => toggle('rappel_paiement')}      label="Rappels de paiement"     desc="3 jours avant l'échéance" />
        <Toggle checked={prefs.paiement_recu}        onChange={() => toggle('paiement_recu')}        label="Paiement validé"         desc="Quand votre cotisation est confirmée" />
        <Toggle checked={prefs.nouveau_membre}       onChange={() => toggle('nouveau_membre')}       label="Nouveau membre"          desc="Quand quelqu'un rejoint votre tontine" />
        <Toggle checked={prefs.cycle_ouvert}         onChange={() => toggle('cycle_ouvert')}         label="Cycle ouvert"            desc="Ouverture d'un nouveau cycle" />
        <Toggle checked={prefs.beneficiaire_annonce} onChange={() => toggle('beneficiaire_annonce')} label="Annonce bénéficiaire"    desc="Quand votre tour approche" />
        <Toggle checked={prefs.invitation_tontine}   onChange={() => toggle('invitation_tontine')}   label="Invitation reçue" />
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Canaux</h3>
        <Toggle checked={prefs.push_mobile}  onChange={() => toggle('push_mobile')}  label="Notifications push"        desc="Sur votre navigateur" />
        <Toggle checked={prefs.email_digest} onChange={() => toggle('email_digest')} label="Résumé email hebdomadaire" desc="Chaque lundi matin" />
      </div>
      <div className="flex gap-3">
        <button onClick={() => profile && marquerToutesLues.mutate(profile.id)}
          disabled={marquerToutesLues.isPending}
          className="btn-outline flex-1">
          <RiCheckLine className="w-4 h-4" /> Tout marquer lu
        </button>
        <button onClick={() => toast.success('Préférences sauvegardées !')} className="btn-primary flex-1 justify-center">
          <RiSaveLine className="w-4 h-4" /> Sauvegarder
        </button>
      </div>
    </div>
  );
}

// ── Section Préférences ──────────────────────────
function SectionPreferences() {
  const [langue, setLangue] = useState('fr');
  const [devise, setDevise] = useState('XAF');
  const [theme,  setTheme]  = useState('clair');

  return (
    <div className="space-y-5">
      <div className="card space-y-5">
        <div>
          <label className="label">Langue</label>
          <select value={langue} onChange={e => setLangue(e.target.value)} className="input">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="label">Devise préférée</label>
          <select value={devise} onChange={e => setDevise(e.target.value)} className="input">
            <option value="XAF">FCFA (XAF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar US (USD)</option>
          </select>
        </div>
        <div>
          <label className="label">Thème</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'clair',  label: '☀️ Clair' },
              { val: 'sombre', label: '🌙 Sombre (bientôt)' },
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setTheme(val)} disabled={val === 'sombre'}
                className={cn('py-3 rounded-xl border-2 text-sm font-medium transition-all',
                  theme === val ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500',
                  val === 'sombre' && 'opacity-50 cursor-not-allowed'
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => toast.success('Préférences sauvegardées !')} className="btn-primary w-full justify-center">
        <RiSaveLine className="w-4 h-4" /> Sauvegarder
      </button>
    </div>
  );
}

// ── Page principale ──────────────────────────────
export function ParametresPage() {
  const [section, setSection] = useState<Section>('profil');

  const SECTIONS: { key: Section; label: string; icon: React.ElementType }[] = [
    { key: 'profil',        label: 'Profil',        icon: RiUserLine },
    { key: 'securite',      label: 'Sécurité',      icon: RiLockLine },
    { key: 'notifications', label: 'Notifications', icon: RiBellLine },
    { key: 'preferences',   label: 'Préférences',   icon: RiGlobalLine },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Gérez votre compte et vos préférences</p>
      </div>
      <div className="flex flex-col md:flex-row gap-5">
        <nav className="md:w-52 flex-shrink-0">
          <div className="card !p-2 flex flex-row md:flex-col gap-1">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setSection(key)}
                className={cn('flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left',
                  section === key ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="flex-1 card animate-fade-in">
          {section === 'profil'        && <SectionProfil />}
          {section === 'securite'      && <SectionSecurite />}
          {section === 'notifications' && <SectionNotifications />}
          {section === 'preferences'   && <SectionPreferences />}
        </div>
      </div>
    </div>
  );
}