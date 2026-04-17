'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Chip,
  ListItemText,
  TextField,
  Avatar,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ProductCard from '../../../components/dashboard/ProductCard';
import LoyaltyFlipCard from '../../../components/client/LoyaltyFlipCard';
import useSWR from 'swr';
import { apiGet, apiPost } from '../../../src/utils/axios';
import { useSocketSWRInvalidate } from '../../../src/hooks/useSocketSWRInvalidate';
import { motion, useReducedMotion } from 'framer-motion';

// Helper function to get full image URL
const getImageUrl = (imageUrl?: string | null, version?: string): string | undefined => {
  if (!imageUrl) return undefined;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  return version ? `${baseUrl}${imageUrl}?v=${encodeURIComponent(version)}` : `${baseUrl}${imageUrl}`;
};

/** Toggle to show the "Choose Your Barber" block in the booking dialog. */
const SHOW_BARBER_SELECTION = false;

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  barber?: string;
  duration: number;
  discountCode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Barber {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Client {
  id: number;
  clientId: string;
  fullName: string;
  phoneNumber: string | null;
  loyaltyProgress?: number;
  loyaltyCycleCount?: number;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function ClientPackagesPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);
  const [clientData, setClientData] = React.useState<Client | null>(null);
  const [booking, setBooking] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Guest name popup state
  const [isGuest, setIsGuest] = React.useState(false);
  const [showGuestNameDialog, setShowGuestNameDialog] = React.useState(false);
  const [guestName, setGuestName] = React.useState('');
  const [creatingGuest, setCreatingGuest] = React.useState(false);
  const [guestErrorMsg, setGuestErrorMsg] = React.useState<string | null>(null);
  
  // Booking form state
  const [selectedBarber, setSelectedBarber] = React.useState<number | ''>('');
  const [additionalServices, setAdditionalServices] = React.useState<number[]>([]);
  const [totalPrice, setTotalPrice] = React.useState(0);

  const { data: packagesPortal, isLoading: loading } = useSWR(
    ['swr:packages', 'client-portal'],
    async () => {
      const [packagesResponse, barbersResponse] = await Promise.all([
        apiGet<{ success: boolean; data: Package[] }>('/packages'),
        apiGet<{ success: boolean; data: Barber[] }>('/users/barbers'),
      ]);
      const activePackages = (packagesResponse.data || [])
        .filter((pkg) => pkg.isActive)
        .sort((a, b) => b.price - a.price);
      const staffBarbers = (barbersResponse.data || []).filter((barber) => barber.role !== 'Boss');
      return { packages: activePackages, barbers: staffBarbers };
    },
    { revalidateOnFocus: true }
  );

  const packages = packagesPortal?.packages ?? [];
  const barbers = packagesPortal?.barbers ?? [];

  const loyaltySwrKey = clientData?.id
    ? (['swr:clients', 'loyalty', clientData.id] as const)
    : null;

  const { data: loyaltyResponse } = useSWR(
    loyaltySwrKey,
    async ([, , id]) =>
      apiGet<{
        success: boolean;
        data: {
          loyaltyProgress: number;
          loyaltyCycleCount?: number;
          phoneNumber?: string | null;
          fullName?: string;
          clientId?: string;
        };
      }>(`/clients/${id}/loyalty`),
    { revalidateOnFocus: true }
  );

  const loyaltyProgress =
    loyaltyResponse?.success && loyaltyResponse.data
      ? loyaltyResponse.data.loyaltyProgress ?? 0
      : clientData?.loyaltyProgress ?? 0;

  useSocketSWRInvalidate();

  // Staff may have linked a phone at checkout — merge server profile into session when SWR loyalty loads.
  React.useEffect(() => {
    if (!loyaltyResponse?.success || !loyaltyResponse.data || !clientData) return;
    const d = loyaltyResponse.data;
    if (!d.phoneNumber || clientData.phoneNumber) return;
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    setClientData((prev) => {
      if (!prev) return prev;
      const next: Client = {
        ...prev,
        phoneNumber: d.phoneNumber ?? prev.phoneNumber,
        loyaltyProgress: d.loyaltyProgress ?? prev.loyaltyProgress,
        loyaltyCycleCount: d.loyaltyCycleCount ?? prev.loyaltyCycleCount,
        fullName: d.fullName ?? prev.fullName,
        clientId: d.clientId ?? prev.clientId,
      };
      localStorage.setItem('clientData', JSON.stringify(next));
      return next;
    });
  }, [loyaltyResponse, clientData]);

  // Check if client is logged in or is a guest
  React.useEffect(() => {
    const storedClientData = localStorage.getItem('clientData');
    const guestFlag = localStorage.getItem('isGuest');
    
    if (guestFlag === 'true') {
      setIsGuest(true);
      // If guest but no client data, show name dialog
    if (!storedClientData) {
        setShowGuestNameDialog(true);
        return;
      }
      // If guest has client data, use it
      try {
        const client = JSON.parse(storedClientData);
        setClientData(client);
      } catch (error) {
        console.error('Error parsing client data:', error);
        setShowGuestNameDialog(true);
      }
    } else if (!storedClientData) {
      // Not a guest and no client data, redirect to onboarding
      router.push('/client/onboarding');
      return;
    } else {
      // Regular logged-in client
    try {
      const client = JSON.parse(storedClientData);
      setClientData(client);
    } catch (error) {
      console.error('Error parsing client data:', error);
      router.push('/client/onboarding');
      }
    }
  }, [router]);

  // Calculate total price when services change
  React.useEffect(() => {
    if (!selectedPackage) return;
    
    let total = selectedPackage.price;
    
    // Add prices of additional services
    additionalServices.forEach(serviceId => {
      const service = packages.find(pkg => pkg.id === serviceId);
      if (service) {
        total += service.price;
      }
    });
    
    setTotalPrice(total);
  }, [selectedPackage, additionalServices, packages]);

  const handleCardClick = (pkg: Package) => {
    setSelectedPackage(pkg);
    setErrorMsg(null);
    setBookingSuccess(false);
    // Reset booking form
    setSelectedBarber('');
    setAdditionalServices([]);
  };

  const handleBookPackage = async () => {
    if (!selectedPackage || !clientData) return;

    setBooking(true);
    setErrorMsg(null);

    try {
      const bookingData: any = {
        clientId: clientData.id,
        packageId: selectedPackage.id,
        notes: `Booked via client portal by ${clientData.fullName}`
      };

      // Add barber if selected
      if (selectedBarber) {
        bookingData.barberId = selectedBarber;
      }

      // Add additional services if selected
      if (additionalServices.length > 0) {
        bookingData.additionalPackages = additionalServices;
      }

      const response = await apiPost<{ success: boolean; data: any }>('/appointments', bookingData);

      if (response.success) {
        setBookingSuccess(true);
        // Auto-close modal after 2 seconds
        setTimeout(() => {
          setSelectedPackage(null);
          setBookingSuccess(false);
        }, 2000);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Booking failed';
      setErrorMsg(msg);
    } finally {
      setBooking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientData');
    localStorage.removeItem('isGuest');
    router.push('/client/onboarding');
  };

  const handleGuestNameSubmit = async () => {
    if (!guestName.trim()) {
      setGuestErrorMsg('Please enter your name');
      return;
    }

    setCreatingGuest(true);
    setGuestErrorMsg(null);

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
        setClientData(response.data.client);
        setShowGuestNameDialog(false);
        setGuestName('');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create guest account';
      setGuestErrorMsg(msg);
    } finally {
      setCreatingGuest(false);
    }
  };

  const handleAdditionalServiceChange = (serviceId: number, checked: boolean) => {
    if (checked) {
      setAdditionalServices(prev => [...prev, serviceId]);
    } else {
      setAdditionalServices(prev => prev.filter(id => id !== serviceId));
    }
  };

  const getAvailableAdditionalServices = () => {
    return packages.filter(pkg => pkg.id !== selectedPackage?.id);
  };

  if (!clientData && !showGuestNameDialog) {
    return null; // Will redirect to onboarding or show dialog
  }

  return (
    <>
      {/* Guest Name Dialog */}
      <Dialog 
        open={showGuestNameDialog} 
        onClose={() => {}} // Prevent closing without entering name
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)'
          }
        }}
      >
        <DialogTitle sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248, 250, 252, 0.9)' }}>
          <Typography variant="h5" fontWeight={700}>
            Welcome, Guest!
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5, bgcolor: '#fcfcfd' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please enter your name to continue booking
          </Typography>
          
          {guestErrorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {guestErrorMsg}
            </Alert>
          )}

          <TextField
            label="Your Name"
            placeholder="Enter your name"
            fullWidth
            value={guestName}
            onChange={(e) => {
              setGuestName(e.target.value);
              setGuestErrorMsg(null);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && guestName.trim()) {
                handleGuestNameSubmit();
              }
            }}
            autoFocus
            disabled={creatingGuest}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248, 250, 252, 0.85)' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGuestNameSubmit}
            disabled={creatingGuest || !guestName.trim()}
            sx={{
              bgcolor: '#dc2626',
              color: '#fff',
              py: 1.2,
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: '"Inter", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: '0 8px 20px rgba(220, 38, 38, 0.28)',
              '&:hover': {
                bgcolor: '#b91c1c',
                boxShadow: '0 10px 24px rgba(185, 28, 28, 0.34)',
              },
              '&:disabled': {
                background: '#9ca3af',
                boxShadow: 'none',
              }
            }}
          >
            {creatingGuest ? 'Creating...' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Content - Only show if client data exists */}
      {clientData && (
        <>
          {/* Ambient background (exclusive feel, subtle motion) */}
          <Box
            aria-hidden
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              bgcolor: '#f4f4f7',
            }}
          >
            {!prefersReducedMotion ? (
              <>
                <motion.div
                  style={{
                    position: 'absolute',
                    width: 'min(120vw, 820px)',
                    height: 'min(120vw, 820px)',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(185, 28, 28, 0.14) 0%, rgba(185, 28, 28, 0) 68%)',
                    top: '-18%',
                    left: '-28%',
                    filter: 'blur(48px)',
                  }}
                  animate={{ x: [0, 24, 0], y: [0, 18, 0] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  style={{
                    position: 'absolute',
                    width: 'min(100vw, 640px)',
                    height: 'min(100vw, 640px)',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(127, 29, 29, 0.1) 0%, rgba(127, 29, 29, 0) 68%)',
                    bottom: '-12%',
                    right: '-22%',
                    filter: 'blur(48px)',
                  }}
                  animate={{ x: [0, -20, 0], y: [0, -14, 0] }}
                  transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
                <motion.div
                  style={{
                    position: 'absolute',
                    width: 'min(80vw, 420px)',
                    height: 'min(80vw, 420px)',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(254, 202, 202, 0.35) 0%, transparent 65%)',
                    top: '42%',
                    left: '50%',
                    filter: 'blur(36px)',
                  }}
                  animate={{
                    x: '-50%',
                    opacity: [0.45, 0.75, 0.45],
                    scale: [1, 1.06, 1],
                  }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
              </>
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(185,28,28,0.08), transparent 55%), radial-gradient(ellipse 70% 45% at 100% 100%, rgba(127,29,29,0.06), transparent 50%)',
                }}
              />
            )}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.4,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.028'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </Box>

          {/* Header */}
          <AppBar
            position="sticky"
            component={motion.div}
            initial={prefersReducedMotion ? false : { opacity: 0, y: -14 }}
            animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: easeOut }}
            elevation={0}
            sx={{
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.78)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              color: 'black',
              boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
              borderBottom: '1px solid rgba(185, 28, 28, 0.08)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 2,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(185,28,28,0.25) 20%, rgba(185,28,28,0.45) 50%, rgba(185,28,28,0.25) 80%, transparent 100%)',
                opacity: 0.9,
              },
            }}
          >
            <Toolbar sx={{ py: 1.25, position: 'relative', zIndex: 1 }}>
              <Box
                component={motion.div}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={prefersReducedMotion ? false : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: easeOut, delay: 0.05 }}
              >
                <Box
                  component="img"
                  src="/images/LITTLE-BARBERSHOP-LOGO.svg"
                  alt="Logo"
                  sx={{ height: { xs: 48, sm: 56 }, mr: 2, display: 'block' }}
                />
              </Box>
              <Box sx={{ flexGrow: 1 }} />
              <Box
                component={motion.div}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 14 }}
                animate={prefersReducedMotion ? false : { opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
                sx={{ display: 'flex', alignItems: 'stretch' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.25, sm: 1.75 },
                    pl: { xs: 1.25, sm: 1.75 },
                    pr: { xs: 1, sm: 1.5 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 2.5,
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255, 250, 250, 0.92) 100%)',
                    boxShadow:
                      '0 4px 18px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 38, sm: 44 },
                      height: { xs: 38, sm: 44 },
                      fontSize: { xs: '0.95rem', sm: '1.05rem' },
                      fontWeight: 800,
                      fontFamily: '"Inter", "Manrope", sans-serif',
                      color: '#fff',
                      background: 'linear-gradient(145deg, #dc2626 0%, #991b1b 55%, #7f1d1d 100%)',
                      boxShadow: '0 2px 10px rgba(185, 28, 28, 0.35)',
                      border: '2px solid rgba(255,255,255,0.85)',
                    }}
                  >
                    {(clientData.fullName?.trim().charAt(0) || '?').toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0, pr: { xs: 0.5, sm: 1 } }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontSize: '0.62rem',
                        lineHeight: 1.2,
                        color: 'text.secondary',
                        fontFamily: '"Inter", "Manrope", sans-serif',
                      }}
                    >
                      {isGuest ? 'Guest visit' : 'Member'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        color: 'text.primary',
                        lineHeight: 1.25,
                        mt: 0.25,
                        maxWidth: { xs: 100, sm: 200, md: 260 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {clientData.fullName}
                    </Typography>
                  </Box>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ borderColor: 'rgba(15, 23, 42, 0.1)', alignSelf: 'stretch', my: 0.5 }}
                  />
                  <Tooltip title="Sign out of your session">
                    <Button
                      onClick={handleLogout}
                      size="small"
                      sx={{
                        alignSelf: 'stretch',
                        minWidth: { xs: 44, sm: 'auto' },
                        px: { xs: 1, sm: 1.75 },
                        py: 0.5,
                        borderRadius: 1.5,
                        mr: { xs: 0.75, sm: 1 },
                        textTransform: 'none',
                        fontWeight: 700,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        color: '#64748b',
                        bgcolor: 'transparent',
                        gap: 0.75,
                        '&:hover': {
                          bgcolor: 'rgba(220, 38, 38, 0.09)',
                          color: '#b91c1c',
                        },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: { xs: 20, sm: 20 } }} />
                      <Box
                        component="span"
                        sx={{ display: { xs: 'none', sm: 'inline' } }}
                      >
                        Sign out
                      </Box>
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              minHeight: 'calc(100vh - 64px)',
              background:
                'linear-gradient(180deg, rgba(250, 250, 252, 0.55) 0%, rgba(255, 255, 255, 0.35) 45%, rgba(255, 255, 255, 0.5) 100%)',
              pb: 6,
            }}
          >
            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
              {(!isGuest || Boolean(clientData?.phoneNumber)) && (
                <Box
                  component={motion.div}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
                  animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: easeOut, delay: 0.08 }}
                  sx={{ mb: { xs: 2.5, sm: 3.5 } }}
                >
                  <LoyaltyFlipCard progress={loyaltyProgress} />
                </Box>
              )}
              {/* Packages Grid */}
              <Grid
                component={motion.div}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={prefersReducedMotion ? false : { opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                container
                spacing={{ xs: 2, sm: 3 }}
                sx={{ m: 0, width: '100%' }}
              >
                {packages && packages.length > 0 ? (
                  packages.map((pkg, index) => (
                    <Grid item xs={6} sm={6} md={4} lg={3} xl={3} key={pkg.id}>
                      <Box
                        component={motion.div}
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                        animate={prefersReducedMotion ? false : { opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.45,
                          ease: easeOut,
                          delay: prefersReducedMotion ? 0 : 0.06 * index,
                        }}
                        sx={{
                          height: '100%',
                          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                          },
                        }}
                      >
                        <ProductCard
                          title={pkg.name}
                          price={`RM${pkg.price}`}
                          imageSrc={getImageUrl(pkg.imageUrl, pkg.updatedAt)}
                          onClick={() => handleCardClick(pkg)}
                        />
                      </Box>
                    </Grid>
                  ))
                ) : (
            loading ? (
              <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontWeight: 500
                      }}
                    >
                  Loading packages...
                </Typography>
                  </Box>
              </Grid>
            ) : (
              <Grid item xs={12}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    px: 2
                  }}>
                    <Typography 
                      variant="h6" 
                      color="text.secondary"
                      sx={{
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontWeight: 500
                      }}
                    >
                  No packages available yet.
                </Typography>
                  </Box>
              </Grid>
            )
          )}
        </Grid>
      </Container>
      </Box>

      {/* Package Details Modal */}
      <Dialog 
        open={!!selectedPackage} 
        onClose={() => setSelectedPackage(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
            maxHeight: '90vh',
          }
        }}
      >
        {selectedPackage && (
          <>
            {/* Hero Section with Image */}
            <Box sx={{ 
              position: 'relative',
              height: 200,
              backgroundImage: getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt) ? `url(${getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt)})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt) ? 'transparent' : '#1a1a1a',
              display: 'flex',
              alignItems: 'flex-end',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt)
                  ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'
                  : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                backgroundSize: getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt) ? 'auto' : '200% 200%',
                animation: getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt) ? 'none' : 'gradientShift 3s ease infinite',
                '@keyframes gradientShift': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' }
                },
                zIndex: 1
              }
            }}>
              {/* Close Button */}
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPackage(null);
                }} 
                sx={{ 
                  position: 'absolute', 
                  right: 16, 
                  top: 16, 
                  zIndex: 2,
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  width: 40,
                  height: 40,
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,1)',
                    transform: 'rotate(90deg)',
                    transition: 'transform 0.2s ease-in-out'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <CloseIcon />
              </IconButton>
              
              {/* Title */}
              <Box sx={{ position: 'relative', zIndex: 2, p: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <ContentCutIcon sx={{ fontSize: 40, opacity: 0.9, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      color="white" 
                      sx={{ 
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        lineHeight: 1.2,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                      }}
                    >
                      {selectedPackage.name}
                    </Typography>
                  </Box>
                )}
                <Typography 
                  variant="h4" 
                  fontWeight={800} 
                  color="white" 
                  sx={{ 
                    mb: getImageUrl(selectedPackage.imageUrl, selectedPackage.updatedAt) ? 1 : 0, 
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    fontFamily: '"Inter", "Manrope", sans-serif',
                    letterSpacing: '0.5px'
                  }}
                >
                  {selectedPackage.name}
                </Typography>
              </Box>
            </Box>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#fcfcfd' }}>
              {bookingSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Booking successful! We&apos;ll contact you soon to confirm your appointment.
                </Alert>
              )}

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              {/* Barber Selection — hidden until SHOW_BARBER_SELECTION is true */}
              {SHOW_BARBER_SELECTION && (
                <Box sx={{ mb: 3 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      mb: 2,
                      fontFamily: '"Inter", "Manrope", sans-serif',
                      letterSpacing: '0.3px'
                    }}
                  >
                    Choose Your Barber
                  </Typography>
                  <FormControl 
                    fullWidth 
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                      }
                    }}
                  >
                    <InputLabel>Select Barber (Optional)</InputLabel>
                    <Select
                      value={selectedBarber}
                      onChange={(e) => setSelectedBarber(e.target.value as number | '')}
                      label="Select Barber (Optional)"
                    >
                      <MenuItem value="">
                        <em>Any Available Barber</em>
                      </MenuItem>
                      {barbers.map((barber) => (
                        <MenuItem key={barber.id} value={barber.id}>
                          {barber.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Additional Services - Dropdown with Checkboxes */}
              {getAvailableAdditionalServices().length > 0 && (
                <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={700} 
                    sx={{ 
                      mb: 2,
                      fontFamily: '"Inter", "Manrope", sans-serif',
                      letterSpacing: '0.3px'
                    }}
                  >
                    Add More Services
                  </Typography>
                  <FormControl 
                    fullWidth 
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                      }
                    }}
                  >
                    <InputLabel>Select Additional Services</InputLabel>
                    <Select
                      multiple
                      value={additionalServices}
                      onChange={(e) => setAdditionalServices(e.target.value as number[])}
                      label="Select Additional Services"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((serviceId) => {
                            const service = packages.find(pkg => pkg.id === serviceId);
                            return service ? (
                              <Chip 
                                key={serviceId} 
                                label={`${service.name} (+RM${service.price})`} 
                                size="small"
                                sx={{ 
                                  height: 26,
                                  fontFamily: '"Inter", "Manrope", sans-serif',
                                  fontWeight: 500
                                }}
                              />
                            ) : null;
                          })}
                        </Box>
                      )}
                    >
                      {getAvailableAdditionalServices().map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          <Checkbox checked={additionalServices.includes(service.id)} />
                          <ListItemText 
                            primary={service.name}
                            secondary={`+RM${service.price}`}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontFamily: '"Inter", "Manrope", sans-serif',
                                fontWeight: 500
                              },
                              '& .MuiListItemText-secondary': {
                                fontFamily: '"Inter", "Manrope", sans-serif',
                              }
                            }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* Show selected services summary */}
                  {additionalServices.length > 0 && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2.5, 
                      bgcolor: 'rgba(0,0,0,0.02)', 
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={700} 
                        sx={{ 
                          mb: 1.5,
                          fontFamily: '"Inter", "Manrope", sans-serif',
                          color: 'text.primary'
                        }}
                      >
                        Selected Additional Services:
                      </Typography>
                      {additionalServices.map(serviceId => {
                        const service = packages.find(pkg => pkg.id === serviceId);
                        return service ? (
                          <Box 
                            key={serviceId} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mb: 1,
                              pb: 1,
                              borderBottom: '1px solid rgba(0,0,0,0.05)',
                              '&:last-child': {
                                borderBottom: 'none',
                                mb: 0,
                                pb: 0
                              }
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                fontFamily: '"Inter", "Manrope", sans-serif',
                                fontWeight: 500
                              }}
                            >
                              {service.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={700} 
                              color="primary"
                              sx={{
                                fontFamily: '"Inter", "Manrope", sans-serif',
                              }}
                            >
                              +RM{service.price}
                            </Typography>
                          </Box>
                        ) : null;
                      })}
                    </Box>
                  )}
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Price Summary */}
              <Box
                sx={{
                  mb: 2.5,
                  p: 2.5,
                  borderRadius: 2.5,
                  border: '1px solid #fecaca',
                  background: 'linear-gradient(135deg, #fff5f5 0%, #fff 65%)',
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: '#991b1b',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  Booking Summary
                </Typography>
                <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Package price
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    RM{selectedPackage.price}
                  </Typography>
                </Box>
                {additionalServices.length > 0 && (
                  <Box sx={{ mt: 0.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Additional services
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      RM{totalPrice - selectedPackage.price}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1.25 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Total
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#b91c1c' }}>
                    RM{totalPrice}
                  </Typography>
                </Box>
              </Box>

            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => setSelectedPackage(null)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  py: 1.1,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleBookPackage}
                disabled={booking || bookingSuccess}
                sx={{
                  bgcolor: '#dc2626',
                  color: '#fff',
                  py: 1.1,
                  px: 2.75,
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: '"Inter", "Manrope", sans-serif',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.28)',
                  '&:hover': {
                    bgcolor: '#b91c1c',
                    boxShadow: '0 10px 24px rgba(185, 28, 28, 0.34)',
                  },
                  '&:disabled': {
                    background: '#9ca3af',
                    boxShadow: 'none',
                  }
                }}
              >
                    {booking ? 'Booking...' : bookingSuccess ? 'Booked Successfully!' : 'Confirm Booking'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
        </>
      )}
    </>
  );
}

