import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export const MESSAGES_KEY = ['messages'] as const;

// ── Messages d'une tontine (avec Realtime) ──────
export function useMessages(tontineId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...MESSAGES_KEY, tontineId],
    enabled: !!tontineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles(id, nom, prenom, avatar_url)
        `)
        .eq('tontine_id', tontineId!)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as (Message & { user: { id: string; nom: string; prenom: string; avatar_url?: string } })[];
    },
    staleTime: Infinity, // géré par Realtime
  });

  // ── Canal Realtime pour les nouveaux messages ─
  useEffect(() => {
    if (!tontineId) return;

    const channel = supabase
      .channel(`messages-${tontineId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `tontine_id=eq.${tontineId}`,
        },
        async (payload) => {
          // Récupérer le profil de l'auteur
          const { data: profil } = await supabase
            .from('profiles')
            .select('id, nom, prenom, avatar_url')
            .eq('id', (payload.new as Message).user_id)
            .single();

          const nouveauMessage = { ...payload.new, user: profil } as Message & {
            user: { id: string; nom: string; prenom: string; avatar_url?: string }
          };

          // Ajouter le message au cache sans recharger
          qc.setQueryData(
            [...MESSAGES_KEY, tontineId],
            (old: any[] = []) => [...old, nouveauMessage]
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tontineId, qc]);

  return query;
}

// ── Envoyer un message ──────────────────────────
export function useEnvoyerMessage() {
  return useMutation({
    mutationFn: async ({
      tontineId,
      userId,
      contenu,
    }: { tontineId: string; userId: string; contenu: string }) => {
      if (!contenu.trim()) throw new Error('Message vide.');
      if (contenu.length > 1000) throw new Error('Message trop long (max 1000 caractères).');

      const { error } = await supabase
        .from('messages')
        .insert([{
          tontine_id: tontineId,
          user_id:    userId,
          contenu:    contenu.trim(),
        }]);

      if (error) throw error;
    },
    // Pas de toast pour les messages — l'UI gère le feedback
  });
}

// ── Conversations (liste des tontines avec dernier message) ──
export function useConversations(userId?: string) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, 'conversations', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Récupérer les tontines dont l'utilisateur est membre actif
      const { data: memberships, error: me } = await supabase
        .from('membres_tontine')
        .select('tontine_id, tontine:tontines(id, nom)')
        .eq('user_id', userId!)
        .eq('statut', 'actif');

      if (me) throw me;
      if (!memberships?.length) return [];

      const tontineIds = memberships.map(m => m.tontine_id);

      // Pour chaque tontine, récupérer le dernier message
      const conversations = await Promise.all(
        memberships.map(async (m) => {
          const { data: dernierMsg } = await supabase
            .from('messages')
            .select('contenu, created_at, user:profiles(prenom)')
            .eq('tontine_id', m.tontine_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Compter les messages non lus (simplification : depuis dernière visite)
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('tontine_id', m.tontine_id)
            .neq('user_id', userId!);

          return {
            tontine_id:           m.tontine_id,
            tontine_nom:          (m.tontine as any)?.nom ?? '',
            dernier_message:      dernierMsg?.contenu ?? 'Aucun message',
            dernier_message_date: dernierMsg?.created_at ?? '',
            non_lus:              count ?? 0,
          };
        })
      );

      return conversations.sort((a, b) =>
        b.dernier_message_date.localeCompare(a.dernier_message_date)
      );
    },
    refetchInterval: 30_000, // rafraîchir toutes les 30s
  });
}