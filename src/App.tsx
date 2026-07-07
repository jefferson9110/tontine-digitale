import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }    from './contexts/AuthContext';
import { TontineProvider } from './contexts/TontineContext';
import { PrivateRoute, PublicRoute, AdminRoute } from './components/layout/PrivateRoute';
import { AppLayout }   from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages pub
import { LandingPage }  from './pages/public/LandingPage';
import { LoginPage }    from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { RejoindreInvitationPage } from './pages/public/RejoindreInvitationPage';

// Pages utilisateur
import { DashboardPage }     from './pages/membre/DashboardPage';
import { TontinesPage }      from './pages/organisateur/TontinesPage';
import { TontineDetailPage } from './pages/organisateur/TontineDetailPage';
import { CreerTontinePage }  from './pages/organisateur/CreerTontinePage';
import { CotisationsPage }   from './pages/membre/CotisationsPage';
import { BeneficiairesPage } from './pages/membre/BeneficiairesPage';
import { MessagesPage }      from './pages/membre/MessagesPage';
import { NotificationsPage } from './pages/membre/NotificationsPage';
import { ParametresPage }    from './pages/membre/ParametresPage';

// Pages admin
import { AdminDashboardPage }    from './pages/admin/AdminDashboardPage';
import { AdminTontinesPage }     from './pages/admin/AdminTontinesPage';
import { AdminUtilisateursPage } from './pages/admin/AdminUtilisateursPage';
import { AdminRapportsPage }     from './pages/admin/AdminRapportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   1000 * 60 * 2, // 2 minutes
      retry:       1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TontineProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Routes publiques ── */}
              <Route element={<PublicRoute />}>
                <Route path="/"         element={<LandingPage />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Route d'invitation (accessible sans auth) */}
              <Route path="/rejoindre/:token" element={<RejoindreInvitationPage />} />

              {/* ── Routes utilisateur protégées ── */}
              <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard"             element={<DashboardPage />} />
                  <Route path="/tontines"              element={<TontinesPage />} />
                  <Route path="/tontines/creer"        element={<CreerTontinePage />} />
                  <Route path="/tontines/:id"          element={<TontineDetailPage />} />
                  <Route path="/cotisations"           element={<CotisationsPage />} />
                  <Route path="/beneficiaires"         element={<BeneficiairesPage />} />
                  <Route path="/messages"              element={<MessagesPage />} />
                  <Route path="/notifications"         element={<NotificationsPage />} />
                  <Route path="/parametres"            element={<ParametresPage />} />
                </Route>
              </Route>

              {/* ── Routes admin protégées ── */}
              <Route element={<PrivateRoute />}>
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard"    element={<AdminDashboardPage />} />
                    <Route path="/admin/tontines"     element={<AdminTontinesPage />} />
                    <Route path="/admin/utilisateurs" element={<AdminUtilisateursPage />} />
                    <Route path="/admin/rapports"     element={<AdminRapportsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </TontineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
