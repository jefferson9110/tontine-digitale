import { Link } from 'react-router-dom';
import {
  RiGroupLine, RiMoneyDollarCircleLine, RiBellLine,
  RiShieldCheckLine, RiBarChartLine, RiArrowRightLine,
  RiCheckLine, RiStarFill, RiWhatsappLine, RiSmartphoneLine,
} from 'react-icons/ri';

// ── Données statiques ────────────────────────────
const FEATURES = [
  {
    icon: RiGroupLine,
    titre: 'Gestion des membres',
    desc: 'Invitez, organisez et suivez chaque membre de votre tontine. Rôles multiples, statuts clairs.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: RiMoneyDollarCircleLine,
    titre: 'Cotisations en temps réel',
    desc: 'Enregistrez chaque paiement instantanément. Historique complet, pénalités automatiques.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: RiBellLine,
    titre: 'Rappels intelligents',
    desc: 'Notifications avant échéance, jamais après. Vos membres restent informés sans friction.',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    icon: RiShieldCheckLine,
    titre: 'Score de fiabilité',
    desc: 'Chaque membre accumule un score basé sur sa régularité. Invitez en confiance.',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    icon: RiBarChartLine,
    titre: 'Tableaux de bord',
    desc: 'Visualisez l\'évolution de votre tontine cycle par cycle. Exportez en PDF en un clic.',
    color: 'bg-rose-100 text-rose-700',
  },
  {
    icon: RiSmartphoneLine,
    titre: 'Multi-devises & diaspora',
    desc: 'FCFA, EUR, USD. Gérez votre tontine depuis n\'importe quel pays du monde.',
    color: 'bg-teal-100 text-teal-700',
  },
];

const STATS = [
  { valeur: '3 M+', label: 'Camerounais de la diaspora', sous: 'un marché à connecter' },
  { valeur: '0 FCFA', label: 'De perte par détournement', sous: 'traçabilité totale' },
  { valeur: '100%', label: 'Transparent', sous: 'chaque franc est tracé' },
];

const TEMOIGNAGES = [
  {
    nom: 'Marcelline T.',
    role: 'Organisatrice de njangi, Yaoundé',
    texte: 'Avant TontineDigitale, je tenais tout dans un cahier. Maintenant j\'envoie le rapport PDF à mes membres chaque mois. Fini les disputes sur les montants.',
    stars: 5,
  },
  {
    nom: 'Patrick N.',
    role: 'Membre de tontine, Paris',
    texte: 'Je cotise depuis la France sans stress. Je reçois une notification quand mon tour de bénéficiaire approche. C\'est propre, c\'est simple.',
    stars: 5,
  },
  {
    nom: 'Solange K.',
    role: 'Trésorière, Douala',
    texte: 'Le score de fiabilité a tout changé. On accepte maintenant les nouveaux membres en regardant leur historique, pas juste leur bouche.',
    stars: 5,
  },
];

const PLANS = [
  {
    nom: 'Membre',
    prix: 'Gratuit',
    desc: 'Pour participer à des tontines existantes',
    features: [
      'Rejoindre des tontines par invitation',
      'Suivre ses cotisations',
      'Messagerie interne',
      'Notifications automatiques',
    ],
    cta: 'Créer un compte',
    href: '/register',
    highlight: false,
  },
  {
    nom: 'Organisateur',
    prix: 'Gratuit',
    desc: 'Pour créer et gérer vos tontines',
    features: [
      'Créer des tontines illimitées',
      'Inviter des membres',
      'Valider les paiements',
      'Export PDF & rapports',
      'Score de fiabilité',
      'Vote des bénéficiaires',
    ],
    cta: 'Commencer maintenant',
    href: '/register',
    highlight: true,
  },
];

