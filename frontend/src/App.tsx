import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

declare module 'dayjs' {
  interface Dayjs {}
}

// Import pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ToursPage from './features/tours/ToursPage';
import LeadsPage from './features/leads/LeadsPage';
import TranscriptsPage from './features/transcripts/TranscriptsPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import SettingsPage from './features/settings/SettingsPage';
import { MainLayout } from './layouts/MainLayout';

// Set dayjs locale
dayjs.locale('es');

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Auth wrapper component
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Public route wrapper
const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

// App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary: '#2563EB',
            borderRadius: 8,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Button: {
              primaryColor: '#fff',
            },
          },
        }}
      >
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/tours" element={<ToursPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/transcripts" element={<TranscriptsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* 404 route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;