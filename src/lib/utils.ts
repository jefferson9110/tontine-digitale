import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Fusionne les classes Tailwind sans conflit
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formate un montant en devise
export function formatMontant(
  montant: number,
  devise: 'XAF' | 'EUR' | 'USD' = 'XAF'
): string {
  const locales: Record<string, string> = {
    XAF: 'fr-CM',
    EUR: 'fr-FR',
    USD: 'en-US',
  };
  return new Intl.NumberFormat(locales[devise], {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: devise === 'XAF' ? 0 : 2,
  }).format(montant);
}

// Formate une date
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...options,
  }).format(new Date(date));
}

// Formate une date + heure
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Calcule les initiales d'un nom
export function getInitiales(nom: string, prenom?: string): string {
  if (prenom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  const parts = nom.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return nom.slice(0, 2).toUpperCase();
}

// Génère un lien d'invitation unique
export function genererLienInvitation(tontineId: string): string {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  const token = btoa(`${tontineId}-${Date.now()}`);
  return `${base}/rejoindre/${token}`;
}

// Calcule si une cotisation est en retard
export function isEnRetard(dateEcheance: string): boolean {
  return new Date(dateEcheance) < new Date();
}

// Calcule le taux de participation
export function calculTauxParticipation(paye: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((paye / total) * 100);
}

// Couleur de statut
export function getStatutColor(statut: string): string {
  const map: Record<string, string> = {
    active:    'badge-green',
    actif:     'badge-green',
    payee:     'badge-green',
    planifie:  'badge-blue',
    en_attente:'badge-yellow',
    brouillon: 'badge-gray',
    en_retard: 'badge-red',
    suspendue: 'badge-yellow',
    suspendu:  'badge-yellow',
    terminee:  'badge-gray',
    exclu:     'badge-red',
    verse:     'badge-green',
    reporte:   'badge-yellow',
    invite:    'badge-purple',
    partiellement_payee: 'badge-yellow',
  };
  return map[statut] ?? 'badge-gray';
}

// Label lisible du statut
export function getStatutLabel(statut: string): string {
  const map: Record<string, string> = {
    active:     'Active',
    actif:      'Actif',
    payee:      'Payée',
    planifie:   'Planifié',
    en_attente: 'En attente',
    brouillon:  'Brouillon',
    en_retard:  'En retard',
    suspendue:  'Suspendue',
    suspendu:   'Suspendu',
    terminee:   'Terminée',
    exclu:      'Exclu',
    verse:      'Versé',
    reporte:    'Reporté',
    invite:     'Invité',
    partiellement_payee: 'Partiel',
  };
  return map[statut] ?? statut;
}

// Fréquence lisible
export function getFrequenceLabel(freq: string): string {
  const map: Record<string, string> = {
    hebdomadaire: 'Hebdomadaire',
    bimensuel:    'Bimensuel',
    mensuel:      'Mensuel',
    trimestriel:  'Trimestriel',
  };
  return map[freq] ?? freq;
}

// Tronque un texte
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}
