import { useState } from 'react';
import {
  RiSearchLine, RiUserLine, RiShieldLine, RiDeleteBinLine,
  RiCheckLine, RiCloseLine, RiDownloadLine, RiInboxLine,
  RiStarLine, RiGroupLine, RiFilterLine,
} from 'react-icons/ri';
import { formatDate, getStatutColor, cn } from '../../lib/utils';
import type { User, UserRole } from '../../types';
import toast from 'react-hot-toast';

// ── Mock data ─────────────────────────────────────
const MOCK_USERS: (User & { tontines_count: number; score: number })[] = [
  { id: 'u1', email: 'marcelline@exemple.cm',  nom: 'Tsague',  prenom: 'Marcelline', telephone: '+237 677 001 001', role_global: 'organisateur', is_active: true,  created_at: '2025-12-20', updated_at: '2026-07-01', tontines_count: 2, score: 98 },
  { id: 'u2', email: 'patrick@exemple.fr',     nom: 'Nkoa',    prenom: 'Patrick',    telephone: '+33 6 12 34 56',  role_global: 'membre',       is_active: true,  created_at: '2025-12-20', updated_at: '2026-07-01', tontines_count: 3, score: 92 },
  { id: 'u3', email: 'solange@exemple.cm',     nom: 'Kamga',   prenom: 'Solange',    telephone: '+237 690 002 002', role_global: 'membre',       is_active: false, created_at: '2026-01-05', updated_at: '2026-07-03', tontines_count: 2, score: 74 },
  { id: 'u4', email: 'jpaul@exemple.cm',       nom: 'Mballa',  prenom: 'Jean-Paul',  telephone: '+237 655 003 003', role_global: 'tresorier',    is_active: true,  created_at: '2026-01-05', updated_at: '2026-07-01', tontines_count: 1, score: 88 },
  { id: 'u5', email: 'armand@exemple.cm',      nom: 'Biya',    prenom: 'Armand',     telephone: '+237 699 004 004', role_global: 'membre',       is_active: false, created_at: '2026-01-10', updated_at: '2026-07-05', tontines_count: 1, score: 41 },
  { id: 'u6', email: 'cecile@exemple.cm',      nom: 'Atanga',  prenom: 'Cécile',     telephone: '+237 677 005 005', role_global: 'organisateur', is_active: true,  created_at: '2026-02-01', updated_at: '2026-07-01', tontines_count: 1, score: 95 },
  { id: 'u7', email: 'admin@tontinedigitale.cm', nom: 'Admin', prenom: 'Super',      telephone: '',                role_global: 'admin',        is_active: true,  created_at: '2025-01-01', updated_at: '2026-07-01', tontines_count: 0, score: 100 },
];

type FilterRole = 'tous' | UserRole;
type FilterStatut = 'tous' | 'actif' | 'inactif';

const ROLE_LABELS: Record<UserRole, string> = {
  admin:        'Admin',
  organisateur: 'Organisateur',
  membre:       'Membre',
  tresorier:    'Trésorier',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin:        'badge-red',
  organisateur: 'badge-blue',
  membre:       'badge-gray',
  tresorier:    'badge-purple',
};

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`badge ${cls} font-mono text-xs`}><RiStarLine className="w-3 h-3" />{score}</span>;
}

