'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Link as MUILink
} from '@mui/material';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiPost } from '../../../src/utils/axios';

// Malaysian phone number validation schema
const OnboardingSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z
    .string()
    .regex(/^01[0-9]{8,9}$/, 'Phone number must be in Malaysian format (01XXXXXXXX)')
    .min(10, 'Phone number must be at least 10 digits')
    .max(11, 'Phone number must be at most 11 digits')
});

type OnboardingForm = z.infer<typeof OnboardingSchema>;

export default function ClientOnboardingPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({ resolver: zodResolver(OnboardingSchema) });

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

  const onSubmit = async (data: OnboardingForm) => {
    setErrorMsg(null);
    setShowLoginPrompt(false);
    
    try {
      const response = await apiPost<{
        success: boolean;
        data: { client: any };
        clientExists?: boolean;
      }>('/clients/register', data);

      if (response.success) {
        // Store client data in localStorage for the session
        localStorage.setItem('clientData', JSON.stringify(response.data.client));
        // Redirect to packages page
        router.push('/client/packages');
      }
    } catch (e: any) {
      if (e?.response?.data?.clientExists) {
        setShowLoginPrompt(true);
        setErrorMsg('A client with this phone number already exists.');
      } else {
        const msg = e?.response?.data?.message || e?.message || 'Registration failed';
        setErrorMsg(msg);
      }
    }
  };

  const handleLoginRedirect = () => {
    router.push('/client/login');
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
          px={{ xs: 1.5, sm: 2 }}
        >
          {/* Logo */}
          <Box textAlign="center" sx={{ mb: { xs: 10, sm: 9 } }}>
            <Box 
              component="img" 
              src="/images/LITTLE-BARBERSHOP-LOGO.svg" 
              alt="Little Barbershop" 
              sx={{ 
                width: { xs: 80, sm: 96 }, 
                height: 'auto', 
                filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' 
              }} 
            />
          </Box>

          {/* Onboarding Card */}
          <Card sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 460 },
            mx: 'auto',
            mt: { xs: 1, sm: 0 },
            backdropFilter: 'blur(12px)',
            backgroundColor: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            borderRadius: 3,
          }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography variant="h4" fontWeight={700} textAlign="center" letterSpacing={0.5}>
                Welcome to Little Barbershop
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                Please fill in your details to get started
              </Typography>

              {errorMsg && (
                <Alert 
                  severity={showLoginPrompt ? "info" : "error"} 
                  sx={{ mt: 2 }}
                  action={
                    showLoginPrompt ? (
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={handleLoginRedirect}
                        sx={{ fontWeight: 600 }}
                      >
                        Login
                      </Button>
                    ) : undefined
                  }
                >
                  {errorMsg}
                  {showLoginPrompt && (
                    <Box sx={{ mt: 1 }}>
                      <MUILink 
                        component="button"
                        onClick={handleLoginRedirect}
                        sx={{ fontWeight: 600, textDecoration: 'underline' }}
                      >
                        Click here to login!
                      </MUILink>
                    </Box>
                  )}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} mt={{ xs: 2, sm: 3 }}>
                <TextField
                  label="Full Name"
                  fullWidth
                  size="small"
                  {...register("fullName")}
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
                
                <TextField
                  label="Phone Number"
                  placeholder="01XXXXXXXX"
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  {...register("phoneNumber")}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message || "Malaysian format: 01XXXXXXXX"}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ 
                    mt: { xs: 2.5, sm: 3 }, 
                    bgcolor: "#111827", 
                    "&:hover": { bgcolor: "#1f2937" } 
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Get Started'}
                </Button>
              </Box>

              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Already have an account?{" "}
                <MUILink 
                  component="button" 
                  onClick={handleLoginRedirect}
                  underline="always" 
                  sx={{ fontWeight: 600 }}
                >
                  Login here
                </MUILink>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </main>
  );
}
