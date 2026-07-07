import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function PrivateRoute() {
  const { session, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicRoute() {
  const { session, loading, profile } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (session) {
    const dest = profile?.role_global === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile || profile.role_global !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