// ── Modal détail utilisateur ──────────────────────
function ModalUser({ user, onClose, onToggle, onChangeRole }: {
  user: typeof MOCK_USERS[0];
  onClose: () => void;
  onToggle: () => void;
  onChangeRole: (role: UserRole) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-primary-700 font-bold text-lg">
                {user.prenom.charAt(0)}{user.nom.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-display font-bold text-gray-900">{user.prenom} {user.nom}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Infos */}
          <dl className="space-y-2">
            {[
              { label: 'Téléphone', val: user.telephone || '—' },
              { label: 'Inscrit le', val: formatDate(user.created_at) },
              { label: 'Tontines', val: `${user.tontines_count} tontine${user.tontines_count > 1 ? 's' : ''}` },
              { label: 'TontineScore', val: `${user.score}/100` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <dt className="text-sm text-gray-400">{label}</dt>
                <dd className="text-sm font-semibold text-gray-700">{val}</dd>
              </div>
            ))}
          </dl>

          {/* Changer le rôle */}
          {user.role_global !== 'admin' && (
            <div>
              <label className="label">Rôle sur la plateforme</label>
              <select
                value={user.role_global}
                onChange={e => onChangeRole(e.target.value as UserRole)}
                className="input"
              >
                <option value="membre">Membre</option>
                <option value="organisateur">Organisateur</option>
                <option value="tresorier">Trésorier</option>
              </select>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Fermer</button>
          {user.role_global !== 'admin' && (
            <button
              onClick={onToggle}
              className={`flex-1 btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
            >
              {user.is_active ? (
                <><RiCloseLine className="w-4 h-4" /> Désactiver</>
              ) : (
                <><RiCheckLine className="w-4 h-4" /> Réactiver</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────
export function AdminUtilisateursPage() {
  const [users,        setUsers]        = useState(MOCK_USERS);
  const [search,       setSearch]       = useState('');
  const [filterRole,   setFilterRole]   = useState<FilterRole>('tous');
  const [filterStatut, setFilterStatut] = useState<FilterStatut>('tous');
  const [selected,     setSelected]     = useState<typeof MOCK_USERS[0] | null>(null);

  const usersFiltres = users.filter(u => {
    const matchSearch =
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole   === 'tous' || u.role_global === filterRole;
    const matchStatut = filterStatut === 'tous' ||
      (filterStatut === 'actif' ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatut;
  });

  function toggleUser(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    const u = users.find(u => u.id === id);
    toast.success(u?.is_active ? 'Utilisateur désactivé.' : 'Utilisateur réactivé.');
    setSelected(null);
  }

  function changeRole(id: string, role: UserRole) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role_global: role } : u));
    toast.success('Rôle mis à jour.');
  }

  function exportCSV() {
    const headers = ['Prénom', 'Nom', 'Email', 'Rôle', 'Statut', 'Score', 'Tontines', 'Inscrit le'];
    const rows = usersFiltres.map(u => [
      u.prenom, u.nom, u.email, u.role_global,
      u.is_active ? 'Actif' : 'Inactif', u.score, u.tontines_count, u.created_at,
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const FILTRES_ROLE: { key: FilterRole; label: string }[] = [
    { key: 'tous',        label: `Tous (${users.length})` },
    { key: 'admin',       label: 'Admins' },
    { key: 'organisateur',label: 'Organisateurs' },
    { key: 'tresorier',   label: 'Trésoriers' },
    { key: 'membre',      label: 'Membres' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="page-header !mb-0">
          <h1 className="page-title">Gestion des utilisateurs</h1>
          <p className="page-subtitle">{usersFiltres.length} utilisateur{usersFiltres.length > 1 ? 's' : ''} affiché{usersFiltres.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV} className="btn-outline flex-shrink-0">
          <RiDownloadLine className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',       val: users.length,                            cls: 'bg-gray-50' },
          { label: 'Actifs',      val: users.filter(u => u.is_active).length,   cls: 'bg-green-50' },
          { label: 'Inactifs',    val: users.filter(u => !u.is_active).length,  cls: 'bg-red-50' },
          { label: 'Organisateurs', val: users.filter(u => u.role_global === 'organisateur').length, cls: 'bg-blue-50' },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`${cls} rounded-xl px-4 py-3 text-center`}>
            <p className="text-2xl font-display font-bold text-gray-900">{val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recherche + filtre statut */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="search" placeholder="Rechercher par nom ou email…"
            value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as FilterStatut)} className="input sm:w-40">
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Filtres rôle */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTRES_ROLE.map(({ key, label }) => (
          <button key={key} onClick={() => setFilterRole(key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border',
              filterRole === key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300 hover:text-primary-600'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {usersFiltres.length === 0 ? (
        <div className="empty-state card">
          <RiInboxLine className="empty-state-icon" />
          <p className="font-semibold text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Score</th>
                  <th>Tontines</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersFiltres.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-700 font-bold text-xs">
                            {u.prenom.charAt(0)}{u.nom.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{u.prenom} {u.nom}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_COLORS[u.role_global]}`}>
                        {ROLE_LABELS[u.role_global]}
                      </span>
                    </td>
                    <td><ScoreBadge score={u.score} /></td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <RiGroupLine className="w-3.5 h-3.5 text-gray-400" />
                        {u.tontines_count}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400">{formatDate(u.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button title="Voir le profil"
                          onClick={() => setSelected(u)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                          <RiUserLine className="w-4 h-4" />
                        </button>
                        {u.role_global !== 'admin' && (
                          <button
                            title={u.is_active ? 'Désactiver' : 'Réactiver'}
                            onClick={() => toggleUser(u.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.is_active
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}>
                            {u.is_active
                              ? <RiCloseLine className="w-4 h-4" />
                              : <RiCheckLine className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <ModalUser
          user={selected}
          onClose={() => setSelected(null)}
          onToggle={() => { toggleUser(selected.id); setSelected(null); }}
          onChangeRole={(role) => { changeRole(selected.id, role); setSelected({ ...selected, role_global: role }); }}
        />
      )}
    </div>
  );
}