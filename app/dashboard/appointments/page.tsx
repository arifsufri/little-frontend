'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
import AppointmentCard from '../../../components/dashboard/AppointmentCard';
import { useUserRole } from '../../../hooks/useUserRole';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  barber: string | null;
  imageUrl: string | null;
}

interface CustomPackage {
  name: string;
  price: number;
}

interface Appointment {
  id: number;
  clientId: number;
  status: string;
  appointmentDate: string | null;
  notes: string | null;
  createdAt: string;
  additionalPackages?: number[];
  customPackages?: CustomPackage[];
  finalPrice?: number;
  client: {
    clientId: string;
    fullName: string;
    phoneNumber: string;
  };
  package: {
    name: string;
    description: string;
    price: number;
    duration: number;
    barber: string | null;
    imageUrl: string | null;
  };
  barber?: {
    id: number;
    name: string;
    role: string;
    commissionRate: number;
  } | null;
}

export default function AppointmentsPage() {
  const { userRole } = useUserRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [selectedAdditionalPackages, setSelectedAdditionalPackages] = React.useState<number[]>([]);
  const [customPackages, setCustomPackages] = React.useState<CustomPackage[]>([]);
  const [finalPrice, setFinalPrice] = React.useState<number>(0);
  const [customPackageName, setCustomPackageName] = React.useState('');
  const [customPackagePrice, setCustomPackagePrice] = React.useState<number>(0);
  
  // Discount code state
  const [discountCode, setDiscountCode] = React.useState('');
  const [validatingDiscount, setValidatingDiscount] = React.useState(false);
  const [discountInfo, setDiscountInfo] = React.useState<{
    id: number;
    code: string;
    description?: string;
    discountPercent: number;
  } | null>(null);
  const [discountError, setDiscountError] = React.useState<string | null>(null);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [createAppointmentOpen, setCreateAppointmentOpen] = React.useState(false);
  const [changeBarberOpen, setChangeBarberOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [selectedBarberId, setSelectedBarberId] = React.useState<string>('');
  const [newAppointment, setNewAppointment] = React.useState({
    clientId: '',
    packageId: '',
    appointmentDate: '',
    notes: ''
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchAppointments = React.useCallback(async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Appointment[] }>('/appointments');
      let appointmentsData = response.data || [];
      
      // Filter appointments based on user role
      if (userRole === 'Staff') {
        // Get current user ID from token
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentUserId = payload.userId;
            
            // Staff can only see appointments assigned to them or unassigned appointments
            appointmentsData = appointmentsData.filter(appointment => 
              appointment.barber?.id === currentUserId || 
              appointment.barber === null || 
              appointment.barber === undefined
            );
          } catch (tokenError) {
            console.error('Error parsing token:', tokenError);
          }
        }
      }
      // Boss can see all appointments (no filtering needed)
      
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  React.useEffect(() => {
    fetchAppointments();
    fetchPackages();
    fetchClients();
    if (userRole === 'Boss' || userRole === 'Staff') {
      fetchStaff();
    }
  }, [fetchAppointments, userRole]);

  const fetchPackages = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Package[] }>('/packages');
      setPackages(response.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/clients');
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/staff');
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    }
  };


  const handleChangeBarber = async () => {
    if (!selectedAppointment) return;

    try {
      const barberId = selectedBarberId === 'unassign' ? null : parseInt(selectedBarberId);
      
      await apiPut(`/appointments/${selectedAppointment.id}`, { 
        barberId: barberId 
      });
      
      // Refresh appointments
      fetchAppointments();
      
      // Close dialog and reset state
      setChangeBarberOpen(false);
      setSelectedBarberId('');
      handleMenuClose();
      
      const barberName = barberId ? staff.find(s => s.id === barberId)?.name : 'Unassigned';
      showNotification(`Barber changed to: ${barberName}`, 'success');
    } catch (error: any) {
      console.error('Error changing barber:', error);
      const errorMessage = error?.message || error?.error || 'Failed to change barber. Please try again.';
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await apiDelete(`/appointments/${selectedAppointment.id}`);
      
      // Refresh appointments
      fetchAppointments();
      
      // Close dialogs and reset state
      setDeleteConfirmOpen(false);
      handleMenuClose();
      
      showNotification(`Appointment for ${selectedAppointment.client.fullName} has been deleted`, 'success');
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      const errorMessage = error?.message || error?.error || 'Failed to delete appointment. Please try again.';
      showNotification(errorMessage, 'error');
    }
  };

  const handleCreateAppointment = async () => {
    try {
      const appointmentData = {
        clientId: parseInt(newAppointment.clientId),
        packageId: parseInt(newAppointment.packageId),
        appointmentDate: newAppointment.appointmentDate ? new Date(newAppointment.appointmentDate).toISOString() : null,
        notes: newAppointment.notes || null
      };

      await apiPost('/appointments', appointmentData);
      
      // Reset form and close modal
      setCreateAppointmentOpen(false);
      setNewAppointment({
        clientId: '',
        packageId: '',
        appointmentDate: '',
        notes: ''
      });
      
      // Refresh appointments
      fetchAppointments();
      
      alert('Appointment created successfully!');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = error?.message || error?.error || 'Failed to create appointment. Please try again.';
      alert(errorMessage);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppointment(null);
  };


  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedAppointment) return;

    if (newStatus === 'completed') {
      // Open confirmation modal for completion
      setConfirmationOpen(true);
      // Don't call handleMenuClose() here to preserve selectedAppointment
      setAnchorEl(null); // Just close the menu
      return;
    }

    try {
      await apiPut(`/appointments/${selectedAppointment.id}`, { status: newStatus });
      // Refresh appointments
      fetchAppointments();
      handleMenuClose();
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!selectedAppointment) {
      console.error('No selected appointment');
      return;
    }

    if (isCompleting) {
      console.log('Already completing appointment, ignoring click');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    if (!token) {
      alert('You are not logged in. Please log in first.');
      window.location.href = '/login';
      return;
    }

    setIsCompleting(true);

    console.log('Starting appointment completion...', {
      appointmentId: selectedAppointment.id,
      additionalPackages: selectedAdditionalPackages,
      customPackages: customPackages,
      finalPrice: finalPrice
    });

    try {
      const updateData = {
        status: 'completed',
        additionalPackages: selectedAdditionalPackages,
        customPackages: customPackages,
        finalPrice: finalPrice,
        discountCodeId: discountInfo?.id || null,
        discountAmount: discountInfo ? (calculateTotalPrice() - finalPrice) : null
      };

      console.log('Sending update data:', updateData);
      
      const response = await apiPut(`/appointments/${selectedAppointment.id}`, updateData) as any;
      console.log('Update response:', response);
      
      // Reset modal state
      resetConfirmationModal();
      
      // Refresh appointments
      await fetchAppointments();
      
      // Fetch updated financial data and show comprehensive notification
      if (response.data && response.data.barber) {
        const earnings = finalPrice * (response.data.barber.commissionRate / 100);
        
        // Fetch updated financial summary for today
        try {
          const today = new Date().toISOString().split('T')[0];
          const financialResponse = await apiGet(`/financial/staff-report?startDate=${today}&endDate=${today}`) as any;
          
          if (financialResponse.success) {
            const summary = financialResponse.data.summary;
            const serviceBreakdown = financialResponse.data.serviceBreakdown;
            
            // Find the current service in breakdown
            const currentService = serviceBreakdown.find((s: any) => s.name === response.data.package.name);
            const serviceCount = currentService ? currentService.count : 1;
            
            showNotification(
              `🎉 Appointment completed! +RM${earnings.toFixed(2)} | Today: RM${summary.totalEarnings.toFixed(2)} (${summary.totalCustomers} customers, ${summary.totalServices} services) | ${response.data.package.name}: ${serviceCount}x`,
              'success'
            );
          } else {
            showNotification(
              `Appointment completed! You earned RM${earnings.toFixed(2)} (${response.data.barber.commissionRate}% commission)`,
              'success'
            );
          }
        } catch (error) {
          showNotification(
            `Appointment completed! You earned RM${earnings.toFixed(2)} (${response.data.barber.commissionRate}% commission)`,
            'success'
          );
        }
      } else {
        showNotification('Appointment completed successfully!', 'success');
      }
      
      console.log('Appointment completion successful');
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      
      // Handle specific error cases
      if (error?.error === 'Access token required' || error?.error === 'Invalid or expired token') {
        alert('Your session has expired. Please refresh the page and log in again.');
        // Optionally redirect to login
        window.location.href = '/login';
        return;
      }
      
      // Show user-friendly error message
      const errorMessage = error?.message || error?.error || 'Failed to complete appointment. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddCustomPackage = () => {
    if (customPackageName.trim() && customPackagePrice > 0) {
      setCustomPackages([...customPackages, { name: customPackageName.trim(), price: customPackagePrice }]);
      setCustomPackageName('');
      setCustomPackagePrice(0);
    }
  };

  const handleRemoveCustomPackage = (index: number) => {
    setCustomPackages(customPackages.filter((_, i) => i !== index));
  };

  const calculateTotalPrice = React.useCallback(() => {
    if (!selectedAppointment) return 0;
    
    let total = selectedAppointment.package.price;
    
    // Add additional packages
    selectedAdditionalPackages.forEach(packageId => {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) total += pkg.price;
    });
    
    // Add custom packages
    customPackages.forEach(pkg => {
      total += pkg.price;
    });
    
    return total;
  }, [selectedAppointment, selectedAdditionalPackages, packages, customPackages]);

  const calculateDiscountedPrice = React.useCallback(() => {
    const totalPrice = calculateTotalPrice();
    if (!discountInfo) return totalPrice;
    
    const discountAmount = (totalPrice * discountInfo.discountPercent) / 100;
    return totalPrice - discountAmount;
  }, [calculateTotalPrice, discountInfo]);

  const validateDiscountCode = async (code: string) => {
    if (!code.trim() || !selectedAppointment) return;
    
    setValidatingDiscount(true);
    setDiscountError(null);
    
    try {
      const response = await apiPost<{
        success: boolean;
        data: {
          id: number;
          code: string;
          description?: string;
          discountPercent: number;
        };
        message: string;
      }>('/discount-codes/validate', {
        code: code.toUpperCase(),
        clientId: selectedAppointment.clientId
      });
      
      if (response.success) {
        setDiscountInfo(response.data);
        setDiscountError(null);
        // Update final price with discount
        setFinalPrice(calculateDiscountedPrice());
      }
    } catch (error: any) {
      setDiscountInfo(null);
      setDiscountError(error.message || 'Invalid discount code');
      // Reset final price to original
      setFinalPrice(calculateTotalPrice());
    } finally {
      setValidatingDiscount(false);
    }
  };

  const resetConfirmationModal = () => {
    setConfirmationOpen(false);
    setSelectedAppointment(null);
    setSelectedAdditionalPackages([]);
    setCustomPackages([]);
    setFinalPrice(0);
    setCustomPackageName('');
    setCustomPackagePrice(0);
    // Reset discount code state
    setDiscountCode('');
    setDiscountInfo(null);
    setDiscountError(null);
    setValidatingDiscount(false);
  };

  React.useEffect(() => {
    if (confirmationOpen) {
      if (discountInfo) {
        setFinalPrice(calculateDiscountedPrice());
      } else {
      setFinalPrice(calculateTotalPrice());
    }
    }
  }, [selectedAdditionalPackages, customPackages, confirmationOpen, selectedAppointment, calculateTotalPrice, calculateDiscountedPrice, discountInfo]);

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsOpen(true);
    handleMenuClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon />;
      case 'completed':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  // Filter and search logic
  const filteredAppointments = React.useMemo(() => {
    let filtered = appointments;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(appointment =>
        appointment.client.fullName.toLowerCase().includes(searchLower) ||
        appointment.client.clientId.toLowerCase().includes(searchLower) ||
        appointment.package.name.toLowerCase().includes(searchLower) ||
        (appointment.notes && appointment.notes.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter);
    }

    return filtered;
  }, [appointments, searchTerm, statusFilter]);

  const getStatusCounts = () => {
    return {
      pending: appointments.filter(apt => apt.status === 'pending').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length
    };
  };

  const statusCounts = getStatusCounts();
  const totalRevenue = appointments
    .filter(apt => apt.status === 'completed')
    .reduce((total, apt) => total + (apt.finalPrice || apt.package.price), 0);

  return (
    <DashboardLayout>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 2 }, 
          pb: 2, 
          borderBottom: '1px solid #e5e7eb' 
        }}>
          <Typography 
            variant="h4" 
            fontWeight={800} 
            sx={{ 
              fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: { xs: '1.75rem', sm: '2.125rem' }
            }}
          >
            Appointments
          </Typography>
          {(userRole === 'Boss' || userRole === 'Staff') && (
            <GradientButton
              variant="red"
              animated
              onClick={() => setCreateAppointmentOpen(true)}
              sx={{ 
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Create Appointment
            </GradientButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
            border: 'none', 
            borderRadius: { xs: 4, sm: 5 }, 
            backgroundColor: '#fff',
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              outline: '2px solid #8B0000',
              outlineOffset: '-2px'
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      mb: { xs: 1, sm: 1.5 },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Pending
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={800} 
                    color="#d97706" 
                    sx={{ 
                      fontSize: { xs: '1.5rem', sm: '2.25rem' },
                      lineHeight: 1.1
                    }}
                  >
                    {statusCounts.pending}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#fef3c7', 
                  color: '#d97706', 
                  border: 'none',
                  width: { xs: 32, sm: 44 },
                  height: { xs: 32, sm: 44 },
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)'
                }}>
                  <PendingActionsIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
            border: 'none', 
            borderRadius: { xs: 4, sm: 5 }, 
            backgroundColor: '#fff',
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              outline: '2px solid #8B0000',
              outlineOffset: '-2px'
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      mb: { xs: 1, sm: 1.5 },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Confirmed
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={800} 
                    color="#059669" 
                    sx={{ 
                      fontSize: { xs: '1.5rem', sm: '2.25rem' },
                      lineHeight: 1.1
                    }}
                  >
                    {statusCounts.confirmed}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#d1fae5', 
                  color: '#059669', 
                  border: 'none',
                  width: { xs: 32, sm: 44 },
                  height: { xs: 32, sm: 44 },
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                }}>
                  <CheckCircleIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
            border: 'none', 
            borderRadius: { xs: 4, sm: 5 }, 
            backgroundColor: '#fff',
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              outline: '2px solid #8B0000',
              outlineOffset: '-2px'
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      mb: { xs: 1, sm: 1.5 },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Completed
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={800} 
                    color="#2563eb" 
                    sx={{ 
                      fontSize: { xs: '1.5rem', sm: '2.25rem' },
                      lineHeight: 1.1
                    }}
                  >
                    {statusCounts.completed}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#dbeafe', 
                  color: '#2563eb', 
                  border: 'none',
                  width: { xs: 32, sm: 44 },
                  height: { xs: 32, sm: 44 },
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                }}>
                  <EventIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
            border: 'none', 
            borderRadius: { xs: 4, sm: 5 }, 
            backgroundColor: '#fff',
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              outline: '2px solid #8B0000',
              outlineOffset: '-2px'
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      mb: { xs: 1, sm: 1.5 },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Total Revenue
                  </Typography>
                  <Typography 
                    variant="h4" 
                    fontWeight={800} 
                    color="#dc2626" 
                    sx={{ 
                      fontSize: { xs: '1.5rem', sm: '2.25rem' },
                      lineHeight: 1.1
                    }}
                  >
                    RM{totalRevenue}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#fee2e2', 
                  color: '#dc2626', 
                  border: 'none',
                  width: { xs: 32, sm: 44 },
                  height: { xs: 32, sm: 44 },
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                }}>
                  <AttachMoneyIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', 
            border: 'none', 
            borderRadius: { xs: 4, sm: 5 }, 
            backgroundColor: '#fff',
            transition: 'all 0.3s ease',
            '&:hover': {
              outline: '2px solid #8B0000',
              outlineOffset: '-2px'
            }
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Recent Appointments
              </Typography>

              {/* Filters and Search */}
              <Box sx={{ 
                mb: { xs: 2, sm: 3 }, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 2 }, 
                alignItems: { xs: 'stretch', sm: 'center' }
              }}>
                <TextField
                  placeholder="Search by client, service, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ 
                    flex: { xs: 'none', sm: 1 },
                    maxWidth: { xs: '100%', sm: 400 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 1.5, sm: 2 },
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
                
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 150 },
                    maxWidth: { xs: '100%', sm: 200 }
                  }}
                >
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: 1.5, sm: 2 },
                      }
                    }}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon fontSize="small" color="action" />
                        All Status
                      </Box>
                    </MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ 
                  display: { xs: 'flex', sm: 'flex' }, 
                  alignItems: 'center', 
                  justifyContent: { xs: 'center', sm: 'flex-end' },
                  mt: { xs: 1, sm: 0 },
                  px: { xs: 1, sm: 0 }
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      textAlign: { xs: 'center', sm: 'right' }
                    }}
                  >
                    Showing {filteredAppointments.length} of {appointments.length} appointments
                  </Typography>
                </Box>
              </Box>
            
              {loading ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                Loading appointments...
              </Typography>
            ) : filteredAppointments.length === 0 ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                {appointments.length === 0 ? 'No appointments found.' : 'No appointments match your search criteria.'}
              </Typography>
            ) : isMobile ? (
              // Mobile Card Layout
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {filteredAppointments.map((appointment) => (
                  <Grid item xs={12} key={appointment.id}>
                    <AppointmentCard
                      appointment={appointment}
                      onMenuClick={handleMenuClick}
                      onViewDetails={handleViewDetails}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Desktop Table Layout
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Client</strong></TableCell>
                      <TableCell><strong>Service</strong></TableCell>
                      <TableCell><strong>Barber</strong></TableCell>
                      <TableCell><strong>Price</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Booked Date</strong></TableCell>
                      <TableCell><strong>Duration</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAppointments.map((appointment) => (
                      <TableRow key={appointment.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {appointment.client.fullName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {appointment.client.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.client.clientId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {appointment.package.name}
                          </Typography>
                          {appointment.package.barber && (
                            <Typography variant="caption" color="text.secondary">
                              by {appointment.package.barber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appointment.barber?.name || appointment.package.barber || 'Not assigned'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            RM{appointment.finalPrice || appointment.package.price}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(appointment.status)}
                            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            color={getStatusColor(appointment.status) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(appointment.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appointment.package.duration} mins
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuClick(e, appointment)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            </CardContent>
          </Card>
        </Grid>

         {/* Action Menu */}
         <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewDetails(selectedAppointment!)}>
            View Details
          </MenuItem>
          {/* Boss can change barber for any appointment, Staff only for non-completed/non-cancelled */}
          {userRole === 'Boss' && (
            <MenuItem onClick={() => setChangeBarberOpen(true)}>
              Change Barber
            </MenuItem>
          )}
          {userRole === 'Staff' && selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
            <MenuItem onClick={() => setChangeBarberOpen(true)}>
              Change Barber
            </MenuItem>
          )}
          {selectedAppointment?.status === 'pending' && (
            <MenuItem onClick={() => handleStatusUpdate('confirmed')}>
              Confirm Appointment
            </MenuItem>
          )}
          {selectedAppointment?.status === 'confirmed' && (
            <MenuItem onClick={() => handleStatusUpdate('completed')}>
              Mark as Completed
            </MenuItem>
          )}
          {selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
            <MenuItem onClick={() => handleStatusUpdate('cancelled')} sx={{ color: 'error.main' }}>
              Cancel Appointment
            </MenuItem>
          )}
          {/* Boss can delete any appointment */}
          {userRole === 'Boss' && (
            <MenuItem onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Delete Appointment
            </MenuItem>
          )}
        </Menu>

        {/* Details Dialog */}
        <Dialog 
          open={detailsOpen} 
          onClose={() => setDetailsOpen(false)} 
          maxWidth="sm" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 1, sm: 2 },
              borderRadius: { xs: 2, sm: 2 },
              maxHeight: { xs: '90vh', sm: 'none' }
            }
          }}
        >
          {selectedAppointment && (
            <>
              <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  <Avatar sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
                    <PersonIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selectedAppointment.client.fullName}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                    >
                      {selectedAppointment.client.clientId}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 }, overflow: 'auto' }}>
                <Grid container spacing={{ xs: 2, sm: 2 }}>
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Phone
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {selectedAppointment.client.phoneNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Service
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {selectedAppointment.package.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Price
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      RM{selectedAppointment.finalPrice || selectedAppointment.package.price}
                    </Typography>
                    {selectedAppointment.finalPrice && selectedAppointment.finalPrice !== selectedAppointment.package.price && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                      >
                        Base: RM{selectedAppointment.package.price}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Duration
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {selectedAppointment.package.duration} mins
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Status
                    </Typography>
                    <Chip 
                      label={selectedAppointment.status}
                      color={getStatusColor(selectedAppointment.status) as any}
                      size="small"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                    >
                      Booked Date
                    </Typography>
                    <Typography 
                      variant="body1"
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {formatDate(selectedAppointment.createdAt)}
                    </Typography>
                  </Grid>
                  {selectedAppointment.notes && (
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 0.5 }}
                      >
                        Notes
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          lineHeight: 1.5
                        }}
                      >
                        {selectedAppointment.notes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
                <GradientButton 
                  variant="red"
                  animated
                  sx={{ 
                    px: { xs: 2, sm: 3 }, 
                    py: { xs: 1, sm: 1.2 }, 
                    fontSize: { xs: 13, sm: 14 },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </GradientButton>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Confirmation Modal for Completion */}
        <Dialog 
          open={confirmationOpen} 
          onClose={resetConfirmationModal} 
          maxWidth="lg" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 1, sm: 2 },
              borderRadius: { xs: 2, sm: 3 },
              maxHeight: { xs: '95vh', sm: '90vh' },
              height: { xs: 'auto', sm: 'fit-content' }
            }
          }}
        >
          <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Complete Appointment
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                mt: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {selectedAppointment && `${selectedAppointment.client.fullName} - ${selectedAppointment.package.name}`}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 1, sm: 2 },
            overflow: 'auto',
            maxHeight: { xs: '70vh', sm: '65vh' }
          }}>
            <Stack spacing={3.5} sx={{ mt: 0.5 }}>
              {/* Services Section - Side by Side Layout */}
              <Grid container spacing={0}>
                {/* Additional Packages */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ pr: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Additional Packages
                </Typography>
                    <FormControl fullWidth size="small">
                  <InputLabel>Select Additional Packages</InputLabel>
                  <Select
                    multiple
                    value={selectedAdditionalPackages}
                    onChange={(e) => setSelectedAdditionalPackages(e.target.value as number[])}
                    label="Select Additional Packages"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const pkg = packages.find(p => p.id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={pkg ? `${pkg.name} (RM${pkg.price})` : value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {packages.map((pkg) => (
                      <MenuItem key={pkg.id} value={pkg.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography>{pkg.name}</Typography>
                          <Typography color="success.main" fontWeight={600}>
                            RM{pkg.price}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
                </Grid>

                {/* Discount Code */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ pl: { xs: 0, md: 1 } }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      Discount Code (Optional)
                    </Typography>
                    <TextField
                      label="Enter Discount Code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="e.g., SUMMER20"
                      fullWidth
                      size="small"
                      error={!!discountError}
                      helperText={discountError || 'Enter code and click Apply'}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <GradientButton
                              variant="blue"
                              onClick={() => validateDiscountCode(discountCode)}
                              disabled={!discountCode.trim() || validatingDiscount}
                              sx={{ px: 2, py: 0.5, fontSize: 12, minWidth: 'auto' }}
                            >
                              {validatingDiscount ? 'Checking...' : 'Apply'}
                            </GradientButton>
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    {discountInfo && (
                      <Box sx={{ 
                        p: 1.5, 
                        mt: 1,
                        bgcolor: 'success.light', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'success.main'
                      }}>
                        <Typography variant="body2" fontWeight={600} color="success.dark" sx={{ mb: 0.5 }}>
                          ✓ {discountInfo.code} ({discountInfo.discountPercent}% off)
                        </Typography>
                        <Typography variant="caption" color="success.dark">
                          Saves RM{((calculateTotalPrice() * discountInfo.discountPercent) / 100).toFixed(2)}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            setDiscountCode('');
                            setDiscountInfo(null);
                            setDiscountError(null);
                            setFinalPrice(calculateTotalPrice());
                          }}
                          sx={{ ml: 1, fontSize: 10, minWidth: 'auto', px: 1 }}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Custom Packages - Compact Layout */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Custom Packages
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2 }}>
                    <TextField
                      label="Package Name"
                      value={customPackageName}
                      onChange={(e) => setCustomPackageName(e.target.value)}
                      sx={{ flex: 1 }}
                      size="small"
                    />
                    <TextField
                      label="Price"
                      type="number"
                      value={customPackagePrice || ''}
                      onChange={(e) => setCustomPackagePrice(parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">RM</InputAdornment>,
                      }}
                      sx={{ width: 120 }}
                      size="small"
                    />
                    <GradientButton
                      variant="blue"
                      onClick={handleAddCustomPackage}
                      disabled={!customPackageName.trim() || customPackagePrice <= 0}
                      sx={{ px: 2, py: 1, fontSize: 12 }}
                    >
                      Add
                    </GradientButton>
                  </Box>
                  
                  {customPackages.length > 0 && (
                    <Box>
                      {customPackages.map((pkg, index) => (
                        <Chip
                          key={index}
                          label={`${pkg.name} - RM${pkg.price}`}
                          onDelete={() => handleRemoveCustomPackage(index)}
                          sx={{ mr: 1, mb: 1 }}
                          color="primary"
                          variant="outlined"
                        size="small"
                        />
                      ))}
                    </Box>
                  )}
              </Box>

              {/* Price Summary */}
              <Box sx={{ 
                p: 2.5, 
                bgcolor: 'grey.50', 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Price Summary
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      Base Package: {selectedAppointment?.package.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      RM{selectedAppointment?.package.price}
                    </Typography>
                  </Box>
                  
                  {selectedAdditionalPackages.map(packageId => {
                    const pkg = packages.find(p => p.id === packageId);
                    return pkg ? (
                      <Box key={packageId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          + {pkg.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          RM{pkg.price}
                        </Typography>
                      </Box>
                    ) : null;
                  })}
                  
                  {customPackages.map((pkg, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        + {pkg.name} (Custom)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        RM{pkg.price}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    pt: 1, 
                    borderTop: '1px solid',
                    borderColor: 'grey.300'
                  }}>
                    <Typography variant="body1" fontWeight={600}>
                      Subtotal:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      RM{calculateTotalPrice()}
                    </Typography>
                  </Box>
                  
                  {discountInfo && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        Discount ({discountInfo.discountPercent}%):
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        -RM{((calculateTotalPrice() * discountInfo.discountPercent) / 100).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    pt: 1, 
                    borderTop: '2px solid',
                    borderColor: 'grey.400'
                  }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total Amount:
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      RM{discountInfo ? calculateDiscountedPrice().toFixed(2) : calculateTotalPrice()}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Final Price Adjustment */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                  Final Price Adjustment
                </Typography>
                <TextField
                  label="Final Price"
                  type="number"
                  value={finalPrice || ''}
                  onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">RM</InputAdornment>,
                  }}
                  fullWidth
                  size="small"
                  helperText="Manually adjust if needed (e.g., rounding, extra discounts)"
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 }, 
            gap: { xs: 1.5, sm: 2 },
            flexDirection: 'row'
          }}>
            <GradientButton
              variant="blue"
              animated
              onClick={resetConfirmationModal}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Cancel
            </GradientButton>
            <GradientButton
              variant="red"
              animated
              onClick={() => {
                console.log('Confirm & Complete button clicked');
                handleConfirmCompletion();
              }}
              disabled={isCompleting}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              {isCompleting ? 'Completing...' : 'Confirm'}
            </GradientButton>
          </DialogActions>
        </Dialog>

        {/* Create Appointment Modal */}
        <Dialog 
          open={createAppointmentOpen} 
          onClose={() => setCreateAppointmentOpen(false)} 
          maxWidth="sm" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 1, sm: 2 },
              borderRadius: { xs: 2, sm: 2 },
              maxHeight: { xs: '90vh', sm: 'none' }
            }
          }}
        >
          <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Create New Appointment
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Client Selection */}
              <FormControl fullWidth>
                <InputLabel>Select Client</InputLabel>
                <Select
                  value={newAppointment.clientId}
                  onChange={(e) => setNewAppointment({...newAppointment, clientId: e.target.value})}
                  label="Select Client"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{client.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.clientId} - {client.phoneNumber}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Package Selection */}
              <FormControl fullWidth>
                <InputLabel>Select Package</InputLabel>
                <Select
                  value={newAppointment.packageId}
                  onChange={(e) => setNewAppointment({...newAppointment, packageId: e.target.value})}
                  label="Select Package"
                >
                  {packages.map((pkg) => (
                    <MenuItem key={pkg.id} value={pkg.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Box>
                          <Typography>{pkg.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pkg.duration} mins {pkg.barber && `• by ${pkg.barber}`}
                          </Typography>
                        </Box>
                        <Typography color="success.main" fontWeight={600}>
                          RM{pkg.price}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Appointment Date */}
              <TextField
                label="Appointment Date & Time"
                type="datetime-local"
                value={newAppointment.appointmentDate}
                onChange={(e) => setNewAppointment({...newAppointment, appointmentDate: e.target.value})}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Optional - leave empty for walk-in appointments"
              />

              {/* Notes */}
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                fullWidth
                placeholder="Any special requirements or notes..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 }, 
            gap: { xs: 1.5, sm: 2 },
            flexDirection: 'row'
          }}>
            <GradientButton
              variant="blue"
              animated
              onClick={() => setCreateAppointmentOpen(false)}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Cancel
            </GradientButton>
            <GradientButton
              variant="red"
              animated
              onClick={handleCreateAppointment}
              disabled={!newAppointment.clientId || !newAppointment.packageId}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Create
            </GradientButton>
          </DialogActions>
        </Dialog>

        {/* Change Barber Dialog */}
        <Dialog 
          open={changeBarberOpen} 
          onClose={() => setChangeBarberOpen(false)} 
          maxWidth="sm" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 1, sm: 2 },
              borderRadius: { xs: 2, sm: 2 },
              maxHeight: { xs: '90vh', sm: 'none' }
            }
          }}
        >
          <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Change Barber
            </Typography>
            {selectedAppointment && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedAppointment.client.fullName} - {selectedAppointment.package.name}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Select Barber</InputLabel>
                <Select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  label="Select Barber"
                >
                  <MenuItem value="unassign">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>Unassign (No barber)</Typography>
                    </Box>
                  </MenuItem>
                  {staff.filter(member => member.status === 'active').map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Typography>{member.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.role}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {selectedAppointment && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    Current Assignment:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAppointment.barber?.name || 'Not assigned'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 }, 
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1.5, sm: 2 },
            flexDirection: 'row'
          }}>
            <GradientButton
              variant="blue"
              animated
              onClick={() => setChangeBarberOpen(false)}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Cancel
            </GradientButton>
            <GradientButton
              variant="red"
              animated
              onClick={handleChangeBarber}
              disabled={!selectedBarberId}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Change Barber
            </GradientButton>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteConfirmOpen} 
          onClose={() => setDeleteConfirmOpen(false)} 
          maxWidth="sm" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 1, sm: 2 },
              borderRadius: { xs: 2, sm: 2 },
              maxHeight: { xs: '90vh', sm: 'none' }
            }
          }}
        >
          <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              Delete Appointment
            </Typography>
            {selectedAppointment && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Are you sure you want to delete this appointment?
              </Typography>
            )}
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
            {selectedAppointment && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Appointment Details:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Client:</strong> {selectedAppointment.client.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Service:</strong> {selectedAppointment.package.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {selectedAppointment.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Price:</strong> RM{selectedAppointment.finalPrice || selectedAppointment.package.price}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 500 }}>
              ⚠️ This action cannot be undone. The appointment will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 }, 
            pb: { xs: 2, sm: 3 },
            gap: { xs: 1.5, sm: 2 },
            flexDirection: 'row'
          }}>
            <GradientButton
              variant="blue"
              animated
              onClick={() => setDeleteConfirmOpen(false)}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Cancel
            </GradientButton>
            <GradientButton
              variant="red"
              animated
              onClick={handleDeleteAppointment}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Delete Appointment
            </GradientButton>
          </DialogActions>
        </Dialog>

      </Grid>

      {/* Success/Error Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
