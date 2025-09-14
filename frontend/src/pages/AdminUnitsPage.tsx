import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, TextField, Button, List, ListItem, ListItemText, IconButton, Divider, Alert, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Add, Edit, Delete, NavigateNext } from '@mui/icons-material';
import api from '../api/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ClassData { _id: string; name: string; }
interface UnitData { _id: string; title: string; class: string; }

const AdminUnitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClass = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClass);
  const [units, setUnits] = useState<UnitData[]>([]);
  const [form, setForm] = useState<Partial<UnitData>>({ title: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadClasses = async () => { try { const res = await api.get('/classes'); setClasses(res.data); } catch { setError('Sınıflar yüklenemedi'); } };
  const loadUnits = async () => { if (!selectedClassId) return setUnits([]); try { const res = await api.get(`/units/for-class/${selectedClassId}`); setUnits(res.data); } catch { setError('Üniteler yüklenemedi'); } };

  useEffect(() => { loadClasses(); }, []);
  useEffect(() => { loadUnits(); }, [selectedClassId]);

  const submit = async () => {
    if (!selectedClassId) return setError('Önce sınıf seçin');
    setError('');
    try {
      if (editingId) { await api.put(`/units/${editingId}`, { title: form.title }); }
      else { await api.post('/units', { title: form.title, class: selectedClassId }); }
      setForm({ title: '' }); setEditingId(null); await loadUnits();
    } catch (e: any) { setError(e?.response?.data?.msg || 'Kayıt işlemi başarısız'); }
  };

  const startEdit = (u: UnitData) => { setEditingId(u._id); setForm({ title: u.title }); };
  const remove = async (id: string) => { setError(''); try { await api.delete(`/units/${id}`); await loadUnits(); } catch (e: any) { setError(e?.response?.data?.msg || 'Silme işlemi başarısız'); } };

  const goClasses = () => navigate('/admin/classes');
  const goTopics = (unitId?: string) => {
    const qs = new URLSearchParams();
    if (selectedClassId) qs.set('classId', selectedClassId);
    if (unitId) qs.set('unitId', unitId);
    navigate(`/admin/topics?${qs.toString()}`);
  };
  const goTests = (unitId?: string) => {
    const qs = new URLSearchParams();
    if (selectedClassId) qs.set('classId', selectedClassId);
    if (unitId) qs.set('unitId', unitId);
    navigate(`/admin/tests?${qs.toString()}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h3" fontWeight={700} sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>Admin</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={goClasses}>Sınıflar</Button>
          <Button variant="outlined" onClick={() => goTopics()}>Konular</Button>
          <Button variant="outlined" onClick={() => goTests()}>Testler</Button>
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{xs : 12 , md :7}} >
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>{editingId ? 'Üniteyi Düzenle' : 'Yeni Ünite Ekle'}</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="class-select">Sınıf</InputLabel>
              <Select labelId="class-select" label="Sınıf" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                {classes.map((c) => (<MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Ünite Başlığı" value={form.title || ''} onChange={(e) => setForm({ title: e.target.value })} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={submit} startIcon={editingId ? <Edit /> : <Add />}>Kaydet</Button>
              {editingId && <Button variant="outlined" onClick={() => { setEditingId(null); setForm({ title: '' }); }}>Vazgeç</Button>}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{xs : 12 , md:5}} >
          <Paper sx={{ p: 2 }}>
            {!selectedClassId ? <Typography color="text.secondary">Sol taraftan sınıf seçin</Typography> : (
              <List>
                {units.map((u) => (
                  <React.Fragment key={u._id}>
                    <ListItem secondaryAction={<Stack direction="row" spacing={1}><Button size="small" variant="outlined" onClick={() => goTopics(u._id)}>Konular</Button><Button size="small" variant="outlined" onClick={() => goTests(u._id)}>Testler</Button><IconButton onClick={() => startEdit(u)}><Edit /></IconButton><IconButton onClick={() => remove(u._id)}><Delete /></IconButton></Stack>}>
                      <ListItemText primary={u.title} />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminUnitsPage;