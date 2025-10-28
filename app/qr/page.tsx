'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function QRLandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding after a short delay
    const timer = setTimeout(() => {
      router.push('/client/onboarding');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        px: 2
      }}
    >
      <Box component="img" 
        src="/images/LITTLE-BARBERSHOP-LOGO.svg" 
        alt="Little Barbershop" 
        sx={{ 
          width: 120, 
          height: 'auto', 
          mb: 3,
          filter: 'brightness(0) invert(1)'
        }} 
      />
      
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Welcome to Little Barbershop
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
        Redirecting you to our booking platform...
      </Typography>
      
      <CircularProgress color="inherit" />
    </Box>
  );
}
