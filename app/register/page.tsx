'use client';

import * as React from "react";
import Link from "next/link";
import { Container, Card, CardContent, Typography, TextField, Button, Box, Stack, Alert } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
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
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

  React.useEffect(() => {
    document.body.classList.add('auth-fixed');
    return () => document.body.classList.remove('auth-fixed');
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
    <main className="relative min-h-screen w-full overflow-hidden select-none">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/littlewp2.jpg)" }}
        aria-hidden
      />

      {/* Subtle dark backdrop for readability */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.25)" }}
        aria-hidden
      />

      {/* Grain PNG overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/images/Grain%20Overlay.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
          mixBlendMode: "multiply",
        }}
        aria-hidden
      />

      {/* Content */}
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" minHeight="100vh" px={{ xs: 1.5, sm: 2 }} pt={{ xs: 6, sm: 8, md: 12 }}>
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
                  type="password"
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />

                <Stack direction="row" spacing={{ xs: 1, sm: 2 }} mt={{ xs: 1.25, sm: 1.5 }} flexWrap="wrap">
                  <Rule ok={rules.length} label="8+ chars" />
                  <Rule ok={rules.upper} label="1 uppercase" />
                  <Rule ok={rules.number} label="1 number" />
                  <Rule ok={rules.special} label="1 special" />
                </Stack>

                <TextField
                  label="Confirm password"
                  type="password"
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  {...register("confirmPassword")}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: { xs: 2.5, sm: 3 }, bgcolor: "#111827", "&:hover": { bgcolor: "#1f2937" } }}
                  disabled={isSubmitting}
                >
                  Create account
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