// ── Composant Nav ────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">
            Tontine<span className="text-primary-600">Digitale</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost text-sm hidden sm:flex">
            Se connecter
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Fond décoratif */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 right-0 h-[70vh] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800" />
        {/* Cercles décoratifs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-700/20 rounded-full blur-3xl" />
        <div className="absolute top-40 left-10 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      {/* Contenu hero */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center pt-16 pb-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse" />
          Plateforme made in Cameroun 🇨🇲
        </div>

        {/* Titre principal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white leading-tight mb-6">
          Votre tontine,{' '}
          <span className="text-secondary-400">gérée proprement.</span>
          <br />
          <span className="text-primary-300">Fini les cahiers.</span>
        </h1>

        <p className="text-lg sm:text-xl text-primary-200 max-w-2xl mx-auto mb-10 leading-relaxed">
          TontineDigitale digitalise votre njangi ou djangui en quelques minutes.
          Cotisations, bénéficiaires, rapports — tout est tracé, transparent, accessible partout.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/register" className="btn-primary btn-lg shadow-lg shadow-primary-900/30 w-full sm:w-auto">
            Créer ma tontine gratuitement
            <RiArrowRightLine className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn w-full sm:w-auto border border-white/30 text-white hover:bg-white/10">
            J'ai déjà un compte
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-primary-400 text-sm">
          Conçu pour les tontines camerounaises · Disponible partout dans le monde
        </p>
      </div>

      {/* Carte aperçu flottante */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 -mt-8 pb-16 w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Barre titre mock app */}
          <div className="bg-primary-900 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <div className="w-3 h-3 bg-green-400 rounded-full" />
            </div>
            <div className="flex-1 bg-primary-800 rounded-md h-5 mx-4 flex items-center px-3">
              <span className="text-primary-400 text-xs">app.tontinedigitale.cm/dashboard</span>
            </div>
          </div>

          {/* Mock dashboard */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total collecté', val: '1 250 000 FCFA', color: 'text-primary-700', bg: 'bg-primary-50' },
              { label: 'Membres actifs', val: '12 / 12', color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Taux de participation', val: '96%', color: 'text-secondary-700', bg: 'bg-amber-50' },
              { label: 'Cycle actuel', val: '8 / 12', color: 'text-violet-700', bg: 'bg-violet-50' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3`}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`font-display font-bold text-sm ${color}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Mock tableau simplifié */}
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cotisations récentes</span>
                <span className="badge-green text-xs">Cycle 8</span>
              </div>
              {[
                { nom: 'Marcelline T.', montant: '25 000 FCFA', statut: 'Payée', dot: 'bg-green-500' },
                { nom: 'Patrick N.', montant: '25 000 FCFA', statut: 'Payée', dot: 'bg-green-500' },
                { nom: 'Solange K.', montant: '25 000 FCFA', statut: 'En attente', dot: 'bg-amber-400' },
              ].map(({ nom, montant, statut, dot }) => (
                <div key={nom} className="px-4 py-2.5 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-sm text-gray-700">{nom}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{montant}</span>
                    <span className={`badge ${statut === 'Payée' ? 'badge-green' : 'badge-yellow'} text-xs`}>{statut}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────
function StatsSection() {
  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {STATS.map(({ valeur, label, sous }) => (
          <div key={label} className="group">
            <p className="text-4xl font-display font-bold text-primary-700 mb-1 group-hover:scale-105 transition-transform">
              {valeur}
            </p>
            <p className="font-semibold text-gray-800 text-base">{label}</p>
            <p className="text-sm text-gray-400 mt-0.5">{sous}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────
function FeaturesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
            Tout ce dont votre tontine a besoin
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Une plateforme pensée pour les réalités camerounaises, utilisable depuis Yaoundé, Douala ou Paris.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, titre, desc, color }) => (
            <div key={titre} className="card-hover group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{titre}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Comment ça marche ─────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', titre: 'Créez votre tontine', desc: 'Définissez le montant, la fréquence, les règles. Ça prend 2 minutes.' },
    { num: '02', titre: 'Invitez vos membres', desc: 'Par lien unique ou par email. Chaque membre rejoint avec son compte.' },
    { num: '03', titre: 'Gérez les cotisations', desc: 'Enregistrez les paiements, visualisez les retards, appliquez les pénalités.' },
    { num: '04', titre: 'Versez les bénéfices', desc: 'Chaque cycle, le bénéficiaire reçoit sa cagnotte. Tout est documenté.' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-secondary-100 text-secondary-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Comment ça marche
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
            Votre tontine en ligne en 4 étapes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ num, titre, desc }, i) => (
            <div key={num} className="relative text-center">
              {/* Connecteur */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(50%+28px)] right-0 h-px bg-gradient-to-r from-primary-300 to-gray-200" />
              )}
              <div className="w-12 h-12 bg-primary-600 text-white font-display font-bold text-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                {num}
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{titre}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Témoignages ───────────────────────────────────
function Testimonials() {
  return (
    <section className="py-20 bg-primary-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Ils gèrent leur tontine avec TontineDigitale
          </h2>
          <p className="text-primary-400">De Yaoundé à Paris, des organisateurs qui ont dit adieu aux cahiers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TEMOIGNAGES.map(({ nom, role, texte, stars }) => (
            <div key={nom} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                  <RiStarFill key={i} className="w-4 h-4 text-secondary-400" />
                ))}
              </div>
              <p className="text-primary-200 text-sm leading-relaxed mb-5 italic">"{texte}"</p>
              <div>
                <p className="text-white font-semibold text-sm">{nom}</p>
                <p className="text-primary-500 text-xs mt-0.5">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Plans ─────────────────────────────────────────
function Pricing() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-primary-100 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Accès gratuit
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
            Simple. Gratuit. Puissant.
          </h2>
          <p className="text-gray-500">
            TontineDigitale est entièrement gratuit. Créez autant de tontines que vous voulez.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {PLANS.map(({ nom, prix, desc, features, cta, href, highlight }) => (
            <div
              key={nom}
              className={`rounded-2xl p-6 border-2 transition-all ${
                highlight
                  ? 'bg-primary-700 border-primary-600 shadow-xl shadow-primary-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="mb-5">
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlight ? 'text-primary-300' : 'text-gray-400'}`}>
                  {nom}
                </p>
                <p className={`text-3xl font-display font-bold mb-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>
                  {prix}
                </p>
                <p className={`text-sm ${highlight ? 'text-primary-300' : 'text-gray-500'}`}>{desc}</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      highlight ? 'bg-primary-500' : 'bg-primary-100'
                    }`}>
                      <RiCheckLine className={`w-3 h-3 ${highlight ? 'text-white' : 'text-primary-600'}`} />
                    </div>
                    <span className={`text-sm ${highlight ? 'text-primary-100' : 'text-gray-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={href}
                className={`btn w-full justify-center ${
                  highlight ? 'bg-white text-primary-700 hover:bg-primary-50 font-semibold' : 'btn-outline'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA final ─────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-3xl p-10 sm:p-14">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RiWhatsappLine className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Votre tontine mérite mieux qu'un groupe WhatsApp
          </h2>
          <p className="text-primary-200 mb-8 text-lg">
            Rejoignez TontineDigitale. C'est gratuit, c'est sécurisé, et ça prend 2 minutes.
          </p>
          <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-bold shadow-lg">
            Créer ma tontine maintenant
            <RiArrowRightLine className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="text-white font-semibold">TontineDigitale</span>
        </div>
        <p className="text-sm text-center">
          Prenez en main votre cotisation grâce à TontineDigitale · Cameroun 🇨🇲
        </p>
        <div className="flex gap-4 text-sm">
          <Link to="/login" className="hover:text-white transition-colors">Connexion</Link>
          <Link to="/register" className="hover:text-white transition-colors">Inscription</Link>
        </div>
      </div>
    </footer>
  );
}

// ── Page principale ───────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}