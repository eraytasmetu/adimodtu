import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Sayfalar
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Rota Koruyucuları
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { Box, CircularProgress } from '@mui/material';

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

  return user?.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />;
};


const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Route>
      
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<UserDashboardPage />} />
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      
    </Routes>
  );
}

export default App;