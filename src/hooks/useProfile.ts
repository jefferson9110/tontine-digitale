import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ── Mettre à jour le profil ─────────────────────
export function useUpdateProfile() {
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: { nom?: string; prenom?: string; telephone?: string; avatar_url?: string };
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Profil mis à jour !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Changer le mot de passe ─────────────────────
export function useChangerMotDePasse() {
  return useMutation({
    mutationFn: async (nouveauMotDePasse: string) => {
      const { error } = await supabase.auth.updateUser({
        password: nouveauMotDePasse,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('Mot de passe modifié !'),
    onError:   (err: Error) => toast.error(err.message),
  });
}

// ── Supprimer le compte ─────────────────────────
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (userId: string) => {
      // 1. Supprimer le profil (cascade via FK)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // 2. Déconnecter
      await supabase.auth.signOut();
    },
    onSuccess: () => toast.success('Compte supprimé.'),
    onError:   (err: Error) => toast.error(err.message),
  });
}

// ── Upload avatar ───────────────────────────────
export function useUploadAvatar() {
  const { profile, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!profile) throw new Error('Non connecté.');

      const ext  = file.name.split('.').pop();
      const path = `avatars/${profile.id}.${ext}`;

      // Upload dans Supabase Storage
      const { error: ue } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (ue) throw ue;

      // Récupérer l'URL publique
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);

      // Mettre à jour le profil
      const { error: pe } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);

      if (pe) throw pe;
      return data.publicUrl;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Avatar mis à jour !');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}