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

// Ünite verisi için tip arayüzü
interface UnitData {
  _id: string;
  title: string;
  class: string;
  createdAt: string;
}

// Sınıf verisi için tip arayüzü
interface ClassData {
  _id: string;
  name: string;
}

const ClassUnitsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  const [units, setUnits] = useState<UnitData[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null);

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const unitRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const konularButtonRef = useRef<HTMLButtonElement>(null);
  const testlerButtonRef = useRef<HTMLButtonElement>(null);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);

  const isFiveClass = () => {
    const name = classData?.name || '';
    const normalized = name.replace(/\s+/g, '').toLowerCase();
    return normalized.includes('5.sınıf') || normalized.includes('5.sinif') || normalized.includes('5sinif');
  };

  const announceUnit = (unitTitle: string, unitIndex: number) => {
    if (isFiveClass() && unitIndex >= 0 && unitIndex < 4) {
      const src = `/sounds/unit${unitIndex + 1}.mp3`;
      audioManager.play(src).catch(() => {});
    } else {
      speak(`${unitTitle} ünitesi.`);
    }
  };

  useEffect(() => {
    const fetchClassAndUnits = async () => {
      try {
        // Sınıf bilgilerini al
        const classRes = await api.get(`/classes/${classId}`);
        setClassData(classRes.data.class);

        // Üniteleri al
        const unitsRes = await api.get(`/units/for-class/${classId}`);
        setUnits(unitsRes.data);
        
        // Initialize refs array
        unitRefs.current = new Array(unitsRes.data.length).fill(null);
      } catch (err) {
        setError('Üniteler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    // Sayfa açılışında sabit seçim sesi çal
    audioManager.play('/sounds/selectunit.mp3', () => setIntroSpeechFinished(true));

    fetchClassAndUnits();

    return () => {
      audioManager.stop();
    };
  }, [user, classId]);

  // Başlangıç yönlendirme sesi kaldırıldı; sadece selectunit.mp3 kullanıyoruz

  useEffect(() => {
    if (units.length > 0 && introSpeechFinished && !loading) {
      setFocusedIndex(2);
      unitRefs.current[0]?.focus();
      announceUnit(units[0].title, 0);
    }
  }, [units, introSpeechFinished, loading]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSelectionDialog) {
      // Selection dialog is open - handle dialog navigation
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCloseSelectionDialog();
        return;
      }
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        // Toggle between Konular and Testler buttons
        if (focusedIndex === 0) {
          setFocusedIndex(1);
          testlerButtonRef.current?.focus();
        } else {
          setFocusedIndex(0);
          konularButtonRef.current?.focus();
        }
        return;
      }
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex === 0) {
          handleKonularClick();
        } else {
          handleTestlerClick();
        }
        return;
      }
      return;
    }

    // Normal unit navigation (dialog is closed)
    const totalElements = units.length + 2; // +2 for header and back button
    
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
      // Son üniteden sonra Geri Dön butonuna geç
      const lastUnitIndex = units.length + 1; // units start at 2, last is 2 + units.length - 1 = units.length + 1
      if (focusedIndex === lastUnitIndex) {
        nextIndex = 0;
      }
      nextIndex = Math.min(nextIndex, totalElements - 1);
      setFocusedIndex(nextIndex);

      if (nextIndex === 0) {
        backButtonRef.current?.focus();
      } else if (nextIndex === 1) {
        headerRef.current?.focus();
      } else {
        const unitIndex = nextIndex - 2;
        unitRefs.current[unitIndex]?.focus();
        announceUnit(units[unitIndex].title, unitIndex);
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
        const unitIndex = prevIndex - 2;
        unitRefs.current[unitIndex]?.focus();
        announceUnit(units[unitIndex].title, unitIndex);
      }
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex === 0) {
        handleBackClick();
      } else if (focusedIndex >= 2) {
        const unitIndex = focusedIndex - 2;
        handleUnitClick(units[unitIndex]._id, units[unitIndex].title);
      }
    }
  };

  const handleUnitClick = (unitId: string, unitTitle: string) => {
    const unitIndex = units.findIndex(u => u._id === unitId);
    const unit = unitIndex >= 0 ? units[unitIndex] : undefined;
    if (unit) {
      setSelectedUnit(unit);
      setSelectedUnitIndex(unitIndex);
      setShowSelectionDialog(true);
      audioManager.play('/sounds/selecttopicorstest.mp3').catch(() => {});
      setFocusedIndex(0); // Start with Konular button focused
      // Focus the first button after a short delay
      setTimeout(() => {
        konularButtonRef.current?.focus();
      }, 100);
    }
  };

  const handleCloseSelectionDialog = () => {
    setShowSelectionDialog(false);
    const restoreIndex = selectedUnitIndex;
    setSelectedUnit(null);
    if (restoreIndex !== null && restoreIndex >= 0 && restoreIndex < units.length) {
      // Focus back to the previously selected unit and announce it again
      setFocusedIndex(2 + restoreIndex);
      setTimeout(() => {
        unitRefs.current[restoreIndex]?.focus();
        announceUnit(units[restoreIndex].title, restoreIndex);
      }, 0);
    }
  };

  const handleKonularClick = () => {
    setShowSelectionDialog(false);
    navigate(`/topics/${classId}/${selectedUnit?._id}`);
  };

  const handleTestlerClick = () => {
    setShowSelectionDialog(false);
    navigate(`/tests/${classId}/${selectedUnit?._id}`);
  };
  
  const handleBackClick = () => {
    audioManager.play('/sounds/back.mp3');
    navigate('/');
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
          to="/"
          color="inherit"
          sx={{ 
            fontSize: '1.2rem',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Sınıflar
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '1.2rem' }}>
          {classData?.name}
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
          {classData?.name} Üniteleri
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

      {units.length === 0 ? (
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
            Bu sınıfta henüz ünite bulunmuyor.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={6}>
          {units.map((unit, index) => (
            <Grid size={{xs: 12}} key={unit._id}>
              <Card
                ref={(el) => {
                  unitRefs.current[index] = el;
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
                onMouseEnter={() => announceUnit(unit.title, index)}
              >
                <CardActionArea
                  onClick={() => handleUnitClick(unit._id, unit.title)}
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
                      {unit.title}
                    </Typography>
                    <Typography
                      sx={{ 
                        fontSize: '1.2rem',
                        lineHeight: 1.6,
                        color: 'text.secondary'
                      }}
                    >
                      Ünite {index + 1}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Selection Dialog */}
      {showSelectionDialog && selectedUnit && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 2,
              padding: 4,
              maxWidth: 500,
              width: '90%',
              textAlign: 'center',
              boxShadow: 24,
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontSize: '2rem',
                fontWeight: 'bold',
                mb: 4,
                color: 'primary.main'
              }}
            >
              {selectedUnit.title}
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                fontSize: '1.5rem',
                mb: 4,
                color: 'text.secondary'
              }}
            >
              Ne yapmak istiyorsunuz?
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                ref={konularButtonRef}
                variant="contained"
                size="large"
                onClick={handleKonularClick}
                tabIndex={0}
                sx={{
                  fontSize: '1.5rem',
                  padding: '1.5rem',
                  minHeight: '70px',
                  '&:focus': {
                    outline: '3px solid #4caf50',
                    outlineOffset: '5px'
                  }
                }}
                onMouseEnter={() => audioManager.play('/sounds/topics.mp3')}
                onFocus={() => audioManager.play('/sounds/topics.mp3')}
              >
                📚 Konular
              </Button>
              
              <Button
                ref={testlerButtonRef}
                variant="contained"
                color="secondary"
                size="large"
                onClick={handleTestlerClick}
                tabIndex={0}
                sx={{
                  fontSize: '1.5rem',
                  padding: '1.5rem',
                  minHeight: '70px',
                  '&:focus': {
                    outline: '3px solid #f50057',
                    outlineOffset: '5px'
                  }
                }}
                onMouseEnter={() => audioManager.play('/sounds/tests.mp3')}
                onFocus={() => audioManager.play('/sounds/tests.mp3')}
              >
                📝 Testler
              </Button>
            </Box>
            
            <Typography
              variant="body2"
              sx={{
                mt: 3,
                fontSize: '1rem',
                color: 'text.secondary'
              }}
            >
              ESC tuşu ile iptal edebilirsiniz
            </Typography>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default ClassUnitsPage; 