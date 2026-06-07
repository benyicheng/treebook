import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './layouts/MainLayout';
import { LazyPage, AppErrorBoundary } from './components/ui';
import { PermissionGate } from './components/auth';
import { AnalyticsTracker } from './components/analytics';
import { ToastProvider } from './components/notifications';
import NotFound from './pages/NotFound';
import { useAuthStore } from './stores/useAuthStore';

// ── 懒加载页面：按路由拆分独立 chunk ──
const Home = React.lazy(() => import('./pages/Home'));
const MainlinePage = React.lazy(() => import('./pages/mainline/MainlinePage'));
const CreateStoryPage = React.lazy(() => import('./pages/mainline/CreateStoryPage'));
const BranchPage = React.lazy(() => import('./pages/branch/BranchPage'));
const BranchesPage = React.lazy(() => import('./pages/branch/BranchesPage'));
const SpinoffPage = React.lazy(() => import('./pages/spinoff/SpinoffPage'));
const SpinoffDetailPage = React.lazy(() => import('./pages/spinoff/SpinoffDetailPage'));
const SpinoffEditorPage = React.lazy(() => import('./pages/spinoff/SpinoffEditorPage'));
const BooklistPage = React.lazy(() => import('./pages/booklist/BooklistPage'));
const BooklistDetailPage = React.lazy(() => import('./pages/booklist/BooklistDetailPage'));
const ReadPage = React.lazy(() => import('./pages/read/ReadPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SetupPage = React.lazy(() => import('./pages/SetupPage'));
const AboutPage = React.lazy(() => import('./pages/about/AboutPage'));
const RevenuePage = React.lazy(() => import('./pages/RevenuePage'));
const UniverseDiscoverPage = React.lazy(() => import('./pages/discover/UniverseDiscoverPage'));
const ContactPage = React.lazy(() => import('./pages/about/ContactPage'));
const JoinPage = React.lazy(() => import('./pages/about/JoinPage'));
const AuthorGuidePage = React.lazy(() => import('./pages/about/AuthorGuidePage'));
const AuthorBenefitsPage = React.lazy(() => import('./pages/about/AuthorBenefitsPage'));
const CopyrightPage = React.lazy(() => import('./pages/about/CopyrightPage'));
const HelpPage = React.lazy(() => import('./pages/about/HelpPage'));
const FeedbackPage = React.lazy(() => import('./pages/about/FeedbackPage'));
const ReportPage = React.lazy(() => import('./pages/about/ReportPage'));
const RecommendationsPage = React.lazy(() => import('./pages/mainline/RecommendationsPage'));
const NewStoriesPage = React.lazy(() => import('./pages/mainline/NewStoriesPage'));
const AllStoriesPage = React.lazy(() => import('./pages/mainline/AllStoriesPage'));
const ReadingPathDetailPage = React.lazy(() => import('./pages/reading-path/ReadingPathDetailPage'));
const ReadingPathCreatePage = React.lazy(() => import('./pages/reading-path/ReadingPathCreatePage'));
const ReadingPathEditPage = React.lazy(() => import('./pages/reading-path/ReadingPathEditPage'));
const ReadingTrailPage = React.lazy(() => import('./pages/reading-path/ReadingTrailPage'));
const ReadingPathsListPage = React.lazy(() => import('./pages/reading-path/ReadingPathsListPage'));
const RoleManagement = React.lazy(() => import('./pages/admin/RoleManagement'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const CMSPage = React.lazy(() => import('./pages/admin/CMSPage'));
const ModerationDashboard = React.lazy(() => import('./pages/admin/ModerationDashboard'));
const ReviewCasesPage = React.lazy(() => import('./pages/admin/ReviewCasesPage'));
const EditorialChangesPage = React.lazy(() => import('./pages/admin/EditorialChangesPage'));
const SearchResultsPage = React.lazy(() => import('./pages/search/SearchResultsPage'));
const FollowPage = React.lazy(() => import('./pages/follow/FollowPage'));
const WikiListPage = React.lazy(() => import('./pages/wiki/WikiListPage'));
const WikiDetailPage = React.lazy(() => import('./pages/wiki/WikiDetailPage'));
const WikiEditorPage = React.lazy(() => import('./pages/wiki/WikiEditorPage'));

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
      <ToastProvider>
      <AppErrorBoundary>
        <Router>
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LazyPage component={Home} />} />
              <Route path="story/create" element={<AppErrorBoundary><LazyPage component={CreateStoryPage} /></AppErrorBoundary>} />
              <Route path="story/:id" element={<AppErrorBoundary><LazyPage component={MainlinePage} /></AppErrorBoundary>} />
              <Route path="stories" element={<AppErrorBoundary><LazyPage component={AllStoriesPage} /></AppErrorBoundary>} />
              <Route path="recommendations" element={<AppErrorBoundary><LazyPage component={RecommendationsPage} /></AppErrorBoundary>} />
              <Route path="new" element={<AppErrorBoundary><LazyPage component={NewStoriesPage} /></AppErrorBoundary>} />
              <Route path="branch/:id" element={<AppErrorBoundary><LazyPage component={BranchPage} /></AppErrorBoundary>} />
              <Route path="branches" element={<AppErrorBoundary><LazyPage component={BranchesPage} /></AppErrorBoundary>} />
              <Route path="read/:id" element={<AppErrorBoundary><LazyPage component={ReadPage} /></AppErrorBoundary>} />
              <Route path="spinoff" element={<AppErrorBoundary><LazyPage component={SpinoffPage} /></AppErrorBoundary>} />
              <Route path="spinoff/:id" element={<AppErrorBoundary><LazyPage component={SpinoffDetailPage} /></AppErrorBoundary>} />
              <Route path="spinoff/create" element={<AppErrorBoundary><LazyPage component={SpinoffEditorPage} /></AppErrorBoundary>} />
              <Route path="spinoff/edit/:id" element={<AppErrorBoundary><LazyPage component={SpinoffEditorPage} /></AppErrorBoundary>} />
              <Route path="discover" element={<AppErrorBoundary><LazyPage component={UniverseDiscoverPage} /></AppErrorBoundary>} />
              <Route path="search" element={<AppErrorBoundary><LazyPage component={SearchResultsPage} /></AppErrorBoundary>} />
              <Route path="booklist" element={<AppErrorBoundary><LazyPage component={BooklistPage} /></AppErrorBoundary>} />
              <Route path="booklist/:id" element={<AppErrorBoundary><LazyPage component={BooklistDetailPage} /></AppErrorBoundary>} />
              <Route path="dashboard" element={<AppErrorBoundary><LazyPage component={DashboardPage} /></AppErrorBoundary>} />
              <Route path="dashboard/create" element={<AppErrorBoundary><LazyPage component={CreateStoryPage} /></AppErrorBoundary>} />
              <Route path="profile" element={<AppErrorBoundary><LazyPage component={ProfilePage} /></AppErrorBoundary>} />
              <Route path="profile/:userId" element={<AppErrorBoundary><LazyPage component={ProfilePage} /></AppErrorBoundary>} />
              <Route path="user/:userId" element={<AppErrorBoundary><LazyPage component={ProfilePage} /></AppErrorBoundary>} />
              <Route path="follow" element={<AppErrorBoundary><LazyPage component={FollowPage} /></AppErrorBoundary>} />
              <Route path="reading-paths" element={<AppErrorBoundary><LazyPage component={ReadingPathsListPage} /></AppErrorBoundary>} />
              <Route path="reading-path/create" element={<AppErrorBoundary><LazyPage component={ReadingPathCreatePage} /></AppErrorBoundary>} />
              <Route path="reading-path/edit/:id" element={<AppErrorBoundary><LazyPage component={ReadingPathEditPage} /></AppErrorBoundary>} />
              <Route path="reading-path/trail/:trailId" element={<AppErrorBoundary><LazyPage component={ReadingTrailPage} /></AppErrorBoundary>} />
              <Route path="reading-path/:id" element={<AppErrorBoundary><LazyPage component={ReadingPathDetailPage} /></AppErrorBoundary>} />
              <Route path="revenue" element={<AppErrorBoundary><LazyPage component={RevenuePage} /></AppErrorBoundary>} />

              <Route path="wiki" element={<AppErrorBoundary><LazyPage component={WikiListPage} /></AppErrorBoundary>} />
              <Route path="wiki/new" element={<AppErrorBoundary><LazyPage component={WikiEditorPage} /></AppErrorBoundary>} />
              <Route path="wiki/:id" element={<AppErrorBoundary><LazyPage component={WikiDetailPage} /></AppErrorBoundary>} />
              <Route path="wiki/:id/edit" element={<AppErrorBoundary><LazyPage component={WikiEditorPage} /></AppErrorBoundary>} />

              <Route path="about" element={<LazyPage component={AboutPage} />} />
              <Route path="contact" element={<LazyPage component={ContactPage} />} />
              <Route path="join" element={<LazyPage component={JoinPage} />} />
              <Route path="author/guide" element={<LazyPage component={AuthorGuidePage} />} />
              <Route path="author/benefits" element={<LazyPage component={AuthorBenefitsPage} />} />
              <Route path="author/copyright" element={<LazyPage component={CopyrightPage} />} />
              <Route path="help" element={<LazyPage component={HelpPage} />} />
              <Route path="feedback" element={<LazyPage component={FeedbackPage} />} />
              <Route path="report" element={<LazyPage component={ReportPage} />} />

              <Route path="admin/roles" element={
                <AppErrorBoundary>
                  <PermissionGate permission="role:read" fallback={<Navigate to="/" replace />}>
                    <LazyPage component={RoleManagement} />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/users" element={
                <AppErrorBoundary>
                  <PermissionGate permission="user:role:assign" fallback={<Navigate to="/" replace />}>
                    <LazyPage component={UserManagement} />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/cms" element={
                <AppErrorBoundary>
                  <PermissionGate permission="cms:manage" fallback={<Navigate to="/" replace />}>
                    <LazyPage component={CMSPage} />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/moderation" element={
                <AppErrorBoundary>
                  <PermissionGate permission="moderation:view" fallback={<Navigate to="/" replace />}>
                    <LazyPage component={ModerationDashboard} />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/review-cases" element={
                <AppErrorBoundary>
                  <PermissionGate permission="review:case:view" fallback={<Navigate to="/" replace />}>
                    <LazyPage component={ReviewCasesPage} />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="admin/editorial" element={
                <AppErrorBoundary>
                  <PermissionGate permission="editorial:view" fallback={<Navigate to="/" replace />}>
                    <LazyPage component={EditorialChangesPage} />
                  </PermissionGate>
                </AppErrorBoundary>
              } />

              <Route path="login" element={<LazyPage component={LoginPage} />} />
              <Route path="register" element={<LazyPage component={RegisterPage} />} />
              <Route path="setup" element={<LazyPage component={SetupPage} />} />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AppErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
