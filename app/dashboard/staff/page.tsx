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
import GroupIcon from '@mui/icons-material/GroupOutlined';
import PendingIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PercentIcon from '@mui/icons-material/Percent';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'Boss' | 'Staff';
  status: 'active' | 'inactive';
  joinDate: string;
  commissionRate: number;
  productCommissionRate?: number;
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
  const [productCommissionRate, setProductCommissionRate] = React.useState('');
  const [deletingStaff, setDeletingStaff] = React.useState<Staff | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuStaff, setMenuStaff] = React.useState<Staff | null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [newStaff, setNewStaff] = React.useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff' as 'Boss' | 'Staff'
  });

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
      const response = await apiPost('/staff', newStaff) as any;
      if (response.success) {
        setStaff([...staff, response.data]);
      setCreateStaffOpen(false);
      setNewStaff({
        name: '',
        email: '',
          phone: '',
        role: 'Staff'
      });
        showNotification('Staff member added successfully!', 'success');
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
      const updateData: any = {
        commissionRate: parseFloat(commissionRate)
      };
      
      if (productCommissionRate) {
        updateData.productCommissionRate = parseFloat(productCommissionRate);
      }
      
      const response = await apiPatch(`/financial/commission/${selectedStaff.id}`, updateData) as any;

      if (response.success) {
        // Update the staff list with new commission rates
        setStaff(staff.map(member => 
          member.id === selectedStaff.id 
            ? { 
                ...member, 
                commissionRate: parseFloat(commissionRate),
                productCommissionRate: productCommissionRate ? parseFloat(productCommissionRate) : member.productCommissionRate
              }
            : member
        ));
        setCommissionDialogOpen(false);
        setSelectedStaff(null);
        setCommissionRate('');
        setProductCommissionRate('');
        showNotification('Commission rates updated successfully!', 'success');
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
    setProductCommissionRate((staffMember.productCommissionRate || 5.0).toString());
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
      case 'toggle':
        handleToggleStatus(menuStaff);
        break;
      case 'delete':
        setDeletingStaff(menuStaff);
        break;
    }
    handleMenuClose();
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
              fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif',
              fontSize: { xs: '1.75rem', sm: '3rem' },
              color: '#000000',
              lineHeight: 1.2
            }}
          >
            Staff Management
          </Typography>
          <GradientButton
            variant="red"
            animated
            onClick={() => setCreateStaffOpen(true)}
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: { xs: 3, sm: 4 }
            }}
          >
            Add New Staff
          </GradientButton>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Stats Cards */}
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
                Staff Members
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
                  placeholder="Search by name, email, or phone..."
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
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      textAlign: { xs: 'center', sm: 'right' }
                    }}
                  >
                    Showing {filteredStaff.length} of {staff.length} staff members
                  </Typography>
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
                                {member.email} • {member.phone}
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip 
                                    label={`Service: ${member.commissionRate || 0}%`}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                    icon={<PercentIcon />}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                  <Chip 
                                    label={`Product: ${member.productCommissionRate || 5}%`}
                                    color="secondary"
                                    size="small"
                                    variant="outlined"
                                    icon={<PercentIcon />}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                  <IconButton 
                                    size="small" 
                                    onClick={() => openCommissionDialog(member)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
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
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Staff Member</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Contact</strong></TableCell>
                        <TableCell><strong>Commission</strong></TableCell>
                        <TableCell><strong>Join Date</strong></TableCell>
                        <TableCell><strong>Performance</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStaff.map((member) => (
                        <TableRow key={member.id} hover>
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
                                  ID: {member.id}
                              </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={member.role}
                              color={getRoleColor(member.role) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={member.status}
                              color={getStatusColor(member.status) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{member.email}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {member.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={`Service: ${member.commissionRate || 0}%`}
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                  icon={<PercentIcon />}
                                />
                                <IconButton 
                                  size="small" 
                                  onClick={() => openCommissionDialog(member)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              <Chip 
                                label={`Product: ${member.productCommissionRate || 5}%`}
                                color="secondary"
                                size="small"
                                variant="outlined"
                                icon={<PercentIcon />}
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
                            >
                              <MoreVertIcon />
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
        onClose={() => setCreateStaffOpen(false)} 
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
            Add New Staff Member
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={newStaff.name}
              onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              fullWidth
              required
            />

            <TextField
              label="Email Address"
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              fullWidth
              required
            />

            <TextField
              label="Phone Number"
              value={newStaff.phone}
              onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
              fullWidth
              required
              placeholder="012-3456789"
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
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          gap: { xs: 1.5, sm: 2 },
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setCreateStaffOpen(false)}
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
            onClick={handleCreateStaff}
            disabled={!newStaff.name || !newStaff.email || !newStaff.phone}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Add
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Commission Rate Dialog */}
      <Dialog 
        open={commissionDialogOpen} 
        onClose={() => setCommissionDialogOpen(false)} 
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
            Update Commission Rates
          </Typography>
          {selectedStaff && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {selectedStaff.name} ({selectedStaff.role})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
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
            
            <TextField
              label="Product Commission Rate (%)"
              type="number"
              value={productCommissionRate}
              onChange={(e) => setProductCommissionRate(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText="Commission rate for product sales (0-100%). Default: 5%"
            />
            
            <Box sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Commission Calculation Examples:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Service:</strong> If a service costs RM30 and commission rate is {commissionRate || 0}%:
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={500}>
                Staff earnings = RM30 × {commissionRate || 0}% = RM{((30 * (parseFloat(commissionRate) || 0)) / 100).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                <strong>Product:</strong> If a product costs RM18 and product commission rate is {productCommissionRate || 5}%:
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={500}>
                Staff earnings = RM18 × {productCommissionRate || 5}% = RM{((18 * (parseFloat(productCommissionRate) || 5)) / 100).toFixed(2)}
              </Typography>
            </Box>
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
            onClick={() => setCommissionDialogOpen(false)}
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
            onClick={handleUpdateCommission}
            disabled={!commissionRate || parseFloat(commissionRate) < 0 || parseFloat(commissionRate) > 100 || 
                     !productCommissionRate || parseFloat(productCommissionRate) < 0 || parseFloat(productCommissionRate) > 100}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Update Commission
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Actions Menu - Boss Only */}
      {userRole === 'Boss' && (
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 180 }
          }}
        >
          <MenuItem onClick={() => handleMenuAction('commission')}>
            <ListItemIcon>
              <PercentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Commission</ListItemText>
          </MenuItem>
          
          {menuStaff && (
            <MenuItem onClick={() => handleMenuAction('toggle')}>
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
          
          <MenuItem onClick={() => handleMenuAction('delete')} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Staff</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingStaff)}
        onClose={() => setDeletingStaff(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Delete Staff Member
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete &quot;{deletingStaff?.name}&quot;? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            All appointments and financial data associated with this staff member will be preserved, but they will no longer be able to access the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 2, p: 3, flexDirection: 'row' }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setDeletingStaff(null)}
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
            onClick={handleDeleteStaff}
            sx={{ 
              flex: 1,
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 }
            }}
          >
            Delete Staff
          </GradientButton>
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