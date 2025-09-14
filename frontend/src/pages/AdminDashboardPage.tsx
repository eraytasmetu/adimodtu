import React from 'react';
import { Container, Typography, Grid, Paper, Button, Box } from '@mui/material';
import { School, Book, Topic, Quiz } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h2" 
          component="h1"
          sx={{ 
            fontSize: '3rem',
            fontWeight: 'bold',
            mb: 3,
            color: 'primary.main'
          }}
        >
          Admin Paneli
        </Typography>
        
        <Button
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/dashboard')}
          sx={{ 
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            minHeight: '60px',
            mr: 2,
          }}
        >
          Kullanıcı Paneli
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ 
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            minHeight: '60px',
          }}
        >
          Çıkış Yap
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{xs: 12, md: 6}} >
          <Paper sx={{ p: 4, textAlign: 'center', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <School sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
            <Typography variant="h5" gutterBottom>Sınıflar</Typography>
            <Button variant="contained" onClick={() => navigate('/admin/classes')} sx={{ mt: 2 }}>
              Yönet
            </Button>
          </Paper>
        </Grid>
        <Grid size={{xs: 12, md: 6}} >
          <Paper sx={{ p: 4, textAlign: 'center', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Book sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
            <Typography variant="h5" gutterBottom>Üniteler</Typography>
            <Button variant="contained" onClick={() => navigate('/admin/units')} sx={{ mt: 2 }}>
              Yönet
            </Button>
          </Paper>
        </Grid>
        <Grid size={{xs: 12, md: 6}} >
          <Paper sx={{ p: 4, textAlign: 'center', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Topic sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
            <Typography variant="h5" gutterBottom>Konular</Typography>
            <Button variant="contained" onClick={() => navigate('/admin/topics')} sx={{ mt: 2 }}>
              Yönet
            </Button>
          </Paper>
        </Grid>
        <Grid size={{xs: 12, md: 6}} >
          <Paper sx={{ p: 4, textAlign: 'center', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Quiz sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
            <Typography variant="h5" gutterBottom>Testler</Typography>
            <Button variant="contained" onClick={() => navigate('/admin/tests')} sx={{ mt: 2 }}>
              Yönet
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboardPage;