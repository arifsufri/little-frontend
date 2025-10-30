'use client';

import * as React from "react";
import Link from "next/link";
import { Container, Card, CardContent, Typography, TextField, Button, Box, Stack, Alert, IconButton, InputAdornment, CircularProgress } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { apiPost } from "../../src/utils/axios";

const PasswordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "At least 1 uppercase letter")
  .regex(/\d/, "At least 1 number")
  .regex(/[^A-Za-z0-9]/, "At least 1 special character");

const RegisterSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

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

  const password = watch("password");
  const rules = {
    length: password?.length >= 8,
    upper: /[A-Z]/.test(password || ""),
    number: /\d/.test(password || ""),
    special: /[^A-Za-z0-9]/.test(password || ""),
  };

  const onSubmit = async (data: RegisterForm) => {
    setErrorMsg(null);
    try {
      const res = await apiPost<{ success: boolean; data: { token: string }; message: string }>(
        '/auth/register',
        { name: data.name, email: data.email, password: data.password }
      );
      
      if (res?.success) {
        // Don't store token or auto-login for staff registration
        // Staff accounts need Boss approval first
        alert('Registration successful! Your account is pending activation by the administrator. Please contact your boss to activate your account, then you can login.');
        router.push('/login');
      } else {
        throw new Error(res?.message || 'Registration failed');
      }
    } catch (e: any) {
        const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Registration failed';
        setErrorMsg(msg);
    }
  };

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <Stack direction="row" spacing={1} alignItems="center">
      {ok ? (
        <CheckCircleOutlineIcon color="success" fontSize="small" />
      ) : (
        <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
      )}
      <Typography variant="caption" color={ok ? "success.main" : "text.secondary"}>
        {label}
      </Typography>
    </Stack>
  );

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
          <Box textAlign="center" sx={{ mb: { xs: 4, sm: 3 } }}>
            <Box component="img" src="/images/LITTLE-BARBERSHOP-LOGO.svg" alt="Little Barbershop" sx={{ width: { xs: 80, sm: 96 }, height: 'auto', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }} />
          </Box>
          <Card sx={{
            width: '100%',
            maxWidth: { xs: '100%', md: 500 },
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
                Create account
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                Join Little Barbershop
              </Typography>

              {errorMsg && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} mt={{ xs: 2, sm: 3 }}>
                <TextField
                  label="Name"
                  fullWidth
                  size="small"
                  {...register("name")}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
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

                <Stack direction="row" spacing={{ xs: 1, sm: 2 }} mt={{ xs: 1.25, sm: 1.5 }} flexWrap="wrap">
                  <Rule ok={rules.length} label="8+ chars" />
                  <Rule ok={rules.upper} label="1 uppercase" />
                  <Rule ok={rules.number} label="1 number" />
                  <Rule ok={rules.special} label="1 special" />
                </Stack>

                <TextField
                  label="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  {...register("confirmPassword")}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
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
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>
              </Box>

              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 underline hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white/70">
                  Sign in
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </main>
  );
}
