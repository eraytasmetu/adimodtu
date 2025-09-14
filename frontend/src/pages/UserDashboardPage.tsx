import React, { useState, useEffect, useRef } from 'react';
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
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';

// Sınıf verisi için bir tip arayüzü tanımlayalım
interface ClassData {
  _id: string;
  name: string;
}

const UserDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const classRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sayfa yüklendiğinde sesli karşılama yap
    if (user) {
      speak(`${user.name}, eğitim platformuna hoş geldin. Lütfen bir sınıf seçerek başla.`, () => {
        setIntroSpeechFinished(true);
      });
    } else {
      setIntroSpeechFinished(true);
    }

    // Backend'den sınıfları çek
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data);
        // Initialize refs array
        classRefs.current = new Array(res.data.length).fill(null);
      } catch (err) {
        setError('Sınıflar yüklenirken bir hata oluştu.');
        speak('Sınıflar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (classes.length > 0 && introSpeechFinished && !loading) {
      setFocusedIndex(2);
      classRefs.current[0]?.focus();
      speak(`${classes[0].name}`);
    }
  }, [classes, introSpeechFinished, loading]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalElements = classes.length + 2; // +2 for header and logout button
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      const nextIndex = Math.min(focusedIndex + 1, totalElements - 1);
      setFocusedIndex(nextIndex);
      
      if (nextIndex === 0) {
        logoutButtonRef.current?.focus();
        speak('Çıkış Yap butonu');
      } else if (nextIndex === 1) {
        headerRef.current?.focus();
        speak('Sınıflar başlığı');
      } else {
        const classIndex = nextIndex - 2;
        classRefs.current[classIndex]?.focus();
        speak(`${classes[classIndex].name}`);
      }
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const prevIndex = Math.max(focusedIndex - 1, 0);
      setFocusedIndex(prevIndex);
      
      if (prevIndex === 0) {
        logoutButtonRef.current?.focus();
        speak('Çıkış Yap butonu');
      } else if (prevIndex === 1) {
        headerRef.current?.focus();
        speak('Sınıflar başlığı');
      } else {
        const classIndex = prevIndex - 2;
        classRefs.current[classIndex]?.focus();
        speak(`${classes[classIndex].name}`);
      }
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex === 0) {
        handleLogout();
      } else if (focusedIndex >= 2) {
        const classIndex = focusedIndex - 2;
        handleClassClick(classes[classIndex]._id, classes[classIndex].name);
      }
    }
  };

  const handleClassClick = (classId: string, className: string) => {
    speak(`${className} seçildi. Üniteler yükleniyor.`);
    navigate(`/class/${classId}`);
  };
  
  const handleLogout = () => {
    speak("Çıkış yapılıyor.");
    logout();
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={80} />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 4, mb: 4 }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={containerRef}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          ref={headerRef}
          variant="h2" 
          component="h1"
          sx={{ 
            fontSize: '3rem',
            fontWeight: 'bold',
            mb: 3,
            color: 'primary.main'
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              speak('Sınıflar sayfası. Bu sayfada mevcut sınıfları görebilir ve seçebilirsiniz.');
            }
          }}
          onMouseEnter={() => speak('Sınıflar sayfası. Bu sayfada mevcut sınıfları görebilir ve seçebilirsiniz.')}
        >
          Sınıflar
        </Typography>
        
        {user?.role === 'admin' && (
          <Button
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/admin/dashboard')}
            sx={{ 
              fontSize: '1.5rem',
              padding: '1rem 2rem',
              minHeight: '60px',
              mr: 2,
            }}
            onMouseEnter={() => speak('Admin paneline git')}
          >
            Admin Paneli
          </Button>
        )}
        
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleLogout} 
          ref={logoutButtonRef}
          tabIndex={0}
          sx={{ 
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            minHeight: '60px',
            '&:focus': {
              outline: '3px solid #f50057',
              outlineOffset: '5px'
            }
          }}
          onMouseEnter={() => speak('Çıkış Yap butonu')}
        >
          Çıkış Yap
        </Button>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            fontSize: '1.3rem',
            padding: '1rem',
            mb: 4
          }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={6}>
        {classes.map((classItem, index) => (
          <Grid size={{xs : 12}} key={classItem._id}>
            <Card
              ref={(el) => {
                classRefs.current[index] = el;
              }}
              tabIndex={0}
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: '200px',
                fontSize: '1.3rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                margin: '1rem',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                },
                '&:focus': {
                  outline: '3px solid #4caf50',
                  outlineOffset: '5px',
                  transform: 'scale(1.02)'
                }
              }}
              onMouseEnter={() => speak(`${classItem.name}`)}
            >
              <CardActionArea
                onClick={() => handleClassClick(classItem._id, classItem.name)}
                sx={{ 
                  flexGrow: 1,
                  padding: '1.5rem'
                }}
              >
                <CardContent sx={{ padding: '1.5rem' }}>
                  <Typography 
                    gutterBottom 
                    variant="h4" 
                    component="h2"
                    sx={{ 
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  >
                    {classItem.name}
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