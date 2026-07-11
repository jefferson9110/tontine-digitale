import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';
import toast from 'react-hot-toast';

export const NOTIFS_KEY = ['notifications'] as const;

// ── Mes notifications ───────────────────────────
export function useNotifications(userId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: [...NOTIFS_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
  });

  // ── Realtime : nouvelles notifications live ───
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invalider le cache pour recharger
          qc.invalidateQueries({ queryKey: [...NOTIFS_KEY, userId] });

          // Toast de notification live
          const notif = payload.new as Notification;
          toast(notif.titre, {
            icon: '🔔',
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  return query;
}

// ── Marquer une notif comme lue ─────────────────
export function useMarquerLu() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFS_KEY });
    },
  });
}

// ── Marquer toutes comme lues ───────────────────
export function useMarquerToutesLues() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('user_id', userId)
        .eq('lu', false);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFS_KEY });
    },
  });
}

// ── Supprimer une notification ──────────────────
export function useDeleteNotification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFS_KEY });
    },
  });
}

// ── Supprimer toutes les lues ───────────────────
export function useDeleteToutesLues() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('lu', true);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFS_KEY });
      toast.success('Notifications supprimées.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Envoyer une notification (usage interne) ────
export async function envoyerNotification({
  userId,
  type,
  titre,
  message,
  data,
}: {
  userId: string;
  type:   Notification['type'];
  titre:  string;
  message: string;
  data?:  Record<string, unknown>;
}) {
  const { error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, type, titre, message, lu: false, data }]);

  if (error) console.error('Erreur notification:', error);
}