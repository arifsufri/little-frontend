'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
import { Grid, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Checkbox, MenuItem, Select, InputLabel, FormControl, IconButton, Container, Divider, Alert, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ProductCard from '../../../components/dashboard/ProductCard';
import GradientButton from '../../../components/GradientButton';
import { apiGet, uploadFile, apiPut, apiDelete } from '../../../src/utils/axios';
import { useUserRole } from '../../../hooks/useUserRole';

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

// Helper function to get full image URL
const getImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return '/images/packages/default.jpg';
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  return `${baseUrl}${imageUrl}`;
};

export default function ProductsPage() {
  const { userRole } = useUserRole();
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);
  const [editingPackage, setEditingPackage] = React.useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = React.useState<Package | null>(null);
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [barber, setBarber] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [hasDiscount, setHasDiscount] = React.useState(false);
  const [discountCode, setDiscountCode] = React.useState('');
  const [modalStep, setModalStep] = React.useState(1);
  const [packageImage, setPackageImage] = React.useState<File | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch packages on component mount
  React.useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Package[] }>('/packages');
      setPackages(response.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]); // Ensure packages is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !desc || !price) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', desc);
      formData.append('price', price);
      formData.append('barber', barber);
      formData.append('duration', duration.toString());
      if (hasDiscount && discountCode) {
        formData.append('discountCode', discountCode);
      }
      if (packageImage) {
        formData.append('image', packageImage);
      }

      const result = await uploadFile<{ message: string; package: Package }>('/packages', formData);
      console.log('Package created:', result);
      resetModal();
      fetchPackages(); // Refresh the packages list
    } catch (error) {
      console.error('Error creating package:', error);
      alert('Failed to create package');
    } finally {
      setCreating(false);
    }
  };

  const handleNext = () => {
    if (name && desc && price) {
      setModalStep(2);
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setModalStep(1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPackageImage(file);
    }
  };

  const handleCardClick = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  const resetModal = () => {
    setOpen(false);
    setModalStep(1);
    setName('');
    setDesc('');
    setPrice('');
    setBarber('');
    setDuration(30);
    setHasDiscount(false);
    setDiscountCode('');
    setPackageImage(null);
  };

  const resetEditModal = () => {
    setEditOpen(false);
    setEditingPackage(null);
    setModalStep(1);
    setName('');
    setDesc('');
    setPrice('');
    setBarber('');
    setDuration(30);
    setHasDiscount(false);
    setDiscountCode('');
    setPackageImage(null);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setDesc(pkg.description);
    setPrice(pkg.price.toString());
    setBarber(pkg.barber || '');
    setDuration(pkg.duration);
    setHasDiscount(!!pkg.discountCode);
    setDiscountCode(pkg.discountCode || '');
    setEditOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    setDeletingPackage(pkg);
    setDeleteOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPackage || !name || !desc || !price) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', desc);
      formData.append('price', price);
      formData.append('barber', barber);
      formData.append('duration', duration.toString());
      if (hasDiscount && discountCode) {
        formData.append('discountCode', discountCode);
      }
      if (packageImage) {
        formData.append('image', packageImage);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/packages/${editingPackage.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update package');
      }
      setSnackbar({ open: true, message: 'Package updated successfully', severity: 'success' });
      resetEditModal();
      fetchPackages();
    } catch (error: any) {
      console.error('Error updating package:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to update package', severity: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingPackage) return;

    setDeleting(true);
    try {
      await apiDelete(`/packages/${deletingPackage.id}`);
      setSnackbar({ open: true, message: 'Package deleted successfully', severity: 'success' });
      setDeleteOpen(false);
      setDeletingPackage(null);
      fetchPackages();
    } catch (error: any) {
      console.error('Error deleting package:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to delete package', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (pkg: Package) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/packages/${pkg.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle package status');
      }

      const result = await response.json();
      setSnackbar({ 
        open: true, 
        message: `Package ${result.data.isActive ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      });
      fetchPackages();
    } catch (error: any) {
      console.error('Error toggling package status:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to toggle package status', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
          <Typography>Loading packages...</Typography>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3 } }}>
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: 'space-between', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 2 }, 
            pb: 2
          }}>
            <Typography 
              variant="h4" 
              fontWeight={900} 
              sx={{ 
                fontFamily: 'Soria, Georgia, Cambria, \"Times New Roman\", Times, serif',
                fontSize: { xs: '1.75rem', sm: '3rem' },
                color: '#000000',
                lineHeight: 1.2
              }}
            >
              Packages
            </Typography>
            {userRole === 'Boss' && (
              <GradientButton
                variant="red"
                animated
                sx={{ 
                  px: { xs: 2, sm: 3 }, 
                  py: { xs: 1, sm: 1.2 }, 
                  fontSize: { xs: 13, sm: 14 },
                  width: { xs: '100%', sm: 'auto' },
                  borderRadius: { xs: 3, sm: 4 }
                }}
                onClick={() => setOpen(true)}
              >
                New Package
              </GradientButton>
            )}
          </Box>
        </Box>

        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ m: 0, width: '100%' }}>
          {packages && packages.length > 0 ? packages.map((pkg) => (
            <Grid item xs={6} sm={6} md={4} lg={4} xl={4} key={pkg.id}>
              <ProductCard 
                title={pkg.name} 
                price={`RM${pkg.price}`} 
                imageSrc={getImageUrl(pkg.imageUrl)}
                isActive={pkg.isActive}
                onClick={() => handleCardClick(pkg)}
                onEdit={userRole === 'Boss' ? () => handleEdit(pkg) : undefined}
                onDelete={userRole === 'Boss' ? () => handleDelete(pkg) : undefined}
                onToggleStatus={userRole === 'Boss' ? () => handleToggleStatus(pkg) : undefined}
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
        fullWidth 
        maxWidth="sm" 
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '85vh'
          } 
        }}
      >
        {/* Hero Section with Image */}
        <Box sx={{ 
          position: 'relative',
          height: 200,
          backgroundImage: `url(${getImageUrl(selectedPackage?.imageUrl)})`,
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
              color: 'white',
              '&:hover': { 
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s ease'
            }} 
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          
          {/* Package Title Overlay */}
          <Box sx={{ 
            position: 'relative', 
            zIndex: 2, 
            p: 3, 
            width: '100%',
            color: 'white'
          }}>
            <Typography 
              variant="h4" 
              fontWeight={800} 
              sx={{ 
                fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                mb: 1
              }}
            >
              {selectedPackage?.name}
            </Typography>
          </Box>
        </Box>

        {/* Content Section */}
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* Description Section */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                color="text.primary" 
                sx={{ 
                  mb: 1.5
                }}
              >
                About This Service
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  lineHeight: 1.6,
                  fontSize: '1rem'
                }}
              >
                {selectedPackage?.description}
              </Typography>
            </Box>

            {/* Details Grid */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
              gap: 2,
              mb: 3
            }}>
              {/* Duration Card */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 3, 
                background: `
                  linear-gradient(135deg, #1a1a1a 0%, #404040 50%, #1a1a1a 100%),
                  radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                  linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)
                `,
                backgroundSize: '200% 200%',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                animation: 'gradientMove 3s ease-in-out infinite',
                '@keyframes gradientMove': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 40%),
                    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 40%)
                  `,
                  zIndex: 1
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  zIndex: 1
                },
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  animation: 'gradientMove 1.5s ease-in-out infinite',
                  '&::before': {
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 40%),
                      radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)
                    `
                  },
                  '&::after': {
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)'
                  }
                }
              }}>
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Typography 
                    variant="h5" 
                    fontWeight={500} 
                    sx={{ 
                      mb: 0.5, 
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  >
                    {selectedPackage?.duration} mins
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5,
                      opacity: 0.9,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    Duration
                  </Typography>
                </Box>
              </Box>

              {/* Price Card */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 3, 
                background: `
                  linear-gradient(135deg, #2d2d2d 0%, #5a5a5a 50%, #2d2d2d 100%),
                  radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                  linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)
                `,
                backgroundSize: '200% 200%',
                color: 'white',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                animation: 'gradientMove 3s ease-in-out infinite reverse',
                '@keyframes gradientMove': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 40%),
                    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.1) 0%, transparent 40%)
                  `,
                  zIndex: 1
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -50,
                  left: -50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  zIndex: 1
                },
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  animation: 'gradientMove 1.5s ease-in-out infinite reverse',
                  '&::before': {
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25) 0%, transparent 40%),
                      radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15) 0%, transparent 40%)
                    `
                  },
                  '&::after': {
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)'
                  }
                }
              }}>
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Typography 
                    variant="h5" 
                    fontWeight={500} 
                    sx={{ 
                      mb: 0.5, 
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  >
                    RM{selectedPackage?.price}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500, 
                      textTransform: 'uppercase', 
                      letterSpacing: 0.5,
                      opacity: 0.9,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    Price
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* What's Included */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                color="text.primary" 
                sx={{ 
                  mb: 1.5
                }}
              >
                What&apos;s Included
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1 
              }}>
                {[
                  'Professional consultation',
                  'Premium quality products',
                  'Comfortable environment',
                  'Expert barber service'
                ].map((item, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <Box sx={{ 
                      width: 5, 
                      height: 5, 
                      borderRadius: '50%', 
                      backgroundColor: 'success.main',
                      flexShrink: 0
                    }} />
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        {/* Action Section */}
        <DialogActions sx={{ 
          p: 3, 
          pt: 0,
          flexDirection: 'column',
          gap: 2
        }}>
          <GradientButton 
            variant="red" 
            animated 
            fullWidth
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              py: { xs: 0.6, sm: 1.2 }, 
              fontSize: { xs: 12, sm: 14 },
              fontWeight: 600
            }} 
            onClick={() => {
              // Handle booking logic here
              console.log('Booking slot for:', selectedPackage);
              setSelectedPackage(null);
            }}
          >
            Book Your Slot Now!
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Create New Package Modal */}
      <Dialog open={open} onClose={resetModal} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif', pr: 6 }}>
          Create New Package
          <IconButton onClick={resetModal} sx={{ position: 'absolute', right: 12, top: 12 }} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {modalStep === 1 && (
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField label="Package Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
              <TextField label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} fullWidth multiline minRows={3} />
              <TextField label="Price (RM)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth inputProps={{ min: 0 }} />
              {/* <FormControl fullWidth>
                <InputLabel id="barber-label">Barber</InputLabel>
                <Select labelId="barber-label" label="Barber" value={barber} onChange={(e) => setBarber(String(e.target.value))}>
                  <MenuItem value="">Unassigned</MenuItem>
                  <MenuItem value="Ali">Ali</MenuItem>
                  <MenuItem value="Budi">Budi</MenuItem>
                  <MenuItem value="Chong">Chong</MenuItem>
                </Select>
              </FormControl> */}
              <FormControl fullWidth>
                <InputLabel id="duration-label">Duration</InputLabel>
                <Select labelId="duration-label" label="Duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[10, 20, 30, 40, 50, 60].map((d) => (
                    <MenuItem key={d} value={d}>{`${d} mins`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Checkbox checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} />}
                label="Discount Code (optional)"
              />
              <TextField label="Discount Code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} fullWidth disabled={!hasDiscount} />
            </Box>
          )}
          {modalStep === 2 && (
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Upload Package Image
              </Typography>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ 
                  padding: '12px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer'
                }}
              />
              {packageImage && (
                <Box sx={{ p: 2, backgroundColor: '#f0f9ff', borderRadius: 2, border: '1px solid #0ea5e9' }}>
                  <Typography variant="body2" color="primary">
                    Selected: {packageImage.name}
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                Supported formats: JPG, PNG, GIF. Maximum size: 5MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 2, pb: 3, gap: 1.5 }}>
          {modalStep === 1 && (
            <>
              <Button
                onClick={resetModal}
                sx={{
                  borderRadius: 9999,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.6, sm: 1.2 },
                  fontSize: { xs: 12, sm: 14 },
                  color: '#000',
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 6px 0 #000000, 0 12px 24px rgba(0,0,0,0.25)',
                  '&:hover': { backgroundColor: '#f9fafb' },
                }}
              >
                Cancel
              </Button>
              <GradientButton variant="red" animated sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.6, sm: 1.2 }, fontSize: { xs: 12, sm: 14 } }} onClick={handleNext}>Next</GradientButton>
            </>
          )}
          {modalStep === 2 && (
            <>
              <Button
                onClick={handleBack}
                sx={{
                  borderRadius: 9999,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.6, sm: 1.2 },
                  fontSize: { xs: 12, sm: 14 },
                  color: '#000',
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 6px 0 #000000, 0 12px 24px rgba(0,0,0,0.25)',
                  '&:hover': { backgroundColor: '#f9fafb' },
                }}
              >
                Back
              </Button>
              <GradientButton 
                variant="red" 
                animated 
                sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.6, sm: 1.2 }, fontSize: { xs: 12, sm: 14 } }} 
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </GradientButton>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Package Modal */}
      <Dialog open={editOpen} onClose={resetEditModal} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif', pr: 6 }}>
          Edit Package
          <IconButton onClick={resetEditModal} sx={{ position: 'absolute', right: 12, top: 12 }} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {modalStep === 1 && (
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField label="Package Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
              <TextField label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} fullWidth multiline minRows={3} />
              <TextField label="Price (RM)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth inputProps={{ min: 0 }} />
              <FormControl fullWidth>
                <InputLabel id="duration-label">Duration</InputLabel>
                <Select labelId="duration-label" label="Duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[10, 20, 30, 40, 50, 60].map((d) => (
                    <MenuItem key={d} value={d}>{`${d} mins`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Checkbox checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} />}
                label="Discount Code (optional)"
              />
              <TextField label="Discount Code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} fullWidth disabled={!hasDiscount} />
            </Box>
          )}
          {modalStep === 2 && (
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 1 }}>
                Update Package Image
              </Typography>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                style={{ 
                  padding: '12px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer'
                }}
              />
              {packageImage && (
                <Box sx={{ p: 2, backgroundColor: '#f0f9ff', borderRadius: 2, border: '1px solid #0ea5e9' }}>
                  <Typography variant="body2" color="primary">
                    Selected: {packageImage.name}
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                Supported formats: JPG, PNG, GIF. Maximum size: 5MB. Leave empty to keep current image.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pt: 2, pb: 3, gap: 1.5 }}>
          {modalStep === 1 && (
            <>
              <Button
                onClick={resetEditModal}
                sx={{
                  borderRadius: 9999,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.6, sm: 1.2 },
                  fontSize: { xs: 12, sm: 14 },
                  color: '#000',
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 6px 0 #000000, 0 12px 24px rgba(0,0,0,0.25)',
                  '&:hover': { backgroundColor: '#f9fafb' },
                }}
              >
                Cancel
              </Button>
              <GradientButton variant="red" animated sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.6, sm: 1.2 }, fontSize: { xs: 12, sm: 14 } }} onClick={handleNext}>Next</GradientButton>
            </>
          )}
          {modalStep === 2 && (
            <>
              <Button
                onClick={handleBack}
                sx={{
                  borderRadius: 9999,
                  px: { xs: 2, sm: 3 },
                  py: { xs: 0.6, sm: 1.2 },
                  fontSize: { xs: 12, sm: 14 },
                  color: '#000',
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 6px 0 #000000, 0 12px 24px rgba(0,0,0,0.25)',
                  '&:hover': { backgroundColor: '#f9fafb' },
                }}
              >
                Back
              </Button>
              <GradientButton 
                variant="red" 
                animated 
                sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.6, sm: 1.2 }, fontSize: { xs: 12, sm: 14 } }} 
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update'}
              </GradientButton>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
          Delete Package
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the package &quot;{deletingPackage?.name}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
            sx={{
              borderRadius: 9999,
              px: { xs: 2, sm: 3 },
              py: { xs: 0.6, sm: 1.2 },
              fontSize: { xs: 12, sm: 14 },
              color: '#000',
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 6px 0 #000000, 0 12px 24px rgba(0,0,0,0.25)',
              '&:hover': { backgroundColor: '#f9fafb' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            disabled={deleting}
            sx={{
              borderRadius: 9999,
              px: { xs: 2, sm: 3 },
              py: { xs: 0.6, sm: 1.2 },
              fontSize: { xs: 12, sm: 14 },
              color: '#fff',
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: 'uppercase',
              backgroundColor: 'error.main',
              boxShadow: '0 6px 0 #b91c1c, 0 12px 24px rgba(185,28,28,0.25)',
              '&:hover': { backgroundColor: 'error.dark' },
              '&:disabled': { backgroundColor: 'grey.400' }
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
