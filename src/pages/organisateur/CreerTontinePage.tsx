import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RiArrowLeftLine, RiArrowRightLine, RiArrowLeftSLine,
  RiCheckLine, RiLoader4Line, RiInformationLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiSettings3Line,
  RiEyeLine,
} from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';
import { formatMontant, getFrequenceLabel, cn } from '../../lib/utils';
import type { CreateTontineForm } from '../../types';

// ── Types formulaire ─────────────────────────────
const INITIAL_FORM: CreateTontineForm = {
  nom: '',
  description: '',
  type: 'rotatif',
  montant_cotisation: 0,
  devise: 'XAF',
  frequence: 'mensuel',
  date_debut: new Date().toISOString().split('T')[0],
  nombre_membres_max: 12,
  penalite_retard: 5,
  delai_grace_jours: 3,
  regles: '',
};

// ── Étapes du wizard ─────────────────────────────
const ETAPES = [
  { id: 1, label: 'Informations',  icon: RiGroupLine },
  { id: 2, label: 'Financier',     icon: RiMoneyDollarCircleLine },
  { id: 3, label: 'Règles',        icon: RiSettings3Line },
  { id: 4, label: 'Récapitulatif', icon: RiEyeLine },
];

// ── Tooltip / Info ───────────────────────────────
function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex ml-1 cursor-help">
      <RiInformationLine className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-xs bg-gray-900 text-white rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
        {text}
      </span>
    </span>
  );
}

