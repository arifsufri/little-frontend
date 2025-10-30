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
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ProductCard from '../../../components/dashboard/ProductCard';
import { apiGet, apiPost } from '../../../src/utils/axios';

// Helper function to get full image URL
const getImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return '/images/packages/default.jpg';
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
  
  // Booking form state
  const [selectedBarber, setSelectedBarber] = React.useState<number | ''>('');
  const [additionalServices, setAdditionalServices] = React.useState<number[]>([]);
  const [totalPrice, setTotalPrice] = React.useState(0);

  // Check if client is logged in
  React.useEffect(() => {
    const storedClientData = localStorage.getItem('clientData');
    if (!storedClientData) {
      router.push('/client/onboarding');
      return;
    }
    
    try {
      const client = JSON.parse(storedClientData);
      setClientData(client);
    } catch (error) {
      console.error('Error parsing client data:', error);
      router.push('/client/onboarding');
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
      setBarbers(barbersResponse.data || []);
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
    router.push('/client/onboarding');
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

  if (!clientData) {
    return null; // Will redirect to onboarding
  }

  return (
    <>
      {/* Header */}
      <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'black', boxShadow: 1 }}>
        <Toolbar>
          <Box component="img" src="/images/LITTLE-BARBERSHOP-LOGO.svg" alt="Logo" sx={{ height: 32, mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Little Barbershop
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ mr: 2 }}>
              {clientData.fullName}
            </Typography>
            <Button 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              variant="outlined"
              size="small"
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            Our Services
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a service to book your appointment
          </Typography>
        </Box>

        {/* Packages Grid */}
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ m: 0, width: '100%' }}>
          {packages && packages.length > 0 ? packages.map((pkg) => (
            <Grid item xs={6} sm={6} md={4} lg={4} xl={4} key={pkg.id}>
              <ProductCard 
                title={pkg.name} 
                price={`RM${pkg.price}`} 
                imageSrc={getImageUrl(pkg.imageUrl)} 
                onClick={() => handleCardClick(pkg)} 
              />
            </Grid>
          )) : (
            loading ? (
              <Grid item xs={12}>
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  Loading packages...
                </Typography>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  No packages available yet.
                </Typography>
              </Grid>
            )
          )}
        </Grid>
      </Container>

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
              backgroundImage: `url(${getImageUrl(selectedPackage.imageUrl)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'flex-end',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
                zIndex: 1
              }
            }}>
              {/* Close Button */}
              <IconButton 
                onClick={() => setSelectedPackage(null)} 
                sx={{ 
                  position: 'absolute', 
                  right: 12, 
                  top: 12, 
                  zIndex: 2,
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                }}
              >
                <CloseIcon />
              </IconButton>
              
              {/* Title */}
              <Box sx={{ position: 'relative', zIndex: 2, p: 3, width: '100%' }}>
                <Typography variant="h4" fontWeight={700} color="white" sx={{ mb: 1 }}>
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

              {/* Service Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  About This Service
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {selectedPackage.description}
                </Typography>
              </Box>

              {/* Barber Selection */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Choose Your Barber
                </Typography>
                <FormControl fullWidth size="small">
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

              {/* Additional Services */}
              {getAvailableAdditionalServices().length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Add More Services
                  </Typography>
                  <FormGroup>
                    {getAvailableAdditionalServices().map((service) => (
                      <FormControlLabel
                        key={service.id}
                        control={
                          <Checkbox
                            checked={additionalServices.includes(service.id)}
                            onChange={(e) => handleAdditionalServiceChange(service.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Typography variant="body2">
                              {service.name} ({service.duration} mins)
                            </Typography>
                            <Chip 
                              label={`+RM${service.price}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Box>
                        }
                        sx={{ 
                          mb: 1, 
                          '& .MuiFormControlLabel-label': { width: '100%' },
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          p: 1,
                          m: 0
                        }}
                      />
                    ))}
                  </FormGroup>
                </Box>
              )}

              <Divider sx={{ mb: 3 }} />

              {/* Duration and Price */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #000000 0%, #434343 100%)',
                    color: 'white'
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                      Duration
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedPackage.duration} mins
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #000000 0%, #434343 100%)',
                    color: 'white'
                  }}>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
                      Total Price
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      RM{totalPrice}
                    </Typography>
                    {additionalServices.length > 0 && (
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                        Base: RM{selectedPackage.price} + Extras: RM{totalPrice - selectedPackage.price}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* What's Included */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                  Booking Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {selectedPackage.name} ({selectedPackage.duration} mins)
                </Typography>
                {selectedBarber && (
                  <Typography variant="body2" color="text.secondary">
                    • Barber: {barbers.find(b => b.id === selectedBarber)?.name}
                  </Typography>
                )}
                {!selectedBarber && (
                  <Typography variant="body2" color="text.secondary">
                    • Barber: Any available barber
                  </Typography>
                )}
                {additionalServices.map(serviceId => {
                  const service = packages.find(pkg => pkg.id === serviceId);
                  return service ? (
                    <Typography key={serviceId} variant="body2" color="text.secondary">
                      • {service.name} ({service.duration} mins) - +RM{service.price}
                    </Typography>
                  ) : null;
                })}
                <Typography variant="body2" color="text.secondary">
                  • Quality products and tools
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Relaxing barbershop atmosphere
                </Typography>
              </Box>
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
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                    boxShadow: '0 6px 16px rgba(220, 38, 38, 0.5)',
                  },
                  '&:disabled': {
                    background: '#9ca3af',
                    boxShadow: 'none',
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
  );
}

