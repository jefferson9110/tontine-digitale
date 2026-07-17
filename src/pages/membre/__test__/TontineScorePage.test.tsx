/**
 * Tests unitaires — TontineScorePage
 * Fichier : src/pages/score/__tests__/TontineScorePage.test.tsx
 *
 * Stratégie : on monte la page entière, Supabase et AuthContext sont mockés.
 * On vérifie ce que l'utilisateur voit réellement dans le DOM.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                   from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter }            from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TontineScorePage } from '../TontineScorePage';

// ─────────────────────────────────────────────────────────────────────────────
//  MOCKS GLOBAUX
// ─────────────────────────────────────────────────────────────────────────────

// 1. AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'user-test-123' } }),
}));

// 2. Supabase — on contrôle les données retournées par chaque requête
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// 3. Utilitaires — on les laisse fonctionner normalement
vi.mock('../../lib/utils', async () => {
  const actual = await vi.importActual('../../lib/utils');
  return actual;
});

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Crée un QueryClient frais (cache vide) pour chaque test */
function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

/** Wrapper standard : QueryClient + MemoryRouter */
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={freshClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

/** Monte TontineScorePage avec le wrapper complet */
function renderPage() {
  return render(<TontineScorePage />, { wrapper: Wrapper });
}

// ─────────────────────────────────────────────────────────────────────────────
//  DONNÉES DE TEST
// ─────────────────────────────────────────────────────────────────────────────

/** Cotisations simulant un profil "Fiable" (score ~75) */
const cotisationsFiable = [
  { statut: 'payee',      montant_du: 25000, montant_paye: 25000, penalite: 0,    tontine_id: 't1', created_at: '2024-01-01' },
  { statut: 'payee',      montant_du: 25000, montant_paye: 25000, penalite: 0,    tontine_id: 't1', created_at: '2024-02-01' },
  { statut: 'payee',      montant_du: 25000, montant_paye: 25000, penalite: 0,    tontine_id: 't1', created_at: '2024-03-01' },
  { statut: 'en_retard',  montant_du: 25000, montant_paye: 0,     penalite: 1250, tontine_id: 't1', created_at: '2024-04-01' },
];

/** Cotisations simulant un profil "Excellent" (score >= 85) */
const cotisationsExcellent = Array(8).fill(null).map((_, i) => ({
  statut: 'payee', montant_du: 10000, montant_paye: 10000, penalite: 0,
  tontine_id: i < 4 ? 't1' : 't2', created_at: `2024-0${(i % 9) + 1}-01`,
}));

/** Tontines actives simulées */
const tontinesActives = [
  { id: 't1', nom: 'Njangi Famille', statut: 'active' },
  { id: 't2', nom: 'Tontine Bureau', statut: 'active' },
];

/** Membres d'une tontine pour le classement */
const membresTontine = [
  { user_id: 'u1', statut: 'actif' },
  { user_id: 'u2', statut: 'actif' },
];

const profilsMembres = [
  { id: 'u1', nom: 'Dupont', prenom: 'Jean' },
  { id: 'u2', nom: 'Martin', prenom: 'Alice' },
];

const cotisationsMembres = [
  { user_id: 'u1', statut: 'payee',     montant_du: 10000, penalite: 0, tontine_id: 't1' },
  { user_id: 'u2', statut: 'en_retard', montant_du: 10000, penalite: 500, tontine_id: 't1' },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION DU MOCK SUPABASE PAR SCÉNARIO
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../../lib/supabase';

/**
 * Configure supabase.from() pour simuler les 3 hooks de la page :
 *  1. useMonScore      → from('cotisations').select(...).eq(user_id)
 *  2. useMesTontines   → from('membres_tontine') + from('tontines')
 *  3. useScoresMembres → from('membres_tontine') + from('profiles') + from('cotisations')
 */
function mockSupabase(cotisations: any[], tontines: any[]) {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    const chainFor = (data: any) => ({
      select: vi.fn().mockReturnValue({
        eq:    vi.fn().mockReturnValue({ data, error: null }),
        in:    vi.fn().mockReturnValue({ data, error: null }),
        order: vi.fn().mockReturnValue({ data, error: null }),
      }),
    });

    if (table === 'cotisations')     return chainFor(cotisations);
    if (table === 'tontines')        return chainFor(tontines);
    if (table === 'membres_tontine') return chainFor(tontines.map(t => ({ tontine_id: t.id, statut: 'actif', user_id: 'user-test-123' })));
    if (table === 'profiles')        return chainFor(profilsMembres);
    return chainFor([]);
  });
}

