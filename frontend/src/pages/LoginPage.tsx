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
import { useAuth } from '../context/AuthContext';
import { speak } from '../utils/speechUtils';
import axios from 'axios';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const registerLinkRef = useRef<HTMLAnchorElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, field: 'email' | 'password' | 'button' | 'link') => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (field === 'email') passwordRef.current?.focus();
      if (field === 'password') buttonRef.current?.focus();
      if (field === 'button') registerLinkRef.current?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (field === 'password') emailRef.current?.focus();
      if (field === 'button') passwordRef.current?.focus();
      if (field === 'link') buttonRef.current?.focus();
    }
  };

  useEffect(() => {
    speak('Giriş sayfasına hoş geldiniz. Lütfen e-posta ve şifrenizi girerek devam edin.');
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5757/api/users/login', {
        email,
        password,
      });
      
      setLoading(false);
      speak('Giriş başarılı. Ana sayfaya yönlendiriliyorsunuz.');
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
          Platforma Giriş
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posta Adresiniz"
            name="email"
            autoFocus
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
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Giriş Yap'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid>
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                ref={registerLinkRef}
                onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => handleKeyDown(e, 'link')}
              >
                Hesabın yok mu? Kayıt Ol
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;