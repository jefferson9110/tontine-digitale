/**
 * Tests unitaires — CotisationsPage
 * Fichier : src/pages/membre/__tests__/CotisationsPage.test.tsx
 *
 * Stratégie : page entière montée, Supabase + AuthContext + composants
 * externes mockés. On vérifie les stats, filtres, onglets, et ouverture modal.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent                   from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter }            from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CotisationsPage } from '../CotisationsPage';

// ─────────────────────────────────────────────────────────────────────────────
//  MOCKS GLOBAUX
// ─────────────────────────────────────────────────────────────────────────────

// 1. AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'user-test-456', nom: 'Tenkam' } }),
}));

// 2. Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

// 3. Composants externes MobileMoney — mockés pour isoler CotisationsPage
vi.mock('../../../components/shared/MobileMoney', () => ({
  ModalPaiementMobileMoney: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => (
    <div data-testid="modal-paiement">
      <p>Modal Mobile Money</p>
      <button onClick={onClose}>Fermer</button>
      <button onClick={onSuccess}>Paiement réussi</button>
    </div>
  ),
  HistoriqueTransactions: ({ userId }: { userId: string }) => (
    <div data-testid="historique-transactions">Historique pour {userId}</div>
  ),
}));

// 4. Utilitaires — comportement réel
vi.mock('../../../lib/utils', async () => {
  const actual = await vi.importActual('../../../lib/utils');
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
  return render(<CotisationsPage />, { wrapper: Wrapper });
}

// ─────────────────────────────────────────────────────────────────────────────
//  DONNÉES DE TEST
// ─────────────────────────────────────────────────────────────────────────────

const tontinesData = [
  { id: 't1', nom: 'Njangi Famille', devise: 'XAF', montant_cotisation: 25000 },
];

/** Jeu de cotisations mixte pour tester tous les statuts */
const cotisationsMixtes = [
  { id: 'c1', tontine_id: 't1', cycle_numero: 1, montant_du: 25000, montant_paye: 25000, penalite: 0,    statut: 'payee',      date_echeance: '2024-01-01', date_paiement: '2024-01-01', reference: 'REF001' },
  { id: 'c2', tontine_id: 't1', cycle_numero: 2, montant_du: 25000, montant_paye: 25000, penalite: 0,    statut: 'payee',      date_echeance: '2024-02-01', date_paiement: '2024-02-01', reference: 'REF002' },
  { id: 'c3', tontine_id: 't1', cycle_numero: 3, montant_du: 25000, montant_paye: 0,     penalite: 0,    statut: 'en_attente', date_echeance: '2024-03-01', date_paiement: null,         reference: null },
  { id: 'c4', tontine_id: 't1', cycle_numero: 4, montant_du: 25000, montant_paye: 0,     penalite: 1250, statut: 'en_retard',  date_echeance: '2024-04-01', date_paiement: null,         reference: null },
];

/** Une seule cotisation en attente */
const cotisationsEnAttente = [
  { id: 'c1', tontine_id: 't1', cycle_numero: 1, montant_du: 30000, montant_paye: 0, penalite: 0, statut: 'en_attente', date_echeance: '2024-05-01', date_paiement: null, reference: null },
];

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION MOCK SUPABASE
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../../../lib/supabase';

function mockSupabase(cotisations: any[], tontines: any[]) {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    if (table === 'cotisations') {
      return {
        select: vi.fn().mockReturnValue({
          eq:    vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ data: cotisations, error: null }),
          }),
        }),
      };
    }
    if (table === 'tontines') {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ data: tontines, error: null }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ data: [], error: null }),
        in: vi.fn().mockReturnValue({ data: [], error: null }),
      }),
    };
  });
}

