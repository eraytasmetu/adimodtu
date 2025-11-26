import React from 'react';
import { Box, Container, Link, AppBar, Toolbar, Typography, useTheme } from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
    const theme = useTheme();
    const { user } = useAuth();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Skip to Content Link for Accessibility */}
            <Link
                href="#main-content"
                sx={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    zIndex: 9999,
                    padding: '1rem',
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    '&:focus': {
                        top: 20,
                        left: 20,
                    },
                }}
            >
                İçeriğe Atla
            </Link>

            <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)', borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: theme.palette.primary.main }}>
                        ADIM ODTÜ
                    </Typography>
                    {user && (
                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                            Merhaba, {user.name || 'Öğrenci'}
                        </Typography>
                    )}
                </Toolbar>
            </AppBar>

            <Container
                component="main"
                id="main-content"
                maxWidth="lg"
                sx={{
                    flexGrow: 1,
                    py: 4,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {title && (
                    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4, color: theme.palette.text.primary }}>
                        {title}
                    </Typography>
                )}
                {children}
            </Container>
        </Box>
    );
};

export default Layout;
