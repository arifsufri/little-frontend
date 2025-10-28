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
  useMediaQuery
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
import { apiGet, apiPost, apiPut } from '../../../src/utils/axios';
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
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [createAppointmentOpen, setCreateAppointmentOpen] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);
  const [newAppointment, setNewAppointment] = React.useState({
    clientId: '',
    packageId: '',
    appointmentDate: '',
    notes: ''
  });

  React.useEffect(() => {
    fetchAppointments();
    fetchPackages();
    fetchClients();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Appointment[] }>('/appointments');
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

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
        finalPrice: finalPrice
      };

      console.log('Sending update data:', updateData);
      
      const response = await apiPut(`/appointments/${selectedAppointment.id}`, updateData);
      console.log('Update response:', response);
      
      // Reset modal state
      resetConfirmationModal();
      
      // Refresh appointments
      await fetchAppointments();
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
      alert(errorMessage);
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

  const calculateTotalPrice = () => {
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
  };

  const resetConfirmationModal = () => {
    setConfirmationOpen(false);
    setSelectedAppointment(null);
    setSelectedAdditionalPackages([]);
    setCustomPackages([]);
    setFinalPrice(0);
    setCustomPackageName('');
    setCustomPackagePrice(0);
  };

  React.useEffect(() => {
    if (confirmationOpen) {
      setFinalPrice(calculateTotalPrice());
    }
  }, [selectedAdditionalPackages, customPackages, confirmationOpen, selectedAppointment]);

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
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif' }}>
            Appointments
          </Typography>
          {userRole === 'Boss' && (
            <GradientButton
              variant="blue"
              onClick={() => setCreateAppointmentOpen(true)}
              sx={{ px: 3, py: 1.2, fontSize: 14 }}
            >
              Create Appointment
            </GradientButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Pending
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#d97706" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {statusCounts.pending}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#f3f4f6', 
                  color: '#111827', 
                  border: '1px solid #e5e7eb',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 }
                }}>
                  <PendingActionsIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Confirmed
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#059669" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {statusCounts.confirmed}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#f3f4f6', 
                  color: '#111827', 
                  border: '1px solid #e5e7eb',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 }
                }}>
                  <CheckCircleIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Completed
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#2563eb" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {statusCounts.completed}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#f3f4f6', 
                  color: '#111827', 
                  border: '1px solid #e5e7eb',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 }
                }}>
                  <EventIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#dc2626" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    RM{totalRevenue}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: '#f3f4f6', 
                  color: '#111827', 
                  border: '1px solid #e5e7eb',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 }
                }}>
                  <AttachMoneyIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Recent Appointments
              </Typography>

              {/* Filters and Search */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  placeholder="Search by client, service, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 300 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
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
                
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start" sx={{ ml: 1 }}>
                        <FilterListIcon color="action" fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ 
                  ml: { xs: 0, sm: 'auto' }, 
                  width: { xs: '100%', sm: 'auto' },
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  justifyContent: { xs: 'center', sm: 'flex-end' }
                }}>
                  <Typography variant="body2" color="text.secondary">
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
              <Grid container spacing={2}>
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
        </Menu>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
          {selectedAppointment && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedAppointment.client.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedAppointment.client.clientId}
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedAppointment.client.phoneNumber}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Service</Typography>
                    <Typography variant="body1">{selectedAppointment.package.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Price</Typography>
                    <Typography variant="body1">RM{selectedAppointment.finalPrice || selectedAppointment.package.price}</Typography>
                    {selectedAppointment.finalPrice && selectedAppointment.finalPrice !== selectedAppointment.package.price && (
                      <Typography variant="caption" color="text.secondary">
                        Base: RM{selectedAppointment.package.price}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">{selectedAppointment.package.duration} mins</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={selectedAppointment.status}
                      color={getStatusColor(selectedAppointment.status) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Booked Date</Typography>
                    <Typography variant="body1">{formatDate(selectedAppointment.createdAt)}</Typography>
                  </Grid>
                  {selectedAppointment.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                      <Typography variant="body1">{selectedAppointment.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <GradientButton 
                  variant="red"
                  animated
                  sx={{ px: 3, py: 1.2, fontSize: 14 }}
                  onClick={() => setDetailsOpen(false)}
                >
                  Close
                </GradientButton>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Confirmation Modal for Completion */}
        <Dialog open={confirmationOpen} onClose={resetConfirmationModal} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Complete Appointment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedAppointment && `${selectedAppointment.client.fullName} - ${selectedAppointment.package.name}`}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Additional Packages */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Additional Packages
                </Typography>
                <FormControl fullWidth>
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

              {/* Custom Packages */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Custom Packages
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
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
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Added Custom Packages:
                      </Typography>
                      {customPackages.map((pkg, index) => (
                        <Chip
                          key={index}
                          label={`${pkg.name} - RM${pkg.price}`}
                          onDelete={() => handleRemoveCustomPackage(index)}
                          sx={{ mr: 1, mb: 1 }}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Price Summary */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
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
                      Calculated Total:
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      RM{calculateTotalPrice()}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Final Price Adjustment */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
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
                  helperText="You can adjust the final price if needed (e.g., discounts, promotions)"
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <GradientButton
              variant="red"
              onClick={resetConfirmationModal}
              sx={{ px: 3, py: 1.2, fontSize: 14 }}
            >
              Cancel
            </GradientButton>
            <GradientButton
              variant="green"
              onClick={() => {
                console.log('Confirm & Complete button clicked');
                handleConfirmCompletion();
              }}
              disabled={isCompleting}
              sx={{ px: 3, py: 1.2, fontSize: 14 }}
            >
              {isCompleting ? 'Completing...' : 'Confirm & Complete'}
            </GradientButton>
          </DialogActions>
        </Dialog>

        {/* Create Appointment Modal */}
        <Dialog open={createAppointmentOpen} onClose={() => setCreateAppointmentOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              Create New Appointment
            </Typography>
          </DialogTitle>
          <DialogContent>
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
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <GradientButton
              variant="red"
              onClick={() => setCreateAppointmentOpen(false)}
              sx={{ px: 3, py: 1.2, fontSize: 14 }}
            >
              Cancel
            </GradientButton>
            <GradientButton
              variant="green"
              onClick={handleCreateAppointment}
              disabled={!newAppointment.clientId || !newAppointment.packageId}
              sx={{ px: 3, py: 1.2, fontSize: 14 }}
            >
              Create Appointment
            </GradientButton>
          </DialogActions>
        </Dialog>

      </Grid>
    </DashboardLayout>
  );
}
