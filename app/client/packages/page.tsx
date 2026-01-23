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
import { apiGet, apiPost } from '../../../src/utils/axios';

// Helper function to get full image URL
const getImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${imageUrl}`;
};

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

  const fetchPackages = async () => {
    try {
      const [packagesResponse, barbersResponse] = await Promise.all([
        apiGet<{ success: boolean; data: Package[] }>('/packages'),
        apiGet<{ success: boolean; data: Barber[] }>('/users/barbers')
      ]);
      
      // Filter to only show active packages for clients
      const activePackages = (packagesResponse.data || []).filter(pkg => pkg.isActive);
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
      // Generate a unique phone number for guest (using timestamp to ensure uniqueness)
      // Format: 01XXXXXXXX (10-11 digits total, starting with 01)
      // Use 01999 prefix + 5-6 random digits to ensure uniqueness
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const guestPhoneNumber = `01999${randomSuffix}`;

      // Create guest client
      const response = await apiPost<{
        success: boolean;
        data: { client: any };
      }>('/clients/register', {
        fullName: guestName.trim(),
        phoneNumber: guestPhoneNumber
      });

      if (response.success) {
        // Store client data
        localStorage.setItem('clientData', JSON.stringify(response.data.client));
        setClientData(response.data.client);
        setShowGuestNameDialog(false);
        setGuestName('');
      }
    } catch (error: any) {
      // If phone number conflict, try again with different number
      if (error?.response?.data?.clientExists || error?.response?.status === 409) {
        // Retry with different phone number using timestamp
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const guestPhoneNumber = `01999${randomSuffix}`;
        
        try {
          const retryResponse = await apiPost<{
            success: boolean;
            data: { client: any };
          }>('/clients/register', {
            fullName: guestName.trim(),
            phoneNumber: guestPhoneNumber
          });

          if (retryResponse.success) {
            localStorage.setItem('clientData', JSON.stringify(retryResponse.data.client));
            setClientData(retryResponse.data.client);
            setShowGuestNameDialog(false);
            setGuestName('');
          }
        } catch (retryError: any) {
          const msg = retryError?.response?.data?.message || retryError?.message || 'Failed to create guest account';
          setGuestErrorMsg(msg);
        }
      } else {
        const msg = error?.response?.data?.message || error?.message || 'Failed to create guest account';
        setGuestErrorMsg(msg);
      }
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
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={700}>
            Welcome, Guest!
          </Typography>
        </DialogTitle>
        <DialogContent>
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
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGuestNameSubmit}
            disabled={creatingGuest || !guestName.trim()}
            sx={{
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              color: 'white',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: '"Inter", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '0.5px',
              textTransform: 'none',
              borderRadius: 2,
              transform: 'scale(1)',
              transition: 'transform 0.1s ease-in-out, all 0.2s ease-in-out',
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                transform: 'translateY(-2px) scale(1)',
              },
              '&:disabled': {
                background: '#9ca3af',
                transform: 'scale(1)',
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
                    imageSrc={getImageUrl(pkg.imageUrl)} 
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
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {selectedPackage && (
          <>
            {/* Hero Section with Image */}
            <Box sx={{ 
              position: 'relative',
              height: 200,
              backgroundImage: getImageUrl(selectedPackage.imageUrl) ? `url(${getImageUrl(selectedPackage.imageUrl)})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: getImageUrl(selectedPackage.imageUrl) ? 'transparent' : '#1a1a1a',
              display: 'flex',
              alignItems: 'flex-end',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: getImageUrl(selectedPackage.imageUrl)
                  ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'
                  : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                backgroundSize: getImageUrl(selectedPackage.imageUrl) ? 'auto' : '200% 200%',
                animation: getImageUrl(selectedPackage.imageUrl) ? 'none' : 'gradientShift 3s ease infinite',
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
                {!getImageUrl(selectedPackage.imageUrl) && (
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
                    mb: getImageUrl(selectedPackage.imageUrl) ? 1 : 0, 
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    fontFamily: '"Inter", "Manrope", sans-serif',
                    letterSpacing: '0.5px'
                  }}
                >
                  {selectedPackage.name}
                </Typography>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3 }}>
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

              {/* Barber Selection */}
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

              {/* Additional Services - Dropdown with Checkboxes */}
              {getAvailableAdditionalServices().length > 0 && (
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
                            secondary={`${service.duration} mins • +RM${service.price}`}
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
                              {service.name} ({service.duration} mins)
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

              {/* Duration and Price */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        opacity: 0.9, 
                        mb: 1,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}
                    >
                      Duration
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight={700}
                      sx={{
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {selectedPackage.duration} mins
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: 2, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        opacity: 0.95, 
                        mb: 1,
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontWeight: 500,
                        fontSize: '0.85rem'
                      }}
                    >
                      Total Price
                    </Typography>
                    <Typography 
                      variant="h5" 
                      fontWeight={700}
                      sx={{
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        letterSpacing: '0.5px'
                      }}
                    >
                      RM{totalPrice}
                    </Typography>
                    {additionalServices.length > 0 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.9, 
                          display: 'block', 
                          mt: 0.5,
                          fontFamily: '"Inter", "Manrope", sans-serif',
                          fontSize: '0.7rem'
                        }}
                      >
                        Base: RM{selectedPackage.price} + Extras: RM{totalPrice - selectedPackage.price}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleBookPackage}
                disabled={booking || bookingSuccess}
                sx={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  color: 'white',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  fontFamily: '"Inter", "Manrope", sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                  transform: 'scale(1)',
                  transition: 'transform 0.1s ease-in-out, all 0.2s ease-in-out',
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                    boxShadow: '0 6px 16px rgba(220, 38, 38, 0.5)',
                    transform: 'translateY(-2px) scale(1)',
                  },
                  '&:disabled': {
                    background: '#9ca3af',
                    boxShadow: 'none',
                    transform: 'scale(1)',
                  }
                }}
              >
                {booking ? 'Booking...' : bookingSuccess ? 'Booked Successfully!' : 'Book Your Slot Now!'}
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

