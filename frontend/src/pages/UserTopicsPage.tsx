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

// Konu verisi için tip arayüzü
interface TopicData {
  _id: string;
  name: string;
  description?: string;
  hasAudio: boolean;
  audioSize?: number;
  audioFilename?: string;
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

const UserTopicsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId, unitId } = useParams<{ classId: string; unitId: string }>();

  const [topics, setTopics] = useState<TopicData[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [unitData, setUnitData] = useState<UnitData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [introSpeechFinished, setIntroSpeechFinished] = useState<boolean>(false);

  // Refs for keyboard navigation
  const headerRef = useRef<HTMLHeadingElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const topicRefs = useRef<(HTMLDivElement | null)[]>([]);
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
        console.log(unitRes.data);
        // Konuları al
        const topicsRes = await api.get(`/topics?unit=${unitId}`);
        setTopics(topicsRes.data);
        
        // Initialize refs array
        topicRefs.current = new Array(topicsRes.data.length).fill(null);
      } catch (err) {
        setError('Konular yüklenirken bir hata oluştu.');
        speak('Konular yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, classId, unitId]);

  useEffect(() => {
    if (classData && unitData && user && classId && unitId) {
      speak(`${classData.name} - ${unitData.title} konuları yükleniyor. Lütfen bir konu seçerek başla.`, () => {
        setIntroSpeechFinished(true);
      });
    } else if (!user) {
      setIntroSpeechFinished(true);
    }
  }, [classData, unitData, user, classId, unitId]);

  useEffect(() => {
    if (topics.length > 0 && introSpeechFinished && !loading) {
      setFocusedIndex(2);
      topicRefs.current[0]?.focus();
      speak(`${topics[0].name} konusu.`);
    }
  }, [topics, introSpeechFinished, loading]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Normal topic navigation
    const totalElements = topics.length + 2; // +2 for header and back button
    
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleBackClick();
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      const nextIndex = Math.min(focusedIndex + 1, totalElements - 1);
      setFocusedIndex(nextIndex);
      
      if (nextIndex === 0) {
        backButtonRef.current?.focus();
        speak('Geri dön butonu');
      } else if (nextIndex === 1) {
        headerRef.current?.focus();
        speak(`${classData?.name} - ${unitData?.title} konuları başlığı`);
      } else {
        const topicIndex = nextIndex - 2;
        topicRefs.current[topicIndex]?.focus();
        speak(`${topics[topicIndex].name} konusu.`);
      }
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const prevIndex = Math.max(focusedIndex - 1, 0);
      setFocusedIndex(prevIndex);
      
      if (prevIndex === 0) {
        backButtonRef.current?.focus();
        speak('Geri dön butonu');
      } else if (prevIndex === 1) {
        headerRef.current?.focus();
        speak(`${classData?.name} - ${unitData?.title} konuları başlığı`);
      } else {
        const topicIndex = prevIndex - 2;
        topicRefs.current[topicIndex]?.focus();
        speak(`${topics[topicIndex].name} konusu.`);
      }
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex === 0) {
        handleBackClick();
      } else if (focusedIndex >= 2) {
        const topicIndex = focusedIndex - 2;
        handleTopicClick(topics[topicIndex]);
      }
    }
  };

  const handleBackClick = () => {
    speak("Ünite seçim sayfasına geri dönülüyor.");
    navigate(`/class/${classId}`);
  };

  const handleTopicClick = (topic: TopicData) => {
    navigate(`/topic/${classId}/${unitId}/${topic._id}`);
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
          Konular
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
          onMouseEnter={() => speak(`${classData?.name} - ${unitData?.title} konuları başlığı`)}
        >
          {classData?.name} - {unitData?.title} Konuları
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

      {topics.length === 0 ? (
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
            Bu ünitede henüz konu bulunmuyor.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={6}>
          {topics.map((topic, index) => (
            <Grid size={{xs: 12}} key={topic._id}>
              <Card
                ref={(el) => {
                  topicRefs.current[index] = el;
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
                onMouseEnter={() => speak(`${topic.name} konusu.`)}
              >
                <CardActionArea
                  onClick={() => handleTopicClick(topic)}
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
                      {topic.name}
                    </Typography>
                    {topic.description && (
                      <Typography
                        sx={{ 
                          fontSize: '1.2rem',
                          lineHeight: 1.6
                        }}
                      >
                        {topic.description}
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

export default UserTopicsPage; 