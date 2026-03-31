'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Link as MUILink,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPost } from "../../src/utils/axios";

const LoginSchema = z.object({
  email: z.string().email("Invalid email").optional(),
  password: z.string().min(1, "Password is required").optional(),
  idNumber: z.string().regex(/^\d{4}$/, "ID number must be 4 digits").optional(),
}).refine((data) => {
  // Either email+password OR idNumber must be provided
  return (data.email && data.password) || data.idNumber;
}, {
  message: "Please provide either email and password, or ID number",
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginMode, setLoginMode] = React.useState<'id' | 'email'>('id'); // Default to ID login
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
      // Prepare login data based on mode
      const loginData = loginMode === 'id' 
        ? { idNumber: data.idNumber }
        : { email: data.email, password: data.password };

      const res = await apiPost<{ success: boolean; data: { token: string } }>(
        '/auth/login',
        loginData
      );
      const token = res?.data?.token;
      if (!token) throw new Error('No token received');
      localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (e: any) {
      // Get the specific error message from the backend
      const errorResponse = e?.response?.data;
      let msg = 'Login failed. Please try again.';
      
      if (errorResponse?.error === 'Email not registered') {
        msg = 'This email is not registered. Please check your email or create an account.';
      } else if (errorResponse?.error === 'Wrong password') {
        msg = 'The password you entered is incorrect. Please try again.';
      } else if (errorResponse?.error === 'ID number not found') {
        msg = 'This ID number is not registered. Please contact your boss.';
      } else if (errorResponse?.error === 'Account not activated') {
        msg = 'Your account is pending activation. Please contact your administrator.';
      } else if (errorResponse?.message) {
        msg = errorResponse.message;
      } else if (e?.message) {
        msg = e.message;
      }
      
      setErrorMsg(msg);
      
      // Don't reset form fields on error - keep user's input
      // The error message will persist until user tries again or types in fields
    }
  };

  // Clear error message when user starts typing
  const handleInputChange = () => {
    if (errorMsg) {
      setErrorMsg(null);
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
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" px={{ xs: 1.5, sm: 2 }}>
          <Box textAlign="center" sx={{ mb: { xs: 10, sm: 9 } }}>
            <Box component="img" src="/images/LITTLE-BARBERSHOP-LOGO.svg" alt="Little Barbershop" sx={{ width: { xs: 80, sm: 96 }, height: 'auto', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }} />
          </Box>
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
                Login
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                Sign in to Little Barbershop
              </Typography>

              {errorMsg && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              {/* Login Mode Toggle */}
              <Box sx={{ display: 'flex', gap: 1, mt: 3, mb: 2 }}>
                <Button
                  fullWidth
                  variant={loginMode === 'id' ? 'contained' : 'outlined'}
                  onClick={() => setLoginMode('id')}
                  sx={{
                    bgcolor: loginMode === 'id' ? '#111827' : 'transparent',
                    color: loginMode === 'id' ? 'white' : '#111827',
                    borderColor: '#111827',
                    '&:hover': {
                      bgcolor: loginMode === 'id' ? '#1f2937' : 'rgba(17, 24, 39, 0.04)',
                      borderColor: '#111827',
                    }
                  }}
                >
                  Staff ID
                </Button>
                <Button
                  fullWidth
                  variant={loginMode === 'email' ? 'contained' : 'outlined'}
                  onClick={() => setLoginMode('email')}
                  sx={{
                    bgcolor: loginMode === 'email' ? '#111827' : 'transparent',
                    color: loginMode === 'email' ? 'white' : '#111827',
                    borderColor: '#111827',
                    '&:hover': {
                      bgcolor: loginMode === 'email' ? '#1f2937' : 'rgba(17, 24, 39, 0.04)',
                      borderColor: '#111827',
                    }
                  }}
                >
                  Boss Login
                </Button>
              </Box>

              <Box 
                component="form" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(onSubmit)(e);
                }} 
                mt={{ xs: 2, sm: 2 }}
              >
                {loginMode === 'id' ? (
                  // Staff ID Login
                  <TextField
                    label="Staff ID Number"
                    type="text"
                    fullWidth
                    size="small"
                    placeholder="Enter 4-digit ID"
                    inputProps={{ maxLength: 4, pattern: '[0-9]*' }}
                    {...register("idNumber", {
                      onChange: () => handleInputChange()
                    })}
                    error={!!errors.idNumber}
                    helperText={errors.idNumber?.message || "Enter your 4-digit staff ID number"}
                  />
                ) : (
                  // Boss Email/Password Login
                  <>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      size="small"
                      {...register("email", {
                        onChange: () => handleInputChange()
                      })}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                    <TextField
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      fullWidth
                      size="small"
                      sx={{ mt: 2 }}
                      {...register("password", {
                        onChange: () => handleInputChange()
                      })}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ 
                    mt: { xs: 2.5, sm: 3 }, 
                    bgcolor: "#111827", 
                    "&:hover": { bgcolor: "#1f2937" },
                    "&:disabled": { bgcolor: "#374151" },
                    minHeight: 42
                  }}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </Box>

              {loginMode === 'email' && (
                <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                  Don&apos;t have an account yet?{" "}
                  <MUILink component={NextLink} href="/register" underline="always" sx={{ fontWeight: 600 }}>
                    Create an account
                  </MUILink>
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </main>
  );
}
