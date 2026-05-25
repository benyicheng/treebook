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
import BranchesPage from './pages/branch/BranchesPage';
import RecommendationsPage from './pages/mainline/RecommendationsPage';
import NewStoriesPage from './pages/mainline/NewStoriesPage';
import AllStoriesPage from './pages/mainline/AllStoriesPage';
import ReadPage from './pages/read/ReadPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SetupPage from './pages/SetupPage';
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
import ModerationDashboard from './pages/admin/ModerationDashboard';
import ReviewCasesPage from './pages/admin/ReviewCasesPage';
import EditorialChangesPage from './pages/admin/EditorialChangesPage';
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
              <Route path="story/create" element={<AppErrorBoundary><CreateStoryPage /></AppErrorBoundary>} />
              <Route path="story/:id" element={<AppErrorBoundary><MainlinePage /></AppErrorBoundary>} />
              <Route path="stories" element={<AppErrorBoundary><AllStoriesPage /></AppErrorBoundary>} />
              <Route path="recommendations" element={<AppErrorBoundary><RecommendationsPage /></AppErrorBoundary>} />
              <Route path="new" element={<AppErrorBoundary><NewStoriesPage /></AppErrorBoundary>} />
              <Route path="branch/:id" element={<AppErrorBoundary><BranchPage /></AppErrorBoundary>} />
              <Route path="branches" element={<AppErrorBoundary><BranchesPage /></AppErrorBoundary>} />
              <Route path="read/:id" element={<AppErrorBoundary><ReadPage /></AppErrorBoundary>} />
              <Route path="spinoff" element={<AppErrorBoundary><SpinoffPage /></AppErrorBoundary>} />
              <Route path="spinoff/:id" element={<AppErrorBoundary><SpinoffDetailPage /></AppErrorBoundary>} />
              <Route path="spinoff/create" element={<AppErrorBoundary><SpinoffEditorPage /></AppErrorBoundary>} />
              <Route path="spinoff/edit/:id" element={<AppErrorBoundary><SpinoffEditorPage /></AppErrorBoundary>} />
              <Route path="booklist" element={<AppErrorBoundary><BooklistPage /></AppErrorBoundary>} />
              <Route path="booklist/:id" element={<AppErrorBoundary><BooklistDetailPage /></AppErrorBoundary>} />
              <Route path="dashboard" element={<AppErrorBoundary><DashboardPage /></AppErrorBoundary>} />
              <Route path="dashboard/create" element={<AppErrorBoundary><CreateStoryPage /></AppErrorBoundary>} />
              <Route path="profile" element={<AppErrorBoundary><ProfilePage /></AppErrorBoundary>} />
              <Route path="revenue" element={<AppErrorBoundary><RevenuePage /></AppErrorBoundary>} />
              
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
                <AppErrorBoundary>
                  <PermissionGate permission="role:read" fallback={<Navigate to="/" replace />}>
                    <RoleManagement />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/cms" element={
                <AppErrorBoundary>
                  <PermissionGate permission="cms:manage" fallback={<Navigate to="/" replace />}>
                    <CMSPage />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/moderation" element={
                <AppErrorBoundary>
                  <PermissionGate permission="moderation:view" fallback={<Navigate to="/" replace />}>
                    <ModerationDashboard />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/review-cases" element={
                <AppErrorBoundary>
                  <PermissionGate permission="review:case:view" fallback={<Navigate to="/" replace />}>
                    <ReviewCasesPage />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/editorial" element={
                <AppErrorBoundary>
                  <PermissionGate permission="editorial:view" fallback={<Navigate to="/" replace />}>
                    <EditorialChangesPage />
                  </PermissionGate>
                </AppErrorBoundary>
              } />
              
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="setup" element={<SetupPage />} />
            </Route>
          </Routes>
        </Router>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
