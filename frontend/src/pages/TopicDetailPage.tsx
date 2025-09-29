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
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';
import audioManager from '../utils/audioManager';

// Veri tipleri
interface TopicData {
  _id: string;
  title: string;
  content: string;
  audio: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
  unit: string;
}

interface ClassData {
  _id: string;
  name: string;
}

interface UnitData {
  _id: string;
  title: string;
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
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [audioError, setAudioError] = useState<string>('');
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(true); // Başlangıçta yükleniyor
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false); // Sesin hazır olup olmadığını belirten yeni state

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const rewindButtonRef = useRef<HTMLButtonElement>(null);
  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio URLs and current index
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [currentAudioUrlIndex, setCurrentAudioUrlIndex] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Sınıf bilgilerini al
        const classRes = await api.get(`/classes/${classId}`);
        setClassData(classRes.data.class);

        // Ünite bilgilerini al
        const unitRes = await api.get(`/units/${unitId}`);
        setUnitData(unitRes.data.unit);

        // Konu bilgilerini al
        const topicRes = await api.get(`/topics/${topicId}`);
        setTopic(topicRes.data);
        
      } catch (err) {
        setError('Konu yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, classId, unitId, topicId]);

  useEffect(() => {
    if (classData && unitData && topic && user && classId && unitId && topicId) {
      setIntroSpeechFinished(true);
    } else if (!user) {
      setIntroSpeechFinished(true);
    }
  }, [classData, unitData, topic, user, classId, unitId, topicId]);

  useEffect(() => {
    if (!loading && introSpeechFinished && topic) {
      containerRef.current?.focus();
    }
  }, [loading, introSpeechFinished, topic]);

  // Initialize audio URLs when topic loads
  useEffect(() => {
    if (topic?._id) {
      // Create audio URL from MongoDB endpoint
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://adimodtu.onrender.com/api' 
        : 'http://localhost:5757/api';
      const audioUrl = `${baseUrl}/topics/${topic._id}/audio`;
      setAudioUrls([audioUrl]);
      setCurrentAudioUrlIndex(0);
      
      // Load audio
      if (audioUrl) {
        loadAudioUrl(audioUrl);
      }
    }
  }, [topic]);

  // Audio event handlers
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const loadAudioUrl = async (url: string, retryCount = 0) => {
    setIsAudioLoading(true);
    setIsAudioReady(false);
    setAudioError('');
    
    try {
      const response = await api.get(url, { 
        responseType: 'arraybuffer'
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
          setIsAudioReady(true);
        };
        
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        };
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        
        audioRef.current.onerror = () => {
          console.error('Audio element error');
          setIsAudioLoading(false);
          setIsAudioReady(false);
          // Auto-retry up to 3 times
          if (retryCount < 3) {
            setTimeout(() => {
              loadAudioUrl(url, retryCount + 1);
            }, 1000);
          } else {
            setAudioError('Audio yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
          }
        };
      }
    } catch (err) {
      console.error('Error loading audio from MongoDB:', err);
      setIsAudioLoading(false);
      setIsAudioReady(false);
      // Auto-retry up to 3 times
      if (retryCount < 3) {
        setTimeout(() => {
          loadAudioUrl(url, retryCount + 1);
        }, 1000);
      } else {
        setAudioError('Audio yüklenemedi. MongoDB hatası. Lütfen sayfayı yenileyin.');
      }
    }
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!introSpeechFinished) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        handleBackClick();
        break;
      case ' ':
        e.preventDefault();
        if (isAudioReady) handlePlayPause();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        if (isAudioReady) handleRestart();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (isAudioReady) handleRewind();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (isAudioReady) handleForward();
        break;
    }
  };

  const handleBackClick = () => {
    audioManager.play('/sounds/back.mp3');
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
      onMouseDown={() => containerRef.current?.focus()}
      tabIndex={0}
      ref={containerRef}
    >
      {/* Breadcrumb Navigation */}
      <Breadcrumbs 
        aria-label="breadcrumb" 
        sx={{ 
          mb: 3,
          fontSize: '1.2rem',
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
          {unitData?.title}
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '1.2rem' }}>
          {topic.title}
        </Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Typography 
          variant="h2" 
          component="h1" 
          ref={headerRef}
          tabIndex={-1}
          sx={{ 
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'primary.main',
          }}
        >
          {topic.title}
        </Typography>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleBackClick} 
          ref={backButtonRef}
          sx={{ 
            fontSize: '1.5rem',
            padding: '1rem 2rem',
            minHeight: '60px',
          }}
        >
          <NavigateBefore sx={{ mr: 1 }} />
          Geri Dön
        </Button>
      </Box>

      {/* Audio Player Card */}
      <Card sx={{ p: 4, mb: 4 }}>
        <CardContent>
          <audio
            ref={audioRef}
            src={audioUrls[currentAudioUrlIndex] || ''}
            preload="metadata"
            style={{ display: 'none' }}
          />

          {isAudioLoading && (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <CircularProgress size={50} sx={{ mr: 2 }} />
              <Typography variant="h6" sx={{ display: 'inline' }}>
                Ses yükleniyor...
              </Typography>
            </Box>
          )}

          {audioError && (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Alert severity="error" sx={{ fontSize: '1.2rem' }}>
                {audioError}
              </Alert>
            </Box>
          )}

          {isAudioReady && !audioError && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontSize: '1.5rem', mb: 1, fontWeight: 'bold' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
                {topic?.audio?.size && (
                  <Typography variant="body1" color="text.secondary">
                    Dosya boyutu: {(topic.audio.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                )}
              </Box>

              <Grid container spacing={3} justifyContent="center">
                <Grid size={{xs:12, sm:6, md:3}} >
                  <Button
                    ref={rewindButtonRef}
                    variant="outlined"
                    size="large"
                    onClick={handleRewind}
                    fullWidth
                    sx={{ fontSize: '1.2rem', py: 2, minHeight: '80px' }}
                  >
                    <FastRewind sx={{ mr: 1, fontSize: '2rem' }} />
                    Geri Sar
                  </Button>
                </Grid>

                <Grid size={{xs:12, sm:6, md:3}} >
                  <Button
                    ref={playButtonRef}
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handlePlayPause}
                    fullWidth
                    sx={{ fontSize: '1.2rem', py: 2, minHeight: '80px' }}
                  >
                    {isPlaying ? (
                      <><Pause sx={{ mr: 1, fontSize: '2rem' }} /> Duraklat</>
                    ) : (
                      <><PlayArrow sx={{ mr: 1, fontSize: '2rem' }} /> Oynat</>
                    )}
                  </Button>
                </Grid>

                <Grid size={{xs:12, sm:6, md:3}} >
                  <Button
                    ref={forwardButtonRef}
                    variant="outlined"
                    size="large"
                    onClick={handleForward}
                    fullWidth
                    sx={{ fontSize: '1.2rem', py: 2, minHeight: '80px' }}
                  >
                    <FastForward sx={{ mr: 1, fontSize: '2rem' }} />
                    İleri Sar
                  </Button>
                </Grid>

                <Grid size={{xs:12, sm:6, md:3}} >
                  <Button
                    ref={restartButtonRef}
                    variant="outlined"
                    color="secondary"
                    size="large"
                    onClick={handleRestart}
                    fullWidth
                    sx={{ fontSize: '1.2rem', py: 2, minHeight: '80px' }}
                  >
                    <RestartAlt sx={{ mr: 1, fontSize: '2rem' }} />
                    Yeniden Başlat
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary' }}>
                  Klavye Kısayolları: Boşluk (Oynat/Duraklat), R (Yeniden Başlat), Sol/Sağ Ok (Geri/İleri Sar), ESC (Geri Dön)
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Topic Content */}
      {topic.content && (
        <Card sx={{ mb: 4, p: 3 }}>
          <CardContent>
            <Typography 
              variant="h5" 
              sx={{ fontSize: '1.5rem', fontWeight: 'bold', mb: 2, color: 'primary.main' }}
            >
              Konu İçeriği:
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ fontSize: '1.2rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', textAlign: 'justify' }}
            >
              {topic.content}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default TopicDetailPage;