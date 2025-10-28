'use client';

import * as React from 'react';
import DashboardLayout from '../../../components/dashboard/Layout';
import RoleGuard from '../../../components/RoleGuard';
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
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StaffPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createStaffOpen, setCreateStaffOpen] = React.useState(false);
  const [newStaff, setNewStaff] = React.useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff'
  });
  const [roleMenuAnchor, setRoleMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [selectedUserForRole, setSelectedUserForRole] = React.useState<User | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: User[] }>('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    try {
      const staffData = {
        name: newStaff.name.trim(),
        email: newStaff.email.trim(),
        password: newStaff.password,
        role: newStaff.role
      };

      await apiPost('/auth/register', staffData);
      
      // Reset form and close modal
      setCreateStaffOpen(false);
      setNewStaff({
        name: '',
        email: '',
        password: '',
        role: 'Staff'
      });
      
      // Refresh users list
      fetchUsers();
      
      showNotification(`Successfully created staff member: ${staffData.name}!`, 'success');
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const errorMessage = error?.response?.data?.message || error?.message || error?.error || 'Failed to create staff member. Please try again.';
      showNotification(errorMessage, 'error');
    }
  };

  const handleRoleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setRoleMenuAnchor(event.currentTarget);
    setSelectedUserForRole(user);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
    setSelectedUserForRole(null);
  };

  const handleRoleUpdate = async (newRole: string) => {
    if (!selectedUserForRole) return;

    setIsUpdatingRole(true);
    try {
      const response = await apiPut<{ success: boolean; data: User; message: string }>(
        `/auth/users/${selectedUserForRole.id}/role`,
        { role: newRole }
      );

      if (response.success) {
        await fetchUsers(); // Refresh the list
        showNotification(`Successfully updated ${selectedUserForRole.name}'s role to ${newRole}!`, 'success');
        handleRoleMenuClose(); // Close the menu
      } else {
        showNotification('Failed to update role. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to update role. Please try again.', 'error');
      }
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await apiPut<{ success: boolean; data: User; message: string }>(
        `/auth/users/${user.id}/status`,
        {}
      );

      if (response.success) {
        await fetchUsers(); // Refresh the list
        showNotification(response.message, 'success');
        handleRoleMenuClose(); // Close the menu
      } else {
        showNotification('Failed to update user status. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to update user status. Please try again.', 'error');
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}'s account? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiDelete<{ success: boolean; message: string }>(
        `/auth/users/${user.id}`
      );

      if (response.success) {
        await fetchUsers(); // Refresh the list
        showNotification(response.message, 'success');
        handleRoleMenuClose(); // Close the menu
      } else {
        showNotification('Failed to delete user. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to delete user. Please try again.', 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Boss':
        return 'error';
      case 'Staff':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'warning';
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Pending Activation';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Boss':
        return <AdminPanelSettingsIcon fontSize="small" />;
      case 'Staff':
        return <PersonIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getStats = () => {
    return {
      total: users.length,
      boss: users.filter(user => user.role === 'Boss').length,
      staff: users.filter(user => user.role === 'Staff').length
    };
  };

  const stats = getStats();

  return (
    <DashboardLayout>
      <RoleGuard allowedRoles={['Boss', 'Staff']}>
        <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          justifyContent: 'space-between', 
          gap: 2, 
          pb: 2, 
          borderBottom: '1px solid #e5e7eb',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'Soria, Georgia, Cambria, "Times New Roman", Times, serif' }}>
            Staff Management
          </Typography>
          <GradientButton
            variant="blue"
            onClick={() => setCreateStaffOpen(true)}
            sx={{ 
              px: 3, 
              py: 1.2, 
              fontSize: 14,
              alignSelf: isMobile ? 'flex-start' : 'auto',
              minWidth: isMobile ? 'auto' : undefined
            }}
          >
            Add Staff
          </GradientButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Staff
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#2563eb">
                    {stats.total}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb' }}>
                  <GroupIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Boss
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#dc2626">
                    {stats.boss}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb' }}>
                  <AdminPanelSettingsIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Staff
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#059669">
                    {stats.staff}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb' }}>
                  <PersonIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Staff Table */}
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 3, backgroundColor: '#fff' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Staff Members
              </Typography>
              
              {loading ? (
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  Loading staff...
                </Typography>
              ) : users.length === 0 ? (
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  No staff members found.
                </Typography>
              ) : isMobile ? (
                // Mobile Card Layout
                <Stack spacing={2}>
                  {users.map((user) => (
                    <Card 
                      key={user.id} 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2,
                        '&:hover': { 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.2rem' }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                              {user.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                {user.email}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                              <Chip 
                                icon={getRoleIcon(user.role)}
                                label={user.role}
                                color={getRoleColor(user.role) as any}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                label={getStatusLabel(user.isActive)}
                                color={getStatusColor(user.isActive) as any}
                                size="small"
                                variant="filled"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Joined {formatDate(user.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleRoleMenuOpen(e, user)}
                          disabled={isUpdatingRole}
                          sx={{ ml: 1 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              ) : (
                // Desktop Table Layout
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Joined Date</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {user.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {user.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {user.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              icon={getRoleIcon(user.role)}
                              label={user.role}
                              color={getRoleColor(user.role) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(user.isActive)}
                              color={getStatusColor(user.isActive) as any}
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(user.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleRoleMenuOpen(e, user)}
                              disabled={isUpdatingRole}
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
      </Grid>

      {/* Role Change Menu */}
      <Menu
        anchorEl={roleMenuAnchor}
        open={Boolean(roleMenuAnchor)}
        onClose={handleRoleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => handleRoleUpdate('Boss')}
          disabled={isUpdatingRole || selectedUserForRole?.role === 'Boss'}
        >
          <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Make Boss
        </MenuItem>
        <MenuItem 
          onClick={() => handleRoleUpdate('Staff')}
          disabled={isUpdatingRole || selectedUserForRole?.role === 'Staff'}
        >
          <PersonIcon fontSize="small" sx={{ mr: 1 }} />
          Make Staff
        </MenuItem>
        <MenuItem 
          onClick={() => selectedUserForRole && handleToggleStatus(selectedUserForRole)}
          disabled={isUpdatingRole}
        >
          {selectedUserForRole?.isActive ? (
            <>
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate Account
            </>
          ) : (
            <>
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Activate Account
            </>
          )}
        </MenuItem>
        <MenuItem 
          onClick={() => selectedUserForRole && handleDeleteUser(selectedUserForRole)}
          disabled={isUpdatingRole}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Account
        </MenuItem>
      </Menu>

      {/* Create Staff Modal */}
      <Dialog 
        open={createStaffOpen} 
        onClose={() => setCreateStaffOpen(false)} 
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
            Add New Staff Member
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Full Name"
              value={newStaff.name}
              onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              fullWidth
              required
              placeholder="Enter staff member's name"
            />

            <TextField
              label="Email"
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              fullWidth
              required
              placeholder="Enter email address"
            />

            <TextField
              label="Password"
              type="password"
              value={newStaff.password}
              onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
              fullWidth
              required
              placeholder="Enter password (min 6 characters)"
              helperText="Password must be at least 6 characters long"
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newStaff.role}
                onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                label="Role"
              >
                <MenuItem value="Staff">Staff</MenuItem>
                <MenuItem value="Boss">Boss</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          gap: 2,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <GradientButton
            variant="red"
            onClick={() => setCreateStaffOpen(false)}
            sx={{ px: 3, py: 1.2, fontSize: 14 }}
          >
            Cancel
          </GradientButton>
          <GradientButton
            variant="blue"
            onClick={handleCreateStaff}
            disabled={!newStaff.name.trim() || !newStaff.email.trim() || !newStaff.password.trim()}
            sx={{ px: 3, py: 1.2, fontSize: 14 }}
          >
            Add Staff
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      </RoleGuard>
    </DashboardLayout>
  );
}
