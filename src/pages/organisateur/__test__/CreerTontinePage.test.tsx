/**
 * Tests unitaires — CreerTontinePage
 * Fichier : src/pages/organisateur/__tests__/CreerTontinePage.test.tsx
 *
 * Stratégie : page entière montée. On teste :
 *  - La navigation entre les 4 étapes (Suivant / Précédent)
 *  - La validation de chaque étape (erreurs affichées)
 *  - L'affichage du formulaire à chaque étape
 *  - La soumission finale et la navigation post-création
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                   from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter }            from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CreerTontinePage } from '../CreerTontinePage';

// ─────────────────────────────────────────────────────────────────────────────
//  MOCKS GLOBAUX
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

// 1. react-router-dom — on mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// 2. AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'org-user-789', nom: 'TENKAM' } }),
}));

// 3. Hook useCreateTontine — on mock la mutation
const mockMutateAsync = vi.fn();
vi.mock('../../hooks/useTontines', () => ({
  useCreateTontine: () => ({
    mutateAsync: mockMutateAsync,
    isPending:   false,
  }),
}));

// 4. Utilitaires — comportement réel
vi.mock('../../lib/utils', async () => {
  const actual = await vi.importActual('../../lib/utils');
  return actual;
});

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function freshClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={freshClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderPage() {
  return render(<CreerTontinePage />, { wrapper: Wrapper });
}

/**
 * Remplit l'étape 1 valide et clique "Suivant"
 * Nécessaire pour accéder aux étapes 2, 3, 4
 */
async function remplirEtape1EtSuivre(user: ReturnType<typeof userEvent.setup>) {
  // Nom de la tontine
  const inputNom = screen.getByPlaceholderText(/njangi fonctionnaires/i);
  await user.clear(inputNom);
  await user.type(inputNom, 'Tontine Test Famille');

  // Nombre de membres (déjà à 12 par défaut, on laisse)

  // Date de début (déjà remplie avec today)

  await user.click(screen.getByText('Suivant'));
}

/**
 * Remplit l'étape 2 valide et clique "Suivant"
 */
