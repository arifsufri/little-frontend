'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { apiPost } from '../../../src/utils/axios';

export default function GuestNamePage() {
  const router = useRouter();
  const [guestName, setGuestName] = React.useState('');
  const [creatingGuest, setCreatingGuest] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.add('auth-locked');
    document.body.classList.add('auth-fixed');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.classList.remove('auth-locked');
      document.body.classList.remove('auth-fixed');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleGuestNameSubmit = async () => {
    if (!guestName.trim()) {
      setErrorMsg('Please enter your name');
      return;
    }

    setCreatingGuest(true);
    setErrorMsg(null);
    setIsAnimating(true);

    try {
      // Create guest client without phone number
      const response = await apiPost<{
        success: boolean;
        data: { client: any };
      }>('/clients/register', {
        fullName: guestName.trim(),
        phoneNumber: null,
        isGuest: true
      });

      if (response.success) {
        // Store client data
        localStorage.setItem('clientData', JSON.stringify(response.data.client));
        localStorage.setItem('isGuest', 'true');
        // Redirect to packages page
        router.push('/client/packages');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create guest account';
      setErrorMsg(msg);
      setIsAnimating(false);
    } finally {
      setCreatingGuest(false);
    }
  };

  return (
    <main 
      className="auth-page select-none"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(220, 38, 38, 0.8) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.6) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(185, 28, 28, 0.4) 0%, transparent 50%),
          linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #dc2626 50%, #991b1b 75%, #000000 100%)
        `,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}
    >
      {/* Grain PNG overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/Grain%20Overlay.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          mixBlendMode: "multiply" as const,
        }}
        aria-hidden
      />

      {/* Content */}
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 10, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          width="100%" 
          px={{ xs: 3, sm: 4 }}
          gap={3}
        >
          {/* Logo */}
          <Box textAlign="center" sx={{ mb: { xs: 4, sm: 6 } }}>
            <Box 
              component="img" 
              src="/images/LITTLE-BARBERSHOP-LOGO.svg" 
              alt="Little Barbershop" 
              sx={{ 
                width: { xs: 100, sm: 120 }, 
                height: 'auto', 
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' 
              }} 
            />
          </Box>

          {/* Name Input Form */}
          <Box sx={{ 
            width: '100%',
            maxWidth: { xs: '100%', sm: 400 },
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}>
            {errorMsg && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <TextField
              label="Your Name"
              placeholder="Enter your name"
              fullWidth
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setErrorMsg(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && guestName.trim() && !creatingGuest) {
                  handleGuestNameSubmit();
                }
              }}
              autoFocus
              disabled={creatingGuest}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,1)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(255,255,255,1)',
                  }
                }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGuestNameSubmit}
              disabled={creatingGuest || !guestName.trim()}
              sx={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
                color: "#111827",
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 700,
                fontFamily: '"Inter", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '0.5px',
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.3)',
                transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.1s ease-in-out',
                '&:active': {
                  transform: 'scale(0.95)',
                },
                "&:hover": { 
                  background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  transform: 'translateY(-2px) scale(1)',
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.5)',
                  color: 'rgba(17,24,39,0.5)',
                }
              }}
            >
              {creatingGuest ? 'Creating...' : 'Continue'}
            </Button>
          </Box>
        </Box>
      </Container>
    </main>
  );
}

