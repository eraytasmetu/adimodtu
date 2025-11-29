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
  LinearProgress
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack, AdminPanelSettings } from '@mui/icons-material';
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

interface TopicData {
  _id: string;
  title: string;
  content: string;
  unit: string;
  hasAudio: boolean;
  audioSize?: number;
  audioFilename?: string;
  hasTitleAudio?: boolean;
  titleAudioSize?: number;
  titleAudioFilename?: string;
}

interface TopicFormData {
  title: string;
  content: string;
  unit: string;
  audioFile?: File | null;
  titleAudioFile?: File | null;
}

const AdminTopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const unitId = searchParams.get('unitId');

  const [topics, setTopics] = useState<TopicData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [units, setUnits] = useState<UnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicData | null>(null);
  const [formData, setFormData] = useState<TopicFormData>({
    title: '',
    content: '',
    unit: '',
    audioFile: null,
    titleAudioFile: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, [classId, unitId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, unitsRes, topicsRes] = await Promise.all([
        api.get('/classes'),
        api.get('/units'),
        api.get('/topics')
      ]);

      setClasses(classesRes.data);
      setUnits(unitsRes.data);
      setTopics(topicsRes.data);
    } catch (err) {
      setError('Veri yüklenirken hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim() || !formData.unit) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (!formData.audioFile && !editingTopic) {
      setError('Audio dosyası gerekli');
      return;
    }

    try {
      setError(null);
      setUploadProgress(0);

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('unit', formData.unit);

      if (formData.audioFile) {
        formDataToSend.append('audio', formData.audioFile);
      }

      if (formData.titleAudioFile) {
        formDataToSend.append('titleAudio', formData.titleAudioFile);
      }

      if (editingTopic) {
        await api.put(`/topics/${editingTopic._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        });
      } else {
        await api.post('/topics', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        });
      }

      setOpenDialog(false);
      setOpenDialog(false);
      setFormData({ title: '', content: '', unit: '', audioFile: null, titleAudioFile: null });
      setEditingTopic(null);
      setUploadProgress(0);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Bir hata oluştu');
      console.error(err);
    }
  };

  const handleEdit = (topic: TopicData) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      content: topic.content,
      unit: topic.unit,
      audioFile: null,
      titleAudioFile: null
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu konuyu silmek istediğinizden emin misiniz?')) {
      try {
        await api.delete(`/topics/${id}`);
        fetchData();
      } catch (err) {
        setError('Silme işlemi başarısız');
        console.error(err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'audioFile' | 'titleAudioFile') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setError('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }
      if (!file.type.startsWith('audio/')) {
        setError('Sadece audio dosyaları kabul edilir');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: file }));
      setError(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', unit: '', audioFile: null, titleAudioFile: null });
    setEditingTopic(null);
    setError(null);
    setUploadProgress(0);
  };

  const filteredUnits = classId ? units.filter(unit => unit.class === classId) : units;
  const filteredTopics = unitId ? topics.filter(topic => topic.unit === unitId) : topics;

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
          Konular
        </Typography>

        <Button
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          variant="contained"
          color="primary"
          sx={{ fontSize: '1.1rem', py: 1.5, px: 3 }}
        >
          Yeni Konu
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
          onClick={() => navigate('/admin/tests')}
          variant="outlined"
          sx={{ fontSize: '1rem', py: 1 }}
        >
          Testler
        </Button>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, fontSize: '1.1rem' }}>
          {error}
        </Alert>
      )}

      {/* Topics Grid */}
      <Grid container spacing={3}>
        {filteredTopics.map((topic) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={topic._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" sx={{ mb: 1, fontSize: '1.3rem' }}>
                  {topic.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    height: '4.8rem',
                    overflow: 'hidden'
                  }}
                >
                  {(topic.content || '').slice(0, 100)}{(topic.content || '').length > 100 ? '…' : ''}
                </Typography>

                {/* Audio Info */}
                {topic.hasAudio && (
                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label="🎵 İçerik Sesi"
                      color="success"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {topic.audioFilename && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        {topic.audioFilename}
                      </Typography>
                    )}
                  </Box>
                )}

                {topic.hasTitleAudio && (
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label="🎵 Başlık Sesi"
                      color="info"
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {topic.titleAudioFilename && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        {topic.titleAudioFilename}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Unit Info */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Ünite:</strong> {units.find(u => u._id === topic.unit)?.name || 'Bilinmiyor'}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleEdit(topic)}
                  startIcon={<Edit />}
                  sx={{ fontSize: '0.9rem' }}
                >
                  Düzenle
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(topic._id)}
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1.5rem' }}>
          {editingTopic ? 'Konu Düzenle' : 'Yeni Konu Ekle'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Konu Başlığı"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                  sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Konu İçeriği"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  fullWidth
                  required
                  multiline
                  rows={4}
                  sx={{ '& .MuiInputBase-input': { fontSize: '1.1rem' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel sx={{ fontSize: '1.1rem' }}>Ünite</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    label="Ünite"
                    sx={{ '& .MuiSelect-select': { fontSize: '1.1rem' } }}
                  >
                    {filteredUnits.map((unit) => (
                      <MenuItem key={unit._id} value={unit._id}>
                        {unit.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '1.1rem' }}>
                    İçerik Sesi {!editingTopic && '*'}
                  </Typography>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileChange(e, 'audioFile')}
                    style={{ display: 'none' }}
                    id="audio-file-input"
                  />
                  <label htmlFor="audio-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<Add />}
                      sx={{ fontSize: '1rem', py: 1.5 }}
                    >
                      {formData.audioFile ? formData.audioFile.name : 'İçerik Sesi Seç'}
                    </Button>
                  </label>

                  {formData.audioFile && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Seçilen dosya: {formData.audioFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Boyut: {(formData.audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}

                  {editingTopic && editingTopic.hasAudio && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="success.contrastText">
                        Mevcut: {editingTopic.audioFilename || 'Bilinmiyor'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontSize: '1.1rem' }}>
                    Başlık Sesi (Opsiyonel)
                  </Typography>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileChange(e, 'titleAudioFile')}
                    style={{ display: 'none' }}
                    id="title-audio-file-input"
                  />
                  <label htmlFor="title-audio-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<Add />}
                      sx={{ fontSize: '1rem', py: 1.5 }}
                    >
                      {formData.titleAudioFile ? formData.titleAudioFile.name : 'Başlık Sesi Seç'}
                    </Button>
                  </label>

                  {formData.titleAudioFile && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Seçilen dosya: {formData.titleAudioFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Boyut: {(formData.titleAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}

                  {editingTopic && editingTopic.hasTitleAudio && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="info.contrastText">
                        Mevcut: {editingTopic.titleAudioFilename || 'Bilinmiyor'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Yükleniyor: %{uploadProgress}
                </Typography>
              </Box>
            )}
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
              disabled={uploadProgress > 0 && uploadProgress < 100}
              sx={{ fontSize: '1.1rem', py: 1.5, px: 3 }}
            >
              {editingTopic ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminTopicsPage;