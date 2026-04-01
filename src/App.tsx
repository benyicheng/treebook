import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import MainlinePage from './pages/mainline/MainlinePage';
import CreateStoryPage from './pages/mainline/CreateStoryPage';
import BranchPage from './pages/branch/BranchPage';
import SpinoffPage from './pages/spinoff/SpinoffPage';
import SpinoffDetailPage from './pages/spinoff/SpinoffDetailPage';
import SpinoffEditorPage from './pages/spinoff/SpinoffEditorPage';
import BooklistPage from './pages/booklist/BooklistPage';
import BooklistDetailPage from './pages/booklist/BooklistDetailPage';
import ReadPage from './pages/read/ReadPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/about/AboutPage';
import RevenuePage from './pages/RevenuePage';
import ContactPage from './pages/about/ContactPage';
import JoinPage from './pages/about/JoinPage';
import AuthorGuidePage from './pages/about/AuthorGuidePage';
import AuthorBenefitsPage from './pages/about/AuthorBenefitsPage';
import CopyrightPage from './pages/about/CopyrightPage';
import HelpPage from './pages/about/HelpPage';
import FeedbackPage from './pages/about/FeedbackPage';
import ReportPage from './pages/about/ReportPage';
import RoleManagement from './pages/admin/RoleManagement';
import CMSPage from './pages/admin/CMSPage';
import { useAuthStore } from './stores/useAuthStore';
import PermissionGate from './components/PermissionGate';
import AppErrorBoundary from './components/AppErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="story/create" element={<CreateStoryPage />} />
              <Route path="story/:id" element={<MainlinePage />} />
              <Route path="branch/:id" element={<BranchPage />} />
              <Route path="read/:id" element={<ReadPage />} />
              <Route path="spinoff" element={<SpinoffPage />} />
              <Route path="spinoff/:id" element={<SpinoffDetailPage />} />
              <Route path="spinoff/create" element={<SpinoffEditorPage />} />
              <Route path="spinoff/edit/:id" element={<SpinoffEditorPage />} />
              <Route path="booklist" element={<BooklistPage />} />
              <Route path="booklist/:id" element={<BooklistDetailPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="revenue" element={<RevenuePage />} />
              
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="join" element={<JoinPage />} />
              <Route path="author/guide" element={<AuthorGuidePage />} />
              <Route path="author/benefits" element={<AuthorBenefitsPage />} />
              <Route path="author/copyright" element={<CopyrightPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="report" element={<ReportPage />} />
              
              <Route path="admin/roles" element={
                <PermissionGate permission="role:read" fallback={<Navigate to="/" replace />}>
                  <RoleManagement />
                </PermissionGate>
              } />

              <Route path="admin/cms" element={
                <PermissionGate permission="role:read" fallback={<Navigate to="/" replace />}>
                  <CMSPage />
                </PermissionGate>
              } />
              
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
            </Route>
          </Routes>
        </Router>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
