import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types';
import toast from 'react-hot-toast';

export const ADMIN_KEY = ['admin'] as const;
export const USERS_KEY = ['users'] as const;

// ── Tous les utilisateurs (admin) ───────────────
export function useAllUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    },
  });
}

// ── Stats globales plateforme (admin) ───────────
export function useStatsAdmin() {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'stats'],
    queryFn: async () => {
      const [tontinesRes, usersRes, cotisationsRes] = await Promise.all([
        supabase.from('tontines').select('id, statut'),
        supabase.from('profiles').select('id, created_at'),
        supabase.from('cotisations').select('montant_paye, statut'),
      ]);

      if (tontinesRes.error) throw tontinesRes.error;
      if (usersRes.error)    throw usersRes.error;

      const tontines    = tontinesRes.data ?? [];
      const users       = usersRes.data ?? [];
      const cotisations = cotisationsRes.data ?? [];

      const unMoisAvant = new Date();
      unMoisAvant.setMonth(unMoisAvant.getMonth() - 1);

      const nouvellesInscriptions = users.filter(
        u => new Date(u.created_at) > unMoisAvant
      ).length;

      const totalPaye  = cotisations.reduce((s, c) => s + (c.montant_paye ?? 0), 0);
      const enRetard   = cotisations.filter(c => c.statut === 'en_retard').length;
      const totalCots  = cotisations.length;
      const tauxParticipation = totalCots > 0
        ? Math.round((cotisations.filter(c => c.statut === 'payee').length / totalCots) * 100)
        : 0;

      return {
        total_tontines:        tontines.length,
        tontines_actives:      tontines.filter(t => t.statut === 'active').length,
        tontines_suspendues:   tontines.filter(t => t.statut === 'suspendue').length,
        total_utilisateurs:    users.length,
        nouvelles_inscriptions: nouvellesInscriptions,
        volume_collecte:       totalPaye,
        taux_participation:    tauxParticipation,
        cotisations_retard:    enRetard,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ── Modifier le rôle d'un utilisateur ───────────
export function useChangerRoleUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role_global: role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Rôle mis à jour.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Activer / désactiver un utilisateur ─────────
export function useToggleUserActif() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, actif }: { userId: string; actif: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: actif, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { actif }) => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success(actif ? 'Utilisateur réactivé.' : 'Utilisateur désactivé.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Données pour les graphiques (admin rapports) ─
export function useRapportsData() {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'rapports'],
    queryFn: async () => {
      const { data: cotisations, error } = await supabase
        .from('cotisations')
        .select('montant_paye, created_at, statut')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Grouper par mois
      const parMois: Record<string, { collecte: number; retards: number; total: number }> = {};

      (cotisations ?? []).forEach(c => {
        const mois = c.created_at.slice(0, 7); // YYYY-MM
        if (!parMois[mois]) parMois[mois] = { collecte: 0, retards: 0, total: 0 };
        parMois[mois].collecte += c.montant_paye;
        parMois[mois].total   += 1;
        if (c.statut === 'en_retard') parMois[mois].retards += 1;
      });

      return Object.entries(parMois)
        .slice(-7) // 7 derniers mois
        .map(([mois, vals]) => ({
          mois:     new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'short' }),
          collecte: vals.collecte,
          retards:  vals.retards,
          total:    vals.total,
        }));
    },
  });
}

// ── Profil d'un utilisateur (admin) ─────────────
export function useUserDetail(userId?: string) {
  return useQuery({
    queryKey: [...USERS_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      const [profileRes, membershipsRes, cotisationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId!).single(),
        supabase.from('membres_tontine').select('tontine_id').eq('user_id', userId!),
        supabase.from('cotisations').select('statut, penalite').eq('user_id', userId!),
      ]);

      if (profileRes.error) throw profileRes.error;

      const cotisations   = cotisationsRes.data ?? [];
      const total         = cotisations.length;
      const payees        = cotisations.filter(c => c.statut === 'payee').length;
      const penalites     = cotisations.reduce((s, c) => s + (c.penalite ?? 0), 0);
      const score = total > 0
        ? Math.max(0, Math.min(100, Math.round((payees / total) * 80 + (penalites === 0 ? 20 : 0))))
        : 50;

      return {
        ...profileRes.data as User,
        tontines_count: membershipsRes.data?.length ?? 0,
        score,
      };
    },
  });
}