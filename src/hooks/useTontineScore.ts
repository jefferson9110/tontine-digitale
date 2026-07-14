import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface TontineScoreData {
  score:                integer;
  niveau:               'Excellent' | 'Fiable' | 'Correct' | 'Faible' | 'Nouveau';
  total_cotisations:    number;
  payees:               number;
  retards:              number;
  partielles:           number;
  tontines_participees: number;
  total_penalites:      number;
  total_du:             number;
}

// Couleur selon le niveau
export function getScoreColor(score: number) {
  if (score >= 85) return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500', badge: 'badge-green' };
  if (score >= 70) return { bg: 'bg-primary-100', text: 'text-primary-700', bar: 'bg-primary-500', badge: 'badge-green' };
  if (score >= 50) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-400', badge: 'badge-yellow' };
  return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-400', badge: 'badge-red' };
}

// Hook principal — appelle la fonction SQL
export function useTontineScore(userId?: string) {
  return useQuery({
    queryKey: ['tontine_score', userId],
    enabled:  !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_tontine_score', { p_user_id: userId });

      if (error) throw error;

      // Si pas encore de cotisations → score neutre
      if (!data || data.length === 0) {
        return {
          score:                50,
          niveau:               'Nouveau' as const,
          total_cotisations:    0,
          payees:               0,
          retards:              0,
          partielles:           0,
          tontines_participees: 0,
          total_penalites:      0,
          total_du:             0,
        };
      }

      return data[0] as TontineScoreData;
    },
  });
}

// Hook pour récupérer les scores de tous les membres d'une tontine
export function useScoresMembres(tontineId?: string) {
  return useQuery({
    queryKey: ['tontine_scores_membres', tontineId],
    enabled:  !!tontineId,
    queryFn: async () => {
      // Récupérer les membres de la tontine
      const { data: membres, error: me } = await supabase
        .from('membres_tontine')
        .select('user_id, user:profiles(id, nom, prenom)')
        .eq('tontine_id', tontineId!)
        .eq('statut', 'actif');

      if (me || !membres) throw me;

      // Récupérer les scores pour chaque membre
      const scores = await Promise.all(
        membres.map(async (m) => {
          const { data } = await supabase
            .rpc('get_tontine_score', { p_user_id: m.user_id });

          const scoreData = data?.[0] ?? {
            score: 50, niveau: 'Nouveau',
            total_cotisations: 0, payees: 0, retards: 0,
          };

          return {
            user_id:  m.user_id,
            user:     m.user,
            ...scoreData,
          };
        })
      );

      return scores.sort((a, b) => b.score - a.score);
    },
  });
}

type integer = number;