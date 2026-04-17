'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
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
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import PendingIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PercentIcon from '@mui/icons-material/Percent';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockResetIcon from '@mui/icons-material/LockReset';
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Staff {
  id: number;
  name: string;
  email: string;
  idNumber?: string;
  phone: string;
  role: 'Boss' | 'Staff';
  status: 'active' | 'inactive';
  joinDate: string;
  commissionRate: number;
  totalAppointments: number;
  totalRevenue: number;
}

interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  totalAppointments: number;
  totalRevenue: number;
}

export default function StaffPage() {
  const { userRole } = useUserRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [createStaffOpen, setCreateStaffOpen] = React.useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<Staff | null>(null);
  const [commissionRate, setCommissionRate] = React.useState('');
  const [deletingStaff, setDeletingStaff] = React.useState<Staff | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuStaff, setMenuStaff] = React.useState<Staff | null>(null);
  const [idNumberDialogOpen, setIdNumberDialogOpen] = React.useState(false);
  const [newIdNumber, setNewIdNumber] = React.useState('');
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [newStaff, setNewStaff] = React.useState({
    name: '',
    idNumber: '',
    phone: '',
    role: 'Staff' as 'Boss' | 'Staff'
  });
  const [showNewStaffId, setShowNewStaffId] = React.useState(false);
  const [showEditStaffId, setShowEditStaffId] = React.useState(false);

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  React.useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await apiGet('/staff') as any;
        if (response.success) {
          setStaff(response.data || []);
        } else {
          console.error('Failed to fetch staff:', response.error);
          setStaff([]);
        }
      } catch (error: any) {
        console.error('Error fetching staff:', error);
        setStaff([]);
    } finally {
      setLoading(false);
    }
  };

    fetchStaff();
  }, []);

  const handleCreateStaff = async () => {
    try {
      // Validate ID number
      if (!/^\d{4}$/.test(newStaff.idNumber)) {
        showNotification('ID number must be exactly 4 digits', 'error');
        return;
      }

      const response = await apiPost('/staff', newStaff) as any;
      if (response.success) {
        setStaff([...staff, response.data]);
      setCreateStaffOpen(false);
      setNewStaff({
        name: '',
        idNumber: '',
          phone: '',
        role: 'Staff'
      });
        showNotification(`Staff member added successfully with ID: ${newStaff.idNumber}`, 'success');
      } else {
        showNotification(response.message || 'Failed to add staff member. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error creating staff:', error);
      // Extract error message from axios error response
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add staff member. Please try again.';
      showNotification(errorMessage, 'error');
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedStaff) return;
    
    try {
      const updateData = {
        commissionRate: parseFloat(commissionRate)
      };

      const response = await apiPatch(`/financial/commission/${selectedStaff.id}`, updateData) as any;

      if (response.success) {
        // Update the staff list with new commission rates
        setStaff(staff.map(member => 
          member.id === selectedStaff.id 
            ? { 
                ...member, 
                commissionRate: parseFloat(commissionRate)
              }
            : member
        ));
        setCommissionDialogOpen(false);
        setSelectedStaff(null);
        setCommissionRate('');
        showNotification('Commission rate updated successfully!', 'success');
      } else {
        showNotification(response.message || 'Failed to update commission rate', 'error');
      }
    } catch (error: any) {
      console.error('Error updating commission rate:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update commission rate';
      showNotification(errorMessage, 'error');
    }
  };

  const openCommissionDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setCommissionRate((staffMember.commissionRate || 0).toString());
    setCommissionDialogOpen(true);
  };

  const handleToggleStatus = async (staffMember: Staff) => {
    try {
      const response = await apiPatch(`/staff/${staffMember.id}/toggle-status`) as any;
      if (response.success) {
        // Update the staff list with new status
        setStaff(staff.map(member => 
          member.id === staffMember.id 
            ? { ...member, status: member.status === 'active' ? 'inactive' : 'active' }
            : member
        ));
        showNotification(`Staff member ${staffMember.status === 'active' ? 'deactivated' : 'activated'} successfully!`, 'success');
      } else {
        showNotification(response.message || 'Failed to update staff status', 'error');
      }
    } catch (error: any) {
      console.error('Error toggling staff status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update staff status';
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    
    try {
      const response = await apiDelete(`/staff/${deletingStaff.id}`) as any;
      if (response.success) {
        // Remove staff from the list
        setStaff(staff.filter(member => member.id !== deletingStaff.id));
        setDeletingStaff(null);
        showNotification('Staff member deleted successfully!', 'success');
      } else {
        showNotification(response.message || 'Failed to delete staff member', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete staff member';
      showNotification(errorMessage, 'error');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, staffMember: Staff) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuStaff(staffMember);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuStaff(null);
  };

  const handleMenuAction = (action: string) => {
    if (!menuStaff) return;
    
    switch (action) {
      case 'commission':
        openCommissionDialog(menuStaff);
        break;
      case 'idnumber':
        setSelectedStaff(menuStaff);
        setNewIdNumber(menuStaff.idNumber || '');
        setIdNumberDialogOpen(true);
        break;
      case 'toggle':
        handleToggleStatus(menuStaff);
        break;
      case 'delete':
        setDeletingStaff(menuStaff);
        break;
    }
    handleMenuClose();
  };

  const handleSetIdNumber = async () => {
    if (!selectedStaff) return;

    // Validation
    if (!newIdNumber) {
      setSnackbar({
        open: true,
        message: 'Please enter an ID number',
        severity: 'error'
      });
      return;
    }

    if (!/^\d{4}$/.test(newIdNumber)) {
      setSnackbar({
        open: true,
        message: 'ID number must be exactly 4 digits',
        severity: 'error'
      });
      return;
    }

    try {
      await apiPut(`/auth/users/${selectedStaff.id}/idnumber`, {
        idNumber: newIdNumber
      });

      // Update the staff list with new ID number
      setStaff(staff.map(member => 
        member.id === selectedStaff.id 
          ? { ...member, idNumber: newIdNumber }
          : member
      ));

      setSnackbar({
        open: true,
        message: `ID number set successfully for ${selectedStaff.name}`,
        severity: 'success'
      });

      // Reset and close
      setIdNumberDialogOpen(false);
      setNewIdNumber('');
      setSelectedStaff(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to set ID number',
        severity: 'error'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'error';
  };

  const getRoleColor = (role: string) => {
    return role === 'Boss' ? 'primary' : 'secondary';
  };

  // Filter and search logic
  const filteredStaff = React.useMemo(() => {
    let filtered = staff;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.phone.includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    return filtered;
  }, [staff, searchTerm, statusFilter]);

  const getStaffStats = (): StaffStats => {
    return {
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.status === 'active').length,
      totalAppointments: staff.reduce((total, s) => total + s.totalAppointments, 0),
      totalRevenue: staff.reduce((total, s) => total + s.totalRevenue, 0)
    };
  };

  const stats = getStaffStats();
  const statCardSx = {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
    backgroundColor: '#fff',
    height: '100%',
  };
  const dialogPaperProps = {
    sx: {
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
    },
  };
  const modalTitleSx = {
    py: 2,
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: 'rgba(248, 250, 252, 0.9)',
  };
  const modalContentSx = {
    px: { xs: 2, sm: 3 },
    py: { xs: 2, sm: 2.5 },
    overflow: 'auto',
    bgcolor: '#fcfcfd',
  };
  const modalActionsSx = {
    px: { xs: 2, sm: 3 },
    py: { xs: 1.75, sm: 2.25 },
    gap: { xs: 1.25, sm: 1.5 },
    flexDirection: 'row',
    borderTop: '1px solid',
    borderColor: 'divider',
    bgcolor: 'rgba(248, 250, 252, 0.85)',
  };
  const secondaryButtonSx = {
    flex: 1,
    borderRadius: 2,
    py: 1.1,
    textTransform: 'none',
    fontWeight: 600,
    borderColor: 'grey.300',
    color: 'text.secondary',
    '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' },
  };
  const primaryButtonSx = {
    flex: 1,
    borderRadius: 2,
    py: 1.1,
    textTransform: 'none',
    fontWeight: 700,
    bgcolor: '#dc2626',
    boxShadow: '0 8px 20px rgba(220, 38, 38, 0.28)',
    '&:hover': { bgcolor: '#b91c1c', boxShadow: '0 10px 24px rgba(185, 28, 28, 0.34)' },
    '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#94a3b8' },
  };
  const getRoleChipSx = (role: Staff['role']) => ({
    borderRadius: 2,
    fontWeight: 700,
    border: '1px solid',
    ...(role === 'Boss'
      ? { bgcolor: '#eff6ff', color: '#1d4ed8', borderColor: '#93c5fd' }
      : { bgcolor: '#faf5ff', color: '#9333ea', borderColor: '#d8b4fe' }),
  });
  const getStaffStatusChipSx = (status: Staff['status']) => ({
    borderRadius: 2,
    fontWeight: 700,
    border: '1px solid',
    textTransform: 'capitalize',
    ...(status === 'active'
      ? { bgcolor: '#ecfdf5', color: '#047857', borderColor: '#6ee7b7' }
      : { bgcolor: '#fef2f2', color: '#b91c1c', borderColor: '#fca5a5' }),
  });

  // Only Boss can access this page
  if (userRole !== 'Boss') {
  return (
    <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Only Boss can access the staff management page.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 2, sm: 3 },
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(248,113,113,0.08) 45%, rgba(255,255,255,0.92))',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 2 },
        }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Staff Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage team members, roles, commissions, and activity.
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={() => setCreateStaffOpen(true)}
            sx={{
              px: { xs: 2, sm: 1.25 },
              py: 1,
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: '100%', sm: 44 },
              borderRadius: 999,
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: { xs: 13, sm: 14 },
              fontWeight: 700,
              lineHeight: 1,
              boxShadow: '0 8px 18px rgba(220, 38, 38, 0.22)',
              bgcolor: '#dc2626',
              color: '#fff',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 220ms ease',
              '&:hover': {
                bgcolor: '#b91c1c',
                boxShadow: '0 10px 22px rgba(185, 28, 28, 0.28)',
                px: { xs: 2, sm: 2.25 },
                '& .create-staff-label': {
                  maxWidth: { xs: 160, sm: 120 },
                  opacity: 1,
                  marginLeft: 0.75,
                },
              },
            }}
            aria-label="Add new staff"
          >
            <AddIcon sx={{ fontSize: 20, flexShrink: 0 }} />
            <Box
              component="span"
              className="create-staff-label"
              sx={{
                display: 'inline-block',
                whiteSpace: 'nowrap',
                maxWidth: { xs: 160, sm: 0 },
                opacity: { xs: 1, sm: 0 },
                marginLeft: { xs: 0.75, sm: 0 },
                lineHeight: 1,
                transition: 'all 220ms ease',
              }}
            >
              Add Staff
            </Box>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Stats Cards */}
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={statCardSx}>
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
                    Total Staff
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
                    {stats.totalStaff}
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
                  <GroupIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={statCardSx}>
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
                    Active Staff
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
                    {stats.activeStaff}
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
                  <PersonIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={statCardSx}>
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
                    Appointments
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
                    {stats.totalAppointments}
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
                  <PendingIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={statCardSx}>
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
                    RM{stats.totalRevenue}
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

        {/* Staff List */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                sx={{ 
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Staff Members
              </Typography>

              {/* Filters and Search */}
              <Box
                sx={{
                  mb: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1.25, sm: 1.25 },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#fafafa',
                }}
              >
                <TextField
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ 
                    flex: { xs: 'none', sm: 1 },
                    maxWidth: { xs: '100%', sm: 400 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: { xs: 1.5, sm: 1.5 },
                      height: 40,
                      bgcolor: 'background.paper',
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
                    maxWidth: { xs: '100%', sm: 200 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: 40,
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon fontSize="small" color="action" />
                        All Status
                      </Box>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ 
                  display: { xs: 'flex', sm: 'flex' }, 
                  alignItems: 'center', 
                  justifyContent: { xs: 'center', sm: 'flex-end' },
                  mt: { xs: 1, sm: 0 },
                  px: { xs: 1, sm: 0 }
                }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.6,
                      borderRadius: 999,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.78rem', sm: '0.82rem' },
                        textAlign: { xs: 'center', sm: 'right' }
                      }}
                    >
                      Showing {filteredStaff.length} of {staff.length} staff members
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {loading ? (
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  Loading staff members...
                </Typography>
              ) : filteredStaff.length === 0 ? (
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  {staff.length === 0 ? 'No staff members found.' : 'No staff members match your search criteria.'}
                </Typography>
              ) : isMobile ? (
                // Mobile Card Layout
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {filteredStaff.map((member) => (
                    <Grid item xs={12} key={member.id}>
                      <Card sx={{
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                        border: 'none',
                        borderRadius: { xs: 3, sm: 4 },
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          outline: '2px solid #8B0000',
                          outlineOffset: '-2px'
                        }
                      }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem',
                                fontWeight: 600
                              }}
                            >
                              {member.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem', mb: 0.5 }}>
                                {member.name}
                            </Typography>
                              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip 
                                  label={member.role}
                                  color={getRoleColor(member.role) as any}
                                size="small"
                                  sx={{ fontSize: '0.75rem' }}
                              />
                              <Chip 
                                  label={member.status}
                                  color={getStatusColor(member.status) as any}
                                size="small"
                                  sx={{ fontSize: '0.75rem' }}
                              />
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                ID: {member.idNumber || 'Not set'} {member.phone && `• ${member.phone}`}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip 
                                    label={`Service: ${member.commissionRate || 0}%`}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </Box>
                            </Box>
                          </Box>
                            {userRole === 'Boss' && (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <IconButton
                          size="small"
                                  onClick={(e) => handleMenuOpen(e, member)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                            )}
                          </Stack>
                        </CardContent>
                    </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                // Desktop Table Layout
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, borderColor: 'divider', boxShadow: 'none', overflowX: 'auto', overflowY: 'hidden' }}>
                  <Table sx={{ minWidth: 980 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(148, 163, 184, 0.12)' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Staff Member</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>ID Number</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Commission</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Join Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Performance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStaff.map((member) => (
                        <TableRow
                          key={member.id}
                          hover
                          sx={{
                            '&:last-of-type td': { borderBottom: 0 },
                            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.04)' },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                                {member.name.charAt(0)}
                              </Avatar>
                              <Box>
                              <Typography variant="body2" fontWeight={500}>
                                  {member.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {member.phone || 'No phone'}
                              </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {member.idNumber || 'Not set'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={member.role}
                              color={getRoleColor(member.role) as any}
                              size="small"
                              variant="filled"
                              sx={getRoleChipSx(member.role)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={member.status}
                              color={getStatusColor(member.status) as any}
                              size="small"
                              variant="filled"
                              sx={getStaffStatusChipSx(member.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip 
                                label={`Service: ${member.commissionRate || 0}%`}
                                size="small"
                                variant="filled"
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 700,
                                  border: '1px solid',
                                  borderColor: '#fecaca',
                                  bgcolor: '#fef2f2',
                                  color: '#b91c1c',
                                }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(member.joinDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {member.totalAppointments} appointments
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              RM{member.totalRevenue} revenue
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {userRole === 'Boss' && (
                            <IconButton
                              size="small"
                                onClick={(e) => handleMenuOpen(e, member)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  bgcolor: 'transparent',
                                  width: 30,
                                  height: 30,
                                  p: 0.5,
                                  '&:hover': { bgcolor: 'rgba(100, 116, 139, 0.08)' },
                                }}
                            >
                              <MoreVertIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                            )}
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
      </Grid>

      {/* Create Staff Modal */}
      <Dialog 
        open={createStaffOpen} 
        onClose={() => {
          setCreateStaffOpen(false);
          setShowNewStaffId(false);
        }} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 2 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
            maxHeight: { xs: '90vh', sm: 'none' }
          }
        }}
      >
        <DialogTitle sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248, 250, 252, 0.9)' }}>
          <Typography 
            variant="h6" 
            fontWeight={600}
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Add New Staff Member
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, overflow: 'auto', bgcolor: '#fcfcfd' }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={newStaff.name}
              onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              fullWidth
              required
            />

            <TextField
              label="ID Number"
              type={showNewStaffId ? 'text' : 'password'}
              value={newStaff.idNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setNewStaff({...newStaff, idNumber: value});
              }}
              fullWidth
              required
              placeholder="••••"
              autoComplete="off"
              name="new-staff-id"
              inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
              helperText="4-digit login ID (masked like a password — use eye icon to show)"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showNewStaffId ? 'Hide ID' : 'Show ID'}
                      onClick={() => setShowNewStaffId((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showNewStaffId ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Phone Number"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
              fullWidth
              placeholder="012-3456789 (optional)"
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newStaff.role}
                onChange={(e) => setNewStaff({...newStaff, role: e.target.value as 'Boss' | 'Staff'})}
                label="Role"
              >
                <MenuItem value="Staff">Staff</MenuItem>
                <MenuItem value="Boss">Boss</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2.25 }, gap: { xs: 1.25, sm: 1.5 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248, 250, 252, 0.85)' }}>
          <Button
            variant="outlined"
            onClick={() => setCreateStaffOpen(false)}
            sx={{ 
              flex: 1,
              borderRadius: 2,
              py: 1.1,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'grey.300',
              color: 'text.secondary',
              '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateStaff}
            disabled={!newStaff.name || !newStaff.idNumber || newStaff.idNumber.length !== 4}
            sx={{ 
              flex: 1,
              borderRadius: 2,
              py: 1.1,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#dc2626',
              boxShadow: '0 8px 20px rgba(220, 38, 38, 0.28)',
              '&:hover': { bgcolor: '#b91c1c', boxShadow: '0 10px 24px rgba(185, 28, 28, 0.34)' },
              '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#94a3b8' },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Commission Rate Dialog */}
      <Dialog 
        open={commissionDialogOpen} 
        onClose={() => setCommissionDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ ...dialogPaperProps, sx: { ...dialogPaperProps.sx, margin: { xs: 1, sm: 2 }, maxHeight: { xs: '90vh', sm: 'none' } } }}
      >
        <DialogTitle sx={modalTitleSx}>
          <Typography 
            variant="h6" 
            fontWeight={600}
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            Update Commission Rate
          </Typography>
          {selectedStaff && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedStaff.name} ({selectedStaff.role})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={modalContentSx}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Appointment Commission Rate (%)"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText="Commission rate for service appointments (0-100%)"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={modalActionsSx}>
          <Button
            variant="outlined"
            onClick={() => setCommissionDialogOpen(false)}
            sx={secondaryButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateCommission}
            disabled={!commissionRate || parseFloat(commissionRate) < 0 || parseFloat(commissionRate) > 100}
            sx={primaryButtonSx}
          >
            Update Commission
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu - Boss Only */}
      {userRole === 'Boss' && (
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 14px 30px rgba(15, 23, 42, 0.14)',
              p: 0.5,
            },
          }}
        >
          <MenuItem onClick={() => handleMenuAction('commission')} sx={{ borderRadius: 1.5, py: 1.1 }}>
            <ListItemIcon>
              <PercentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Commission</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleMenuAction('idnumber')} sx={{ borderRadius: 1.5, py: 1.1 }}>
            <ListItemIcon>
              <LockResetIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Set ID Number</ListItemText>
          </MenuItem>
          
          {menuStaff && (
            <MenuItem onClick={() => handleMenuAction('toggle')} sx={{ borderRadius: 1.5, py: 1.1 }}>
              <ListItemIcon>
                {menuStaff.status === 'active' ? (
                  <PersonOffIcon fontSize="small" />
                ) : (
                  <PersonAddIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {menuStaff.status === 'active' ? 'Deactivate' : 'Activate'}
              </ListItemText>
            </MenuItem>
          )}
          
          <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main', borderRadius: 1.5, py: 1.1 }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Staff</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Set ID Number Dialog */}
      <Dialog
        open={idNumberDialogOpen}
        onClose={() => {
          setIdNumberDialogOpen(false);
          setNewIdNumber('');
          setSelectedStaff(null);
          setShowEditStaffId(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogTitle sx={modalTitleSx}>
          <Typography variant="h6" fontWeight={600}>
            Set ID Number for {selectedStaff?.name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={modalContentSx}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="ID Number"
              type={showEditStaffId ? 'text' : 'password'}
              value={newIdNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setNewIdNumber(value);
              }}
              fullWidth
              required
              placeholder="••••"
              autoComplete="off"
              name="edit-staff-id"
              inputProps={{ maxLength: 4, inputMode: 'numeric', pattern: '[0-9]*' }}
              helperText={`4-digit number for staff login. Current ID: ${selectedStaff?.idNumber || 'Not set'}`}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showEditStaffId ? 'Hide ID' : 'Show ID'}
                      onClick={() => setShowEditStaffId((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                    >
                      {showEditStaffId ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={modalActionsSx}>
          <Button
            variant="outlined"
            onClick={() => {
              setIdNumberDialogOpen(false);
              setNewIdNumber('');
              setSelectedStaff(null);
            }}
            sx={secondaryButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSetIdNumber}
            disabled={!newIdNumber || newIdNumber.length !== 4}
            sx={primaryButtonSx}
          >
            Set ID Number
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingStaff)}
        onClose={() => setDeletingStaff(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={dialogPaperProps}
      >
        <DialogTitle sx={modalTitleSx}>
          <Typography variant="h6" fontWeight={600}>
            Delete Staff Member
          </Typography>
        </DialogTitle>
        <DialogContent sx={modalContentSx}>
          <Typography variant="body1">
            Are you sure you want to delete &quot;{deletingStaff?.name}&quot;? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            All appointments and financial data associated with this staff member will be preserved, but they will no longer be able to access the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={modalActionsSx}>
          <Button
            variant="outlined"
            onClick={() => setDeletingStaff(null)}
            sx={secondaryButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteStaff}
            sx={primaryButtonSx}
          >
            Delete Staff
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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