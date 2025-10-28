'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
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
const LoginSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^01[0-9]{8,9}$/, 'Phone number must be in Malaysian format (01XXXXXXXX)')
    .min(10, 'Phone number must be at least 10 digits')
    .max(11, 'Phone number must be at most 11 digits')
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function ClientLoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

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

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg(null);
    
    try {
      const response = await apiPost<{
        success: boolean;
        data: { client: any };
      }>('/clients/login', data);

      if (response.success) {
        // Store client data in localStorage for the session
        localStorage.setItem('clientData', JSON.stringify(response.data.client));
        // Redirect to packages page
        router.push('/client/packages');
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setErrorMsg('No account found with this phone number. Please register first.');
      } else {
        const msg = e?.response?.data?.message || e?.message || 'Login failed';
        setErrorMsg(msg);
      }
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

          {/* Login Card */}
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
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                Login to Little Barbershop
              </Typography>

              {errorMsg && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} mt={{ xs: 2, sm: 3 }}>
                <TextField
                  label="Phone Number"
                  placeholder="01XXXXXXXX"
                  fullWidth
                  size="small"
                  {...register("phoneNumber")}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message || "Enter your registered phone number"}
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
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </Box>

              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Don&apos;t have an account?{" "}
                <MUILink 
                  component={NextLink}
                  href="/client/onboarding"
                  underline="always" 
                  sx={{ fontWeight: 600 }}
                >
                  Register here
                </MUILink>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </main>
  );
}
