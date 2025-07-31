import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';

const AdminDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    speak("Çıkış yapılıyor.");
    logout();
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
       <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Admin Paneli
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </Box>
      <Typography variant="h6">
        Hoş geldin, {user?.name}! Buradan sınıfları, üniteleri ve diğer içerikleri yönetebilirsin.
      </Typography>
      {/* Buraya ileride admin'e özel bileşenler gelecek */}
    </Container>
  );
};

export default AdminDashboardPage;