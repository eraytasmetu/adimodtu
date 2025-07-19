import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Link
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const loginLinkRef = useRef<HTMLAnchorElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, field: 'name' | 'email' | 'password' | 'confirm' | 'button' | 'link') => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (field === 'name') emailRef.current?.focus();
      if (field === 'email') passwordRef.current?.focus();
      if (field === 'password') confirmPasswordRef.current?.focus();
      if (field === 'confirm') buttonRef.current?.focus();
      if (field === 'button') loginLinkRef.current?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (field === 'email') nameRef.current?.focus();
      if (field === 'password') emailRef.current?.focus();
      if (field === 'confirm') passwordRef.current?.focus();
      if (field === 'button') confirmPasswordRef.current?.focus();
      if (field === 'link') buttonRef.current?.focus();
    }
  };
  
  useEffect(() => {
    speak('Kayıt sayfasına hoş geldiniz. Lütfen bilgilerinizi girerek hesabınızı oluşturun.');
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      const errorMessage = 'Şifreler eşleşmiyor. Lütfen kontrol edin.';
      setError(errorMessage);
      speak(errorMessage);
      return;
    }
    
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5757/api/users/register', {
        name,
        email,
        password,
      });

      setLoading(false);
      speak('Kayıt başarılı. Giriş yapılıyor ve ana sayfaya yönlendiriliyorsunuz.');
      login(response.data.token); // Merkezi login fonksiyonunu kullan
      navigate('/');

    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.msg || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      setError(errorMessage);
      speak(`Hata: ${errorMessage}`);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Hesap Oluştur
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Adınız Soyadınız"
            name="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputRef={nameRef}
            onKeyDown={(e) => handleKeyDown(e, 'name')}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posta Adresiniz"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputRef={emailRef}
            onKeyDown={(e) => handleKeyDown(e, 'email')}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Şifreniz"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            inputRef={passwordRef}
            onKeyDown={(e) => handleKeyDown(e, 'password')}
          />
           <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Şifrenizi Tekrar Girin"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            inputRef={confirmPasswordRef}
            onKeyDown={(e) => handleKeyDown(e, 'confirm')}
          />
          {error && (
            <Alert severity="error" role="alert" aria-live="assertive" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
            ref={buttonRef}
            onKeyDown={(e) => handleKeyDown(e, 'button')}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Kayıt Ol'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                ref={loginLinkRef}
                onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => handleKeyDown(e, 'link')}
              >
                Zaten bir hesabın var mı? Giriş Yap
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;