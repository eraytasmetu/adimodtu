import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  RestartAlt, 
  FastRewind, 
  FastForward,
  NavigateBefore
} from '@mui/icons-material';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';

// Veri tipleri
interface TopicData {
  _id: string;
  name: string;
  description?: string;
  hasAudio: boolean;
  audioSize?: number;
  audioFilename?: string;
}

interface ClassData {
  _id: string;
  name: string;
}

interface UnitData {
  _id: string;
  name: string;
}

const TopicDetailPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId, unitId, topicId } = useParams<{ classId: string; unitId: string; topicId: string }>();

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [unitData, setUnitData] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioError, setAudioError] = useState<string>('');
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const rewindButtonRef = useRef<HTMLButtonElement>(null);
  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Button refs array for navigation
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Audio URLs and current index
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [currentAudioUrlIndex, setCurrentAudioUrlIndex] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sınıf bilgilerini al
        const classRes = await axios.get(`http://localhost:5757/api/classes/${classId}`);
        setClassData(classRes.data.class);

        // Ünite bilgilerini al
        const unitRes = await axios.get(`http://localhost:5757/api/units/${unitId}`);
        setUnitData(unitRes.data);

        // Konu bilgilerini al
        const topicRes = await axios.get(`http://localhost:5757/api/topics/${topicId}`);
        setTopic(topicRes.data);
        
      } catch (err) {
        setError('Konu yüklenirken bir hata oluştu.');
        speak('Konu yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, classId, unitId, topicId]);

  useEffect(() => {
    if (classData && unitData && topic && user && classId && unitId && topicId) {
      speak(`${classData.name} - ${unitData.name} - ${topic.name} konusu yükleniyor. Audio kontrolleri için yön tuşlarını kullanın.`, () => {
        setIntroSpeechFinished(true);
      });
    } else if (!user) {
      setIntroSpeechFinished(true);
    }
  }, [classData, unitData, topic, user, classId, unitId, topicId]);

  useEffect(() => {
    if (topic && introSpeechFinished && !loading) {
      setFocusedIndex(1);
      backButtonRef.current?.focus();
    }
  }, [topic, introSpeechFinished, loading]);

  // Initialize button refs array
  useEffect(() => {
    buttonRefs.current = [
      backButtonRef.current,
      playButtonRef.current,
      rewindButtonRef.current,
      forwardButtonRef.current,
      restartButtonRef.current
    ];
  }, []);

  // Initialize audio URLs when topic loads
  useEffect(() => {
    if (topic?._id) {
      // Create audio URL from MongoDB endpoint
      const audioUrl = `http://localhost:5757/api/topics/${topic._id}/audio`;
      setAudioUrls([audioUrl]);
      setCurrentAudioUrlIndex(0);
      
      // Load audio
      if (audioUrl) {
        loadAudioUrl(audioUrl);
      }
    }
  }, [topic]);

  const generateAudioUrls = (topicId: string): string[] => {
    // For MongoDB, we only have one audio URL
    return [`http://localhost:5757/api/topics/${topicId}/audio`];
  };

  // Audio event handlers
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        speak('Audio duraklatıldı');
      } else {
        audioRef.current.play();
        speak('Audio oynatılıyor');
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      speak('10 saniye geri sarıldı');
    }
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
      speak('10 saniye ileri sarıldı');
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      speak('Audio baştan başlatıldı');
    }
  };

  const loadAudioUrl = async (url: string) => {
    setIsAudioLoading(true);
    setAudioError('');
    try {
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        headers: {
          'authtoken': localStorage.getItem('authtoken') || ''
        }
      });
      
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        
        // Set up audio event listeners
        audioRef.current.onloadedmetadata = () => {
          setDuration(audioRef.current?.duration || 0);
          setIsAudioLoading(false);
        };
        
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        };
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          speak('Audio tamamlandı');
        };
        
        audioRef.current.onerror = () => {
          setAudioError('Audio yüklenirken hata oluştu');
          setIsAudioLoading(false);
          speak('Audio yüklenirken hata oluştu');
        };
      }
    } catch (err) {
      console.error('Error loading audio from MongoDB:', err);
      setAudioError('Audio yüklenemedi. MongoDB hatası.');
      setIsAudioLoading(false);
      speak('Audio yüklenemedi. MongoDB hatası.');
    }
  };

  const handleRetryAudio = () => {
    setAudioError('');
    if (audioUrls.length > 0) {
      loadAudioUrl(audioUrls[currentAudioUrlIndex]);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!introSpeechFinished) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleBackClick();
        break;
      case ' ':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        handleRestart();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handleRewind();
        break;
      case 'ArrowRight':
        e.preventDefault();
        handleForward();
        break;
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = Math.min(focusedIndex + 1, buttonRefs.current.length - 1);
        setFocusedIndex(nextIndex);
        buttonRefs.current[nextIndex]?.focus();
        speakButtonName(nextIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = Math.max(focusedIndex - 1, 0);
        setFocusedIndex(prevIndex);
        buttonRefs.current[prevIndex]?.focus();
        speakButtonName(prevIndex);
        break;
      case 'Enter':
        e.preventDefault();
        handleButtonAction(focusedIndex);
        break;
    }
  };

  const speakButtonName = (index: number) => {
    const buttonNames = ['Geri dön butonu', 'Oynat/Duraklat butonu', 'Geri sar butonu', 'İleri sar butonu', 'Yeniden başlat butonu'];
    speak(buttonNames[index]);
  };

  const handleButtonAction = (index: number) => {
    switch (index) {
      case 0:
        handleBackClick();
        break;
      case 1:
        handlePlayPause();
        break;
      case 2:
        handleRewind();
        break;
      case 3:
        handleForward();
        break;
      case 4:
        handleRestart();
        break;
    }
  };

  const handleBackClick = () => {
    speak("Konular sayfasına geri dönülüyor.");
    navigate(`/topics/${classId}/${unitId}`);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={80} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ fontSize: '1.3rem', padding: '1rem' }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!topic) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ fontSize: '1.3rem', padding: '1rem' }}>
          Konu bulunamadı.
        </Alert>
      </Container>
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
        <Link
          component={RouterLink}
          to={`/topics/${classId}/${unitId}`}
          color="inherit"
          sx={{ 
            fontSize: '1.2rem',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {unitData?.name}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '1.2rem' }}>
          {topic.name}
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
          onMouseEnter={() => speak(`${classData?.name} - ${unitData?.name} - ${topic.name} konusu başlığı`)}
        >
          {classData?.name} - {unitData?.name} - {topic.name}
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
          onMouseEnter={() => speak('Geri dön butonu')}
        >
          <NavigateBefore sx={{ mr: 1 }} />
          Geri Dön
        </Button>
      </Box>

      {/* Topic Description */}
      {topic.description && (
        <Card sx={{ mb: 4, p: 3 }}>
          <CardContent>
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: '1.5rem',
                lineHeight: 1.6,
                mb: 2
              }}
            >
              {topic.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Audio Player */}
      <Card sx={{ p: 4, mb: 4 }}>
        <CardContent>
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: '2rem',
              fontWeight: 'bold',
              mb: 3,
              textAlign: 'center'
            }}
          >
            Audio Player
          </Typography>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audioUrls[currentAudioUrlIndex] || ''}
            preload="metadata"
            style={{ display: 'none' }}
            onError={() => setAudioError('Audio yüklenemedi')}
          />

          {/* Audio Error Display */}
          {audioError && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Alert 
                severity="error" 
                sx={{ fontSize: '1.1rem', mb: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={handleRetryAudio}>
                    Tekrar Dene
                  </Button>
                }
              >
                {audioError}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                MongoDB audio yükleniyor...
              </Typography>
            </Box>
          )}

          {/* Loading Indicator */}
          {isAudioLoading && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <CircularProgress size={40} sx={{ mr: 2 }} />
              <Typography variant="body1" sx={{ display: 'inline' }}>
                Audio yükleniyor... MongoDB'den
              </Typography>
            </Box>
          )}

          {/* Time Display */}
          {!audioError && !isAudioLoading && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontSize: '1.3rem', mb: 1 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
              {topic?.audioSize && (
                <Typography variant="body2" color="text.secondary">
                  Dosya boyutu: {(topic.audioSize / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              )}
            </Box>
          )}

          {/* Control Buttons */}
          <Grid container spacing={3} justifyContent="center">
            <Grid size={{xs: 12, sm: 6, md: 3}}>
              <Button
                ref={rewindButtonRef}
                variant="outlined"
                size="large"
                onClick={handleRewind}
                fullWidth
                disabled={!!audioError || isAudioLoading}
                sx={{ 
                  fontSize: '1.2rem',
                  py: 2,
                  minHeight: '80px',
                  '&:focus': {
                    outline: '3px solid #4caf50',
                    outlineOffset: '5px'
                  }
                }}
                onMouseEnter={() => speak('Geri sar butonu - 10 saniye geri sarar')}
                tabIndex={0}
              >
                <FastRewind sx={{ mr: 1, fontSize: '2rem' }} />
                Geri Sar
              </Button>
            </Grid>

            <Grid size={{xs: 12, sm: 6, md: 3}}>
              <Button
                ref={playButtonRef}
                variant="contained"
                color="primary"
                size="large"
                onClick={handlePlayPause}
                fullWidth
                disabled={!!audioError || isAudioLoading}
                sx={{ 
                  fontSize: '1.2rem',
                  py: 2,
                  minHeight: '80px',
                  '&:focus': {
                    outline: '3px solid #4caf50',
                    outlineOffset: '5px'
                  }
                }}
                onMouseEnter={() => speak(isPlaying ? 'Duraklat butonu' : 'Oynat butonu')}
                tabIndex={0}
              >
                {isPlaying ? (
                  <>
                    <Pause sx={{ mr: 1, fontSize: '2rem' }} />
                    Duraklat
                  </>
                ) : (
                  <>
                    <PlayArrow sx={{ mr: 1, fontSize: '2rem' }} />
                    Oynat
                  </>
                )}
              </Button>
            </Grid>

            <Grid size={{xs: 12, sm: 6, md: 3}}>
              <Button
                ref={forwardButtonRef}
                variant="outlined"
                size="large"
                onClick={handleForward}
                fullWidth
                disabled={!!audioError || isAudioLoading}
                sx={{ 
                  fontSize: '1.2rem',
                  py: 2,
                  minHeight: '80px',
                  '&:focus': {
                    outline: '3px solid #4caf50',
                    outlineOffset: '5px'
                  }
                }}
                onMouseEnter={() => speak('İleri sar butonu - 10 saniye ileri sarar')}
                tabIndex={0}
              >
                <FastForward sx={{ mr: 1, fontSize: '2rem' }} />
                İleri Sar
              </Button>
            </Grid>

            <Grid size={{xs: 12, sm: 6, md: 3}}>
              <Button
                ref={restartButtonRef}
                variant="outlined"
                color="secondary"
                size="large"
                onClick={handleRestart}
                fullWidth
                disabled={!!audioError || isAudioLoading}
                sx={{ 
                  fontSize: '1.2rem',
                  py: 2,
                  minHeight: '80px',
                  '&:focus': {
                    outline: '3px solid #4caf50',
                    outlineOffset: '5px'
                  }
                }}
                onMouseEnter={() => speak('Yeniden başlat butonu - baştan başlatır')}
                tabIndex={0}
              >
                <RestartAlt sx={{ mr: 1, fontSize: '2rem' }} />
                Yeniden Başlat
              </Button>
            </Grid>
          </Grid>

          {/* MongoDB Audio Info */}
          {topic?.hasAudio && (
            <Box sx={{ textAlign: 'center', mt: 4, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontSize: '1rem', color: 'success.contrastText', mb: 1 }}>
                ✅ Audio MongoDB'de saklanıyor. Daha güvenilir ve hızlı erişim.
              </Typography>
              {topic.audioFilename && (
                <Typography variant="body2" sx={{ fontSize: '0.9rem', color: 'success.contrastText' }}>
                  Dosya: {topic.audioFilename}
                </Typography>
              )}
            </Box>
          )}

          {/* Keyboard Shortcuts Info */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
              Klavye Kısayolları: Boşluk (Oynat/Duraklat), R (Yeniden Başlat), Sol/Sağ Ok (Geri/İleri Sar), ESC (Geri Dön)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TopicDetailPage; 