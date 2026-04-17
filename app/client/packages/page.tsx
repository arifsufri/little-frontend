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
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ProductCard from '../../../components/dashboard/ProductCard';
import LoyaltyFlipCard from '../../../components/client/LoyaltyFlipCard';
import { apiGet, apiPost } from '../../../src/utils/axios';

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
  phoneNumber: string;
  loyaltyProgress?: number;
  loyaltyCycleCount?: number;
}

export default function ClientPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [barbers, setBarbers] = React.useState<Barber[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);
  const [clientData, setClientData] = React.useState<Client | null>(null);
  const [booking, setBooking] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [loyaltyProgress, setLoyaltyProgress] = React.useState(0);
  
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

  // Fetch packages on component mount
  React.useEffect(() => {
    fetchPackages();
  }, []);

  React.useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!clientData?.id) return;
      try {
        const response = await apiGet<{
          success: boolean;
          data: { loyaltyProgress: number };
        }>(`/clients/${clientData.id}/loyalty`);
        if (response.success) {
          setLoyaltyProgress(response.data.loyaltyProgress ?? 0);
        }
      } catch (error) {
        setLoyaltyProgress(clientData.loyaltyProgress ?? 0);
      }
    };
    fetchLoyaltyStatus();
  }, [clientData]);

  const fetchPackages = async () => {
    try {
      const [packagesResponse, barbersResponse] = await Promise.all([
        apiGet<{ success: boolean; data: Package[] }>('/packages'),
        apiGet<{ success: boolean; data: Barber[] }>('/users/barbers')
      ]);
      
      // Filter to only show active packages for clients
      const activePackages = (packagesResponse.data || [])
        .filter(pkg => pkg.isActive)
        .sort((a, b) => b.price - a.price);
      setPackages(activePackages);
      
      // Filter out Boss role from barber selection
      const staffBarbers = (barbersResponse.data || []).filter((barber: any) => barber.role !== 'Boss');
      setBarbers(staffBarbers);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPackages([]);
      setBarbers([]);
    } finally {
      setLoading(false);
    }
  };

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
          {/* Header */}
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          color: 'black', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box 
            component="img" 
            src="/images/LITTLE-BARBERSHOP-LOGO.svg" 
            alt="Logo" 
            sx={{ height: { xs: 48, sm: 56 }, mr: 2 }} 
          />
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.03)'
            }}>
              <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  fontFamily: '"Inter", "Manrope", sans-serif'
                }}
              >
              {clientData.fullName}
            </Typography>
            </Box>
            <Button 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              variant="outlined"
              size="small"
              sx={{
                borderColor: 'rgba(0,0,0,0.2)',
                color: 'text.primary',
                fontWeight: 600,
                fontFamily: '"Inter", "Manrope", sans-serif',
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  borderColor: 'rgba(0,0,0,0.3)',
                  bgcolor: 'rgba(0,0,0,0.05)'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ 
        minHeight: 'calc(100vh - 64px)',
        background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
        pb: 6
      }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
        <Box sx={{ mb: { xs: 2.5, sm: 3.5 } }}>
          <LoyaltyFlipCard progress={loyaltyProgress} />
        </Box>
        {/* Packages Grid */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ m: 0, width: '100%' }}>
          {packages && packages.length > 0 ? packages.map((pkg) => (
              <Grid item xs={6} sm={6} md={4} lg={3} xl={3} key={pkg.id}>
                <Box
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    }
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
          )) : (
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

