import { useState } from 'react';
import {
  RiSearchLine, RiDeleteBinLine, RiCheckLine, RiLoader4Line,
} from 'react-icons/ri';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase }  from '../../lib/supabase';
import { formatDate, cn } from '../../lib/utils';
import type { UserRole } from '../../types';
import toast from 'react-hot-toast';

function useAdminUsers() {
  return useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nom, prenom, email, role_global, telephone, is_active, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  organisateur: 'Organisateur',
  membre: 'Membre',
  tresorier: 'Trésorier',
};

export function AdminUtilisateursPage() {
  const { data: users = [], isLoading } = useAdminUsers();
  const qc = useQueryClient();

  const [search,     setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('tous');

  const filtres = users.filter(u =>
    (filterRole === 'tous' || u.role_global === filterRole) &&
    `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  async function changerRole(userId: string, role: UserRole) {
    const { error } = await supabase
      .from('profiles').update({ role_global: role }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['admin_users'] });
    toast.success('Rôle mis à jour.');
  }

  async function toggleActif(userId: string, actuel: boolean) {
    const { error } = await supabase
      .from('profiles').update({ is_active: !actuel }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['admin_users'] });
    toast.success(actuel ? 'Compte désactivé.' : 'Compte réactivé.');
  }

  const FILTRES_ROLE = [
    { key: 'tous',         label: `Tous (${users.length})` },
    { key: 'admin',        label: `Admins (${users.filter(u => u.role_global === 'admin').length})` },
    { key: 'organisateur', label: `Organisateurs (${users.filter(u => u.role_global === 'organisateur').length})` },
    { key: 'membre',       label: `Membres (${users.filter(u => u.role_global === 'membre').length})` },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <h1 className="page-title">Gestion des utilisateurs</h1>
        <p className="page-subtitle">{filtres.length} utilisateur{filtres.length > 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',         val: users.length,                                               cls: 'bg-gray-50 dark:bg-slate-800' },
          { label: 'Actifs',        val: users.filter(u => u.is_active !== false).length,            cls: 'bg-green-50 dark:bg-green-500/10' },
          { label: 'Organisateurs', val: users.filter(u => u.role_global === 'organisateur').length, cls: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Membres',       val: users.filter(u => u.role_global === 'membre').length,       cls: 'bg-primary-50 dark:bg-primary-500/10' },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`${cls} rounded-xl px-4 py-3 text-center`}>
            <p className="text-2xl font-display font-bold text-gray-900 dark:text-slate-100">{val}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="search" placeholder="Rechercher par nom ou email…" value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {/* Filtres rôle */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES_ROLE.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterRole(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              filterRole === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-600'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <RiLoader4Line className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtres.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-xs">
                            {u.prenom?.charAt(0)}{u.nom?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
                            {u.prenom} {u.nom}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.role_global}
                        onChange={e => changerRole(u.id, e.target.value as UserRole)}
                        disabled={u.role_global === 'admin'}
                        className="text-xs border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      >
                        {['membre', 'organisateur', 'tresorier', 'admin'].map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-slate-400">{u.telephone ?? '—'}</td>
                    <td>
                      <span className={cn('badge', u.is_active !== false ? 'badge-green' : 'badge-red')}>
                        {u.is_active !== false ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400 dark:text-slate-500">{formatDate(u.created_at)}</td>
                    <td>
                      {u.role_global !== 'admin' && (
                        <button
                          onClick={() => toggleActif(u.id, u.is_active !== false)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            u.is_active !== false
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10'
                          )}>
                          {u.is_active !== false
                            ? <RiDeleteBinLine className="w-4 h-4" />
                            : <RiCheckLine className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}