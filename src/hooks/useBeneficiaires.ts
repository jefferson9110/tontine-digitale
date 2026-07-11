import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TourBeneficiaire, Vote } from '../types';
import toast from 'react-hot-toast';

export const TOURS_KEY = ['tours_beneficiaires'] as const;
export const VOTES_KEY = ['votes'] as const;

// ── Tours bénéficiaires d'une tontine ───────────
export function useToursBeneficiaires(tontineId?: string) {
  return useQuery({
    queryKey: [...TOURS_KEY, tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours_beneficiaires')
        .select(`
          *,
          membre:membres_tontine(
            id, ordre_beneficiaire,
            user:profiles(id, nom, prenom, avatar_url)
          )
        `)
        .eq('tontine_id', tontineId!)
        .order('cycle_numero', { ascending: true });

      if (error) throw error;
      return data as TourBeneficiaire[];
    },
  });
}

// ── Mes tours (toutes mes tontines) ─────────────
export function useMesTours(userId?: string) {
  return useQuery({
    queryKey: [...TOURS_KEY, 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours_beneficiaires')
        .select(`
          *,
          tontine:tontines(nom, devise, montant_cotisation),
          membre:membres_tontine!inner(user_id)
        `)
        .eq('membres_tontine.user_id', userId!)
        .order('date_prevue', { ascending: true });

      if (error) throw error;
      return data as TourBeneficiaire[];
    },
  });
}

// ── Planifier l'ordre des bénéficiaires ─────────
export function usePlanifierTours() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tontineId,
      tours,
    }: {
      tontineId: string;
      tours: { membre_id: string; cycle_numero: number; date_prevue: string; montant_total: number }[];
    }) => {
      // Supprimer les tours planifiés existants
      await supabase
        .from('tours_beneficiaires')
        .delete()
        .eq('tontine_id', tontineId)
        .eq('statut', 'planifie');

      // Insérer les nouveaux tours
      const { error } = await supabase
        .from('tours_beneficiaires')
        .insert(tours.map(t => ({
          tontine_id:   tontineId,
          membre_id:    t.membre_id,
          cycle_numero: t.cycle_numero,
          date_prevue:  t.date_prevue,
          montant_total: t.montant_total,
          statut:       'planifie',
        })));

      if (error) throw error;
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: [...TOURS_KEY, tontineId] });
      toast.success('Calendrier des tours mis à jour !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Marquer un tour comme versé ─────────────────
export function useMarquerVerse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tourId,
      membreId,
    }: { tourId: string; tontineId: string; membreId: string }) => {
      const { error: te } = await supabase
        .from('tours_beneficiaires')
        .update({
          statut:         'verse',
          date_versement: new Date().toISOString(),
        })
        .eq('id', tourId);

      if (te) throw te;

      // Marquer le membre comme ayant bénéficié
      const { error: me } = await supabase
        .from('membres_tontine')
        .update({ a_beneficie: true })
        .eq('id', membreId);

      if (me) throw me;
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: [...TOURS_KEY, tontineId] });
      toast.success('Tour marqué comme versé !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Votes pour l'ordre des bénéficiaires ────────
export function useVotes(tontineId?: string, cycleCible?: number) {
  return useQuery({
    queryKey: [...VOTES_KEY, tontineId, cycleCible],
    enabled: !!tontineId && cycleCible !== undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          *,
          votant:profiles!votant_id(nom, prenom),
          candidat:profiles!candidat_id(nom, prenom)
        `)
        .eq('tontine_id', tontineId!)
        .eq('cycle_cible', cycleCible!);

      if (error) throw error;
      return data as Vote[];
    },
  });
}

// ── Voter pour un candidat ──────────────────────
export function useVoter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tontineId,
      votantId,
      candidatId,
      cycleCible,
    }: {
      tontineId:   string;
      votantId:    string;
      candidatId:  string;
      cycleCible:  number;
    }) => {
      // Vérifier si déjà voté
      const { data: existing } = await supabase
        .from('votes')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('votant_id', votantId)
        .eq('cycle_cible', cycleCible)
        .maybeSingle();

      if (existing) throw new Error('Vous avez déjà voté pour ce cycle.');

      const { error } = await supabase
        .from('votes')
        .insert([{ tontine_id: tontineId, votant_id: votantId, candidat_id: candidatId, cycle_cible: cycleCible }]);

      if (error) throw error;
    },
    onSuccess: (_, { tontineId, cycleCible }) => {
      qc.invalidateQueries({ queryKey: [...VOTES_KEY, tontineId, cycleCible] });
      toast.success('Vote enregistré !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}