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
// speak kaldırıldı: bu sayfada sabit ses dosyaları kullanılacak
import audioManager from '../utils/audioManager';

// Sınıf verisi için bir tip arayüzü tanımlayalım
interface ClassData {
  _id: string;
  name: string;
}

const UserDashboardPage: React.FC = () => {
  const { user, progress, logout } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);

  // Sınıf sesleri için yardımcı fonksiyon

  const getClassAudioPath = (className: string): string | null => {
    // Örn: "5. Sınıf" → "/sounds/5sinif.mp3"
    if (!className) return null;
    const normalized = className.replace(/\s+/g, '').toLowerCase();
    if (normalized.includes('5.sınıf') || normalized.includes('5.sinif') || normalized.includes('5sinif')) {
      return '/sounds/5sinif.mp3';
    }
    if (normalized.includes('6.sınıf') || normalized.includes('6.sinif') || normalized.includes('6sinif')) {
      return '/sounds/6sinif.mp3';
    }
    if (normalized.includes('7.sınıf') || normalized.includes('7.sinif') || normalized.includes('7sinif')) {
      return '/sounds/7sinif.mp3';
    }
    if (normalized.includes('8.sınıf') || normalized.includes('8.sinif') || normalized.includes('8sinif')) {
      return '/sounds/8sinif.mp3';
    }
    return null;
  };

  const playClassAudio = (className: string) => {
    const src = getClassAudioPath(className);
    if (!src) return;
    audioManager.play(src).catch(() => {});
  };

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const classRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sayfa yüklendiğinde statik karşılama sesini çal
    if (user) {
      audioManager.play('/sounds/intro.mp3', () => setIntroSpeechFinished(true));
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
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();

    return () => {
      audioManager.stop();
    };
  }, [user]);

  useEffect(() => {
    if (classes.length > 0 && introSpeechFinished && !loading) {
      setFocusedIndex(2);
      classRefs.current[0]?.focus();
      playClassAudio(classes[0].name);
    }
  }, [classes, introSpeechFinished, loading]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalElements = classes.length + 2; // +2 for header and logout button
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      let nextIndex = Math.min(focusedIndex + 1, totalElements - 1);
      // Header'ı atla
      if (nextIndex === 1) nextIndex = Math.min(2, totalElements - 1);
      setFocusedIndex(nextIndex);
      
      if (nextIndex === 0) {
        logoutButtonRef.current?.focus();
      } else if (nextIndex === 1) {
        headerRef.current?.focus();
      } else {
        const classIndex = nextIndex - 2;
        classRefs.current[classIndex]?.focus();
        playClassAudio(classes[classIndex].name);
      }
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      let prevIndex = Math.max(focusedIndex - 1, 0);
      // Header'ı atla
      if (prevIndex === 1) prevIndex = 0;
      setFocusedIndex(prevIndex);
      
      if (prevIndex === 0) {
        logoutButtonRef.current?.focus();
      } else if (prevIndex === 1) {
        headerRef.current?.focus();
      } else {
        const classIndex = prevIndex - 2;
        classRefs.current[classIndex]?.focus();
        playClassAudio(classes[classIndex].name);
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
    navigate(`/class/${classId}`);
  };
  
  const handleLogout = () => {
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
          onKeyDown={() => {}}
          onMouseEnter={() => {}}
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
          onMouseEnter={() => {}}
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
          onMouseEnter={() => {}}
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

      {/* Progress Summary */}
      {progress !== null && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            İlerleme Durumunuz
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{xs: 6, sm: 3}}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {progress.listenedTopics.length}
                </Typography>
                <Typography variant="body2">
                  Dinlenen Konu
                </Typography>
              </Card>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {progress.completedQuestions.filter(q => q.isCorrect).length}
                </Typography>
                <Typography variant="body2">
                  Doğru Cevap
                </Typography>
              </Card>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {progress.completedQuestions.filter(q => !q.isCorrect).length}
                </Typography>
                <Typography variant="body2">
                  Yanlış Cevap
                </Typography>
              </Card>
            </Grid>
            <Grid size={{xs: 6, sm: 3}}>
              <Card sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="info.main">
                  {progress.completedTests.length}
                </Typography>
                <Typography variant="body2">
                  Tamamlanan Test
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
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
              onMouseEnter={() => playClassAudio(classItem.name)}
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