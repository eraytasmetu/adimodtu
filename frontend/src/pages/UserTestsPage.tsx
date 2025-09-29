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
  Button,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';
import audioManager from '../utils/audioManager';

// Test verisi için tip arayüzü
interface TestData {
  _id: string;
  name: string;
  description?: string;
  questionCount?: number;
}

// Sınıf verisi için tip arayüzü
interface ClassData {
  _id: string;
  name: string;
}

// Ünite verisi için tip arayüzü
interface UnitData {
  _id: string;
  title: string;
}

const UserTestsPage: React.FC = () => {
  const { user, progress } = useAuth();
  const navigate = useNavigate();
  const { classId, unitId } = useParams<{ classId: string; unitId: string }>();

  const [tests, setTests] = useState<TestData[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [unitData, setUnitData] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const testRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sınıf bilgilerini al
        const classRes = await api.get(`/classes/${classId}`);
        setClassData(classRes.data.class);

        // Ünite bilgilerini al
        const unitRes = await api.get(`/units/${unitId}`);
        setUnitData(unitRes.data.unit);

        // Testleri al
        const testsRes = await api.get(`/tests?unit=${unitId}`);
        setTests(testsRes.data);
        
        // Initialize refs array
        testRefs.current = new Array(testsRes.data.length).fill(null);
      } catch (err) {
        setError('Testler yüklenirken bir hata oluştu.');
        speak('Testler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    // Sayfa açılışında selecttest.mp3 çal
    audioManager.play('/sounds/selecttest.mp3', () => setIntroSpeechFinished(true));

    fetchData();

    return () => {
      audioManager.stop();
    };
  }, [user, classId, unitId]);

  // Başlangıç yönlendirme sesi kaldırıldı; sadece selecttest.mp3 kullanıyoruz

  useEffect(() => {
    if (tests.length > 0 && introSpeechFinished && !loading) {
      setFocusedIndex(2);
      testRefs.current[0]?.focus();
      speak(`${tests[0].name} testi.`);
    }
  }, [tests, introSpeechFinished, loading]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Normal test navigation
    const totalElements = tests.length + 2; // +2 for header and back button
    
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleBackClick();
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      let nextIndex = focusedIndex + 1;
      // Header'ı atla
      if (nextIndex === 1) nextIndex = 2;
      // Son testten sonra Geri Dön butonuna geç
      const lastTestIndex = tests.length + 1; // tests start at 2, last is 2 + tests.length - 1 = tests.length + 1
      if (focusedIndex === lastTestIndex) {
        nextIndex = 0;
      }
      nextIndex = Math.min(nextIndex, totalElements - 1);
      setFocusedIndex(nextIndex);
      
      if (nextIndex === 0) {
        backButtonRef.current?.focus();
      } else if (nextIndex === 1) {
        headerRef.current?.focus();
      } else {
        const testIndex = nextIndex - 2;
        testRefs.current[testIndex]?.focus();
        speak(`${tests[testIndex].name} testi.`);
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
        backButtonRef.current?.focus();
      } else if (prevIndex === 1) {
        headerRef.current?.focus();
      } else {
        const testIndex = prevIndex - 2;
        testRefs.current[testIndex]?.focus();
        speak(`${tests[testIndex].name} testi.`);
      }
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex === 0) {
        handleBackClick();
      } else if (focusedIndex >= 2) {
        const testIndex = focusedIndex - 2;
        handleTestClick(tests[testIndex]);
      }
    }
  };

  const handleBackClick = () => {
    navigate(`/class/${classId}`);
  };

  const handleTestClick = (test: TestData) => {
    navigate(`/test/${test._id}`);
  };

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
      {/* Breadcrumb Navigation */}
      <Breadcrumbs 
        aria-label="breadcrumb" 
        sx={{ 
          mb: 3,
          fontSize: '1.2rem',
          '& .MuiBreadcrumbs-ol': {
            fontSize: '1.2rem'
          }
        }}
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          color="inherit"
          sx={{ 
            fontSize: '1.2rem',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Ana Sayfa
        </Link>
        <Link
          component={RouterLink}
          to={`/class/${classId}`}
          color="inherit"
          sx={{ 
            fontSize: '1.2rem',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {classData?.name}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '1.2rem' }}>
          {unitData?.title}
        </Typography>
        <Typography color="text.primary" sx={{ fontSize: '1.2rem' }}>
          Testler
        </Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Typography 
          variant="h2" 
          component="h1" 
          ref={headerRef}
          tabIndex={0}
          sx={{ 
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'primary.main',
            cursor: 'pointer',
            '&:focus': {
              outline: '3px solid #2196f3',
              outlineOffset: '5px',
              borderRadius: '8px'
            }
          }}
          onMouseEnter={() => {}}
        >
          {classData?.name} - {unitData?.title} Testleri
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleBackClick} 
          ref={backButtonRef}
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
          onMouseEnter={() => audioManager.play('/sounds/back.mp3')}
          onFocus={() => audioManager.play('/sounds/back.mp3')}
        >
          Geri Dön
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

      {tests.length === 0 ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          sx={{ 
            fontSize: '1.5rem',
            color: 'text.secondary'
          }}
        >
          <Typography variant="h4">
            Bu ünitede henüz test bulunmuyor.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={6}>
          {tests.map((test, index) => (
            <Grid size={{xs: 12}} key={test._id}>
              <Card
                ref={(el) => {
                  testRefs.current[index] = el;
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
                onMouseEnter={() => speak(`${test.name} testi.`)}
              >
                <CardActionArea
                  onClick={() => handleTestClick(test)}
                  sx={{ 
                    flexGrow: 1,
                    padding: '1.5rem'
                  }}
                >
                  <CardContent sx={{ padding: '1.5rem' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        gutterBottom 
                        variant="h4" 
                        component="h2"
                        sx={{ 
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          mb: 0
                        }}
                      >
                        {test.name}
                      </Typography>
                      {/* Completed tests indicator removed */}
                    </Box>
                    {test.description && (
                      <Typography
                        sx={{ 
                          fontSize: '1.2rem',
                          lineHeight: 1.6,
                          mb: 2,
                          maxHeight: '4.8rem', // 3 lines
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {test.description}
                      </Typography>
                    )}
                    {test.questionCount && (
                      <Typography
                        variant="h6"
                        sx={{ 
                          color: 'text.secondary',
                          fontWeight: 'bold'
                        }}
                      >
                        {test.questionCount} Soru
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default UserTestsPage; 