// ── Étape 1 : Informations générales ────────────
function Etape1({ form, setForm, errors }: {
  form: CreateTontineForm;
  setForm: React.Dispatch<React.SetStateAction<CreateTontineForm>>;
  errors: Partial<Record<keyof CreateTontineForm, string>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="label">
          Nom de la tontine <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Ex : Njangi Fonctionnaires Yaoundé"
          value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
          className={cn('input', errors.nom && 'input-error')}
          maxLength={80}
        />
        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
        <p className="text-xs text-gray-400 mt-1">{form.nom.length}/80 caractères</p>
      </div>

      <div>
        <label className="label">Description <span className="text-gray-400 font-normal">(facultatif)</span></label>
        <textarea
          placeholder="Décrivez brièvement l'objectif de votre tontine…"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="input resize-none h-24"
          maxLength={300}
        />
        <p className="text-xs text-gray-400 mt-1">{(form.description ?? '').length}/300 caractères</p>
      </div>

      <div>
        <label className="label">
          Type de tontine
          <InfoTooltip text="Rotatif : chaque membre reçoit la cagnotte à son tour. Fixe : montant versé à chaque cycle. Enchères : les membres enchérissent pour leur tour." />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
          {([
            { val: 'rotatif', label: 'Rotatif', desc: 'Tour à tour, chacun reçoit la cagnotte' },
            { val: 'fixe',    label: 'Fixe',    desc: 'Montant fixe versé à chaque cycle' },
            { val: 'encheres',label: 'Enchères', desc: 'Les membres enchérissent pour leur tour' },
          ] as const).map(({ val, label, desc }) => (
            <button
              key={val}
              type="button"
              onClick={() => setForm(f => ({ ...f, type: val }))}
              className={cn(
                'text-left p-4 rounded-xl border-2 transition-all',
                form.type === val
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn('w-3 h-3 rounded-full border-2 flex-shrink-0',
                  form.type === val ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                )} />
                <span className={cn('font-semibold text-sm',
                  form.type === val ? 'text-primary-700' : 'text-gray-700'
                )}>{label}</span>
              </div>
              <p className="text-xs text-gray-400 ml-5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">
            Nombre de membres maximum <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={2} max={100}
            value={form.nombre_membres_max}
            onChange={e => setForm(f => ({ ...f, nombre_membres_max: parseInt(e.target.value) || 2 }))}
            className={cn('input', errors.nombre_membres_max && 'input-error')}
          />
          {errors.nombre_membres_max && <p className="text-red-500 text-xs mt-1">{errors.nombre_membres_max}</p>}
        </div>
        <div>
          <label className="label">Date de début <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={form.date_debut}
            onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
            className={cn('input', errors.date_debut && 'input-error')}
          />
        </div>
      </div>
    </div>
  );
}

// ── Étape 2 : Informations financières ───────────
function Etape2({ form, setForm, errors }: {
  form: CreateTontineForm;
  setForm: React.Dispatch<React.SetStateAction<CreateTontineForm>>;
  errors: Partial<Record<keyof CreateTontineForm, string>>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">
            Montant de la cotisation <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            placeholder="25000"
            value={form.montant_cotisation || ''}
            onChange={e => setForm(f => ({ ...f, montant_cotisation: parseFloat(e.target.value) || 0 }))}
            className={cn('input', errors.montant_cotisation && 'input-error')}
          />
          {errors.montant_cotisation && <p className="text-red-500 text-xs mt-1">{errors.montant_cotisation}</p>}
        </div>
        <div>
          <label className="label">Devise</label>
          <select
            value={form.devise}
            onChange={e => setForm(f => ({ ...f, devise: e.target.value as any }))}
            className="input"
          >
            <option value="XAF">FCFA (XAF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar (USD)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Fréquence des cotisations</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {(['hebdomadaire', 'bimensuel', 'mensuel', 'trimestriel'] as const).map(freq => (
            <button
              key={freq}
              type="button"
              onClick={() => setForm(f => ({ ...f, frequence: freq }))}
              className={cn(
                'py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all',
                form.frequence === freq
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {getFrequenceLabel(freq)}
            </button>
          ))}
        </div>
      </div>

      {/* Aperçu cagnotte */}
      {form.montant_cotisation > 0 && form.nombre_membres_max > 0 && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-3">
            Aperçu de la cagnotte
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Cotisation unitaire', val: formatMontant(form.montant_cotisation, form.devise) },
              { label: 'Cagnotte par tour', val: formatMontant(form.montant_cotisation * form.nombre_membres_max, form.devise) },
              { label: 'Nombre de tours', val: `${form.nombre_membres_max} tours` },
              { label: 'Total collecté', val: formatMontant(form.montant_cotisation * form.nombre_membres_max * form.nombre_membres_max, form.devise) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-xs text-primary-500">{label}</p>
                <p className="font-display font-bold text-primary-800 text-sm mt-0.5">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Étape 3 : Règles ─────────────────────────────
function Etape3({ form, setForm }: {
  form: CreateTontineForm;
  setForm: React.Dispatch<React.SetStateAction<CreateTontineForm>>;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">
            Pénalité de retard (%)
            <InfoTooltip text="Pourcentage du montant dû appliqué comme pénalité après le délai de grâce. Mettez 0 pour désactiver." />
          </label>
          <div className="relative">
            <input
              type="number"
              min={0} max={50}
              value={form.penalite_retard}
              onChange={e => setForm(f => ({ ...f, penalite_retard: parseFloat(e.target.value) || 0 }))}
              className="input pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
          {form.penalite_retard > 0 && form.montant_cotisation > 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Soit {formatMontant(form.montant_cotisation * form.penalite_retard / 100, form.devise)} de pénalité
            </p>
          )}
        </div>
        <div>
          <label className="label">
            Délai de grâce (jours)
            <InfoTooltip text="Nombre de jours après l'échéance avant d'appliquer la pénalité." />
          </label>
          <input
            type="number"
            min={0} max={30}
            value={form.delai_grace_jours}
            onChange={e => setForm(f => ({ ...f, delai_grace_jours: parseInt(e.target.value) || 0 }))}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">
          Règlement de la tontine
          <InfoTooltip text="Rédigez les règles de fonctionnement. Ce texte sera visible par tous les membres." />
        </label>
        <textarea
          placeholder={`Exemple de règles :\n- Cotisation due le 1er de chaque mois\n- Paiement via MTN MoMo ou Orange Money\n- Absence injustifiée = pénalité de ${form.penalite_retard}%\n- L'ordre des bénéficiaires est tiré au sort`}
          value={form.regles}
          onChange={e => setForm(f => ({ ...f, regles: e.target.value }))}
          className="input resize-none h-40"
          maxLength={2000}
        />
        <p className="text-xs text-gray-400 mt-1">{(form.regles ?? '').length}/2000 caractères</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
        <RiInformationLine className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Règlement horodaté</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Ce règlement sera enregistré avec la date de création et sera consultable par tous les membres à tout moment. En cas de litige, il fait foi.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Étape 4 : Récapitulatif ──────────────────────
function Etape4({ form }: { form: CreateTontineForm }) {
  const cagnotte = form.montant_cotisation * form.nombre_membres_max;

  const sections = [
    {
      titre: 'Informations générales',
      items: [
        { label: 'Nom', val: form.nom },
        { label: 'Type', val: form.type === 'rotatif' ? 'Rotatif' : form.type === 'fixe' ? 'Fixe' : 'Enchères' },
        { label: 'Membres max', val: `${form.nombre_membres_max} membres` },
        { label: 'Date de début', val: form.date_debut },
      ],
    },
    {
      titre: 'Informations financières',
      items: [
        { label: 'Cotisation', val: formatMontant(form.montant_cotisation, form.devise) },
        { label: 'Fréquence', val: getFrequenceLabel(form.frequence) },
        { label: 'Cagnotte par tour', val: formatMontant(cagnotte, form.devise) },
      ],
    },
    {
      titre: 'Règles',
      items: [
        { label: 'Pénalité', val: form.penalite_retard > 0 ? `${form.penalite_retard}%` : 'Aucune' },
        { label: 'Délai de grâce', val: `${form.delai_grace_jours} jours` },
        { label: 'Règlement', val: form.regles ? `${form.regles.slice(0, 60)}…` : 'Non défini' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 text-center">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-display font-bold text-xl">{form.nom.charAt(0) || 'T'}</span>
        </div>
        <h2 className="font-display font-bold text-primary-900 text-xl">{form.nom}</h2>
        <p className="text-primary-600 text-sm mt-1">
          {formatMontant(form.montant_cotisation, form.devise)} · {getFrequenceLabel(form.frequence)} · {form.nombre_membres_max} membres
        </p>
      </div>

      {sections.map(({ titre, items }) => (
        <div key={titre} className="card">
          <h3 className="font-display font-bold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-100">
            {titre}
          </h3>
          <dl className="space-y-2">
            {items.map(({ label, val }) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-sm text-gray-400">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}

      <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3">
        <RiCheckLine className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800">Prêt à créer</p>
          <p className="text-xs text-green-700 mt-0.5">
            Vérifiez les informations ci-dessus. Après création, vous pourrez inviter vos membres via un lien unique.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function CreerTontinePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [etape,   setEtape]   = useState(1);
  const [form,    setForm]    = useState<CreateTontineForm>(INITIAL_FORM);
  const [errors,  setErrors]  = useState<Partial<Record<keyof CreateTontineForm, string>>>({});
  const [loading, setLoading] = useState(false);

  function validerEtape(num: number): boolean {
    const errs: typeof errors = {};
    if (num === 1) {
      if (!form.nom.trim())              errs.nom = 'Le nom est requis.';
      else if (form.nom.length < 3)      errs.nom = 'Minimum 3 caractères.';
      if (form.nombre_membres_max < 2)   errs.nombre_membres_max = 'Minimum 2 membres.';
      if (!form.date_debut)              errs.date_debut = 'La date est requise.';
    }
    if (num === 2) {
      if (!form.montant_cotisation || form.montant_cotisation <= 0)
        errs.montant_cotisation = 'Montant invalide.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function suivant() {
    if (validerEtape(etape)) setEtape(e => Math.min(e + 1, 4));
  }

  function precedent() {
    setEtape(e => Math.max(e - 1, 1));
    setErrors({});
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      // TODO: remplacer par useCreateTontine()
      await new Promise(r => setTimeout(r, 1200));
      navigate('/tontines');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Retour */}
      <Link to="/tontines" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <RiArrowLeftLine className="w-4 h-4" />
        Retour aux tontines
      </Link>

      {/* En-tête */}
      <div>
        <h1 className="page-title">Créer une tontine</h1>
        <p className="page-subtitle">Configurez votre tontine en 4 étapes</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {ETAPES.map((e, i) => (
          <div key={e.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <button
                onClick={() => etape > e.id && setEtape(e.id)}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 font-bold text-sm',
                  etape === e.id  ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200' :
                  etape > e.id   ? 'bg-primary-100 border-primary-300 text-primary-600 cursor-pointer hover:bg-primary-200' :
                                   'bg-white border-gray-200 text-gray-400'
                )}
              >
                {etape > e.id ? <RiCheckLine className="w-4 h-4" /> : e.id}
              </button>
              <span className={cn('text-xs font-medium hidden sm:block',
                etape === e.id ? 'text-primary-600' : 'text-gray-400'
              )}>{e.label}</span>
            </div>
            {i < ETAPES.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 transition-all',
                etape > e.id ? 'bg-primary-300' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Contenu de l'étape */}
      <div className="card animate-fade-in">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          {(() => { const E = ETAPES[etape - 1]; return <E.icon className="w-5 h-5 text-primary-600" />; })()}
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base">
              {ETAPES[etape - 1].label}
            </h2>
            <p className="text-xs text-gray-400">Étape {etape} sur {ETAPES.length}</p>
          </div>
        </div>

        {etape === 1 && <Etape1 form={form} setForm={setForm} errors={errors} />}
        {etape === 2 && <Etape2 form={form} setForm={setForm} errors={errors} />}
        {etape === 3 && <Etape3 form={form} setForm={setForm} />}
        {etape === 4 && <Etape4 form={form} />}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {etape > 1 && (
          <button onClick={precedent} className="btn-outline flex-1">
            <RiArrowLeftSLine className="w-4 h-4" />
            Précédent
          </button>
        )}
        {etape < 4 ? (
          <button onClick={suivant} className="btn-primary flex-1 justify-center">
            Suivant
            <RiArrowRightLine className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading
              ? <><RiLoader4Line className="w-4 h-4 animate-spin" /> Création en cours…</>
              : <><RiCheckLine className="w-4 h-4" /> Créer la tontine</>
            }
          </button>
        )}
      </div>
    </div>
  );
}