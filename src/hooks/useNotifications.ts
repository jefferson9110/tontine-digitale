import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export const NOTIFS_KEY = ['notifications'] as const;

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

  // Realtime : écouter les nouvelles notifications
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifs-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: [...NOTIFS_KEY, userId] })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  return query;
}

export function useMarquerLu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ lu: true }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFS_KEY }),
  });
}
