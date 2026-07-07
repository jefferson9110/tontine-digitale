import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tontine, CreateTontineForm } from '../types';
import toast from 'react-hot-toast';

// ── Clés de cache ────────────────────────────────
export const TONTINES_KEY = ['tontines'] as const;

// ── Récupérer les tontines de l'utilisateur ──────
export function useTontines(userId?: string) {
  return useQuery({
    queryKey: [...TONTINES_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select(`
          *,
          membres_tontine!inner(user_id)
        `)
        .eq('membres_tontine.user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Tontine[];
    },
  });
}

// ── Récupérer une tontine par ID ─────────────────
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

// ── Toutes les tontines (admin) ──────────────────
export function useAllTontines() {
  return useQuery({
    queryKey: [...TONTINES_KEY, 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Tontine[];
    },
  });
}

// ── Créer une tontine ────────────────────────────
export function useCreateTontine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      form,
      organisateurId,
    }: {
      form: CreateTontineForm;
      organisateurId: string;
    }) => {
      const { data, error } = await supabase
        .from('tontines')
        .insert([{ ...form, organisateur_id: organisateurId, statut: 'brouillon' }])
        .select()
        .single();

      if (error) throw error;

      // Ajouter l'organisateur comme membre
      await supabase.from('membres_tontine').insert([{
        tontine_id:  data.id,
        user_id:     organisateurId,
        role:        'organisateur',
        statut:      'actif',
      }]);

      return data as Tontine;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TONTINES_KEY });
      toast.success('Tontine créée avec succès !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Modifier une tontine ─────────────────────────
export function useUpdateTontine() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Tontine>;
    }) => {
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

// ── Supprimer une tontine ────────────────────────
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
