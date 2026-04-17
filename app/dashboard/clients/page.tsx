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
  Button,
  CircularProgress,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import PendingIcon from '@mui/icons-material/PendingActions';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import { apiGet, apiPost, apiDelete, apiPatch } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Client {
  id: number;
  clientId: string;
  fullName: string;
  phoneNumber: string | null;
  createdAt: string;
  appointmentCount?: number;
  pendingCount?: number;
  totalSpent?: number;
  loyaltyProgress?: number;
  loyaltyCycleCount?: number;
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
  const [loyaltyDialogOpen, setLoyaltyDialogOpen] = React.useState(false);
  const [clientToEditLoyalty, setClientToEditLoyalty] = React.useState<Client | null>(null);
  const [loyaltyDraft, setLoyaltyDraft] = React.useState(0);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [newClient, setNewClient] = React.useState({
    fullName: '',
    phoneNumber: ''
  });
  
  const PAGE_SIZE = 30;
  const [currentPage, setCurrentPage] = React.useState(1);
  const [listMeta, setListMeta] = React.useState<{
    total: number;
    totalPages: number;
  } | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchClients = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('statusFilter', statusFilter);
      const response = await apiGet<{
        success: boolean;
        data: Client[];
        meta?: { total: number; totalPages: number };
      }>(`/clients?${params.toString()}`);
      setClients(response.data || []);
      if (response.meta) {
        setListMeta({
          total: response.meta.total,
          totalPages: response.meta.totalPages,
        });
      } else {
        setListMeta(null);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
      setListMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, PAGE_SIZE]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  const openLoyaltyDialog = (client: Client) => {
    setClientToEditLoyalty(client);
    setLoyaltyDraft(client.loyaltyProgress ?? 0);
    setLoyaltyDialogOpen(true);
  };

  const handleLoyaltyUpdate = async () => {
    if (!clientToEditLoyalty) return;
    try {
      await apiPatch(`/clients/${clientToEditLoyalty.id}/loyalty-progress`, {
        loyaltyProgress: loyaltyDraft
      });
      setLoyaltyDialogOpen(false);
      setClientToEditLoyalty(null);
      fetchClients();
      setSnackbar({
        open: true,
        message: 'Loyalty progress updated successfully',
        severity: 'success'
      });
    } catch (error: any) {
      const errorMessage = error?.message || error?.error || 'Failed to update loyalty progress.';
      setSnackbar({
        open: true,
        message: errorMessage,
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

  const getAppointmentCount = (client: Client) =>
    client.appointmentCount ?? client.appointments?.length ?? 0;

  const getClientTotalSpent = (client: Client) =>
    client.totalSpent !== undefined
      ? client.totalSpent
      : getTotalSpent(client.appointments || []);

  const getLoyaltyProgress = (client: Client) => client.loyaltyProgress ?? 0;
  const renderLoyaltyCircle = (progress: number, size: number = 34) => {
    const safeProgress = Math.max(0, Math.min(progress, 6));
    const value = (safeProgress / 6) * 100;
    return (
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{ color: '#fee2e2', position: 'absolute', inset: 0 }}
        />
        <CircularProgress
          variant="determinate"
          value={value}
          size={size}
          thickness={4}
          sx={{ color: '#ef4444', position: 'absolute', inset: 0 }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: size <= 32 ? 10 : 11, fontWeight: 700, color: '#374151' }}>
            {safeProgress}/6
          </Typography>
        </Box>
      </Box>
    );
  };

  const getStatusChipSx = (status?: string) => {
    const statusStyleMap: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
      confirmed: { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' },
      completed: { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
      cancelled: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
    };
    const style = statusStyleMap[status || 'pending'] ?? statusStyleMap.pending;
    return {
      fontWeight: 700,
      textTransform: 'capitalize',
      borderRadius: 2,
      border: '1px solid',
      borderColor: style.border,
      bgcolor: style.bg,
      color: style.color,
    };
  };

  const totalPages = listMeta?.totalPages ?? 1;
  const totalListed = listMeta?.total ?? 0;
  const startIndex = totalListed === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + clients.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  return (
    <DashboardLayout>
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
              Clients
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage customer profiles, history, and lifecycle at a glance.
            </Typography>
          </Box>
          {(userRole === 'Boss' || userRole === 'Staff') && (
            <Box
              component="button"
              onClick={() => setCreateClientOpen(true)}
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
                textTransform: 'none',
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
                  '& .create-client-label': {
                    maxWidth: { xs: 160, sm: 120 },
                    opacity: 1,
                    marginLeft: 0.75,
                  },
                },
              }}
              aria-label="Add new client"
            >
              <AddIcon sx={{ fontSize: 20, flexShrink: 0 }} />
              <Box
                component="span"
                className="create-client-label"
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
                Add Client
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
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
              {/* Filters and Search */}
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  gap: 1.25,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#fafafa',
                }}
              >
                <TextField
                  placeholder="Search by name, phone, or client ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 300 },
                    flex: { sm: 1 },
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      borderRadius: 1.5,
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
                    minWidth: { xs: '100%', sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <Select
                    value={statusFilter}
                    displayEmpty
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
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.78rem', sm: '0.82rem' } }}>
                      {totalPages > 1 
                        ? `Page ${currentPage} of ${totalPages} (${totalListed.toLocaleString()} matched)`
                        : `${totalListed.toLocaleString()} clients`
                      }
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {loading ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                Loading clients...
              </Typography>
            ) : clients.length === 0 ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                {totalListed === 0 ? 'No clients found.' : 'No clients on this page.'}
              </Typography>
            ) : isMobile ? (
              // Mobile Card Layout
              <Stack spacing={2}>
                {clients.map((client, index) => {
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
                                  {getAppointmentCount(client)} appointments
                                </Typography>
                              </Box>
                              <Typography variant="caption" fontWeight={600} color="success.main">
                                RM{getClientTotalSpent(client)} spent
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {renderLoyaltyCircle(getLoyaltyProgress(client), 32)}
                              </Box>
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
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              sx={{
                                width: 30,
                                height: 30,
                                p: 0.5,
                                border: '1px solid',
                                borderColor: '#bfdbfe',
                                color: '#2563eb',
                                bgcolor: 'transparent',
                                '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.08)' },
                              }}
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          {(userRole === 'Boss') && (
                            <Tooltip title="Edit Loyalty Progress">
                              <IconButton
                                size="small"
                                onClick={() => openLoyaltyDialog(client)}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  p: 0.5,
                                  border: '1px solid',
                                  borderColor: '#fecaca',
                                  color: '#dc2626',
                                  bgcolor: 'transparent',
                                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(userRole === 'Boss' || userRole === 'Staff') && (
                            <Tooltip title="Delete Client">
                              <IconButton 
                                size="small"
                                onClick={() => handleDeleteClick(client)}
                                disabled={client.appointments.length > 0}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  p: 0.5,
                                  border: '1px solid',
                                  borderColor: client.appointments.length > 0 ? '#d4d4d8' : '#fca5a5',
                                  color: client.appointments.length > 0 ? '#a1a1aa' : '#dc2626',
                                  bgcolor: 'transparent',
                                  '&:hover': {
                                    bgcolor: client.appointments.length > 0 ? 'transparent' : 'rgba(239, 68, 68, 0.08)',
                                  },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
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
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2.5, borderColor: 'divider', boxShadow: 'none', overflowX: 'auto', overflowY: 'hidden' }}
              >
                <Table sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(148, 163, 184, 0.12)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Client ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Appointments</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total Spent</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Latest Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Loyalty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clients.map((client, index) => {
                      const latestAppointment = client.appointments[0];
                      return (
                        <TableRow
                          key={client.id}
                          hover
                          sx={{
                            '&:last-of-type td': { borderBottom: 0 },
                            '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.04)' },
                          }}
                        >
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
                              {getAppointmentCount(client)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              RM{getClientTotalSpent(client)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {latestAppointment ? (
                              <Chip 
                                label={latestAppointment.status}
                                color={getStatusColor(latestAppointment.status) as any}
                                size="small"
                                variant="filled"
                                sx={getStatusChipSx(latestAppointment.status)}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No appointments
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {renderLoyaltyCircle(getLoyaltyProgress(client), 34)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    p: 0.5,
                                    border: '1px solid',
                                    borderColor: '#bfdbfe',
                                    color: '#2563eb',
                                    bgcolor: 'transparent',
                                    '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.08)' },
                                  }}
                                >
                                  <VisibilityIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              {(userRole === 'Boss') && (
                                <Tooltip title="Edit Loyalty Progress">
                                  <IconButton
                                    size="small"
                                    onClick={() => openLoyaltyDialog(client)}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      p: 0.5,
                                      border: '1px solid',
                                      borderColor: '#fecaca',
                                      color: '#dc2626',
                                      bgcolor: 'transparent',
                                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {(userRole === 'Boss' || userRole === 'Staff') && (
                                <Tooltip title={client.appointments.length > 0 ? "Cannot delete client with appointments" : "Delete Client"}>
                                  <span>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteClick(client)}
                                      disabled={client.appointments.length > 0}
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        p: 0.5,
                                        border: '1px solid',
                                        borderColor: client.appointments.length > 0 ? '#d4d4d8' : '#fca5a5',
                                        color: client.appointments.length > 0 ? '#a1a1aa' : '#dc2626',
                                        bgcolor: 'transparent',
                                        '&:hover': {
                                          bgcolor: client.appointments.length > 0 ? 'transparent' : 'rgba(239, 68, 68, 0.08)',
                                        },
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 18 }} />
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
                  Showing {startIndex + 1}-{endIndex} of {totalListed.toLocaleString()} clients
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
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
            m: isMobile ? 1 : 3,
            width: isMobile ? 'calc(100% - 16px)' : 'auto'
          }
        }}
      >
        <DialogTitle sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248, 250, 252, 0.9)' }}>
          <Typography variant="h6" fontWeight={600}>
            Create New Client
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Client will be able to use QR code to login and book appointments
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, bgcolor: '#fcfcfd' }}>
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
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, sm: 2.25 }, gap: { xs: 1.25, sm: 1.5 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(248, 250, 252, 0.85)' }}>
          <Button
            variant="outlined"
            onClick={() => setCreateClientOpen(false)}
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
            onClick={handleCreateClient}
            disabled={!newClient.fullName.trim() || !newClient.phoneNumber.trim()}
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
            Create
          </Button>
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

      <Dialog open={loyaltyDialogOpen} onClose={() => setLoyaltyDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Update Loyalty Progress</Typography>
          <Typography variant="body2" color="text.secondary">
            Set completed haircuts for {clientToEditLoyalty?.fullName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Progress</InputLabel>
            <Select
              value={loyaltyDraft}
              label="Progress"
              onChange={(e) => setLoyaltyDraft(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}/6
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setLoyaltyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLoyaltyUpdate} sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
            Save
          </Button>
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
