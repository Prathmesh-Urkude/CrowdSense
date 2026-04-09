import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import IssuesList from './pages/IssuesList';
import IssueDetail from './pages/IssueDetail';
import AdminDashboard from './pages/AdminDashboard';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-10 h-10 border-2 mx-auto mb-4" />
        <p className="text-gray-500 font-display uppercase tracking-widest text-xs">Loading...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role === 'citizen') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ─── Public Only (redirect if logged in) ─────────────────────────────────────
const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ─── App Layout ───────────────────────────────────────────────────────────────
const AppLayout: React.FC<{ children: React.ReactNode; noNav?: boolean }> = ({ children, noNav }) => (
  <>
    {!noNav && <Navbar />}
    <main>{children}</main>
  </>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<AppLayout noNav><Navbar /><LandingPage /></AppLayout>} />
    <Route path="/login" element={<PublicOnly><AppLayout noNav><LoginPage /></AppLayout></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><AppLayout noNav><RegisterPage /></AppLayout></PublicOnly>} />

    {/* Issues (public browse, protected actions) */}
    <Route path="/issues" element={<AppLayout><IssuesList /></AppLayout>} />
    <Route path="/issues/:id" element={<AppLayout><IssueDetail /></AppLayout>} />

    {/* Protected */}
    <Route path="/dashboard" element={
      <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
    } />
    <Route path="/report" element={
      <ProtectedRoute><AppLayout><ReportIssue /></AppLayout></ProtectedRoute>
    } />

    {/* Admin */}
    <Route path="/admin" element={
      <ProtectedRoute adminOnly><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>
    } />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A2235',
            color: '#F9FAFB',
            border: '1px solid #1E293B',
            fontFamily: '"Manrope", sans-serif',
            fontSize: '13px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#F97316', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
