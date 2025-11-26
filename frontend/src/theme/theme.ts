import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a theme instance.
let theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#3F51B5', // Indigo
            light: '#7986CB',
            dark: '#303F9F',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#FFC107', // Amber
            light: '#FFD54F',
            dark: '#FFA000',
            contrastText: '#000000',
        },
        background: {
            default: '#F5F5F5', // Light Grey
            paper: '#FFFFFF', // White
        },
        text: {
            primary: '#212121', // Very dark grey
            secondary: '#757575', // Medium grey
        },
        error: {
            main: '#D32F2F',
        },
        success: {
            main: '#388E3C',
        },
    },
    typography: {
        fontFamily: "'Poppins', 'Inter', sans-serif",
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1.1rem',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.2)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(45deg, #3F51B5 30%, #303F9F 90%)',
                },
                containedSecondary: {
                    background: 'linear-gradient(45deg, #FFC107 30%, #FFA000 90%)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: "#bdbdbd #f5f5f5",
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: "#f5f5f5",
                        width: '10px',
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: "#bdbdbd",
                        minHeight: 24,
                        border: "2px solid #f5f5f5",
                    },
                    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                        backgroundColor: "#9e9e9e",
                    },
                    "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
                        backgroundColor: "#9e9e9e",
                    },
                    "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: "#9e9e9e",
                    },
                    "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
                        backgroundColor: "#f5f5f5",
                    },
                },
            },
        },
    },
});

theme = responsiveFontSizes(theme);

export default theme;
