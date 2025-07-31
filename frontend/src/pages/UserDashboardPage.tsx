import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';

// Sınıf verisi için bir tip arayüzü tanımlayalım
interface ClassData {
  _id: string;
  name: string;
  description?: string;
}

const UserDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Sayfa yüklendiğinde sesli karşılama yap
    if (user) {
      speak(`${user.name}, eğitim platformuna hoş geldin. Lütfen bir sınıf seçerek başla.`);
    }

    // Backend'den sınıfları çek
    const fetchClasses = async () => {
      try {
        const res = await axios.get('http://localhost:5757/api/classes');
        setClasses(res.data);
      } catch (err) {
        setError('Sınıflar yüklenirken bir hata oluştu.');
        speak('Sınıflar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  const handleClassClick = (classId: string, className: string) => {
    speak(`${className} seçildi.`);
    // İleride sınıf detay sayfasına yönlendirme yapılacak
    // navigate(`/class/${classId}`);
    alert(`${className} tıklandı! Yönlendirme ileride yapılacak.`);
  };
  
  const handleLogout = () => {
    speak("Çıkış yapılıyor.");
    logout();
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" onMouseEnter={() => speak('Sınıflar')}>
          Sınıflar
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout} onMouseEnter={() => speak('Çıkış Yap butonu')}>
          Çıkış Yap
        </Button>
      </Box>
      
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={4}>
        {classes.map((classItem) => (
          <Grid size={{ xs :12 ,  sm:6 ,md:4 }} key={classItem._id}>
            <Card
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={() => speak(`${classItem.name}. ${classItem.description || ''}`)}
            >
              <CardActionArea
                onClick={() => handleClassClick(classItem._id, classItem.name)}
                sx={{ flexGrow: 1 }}
              >
                <CardContent>
                  <Typography gutterBottom variant="h5" component="h2">
                    {classItem.name}
                  </Typography>
                  <Typography>
                    {classItem.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default UserDashboardPage;