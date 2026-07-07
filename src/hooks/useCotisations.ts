import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Cotisation } from '../types';
import toast from 'react-hot-toast';

export const COTISATIONS_KEY = ['cotisations'] as const;

export function useCotisations(tontineId?: string) {
  return useQuery({
    queryKey: [...COTISATIONS_KEY, tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('*, user:profiles(*)')
        .eq('tontine_id', tontineId!)
        .order('date_echeance', { ascending: false });

      if (error) throw error;
      return data as Cotisation[];
    },
  });
}

export function useMesCotisations(userId?: string) {
  return useQuery({
    queryKey: [...COTISATIONS_KEY, 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('*, tontine:tontines(*)')
        .eq('user_id', userId!)
        .order('date_echeance', { ascending: false });

      if (error) throw error;
      return data as Cotisation[];
    },
  });
}

export function useValiderCotisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cotisationId,
      validePar,
      montantPaye,
      reference,
    }: {
      cotisationId: string;
      validePar:    string;
      montantPaye:  number;
      reference?:   string;
    }) => {
      const { error } = await supabase
        .from('cotisations')
        .update({
          montant_paye:   montantPaye,
          statut:         'payee',
          date_paiement:  new Date().toISOString(),
          valide_par:     validePar,
          reference,
        })
        .eq('id', cotisationId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: COTISATIONS_KEY });
      toast.success('Cotisation validée !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
