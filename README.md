# 🏦 TontineDigitale

> Plateforme de gestion de tontines digitales — Projet de fin de licence

---

## 🚀 Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Vite + React 18 + **TypeScript** |
| Styling | Tailwind CSS v3 + design system custom |
| Routing | React Router DOM v6 |
| State/Data | TanStack Query v5 |
| Backend | **Supabase** (Auth + PostgreSQL + Realtime + Storage) |
| Notifications | Supabase Realtime (temps réel) |
| PDF | jsPDF + autotable |
| Hébergement | GitHub + Vercel |

---

## 📁 Structure du projet

```
src/
├── assets/              # Images, icônes statiques
├── components/
│   ├── layout/          # AppLayout, AdminLayout, Sidebar, Header, PrivateRoute
│   ├── shared/          # Composants réutilisables (Modal, Table, Badge...)
│   └── ui/              # Primitives UI (Button, Input, Card...)
├── contexts/
│   ├── AuthContext.tsx  # Auth Supabase + profil utilisateur
│   └── TontineContext.tsx # État global app
├── hooks/
│   ├── useTontines.ts   # CRUD tontines
│   ├── useMembres.ts    # Gestion membres
│   ├── useCotisations.ts # Paiements
│   └── useNotifications.ts # Notifications realtime
├── lib/
│   ├── supabase.ts      # Client Supabase
│   └── utils.ts         # Helpers (formatMontant, formatDate, cn...)
├── pages/
│   ├── public/          # Landing, RejoindreInvitation
│   ├── auth/            # Login, Register
│   ├── membre/          # Dashboard, Cotisations, Bénéficiaires, Messages...
│   ├── organisateur/    # TontinesPage, TontineDetail, CreerTontine
│   └── admin/           # AdminDashboard, Utilisateurs, Rapports
├── services/            # Appels API Supabase complexes
├── types/               # Types TypeScript globaux
└── utils/               # Utilitaires (exportPDF, exportCSV...)
```

---

## ⚙️ Installation

```bash
# 1. Cloner le projet
git clone https://github.com/jefferson9110/tontine-digitale.git
cd tontine-digitale

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 4. Initialiser la base de données Supabase
# → Ouvrir Supabase Dashboard → SQL Editor
# → Coller et exécuter le contenu de supabase/schema.sql

# 5. Lancer le serveur de développement
npm run dev
```

---

## 🗄️ Supabase — Configuration

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **Settings → API**
3. Copier **Project URL** → `VITE_SUPABASE_URL`
4. Copier **anon public** key → `VITE_SUPABASE_ANON_KEY`
5. Aller dans **SQL Editor** → coller `supabase/schema.sql` → **Run**

---

## 👥 Rôles et accès

| Rôle | Description |
|------|------------|
| `admin` | Administrateur plateforme — accès `/admin/*` |
| `organisateur` | Crée et gère ses tontines |
| `tresorier` | Valide les paiements d'une tontine |
| `membre` | Participe à une/plusieurs tontines |

> Un utilisateur peut avoir plusieurs rôles simultanément selon les tontines.

---

## ✨ Fonctionnalités

### Cœur métier (document de proposition)
- ✅ Inscription / Connexion / Réinitialisation mot de passe
- ✅ Création et gestion de tontines (rotatif, fixe, enchères)
- ✅ Gestion des membres (invitation, validation, exclusion)
- ✅ Gestion des cotisations et validation des paiements
- ✅ Gestion des cycles et tours de bénéficiaires
- ✅ Historique financier complet
- ✅ Rapports PDF et export CSV
- ✅ Tableaux de bord par rôle (Admin / Organisateur / Membre)
- ✅ Notifications automatiques

### Valeur ajoutée supplémentaire
- 🌟 **Chat temps réel** par tontine (Supabase Realtime)
- 🌟 **Système de vote** pour l'ordre des bénéficiaires
- 🌟 **Lien d'invitation unique** par tontine
- 🌟 **Pénalités automatiques** sur les retards de paiement
- 🌟 **Multi-devises** : FCFA, EUR, USD
- 🌟 **Mode sombre/clair**

---

## 🛠️ Commandes utiles

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run preview  # Prévisualiser le build
```

---

## 📄 Licence

Projet académique — Licence 3 Informatique
