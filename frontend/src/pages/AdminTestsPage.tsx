import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack, ExpandMore, AudioFile } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/api';

interface ClassData {
  _id: string;
  name: string;
}

interface UnitData {
  _id: string;
  name: string;
  class: string;
}

interface QuestionOptionData {
  _id?: string;
  text: string;
  audio?: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
}

interface QuestionData {
  _id?: string;
  text: string;
  questionAudio?: {
    data: Buffer;
    contentType: string;
    filename: string;
    size: number;
  };
  options: QuestionOptionData[];
  correctAnswer: string;
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
  questions: QuestionData[];
  hasAudio: boolean;
}

interface TestFormData {
  title: string;
  unit: string;
  questions: QuestionData[];
}

const AdminTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const unitId = searchParams.get('unitId');

  const [tests, setTests] = useState<TestData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [units, setUnits] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<TestData | null>(null);
  const [formData, setFormData] = useState<TestFormData>({
    title: '',
    unit: '',
    questions: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, [classId, unitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, unitsRes, testsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/units'),
        api.get('/tests')
      ]);

      console.log('Classes response:', classesRes?.data);
      console.log('Units response:', unitsRes?.data);
      console.log('Tests response:', testsRes?.data);

      setClasses(classesRes?.data || []);
      setUnits(unitsRes?.data || []);
      setTests(testsRes?.data || []);
    } catch (err) {
      setError('Veri yüklenirken hata oluştu');
      console.error(err);
      // Set empty arrays as fallback
      setClasses([]);
      setUnits([]);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.title.trim() || !formData.unit) {
      setError('Başlık ve ünite alanları zorunludur');
      return;
    }

    if ((formData.questions || []).length === 0) {
      setError('En az bir soru eklemelisiniz');
      return;
    }

    // Validate questions
    for (let i = 0; i < (formData.questions || []).length; i++) {
      const question = (formData.questions || [])[i];
      if (!question || !question.text || !question.text.trim()) {
        setError(`Soru ${i + 1} için metin gerekli`);
        return;
      }
      if (!question.options || (question.options || []).length < 2) {
        setError(`Soru ${i + 1} için en az 2 seçenek gerekli`);
        return;
      }
      for (let j = 0; j < (question.options || []).length; j++) {
        const option = (question.options || [])[j];
        if (!option || !option.text || !option.text.trim()) {
          setError(`Soru ${i + 1} - Seçenek ${j + 1} için metin gerekli`);
          return;
        }
      }
      if (!question.correctAnswer || !(question.options || []).some(opt => opt.text === question.correctAnswer)) {
        setError(`Soru ${i + 1} için doğru cevap seçeneklerden biri olmalı`);
        return;
      }
      // solutionText and solutionAudio are optional
    }

    try {
      setError(null);
      setUploadProgress(0);

      if (editingTest) {
        await api.put(`/tests/${editingTest._id}`, formData);
      } else {
        await api.post('/tests', formData);
      }

      setOpenDialog(false);
      setFormData({ title: '', unit: '', questions: [] });
      setEditingTest(null);
      setUploadProgress(0);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Bir hata oluştu');
      console.error(err);
    }
  };

  const handleEdit = (test: TestData) => {
    if (!test || !test._id) return;
    
    console.log('Editing test:', test);
    console.log('Test questions:', test.questions);
    
    setEditingTest(test);
    const formDataToSet = {
      title: test.title || '',
      unit: test.unit || '',
      questions: (test.questions || []).map(q => ({
        _id: q._id,
        text: q.text || '',
        options: (q.options || []).map(o => ({
          _id: o._id,
          text: o.text || ''
        })),
        correctAnswer: q.correctAnswer || '',
        solutionText: q.solutionText || ''
      }))
    };
    
    setFormData(formDataToSet);
    console.log('Form data set to:', formDataToSet);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    if (window.confirm('Bu testi silmek istediğinizden emin misiniz?')) {
      try {
        await api.delete(`/tests/${id}`);
        fetchData();
      } catch (err) {
        setError('Silme işlemi başarısız');
        console.error(err);
      }
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), {
        text: '',
        options: [
          { text: '' },
          { text: '' }
        ],
        correctAnswer: ''
      }]
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index)
    }));
  };

  const addOption = (questionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...(q.options || []), { text: '' }] }
          : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? { ...q, options: (q.options || []).filter((_, j) => j !== optionIndex) }
          : q
      )
    }));
  };

  const updateQuestion = (questionIndex: number, field: keyof QuestionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof QuestionOptionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: (q.options || []).map((opt, j) => 
                j === optionIndex ? { ...opt, [field]: value } : opt
              )
            }
          : q
      )
    }));
  };

  const handleFileChange = (questionIndex: number, field: 'questionAudio' | 'solutionAudio', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }
      if (!file.type.startsWith('audio/')) {
        setError('Sadece audio dosyaları kabul edilir');
        return;
      }
      
      // Read file as ArrayBuffer and convert to Buffer
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const buffer = new Uint8Array(arrayBuffer);
        
        updateQuestion(questionIndex, field, {
          data: Array.from(buffer), // Convert to regular array for JSON serialization
          filename: file.name,
          size: file.size,
          contentType: file.type
        });
        setError(null);
      };
      reader.onerror = () => {
        setError('Dosya okunurken hata oluştu');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleOptionFileChange = (questionIndex: number, optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }
      if (!file.type.startsWith('audio/')) {
        setError('Sadece audio dosyaları kabul edilir');
        return;
      }
      
      // Read file as ArrayBuffer and convert to Buffer
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const buffer = new Uint8Array(arrayBuffer);
        
        updateOption(questionIndex, optionIndex, 'audio', {
          data: Array.from(buffer), // Convert to regular array for JSON serialization
          filename: file.name,
          size: file.size,
          contentType: file.type
        });
        setError(null);
      };
      reader.onerror = () => {
        setError('Dosya okunurken hata oluştu');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', unit: '', questions: [] });
    setEditingTest(null);
    setError(null);
    setUploadProgress(0);
  };

  const filteredUnits = classId ? (units || []).filter(unit => unit?.class === classId) : (units || []);
  const filteredTests = unitId ? (tests || []).filter(test => test?.unit === unitId) : (tests || []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Yükleniyor...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/dashboard')}
          variant="outlined"
          sx={{ fontSize: '1.1rem', py: 1.5 }}
        >
          Admin
        </Button>
        
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontSize: '2.5rem' }}>
          Testler
        </Typography>

        <Button
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          variant="contained"
          color="primary"
          sx={{ fontSize: '1.1rem', py: 1.5, px: 3 }}
        >
          Yeni Test
        </Button>
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <Button
          onClick={() => navigate('/admin/classes')}
          variant="outlined"
          sx={{ fontSize: '1rem', py: 1 }}
        >
          Sınıflar
        </Button>
        <Button
          onClick={() => navigate('/admin/units')}
          variant="outlined"
          sx={{ fontSize: '1rem', py: 1 }}
        >
          Üniteler
        </Button>
        <Button
          onClick={() => navigate('/admin/topics')}
          variant="outlined"
          sx={{ fontSize: '1rem', py: 1 }}
        >
          Konular
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, fontSize: '1.1rem' }}>
          {error}
        </Alert>
      )}

      {/* Tests Grid */}
      <Grid container spacing={3}>
        {(filteredTests || []).map((test) => (
          <Grid size={{xs: 12, sm: 6, md: 4}} key={test?._id || `test-${Math.random()}`}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 1, fontSize: '1.3rem' }}>
                  {test?.title || 'Başlıksız Test'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Soru Sayısı:</strong> {(test?.questions || []).length}
                </Typography>
                
                {/* Audio Info */}
                {test?.hasAudio && (
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label="🎵 Audio" 
                      color="success" 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Audio dosyaları mevcut
                    </Typography>
                  </Box>
                )}

                {/* Unit Info */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Ünite:</strong> {(units || []).find(u => u?._id === test?.unit)?.name || 'Bilinmiyor'}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  onClick={() => test._id && handleEdit(test)}
                  startIcon={<Edit />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  Düzenle
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => test._id && handleDelete(test._id)}
                  startIcon={<Delete />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  Sil
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontSize: '1.5rem' }}>
          {editingTest ? 'Test Düzenle' : 'Yeni Test Ekle'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{xs: 12, md: 6}}>
                <TextField
                  label="Test Başlığı"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                  sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                />
              </Grid>
              
              <Grid size={{xs: 12, md: 6}}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ fontSize: '1.1rem' }}>Ünite</InputLabel>
                  <Select
                    value={formData.unit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    label="Ünite"
                    sx={{ '& .MuiSelect-select': { fontSize: '1.1rem' } }}
                  >
                    {(filteredUnits || []).map((unit) => (
                      <MenuItem key={unit?._id || `unit-${Math.random()}`} value={unit?._id || ''}>
                        {unit?.name || 'İsimsiz Ünite'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Questions Section */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: '1.3rem' }}>
                  Sorular ({(formData.questions || []).length})
                </Typography>
                <Button
                  onClick={addQuestion}
                  variant="outlined"
                  startIcon={<Add />}
                  sx={{ fontSize: '1rem' }}
                >
                  Soru Ekle
                </Button>
              </Box>

              {(formData.questions || []).map((question, questionIndex) => (
                <Accordion key={questionIndex} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" sx={{ fontSize: '1.1rem' }}>
                      Soru {questionIndex + 1}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid size={{xs: 12}}>
                        <TextField
                          label="Soru Metni"
                          value={question.text}
                          onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                          fullWidth
                          required
                          multiline
                          rows={2}
                          sx={{ '& .MuiInputBase-input': { fontSize: '1rem' } }}
                        />
                      </Grid>

                      {/* Question Audio */}
                      <Grid size={{xs: 12}}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '1rem' }}>
                            Soru Audio Dosyası (Opsiyonel)
                          </Typography>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileChange(questionIndex, 'questionAudio', e)}
                            style={{ display: 'none' }}
                            id={`question-audio-${questionIndex}`}
                          />
                          <label htmlFor={`question-audio-${questionIndex}`}>
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<AudioFile />}
                              size="small"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              {question.questionAudio?.filename || 'Audio Dosyası Seç'}
                            </Button>
                          </label>
                          {question.questionAudio?.filename && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              {question.questionAudio.filename} ({(question.questionAudio.size / (1024 * 1024)).toFixed(2)} MB)
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Options */}
                      <Grid size={{xs: 12}}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1rem' }}>
                              Seçenekler ({(question.options || []).length})
                            </Typography>
                            <Button
                              onClick={() => addOption(questionIndex)}
                              variant="outlined"
                              size="small"
                              startIcon={<Add />}
                              sx={{ fontSize: '0.8rem' }}
                            >
                              Seçenek Ekle
                            </Button>
                          </Box>

                          {(question.options || []).map((option, optionIndex) => (
                            <Box key={optionIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                              <Grid container spacing={2} alignItems="center">
                                <Grid size={{xs: 12, sm: 6}}>
                                  <TextField
                                    label={`Seçenek ${optionIndex + 1}`}
                                    value={option.text}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                                    fullWidth
                                    required
                                    size="small"
                                    sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
                                  />
                                </Grid>
                                
                                <Grid size={{xs: 12, sm: 4}}>
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => handleOptionFileChange(questionIndex, optionIndex, e)}
                                    style={{ display: 'none' }}
                                    id={`option-audio-${questionIndex}-${optionIndex}`}
                                  />
                                  <label htmlFor={`option-audio-${questionIndex}-${optionIndex}`}>
                                    <Button
                                      variant="outlined"
                                      component="span"
                                      startIcon={<AudioFile />}
                                      size="small"
                                      sx={{ fontSize: '0.8rem' }}
                                    >
                                      {option.audio?.filename || 'Audio'}
                                    </Button>
                                  </label>
                                  {option.audio?.filename && (
                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                      {option.audio.filename}
                                    </Typography>
                                  )}
                                </Grid>
                                
                                <Grid size={{xs: 12, sm: 2}}>
                                  <Button
                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    disabled={(question.options || []).length <= 2}
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    Sil
                                  </Button>
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </Box>
                      </Grid>

                      {/* Correct Answer */}
                      <Grid size={{xs: 12}}>
                        <FormControl fullWidth required>
                          <InputLabel sx={{ fontSize: '1rem' }}>Doğru Cevap</InputLabel>
                          <Select
                            value={question.correctAnswer}
                            onChange={(e) => updateQuestion(questionIndex, 'correctAnswer', e.target.value)}
                            label="Doğru Cevap"
                            sx={{ '& .MuiSelect-select': { fontSize: '1rem' } }}
                          >
                            {(question.options || []).map((option, optionIndex) => (
                              <MenuItem key={optionIndex} value={option.text}>
                                {option.text}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Solution */}
                      <Grid size={{xs: 12}}>
                        <TextField
                          label="Çözüm Açıklaması (Opsiyonel)"
                          value={question.solutionText || ''}
                          onChange={(e) => updateQuestion(questionIndex, 'solutionText', e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                          sx={{ '& .MuiInputBase-input': { fontSize: '1rem' } }}
                        />
                      </Grid>

                      {/* Solution Audio */}
                      <Grid size={{xs: 12}}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '1rem' }}>
                            Çözüm Audio Dosyası (Opsiyonel)
                          </Typography>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileChange(questionIndex, 'solutionAudio', e)}
                            style={{ display: 'none' }}
                            id={`solution-audio-${questionIndex}`}
                          />
                          <label htmlFor={`solution-audio-${questionIndex}`}>
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<AudioFile />}
                              size="small"
                              sx={{ fontSize: '0.9rem' }}
                            >
                              {question.solutionAudio?.filename || 'Audio Dosyası Seç'}
                            </Button>
                          </label>
                          {question.solutionAudio?.filename && (
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                              {question.solutionAudio.filename} ({(question.solutionAudio.size / (1024 * 1024)).toFixed(2)} MB)
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Remove Question Button */}
                      <Grid size={{xs: 12}}>
                        <Button
                          onClick={() => removeQuestion(questionIndex)}
                          variant="outlined"
                          color="error"
                          size="small"
                          disabled={(formData.questions || []).length <= 1}
                          sx={{ fontSize: '0.9rem' }}
                        >
                          Bu Soruyu Sil
                        </Button>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => {
                setOpenDialog(false);
                resetForm();
              }}
              sx={{ fontSize: '1.1rem', py: 1.5, px: 3 }}
            >
              İptal
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ fontSize: '1.1rem', py: 1.5, px: 3 }}
            >
              {editingTest ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminTestsPage;