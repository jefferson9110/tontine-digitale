import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tontine, CreateTontineForm } from '../types';
import toast from 'react-hot-toast';

export const TONTINES_KEY = ['tontines'] as const;

// ── Tontines de l'utilisateur connecté ──────────
export function useTontines(userId?: string) {
  return useQuery({
    queryKey: [...TONTINES_KEY, 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres_tontine')
        .select('tontine:tontines(*)')
        .eq('user_id', userId!)
        .in('statut', ['actif', 'en_attente', 'invite']);

      if (error) throw error;
      return (data ?? []).map((r: any) => r.tontine as Tontine);
    },
  });
}

// ── Tontines créées par l'organisateur ──────────
export function useToShared(organisateurId?: string) {
  return useQuery({
    queryKey: [...TONTINES_KEY, 'orga', organisateurId],
    enabled: !!organisateurId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('organisateur_id', organisateurId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Tontine[];
    },
  });
}

// ── Détail d'une tontine par ID ─────────────────
export function useTontine(tontineId?: string) {
  return useQuery({
    queryKey: [...TONTINES_KEY, 'detail', tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', tontineId!)
        .single();

      if (error) throw error;
      return data as Tontine;
    },
  });
}

// ── Toutes les tontines (admin) ─────────────────
export function useAllTontines() {
  return useQuery({
    queryKey: [...TONTINES_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select('*, organisateur:profiles(nom, prenom)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Tontine & { organisateur: { nom: string; prenom: string } })[];
    },
  });
}

// ── Créer une tontine ───────────────────────────
export function useCreateTontine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      form,
      organisateurId,
    }: { form: CreateTontineForm; organisateurId: string }) => {
      // 1. Créer la tontine
      const { data, error } = await supabase
        .from('tontines')
        .insert([{
          ...form,
          organisateur_id: organisateurId,
          statut:          'brouillon',
          cycle_actuel:    0,
          total_cycles:    form.nombre_membres_max,
          lien_invitation: btoa(`${Date.now()}-${Math.random()}`),
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Ajouter l'organisateur comme premier membre
      const { error: me } = await supabase
        .from('membres_tontine')
        .insert([{
          tontine_id: data.id,
          user_id:    organisateurId,
          role:       'organisateur',
          statut:     'actif',
        }]);

      if (me) throw me;
      return data as Tontine;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: TONTINES_KEY });
      toast.success('Tontine créée !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Modifier une tontine ────────────────────────
export function useUpdateTontine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tontine> }) => {
      const { data, error } = await supabase
        .from('tontines')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Tontine;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TONTINES_KEY });
      toast.success('Tontine mise à jour.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Changer le statut (admin/orga) ──────────────
export function useChangerStatutTontine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      statut,
    }: { id: string; statut: Tontine['statut'] }) => {
      const { error } = await supabase
        .from('tontines')
        .update({ statut, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { statut }) => {
      qc.invalidateQueries({ queryKey: TONTINES_KEY });
      const msg = statut === 'active' ? 'Tontine réactivée.' :
                  statut === 'suspendue' ? 'Tontine suspendue.' : 'Statut mis à jour.';
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Supprimer une tontine (brouillon seulement) ──
export function useDeleteTontine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tontines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TONTINES_KEY });
      toast.success('Tontine supprimée.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Stats d'une tontine ─────────────────────────
export function useStatsTontine(tontineId?: string) {
  return useQuery({
    queryKey: [...TONTINES_KEY, 'stats', tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const [membresRes, cotisationsRes] = await Promise.all([
        supabase
          .from('membres_tontine')
          .select('id, statut')
          .eq('tontine_id', tontineId!),
        supabase
          .from('cotisations')
          .select('montant_du, montant_paye, statut, penalite')
          .eq('tontine_id', tontineId!),
      ]);

      if (membresRes.error) throw membresRes.error;
      if (cotisationsRes.error) throw cotisationsRes.error;

      const membres    = membresRes.data ?? [];
      const cotisations = cotisationsRes.data ?? [];

      const totalDu    = cotisations.reduce((s, c) => s + c.montant_du, 0);
      const totalPaye  = cotisations.reduce((s, c) => s + c.montant_paye, 0);
      const enRetard   = cotisations.filter(c => c.statut === 'en_retard').length;

      return {
        membres_actifs:       membres.filter(m => m.statut === 'actif').length,
        membres_total:        membres.length,
        total_collecte:       totalPaye,
        total_attendu:        totalDu,
        taux_participation:   totalDu > 0 ? Math.round((totalPaye / totalDu) * 100) : 0,
        cotisations_retard:   enRetard,
      };
    },
  });
}