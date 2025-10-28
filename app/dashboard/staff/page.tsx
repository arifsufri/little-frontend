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
import { apiGet, apiPost } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'Boss' | 'Staff';
  status: 'active' | 'inactive';
  joinDate: string;
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
  const [newStaff, setNewStaff] = React.useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff' as 'Boss' | 'Staff'
  });

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
        alert('Staff member added successfully!');
      } else {
        alert(response.message || 'Failed to add staff member. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating staff:', error);
      alert('Failed to add staff member. Please try again.');
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
            variant="blue"
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
                            </Box>
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
                            <IconButton size="small">
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
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            onClick={() => setCreateStaffOpen(false)}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 }
            }}
          >
            Cancel
          </Button>
          <GradientButton
            variant="blue"
            onClick={handleCreateStaff}
            disabled={!newStaff.name || !newStaff.email || !newStaff.phone}
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 },
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 }
            }}
          >
            Add Staff Member
          </GradientButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}