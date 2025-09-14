import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
  IconButton,
  Chip
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Stop, 
  ArrowBack, 
  ArrowForward,
  VolumeUp,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';

interface QuestionOption {
  _id: string;
  text: string;
  hasAudio?: boolean;
  audio?: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
}

interface Question {
  _id: string;
  text: string;
  hasQuestionAudio?: boolean;
  questionAudio?: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
  options: QuestionOption[];
  hasSolutionText?: boolean;
  hasSolutionAudio?: boolean;
  solutionText?: string;
  solutionAudio?: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
}

interface TestData {
  _id: string;
  title: string;
  unit: string;
  questions: Question[];
  hasAudio: boolean;
}

interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
}

const UserTestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();

  const [test, setTest] = useState<TestData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(-1); // -1 to focus question first
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudioType, setCurrentAudioType] = useState<string>('');
  const [showSolution, setShowSolution] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const questionRef = useRef<HTMLDivElement>(null);
  const questionTextRef = useRef<HTMLHeadingElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const solutionButtonRef = useRef<HTMLButtonElement | null>(null); // Ref for the solution button
  const audioRequestAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  // Cleanup blob URLs and abort controller on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing audio request
      if (audioRequestAbortController.current) {
        audioRequestAbortController.current.abort();
      }
      
      if (audioRef.current && audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  useEffect(() => {
    if (test && test.questions.length > 0) {
      const currentQuestion = test.questions[currentQuestionIndex];
      const savedAnswer = userAnswers[currentQuestion._id];
      if (savedAnswer) {
        setSelectedAnswer(savedAnswer);
        const optionIndex = currentQuestion.options.findIndex(opt => opt.text === savedAnswer);
        setFocusedOptionIndex(optionIndex >= 0 ? optionIndex : -1);
      } else {
        setSelectedAnswer('');
        setFocusedOptionIndex(-1); // Start with question focused
      }
      setAnswerResult(null);
      setShowSolution(false);
      
      // Auto-play question audio when question loads and focus the question
      if (currentQuestion.hasQuestionAudio) {
        setTimeout(() => {
          playQuestionAudio();
        }, 500);
      }
      questionTextRef.current?.focus();
    }
  }, [currentQuestionIndex, test]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5757/api/tests/${testId}`);
      setTest(response.data);
    } catch (err: any) {
      setError('Test yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (url: string, type: string) => {
    try {
      // Cancel any ongoing audio request
      if (audioRequestAbortController.current) {
        audioRequestAbortController.current.abort();
      }
      
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = '';
      }
      
      setIsLoadingAudio(true);
      setIsPlayingAudio(false); // Don't set to true until we're sure it's playing
      setCurrentAudioType(type);
      
      // Create new abort controller for this request
      const abortController = new AbortController();
      audioRequestAbortController.current = abortController;
      
      // Fetch audio with authentication token
      const token = localStorage.getItem('authtoken');
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          'authtoken': token
        },
        signal: abortController.signal
      });
      
      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      // Create blob URL
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event handlers before attempting to play
      let hasStartedPlaying = false;
      let hasErrored = false;
      
      audio.onplay = () => {
        hasStartedPlaying = true;
        setIsPlayingAudio(true);
        setIsLoadingAudio(false);
      };
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        setCurrentAudioType('');
        setIsLoadingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRequestAbortController.current = null;
      };
      
      audio.onerror = (e) => {
        hasErrored = true;
        setIsPlayingAudio(false);
        setCurrentAudioType('');
        setIsLoadingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRequestAbortController.current = null;
        // Error handled silently - no text-to-speech
      };
      
      // Wait a bit for audio to be ready, then try to play
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!hasStartedPlaying && !hasErrored) {
            reject(new Error('Audio loading timeout'));
          }
        }, 5000); // 5 second timeout
        
        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          resolve(true);
        };
        
        audio.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Audio failed to load'));
        };
      });
      
      // Try to play the audio
      try {
        await audio.play();
      } catch (playError) {
        // Error handled silently - no text-to-speech
        throw playError;
      }
      
    } catch (err: any) {
      // Check if error is due to request abortion
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return; // Don't show error for aborted requests
      }
      
      setIsPlayingAudio(false);
      setCurrentAudioType('');
      setIsLoadingAudio(false);
      audioRequestAbortController.current = null;
      
      // Error handled silently - no text-to-speech
    }
  };

  const playQuestionAudio = () => {
    if (!test) return;
    const currentQuestion = test.questions[currentQuestionIndex];
    const audioUrl = `http://localhost:5757/api/tests/${testId}/questions/${currentQuestion._id}/audio/question`;
    playAudio(audioUrl, 'question');
  };

  const playOptionAudio = (optionIndex: number) => {
    if (!test) return;
    const currentQuestion = test.questions[currentQuestionIndex];
    const option = currentQuestion.options[optionIndex];
    const audioUrl = `http://localhost:5757/api/tests/${testId}/questions/${currentQuestion._id}/options/${option._id}/audio`;
    playAudio(audioUrl, `option-${optionIndex}`);
  };

  const playSolutionAudio = () => {
    if (!test) return;
    const currentQuestion = test.questions[currentQuestionIndex];
    const audioUrl = `http://localhost:5757/api/tests/${testId}/questions/${currentQuestion._id}/audio/solution`;
    playAudio(audioUrl, 'solution');
  };

  const stopAudio = () => {
    // Cancel any ongoing audio request
    if (audioRequestAbortController.current) {
      audioRequestAbortController.current.abort();
      audioRequestAbortController.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Clean up blob URL
      if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = '';
    }
    setIsPlayingAudio(false);
    setCurrentAudioType('');
    setIsLoadingAudio(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!test) return;
    
    // Disable keyboard navigation while audio is playing
    if (isPlayingAudio || isLoadingAudio) {
      // Only allow space to stop audio and escape to exit
      if (e.key === ' ' && isPlayingAudio) {
        e.preventDefault();
        stopAudio();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      }
      return;
    }
    
    const currentQuestion = test.questions[currentQuestionIndex];
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        const prevOptionIndex = Math.max(focusedOptionIndex - 1, -1);
        setFocusedOptionIndex(prevOptionIndex);
        if (prevOptionIndex === -1) {
            questionTextRef.current?.focus();
        } else if (prevOptionIndex < currentQuestion.options.length) {
            optionRefs.current[prevOptionIndex]?.focus();
            if (currentQuestion.options[prevOptionIndex].hasAudio && !isLoadingAudio && !isPlayingAudio) {
              playOptionAudio(prevOptionIndex);
            }
        } else if (prevOptionIndex === currentQuestion.options.length) {
            submitButtonRef.current?.focus();
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const maxIndex = answerResult && (currentQuestion.hasSolutionText || currentQuestion.hasSolutionAudio) 
          ? currentQuestion.options.length + 1 
          : currentQuestion.options.length;
        const nextOptionIndex = Math.min(focusedOptionIndex + 1, maxIndex);
        setFocusedOptionIndex(nextOptionIndex);
        if (nextOptionIndex < currentQuestion.options.length) {
            optionRefs.current[nextOptionIndex]?.focus();
            if (currentQuestion.options[nextOptionIndex].hasAudio && !isLoadingAudio && !isPlayingAudio) {
                playOptionAudio(nextOptionIndex);
            }
        } else if (nextOptionIndex === currentQuestion.options.length) {
            submitButtonRef.current?.focus();
        } else if (nextOptionIndex === currentQuestion.options.length + 1 && answerResult && (currentQuestion.hasSolutionText || currentQuestion.hasSolutionAudio)) {
            solutionButtonRef.current?.focus();
        }
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (e.key === ' ' && isPlayingAudio) {
          stopAudio();
        } else if (e.key === 'Enter') {
          if (focusedOptionIndex >= 0 && focusedOptionIndex < currentQuestion.options.length) {
            const selectedOption = currentQuestion.options[focusedOptionIndex];
            setSelectedAnswer(selectedOption.text);
          } else if (focusedOptionIndex === currentQuestion.options.length) {
            submitAnswer();
          } else if (focusedOptionIndex === currentQuestion.options.length + 1 && answerResult && (currentQuestion.hasSolutionText || currentQuestion.hasSolutionAudio)) {
            showSolutionHandler();
          }
        }
        break;
        
      case 'r':
      case 'R':
        e.preventDefault();
        if (currentQuestion.hasQuestionAudio) {
          playQuestionAudio();
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (currentQuestionIndex > 0) {
          goToPreviousQuestion();
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (currentQuestionIndex < test.questions.length - 1) {
          goToNextQuestion();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        navigate(-1);
        break;
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !test) return;
    
    try {
      const currentQuestion = test.questions[currentQuestionIndex];
      const response = await axios.post(
        `http://localhost:5757/api/tests/${testId}/questions/${currentQuestion._id}/check`,
        { userAnswer: selectedAnswer }
      );
      
      setAnswerResult(response.data);
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion._id]: selectedAnswer
      }));
      
      // Announce result and then focus solution button
      const resultCallback = () => {
        // After result is announced, focus solution button and announce it
        setTimeout(() => {
          if ((currentQuestion.hasSolutionText || currentQuestion.hasSolutionAudio) && solutionButtonRef.current) {
            // Update focused option index to solution button position
            setFocusedOptionIndex(currentQuestion.options.length + 1);
            solutionButtonRef.current.focus();
            speak('Çözümü dinle');
          }
        }, 500);
      };

      setTimeout(() => {
        if (!response.data.isCorrect) {
          speak(`Yanlış. Doğru cevap: ${response.data.correctAnswer}`, resultCallback);
        } else {
          speak('Doğru!', resultCallback);
        }
      }, 500);

    } catch (err) {
      // Error handled silently
    }
  };

  const showSolutionHandler = () => {
    setShowSolution(true);
    if (test && test.questions[currentQuestionIndex].hasSolutionAudio) {
      playSolutionAudio();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={80} />
      </Box>
    );
  }

  if (error || !test) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ fontSize: '1.3rem', padding: '1rem' }}>
          {error || 'Test bulunamadı'}
        </Alert>
        <Button 
          onClick={() => navigate(-1)} 
          variant="contained" 
          sx={{ mt: 2, fontSize: '1.2rem', padding: '1rem 2rem' }}
        >
          Geri Dön
        </Button>
      </Container>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 4, mb: 4 }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2, fontSize: '2.5rem' }}>
          {test.title}
        </Typography>
        
        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Soru {currentQuestionIndex + 1} / {test.questions.length}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      </Box>

      {/* Question Card */}
      <Card sx={{ mb: 4, minHeight: '400px' }}>
        <CardContent sx={{ padding: '2rem' }}>
          {/* Question */}
          <Box sx={{ mb: 3 }} ref={questionRef}>
            <Typography variant="h5" component="h2" sx={{ mb: 2, fontSize: '1.8rem' }}>
              Soru {currentQuestionIndex + 1}
            </Typography>
            
            <Typography ref={questionTextRef} tabIndex={-1} variant="h6" sx={{ mb: 2, fontSize: '1.4rem', lineHeight: 1.6, '&:focus': { outline: 'none' } }}>
              {currentQuestion.text}
            </Typography>
            
            {/* Question Audio Controls */}
            {currentQuestion.hasQuestionAudio && (
              <Box sx={{ mb: 2 }}>
                <IconButton
                  onClick={playQuestionAudio}
                  disabled={(isPlayingAudio && currentAudioType === 'question') || (isLoadingAudio && currentAudioType === 'question')}
                  sx={{ fontSize: '1.2rem', mr: 1 }}
                >
                  {(isLoadingAudio && currentAudioType === 'question') ? (
                    <CircularProgress size={20} />
                  ) : isPlayingAudio && currentAudioType === 'question' ? (
                    <Pause />
                  ) : (
                    <PlayArrow />
                  )}
                </IconButton>
                <Typography component="span" sx={{ fontSize: '1.1rem' }}>
                  Soruyu Dinle (R tuşu)
                </Typography>
              </Box>
            )}
          </Box>

          {/* Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1.3rem' }}>
              Seçenekler:
            </Typography>
            
            {currentQuestion.options.map((option, index) => (
              <Button
                key={option._id}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                variant={selectedAnswer === option.text ? "contained" : "outlined"}
                color={selectedAnswer === option.text ? "primary" : "inherit"}
                onClick={() => {
                  setSelectedAnswer(option.text);
                  setFocusedOptionIndex(index);
                }}
                onFocus={() => {
                  setFocusedOptionIndex(index);
                  // Only play audio if not currently loading or playing another audio
                  if (option.hasAudio && !isLoadingAudio && !isPlayingAudio) {
                    playOptionAudio(index);
                  }
                }}
                sx={{
                  display: 'block',
                  width: '100%',
                  mb: 1,
                  padding: '1rem',
                  fontSize: '1.2rem',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  '&:focus': {
                    outline: '3px solid #2196f3',
                    outlineOffset: '2px'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flexGrow: 1, fontSize: '1.2rem' }}>
                    {String.fromCharCode(65 + index)}. {option.text}
                  </Typography>
                  {option.hasAudio && (
                    <VolumeUp sx={{ ml: 1 }} />
                  )}
                </Box>
              </Button>
            ))}
          </Box>

          {/* Submit Button */}
          <Box sx={{ mb: 3 }}>
            <Button
              ref={submitButtonRef}
              variant="contained"
              color="primary"
              onClick={submitAnswer}
              disabled={!selectedAnswer || !!answerResult}
              onFocus={() => {
                // Only announce if not currently playing audio and not loading audio
                if (!isPlayingAudio && !isLoadingAudio) {
                  speak('Cevabı onayla');
                }
              }}
              sx={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
            >
              Cevabı Onayla
            </Button>
          </Box>

          {/* Answer Result */}
          {answerResult && (
            <Box sx={{ mb: 3 }}>
              <Alert 
                severity={answerResult.isCorrect ? "success" : "error"}
                sx={{ fontSize: '1.2rem', padding: '1rem' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {answerResult.isCorrect ? <CheckCircle sx={{ mr: 1 }} /> : <Cancel sx={{ mr: 1 }} />}
                  <Typography sx={{ fontSize: '1.2rem' }}>
                    {answerResult.isCorrect ? 'Doğru!' : `Yanlış. Doğru cevap: ${answerResult.correctAnswer}`}
                  </Typography>
                </Box>
              </Alert>
              
              {/* Solution */}
              {(currentQuestion.hasSolutionText || currentQuestion.hasSolutionAudio) && (
                <Button
                  ref={solutionButtonRef}
                  variant="outlined"
                  onClick={showSolutionHandler}
                  onFocus={() => {
                    // Update focused option index to solution button position
                    setFocusedOptionIndex(currentQuestion.options.length + 1);
                    // Only announce if not currently playing audio and not loading audio
                    if (!isPlayingAudio && !isLoadingAudio) {
                      speak('Çözümü dinle');
                    }
                  }}
                  sx={{ mt: 2, fontSize: '1.1rem', padding: '0.8rem 1.5rem' }}
                >
                  Çözümü Dinle/Gör
                </Button>
              )}
              
              {showSolution && currentQuestion.hasSolutionText && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Çözüm:
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                    {currentQuestion.solutionText}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          startIcon={<ArrowBack />}
          sx={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
        >
          Önceki Soru
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
          >
            Testten Çık
          </Button>
          
          {isPlayingAudio && (
            <Button
              variant="outlined"
              color="error"
              onClick={stopAudio}
              startIcon={<Stop />}
              sx={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
            >
              Durdur (Space)
            </Button>
          )}
        </Box>
        
        <Button
          variant="outlined"
          onClick={goToNextQuestion}
          disabled={!test || currentQuestionIndex === test.questions.length - 1}
          endIcon={<ArrowForward />}
          sx={{ fontSize: '1.2rem', padding: '1rem 2rem' }}
        >
          Sonraki Soru
        </Button>
      </Box>

      {/* Keyboard Shortcuts Info */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Klavye Kısayolları:
        </Typography>
        <Typography sx={{ fontSize: '1rem' }}>
          ↑↓ Seçenekler arası gezinme | Enter: Seçenek seçme | R: Soruyu tekrar dinleme | 
          ←→ Sorular arası gezinme | Space: Audio durdurma | Esc: Çıkış
        </Typography>
      </Box>
    </Container>
  );
};

export default UserTestPage;