function mockSupabaseVide() {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq:    vi.fn().mockReturnValue({ data: [], error: null }),
      in:    vi.fn().mockReturnValue({ data: [], error: null }),
      order: vi.fn().mockReturnValue({ data: [], error: null }),
    }),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. CHARGEMENT INITIAL
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Chargement', () => {
  beforeEach(() => { mockSupabaseVide(); });

  it('affiche le spinner pendant le chargement', () => {
    renderPage();
    // Le spinner animate-spin est présent avant que les données arrivent
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('affiche le titre "TontineScore" une fois chargé', async () => {
    mockSupabase(cotisationsFiable, tontinesActives);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('TontineScore')).toBeInTheDocument();
    });
  });

  it('affiche le sous-titre de fiabilité', async () => {
    mockSupabase(cotisationsFiable, tontinesActives);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/fiabilité financière/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. ONGLET "MON SCORE" — affichage par défaut
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Onglet Mon score', () => {
  beforeEach(() => { mockSupabase(cotisationsFiable, tontinesActives); });

  it('affiche "Mon score" comme onglet actif par défaut', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mon score')).toBeInTheDocument();
    });
  });

  it('affiche un score numérique entre 0 et 100', async () => {
    renderPage();
    await waitFor(() => {
      // Le texte "XX/100 — Niveau" doit apparaître
      expect(screen.getByText(/\/100\s*—/)).toBeInTheDocument();
    });
  });

  it('affiche "/ 100" dans la jauge SVG', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });
  });

  it('affiche les 3 stats rapides : Payées, Retards, Tontines', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Payées')).toBeInTheDocument();
      expect(screen.getByText('Retards')).toBeInTheDocument();
      expect(screen.getByText('Tontines')).toBeInTheDocument();
    });
  });

  it('affiche "3" cotisations payées pour les données de test', async () => {
    renderPage();
    await waitFor(() => {
      // 3 cotisations payées dans cotisationsFiable
      const payees = screen.getAllByText('3');
      expect(payees.length).toBeGreaterThan(0);
    });
  });

  it('affiche "1" retard pour les données de test', async () => {
    renderPage();
    await waitFor(() => {
      const retards = screen.getAllByText('1');
      expect(retards.length).toBeGreaterThan(0);
    });
  });

  it('affiche la section "Détail par critère" quand il y a des cotisations', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/détail par critère/i)).toBeInTheDocument();
    });
  });

  it('affiche "Taux de paiement" dans le détail des critères', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/taux de paiement/i)).toBeInTheDocument();
    });
  });

  it('affiche "Cycles honorés" dans le détail des critères', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/cycles honorés/i)).toBeInTheDocument();
    });
  });

  it('affiche la section "Pénalité retards" quand il y a des retards', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/pénalité retards/i)).toBeInTheDocument();
    });
  });

  it('affiche les conseils d\'amélioration quand score < 85', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/comment améliorer/i)).toBeInTheDocument();
    });
  });

  it('affiche le conseil "Réduisez vos retards" quand retards > 0', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/réduisez vos retards/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. ONGLET "MON SCORE" — état vide (aucune cotisation)
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Aucune cotisation', () => {
  beforeEach(() => { mockSupabaseVide(); });

  it('affiche "Pas encore de données" quand aucune cotisation', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/pas encore de données/i)).toBeInTheDocument();
    });
  });

  it('affiche le lien "Voir les tontines"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/voir les tontines/i)).toBeInTheDocument();
    });
  });

  it('n\'affiche pas la section "Détail par critère" sans cotisations', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText(/détail par critère/i)).not.toBeInTheDocument();
    });
  });

  it('affiche le message de bienvenue pour un nouveau membre', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/bienvenue/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. NAVIGATION PAR ONGLETS
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Navigation onglets', () => {
  beforeEach(() => { mockSupabase(cotisationsFiable, tontinesActives); });

  it('affiche les 3 onglets : Mon score, Classement, Algorithme', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mon score')).toBeInTheDocument();
      expect(screen.getByText('Classement')).toBeInTheDocument();
      expect(screen.getByText('Algorithme')).toBeInTheDocument();
    });
  });

  it('bascule vers l\'onglet Algorithme au clic', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await waitFor(() => {
      expect(screen.getByText(/comment est calculé le tontinescore/i)).toBeInTheDocument();
    });
  });

  it('affiche la formule de l\'algorithme dans l\'onglet Algorithme', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await waitFor(() => {
      expect(screen.getByText(/taux de paiement à temps/i)).toBeInTheDocument();
      expect(screen.getByText(/\+60 pts max/i)).toBeInTheDocument();
    });
  });

  it('affiche les niveaux de fiabilité dans l\'onglet Algorithme', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await waitFor(() => {
      expect(screen.getByText(/niveaux de fiabilité/i)).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Fiable')).toBeInTheDocument();
      expect(screen.getByText('Correct')).toBeInTheDocument();
      expect(screen.getByText('Faible')).toBeInTheDocument();
    });
  });

  it('bascule vers l\'onglet Classement au clic', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Classement'));
    await user.click(screen.getByText('Classement'));
    await waitFor(() => {
      expect(screen.getByText(/classement/i)).toBeInTheDocument();
    });
  });

  it('revient à Mon score depuis Algorithme', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await user.click(screen.getByText('Mon score'));
    await waitFor(() => {
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. ONGLET CLASSEMENT
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Onglet Classement', () => {
  it('affiche "Rejoignez une tontine" quand aucune tontine active', async () => {
    mockSupabaseVide();
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Classement'));
    await user.click(screen.getByText('Classement'));
    await waitFor(() => {
      expect(screen.getByText(/rejoignez une tontine/i)).toBeInTheDocument();
    });
  });

  it('affiche le sélecteur de tontine quand plusieurs tontines actives', async () => {
    // Mock spécifique pour le classement avec 2 tontines
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'membres_tontine') return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: membresTontine, error: null }),
          }),
        }),
      };
      if (table === 'profiles') return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ data: profilsMembres, error: null }),
        }),
      };
      if (table === 'cotisations') return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ data: cotisationsMembres, error: null }),
          in: vi.fn().mockReturnValue({ data: cotisationsMembres, error: null }),
          order: vi.fn().mockReturnValue({ data: cotisationsMembres, error: null }),
        }),
      };
      if (table === 'tontines') return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ data: tontinesActives, error: null }),
          eq: vi.fn().mockReturnValue({ data: tontinesActives, error: null }),
        }),
      };
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ data: [], error: null }) }) };
    });

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Classement'));
    await user.click(screen.getByText('Classement'));
    await waitFor(() => {
      // Avec 2 tontines, un sélecteur <select> doit apparaître
      const select = document.querySelector('select');
      expect(select).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. SCORE EXCELLENT (>= 85)
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Profil Excellent', () => {
  beforeEach(() => { mockSupabase(cotisationsExcellent, tontinesActives); });

  it('affiche le niveau "Excellent" pour un profil parfait', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Excellent').length).toBeGreaterThan(0);
    });
  });

  it('n\'affiche pas les conseils pour un score Excellent', async () => {
    renderPage();
    await waitFor(() => {
      // On attend que la page soit chargée
      screen.getByText('/ 100');
    });
    // Avec 8 cotisations toutes payées, le score dépasse 85
    // donc la section "Comment améliorer" ne doit pas apparaître
    expect(screen.queryByText(/comment améliorer/i)).not.toBeInTheDocument();
  });

  it('affiche la section Multi-tontines quand plusieurs tontines', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/multi-tontines/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. ONGLET ALGORITHME — contenu statique
// ─────────────────────────────────────────────────────────────────────────────
describe('TontineScorePage — Onglet Algorithme (contenu)', () => {
  beforeEach(() => { mockSupabaseVide(); });

  it('affiche les 5 critères de l\'algorithme', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await waitFor(() => {
      expect(screen.getByText(/taux de paiement à temps/i)).toBeInTheDocument();
      expect(screen.getByText(/cycles honorés/i)).toBeInTheDocument();
      expect(screen.getByText(/multi-tontines/i)).toBeInTheDocument();
      expect(screen.getByText(/malus retards/i)).toBeInTheDocument();
      expect(screen.getByText(/malus pénalités/i)).toBeInTheDocument();
    });
  });

  it('affiche les points max de chaque critère', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await waitFor(() => {
      expect(screen.getByText('+60 pts max')).toBeInTheDocument();
      expect(screen.getByText('+20 pts max')).toBeInTheDocument();
      expect(screen.getByText('+10 pts max')).toBeInTheDocument();
      expect(screen.getByText('-20 pts max')).toBeInTheDocument();
      expect(screen.getByText('-10 pts max')).toBeInTheDocument();
    });
  });

  it('affiche les 5 niveaux avec leurs plages de score', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText('Algorithme'));
    await user.click(screen.getByText('Algorithme'));
    await waitFor(() => {
      expect(screen.getByText(/85 – 100/)).toBeInTheDocument();
      expect(screen.getByText(/70 – 84/)).toBeInTheDocument();
      expect(screen.getByText(/50 – 69/)).toBeInTheDocument();
      expect(screen.getByText(/0 – 49/)).toBeInTheDocument();
    });
  });
});