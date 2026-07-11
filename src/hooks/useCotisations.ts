import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Cotisation } from '../types';
import toast from 'react-hot-toast';

export const COTISATIONS_KEY = ['cotisations'] as const;

// ── Cotisations d'une tontine ───────────────────
export function useCotisations(tontineId?: string, cycleNumero?: number) {
  return useQuery({
    queryKey: [...COTISATIONS_KEY, tontineId, cycleNumero],
    enabled: !!tontineId,
    queryFn: async () => {
      let query = supabase
        .from('cotisations')
        .select(`
          *,
          user:profiles(id, nom, prenom, avatar_url)
        `)
        .eq('tontine_id', tontineId!)
        .order('date_echeance', { ascending: false });

      if (cycleNumero !== undefined) {
        query = query.eq('cycle_numero', cycleNumero);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Cotisation & { user: { id: string; nom: string; prenom: string; avatar_url?: string } })[];
    },
  });
}

// ── Mes cotisations (membre connecté) ───────────
export function useMesCotisations(userId?: string) {
  return useQuery({
    queryKey: [...COTISATIONS_KEY, 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('*, tontine:tontines(nom, devise, montant_cotisation)')
        .eq('user_id', userId!)
        .order('date_echeance', { ascending: false });

      if (error) throw error;
      return data as (Cotisation & { tontine: { nom: string; devise: string; montant_cotisation: number } })[];
    },
  });
}

// ── Toutes les cotisations (admin) ──────────────
export function useAllCotisations(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...COTISATIONS_KEY, 'all', page],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to   = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('cotisations')
        .select(`
          *,
          user:profiles(nom, prenom),
          tontine:tontines(nom, devise)
        `, { count: 'exact' })
        .order('date_echeance', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { data: data ?? [], count: count ?? 0 };
    },
  });
}

// ── Valider une cotisation ──────────────────────
export function useValiderCotisation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cotisationId,
      montantPaye,
      reference,
      validePar,
    }: {
      cotisationId: string;
      montantPaye:  number;
      reference?:   string;
      validePar:    string;
    }) => {
      // Récupérer la cotisation pour calculer le statut
      const { data: cot, error: ce } = await supabase
        .from('cotisations')
        .select('montant_du, penalite')
        .eq('id', cotisationId)
        .single();

      if (ce || !cot) throw new Error('Cotisation introuvable.');

      const totalDu = cot.montant_du + cot.penalite;
      const statut  = montantPaye >= totalDu
        ? 'payee'
        : montantPaye > 0
        ? 'partiellement_payee'
        : 'en_attente';

      const { error } = await supabase
        .from('cotisations')
        .update({
          montant_paye:  montantPaye,
          statut,
          date_paiement: new Date().toISOString(),
          valide_par:    validePar,
          reference:     reference ?? null,
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

// ── Générer les cotisations d'un cycle ──────────
export function useGenererCotisationsCycle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tontineId,
      cycleNumero,
      dateEcheance,
      montantCotisation,
    }: {
      tontineId:        string;
      cycleNumero:      number;
      dateEcheance:     string;
      montantCotisation: number;
    }) => {
      // Récupérer tous les membres actifs
      const { data: membres, error: me } = await supabase
        .from('membres_tontine')
        .select('id, user_id')
        .eq('tontine_id', tontineId)
        .eq('statut', 'actif');

      if (me || !membres?.length) throw new Error('Aucun membre actif trouvé.');

      // Vérifier si les cotisations du cycle existent déjà
      const { data: existing } = await supabase
        .from('cotisations')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('cycle_numero', cycleNumero)
        .limit(1);

      if (existing?.length) throw new Error(`Les cotisations du cycle ${cycleNumero} existent déjà.`);

      // Créer les cotisations pour tous les membres
      const cotisations = membres.map(m => ({
        tontine_id:    tontineId,
        membre_id:     m.id,
        user_id:       m.user_id,
        cycle_numero:  cycleNumero,
        montant_du:    montantCotisation,
        montant_paye:  0,
        penalite:      0,
        statut:        'en_attente' as const,
        date_echeance: dateEcheance,
      }));

      const { error } = await supabase.from('cotisations').insert(cotisations);
      if (error) throw error;

      // Envoyer une notification à tous les membres
      const notifs = membres.map(m => ({
        user_id: m.user_id,
        type:    'cycle_ouvert',
        titre:   `Cycle ${cycleNumero} ouvert`,
        message: `Le cycle ${cycleNumero} est ouvert. Cotisation de ${montantCotisation} FCFA due avant le ${dateEcheance}.`,
        lu:      false,
      }));

      await supabase.from('notifications').insert(notifs);
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: COTISATIONS_KEY });
      toast.success('Cotisations du cycle générées !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Appliquer pénalité automatique ──────────────
export function useAppliquerPenalites() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tontineId: string) => {
      // Récupérer la tontine pour la pénalité
      const { data: tontine, error: te } = await supabase
        .from('tontines')
        .select('penalite_retard, delai_grace_jours, montant_cotisation')
        .eq('id', tontineId)
        .single();

      if (te || !tontine || tontine.penalite_retard === 0) return;

      const dateGrace = new Date();
      dateGrace.setDate(dateGrace.getDate() - tontine.delai_grace_jours);

      // Trouver les cotisations en retard
      const { data: retards, error: re } = await supabase
        .from('cotisations')
        .select('id, montant_du')
        .eq('tontine_id', tontineId)
        .eq('statut', 'en_attente')
        .lt('date_echeance', dateGrace.toISOString().split('T')[0]);

      if (re || !retards?.length) return;

      // Appliquer pénalité et marquer en retard
      for (const cot of retards) {
        const penalite = Math.round(cot.montant_du * tontine.penalite_retard / 100);
        await supabase
          .from('cotisations')
          .update({ statut: 'en_retard', penalite })
          .eq('id', cot.id);
      }

      return retards.length;
    },
    onSuccess: (count) => {
      if (count) {
        qc.invalidateQueries({ queryKey: COTISATIONS_KEY });
        toast.success(`${count} pénalité${count > 1 ? 's' : ''} appliquée${count > 1 ? 's' : ''}.`);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Résumé financier d'une tontine ─────────────
export function useResumeCotisations(tontineId?: string) {
  return useQuery({
    queryKey: [...COTISATIONS_KEY, 'resume', tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('montant_du, montant_paye, penalite, statut')
        .eq('tontine_id', tontineId!);

      if (error) throw error;

      return {
        total_du:        data.reduce((s, c) => s + c.montant_du, 0),
        total_paye:      data.reduce((s, c) => s + c.montant_paye, 0),
        total_penalites: data.reduce((s, c) => s + c.penalite, 0),
        en_retard:       data.filter(c => c.statut === 'en_retard').length,
        en_attente:      data.filter(c => c.statut === 'en_attente').length,
        payees:          data.filter(c => c.statut === 'payee').length,
      };
    },
  });
}