import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';
import toast from 'react-hot-toast';

// ── Stats Admin ──────────────────────────────────
export function useStatsAdmin() {
  return useQuery({
    queryKey: ['stats_admin'],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const [t, u, c] = await Promise.all([
        supabase.from('tontines').select('id, statut'),
        supabase.from('profiles').select('id, created_at, role_global, is_active'),
        supabase.from('cotisations').select('montant_paye, statut'),
      ]);

      const tontines    = t.data ?? [];
      const users       = u.data ?? [];
      const cotisations = c.data ?? [];

      const maintenant = new Date();
      const debutMois  = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

      return {
        total_tontines:         tontines.length,
        tontines_actives:       tontines.filter(t => t.statut === 'active').length,
        tontines_suspendues:    tontines.filter(t => t.statut === 'suspendue').length,
        tontines_terminees:     tontines.filter(t => t.statut === 'terminee').length,
        total_utilisateurs:     users.length,
        utilisateurs_actifs:    users.filter(u => u.is_active).length,
        nouvelles_inscriptions: users.filter(u => new Date(u.created_at) >= debutMois).length,
        total_organisateurs:    users.filter(u => u.role_global === 'organisateur').length,
        total_membres:          users.filter(u => u.role_global === 'membre').length,
        volume_collecte:        cotisations.filter(c => c.statut === 'payee')
                                  .reduce((s, c) => s + Number(c.montant_paye), 0),
        cotisations_retard:     cotisations.filter(c => c.statut === 'en_retard').length,
        taux_participation:     cotisations.length > 0
          ? Math.round((cotisations.filter(c => c.statut === 'payee').length / cotisations.length) * 100)
          : 0,
      };
    },
  });
}

// ── Tous les utilisateurs ────────────────────────
export function useAllUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nom, prenom, email, role_global, is_active, telephone, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Toutes les tontines (admin) ──────────────────
export function useAllTontinesAdmin() {
  return useQuery({
    queryKey: ['admin_tontines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select('id, nom, statut, montant_cotisation, devise, frequence, cycle_actuel, total_cycles, created_at, organisateur_id')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Récupérer les noms d'organisateurs séparément
      const orgaIds = [...new Set((data ?? []).map(t => t.organisateur_id))];
      const { data: orgas } = await supabase
        .from('profiles')
        .select('id, nom, prenom')
        .in('id', orgaIds);

      return (data ?? []).map(t => ({
        ...t,
        organisateur: orgas?.find(o => o.id === t.organisateur_id) ?? null,
      }));
    },
  });
}

// ── Données rapports (graphiques par mois) ───────
export function useRapportsData() {
  return useQuery({
    queryKey: ['admin_rapports'],
    queryFn: async () => {
      const { data: cotisations, error } = await supabase
        .from('cotisations')
        .select('montant_paye, statut, created_at, date_echeance')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Grouper par mois
      const parMois: Record<string, { collecte: number; retards: number; paiements: number }> = {};

      (cotisations ?? []).forEach(c => {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

        if (!parMois[key]) parMois[key] = { collecte: 0, retards: 0, paiements: 0 };
        if (c.statut === 'payee')      parMois[key].collecte   += Number(c.montant_paye);
        if (c.statut === 'en_retard') parMois[key].retards    += 1;
        if (c.statut === 'payee')     parMois[key].paiements  += 1;
      });

      return Object.entries(parMois)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([key, vals]) => {
          const [year, month] = key.split('-');
          const d = new Date(Number(year), Number(month) - 1);
          return {
            mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
            ...vals,
          };
        });
    },
  });
}

// ── Changer rôle utilisateur ─────────────────────
export function useChangerRoleUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role_global: role })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success('Rôle mis à jour.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Activer / Désactiver utilisateur ─────────────
export function useToggleUserActif() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, actif }: { userId: string; actif: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: actif })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { actif }) => {
      qc.invalidateQueries({ queryKey: ['admin_users'] });
      toast.success(actif ? 'Compte réactivé.' : 'Compte désactivé.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Supprimer / suspendre tontine (admin) ────────
export function useChangerStatutTontineAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase
        .from('tontines')
        .update({ statut })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_tontines'] });
      toast.success('Statut mis à jour.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTontineAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tontines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin_tontines'] });
      toast.success('Tontine supprimée.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}