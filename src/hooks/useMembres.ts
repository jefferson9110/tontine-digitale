import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { MembreTontine } from '../types';
import toast from 'react-hot-toast';

export const MEMBRES_KEY = ['membres'] as const;

// ── Membres d'une tontine ───────────────────────
export function useMembres(tontineId?: string) {
  return useQuery({
    queryKey: [...MEMBRES_KEY, tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres_tontine')
        .select(`
          *,
          user:profiles(id, nom, prenom, email, telephone, avatar_url)
        `)
        .eq('tontine_id', tontineId!)
        .order('date_adhesion', { ascending: true });

      if (error) throw error;
      return data as MembreTontine[];
    },
  });
}

// ── Tontines d'un utilisateur ───────────────────
export function useMesTontinesComme(userId?: string) {
  return useQuery({
    queryKey: [...MEMBRES_KEY, 'user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres_tontine')
        .select('*, tontine:tontines(*)')
        .eq('user_id', userId!)
        .order('date_adhesion', { ascending: false });

      if (error) throw error;
      return data as MembreTontine[];
    },
  });
}

// ── Inviter par email ───────────────────────────
export function useInviterMembre() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tontineId,
      email,
    }: {
      tontineId: string;
      email:     string;
    }) => {
      // Appel unique → SQL gère tout
      const { data, error } = await supabase
        .rpc('envoyer_invitation', {
          p_tontine_id: tontineId,
          p_email:      email.trim().toLowerCase(),
        });

      if (error) throw new Error(error.message);

      if (data && !data.success) {
        // Messages d'erreur contextuels selon le code
        const msgs: Record<string, string> = {
          USER_NOT_FOUND:    `Aucun compte trouvé avec l'adresse "${email}". L'utilisateur doit d'abord s'inscrire sur TontineDigitale.`,
          ALREADY_MEMBER:    'Cet utilisateur est déjà membre actif de cette tontine.',
          ALREADY_INVITED:   'Une invitation est déjà en attente pour cet utilisateur.',
        };
        throw new Error(msgs[data.code] ?? data.message ?? 'Erreur lors de l\'invitation.');
      }

      return data;
    },

    onSuccess: (data, { tontineId }) => {
      qc.invalidateQueries({ queryKey: ['membres_complet', tontineId] });
      qc.invalidateQueries({ queryKey: ['membres_simple', tontineId] });
      toast.success(
        data?.message ?? 'Invitation envoyée !',
        { duration: 4000, icon: '📩' }
      );
    },

    onError: (err: Error) => {
      toast.error(err.message, { duration: 5000 });
    },
  });
}

// ── Rejoindre via lien ──────────────────────────
export function useRejoindreViaLien() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tontineId,
      userId,
    }: { tontineId: string; userId: string }) => {
      // Vérifier si déjà membre
      const { data: existing } = await supabase
        .from('membres_tontine')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) throw new Error('Vous êtes déjà membre de cette tontine.');

      const { error } = await supabase
        .from('membres_tontine')
        .insert([{
          tontine_id: tontineId,
          user_id:    userId,
          role:       'membre',
          statut:     'en_attente',
        }]);

      if (error) throw error;
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: [...MEMBRES_KEY, tontineId] });
      toast.success('Demande envoyée ! En attente de validation.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Valider/Refuser une demande d'adhésion ──────
export function useValiderAdhesion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membreId,
      accepter,
    }: { membreId: string; tontineId: string; accepter: boolean }) => {
      const { error } = await supabase
        .from('membres_tontine')
        .update({ statut: accepter ? 'actif' : 'exclu' })
        .eq('id', membreId);

      if (error) throw error;
    },
    onSuccess: (_, { tontineId, accepter }) => {
      qc.invalidateQueries({ queryKey: [...MEMBRES_KEY, tontineId] });
      toast.success(accepter ? 'Membre accepté !' : 'Demande refusée.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Changer le statut d'un membre ──────────────
export function useChangerStatutMembre() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membreId,
      statut,
    }: { membreId: string; tontineId: string; statut: MembreTontine['statut'] }) => {
      const { error } = await supabase
        .from('membres_tontine')
        .update({ statut })
        .eq('id', membreId);

      if (error) throw error;
    },
    onSuccess: (_, { tontineId, statut }) => {
      qc.invalidateQueries({ queryKey: [...MEMBRES_KEY, tontineId] });
      const msg = statut === 'suspendu' ? 'Membre suspendu.' :
                  statut === 'exclu'    ? 'Membre exclu.'    :
                  statut === 'actif'    ? 'Membre réactivé.' : 'Statut mis à jour.';
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Changer le rôle d'un membre ─────────────────
export function useChangerRoleMembre() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membreId,
      role,
    }: { membreId: string; tontineId: string; role: MembreTontine['role'] }) => {
      const { error } = await supabase
        .from('membres_tontine')
        .update({ role })
        .eq('id', membreId);

      if (error) throw error;
    },
    onSuccess: (_, { tontineId }) => {
      qc.invalidateQueries({ queryKey: [...MEMBRES_KEY, tontineId] });
      toast.success('Rôle mis à jour.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Score TontineScore d'un membre ──────────────
export function useTontineScore(userId?: string) {
  return useQuery({
    queryKey: ['tontine_score', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('statut, montant_du, montant_paye, penalite')
        .eq('user_id', userId!);

      if (error) throw error;
      if (!data || data.length === 0) return 50; // score neutre par défaut

      const total     = data.length;
      const payees    = data.filter(c => c.statut === 'payee').length;
      const retards   = data.filter(c => c.statut === 'en_retard').length;
      const penalites = data.reduce((s, c) => s + c.penalite, 0);
      const totalDu   = data.reduce((s, c) => s + c.montant_du, 0);

      // Algorithme TontineScore (0-100)
      const tauxPaiement  = total > 0 ? (payees / total) * 60 : 0;
      const malusRetard   = Math.min(retards * 5, 20);
      const malusPenalite = totalDu > 0 ? Math.min((penalites / totalDu) * 100 * 0.2, 20) : 0;
      const bonusCycles   = Math.min(total * 2, 20);

      return Math.round(
        Math.max(0, Math.min(100, tauxPaiement + bonusCycles - malusRetard - malusPenalite))
      );
    },
  });
}