// ═══════════════════════════════════════════════════
//  TontineDigitale — Types globaux
// ═══════════════════════════════════════════════════

// ── Rôles ──────────────────────────────────────────
export type UserRole = 'admin' | 'organisateur' | 'membre' | 'tresorier';

// ── Utilisateur ────────────────────────────────────
export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  avatar_url?: string;
  role_global: UserRole;  // rôle sur la plateforme
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Tontine ────────────────────────────────────────
export type TontineStatut = 'brouillon' | 'active' | 'suspendue' | 'terminee';
export type TontineType   = 'rotatif' | 'fixe' | 'encheres';
export type FrequenceCotisation = 'hebdomadaire' | 'bimensuel' | 'mensuel' | 'trimestriel';

export interface Tontine {
  id: string;
  nom: string;
  description?: string;
  type: TontineType;
  statut: TontineStatut;
  montant_cotisation: number;
  devise: 'XAF' | 'EUR' | 'USD';
  frequence: FrequenceCotisation;
  date_debut: string;
  date_fin_prevue?: string;
  nombre_membres_max: number;
  cycle_actuel: number;
  total_cycles: number;
  organisateur_id: string;
  tresorier_id?: string;
  lien_invitation?: string;
  penalite_retard: number;        // montant pénalité en %
  delai_grace_jours: number;
  regles?: string;
  created_at: string;
  updated_at: string;
}

// ── Membre d'une tontine ───────────────────────────
export type MembreStatut = 'invite' | 'en_attente' | 'actif' | 'suspendu' | 'exclu';
export type MembreRole   = 'organisateur' | 'tresorier' | 'membre';

export interface MembreTontine {
  id: string;
  tontine_id: string;
  user_id: string;
  role: MembreRole;
  statut: MembreStatut;
  ordre_beneficiaire?: number;
  a_beneficie: boolean;
  date_adhesion: string;
  user?: User;
  tontine?: Tontine;
}

// ── Cotisation ─────────────────────────────────────
export type CotisationStatut = 'en_attente' | 'payee' | 'en_retard' | 'partiellement_payee';

export interface Cotisation {
  id: string;
  tontine_id: string;
  membre_id: string;      // MembreTontine.id
  user_id: string;
  cycle_numero: number;
  montant_du: number;
  montant_paye: number;
  penalite: number;
  statut: CotisationStatut;
  date_echeance: string;
  date_paiement?: string;
  reference?: string;
  note?: string;
  valide_par?: string;
  created_at: string;
  membre?: MembreTontine;
  user?: User;
  tontine?: Tontine;
}

// ── Bénéficiaire ───────────────────────────────────
export interface TourBeneficiaire {
  id: string;
  tontine_id: string;
  membre_id: string;
  cycle_numero: number;
  montant_total: number;
  date_prevue: string;
  date_versement?: string;
  statut: 'planifie' | 'verse' | 'reporte';
  membre?: MembreTontine;
}

// ── Notification ───────────────────────────────────
export type NotificationTypes =
  | 'rappel_paiement'
  | 'paiement_recu'
  | 'nouveau_membre'
  | 'cycle_ouvert'
  | 'cycle_ferme'
  | 'beneficiaire_annonce'
  | 'penalite_appliquee'
  | 'invitation_tontine'
  | 'systeme';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationTypes;
  titre: string;
  message: string;
  lu: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// ── Message (chat interne) ─────────────────────────
export interface Message {
  id: string;
  tontine_id: string;
  user_id: string;
  contenu: string;
  created_at: string;
  user?: User;
}

// ── Vote ordre bénéficiaires ───────────────────────
export interface Vote {
  id: string;
  tontine_id: string;
  votant_id: string;
  candidat_id: string;
  cycle_cible: number;
  created_at: string;
}

// ── Stats & Tableaux de bord ───────────────────────
export interface StatsTontine {
  total_collecte: number;
  total_attendu: number;
  taux_participation: number;
  membres_actifs: number;
  cotisations_en_retard: number;
  cycle_actuel: number;
  prochain_beneficiaire?: MembreTontine;
}

export interface StatsAdmin {
  total_tontines: number;
  tontines_actives: number;
  total_utilisateurs: number;
  total_collecte_global: number;
  taux_participation_global: number;
  nouvelles_inscriptions_mois: number;
}

// ── Forms & Inputs ─────────────────────────────────
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  password: string;
  confirmPassword: string;
}

export interface CreateTontineForm {
  nom: string;
  description?: string;
  type: TontineType;
  montant_cotisation: number;
  devise: 'XAF' | 'EUR' | 'USD';
  frequence: FrequenceCotisation;
  date_debut: string;
  nombre_membres_max: number;
  penalite_retard: number;
  delai_grace_jours: number;
  regles?: string;
}

// ── Utils ──────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