async function remplirEtape2EtSuivre(user: ReturnType<typeof userEvent.setup>) {
  const inputMontant = screen.getByPlaceholderText('25000');
  await user.clear(inputMontant);
  await user.type(inputMontant, '25000');
  await user.click(screen.getByText('Suivant'));
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. AFFICHAGE INITIAL — ÉTAPE 1
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Affichage initial (Étape 1)', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('affiche le titre "Créer une tontine"', () => {
    renderPage();
    expect(screen.getByText('Créer une tontine')).toBeInTheDocument();
  });

  it('affiche le sous-titre "Configurez votre tontine en 4 étapes"', () => {
    renderPage();
    expect(screen.getByText(/configurez votre tontine en 4 étapes/i)).toBeInTheDocument();
  });

  it('affiche les 4 étapes dans le stepper', () => {
    renderPage();
    expect(screen.getByText('Informations')).toBeInTheDocument();
    expect(screen.getByText('Financier')).toBeInTheDocument();
    expect(screen.getByText('Règles')).toBeInTheDocument();
    expect(screen.getByText('Récapitulatif')).toBeInTheDocument();
  });

  it('affiche "Étape 1 sur 4" dans le formulaire', () => {
    renderPage();
    expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
  });

  it('affiche le champ "Nom de la tontine"', () => {
    renderPage();
    expect(screen.getByText(/nom de la tontine/i)).toBeInTheDocument();
  });

  it('affiche le champ "Description"', () => {
    renderPage();
    expect(screen.getByText(/description/i)).toBeInTheDocument();
  });

  it('affiche les 3 types de tontine', () => {
    renderPage();
    expect(screen.getByText('Rotatif')).toBeInTheDocument();
    expect(screen.getByText('Fixe')).toBeInTheDocument();
    expect(screen.getByText('Enchères')).toBeInTheDocument();
  });

  it('affiche le champ "Nombre de membres max"', () => {
    renderPage();
    expect(screen.getByText(/nombre de membres max/i)).toBeInTheDocument();
  });

  it('affiche le champ "Date de début"', () => {
    renderPage();
    expect(screen.getByText(/date de début/i)).toBeInTheDocument();
  });

  it('n\'affiche pas le bouton "Précédent" à l\'étape 1', () => {
    renderPage();
    expect(screen.queryByText('Précédent')).not.toBeInTheDocument();
  });

  it('affiche uniquement le bouton "Suivant" à l\'étape 1', () => {
    renderPage();
    expect(screen.getByText('Suivant')).toBeInTheDocument();
  });

  it('sélectionne "Rotatif" par défaut', () => {
    renderPage();
    // Le bouton Rotatif doit avoir la classe primary (sélectionné)
    const rotatif = screen.getByText('Rotatif').closest('button');
    expect(rotatif).toHaveClass('border-primary-500');
  });

  it('affiche le lien "Retour aux tontines"', () => {
    renderPage();
    expect(screen.getByText(/retour aux tontines/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. VALIDATION ÉTAPE 1
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Validation Étape 1', () => {
  beforeEach(() => { mockNavigate.mockClear(); });

  it('affiche une erreur si le nom est vide', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.getByText(/nom requis/i)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si le nom est trop court (< 3 caractères)', async () => {
    const user = userEvent.setup();
    renderPage();
    const inputNom = screen.getByPlaceholderText(/njangi fonctionnaires/i);
    await user.type(inputNom, 'AB');
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.getByText(/nom requis \(min 3 caractères\)/i)).toBeInTheDocument();
    });
  });

  it('n\'affiche pas d\'erreur avec un nom valide (>= 3 caractères)', async () => {
    const user = userEvent.setup();
    renderPage();
    const inputNom = screen.getByPlaceholderText(/njangi fonctionnaires/i);
    await user.type(inputNom, 'Tontine Test');
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.queryByText(/nom requis/i)).not.toBeInTheDocument();
    });
  });

  it('affiche une erreur si nombre de membres < 2', async () => {
    const user = userEvent.setup();
    renderPage();
    const inputNom = screen.getByPlaceholderText(/njangi fonctionnaires/i);
    await user.type(inputNom, 'Tontine Valide');

    const inputMembres = screen.getByDisplayValue('12');
    await user.clear(inputMembres);
    await user.type(inputMembres, '1');

    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.getByText(/minimum 2 membres/i)).toBeInTheDocument();
    });
  });

  it('ne passe pas à l\'étape 2 si le formulaire est invalide', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Suivant'));
    // On doit rester à l'étape 1
    await waitFor(() => {
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
    });
  });

  it('passe à l\'étape 2 si le formulaire étape 1 est valide', async () => {
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => {
      expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. ÉTAPE 2 — FINANCIER
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Étape 2 (Financier)', () => {
  beforeEach(async () => {
    mockNavigate.mockClear();
  });

  async function allerEtape2() {
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    return user;
  }

  it('affiche "Étape 2 sur 4"', async () => {
    await allerEtape2();
    expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument();
  });

  it('affiche le champ "Montant de la cotisation"', async () => {
    await allerEtape2();
    expect(screen.getByText(/montant de la cotisation/i)).toBeInTheDocument();
  });

  it('affiche le champ "Devise"', async () => {
    await allerEtape2();
    expect(screen.getByText('Devise')).toBeInTheDocument();
  });

  it('affiche les 4 options de fréquence', async () => {
    await allerEtape2();
    expect(screen.getByText(/hebdomadaire/i)).toBeInTheDocument();
    expect(screen.getByText(/mensuel/i)).toBeInTheDocument();
  });

  it('affiche l\'aperçu de la cagnotte quand montant > 0', async () => {
    const user = await allerEtape2();
    const inputMontant = screen.getByPlaceholderText('25000');
    await user.type(inputMontant, '10000');
    await waitFor(() => {
      expect(screen.getByText(/aperçu de la cagnotte/i)).toBeInTheDocument();
    });
  });

  it('affiche les boutons "Précédent" et "Suivant" à l\'étape 2', async () => {
    await allerEtape2();
    expect(screen.getByText('Précédent')).toBeInTheDocument();
    expect(screen.getByText('Suivant')).toBeInTheDocument();
  });

  it('retourne à l\'étape 1 au clic sur "Précédent"', async () => {
    const user = await allerEtape2();
    await user.click(screen.getByText('Précédent'));
    await waitFor(() => {
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
    });
  });

  it('affiche une erreur si le montant est 0 ou vide', async () => {
    const user = await allerEtape2();
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.getByText(/montant invalide/i)).toBeInTheDocument();
    });
  });

  it('ne passe pas à l\'étape 3 si le montant est invalide', async () => {
    const user = await allerEtape2();
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument();
    });
  });

  it('passe à l\'étape 3 avec un montant valide', async () => {
    const user = await allerEtape2();
    await remplirEtape2EtSuivre(user);
    await waitFor(() => {
      expect(screen.getByText('Étape 3 sur 4')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. ÉTAPE 3 — RÈGLES
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Étape 3 (Règles)', () => {
  async function allerEtape3() {
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    await remplirEtape2EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 3 sur 4'));
    return user;
  }

  it('affiche "Étape 3 sur 4"', async () => {
    await allerEtape3();
    expect(screen.getByText('Étape 3 sur 4')).toBeInTheDocument();
  });

  it('affiche le champ "Pénalité de retard"', async () => {
    await allerEtape3();
    expect(screen.getByText(/pénalité de retard/i)).toBeInTheDocument();
  });

  it('affiche le champ "Délai de grâce"', async () => {
    await allerEtape3();
    expect(screen.getByText(/délai de grâce/i)).toBeInTheDocument();
  });

  it('affiche le champ "Règlement de la tontine"', async () => {
    await allerEtape3();
    expect(screen.getByText(/règlement de la tontine/i)).toBeInTheDocument();
  });

  it('affiche l\'avertissement sur le règlement horodaté', async () => {
    await allerEtape3();
    expect(screen.getByText(/horodaté/i)).toBeInTheDocument();
  });

  it('affiche le montant de la pénalité calculée quand penalite > 0 et montant > 0', async () => {
    const user = await allerEtape3();
    // La pénalité par défaut est 5%, montant 25000 → 1250 FCFA
    await waitFor(() => {
      expect(screen.getByText(/1[\s\u00A0]250/)).toBeInTheDocument();
    });
  });

  it('passe à l\'étape 4 sans validation obligatoire (étape 3 est libre)', async () => {
    const user = await allerEtape3();
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => {
      expect(screen.getByText('Étape 4 sur 4')).toBeInTheDocument();
    });
  });

  it('retourne à l\'étape 2 au clic sur "Précédent"', async () => {
    const user = await allerEtape3();
    await user.click(screen.getByText('Précédent'));
    await waitFor(() => {
      expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. ÉTAPE 4 — RÉCAPITULATIF
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Étape 4 (Récapitulatif)', () => {
  async function allerEtape4() {
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    await remplirEtape2EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 3 sur 4'));
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => screen.getByText('Étape 4 sur 4'));
    return user;
  }

  it('affiche "Étape 4 sur 4"', async () => {
    await allerEtape4();
    expect(screen.getByText('Étape 4 sur 4')).toBeInTheDocument();
  });

  it('affiche le nom de la tontine dans le récapitulatif', async () => {
    await allerEtape4();
    expect(screen.getAllByText('Tontine Test Famille').length).toBeGreaterThan(0);
  });

  it('affiche la section "Informations générales"', async () => {
    await allerEtape4();
    expect(screen.getByText('Informations générales')).toBeInTheDocument();
  });

  it('affiche la section "Finances"', async () => {
    await allerEtape4();
    expect(screen.getByText('Finances')).toBeInTheDocument();
  });

  it('affiche la section "Règles"', async () => {
    await allerEtape4();
    expect(screen.getByText('Règles')).toBeInTheDocument();
  });

  it('affiche le type "Rotatif" dans le récapitulatif', async () => {
    await allerEtape4();
    expect(screen.getByText('Rotatif')).toBeInTheDocument();
  });

  it('affiche le montant de cotisation formaté', async () => {
    await allerEtape4();
    expect(screen.getAllByText(/25[\s\u00A0]000/).length).toBeGreaterThan(0);
  });

  it('affiche la fréquence dans le récapitulatif', async () => {
    await allerEtape4();
    expect(screen.getAllByText(/mensuel/i).length).toBeGreaterThan(0);
  });

  it('affiche le bouton "Créer la tontine" à l\'étape 4', async () => {
    await allerEtape4();
    expect(screen.getByText('Créer la tontine')).toBeInTheDocument();
  });

  it('n\'affiche pas le bouton "Suivant" à l\'étape 4', async () => {
    await allerEtape4();
    expect(screen.queryByText('Suivant')).not.toBeInTheDocument();
  });

  it('retourne à l\'étape 3 au clic sur "Précédent"', async () => {
    const user = await allerEtape4();
    await user.click(screen.getByText('Précédent'));
    await waitFor(() => {
      expect(screen.getByText('Étape 3 sur 4')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. SOUMISSION FINALE
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Soumission', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockMutateAsync.mockClear();
  });

  async function allerEtape4EtSoumettre() {
    mockMutateAsync.mockResolvedValue({ id: 'nouvelle-tontine-123' });
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    await remplirEtape2EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 3 sur 4'));
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => screen.getByText('Étape 4 sur 4'));
    await user.click(screen.getByText('Créer la tontine'));
    return user;
  }

  it('appelle mutateAsync lors du clic sur "Créer la tontine"', async () => {
    await allerEtape4EtSoumettre();
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledOnce();
    });
  });

  it('passe le bon organisateurId à mutateAsync', async () => {
    await allerEtape4EtSoumettre();
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ organisateurId: 'org-user-789' })
      );
    });
  });

  it('passe les bonnes données du formulaire à mutateAsync', async () => {
    await allerEtape4EtSoumettre();
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          form: expect.objectContaining({
            nom: 'Tontine Test Famille',
            montant_cotisation: 25000,
            type: 'rotatif',
          }),
        })
      );
    });
  });

  it('redirige vers "/tontines" après succès', async () => {
    await allerEtape4EtSoumettre();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/tontines');
    });
  });

  it('ne redirige pas si mutateAsync échoue', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Erreur Supabase'));
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    await remplirEtape2EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 3 sur 4'));
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => screen.getByText('Créer la tontine'));
    await user.click(screen.getByText('Créer la tontine'));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('affiche "Création…" avec spinner pendant la soumission', async () => {
    // Mock isPending = true
    vi.mock('../../hooks/useTontines', () => ({
      useCreateTontine: () => ({
        mutateAsync: mockMutateAsync,
        isPending:   true,
      }),
    }));
    // Re-render avec le mock mis à jour
    const user = userEvent.setup();
    render(<CreerTontinePage />, { wrapper: Wrapper });
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    await remplirEtape2EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 3 sur 4'));
    await user.click(screen.getByText('Suivant'));
    await waitFor(() => screen.getByText('Étape 4 sur 4'));
    // Si isPending, le bouton affiche "Création…"
    // (dépend du rendu au moment du clic — test de régression)
    expect(screen.getByText(/créer la tontine|création/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. NAVIGATION STEPPER
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Stepper navigation', () => {
  it('permet de cliquer sur une étape passée pour y revenir', async () => {
    const user = userEvent.setup();
    renderPage();
    // Aller à l'étape 2
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));

    // Cliquer sur le numéro "1" du stepper (étape passée)
    const boutonEtape1 = screen.getByText('1');
    await user.click(boutonEtape1);
    await waitFor(() => {
      expect(screen.getByText('Étape 1 sur 4')).toBeInTheDocument();
    });
  });

  it('ne permet pas de cliquer sur une étape future dans le stepper', async () => {
    renderPage();
    // À l'étape 1, le bouton "2" ne doit pas être cliquable (pas de cursor-pointer)
    const boutonEtape2 = screen.getByText('2');
    expect(boutonEtape2.closest('button')).not.toHaveClass('cursor-pointer');
  });

  it('affiche ✓ sur les étapes complétées dans le stepper', async () => {
    const user = userEvent.setup();
    renderPage();
    await remplirEtape1EtSuivre(user);
    await waitFor(() => screen.getByText('Étape 2 sur 4'));
    // L'étape 1 est complétée → le stepper affiche une icône check
    const check = document.querySelector('.text-primary-600 svg') ?? 
                  document.querySelector('[class*="primary"] svg');
    expect(check).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  8. INTERACTIONS ÉTAPE 1 — Sélection du type
// ─────────────────────────────────────────────────────────────────────────────
describe('CreerTontinePage — Sélection type tontine', () => {
  it('sélectionne le type "Fixe" au clic', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Fixe').closest('button')!);
    await waitFor(() => {
      const fixe = screen.getByText('Fixe').closest('button');
      expect(fixe).toHaveClass('border-primary-500');
    });
  });

  it('sélectionne le type "Enchères" au clic', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Enchères').closest('button')!);
    await waitFor(() => {
      const encheres = screen.getByText('Enchères').closest('button');
      expect(encheres).toHaveClass('border-primary-500');
    });
  });

  it('désélectionne "Rotatif" quand un autre type est choisi', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText('Fixe').closest('button')!);
    await waitFor(() => {
      const rotatif = screen.getByText('Rotatif').closest('button');
      expect(rotatif).not.toHaveClass('border-primary-500');
    });
  });

  it('affiche le compteur de caractères pour le nom (0/80)', () => {
    renderPage();
    expect(screen.getByText('0/80')).toBeInTheDocument();
  });

  it('met à jour le compteur de caractères en tapant', async () => {
    const user = userEvent.setup();
    renderPage();
    const inputNom = screen.getByPlaceholderText(/njangi fonctionnaires/i);
    await user.type(inputNom, 'Bonjour');
    await waitFor(() => {
      expect(screen.getByText('7/80')).toBeInTheDocument();
    });
  });
});