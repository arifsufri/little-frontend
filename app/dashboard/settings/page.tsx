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
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
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

const BusinessSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email format'),
  website: z.string().optional(),
});

type ProfileForm = z.infer<typeof ProfileSchema>;
type PasswordForm = z.infer<typeof PasswordSchema>;
type BusinessForm = z.infer<typeof BusinessSchema>;

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

  // Business settings state
  const [businessSettings, setBusinessSettings] = React.useState({
    businessName: 'Little Barbershop',
    address: '',
    phone: '',
    email: '',
    website: '',
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false }
    }
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = React.useState({
    emailNotifications: true,
    smsNotifications: false,
    newAppointments: true,
    appointmentReminders: true,
    clientRegistrations: true,
    dailySummary: false,
    weeklyReport: true
  });

  // Form handlers
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: userProfile.name, email: userProfile.email }
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema)
  });

  const businessForm = useForm<BusinessForm>({
    resolver: zodResolver(BusinessSchema),
    defaultValues: businessSettings
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

  const loadBusinessSettings = React.useCallback(() => {
    // Load from localStorage or API
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setBusinessSettings(prev => ({ ...prev, ...parsed }));
        businessForm.reset(parsed);
      } catch (error) {
        console.error('Error parsing business settings:', error);
      }
    }
  }, [businessForm]);

  const loadNotificationSettings = () => {
    // Load from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setNotificationSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error parsing notification settings:', error);
      }
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

  const handleBusinessSubmit = async (data: BusinessForm) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updatedSettings = { ...businessSettings, ...data };
      setBusinessSettings(updatedSettings);
      localStorage.setItem('businessSettings', JSON.stringify(updatedSettings));
      setSuccessMsg('Business settings updated successfully!');
    } catch (error) {
      setErrorMsg('Failed to update business settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    const updatedSettings = { ...notificationSettings, [setting]: value };
    setNotificationSettings(updatedSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessSettings(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value
        }
      }
    }));
  };

  const saveOpeningHours = () => {
    localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
    setSuccessMsg('Opening hours updated successfully!');
  };

  // Load user profile on mount
  React.useEffect(() => {
    loadUserProfile();
    loadBusinessSettings();
    loadNotificationSettings();
  }, [loadBusinessSettings]);

  // Update form when userProfile changes
  React.useEffect(() => {
    profileForm.reset({ name: userProfile.name, email: userProfile.email });
  }, [userProfile, profileForm]);

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif' }}>
            Settings
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* Success/Error Messages */}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg(null)}>
              {successMsg}
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          {/* Settings Tabs */}
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
              <Tab icon={<PersonIcon />} label="Profile" />
              <Tab icon={<BusinessIcon />} label="Business" />
              <Tab icon={<NotificationsIcon />} label="Notifications" />
              <Tab icon={<SecurityIcon />} label="Security" />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', mr: 3 }}>
                  <Avatar 
                    sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
                    src={avatarPreview || userProfile.avatar}
                  >
                    {userProfile.name.charAt(0).toUpperCase()}
                  </Avatar>
                  {avatarPreview && (
                    <Box sx={{ position: 'absolute', top: -5, right: -5 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setAvatarPreview(null);
                          setSelectedFile(null);
                        }}
                        sx={{ 
                          bgcolor: 'error.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' },
                          width: 20,
                          height: 20
                        }}
                      >
                        ×
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {userProfile.name || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {userProfile.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button 
                      component="label"
                      startIcon={<EditIcon />} 
                      size="small"
                      disabled={loading}
                    >
                      {selectedFile ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </Button>
                    {selectedFile && (
                      <GradientButton 
                        variant="red"
                        animated
                        sx={{ px: 2, py: 0.8, fontSize: 12 }}
                        onClick={handleAvatarUpload}
                        disabled={loading}
                      >
                        Save Photo
                      </GradientButton>
                    )}
                  </Box>
                  {selectedFile && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Selected: {selectedFile.name}
                    </Typography>
                  )}
                </Box>
              </Box>

              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      {...profileForm.register('name')}
                      error={!!profileForm.formState.errors.name}
                      helperText={profileForm.formState.errors.name?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address"
                      type="email"
                      fullWidth
                      {...profileForm.register('email')}
                      error={!!profileForm.formState.errors.email}
                      helperText={profileForm.formState.errors.email?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <GradientButton
                        type="submit"
                        variant="green"
                        animated
                        sx={{ px: 2, py: 0.8, fontSize: 12 }}
                        disabled={loading}
                      >
                        Save Changes
                      </GradientButton>
                      <GradientButton
                        variant="red"
                        animated
                        sx={{ px: 2, py: 0.8, fontSize: 12 }}
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        Change Password
                      </GradientButton>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </TabPanel>

          {/* Business Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Business Information
              </Typography>
              
              <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Business Name"
                      fullWidth
                      {...businessForm.register('businessName')}
                      error={!!businessForm.formState.errors.businessName}
                      helperText={businessForm.formState.errors.businessName?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      fullWidth
                      {...businessForm.register('phone')}
                      error={!!businessForm.formState.errors.phone}
                      helperText={businessForm.formState.errors.phone?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Business Address"
                      fullWidth
                      multiline
                      rows={2}
                      {...businessForm.register('address')}
                      error={!!businessForm.formState.errors.address}
                      helperText={businessForm.formState.errors.address?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Business Email"
                      type="email"
                      fullWidth
                      {...businessForm.register('email')}
                      error={!!businessForm.formState.errors.email}
                      helperText={businessForm.formState.errors.email?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Website (Optional)"
                      fullWidth
                      {...businessForm.register('website')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <GradientButton
                      type="submit"
                      variant="green"
                      animated
                      sx={{ px: 2, py: 0.8, fontSize: 12 }}
                      disabled={loading}
                    >
                      Save Business Info
                    </GradientButton>
                  </Grid>
                </Grid>
              </form>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Opening Hours
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(businessSettings.openingHours).map(([day, hours]) => (
                  <Grid item xs={12} key={day}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                      <Typography variant="body1" sx={{ minWidth: 100, textTransform: 'capitalize' }}>
                        {day}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!hours.closed}
                            onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                          />
                        }
                        label="Open"
                      />
                      {!hours.closed && (
                        <>
                          <TextField
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                          <Typography variant="body2">to</Typography>
                          <TextField
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </>
                      )}
                      {hours.closed && (
                        <Chip label="Closed" color="default" size="small" />
                      )}
                    </Box>
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <GradientButton
                    variant="green"
                    animated
                    sx={{ px: 2, py: 0.8, fontSize: 12, mt: 2 }}
                    onClick={saveOpeningHours}
                  >
                    Save Opening Hours
                  </GradientButton>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Notifications Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Notification Preferences
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    General Notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                      />
                    }
                    label="SMS Notifications"
                    sx={{ ml: 2 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Appointment Notifications
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.newAppointments}
                          onChange={(e) => handleNotificationChange('newAppointments', e.target.checked)}
                        />
                      }
                      label="New Appointments"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.appointmentReminders}
                          onChange={(e) => handleNotificationChange('appointmentReminders', e.target.checked)}
                        />
                      }
                      label="Appointment Reminders"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.clientRegistrations}
                          onChange={(e) => handleNotificationChange('clientRegistrations', e.target.checked)}
                        />
                      }
                      label="New Client Registrations"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Reports
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.dailySummary}
                          onChange={(e) => handleNotificationChange('dailySummary', e.target.checked)}
                        />
                      }
                      label="Daily Summary"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.weeklyReport}
                          onChange={(e) => handleNotificationChange('weeklyReport', e.target.checked)}
                        />
                      }
                      label="Weekly Business Report"
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={activeTab} index={3}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Security Settings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Password
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Last changed 30 days ago
                    </Typography>
                    <GradientButton
                      variant="red"
                      animated
                      sx={{ px: 2, py: 0.8, fontSize: 12 }}
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      Change Password
                    </GradientButton>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Session Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Manage your active sessions across devices
                    </Typography>
                    <GradientButton
                      variant="red"
                      animated
                      sx={{ px: 2, py: 0.8, fontSize: 12 }}
                    >
                      Sign Out All Devices
                    </GradientButton>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      Data Export
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Download your business data and reports
                    </Typography>
                    <GradientButton
                      variant="red"
                      animated
                      sx={{ px: 2, py: 0.8, fontSize: 12 }}
                    >
                      Export Data
                    </GradientButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </TabPanel>
        </Card>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password</DialogTitle>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
            <DialogContent>
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                sx={{ mb: 2 }}
                {...passwordForm.register('currentPassword')}
                error={!!passwordForm.formState.errors.currentPassword}
                helperText={passwordForm.formState.errors.currentPassword?.message}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                sx={{ mb: 2 }}
                {...passwordForm.register('newPassword')}
                error={!!passwordForm.formState.errors.newPassword}
                helperText={passwordForm.formState.errors.newPassword?.message}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                {...passwordForm.register('confirmPassword')}
                error={!!passwordForm.formState.errors.confirmPassword}
                helperText={passwordForm.formState.errors.confirmPassword?.message}
              />
            </DialogContent>
            <DialogActions>
              <GradientButton 
                variant="red"
                animated
                sx={{ px: 3, py: 1.2, fontSize: 14 }}
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </GradientButton>
              <GradientButton 
                type="submit" 
                variant="red"
                animated
                sx={{ px: 3, py: 1.2, fontSize: 14 }}
                disabled={loading}
              >
                Change Password
              </GradientButton>
            </DialogActions>
          </form>
        </Dialog>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
