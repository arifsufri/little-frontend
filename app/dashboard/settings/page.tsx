'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Chip,
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiGet, apiPut, apiPost, apiDelete, apiPatch } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';
import keepAliveService, { KeepAliveStatus } from '../../../src/utils/keepAlive';
import { useUserRole } from '../../../hooks/useUserRole';

// Validation schemas
const ProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const DiscountCodeSchema = z.object({
  code: z.string().min(1, 'Discount code is required').max(20, 'Code must be 20 characters or less'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountPercent: z.number().min(0.1, 'Discount must be at least 0.1%').max(100, 'Discount cannot exceed 100%').optional(),
  discountAmount: z.number().min(0.1, 'Discount amount must be at least RM0.10').optional(),
  applicablePackages: z.array(z.number()).optional()
}).refine((data) => {
  if (data.discountType === 'percentage') {
    return data.discountPercent !== undefined && data.discountPercent > 0;
  } else {
    return data.discountAmount !== undefined && data.discountAmount > 0;
  }
}, {
  message: 'Either discount percentage or discount amount is required based on the selected type',
  path: ['discountPercent'] // This will show the error on the discountPercent field
});

type ProfileForm = z.infer<typeof ProfileSchema>;
type PasswordForm = z.infer<typeof PasswordSchema>;
type DiscountCodeForm = z.infer<typeof DiscountCodeSchema>;

interface Package {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
}

interface DiscountCode {
  id: number;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountPercent?: number;
  discountAmount?: number;
  applicablePackages: number[];
  isActive: boolean;
  createdAt: string;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  _count: {
    usages: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userRole } = useUserRole();
  
  const [activeTab, setActiveTab] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  
  // User profile state
  const [userProfile, setUserProfile] = React.useState({
    name: '',
    email: '',
    avatar: ''
  });

  // Keep-alive service state
  const [keepAliveStatus, setKeepAliveStatus] = React.useState<KeepAliveStatus | null>(null);

  // Discount codes state
  const [discountCodes, setDiscountCodes] = React.useState<DiscountCode[]>([]);
  const [discountDialogOpen, setDiscountDialogOpen] = React.useState(false);
  const [editingDiscount, setEditingDiscount] = React.useState<DiscountCode | null>(null);
  const [deleteDiscountOpen, setDeleteDiscountOpen] = React.useState(false);
  const [deletingDiscount, setDeletingDiscount] = React.useState<DiscountCode | null>(null);
  
  // Packages state for discount code creation
  const [packages, setPackages] = React.useState<Package[]>([]);

  // Form handlers
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: userProfile.name, email: userProfile.email }
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema)
  });

  const discountForm = useForm<DiscountCodeForm>({
    resolver: zodResolver(DiscountCodeSchema),
    defaultValues: {
      code: '',
      description: '',
      discountPercent: 10
    }
  });

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiGet<{ success: boolean; data: any }>('/auth/me');
      if (response.success) {
        const user = response.data;
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const avatarUrl = user.avatar ? `${baseUrl}${user.avatar}` : '';
        
        setUserProfile({
          name: user.name || '',
          email: user.email || '',
          avatar: avatarUrl
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const updateKeepAliveStatus = () => {
    setKeepAliveStatus(keepAliveService.getStatus());
  };

  // Discount code functions
  const loadDiscountCodes = React.useCallback(async () => {
    if (userRole !== 'Boss') return;
    
    try {
      const response = await apiGet<{ success: boolean; data: DiscountCode[] }>('/discount-codes');
      if (response.success) {
        setDiscountCodes(response.data);
      }
    } catch (error) {
      console.error('Error loading discount codes:', error);
      setErrorMsg('Failed to load discount codes');
    }
  }, [userRole]);

  const fetchPackages = React.useCallback(async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Package[] }>('/packages');
      setPackages(response.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  }, []);

  const handleCreateDiscount = async (data: DiscountCodeForm) => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const response = await apiPost<{ success: boolean; data: DiscountCode }>('/discount-codes', {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discountType: data.discountType,
        discountPercent: data.discountType === 'percentage' ? data.discountPercent : null,
        discountAmount: data.discountType === 'fixed_amount' ? data.discountAmount : null,
        applicablePackages: data.applicablePackages || []
      });
      
      if (response.success) {
        setSuccessMsg(`Discount code "${data.code.toUpperCase()}" created successfully!`);
        setDiscountDialogOpen(false);
        discountForm.reset();
        loadDiscountCodes();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to create discount code');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDiscount = async (data: DiscountCodeForm) => {
    if (!editingDiscount) return;
    
    setLoading(true);
    setErrorMsg(null);
    
    try {
      const response = await apiPut<{ success: boolean; data: DiscountCode }>(`/discount-codes/${editingDiscount.id}`, {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discountType: data.discountType,
        discountPercent: data.discountType === 'percentage' ? data.discountPercent : null,
        discountAmount: data.discountType === 'fixed_amount' ? data.discountAmount : null,
        applicablePackages: data.applicablePackages || []
      });
      
      if (response.success) {
        setSuccessMsg(`Discount code "${data.code.toUpperCase()}" updated successfully!`);
        setDiscountDialogOpen(false);
        setEditingDiscount(null);
        discountForm.reset();
        loadDiscountCodes();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to update discount code');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDiscountStatus = async (discount: DiscountCode) => {
    try {
      const response = await apiPatch<{ success: boolean; data: DiscountCode }>(`/discount-codes/${discount.id}/toggle-status`, {});
      
      if (response.success) {
        setSuccessMsg(`Discount code ${response.data.isActive ? 'activated' : 'deactivated'} successfully!`);
        loadDiscountCodes();
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to toggle discount code status');
    }
  };

  const handleDeleteDiscount = async () => {
    if (!deletingDiscount) return;
    
    setLoading(true);
    try {
      await apiDelete(`/discount-codes/${deletingDiscount.id}`);
      setSuccessMsg(`Discount code "${deletingDiscount.code}" deleted successfully!`);
      setDeleteDiscountOpen(false);
      setDeletingDiscount(null);
      loadDiscountCodes();
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to delete discount code');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDiscountDialog = () => {
    setEditingDiscount(null);
    discountForm.reset({
      code: '',
      description: '',
      discountType: 'percentage',
      discountPercent: 10,
      discountAmount: undefined,
      applicablePackages: []
    });
    setDiscountDialogOpen(true);
  };

  const openEditDiscountDialog = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    discountForm.reset({
      code: discount.code,
      description: discount.description || '',
      discountType: discount.discountType || 'percentage',
      discountPercent: discount.discountPercent || undefined,
      discountAmount: discount.discountAmount || undefined,
      applicablePackages: discount.applicablePackages || []
    });
    setDiscountDialogOpen(true);
  };

  const openDeleteDiscountDialog = (discount: DiscountCode) => {
    setDeletingDiscount(discount);
    setDeleteDiscountOpen(true);
  };

  const handleKeepAliveToggle = () => {
    if (keepAliveService.isRunning()) {
      keepAliveService.stop();
      setSuccessMsg('Keep-alive service stopped');
    } else {
      keepAliveService.start();
      setSuccessMsg('Keep-alive service started');
    }
    updateKeepAliveStatus();
  };

  const handleKeepAlivePing = async () => {
    setLoading(true);
    const success = await keepAliveService.ping();
    setLoading(false);
    
    if (success) {
      setSuccessMsg('Backend ping successful!');
    } else {
      setErrorMsg('Backend ping failed. Check your connection.');
    }
    updateKeepAliveStatus();
  };


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select an image file.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size must be less than 5MB.');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);
      formData.append('name', userProfile.name);
      formData.append('email', userProfile.email);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token');
      
      console.log('Uploading to:', `${baseUrl}/auth/profile`);
      console.log('File:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const response = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }
      
      if (result.success) {
        const newAvatarUrl = result.data.user.avatar ? `${baseUrl}${result.data.user.avatar}` : '';
        
        setUserProfile(prev => ({ 
          ...prev, 
          avatar: newAvatarUrl,
          name: result.data.user.name,
          email: result.data.user.email
        }));
        setAvatarPreview(null);
        setSelectedFile(null);
        setSuccessMsg('Profile photo updated successfully!');
        
        // Dispatch custom event to update header avatar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated'));
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMsg(error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (data: ProfileForm) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      
      if (result.success) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const avatarUrl = result.data.user.avatar ? `${baseUrl}${result.data.user.avatar}` : userProfile.avatar;
        
        setUserProfile(prev => ({ 
          ...prev, 
          ...data,
          avatar: avatarUrl
        }));
        setAvatarPreview(null);
        setSelectedFile(null);
        setSuccessMsg('Profile updated successfully!');
        
        // Dispatch custom event to update header avatar
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated'));
        }
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update profile';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await apiPost('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setSuccessMsg('Password changed successfully!');
      setPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to change password';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };


  // Load user profile on mount
  React.useEffect(() => {
    loadUserProfile();
    updateKeepAliveStatus();
  }, []);

  // Load discount codes when user role is available
  React.useEffect(() => {
    if (userRole === 'Boss') {
      loadDiscountCodes();
      fetchPackages();
    }
  }, [userRole, loadDiscountCodes, fetchPackages]);

  // Update form when userProfile changes
  React.useEffect(() => {
    profileForm.reset({ name: userProfile.name, email: userProfile.email });
  }, [userProfile, profileForm]);

  // Update keep-alive status periodically
  React.useEffect(() => {
    const interval = setInterval(updateKeepAliveStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography 
          variant="h3" 
          fontWeight={900} 
          sx={{ 
            fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
            fontSize: { xs: '1.75rem', sm: '3rem' },
            mb: { xs: 0.5, sm: 1 },
            color: '#000000',
            lineHeight: 1.2
          }}
        >
          Settings
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#666666',
            fontWeight: 400,
            fontSize: { xs: '0.9rem', sm: '1.25rem' },
            lineHeight: 1.3
          }}
        >
          Manage your profile and account preferences
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {successMsg && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: { xs: 2, sm: 3 },
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }} 
          onClose={() => setSuccessMsg(null)}
        >
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: { xs: 2, sm: 3 },
            '& .MuiAlert-message': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }} 
          onClose={() => setErrorMsg(null)}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Settings Navigation */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { xs: 3, sm: 4 },
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          mb: 3
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            '& .MuiTab-root': {
              minHeight: { xs: 64, sm: 72 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 600,
              textTransform: 'none',
              color: '#64748b',
              '&.Mui-selected': {
                color: '#dc2626',
                fontWeight: 700
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#dc2626',
              height: 3
            }
          }}
        >
          <Tab 
            icon={<PersonIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
            label="Profile" 
            iconPosition="start"
          />
          <Tab 
            icon={<SecurityIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
            label="Security" 
            iconPosition="start"
          />
          {userRole === 'Boss' && (
            <Tab 
              icon={<LocalOfferIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
              label="Discount Codes" 
              iconPosition="start"
            />
          )}
          <Tab 
            icon={<SettingsIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
            label="System" 
            iconPosition="start"
          />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Profile Header */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: { xs: 3, sm: 4 },
              mb: 4,
              p: { xs: 3, sm: 4 },
              borderRadius: { xs: 2, sm: 3 },
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  sx={{ 
                    width: { xs: 100, sm: 120 }, 
                    height: { xs: 100, sm: 120 },
                    bgcolor: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(220, 38, 38, 0.3)'
                  }}
                  src={avatarPreview || userProfile.avatar}
                >
                  {userProfile.name.charAt(0).toUpperCase()}
                </Avatar>
                
                {/* Camera overlay */}
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: '#dc2626',
                    color: 'white',
                    width: { xs: 36, sm: 40 },
                    height: { xs: 36, sm: 40 },
                    '&:hover': { bgcolor: '#991b1b' },
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                  }}
                  disabled={loading}
                >
                  <PhotoCameraIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </IconButton>

                {avatarPreview && (
                  <IconButton
                    onClick={() => {
                      setAvatarPreview(null);
                      setSelectedFile(null);
                    }}
                    sx={{ 
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: '#ef4444', 
                      color: 'white',
                      width: 28,
                      height: 28,
                      fontSize: '1rem',
                      '&:hover': { bgcolor: '#dc2626' }
                    }}
                  >
                    ×
                  </IconButton>
                )}
              </Box>

              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  sx={{ 
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    color: '#1f2937'
                  }}
                >
                  {userProfile.name || 'User'}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#6b7280',
                    mb: 2,
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  {userProfile.email}
                </Typography>
                
                {selectedFile && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Selected: {selectedFile.name}
                    </Typography>
                    <GradientButton 
                      variant="red"
                      animated
                      sx={{ 
                        px: { xs: 2, sm: 2.5 }, 
                        py: { xs: 0.8, sm: 1 }, 
                        fontSize: { xs: 12, sm: 13 }
                      }}
                      onClick={handleAvatarUpload}
                      disabled={loading}
                    >
                      Save Photo
                    </GradientButton>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Profile Form */}
            <Card sx={{ 
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
            }}>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  sx={{ 
                    mb: 3,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    color: '#1f2937'
                  }}
                >
                  Personal Information
                </Typography>
                
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Full Name"
                        fullWidth
                        variant="outlined"
                        {...profileForm.register('name')}
                        error={!!profileForm.formState.errors.name}
                        helperText={profileForm.formState.errors.name?.message}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: { xs: 1.5, sm: 2 }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email Address"
                        type="email"
                        fullWidth
                        variant="outlined"
                        {...profileForm.register('email')}
                        error={!!profileForm.formState.errors.email}
                        helperText={profileForm.formState.errors.email?.message}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: { xs: 1.5, sm: 2 }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={2}
                        sx={{ mt: 2 }}
                      >
                        <GradientButton
                          type="submit"
                          variant="green"
                          animated
                          sx={{ 
                            px: { xs: 2.5, sm: 3 }, 
                            py: { xs: 1, sm: 1.2 }, 
                            fontSize: { xs: 13, sm: 14 },
                            fontWeight: 600,
                            flex: { xs: 1, sm: 'none' }
                          }}
                          disabled={loading}
                        >
                          Save Changes
                        </GradientButton>
                        <GradientButton
                          variant="red"
                          animated
                          startIcon={<LockIcon />}
                          sx={{ 
                            px: { xs: 2.5, sm: 3 }, 
                            py: { xs: 1, sm: 1.2 }, 
                            fontSize: { xs: 13, sm: 14 },
                            fontWeight: 600,
                            flex: { xs: 1, sm: 'none' }
                          }}
                          onClick={() => setPasswordDialogOpen(true)}
                        >
                          Change Password
                        </GradientButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              sx={{ 
                mb: 4,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                color: '#1f2937'
              }}
            >
              Security & Privacy
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Password Section */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: { xs: 2, sm: 3 },
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                  }
                }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Stack direction="row" alignItems="flex-start" spacing={3}>
                      <Box sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(220, 38, 38, 0.2)'
                      }}>
                        <LockIcon sx={{ 
                          fontSize: { xs: 24, sm: 28 }, 
                          color: 'white' 
                        }} />
                      </Box>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="h6" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 1,
                            fontSize: { xs: '1rem', sm: '1.125rem' }
                          }}
                        >
                          Password Security
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 3,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            lineHeight: 1.5
                          }}
                        >
                          Keep your account secure with a strong password. We recommend changing it regularly.
                        </Typography>
                        <GradientButton
                          variant="red"
                          animated
                          startIcon={<LockIcon />}
                          sx={{ 
                            px: { xs: 2.5, sm: 3 }, 
                            py: { xs: 1, sm: 1.2 }, 
                            fontSize: { xs: 13, sm: 14 },
                            fontWeight: 600
                          }}
                          onClick={() => setPasswordDialogOpen(true)}
                        >
                          Change Password
                        </GradientButton>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Account Security */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: { xs: 2, sm: 3 },
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                  }
                }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={600} 
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '1rem', sm: '1.125rem' }
                      }}
                    >
                      Account Security
                    </Typography>
                    
                    <Stack spacing={3}>
                      <Box sx={{
                        p: { xs: 2.5, sm: 3 },
                        borderRadius: { xs: 1.5, sm: 2 },
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Session Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Sign out from all devices to secure your account
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          sx={{ 
                            borderRadius: { xs: 1.5, sm: 2 },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 0.8, sm: 1 },
                            fontSize: { xs: 12, sm: 13 }
                          }}
                        >
                          Sign Out All Devices
                        </Button>
                      </Box>

                      <Box sx={{
                        p: { xs: 2.5, sm: 3 },
                        borderRadius: { xs: 1.5, sm: 2 },
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Data Export
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Download your business data and reports
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ 
                            borderRadius: { xs: 1.5, sm: 2 },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: { xs: 2, sm: 2.5 },
                            py: { xs: 0.8, sm: 1 },
                            fontSize: { xs: 12, sm: 13 }
                          }}
                        >
                          Export Data
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Discount Codes Tab - Only for Boss */}
        {userRole === 'Boss' && (
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4 
              }}>
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    color: '#1f2937'
                  }}
                >
                  Discount Code Management
                </Typography>
                <GradientButton
                  variant="red"
                  animated
                  startIcon={<AddIcon />}
                  sx={{ 
                    px: { xs: 2.5, sm: 3 }, 
                    py: { xs: 1, sm: 1.2 }, 
                    fontSize: { xs: 13, sm: 14 },
                    fontWeight: 600
                  }}
                  onClick={openCreateDiscountDialog}
                >
                  Create Code
                </GradientButton>
              </Box>

              {/* Discount Codes List */}
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {discountCodes.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      borderRadius: { xs: 2, sm: 3 },
                      border: '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                      textAlign: 'center',
                      py: 6
                    }}>
                      <CardContent>
                        <LocalOfferIcon sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No Discount Codes Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Create your first discount code to start offering promotions to your clients.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ) : (
                  discountCodes.map((discount) => (
                    <Grid item xs={12} sm={6} lg={4} key={discount.id}>
                      <Card sx={{ 
                        borderRadius: { xs: 2, sm: 3 },
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            mb: 2 
                          }}>
                            <Box>
                              <Typography 
                                variant="h6" 
                                fontWeight={700} 
                                sx={{ 
                                  fontSize: { xs: '1rem', sm: '1.125rem' },
                                  color: discount.isActive ? '#1f2937' : '#9ca3af',
                                  fontFamily: 'monospace',
                                  letterSpacing: 1
                                }}
                              >
                                {discount.code}
                              </Typography>
                              <Typography 
                                variant="h4" 
                                fontWeight={800} 
                                sx={{ 
                                  color: '#dc2626',
                                  fontSize: { xs: '1.5rem', sm: '2rem' }
                                }}
                              >
                                {discount.discountType === 'fixed_amount' 
                                  ? `RM${discount.discountAmount}` 
                                  : `${discount.discountPercent}%`}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => handleToggleDiscountStatus(discount)}
                              sx={{ 
                                color: discount.isActive ? '#10b981' : '#ef4444',
                                '&:hover': { 
                                  backgroundColor: discount.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' 
                                }
                              }}
                            >
                              {discount.isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            </IconButton>
                          </Box>

                          {discount.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ mb: 2, lineHeight: 1.5 }}
                            >
                              {discount.description}
                            </Typography>
                          )}

                          {/* Applicable Packages Display */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                              Applies to:
                            </Typography>
                            {discount.applicablePackages && discount.applicablePackages.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {discount.applicablePackages.map((packageId) => {
                                  const pkg = packages.find(p => p.id === packageId);
                                  return pkg ? (
                                    <Chip
                                      key={packageId}
                                      label={pkg.name}
                                      size="small"
                                      variant="outlined"
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        height: 24,
                                        borderColor: '#e5e7eb',
                                        color: '#6b7280'
                                      }}
                                    />
                                  ) : null;
                                })}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                                All packages
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 3 
                          }}>
                            <Typography variant="caption" color="text.secondary">
                              Used {discount._count.usages} time{discount._count.usages !== 1 ? 's' : ''}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                px: 2, 
                                py: 0.5, 
                                borderRadius: 2,
                                backgroundColor: discount.isActive ? '#dcfce7' : '#fee2e2',
                                color: discount.isActive ? '#166534' : '#991b1b',
                                fontWeight: 600
                              }}
                            >
                              {discount.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => openEditDiscountDialog(discount)}
                              sx={{ 
                                flex: 1,
                                borderRadius: { xs: 1.5, sm: 2 },
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => openDeleteDiscountDialog(discount)}
                              disabled={discount._count.usages > 0}
                              sx={{ 
                                flex: 1,
                                borderRadius: { xs: 1.5, sm: 2 },
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          </TabPanel>
        )}

        {/* System Tab */}
        <TabPanel value={activeTab} index={userRole === 'Boss' ? 3 : 2}>
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600} 
              sx={{ 
                mb: 4,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                color: '#1f2937'
              }}
            >
              System Configuration
            </Typography>
            
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Keep-Alive Service */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: { xs: 2, sm: 3 },
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
                  }
                }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Stack direction="row" alignItems="flex-start" spacing={3}>
                      <Box sx={{
                        width: { xs: 48, sm: 56 },
                        height: { xs: 48, sm: 56 },
                        borderRadius: '16px',
                        background: keepAliveStatus?.isActive 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: keepAliveStatus?.isActive 
                          ? '0 8px 24px rgba(16, 185, 129, 0.2)'
                          : '0 8px 24px rgba(239, 68, 68, 0.2)'
                      }}>
                        {keepAliveStatus?.isActive ? (
                          <WifiIcon sx={{ 
                            fontSize: { xs: 24, sm: 28 }, 
                            color: 'white' 
                          }} />
                        ) : (
                          <WifiOffIcon sx={{ 
                            fontSize: { xs: 24, sm: 28 }, 
                            color: 'white' 
                          }} />
                        )}
                      </Box>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="h6" 
                          fontWeight={600} 
                          sx={{ 
                            mb: 1,
                            fontSize: { xs: '1rem', sm: '1.125rem' }
                          }}
                        >
                          Keep-Alive Service
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 3,
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            lineHeight: 1.5
                          }}
                        >
                          Prevents your Render backend from spinning down due to inactivity. 
                          Pings the server every {keepAliveStatus ? Math.floor(keepAliveStatus.interval / 60000) : 10} minutes.
                        </Typography>

                        {keepAliveStatus && (
                          <Box sx={{ mb: 3 }}>
                            <Stack spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                <strong>Status:</strong> {keepAliveStatus.isActive ? 'Active' : 'Inactive'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                <strong>Backend URL:</strong> {keepAliveStatus.baseUrl}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                <strong>Ping Interval:</strong> {Math.floor(keepAliveStatus.interval / 60000)} minutes
                              </Typography>
                              {keepAliveStatus.retryCount > 0 && (
                                <Typography variant="caption" color="error.main">
                                  <strong>Failed Attempts:</strong> {keepAliveStatus.retryCount}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        )}

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <GradientButton
                            variant={keepAliveStatus?.isActive ? "red" : "green"}
                            animated
                            startIcon={keepAliveStatus?.isActive ? <WifiOffIcon /> : <WifiIcon />}
                            sx={{ 
                              px: { xs: 2.5, sm: 3 }, 
                              py: { xs: 1, sm: 1.2 }, 
                              fontSize: { xs: 13, sm: 14 },
                              fontWeight: 600
                            }}
                            onClick={handleKeepAliveToggle}
                          >
                            {keepAliveStatus?.isActive ? 'Stop Service' : 'Start Service'}
                          </GradientButton>
                          
                          <GradientButton
                            variant="blue"
                            animated
                            startIcon={<RefreshIcon />}
                            sx={{ 
                              px: { xs: 2.5, sm: 3 }, 
                              py: { xs: 1, sm: 1.2 }, 
                              fontSize: { xs: 13, sm: 14 },
                              fontWeight: 600
                            }}
                            onClick={handleKeepAlivePing}
                            disabled={loading}
                          >
                            Test Connection
                          </GradientButton>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Environment Info */}
              <Grid item xs={12}>
                <Card sx={{ 
                  borderRadius: { xs: 2, sm: 3 },
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
                }}>
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={600} 
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '1rem', sm: '1.125rem' }
                      }}
                    >
                      Environment Information
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box sx={{
                        p: { xs: 2.5, sm: 3 },
                        borderRadius: { xs: 1.5, sm: 2 },
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                          Application Environment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Mode:</strong> {process.env.NODE_ENV || 'development'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Keep-Alive Enabled:</strong> {process.env.NEXT_PUBLIC_ENABLE_KEEP_ALIVE === 'true' ? 'Yes' : 'Auto (Production only)'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 700
        }}>
          Change Password
        </DialogTitle>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
          <DialogContent sx={{ pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                variant="outlined"
                {...passwordForm.register('currentPassword')}
                error={!!passwordForm.formState.errors.currentPassword}
                helperText={passwordForm.formState.errors.currentPassword?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 }
                  }
                }}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                variant="outlined"
                {...passwordForm.register('newPassword')}
                error={!!passwordForm.formState.errors.newPassword}
                helperText={passwordForm.formState.errors.newPassword?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 }
                  }
                }}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                variant="outlined"
                {...passwordForm.register('confirmPassword')}
                error={!!passwordForm.formState.errors.confirmPassword}
                helperText={passwordForm.formState.errors.confirmPassword?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 }
                  }
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Stack 
              direction="row" 
              spacing={2}
              sx={{ width: '100%' }}
            >
              <GradientButton
                variant="blue"
                animated
                onClick={() => setPasswordDialogOpen(false)}
                sx={{ 
                  flex: 1,
                  px: { xs: 2.5, sm: 3 }, 
                  py: { xs: 1, sm: 1.2 }, 
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 600
                }}
              >
                Cancel
              </GradientButton>
              <GradientButton 
                type="submit" 
                variant="red"
                animated
                sx={{ 
                  flex: 1,
                  px: { xs: 2.5, sm: 3 }, 
                  py: { xs: 1, sm: 1.2 }, 
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 600
                }}
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </GradientButton>
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      {/* Discount Code Create/Edit Dialog */}
      <Dialog 
        open={discountDialogOpen} 
        onClose={() => setDiscountDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 700
        }}>
          {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
        </DialogTitle>
        <form onSubmit={discountForm.handleSubmit(editingDiscount ? handleEditDiscount : handleCreateDiscount)}>
          <DialogContent sx={{ pb: 2 }}>
            <Stack spacing={3}>
              <TextField
                label="Discount Code"
                fullWidth
                variant="outlined"
                placeholder="e.g., SUMMER20, NEWCLIENT"
                {...discountForm.register('code')}
                error={!!discountForm.formState.errors.code}
                helperText={discountForm.formState.errors.code?.message || 'Code will be converted to uppercase'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 }
                  }
                }}
              />
              <TextField
                label="Description (Optional)"
                fullWidth
                variant="outlined"
                multiline
                rows={2}
                placeholder="Brief description of this discount code"
                {...discountForm.register('description')}
                error={!!discountForm.formState.errors.description}
                helperText={discountForm.formState.errors.description?.message}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: { xs: 1.5, sm: 2 }
                  }
                }}
              />
              {/* Discount Type Selection */}
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={discountForm.watch('discountType') || 'percentage'}
                  onChange={(e) => {
                    discountForm.setValue('discountType', e.target.value as 'percentage' | 'fixed_amount');
                    // Reset the other field when switching types
                    if (e.target.value === 'percentage') {
                      discountForm.setValue('discountAmount', undefined);
                    } else {
                      discountForm.setValue('discountPercent', undefined);
                    }
                  }}
                  label="Discount Type"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 1.5, sm: 2 }
                    }
                  }}
                >
                  <MenuItem value="percentage">Percentage Discount (%)</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount (RM)</MenuItem>
                </Select>
              </FormControl>

              {/* Conditional Discount Fields */}
              {discountForm.watch('discountType') === 'percentage' ? (
                <TextField
                  label="Discount Percentage"
                  type="number"
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0.1, max: 100, step: 0.1 }}
                  {...discountForm.register('discountPercent', { valueAsNumber: true })}
                  error={!!discountForm.formState.errors.discountPercent}
                  helperText={discountForm.formState.errors.discountPercent?.message || 'Enter percentage (e.g., 10 for 10% off)'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 1.5, sm: 2 }
                    }
                  }}
                />
              ) : (
                <TextField
                  label="Discount Amount (RM)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  inputProps={{ min: 0.1, step: 0.1 }}
                  {...discountForm.register('discountAmount', { valueAsNumber: true })}
                  error={!!discountForm.formState.errors.discountAmount}
                  helperText={discountForm.formState.errors.discountAmount?.message || 'Enter fixed amount (e.g., 5 for RM5 off)'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 1.5, sm: 2 }
                    }
                  }}
                />
              )}
              
              {/* Package Selection */}
              <FormControl>
                <FormLabel sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  Applicable Packages
                </FormLabel>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select which packages this discount applies to. Leave empty to apply to all packages.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {packages.map((pkg) => {
                    const selectedPackages = discountForm.watch('applicablePackages') || [];
                    const isSelected = selectedPackages.includes(pkg.id);
                    
                    return (
                      <Chip
                        key={pkg.id}
                        label={`${pkg.name} (RM${pkg.price})`}
                        clickable
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        onClick={() => {
                          const currentPackages = discountForm.getValues('applicablePackages') || [];
                          let newPackages;
                          
                          if (isSelected) {
                            // Remove package
                            newPackages = currentPackages.filter(id => id !== pkg.id);
                          } else {
                            // Add package
                            newPackages = [...currentPackages, pkg.id];
                          }
                          
                          discountForm.setValue('applicablePackages', newPackages);
                        }}
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: isSelected ? 'primary.dark' : 'action.hover'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
                {packages.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No packages available
                  </Typography>
                )}
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Stack 
              direction="row" 
              spacing={2}
              sx={{ width: '100%' }}
            >
              <GradientButton
                variant="blue"
                animated
                onClick={() => setDiscountDialogOpen(false)}
                sx={{ 
                  flex: 1,
                  px: { xs: 2.5, sm: 3 }, 
                  py: { xs: 1, sm: 1.2 }, 
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 600
                }}
              >
                Cancel
              </GradientButton>
              <GradientButton 
                type="submit" 
                variant="red"
                animated
                sx={{ 
                  flex: 1,
                  px: { xs: 2.5, sm: 3 }, 
                  py: { xs: 1, sm: 1.2 }, 
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 600
                }}
                disabled={loading}
              >
                {loading ? (editingDiscount ? 'Updating...' : 'Creating...') : (editingDiscount ? 'Update Code' : 'Create Code')}
              </GradientButton>
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Discount Code Dialog */}
      <Dialog 
        open={deleteDiscountOpen} 
        onClose={() => setDeleteDiscountOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          fontWeight: 700,
          color: 'error.main'
        }}>
          Delete Discount Code
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the discount code &quot;{deletingDiscount?.code}&quot;?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The discount code will be permanently removed from your system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Stack 
            direction="row" 
            spacing={2}
            sx={{ width: '100%' }}
          >
            <GradientButton
              variant="blue"
              animated
              onClick={() => setDeleteDiscountOpen(false)}
              sx={{ 
                flex: 1,
                px: { xs: 2.5, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 600
              }}
            >
              Cancel
            </GradientButton>
            <GradientButton 
              variant="red"
              animated
              onClick={handleDeleteDiscount}
              sx={{ 
                flex: 1,
                px: { xs: 2.5, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 },
                fontWeight: 600
              }}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Code'}
            </GradientButton>
          </Stack>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
