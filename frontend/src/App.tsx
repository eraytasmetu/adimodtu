import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Sayfalar
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminClassesPage from './pages/AdminClassesPage';
import AdminUnitsPage from './pages/AdminUnitsPage';
import AdminTopicsPage from './pages/AdminTopicsPage';
import AdminTestsPage from './pages/AdminTestsPage';
import ClassUnitsPage from './pages/ClassUnitsPage';
import UserTopicsPage from './pages/UserTopicsPage';
import UserTestsPage from './pages/UserTestsPage';
import UserTestPage from './pages/UserTestPage';
import TopicDetailPage from './pages/TopicDetailPage';

// Rota Koruyucuları
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { Box, CircularProgress } from '@mui/material';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Kullanıcıyı rolüne göre doğru sayfaya yönlendiren bir bileşen
const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }
  return user?.role === 'admin' ? <Navigate to="/admin/classes" /> : <Navigate to="/dashboard" />;
};


const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AdminRoute />}>
        <Route path="/admin/classes" element={<AdminClassesPage />} />
        <Route path="/admin/units" element={<AdminUnitsPage />} />
        <Route path="/admin/topics" element={<AdminTopicsPage />} />
        <Route path="/admin/tests" element={<AdminTestsPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Route>
      
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<UserDashboardPage />} />
        <Route path="/class/:classId" element={<ClassUnitsPage />} />
        <Route path="/topics/:classId/:unitId" element={<UserTopicsPage />} />
        <Route path="/tests/:classId/:unitId" element={<UserTestsPage />} />
        <Route path="/test/:testId" element={<UserTestPage />} />
        <Route path="/topic/:classId/:unitId/:topicId" element={<TopicDetailPage />} />
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      
    </Routes>
  );
}

export default App;