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
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPost } from "../../src/utils/axios";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
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
      const res = await apiPost<{ success: boolean; data: { token: string } }>(
        '/auth/login',
        data
      );
      const token = res?.data?.token;
      if (!token) throw new Error('No token received');
      localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Login failed';
      setErrorMsg(msg);
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

              <Box component="form" onSubmit={handleSubmit(onSubmit)} mt={{ xs: 2, sm: 3 }}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  {...register("password")}
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
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: { xs: 2.5, sm: 3 }, bgcolor: "#111827", "&:hover": { bgcolor: "#1f2937" } }}
                  disabled={isSubmitting}
                >
                  Sign in
                </Button>
              </Box>

              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Don&apos;t have an account yet?{" "}
                <MUILink component={NextLink} href="/register" underline="always" sx={{ fontWeight: 600 }}>
                  Create an account
                </MUILink>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </main>
  );
}
