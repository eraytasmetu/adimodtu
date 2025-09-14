import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, TextField, Button, List, ListItem, ListItemText, IconButton, Divider, Alert, Stack } from '@mui/material';
import { Add, Edit, Delete, NavigateNext } from '@mui/icons-material';
import api from '../api/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ClassData { _id: string; name: string; }

const AdminClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectClassId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [form, setForm] = useState<Partial<ClassData>>({ name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch {
      setError('Sınıflar yüklenemedi');
    }
  };

  useEffect(() => { loadClasses(); }, []);

  const submit = async () => {
    setError('');
    try {
      if (editingId) {
        await api.put(`/classes/${editingId}`, { name: form.name });
      } else {
        await api.post('/classes', { name: form.name });
      }
      setForm({ name: '' });
      setEditingId(null);
      await loadClasses();
    } catch (e: any) {
      setError(e?.response?.data?.msg || 'Kayıt işlemi başarısız');
    }
  };

  const startEdit = (c: ClassData) => {
    setEditingId(c._id);
    setForm({ name: c.name });
  };

  const remove = async (id: string) => {
    setError('');
    try {
      await api.delete(`/classes/${id}`);
      await loadClasses();
    } catch (e: any) {
      setError(e?.response?.data?.msg || 'Silme işlemi başarısız');
    }
  };

  const goUnits = (classId: string) => navigate(`/admin/units?classId=${encodeURIComponent(classId)}`);
  const goTopics = (classId: string) => navigate(`/admin/topics?classId=${encodeURIComponent(classId)}`);
  const goTests = (classId: string) => navigate(`/admin/tests?classId=${encodeURIComponent(classId)}`);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h3" fontWeight={700} sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>Admin</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/admin/classes')} endIcon={<NavigateNext />}>Sınıflar</Button>
          <Button variant="outlined" onClick={() => goUnits(preselectClassId)}>Üniteler</Button>
          <Button variant="outlined" onClick={() => goTopics(preselectClassId)}>Konular</Button>
          <Button variant="outlined" onClick={() => goTests(preselectClassId)}>Testler</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{xs : 12 , md :5}} >
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>{editingId ? 'Sınıfı Düzenle' : 'Yeni Sınıf Ekle'}</Typography>
            <TextField fullWidth label="Sınıf Adı" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={submit} startIcon={editingId ? <Edit /> : <Add />}>Kaydet</Button>
              {editingId && <Button variant="outlined" onClick={() => { setEditingId(null); setForm({ name: '' }); }}>Vazgeç</Button>}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{xs : 12 , md :7}} >
          <Paper sx={{ p: 2 }}>
            <List>
              {classes.map((c) => (
                <React.Fragment key={c._id}>
                  <ListItem
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => goUnits(c._id)}>Üniteler</Button>
                        <Button size="small" variant="outlined" onClick={() => goTopics(c._id)}>Konular</Button>
                        <Button size="small" variant="outlined" onClick={() => goTests(c._id)}>Testler</Button>
                        <IconButton onClick={() => startEdit(c)} aria-label="edit"><Edit /></IconButton>
                        <IconButton onClick={() => remove(c._id)} aria-label="delete"><Delete /></IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText primary={c.name} />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminClassesPage;