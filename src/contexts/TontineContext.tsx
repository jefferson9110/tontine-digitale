import React, { createContext, useContext, useState } from 'react';
import type { Tontine, Cotisation, Notification, MembreTontine } from '../types';

interface TontineContextType {
  // Tontine courante sélectionnée
  tontineActive:    Tontine | null;
  setTontineActive: (t: Tontine | null) => void;

  // Notifications locales (enrichies via Supabase Realtime)
  notifications:    Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadCount:      number;
  markAsRead:       (id: string) => void;
  markAllRead:      () => void;

  // Sidebar collapsed (mobile)
  sidebarOpen:    boolean;
  setSidebarOpen: (v: boolean) => void;
}

const TontineContext = createContext<TontineContextType | undefined>(undefined);

export function TontineProvider({ children }: { children: React.ReactNode }) {
  const [tontineActive,    setTontineActive]    = useState<Tontine | null>(null);
  const [notifications,    setNotifications]    = useState<Notification[]>([]);
  const [sidebarOpen,      setSidebarOpen]      = useState(false);

  const unreadCount = notifications.filter(n => !n.lu).length;

  function markAsRead(id: string) {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, lu: true } : n)
    );
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  }

  return (
    <TontineContext.Provider value={{
      tontineActive, setTontineActive,
      notifications, setNotifications,
      unreadCount, markAsRead, markAllRead,
      sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </TontineContext.Provider>
  );
}

export function useTontine() {
  const ctx = useContext(TontineContext);
  if (!ctx) throw new Error('useTontine doit être utilisé dans TontineProvider');
  return ctx;
}
