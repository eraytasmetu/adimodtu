import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Button,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import audioManager from '../utils/audioManager';
import Layout from '../components/Layout';

// Sınıf verisi için bir tip arayüzü tanımlayalım
interface ClassData {
  _id: string;
  name: string;
}

const UserDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

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
    audioManager.play(src).catch(() => { });
  };

  // Refs for keyboard navigation
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const adminButtonRef = useRef<HTMLButtonElement>(null);
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
      // Start focus on the first class card by default
      setFocusedIndex(0);
      classRefs.current[0]?.focus();
      playClassAudio(classes[0].name);
    }
  }, [classes, introSpeechFinished, loading]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Navigation items: [Classes...] -> Admin Button (if admin) -> Logout Button
    const isAdmin = user?.role === 'admin';
    const classCount = classes.length;
    const totalElements = classCount + (isAdmin ? 2 : 1);

    // Index mapping:
    // 0 to classCount-1: Classes
    // classCount: Admin Button (if exists) OR Logout Button
    // classCount+1: Logout Button (if admin)

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (focusedIndex + 1) % totalElements;
      setFocusedIndex(nextIndex);
      focusElement(nextIndex, classCount, isAdmin);
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (focusedIndex - 1 + totalElements) % totalElements;
      setFocusedIndex(prevIndex);
      focusElement(prevIndex, classCount, isAdmin);
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex < classCount) {
        handleClassClick(classes[focusedIndex]._id, classes[focusedIndex].name);
      } else if (isAdmin && focusedIndex === classCount) {
        navigate('/admin/dashboard');
      } else {
        handleLogout();
      }
    }
  };

  const focusElement = (index: number, classCount: number, isAdmin: boolean) => {
    if (index < classCount) {
      classRefs.current[index]?.focus();
      playClassAudio(classes[index].name);
    } else if (isAdmin && index === classCount) {
      adminButtonRef.current?.focus();
    } else {
      logoutButtonRef.current?.focus();
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
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress size={80} color="secondary" />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Sınıflar">
      <Box
        onKeyDown={handleKeyDown}
        sx={{ outline: 'none' }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 4, fontSize: '1.2rem' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {classes.map((classItem, index) => (
            <Grid size={{ xs: 12 }} key={classItem._id}>
              <Card
                ref={(el) => {
                  classRefs.current[index] = el;
                }}
                tabIndex={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '220px',
                  cursor: 'pointer',
                  // Focus styles are handled globally in index.css
                }}
                onMouseEnter={() => playClassAudio(classItem.name)}
                onClick={() => handleClassClick(classItem._id, classItem.name)}
              >
                <CardActionArea sx={{ flexGrow: 1, height: '100%', p: 2 }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography
                      variant="h4"
                      component="h2"
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        color: theme.palette.primary.light,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
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

        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <Button
              ref={adminButtonRef}
              variant="contained"
              color="primary"
              onClick={() => navigate('/admin/dashboard')}
              tabIndex={0}
              sx={{ minWidth: '200px' }}
            >
              Admin Paneli
            </Button>
          )}

          <Button
            ref={logoutButtonRef}
            variant="outlined"
            color="error"
            onClick={handleLogout}
            tabIndex={0}
            sx={{
              minWidth: '200px',
              borderWidth: 2,
              '&:hover': { borderWidth: 2 }
            }}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default UserDashboardPage;