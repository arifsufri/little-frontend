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
  Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiGet, apiPut, apiPost } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

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

type ProfileForm = z.infer<typeof ProfileSchema>;
type PasswordForm = z.infer<typeof PasswordSchema>;

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

  // Form handlers
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: userProfile.name, email: userProfile.email }
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema)
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
  }, []);

  // Update form when userProfile changes
  React.useEffect(() => {
    profileForm.reset({ name: userProfile.name, email: userProfile.email });
  }, [userProfile, profileForm]);

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
    </DashboardLayout>
  );
}
