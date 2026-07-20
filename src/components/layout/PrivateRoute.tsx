import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ── Spinner de chargement ───────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Chargement…</p>
    </div>
  );
}

// ── Route privée (doit être connecté) ───────────
export function PrivateRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!session) {
    // Sauvegarder la page cible pour rediriger après login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

// ── Route publique (redirige si déjà connecté) ──
export function PublicRoute() {
  const { session, loading, profile } = useAuth();

  if (loading) return <LoadingScreen />;

  if (session && profile) {
    // Priorité à une invitation en attente (lien rejoint avant inscription/connexion)
    const pendingToken = sessionStorage.getItem('invitation_token_pending');
    if (pendingToken) {
      sessionStorage.removeItem('invitation_token_pending');
      return <Navigate to={`/invitation/${pendingToken}`} replace />;
    }

    // Sinon, redirection selon le rôle
    const destination =
      profile.role_global === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}

// ── Route réservée aux admins ───────────────────
export function AdminRoute() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!profile || profile.role_global !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// ── Route réservée aux organisateurs ────────────
export function OrganisateurRoute() {
  const { profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!profile ||
    (profile.role_global !== 'organisateur' && profile.role_global !== 'admin')
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}