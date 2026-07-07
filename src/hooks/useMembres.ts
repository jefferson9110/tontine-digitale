import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { MembreTontine } from '../types';
import toast from 'react-hot-toast';

export const MEMBRES_KEY = ['membres'] as const;

export function useMembres(tontineId?: string) {
  return useQuery({
    queryKey: [...MEMBRES_KEY, tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres_tontine')
        .select('*, user:profiles(*)')
        .eq('tontine_id', tontineId!)
        .order('date_adhesion', { ascending: true });

      if (error) throw error;
      return data as MembreTontine[];
    },
  });
}

export function useInviterMembre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tontineId,
      email,
    }: {
      tontineId: string;
      email: string;
    }) => {
      // 1. Trouver l'utilisateur par email
      const { data: user, error: ue } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (ue || !user) throw new Error('Utilisateur introuvable avec cet email.');

      // 2. Vérifier s'il est déjà membre
      const { data: existing } = await supabase
        .from('membres_tontine')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('user_id', user.id)
        .single();

      if (existing) throw new Error('Cet utilisateur est déjà membre.');

      // 3. Créer l'invitation
      const { error } = await supabase.from('membres_tontine').insert([{
        tontine_id: tontineId,
        user_id:    user.id,
        role:       'membre',
        statut:     'invite',
      }]);

      if (error) throw error;
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: [...MEMBRES_KEY, tontineId] });
      toast.success('Invitation envoyée !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExclureMembre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ membreId, tontineId }: { membreId: string; tontineId: string }) => {
      const { error } = await supabase
        .from('membres_tontine')
        .update({ statut: 'exclu' })
        .eq('id', membreId);
      if (error) throw error;
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: [...MEMBRES_KEY, tontineId] });
      toast.success('Membre exclu.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
