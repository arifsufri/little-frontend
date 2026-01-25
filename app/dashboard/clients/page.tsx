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
  Tooltip,
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
  Pagination,
  Snackbar,
  Alert,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import PendingIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { apiGet, apiPost, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Client {
  id: number;
  clientId: string;
  fullName: string;
  phoneNumber: string | null;
  createdAt: string;
  appointments: Array<{
    id: number;
    status: string;
    createdAt: string;
    finalPrice?: number;
    package: {
      name: string;
      price: number;
    };
  }>;
}

export default function ClientsPage() {
  const { userRole } = useUserRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [createClientOpen, setCreateClientOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [newClient, setNewClient] = React.useState({
    fullName: '',
    phoneNumber: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  React.useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Client[] }>('/clients');
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    try {
      // Validate phone number format (Malaysian)
      const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
      if (!phoneRegex.test(newClient.phoneNumber.replace(/\s+/g, ''))) {
        alert('Please enter a valid Malaysian phone number (e.g., 012-3456789)');
        return;
      }

      const clientData = {
        fullName: newClient.fullName.trim(),
        phoneNumber: newClient.phoneNumber.replace(/\s+/g, '') // Remove spaces
      };

      const response = await apiPost<{ success: boolean; data: any; message: string }>('/clients/register', clientData);
      
      // Reset form and close modal
      setCreateClientOpen(false);
      setNewClient({
        fullName: '',
        phoneNumber: ''
      });
      
      // Refresh clients list
      fetchClients();
      
      setSnackbar({
        open: true,
        message: `Client created successfully! Client ID: ${response.data.client.clientId}`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = error?.message || error?.error || 'Failed to create client. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      await apiDelete(`/clients/${clientToDelete.id}`);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
      setSnackbar({
        open: true,
        message: 'Client deleted successfully!',
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      const errorMessage = error?.message || error?.error || 'Failed to delete client.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getTotalSpent = (appointments: Client['appointments']) => {
    return appointments
      .filter(apt => apt.status === 'completed')
      .reduce((total, apt) => {
        // Use finalPrice if available (includes discounts), otherwise use original package price
        const actualPrice = apt.finalPrice !== undefined ? apt.finalPrice : apt.package.price;
        return total + actualPrice;
      }, 0);
  };

  const getAppointmentCount = (appointments: Client['appointments']) => {
    return appointments.length;
  };

  // Filter and search logic
  const filteredClients = React.useMemo(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.fullName.toLowerCase().includes(searchLower) ||
        (client.phoneNumber && client.phoneNumber.toLowerCase().includes(searchLower)) ||
        client.clientId.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => {
        const hasAppointments = client.appointments.length > 0;
        const hasPendingAppointments = client.appointments.some(apt => apt.status === 'pending');
        const hasCompletedAppointments = client.appointments.some(apt => apt.status === 'completed');

        switch (statusFilter) {
          case 'active':
            return hasAppointments;
          case 'pending':
            return hasPendingAppointments;
          case 'completed':
            return hasCompletedAppointments && !hasPendingAppointments;
          case 'inactive':
            return !hasAppointments;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [clients, searchTerm, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <DashboardLayout>
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
            Clients
          </Typography>
          {(userRole === 'Boss' || userRole === 'Staff') && (
            <GradientButton
              variant="red"
              animated
              onClick={() => setCreateClientOpen(true)}
              sx={{ 
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 },
                width: { xs: '100%', sm: 'auto' },
                borderRadius: { xs: 3, sm: 4 }
              }}
            >
              Add New Client
            </GradientButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
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
              {/* Filters and Search */}
              <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  placeholder="Search by name, phone, or client ID..."
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
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
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
                    <MenuItem value="all">All Clients</MenuItem>
                    <MenuItem value="active">Active Clients</MenuItem>
                    <MenuItem value="pending">With Pending</MenuItem>
                    <MenuItem value="completed">Completed Only</MenuItem>
                    <MenuItem value="inactive">No Appointments</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {totalPages > 1 
                      ? `Page ${currentPage} of ${totalPages} (${filteredClients.length} of ${clients.length} clients)`
                      : `Showing ${filteredClients.length} of ${clients.length} clients`
                    }
                  </Typography>
                </Box>
              </Box>
              
              {loading ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                Loading clients...
              </Typography>
            ) : filteredClients.length === 0 ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                {clients.length === 0 ? 'No clients found.' : 'No clients match your search criteria.'}
              </Typography>
            ) : isMobile ? (
              // Mobile Card Layout
              <Stack spacing={2}>
                {paginatedClients.map((client, index) => {
                  const latestAppointment = client.appointments[0];
                  return (
                    <Card 
                      key={client.id} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        '&:hover': { 
                          outline: '2px solid #8B0000',
                          outlineOffset: '-2px'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.2rem' }}>
                            {client.fullName.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="h6" fontWeight={600}>
                                {client.fullName}
                              </Typography>
                              <Typography variant="caption" color="primary" fontWeight={600}>
                                #{client.clientId}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {client.phoneNumber || 'Guest (No phone)'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EventIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {getAppointmentCount(client.appointments)} appointments
                                </Typography>
                              </Box>
                              <Typography variant="caption" fontWeight={600} color="success.main">
                                RM{getTotalSpent(client.appointments)} spent
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              {latestAppointment ? (
                                <Chip 
                                  label={latestAppointment.status}
                                  color={getStatusColor(latestAppointment.status) as any}
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="No appointments"
                                  color="default"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                Joined {formatDate(client.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {(userRole === 'Boss' || userRole === 'Staff') && (
                            <Tooltip title="Delete Client">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteClick(client)}
                                disabled={client.appointments.length > 0}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              // Desktop Table Layout
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>#</strong></TableCell>
                      <TableCell><strong>Client ID</strong></TableCell>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell><strong>Joined</strong></TableCell>
                      <TableCell><strong>Appointments</strong></TableCell>
                      <TableCell><strong>Total Spent</strong></TableCell>
                      <TableCell><strong>Latest Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedClients.map((client, index) => {
                      const latestAppointment = client.appointments[0];
                      return (
                        <TableRow key={client.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {startIndex + index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {client.clientId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {client.fullName.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {client.fullName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color={client.phoneNumber ? 'text.primary' : 'text.secondary'}>
                              {client.phoneNumber || 'Guest (No phone)'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(client.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {getAppointmentCount(client.appointments)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              RM{getTotalSpent(client.appointments)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {latestAppointment ? (
                              <Chip 
                                label={latestAppointment.status}
                                color={getStatusColor(latestAppointment.status) as any}
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No appointments
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton size="small" color="primary">
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              {(userRole === 'Boss' || userRole === 'Staff') && (
                                <Tooltip title={client.appointments.length > 0 ? "Cannot delete client with appointments" : "Delete Client"}>
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleDeleteClick(client)}
                                      disabled={client.appointments.length > 0}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                mt: 3,
                gap: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} of {filteredClients.length} clients
                </Typography>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(event, page) => handlePageChange(page)}
                  color="primary"
                  size="medium"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Client Modal */}
      <Dialog 
        open={createClientOpen} 
        onClose={() => setCreateClientOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            m: isMobile ? 1 : 3,
            width: isMobile ? 'calc(100% - 16px)' : 'auto'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Create New Client
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Client will be able to use QR code to login and book appointments
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Full Name */}
            <TextField
              label="Full Name"
              value={newClient.fullName}
              onChange={(e) => setNewClient({...newClient, fullName: e.target.value})}
              fullWidth
              required
              placeholder="Enter client's full name"
              helperText="This will be displayed on appointments and bookings"
            />

            {/* Phone Number */}
            <TextField
              label="Phone Number"
              value={newClient.phoneNumber}
              onChange={(e) => setNewClient({...newClient, phoneNumber: e.target.value})}
              fullWidth
              required
              placeholder="012-3456789"
              helperText="Malaysian phone number format (will be used for login)"
              InputProps={{
                startAdornment: (
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    +60
                  </Typography>
                ),
              }}
            />

            {/* Info Box */}
            {/* <Box sx={{ 
              p: 2, 
              bgcolor: 'info.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'info.200'
            }}>
              <Typography variant="subtitle2" fontWeight={600} color="info.main" sx={{ mb: 1 }}>
                📱 How it works:
              </Typography>
              <Typography variant="body2" color="info.dark">
                1. Client will receive an auto-generated Client ID (e.g., LITTLEC1)<br/>
                2. They can scan the QR code to access the booking system<br/>
                3. Login using their phone number<br/>
                4. Book appointments and view their booking history
              </Typography>
            </Box> */}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          gap: 2,
          flexDirection: 'row'
        }}>
          <GradientButton
            variant="blue"
            animated
            onClick={() => setCreateClientOpen(false)}
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
            onClick={handleCreateClient}
            disabled={!newClient.fullName.trim() || !newClient.phoneNumber.trim()}
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

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600} color="error">
            Delete Client?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>{clientToDelete?.fullName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Client ID: {clientToDelete?.clientId}<br/>
            Phone: {clientToDelete?.phoneNumber || 'Guest (No phone)'}
          </Typography>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'error.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.200'
          }}>
            <Typography variant="body2" color="error.dark">
              ⚠️ This action cannot be undone. The client will be permanently removed from the system.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <GradientButton
            variant="blue"
            animated
            onClick={handleDeleteCancel}
            sx={{ flex: 1 }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="red"
            animated
            onClick={handleDeleteConfirm}
            sx={{ flex: 1 }}
          >
            Delete
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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