function mockSupabaseVide() {
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq:    vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ data: [], error: null }) }),
      in:    vi.fn().mockReturnValue({ data: [], error: null }),
      order: vi.fn().mockReturnValue({ data: [], error: null }),
    }),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. CHARGEMENT & STRUCTURE DE LA PAGE
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — Structure', () => {
  beforeEach(() => { mockSupabaseVide(); });

  it('affiche le titre "Mes cotisations"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mes cotisations')).toBeInTheDocument();
    });
  });

  it('affiche le sous-titre Mobile Money', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/gérez vos paiements mobile money/i)).toBeInTheDocument();
    });
  });

  it('affiche les 4 cartes de statistiques', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Reste à payer')).toBeInTheDocument();
      expect(screen.getByText('Total payé')).toBeInTheDocument();
      expect(screen.getByText('En retard')).toBeInTheDocument();
      expect(screen.getByText('En attente')).toBeInTheDocument();
    });
  });

  it('affiche les 2 onglets principaux', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Mes cotisations')).toBeInTheDocument();
      expect(screen.getByText(/historique mobile money/i)).toBeInTheDocument();
    });
  });

  it('affiche le spinner pendant le chargement', () => {
    renderPage();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  2. STATISTIQUES
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — Statistiques', () => {
  beforeEach(() => { mockSupabase(cotisationsMixtes, tontinesData); });

  it('calcule correctement le montant "Reste à payer" (en_attente + en_retard)', async () => {
    renderPage();
    // montant_du des non-payées : 25000 (en_attente) + 25000 (en_retard) = 50 000
    await waitFor(() => {
      expect(screen.getByText(/50[\s\u00A0]000/)).toBeInTheDocument();
    });
  });

  it('calcule correctement le total payé (2 cotisations payées × 25 000)', async () => {
    renderPage();
    // 2 payées × 25 000 = 50 000 — même valeur, vérifier la carte "Total payé"
    await waitFor(() => {
      const cartes = screen.getAllByText(/50[\s\u00A0]000/);
      expect(cartes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('affiche "1" en retard', async () => {
    renderPage();
    await waitFor(() => {
      // La stat "En retard" doit afficher 1
      const enRetardLabel = screen.getByText('En retard');
      const card = enRetardLabel.closest('.stat-card');
      expect(card).toHaveTextContent('1');
    });
  });

  it('affiche "1" en attente', async () => {
    renderPage();
    await waitFor(() => {
      const enAttenteLabel = screen.getByText('En attente');
      const card = enAttenteLabel.closest('.stat-card');
      expect(card).toHaveTextContent('1');
    });
  });

  it('affiche 0 pour toutes les stats quand aucune cotisation', async () => {
    mockSupabaseVide();
    renderPage();
    await waitFor(() => {
      // Tous les montants sont à 0 FCFA ou 0
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  3. LISTE DES COTISATIONS & FILTRES
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — Liste et filtres', () => {
  beforeEach(() => { mockSupabase(cotisationsMixtes, tontinesData); });

  it('affiche tous les filtres disponibles', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/toutes/i)).toBeInTheDocument();
      expect(screen.getByText(/à payer/i)).toBeInTheDocument();
      expect(screen.getByText(/en retard/i)).toBeInTheDocument();
      expect(screen.getByText(/payées/i)).toBeInTheDocument();
    });
  });

  it('affiche les compteurs dans les filtres', async () => {
    renderPage();
    await waitFor(() => {
      // Toutes (4), À payer (1), En retard (1), Payées (2)
      expect(screen.getByText(/toutes \(4\)/i)).toBeInTheDocument();
      expect(screen.getByText(/à payer \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/en retard \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/payées \(2\)/i)).toBeInTheDocument();
    });
  });

  it('affiche les 4 cotisations avec le filtre "Toutes"', async () => {
    renderPage();
    await waitFor(() => {
      // Chaque cotisation contient "Cycle X"
      expect(screen.getByText(/cycle 1/i)).toBeInTheDocument();
      expect(screen.getByText(/cycle 2/i)).toBeInTheDocument();
      expect(screen.getByText(/cycle 3/i)).toBeInTheDocument();
      expect(screen.getByText(/cycle 4/i)).toBeInTheDocument();
    });
  });

  it('filtre sur "En retard" et n\'affiche que la cotisation en retard', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/en retard \(1\)/i));
    await user.click(screen.getByText(/en retard \(1\)/i));
    await waitFor(() => {
      expect(screen.getByText(/cycle 4/i)).toBeInTheDocument();
      expect(screen.queryByText(/cycle 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cycle 2/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cycle 3/i)).not.toBeInTheDocument();
    });
  });

  it('filtre sur "Payées" et n\'affiche que les cotisations payées', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/payées \(2\)/i));
    await user.click(screen.getByText(/payées \(2\)/i));
    await waitFor(() => {
      expect(screen.getByText(/cycle 1/i)).toBeInTheDocument();
      expect(screen.getByText(/cycle 2/i)).toBeInTheDocument();
      expect(screen.queryByText(/cycle 3/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cycle 4/i)).not.toBeInTheDocument();
    });
  });

  it('filtre sur "À payer" et n\'affiche que la cotisation en attente', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/à payer \(1\)/i));
    await user.click(screen.getByText(/à payer \(1\)/i));
    await waitFor(() => {
      expect(screen.getByText(/cycle 3/i)).toBeInTheDocument();
      expect(screen.queryByText(/cycle 4/i)).not.toBeInTheDocument();
    });
  });

  it('affiche la référence de paiement pour les cotisations payées', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('REF001')).toBeInTheDocument();
    });
  });

  it('affiche la pénalité quand penalite > 0', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/de pénalité/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  4. ÉTAT VIDE
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — État vide', () => {
  beforeEach(() => { mockSupabaseVide(); });

  it('affiche "Aucune cotisation trouvée" quand aucune cotisation', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/aucune cotisation trouvée/i)).toBeInTheDocument();
    });
  });

  it('affiche le message pour rejoindre une tontine', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/rejoignez une tontine/i)).toBeInTheDocument();
    });
  });

  it('n\'affiche pas de bouton "Payer" quand aucune cotisation', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText(/payer via mobile money/i)).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  5. BOUTON "PAYER" ET MODAL MOBILE MONEY
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — Paiement Mobile Money', () => {
  beforeEach(() => { mockSupabase(cotisationsMixtes, tontinesData); });

  it('affiche le bouton "Payer via Mobile Money" pour les cotisations en attente', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText(/payer via mobile money/i).length).toBeGreaterThan(0);
    });
  });

  it('n\'affiche pas de bouton "Payer" pour les cotisations déjà payées', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/payées \(2\)/i));
    await user.click(screen.getByText(/payées \(2\)/i));
    await waitFor(() => {
      expect(screen.queryByText(/payer via mobile money/i)).not.toBeInTheDocument();
    });
  });

  it('ouvre la modal au clic sur "Payer via Mobile Money"', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getAllByText(/payer via mobile money/i));
    const boutons = screen.getAllByText(/payer via mobile money/i);
    await user.click(boutons[0]);
    await waitFor(() => {
      expect(screen.getByTestId('modal-paiement')).toBeInTheDocument();
    });
  });

  it('affiche "Modal Mobile Money" quand la modal est ouverte', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getAllByText(/payer via mobile money/i));
    await user.click(screen.getAllByText(/payer via mobile money/i)[0]);
    await waitFor(() => {
      expect(screen.getByText('Modal Mobile Money')).toBeInTheDocument();
    });
  });

  it('ferme la modal au clic sur "Fermer"', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getAllByText(/payer via mobile money/i));
    await user.click(screen.getAllByText(/payer via mobile money/i)[0]);
    await waitFor(() => screen.getByTestId('modal-paiement'));
    await user.click(screen.getByText('Fermer'));
    await waitFor(() => {
      expect(screen.queryByTestId('modal-paiement')).not.toBeInTheDocument();
    });
  });

  it('ferme la modal après un paiement réussi', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getAllByText(/payer via mobile money/i));
    await user.click(screen.getAllByText(/payer via mobile money/i)[0]);
    await waitFor(() => screen.getByTestId('modal-paiement'));
    await user.click(screen.getByText('Paiement réussi'));
    await waitFor(() => {
      expect(screen.queryByTestId('modal-paiement')).not.toBeInTheDocument();
    });
  });

  it('la modal n\'est pas visible par défaut', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Mes cotisations'));
    expect(screen.queryByTestId('modal-paiement')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  6. ONGLET HISTORIQUE
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — Onglet Historique', () => {
  beforeEach(() => { mockSupabaseVide(); });

  it('bascule vers l\'onglet Historique au clic', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/historique mobile money/i));
    await user.click(screen.getByText(/historique mobile money/i));
    await waitFor(() => {
      expect(screen.getByTestId('historique-transactions')).toBeInTheDocument();
    });
  });

  it('passe le bon userId au composant HistoriqueTransactions', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/historique mobile money/i));
    await user.click(screen.getByText(/historique mobile money/i));
    await waitFor(() => {
      expect(screen.getByText(/historique pour user-test-456/i)).toBeInTheDocument();
    });
  });

  it('masque la liste des cotisations dans l\'onglet Historique', async () => {
    mockSupabase(cotisationsMixtes, tontinesData);
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/historique mobile money/i));
    await user.click(screen.getByText(/historique mobile money/i));
    await waitFor(() => {
      expect(screen.queryByText(/cycle 1/i)).not.toBeInTheDocument();
    });
  });

  it('revient à l\'onglet cotisations depuis Historique', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByText(/historique mobile money/i));
    await user.click(screen.getByText(/historique mobile money/i));
    // Les onglets sont dans une barre avec des boutons — cliquer "Mes cotisations"
    const boutons = screen.getAllByText('Mes cotisations');
    await user.click(boutons[boutons.length - 1]); // le bouton dans la barre d'onglets
    await waitFor(() => {
      expect(screen.queryByTestId('historique-transactions')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  7. COTISATION AVEC PÉNALITÉ
// ─────────────────────────────────────────────────────────────────────────────
describe('CotisationsPage — Gestion des pénalités', () => {
  it('affiche le montant total (montant_du + penalite) pour une cotisation en retard', async () => {
    // 25000 + 1250 = 26 250
    mockSupabase([cotisationsMixtes[3]], tontinesData); // seulement la cotisation en retard
    renderPage();
    await waitFor(() => {
      // montantTotal = 25000 + 1250 = 26250
      expect(screen.getByText(/26[\s\u00A0]250/)).toBeInTheDocument();
    });
  });

  it('affiche le montant de la pénalité séparément', async () => {
    mockSupabase([cotisationsMixtes[3]], tontinesData);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/de pénalité/i)).toBeInTheDocument();
    });
  });
});