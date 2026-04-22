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
  Alert,
  Pagination,
  Autocomplete,
  CircularProgress,
  Collapse,
  Divider,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import RestoreIcon from '@mui/icons-material/Restore';
import useSWR from 'swr';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../../../src/utils/axios';
import { buildAppointmentsQueryString } from '../../../src/lib/appointments-query';
import { useSocketSWRInvalidate } from '../../../src/hooks/useSocketSWRInvalidate';
import jsPDF from 'jspdf';

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  barber: string | null;
  imageUrl: string | null;
  loyaltyEligible?: boolean;
  hasVariablePricing?: boolean;
  priceOptions?: Array<{ label: string; price: number }>;
}
//tests
interface CustomPackage {
  name: string;
  price: number;
}

interface Appointment {
  id: number;
  clientId: number;
  packageId: number;
  status: string;
  paymentMethod?: 'CASH' | 'TRANSFER' | null;
  appointmentDate: string | null;
  notes: string | null;
  createdAt: string;
  additionalPackages?: number[];
  customPackages?: CustomPackage[];
  finalPrice?: number;
  hasDiscount?: boolean;
  productSales?: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  client: {
    clientId: string;
    fullName: string;
    phoneNumber: string | null;
    loyaltyProgress?: number;
    loyaltyCycleCount?: number;
  };
  package: {
    name: string;
    description: string;
    price: number;
    duration: number;
    barber: string | null;
    imageUrl: string | null;
    loyaltyEligible?: boolean;
    hasVariablePricing?: boolean;
    priceOptions?: Array<{ label: string; price: number }>;
  };
  barber?: {
    id: number;
    name: string;
    role: string;
    commissionRate: number;
  } | null;
}

function formatClientPickerLabel(option: {
  fullName?: string;
  clientId?: string;
  phoneNumber?: string | null;
}): string {
  const phone =
    option.phoneNumber != null && String(option.phoneNumber).trim() !== ''
      ? String(option.phoneNumber)
      : 'No phone';
  return `${option.fullName ?? ''} - ${option.clientId ?? ''} - ${phone}`;
}

function AppointmentLoyaltyIndicator({
  progress,
  size = 26,
}: {
  progress?: number;
  size?: number;
}) {
  const safe = Math.max(0, Math.min(progress ?? 0, 6));
  const value = (safe / 6) * 100;
  return (
    <Tooltip title={`Loyalty: ${safe}/6 stamps`} arrow>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          display: 'inline-flex',
          verticalAlign: 'middle',
        }}
      >
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
          <Typography sx={{ fontSize: size <= 26 ? 9 : 10, fontWeight: 700, color: '#374151', lineHeight: 1 }}>
            {safe}/6
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

export default function AppointmentsPage() {
  const { userRole } = useUserRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [staffFilter, setStaffFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [customDate, setCustomDate] = React.useState('');
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [selectedAdditionalPackages, setSelectedAdditionalPackages] = React.useState<number[]>([]);
  const [customPackages, setCustomPackages] = React.useState<CustomPackage[]>([]);
  const [finalPrice, setFinalPrice] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<'CASH' | 'TRANSFER' | ''>('');
  /** When completing a walk-in guest (no phone), staff can attach a Malaysian mobile so they become a member and earn loyalty. */
  const [guestCompletionPhone, setGuestCompletionPhone] = React.useState('');
  const [retailProducts, setRetailProducts] = React.useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = React.useState<{productId: number, quantity: number}[]>([]);
  const [selectedPriceOption, setSelectedPriceOption] = React.useState<number | null>(null);
  const [customPackageName, setCustomPackageName] = React.useState('');
  const [customPackagePrice, setCustomPackagePrice] = React.useState<number>(0);
  
  // Discount code state
  const [discountCode, setDiscountCode] = React.useState('');
  const [validatingDiscount, setValidatingDiscount] = React.useState(false);
  const [discountInfo, setDiscountInfo] = React.useState<{
    id: number;
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountPercent?: number;
    discountAmount?: number;
  } | null>(null);
  const [discountError, setDiscountError] = React.useState<string | null>(null);
  const [discountAppliedTo, setDiscountAppliedTo] = React.useState<{
    basePackage: boolean;
    additionalPackages: number[];
    customPackages: number[];
  }>({
    basePackage: false,
    additionalPackages: [],
    customPackages: []
  });

  // Multiple discount codes state
  const [multipleDiscountCodes, setMultipleDiscountCodes] = React.useState<Array<{
    code: string;
    discountType: 'percentage' | 'fixed_amount';
    discountPercent?: number;
    discountAmount?: number;
    appliedToPackages: number[];
  }>>([]);
  const [currentDiscountCode, setCurrentDiscountCode] = React.useState('');
  const [currentDiscountPackages, setCurrentDiscountPackages] = React.useState<number[]>([]);
  const [validatingCurrentDiscount, setValidatingCurrentDiscount] = React.useState(false);

  const [isCompleting, setIsCompleting] = React.useState(false);
  const [showAddServices, setShowAddServices] = React.useState(false);
  const [showAddProducts, setShowAddProducts] = React.useState(false);
  const [showAddCustom, setShowAddCustom] = React.useState(false);
  const [showAddDiscount, setShowAddDiscount] = React.useState(false);
  const [showFinalAdjust, setShowFinalAdjust] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [createAppointmentOpen, setCreateAppointmentOpen] = React.useState(false);
  const [changeBarberOpen, setChangeBarberOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [clients, setClients] = React.useState<any[]>([]);
  const [createClientSnapshot, setCreateClientSnapshot] = React.useState<any>(null);
  const [editClientSnapshot, setEditClientSnapshot] = React.useState<any>(null);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [discountCodes, setDiscountCodes] = React.useState<any[]>([]);
  const [selectedBarberId, setSelectedBarberId] = React.useState<string>('');
  const [editAppointmentOpen, setEditAppointmentOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any>(null);
  const [editAdditionalPackages, setEditAdditionalPackages] = React.useState<number[]>([]);
  const [editSelectedProducts, setEditSelectedProducts] = React.useState<{productId: number, quantity: number}[]>([]);
  const [auditLogOpen, setAuditLogOpen] = React.useState(false);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = React.useState(false);
  
  // Edit modal discount states
  const [editDiscountCode, setEditDiscountCode] = React.useState('');
  const [editDiscountInfo, setEditDiscountInfo] = React.useState<{
    id: number;
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed_amount';
    discountPercent?: number;
    discountAmount?: number;
  } | null>(null);
  const [editDiscountError, setEditDiscountError] = React.useState<string | null>(null);
  const [editValidatingDiscount, setEditValidatingDiscount] = React.useState(false);
  const [editDiscountAppliedTo, setEditDiscountAppliedTo] = React.useState<{
    basePackage: boolean;
    additionalPackages: number[];
    customPackages: number[];
  }>({
    basePackage: false,
    additionalPackages: [],
    customPackages: []
  });

  // Edit modal multiple discount codes state
  const [editMultipleDiscountCodes, setEditMultipleDiscountCodes] = React.useState<Array<{
    code: string;
    discountType: 'percentage' | 'fixed_amount';
    discountPercent?: number;
    discountAmount?: number;
    appliedToPackages: number[];
  }>>([]);
  const [editCurrentDiscountCode, setEditCurrentDiscountCode] = React.useState('');
  const [editCurrentDiscountPackages, setEditCurrentDiscountPackages] = React.useState<number[]>([]);
  const [editValidatingCurrentDiscount, setEditValidatingCurrentDiscount] = React.useState(false);
  
  // Pagination — server-side (see PAGE_SIZE + listMeta)
  const [currentPage, setCurrentPage] = React.useState(1);
  const PAGE_SIZE = 50;
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);
  const [newAppointment, setNewAppointment] = React.useState({
    clientId: '',
    packageId: '',
    barberId: ''
  });
  const [createClientNameDraft, setCreateClientNameDraft] = React.useState('');
  const [updatingCreateClientName, setUpdatingCreateClientName] = React.useState(false);
  const [newClientPhoneNumber, setNewClientPhoneNumber] = React.useState<string>('');
  const [editClientPhoneNumber, setEditClientPhoneNumber] = React.useState<string>('');
  const [newAdditionalPackages, setNewAdditionalPackages] = React.useState<number[]>([]);

  const appointmentsQueryString = React.useMemo(
    () =>
      buildAppointmentsQueryString({
        currentPage,
        pageSize: PAGE_SIZE,
        statusFilter,
        staffFilter,
        dateFilter,
        debouncedSearch,
        customDate,
      }),
    [currentPage, PAGE_SIZE, statusFilter, staffFilter, dateFilter, debouncedSearch, customDate]
  );

  const { data: appointmentsSwr, mutate: mutateAppointments, isLoading: appointmentsLoading } = useSWR(
    ['swr:appointments', appointmentsQueryString],
    async ([, qs]) =>
      apiGet<{
        success: boolean;
        data: Appointment[];
        meta?: {
          total: number;
          totalPages: number;
          statusCounts: Record<string, number>;
          completedFinalPriceSum: number;
          todayTotal: number;
        };
      }>(`/appointments?${qs}`),
    { revalidateOnFocus: true }
  );

  const appointments = appointmentsSwr?.data ?? [];
  const listMeta = appointmentsSwr?.meta
    ? {
        total: appointmentsSwr.meta.total,
        totalPages: appointmentsSwr.meta.totalPages,
        statusCounts: appointmentsSwr.meta.statusCounts || {},
        completedFinalPriceSum: appointmentsSwr.meta.completedFinalPriceSum ?? 0,
        todayTotal: appointmentsSwr.meta.todayTotal ?? 0,
      }
    : null;

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  useSocketSWRInvalidate({
    onAppointmentCreated: () => showNotification('New appointment created!', 'success'),
  });

  // Helper function to get all services for an appointment
  const getAppointmentServices = (appointment: any) => {
    const services = [appointment.package.name];
    
    // Add additional packages
    if (appointment.additionalPackages && Array.isArray(appointment.additionalPackages)) {
      appointment.additionalPackages.forEach((packageId: number) => {
        const additionalPackage = packages.find(pkg => pkg.id === packageId);
        if (additionalPackage) {
          services.push(additionalPackage.name);
        }
      });
    }
    
    // Add custom packages
    if (appointment.customPackages && Array.isArray(appointment.customPackages)) {
      appointment.customPackages.forEach((customPkg: any) => {
        if (customPkg && customPkg.name) {
          services.push(`${customPkg.name} (Custom)`);
        }
      });
    }
    
    // Add products
    if (appointment.productSales && Array.isArray(appointment.productSales)) {
      appointment.productSales.forEach((sale: any) => {
        if (sale.product) {
          const productName = sale.quantity > 1 
            ? `${sale.product.name} (x${sale.quantity})`
            : sale.product.name;
          services.push(`🛍️ ${productName}`);
        }
      });
    }
    
    return services;
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  React.useEffect(() => {
    fetchPackages();
    if (userRole === 'Boss' || userRole === 'Staff') {
      fetchStaff();
      fetchDiscountCodes();
    }
  }, [userRole]);

  // Load clients for create/edit pickers: server-side search so all clients are findable (not only first N by name).
  React.useEffect(() => {
    if (!createAppointmentOpen && !editAppointmentOpen) return;

    const searchQuery = createAppointmentOpen
      ? newClientPhoneNumber.trim()
      : editClientPhoneNumber.trim();

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ minimal: 'true', limit: '500' });
        if (searchQuery) params.set('search', searchQuery);
        const response = await apiGet<{ success: boolean; data: any[] }>(
          `/clients?${params.toString()}`,
          { signal: controller.signal }
        );
        setClients(response.data || []);
      } catch (e: any) {
        if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return;
        console.error('Error fetching clients:', e);
        setClients([]);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    createAppointmentOpen,
    editAppointmentOpen,
    newClientPhoneNumber,
    editClientPhoneNumber,
  ]);

  const createAppointmentClientValue = React.useMemo(() => {
    const cid = newAppointment.clientId;
    if (cid === '' || cid === null || cid === undefined) return null;
    const idStr = String(cid);
    if (createClientSnapshot && String(createClientSnapshot.id) === idStr) {
      return createClientSnapshot;
    }
    return clients.find((c) => String(c.id) === idStr) ?? null;
  }, [newAppointment.clientId, clients, createClientSnapshot]);

  const createModalPhoneDigits = newClientPhoneNumber.replace(/\D/g, '');
  const isPendingNewClient = React.useMemo(() => {
    if (newAppointment.clientId) return false;
    if (!/^01[0-9]{8,9}$/.test(createModalPhoneDigits)) return false;
    return !clients.some(
      (c) => (c.phoneNumber ? String(c.phoneNumber).replace(/\D/g, '') : '') === createModalPhoneDigits
    );
  }, [newAppointment.clientId, createModalPhoneDigits, clients]);

  const canSubmitCreateAppointment = React.useMemo(() => {
    if (!newAppointment.packageId) return false;
    if (newAppointment.clientId) return true;
    if (!/^01[0-9]{8,9}$/.test(createModalPhoneDigits)) return false;
    const onFile = clients.some(
      (c) => (c.phoneNumber ? String(c.phoneNumber).replace(/\D/g, '') : '') === createModalPhoneDigits
    );
    if (onFile) return false;
    return createClientNameDraft.trim().length > 0;
  }, [
    newAppointment.packageId,
    newAppointment.clientId,
    createModalPhoneDigits,
    clients,
    createClientNameDraft,
  ]);

  const editAppointmentClientValue = React.useMemo(() => {
    if (!editingAppointment) return null;
    const cid = editingAppointment.clientId;
    if (cid === '' || cid === null || cid === undefined) return null;
    const idStr = String(cid);
    if (editClientSnapshot && String(editClientSnapshot.id) === idStr) {
      return editClientSnapshot;
    }
    const fromList = clients.find((c) => String(c.id) === idStr);
    if (fromList) return fromList;
    const c = editingAppointment.client;
    if (c) {
      return {
        id: Number(editingAppointment.clientId),
        clientId: c.clientId,
        fullName: c.fullName,
        phoneNumber: c.phoneNumber ?? null,
      };
    }
    return null;
  }, [editingAppointment, clients, editClientSnapshot]);

  const fetchPackages = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Package[] }>('/packages');
      setPackages(response.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    }
  };

  const fetchRetailProducts = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/products?activeOnly=true');
      setRetailProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching retail products:', error);
      setRetailProducts([]);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/staff');
      // Filter out Boss role from staff list
      const staffOnly = (response.data || []).filter((member: any) => member.role !== 'Boss');
      setStaff(staffOnly);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    }
  };

  const fetchDiscountCodes = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/discount-codes');
      setDiscountCodes(response.data || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      setDiscountCodes([]);
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
      void mutateAppointments();
      
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
      void mutateAppointments();
      
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
      let clientId = newAppointment.clientId;
      
      // If no client selected but a full Malaysian mobile is typed, register new client first (when not already on file)
      if (!clientId && newClientPhoneNumber) {
        const phoneNumber = newClientPhoneNumber.replace(/\D/g, '').trim();

        if (!/^01[0-9]{8,9}$/.test(phoneNumber)) {
          showNotification('Please enter a valid Malaysian phone number (01XXXXXXXX)', 'error');
          return;
        }

        const onFile = clients.some(
          (c) => (c.phoneNumber ? String(c.phoneNumber).replace(/\D/g, '') : '') === phoneNumber
        );
        if (onFile) {
          showNotification('This number is already on file — choose the client from the list.', 'error');
          return;
        }

        const newName = createClientNameDraft.trim();
        if (!newName) {
          showNotification('Enter the client name for this new number.', 'error');
          return;
        }
        if (/[0-9]/.test(newName)) {
          showNotification('Client name cannot contain numbers', 'error');
          return;
        }

        try {
          const response = await apiPost<{ success: boolean; data: { client: any } }>('/clients/register', {
            phoneNumber,
            fullName: newName,
          });

          if (response.success) {
            clientId = response.data.client.id;
            showNotification('New client registered!', 'success');
          }
        } catch (error: any) {
          if (error?.clientExists || error?.response?.data?.clientExists) {
            showNotification('Client already exists. Please select from the list.', 'error');
            return;
          }
          showNotification(error?.message || 'Failed to register client', 'error');
          return;
        }
      }
      
      if (!clientId) {
        showNotification('Please select or enter a client', 'error');
        return;
      }
      
      // Get current Malaysia time (Asia/Kuala_Lumpur timezone)
      const malaysiaTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"});
      const appointmentDate = new Date(malaysiaTime).toISOString();
      
      // Determine barber assignment based on user role
      let barberId = null;
      if (userRole === 'Staff') {
        // Staff automatically assigns themselves
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            barberId = payload.userId;
          } catch (error) {
            console.error('Error parsing token:', error);
          }
        }
      } else if (userRole === 'Boss' && newAppointment.barberId) {
        // Boss can select a barber
        barberId = parseInt(newAppointment.barberId);
      }
      
      const appointmentData = {
        clientId: parseInt(clientId),
        packageId: parseInt(newAppointment.packageId),
        appointmentDate: appointmentDate,
        additionalPackages: newAdditionalPackages,
        ...(barberId && { barberId })
      };

      await apiPost('/appointments', appointmentData);
      
      // Reset form and close modal
      setCreateAppointmentOpen(false);
      setNewAppointment({
        clientId: '',
        packageId: '',
        barberId: ''
      });
      setNewClientPhoneNumber('');
      setNewAdditionalPackages([]);
      setCreateClientSnapshot(null);
      setCreateClientNameDraft('');

      // Refresh appointments
      void mutateAppointments();

      showNotification('Appointment created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = error?.message || error?.error || 'Failed to create appointment. Please try again.';
      showNotification(errorMessage, 'error');
    }
  };

  const handleUpdateCreateClientName = async () => {
    if (!newAppointment.clientId) {
      showNotification('Select a client first', 'error');
      return;
    }

    const trimmed = createClientNameDraft.trim();
    if (!trimmed) {
      showNotification('Client name cannot be empty', 'error');
      return;
    }
    if (/[0-9]/.test(trimmed)) {
      showNotification('Client name cannot contain numbers', 'error');
      return;
    }

    setUpdatingCreateClientName(true);
    try {
      const result = await apiPatch<{ success: boolean; data: { id: number; fullName: string } }>(
        `/clients/${newAppointment.clientId}/name`,
        { fullName: trimmed }
      );
      if (result.success) {
        setClients((prev) =>
          prev.map((client) =>
            String(client.id) === String(newAppointment.clientId)
              ? { ...client, fullName: result.data.fullName }
              : client
          )
        );
        setCreateClientSnapshot((prev: any) =>
          prev && String(prev.id) === String(newAppointment.clientId)
            ? { ...prev, fullName: result.data.fullName }
            : prev
        );
        showNotification('Client name updated', 'success');
      }
    } catch (error: any) {
      showNotification(error?.message || 'Failed to update client name', 'error');
    } finally {
      setUpdatingCreateClientName(false);
    }
  };

  const handleEditAppointment = (appointment: any) => {
    if (appointment?.status === 'cancelled') {
      showNotification('Restore this appointment to pending first (use Restore to pending), then you can edit.', 'warning');
      return;
    }
    console.log('Editing appointment:', appointment); // Debug log
    setEditClientSnapshot(null);

    // Find the discount code from the discountCodeId if it exists
    const currentDiscountCode = appointment.discountCodeId ? 
      discountCodes.find(dc => dc.id === appointment.discountCodeId)?.code || '' : '';
    
    // Set additional packages from the appointment
    const additionalPkgs = appointment.additionalPackages || [];
    setEditAdditionalPackages(additionalPkgs);
    
    // Load existing products from the appointment
    const existingProducts = appointment.productSales && Array.isArray(appointment.productSales) 
      ? appointment.productSales.map((ps: any) => ({
          productId: ps.product?.id || ps.productId,
          quantity: ps.quantity || 1
        }))
      : [];
    setEditSelectedProducts(existingProducts);
    
    // Fetch retail products
    fetchRetailProducts();
    
    // Handle multiple discount codes if they exist
    if (appointment.appliedDiscounts && Array.isArray(appointment.appliedDiscounts) && appointment.appliedDiscounts.length > 0) {
      // Pre-populate multiple discount codes
      const existingDiscounts = appointment.appliedDiscounts.map((appliedDiscount: any) => ({
        code: appliedDiscount.discountCode.code,
        discountType: appliedDiscount.discountCode.discountType || 'percentage',
        discountPercent: appliedDiscount.discountCode.discountPercent,
        discountAmount: appliedDiscount.discountCode.discountAmount,
        appliedToPackages: Array.isArray(appliedDiscount.appliedToPackages) ? appliedDiscount.appliedToPackages : []
      }));
      setEditMultipleDiscountCodes(existingDiscounts);
      
      // Reset legacy single discount states
      setEditDiscountCode('');
      setEditDiscountInfo(null);
      setEditDiscountError(null);
      setEditDiscountAppliedTo({
        basePackage: false,
        additionalPackages: [],
        customPackages: []
      });
    } else if (appointment.discountCodeId && currentDiscountCode) {
      // Handle legacy single discount code
      const discountData = discountCodes.find(dc => dc.id === appointment.discountCodeId);
      if (discountData) {
        setEditDiscountCode(currentDiscountCode);
        setEditDiscountInfo({
          id: discountData.id,
          code: discountData.code,
          description: discountData.description,
          discountType: discountData.discountType,
          discountPercent: discountData.discountPercent,
          discountAmount: discountData.discountAmount
        });
        // Set which packages have discount applied (for now, assume all packages)
        setEditDiscountAppliedTo({
          basePackage: true,
          additionalPackages: additionalPkgs,
          customPackages: []
        });
      }
      // Reset multiple discount codes state
      setEditMultipleDiscountCodes([]);
    } else {
      // Reset all discount states
      setEditDiscountCode('');
      setEditDiscountInfo(null);
      setEditDiscountError(null);
      setEditDiscountAppliedTo({
        basePackage: false,
        additionalPackages: [],
        customPackages: []
      });
      setEditMultipleDiscountCodes([]);
    }
    
    setEditingAppointment({
      ...appointment,
      clientId: appointment.clientId || '',  // Use the direct clientId from appointment
      packageId: appointment.packageId || '', // Use the direct packageId from appointment
      appointmentDate: appointment.appointmentDate ? 
        new Date(appointment.appointmentDate).toISOString().slice(0, 16) : '',
      notes: appointment.notes || '',
      discountCode: currentDiscountCode
    });
    setEditAppointmentOpen(true);
    handleMenuClose();
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    try {
      let clientId = editingAppointment.clientId;
      
      // If no client selected but phone number typed, register new client first
      if (!clientId && editClientPhoneNumber) {
        const phoneNumber = editClientPhoneNumber.trim();
        
        // Validate Malaysian phone format
        if (!/^01[0-9]{8,9}$/.test(phoneNumber)) {
          showNotification('Please enter a valid Malaysian phone number (01XXXXXXXX)', 'error');
          return;
        }
        
        try {
          const response = await apiPost<{ success: boolean; data: { client: any } }>('/clients/register', {
            phoneNumber
          });
          
          if (response.success) {
            clientId = response.data.client.id;
            showNotification('New client registered!', 'success');
          }
        } catch (error: any) {
          if (error?.response?.data?.clientExists) {
            showNotification('Client already exists. Please select from the list.', 'error');
            return;
          } else {
            showNotification('Failed to register client', 'error');
            return;
          }
        }
      }
      
      if (!clientId) {
        showNotification('Please select or enter a client', 'error');
        return;
      }
      
      // Calculate total price including products
      const basePriceWithProducts = calculateEditBasePrice(); // Includes products
      const discountAmount = calculateEditDiscountAmount();
      const finalPriceWithProducts = Math.max(0, basePriceWithProducts - discountAmount);
      
      // Ensure appointmentDate is properly formatted
      let appointmentDateToSend = null;
      if (editingAppointment.appointmentDate) {
        const dateObj = new Date(editingAppointment.appointmentDate);
        appointmentDateToSend = dateObj.toISOString();
      }
      
      const updateData = {
        clientId: typeof clientId === 'string' ? parseInt(clientId) : clientId,
        packageId: typeof editingAppointment.packageId === 'string' ? parseInt(editingAppointment.packageId) : editingAppointment.packageId,
        appointmentDate: appointmentDateToSend,
        notes: editingAppointment.notes || null,
        additionalPackages: editAdditionalPackages,
        finalPrice: finalPriceWithProducts, // Include product prices in finalPrice
        paymentMethod: editingAppointment.paymentMethod ?? null,
        ...(editDiscountCode && {
          discountCode: editDiscountCode,
          discountAppliedTo: {
            basePackage: editDiscountAppliedTo.basePackage,
            additionalPackages: editDiscountAppliedTo.additionalPackages,
            customPackages: editDiscountAppliedTo.customPackages
          }
        }),
        // New multiple discount codes support for edit modal
        ...(editMultipleDiscountCodes.length > 0 && {
          multipleDiscountCodes: editMultipleDiscountCodes.map(discount => ({
            code: discount.code,
            appliedToPackages: discount.appliedToPackages
          }))
        })
      };

      console.log('Updating appointment with data:', updateData);

      // Use PATCH method for editing
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/appointments/${editingAppointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to update appointment');
      }
      
      const result = await response.json();
      console.log('Update successful:', result);
      
      // Handle product sales - only add NEW products that weren't there before
      if (editingAppointment && editingAppointment.productSales) {
        // Get existing product IDs
        const existingProductIds = new Set(
          editingAppointment.productSales.map((ps: any) => ps.product?.id || ps.productId)
        );
        
        // Find NEW products to add (not in existing list)
        const newProducts = editSelectedProducts.filter(
          sp => !existingProductIds.has(sp.productId)
        );
        
        if (newProducts.length > 0) {
          // Get barber ID from the updated appointment response
          let barberId = result.data?.barber?.id || 
                        result.data?.barberId || 
                        (editingAppointment as any).barberId ||
                        editingAppointment.barber?.id ||
                        null;
          
          if (!barberId) {
            try {
              const appointmentResponse = await apiGet(`/appointments/${editingAppointment.id}`) as any;
              if (appointmentResponse.success && appointmentResponse.data) {
                barberId = appointmentResponse.data.barber?.id || 
                           appointmentResponse.data.barberId || 
                           null;
              }
            } catch (error) {
              console.error('Error fetching appointment for barber ID:', error);
            }
          }
          
          if (!barberId) {
            console.warn('No barber ID found for appointment, commission will go to logged-in user');
          }
          
          // Add each NEW product sale
          for (const sp of newProducts) {
            try {
              const sellData: any = {
                productId: sp.productId,
                clientId: typeof editingAppointment.clientId === 'string' ? parseInt(editingAppointment.clientId) : editingAppointment.clientId,
                quantity: sp.quantity,
                appointmentId: editingAppointment.id // Link product sale to appointment
              };
              
              // Always include staffId if we have it
              if (barberId) {
                sellData.staffId = barberId;
              }

              // Use the UPDATED appointment's date for the product sale
              // This ensures new products added get the correct date if appointment date was changed
              const appointmentDate = editingAppointment.appointmentDate || editingAppointment.createdAt;
              if (appointmentDate) {
                sellData.saleDate = new Date(appointmentDate).toISOString();
              }
              
              console.log('Creating NEW product sale with appointmentId and date:', sellData);
              await apiPost('/products/sell', sellData);
            } catch (error) {
              console.error('Error selling product:', error);
              showNotification('Error adding product sale. Please try again.', 'error');
            }
          }
        }
      }
      
      // Reset form and close modal
      setEditAppointmentOpen(false);
      setEditingAppointment(null);
      setEditAdditionalPackages([]);
      setEditSelectedProducts([]);
      setEditClientPhoneNumber('');
      setEditClientSnapshot(null);
      // Reset edit discount states
      setEditDiscountCode('');
      setEditDiscountInfo(null);
      setEditDiscountError(null);
      setEditDiscountAppliedTo({
        basePackage: false,
        additionalPackages: [],
        customPackages: []
      });
      // Reset edit multiple discount codes state
      setEditMultipleDiscountCodes([]);
      setEditCurrentDiscountCode('');
      setEditCurrentDiscountPackages([]);
      setEditValidatingCurrentDiscount(false);
      
      // Refresh appointments
      void mutateAppointments();
      
      showNotification('Appointment updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      const errorMessage = error?.message || 'Failed to update appointment. Please try again.';
      showNotification(errorMessage, 'error');
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

  const handleViewAuditLog = async (appointmentArg?: Appointment) => {
    const appointment = appointmentArg ?? selectedAppointment;
    if (!appointment) return;
    
    setLoadingAuditLogs(true);
    setAuditLogOpen(true);
    setAnchorEl(null);
    
    try {
      const response = await apiGet(`/appointments/${appointment.id}/audit-logs`) as any;
      if (response.success) {
        setAuditLogs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showNotification('Failed to load audit logs', 'error');
      setAuditLogs([]);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleGenerateInvoice = (appointmentArg?: Appointment) => {
    const appointment = appointmentArg ?? selectedAppointment;
    if (!appointment) return;
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = margin;
      
      // Colors
      const primaryColor: [number, number, number] = [139, 0, 0]; // Dark red
      const secondaryColor: [number, number, number] = [100, 100, 100]; // Gray
      const lightGray: [number, number, number] = [245, 245, 245];
      
      // Header - Company Name
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Little Barbershop', pageWidth / 2, 25, { align: 'center' });
      
      yPosition = 50;
      
      // Invoice Title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(20);
      pdf.text('INVOICE', margin, yPosition);
      
      yPosition += 15;
      
      // Invoice Details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      const invoiceDate = appointment.appointmentDate 
        ? new Date(appointment.appointmentDate).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date(appointment.createdAt).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
      
      pdf.text(`Invoice #: ${appointment.id}`, margin, yPosition);
      pdf.text(`Date: ${invoiceDate}`, pageWidth - margin - 50, yPosition, { align: 'right' });
      
      yPosition += 20;
      
      // Client Information
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Bill To:', margin, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(appointment.client.fullName, margin, yPosition);
      yPosition += 5;
      pdf.text(appointment.client.phoneNumber ?? 'Guest (no phone)', margin, yPosition);
      yPosition += 5;
      pdf.text(`Client ID: ${appointment.client.clientId}`, margin, yPosition);
      
      yPosition += 15;
      
      // Barber Information
      if (appointment.barber) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Served By:', margin, yPosition);
        yPosition += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.text(appointment.barber.name, margin, yPosition);
        yPosition += 15;
      }
      
      // Services Table Header
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Service', margin + 5, yPosition + 7);
      pdf.text('Price', pageWidth - margin - 30, yPosition + 7, { align: 'right' });
      
      yPosition += 15;
      
      // Base Package
      pdf.setFont('helvetica', 'normal');
      pdf.text(appointment.package.name, margin + 5, yPosition);
      pdf.text(`RM${appointment.package.price.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
      yPosition += 7;
      
      let subtotal = appointment.package.price;
      
      // Additional Packages
      if (appointment.additionalPackages && appointment.additionalPackages.length > 0) {
        for (const pkgId of appointment.additionalPackages) {
          const pkg = packages.find(p => p.id === pkgId);
          if (pkg) {
            pdf.text(`  + ${pkg.name}`, margin + 5, yPosition);
            pdf.text(`RM${pkg.price.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
            yPosition += 7;
            subtotal += pkg.price;
          }
        }
      }
      
      // Custom Packages
      if (appointment.customPackages && appointment.customPackages.length > 0) {
        for (const customPkg of appointment.customPackages) {
          pdf.text(`  + ${customPkg.name}`, margin + 5, yPosition);
          pdf.text(`RM${customPkg.price.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
          yPosition += 7;
          subtotal += customPkg.price;
        }
      }
      
      // Products
      if (appointment.productSales && appointment.productSales.length > 0) {
        yPosition += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Products:', margin + 5, yPosition);
        yPosition += 7;
        pdf.setFont('helvetica', 'normal');
        
        for (const productSale of appointment.productSales) {
          pdf.text(`  ${productSale.product.name} x${productSale.quantity}`, margin + 5, yPosition);
          pdf.text(`RM${productSale.totalPrice.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
          yPosition += 7;
          subtotal += productSale.totalPrice;
        }
      }
      
      yPosition += 5;
      
      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Subtotal
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', margin + 5, yPosition);
      pdf.text(`RM${subtotal.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
      yPosition += 7;
      
      // Discount (if any)
      const finalPrice = appointment.finalPrice || subtotal;
      const discount = subtotal - finalPrice;
      
      if (discount > 0) {
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('Discount:', margin + 5, yPosition);
        pdf.text(`-RM${discount.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
        yPosition += 10;
      } else {
        yPosition += 3;
      }
      
      // Total
      pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('TOTAL:', margin + 5, yPosition + 3);
      pdf.text(`RM${finalPrice.toFixed(2)}`, pageWidth - margin - 30, yPosition + 3, { align: 'right' });
      
      yPosition += 20;
      
      // Status
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const statusText = `Status: ${appointment.status.toUpperCase()}`;
      const statusColor = appointment.status === 'completed' 
        ? [76, 175, 80] 
        : appointment.status === 'cancelled' 
        ? [244, 67, 54] 
        : [255, 152, 0];
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(statusText, margin + 5, yPosition);
      
      yPosition += 20;
      
      // Footer
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFontSize(9);
      pdf.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text('Little Barbershop - Your Style, Our Pride', pageWidth / 2, yPosition, { align: 'center' });
      
      // Save PDF
      const fileName = `Invoice_${appointment.id}_${appointment.client.fullName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      showNotification('Invoice generated successfully!', 'success');
      handleMenuClose();
    } catch (error) {
      console.error('Error generating invoice:', error);
      showNotification('Failed to generate invoice', 'error');
    }
  };

  const handleStatusUpdate = async (newStatus: string, appointmentArg?: Appointment) => {
    const appointmentToUpdate = appointmentArg ?? selectedAppointment;
    if (!appointmentToUpdate) return;
    if (appointmentArg) {
      setSelectedAppointment(appointmentArg);
    }

    if (newStatus === 'completed') {
      // Populate additional packages from the appointment
      if (appointmentToUpdate.additionalPackages && Array.isArray(appointmentToUpdate.additionalPackages)) {
        setSelectedAdditionalPackages(appointmentToUpdate.additionalPackages);
      } else {
        setSelectedAdditionalPackages([]);
      }
      
      // Populate custom packages from the appointment
      if (appointmentToUpdate.customPackages && Array.isArray(appointmentToUpdate.customPackages)) {
        setCustomPackages(appointmentToUpdate.customPackages);
      } else {
        setCustomPackages([]);
      }
      
      // Reset products and fetch retail products
      setSelectedProducts([]);
      fetchRetailProducts();

      // Important: start empty so accidental "Confirm" doesn't pre-fill
      // (user must explicitly choose Cash or Online Transfer).
      setPaymentMethod('');
      
      // Reset price option selection
      setSelectedPriceOption(null);

      // Auto-open sections that have pre-existing data
      setShowAddServices(!!(appointmentToUpdate.additionalPackages && appointmentToUpdate.additionalPackages.length > 0));
      setShowAddProducts(false);
      setShowAddCustom(!!(appointmentToUpdate.customPackages && appointmentToUpdate.customPackages.length > 0));
      setShowAddDiscount(false);
      setShowFinalAdjust(false);
      
      setGuestCompletionPhone('');
      // Open confirmation modal for completion
      setConfirmationOpen(true);
      // Don't call handleMenuClose() here to preserve selectedAppointment
      setAnchorEl(null); // Just close the menu
      return;
    }

    try {
      await apiPut(`/appointments/${appointmentToUpdate.id}`, { status: newStatus });
      // Refresh appointments
      void mutateAppointments();
      handleMenuClose();
      if (newStatus === 'pending' && appointmentToUpdate.status === 'cancelled') {
        showNotification('Restored to pending. You can edit or mark as completed.', 'success');
      }
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

    // Check if price option is selected for variable pricing packages
    if (selectedAppointment.package.hasVariablePricing && selectedPriceOption === null) {
      showNotification('Please select a price option for ' + selectedAppointment.package.name, 'error');
      return;
    }

    // Payment method is required when completing
    if (!paymentMethod) {
      showNotification('Please select payment method (Cash or Online Transfer).', 'error');
      return;
    }

    const guestPhoneDigits = guestCompletionPhone.replace(/\D/g, '');
    const guestHasNoPhone = !selectedAppointment?.client.phoneNumber;
    const isLinkingGuestPhone = guestHasNoPhone && guestPhoneDigits.length > 0;
    if (isLinkingGuestPhone && !/^01[0-9]{8,9}$/.test(guestPhoneDigits)) {
      showNotification(
        'Enter a valid Malaysian mobile (01XXXXXXXX) or leave the field empty to complete as guest without loyalty.',
        'error'
      );
      return;
    }

    const linkedGuestPhoneThisVisit =
      guestHasNoPhone && /^01[0-9]{8,9}$/.test(guestPhoneDigits);

    // Check if user is logged in
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    if (!token) {
      showNotification('You are not logged in. Please log in first.', 'error');
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
      // Calculate finalPrice WITHOUT products (products are tracked separately)
      const appointmentOnlyPrice = calculateAppointmentPriceOnly();
      let appointmentFinalPrice = appointmentOnlyPrice;
      
      // Apply discounts to appointment price only (not products)
      if (multipleDiscountCodes.length > 0) {
        // Calculate discount on appointment packages only
        let totalDiscount = 0;
        multipleDiscountCodes.forEach(discount => {
          let discountableAmount = 0;
          discount.appliedToPackages.forEach(packageId => {
            if (packageId === selectedAppointment.packageId) {
              discountableAmount += selectedAppointment.package?.price || 0;
            } else {
              const additionalPkg = packages.find(p => p.id === packageId);
              if (additionalPkg && selectedAdditionalPackages.includes(packageId)) {
                discountableAmount += additionalPkg.price;
              }
              const customPkgIndex = customPackages.findIndex((p, index) => index === packageId);
              if (customPkgIndex !== -1) {
                discountableAmount += customPackages[customPkgIndex].price;
              }
            }
          });
          let discountAmount = 0;
          if (discount.discountType === 'fixed_amount') {
            discountAmount = Math.min(discount.discountAmount || 0, discountableAmount);
          } else {
            discountAmount = (discountableAmount * (discount.discountPercent || 0)) / 100;
          }
          totalDiscount += discountAmount;
        });
        appointmentFinalPrice = Math.max(0, appointmentOnlyPrice - totalDiscount);
      } else if (discountInfo) {
        // Legacy single discount - calculate on appointment only
        let discountableAmount = 0;
        if (discountAppliedTo.basePackage) {
          const basePrice = selectedAppointment.package.hasVariablePricing && selectedPriceOption !== null
            ? selectedPriceOption
            : selectedAppointment.package.price;
          discountableAmount += basePrice;
        }
        discountAppliedTo.additionalPackages.forEach(packageId => {
          const pkg = packages.find(p => p.id === packageId);
          if (pkg) discountableAmount += pkg.price;
        });
        discountAppliedTo.customPackages.forEach(index => {
          if (customPackages[index]) {
            discountableAmount += customPackages[index].price;
          }
        });
        let discountAmount = 0;
        if (discountInfo.discountType === 'fixed_amount') {
          discountAmount = Math.min(discountInfo.discountAmount || 0, discountableAmount);
        } else {
          discountAmount = (discountableAmount * (discountInfo.discountPercent || 0)) / 100;
        }
        appointmentFinalPrice = Math.max(0, appointmentOnlyPrice - discountAmount);
      }

      // "Final Price" field is the grand total (services + products). Persist service-only amount.
      const productSubtotal = selectedProducts.reduce((sum, sp) => {
        const product = retailProducts.find(p => p.id === sp.productId);
        return sum + (product ? product.price * sp.quantity : 0);
      }, 0);
      const manualGrandTotal = Number.isFinite(finalPrice) ? finalPrice : appointmentFinalPrice + productSubtotal;
      const appointmentFinalPriceForApi = Math.max(0, manualGrandTotal - productSubtotal);
      
      const updateData: Record<string, unknown> = {
        status: 'completed',
        additionalPackages: selectedAdditionalPackages,
        customPackages: customPackages,
        finalPrice: appointmentFinalPriceForApi,
        paymentMethod,
        // Legacy single discount support
        discountCodeId: discountInfo?.id || null,
        discountAmount: discountInfo ? (appointmentOnlyPrice - appointmentFinalPriceForApi) : null,
        multipleDiscountCodes: multipleDiscountCodes.length > 0 ? multipleDiscountCodes.map(discount => ({
          code: discount.code,
          appliedToPackages: discount.appliedToPackages
        })) : null
      };

      if (!selectedAppointment.client.phoneNumber && guestPhoneDigits) {
        updateData.guestPhoneNumber = guestPhoneDigits;
      }

      console.log('Sending update data:', updateData);

      const memberLinkedNote = linkedGuestPhoneThisVisit
        ? ' Phone saved — they can log in with this number; loyalty counts from this visit.'
        : '';
      
      const response = await apiPut(`/appointments/${selectedAppointment.id}`, updateData) as any;
      console.log('Update response:', response);
      
      let actualProductCommission = 0;

      // Sell products if any selected
      // Use the appointment's barber ID for commission, not the logged-in user
      if (selectedProducts.length > 0 && selectedAppointment) {
        // Try multiple ways to get barber ID: response data, selectedAppointment barber object, or barberId field
        // Priority: response barber.id > response barberId > selectedAppointment barberId > selectedAppointment barber.id
        let barberId = response.data?.barber?.id || 
                        response.data?.barberId || 
                        (selectedAppointment as any).barberId ||
                        selectedAppointment.barber?.id ||
                        null;
        
        // If still no barber ID, try fetching the appointment again
        if (!barberId) {
          try {
            const appointmentResponse = await apiGet(`/appointments/${selectedAppointment.id}`) as any;
            if (appointmentResponse.success && appointmentResponse.data) {
              barberId = appointmentResponse.data.barber?.id || 
                         appointmentResponse.data.barberId || 
                         null;
            }
          } catch (error) {
            console.error('Error fetching appointment for barber ID:', error);
          }
        }
        
        if (!barberId) {
          console.warn('No barber ID found for appointment, commission will go to logged-in user');
        }
        for (const sp of selectedProducts) {
          try {
            const sellData: any = {
              productId: sp.productId,
              clientId: selectedAppointment.clientId,
              quantity: sp.quantity,
              appointmentId: selectedAppointment.id, // Link product sale to appointment
              paymentMethod
            };
            
            // Always include staffId if we have it
            if (barberId) {
              sellData.staffId = barberId;
            }
            
            const saleResponse = await apiPost('/products/sell', sellData) as any;
            actualProductCommission += Number(saleResponse?.data?.commissionAmount || 0);
          } catch (error) {
            console.error('Error selling product:', error);
            // Continue with other products even if one fails
          }
        }
      }
      
      // Reset modal state
      resetConfirmationModal();
      
      // Refresh appointments
      await mutateAppointments();
      
      // Fetch updated financial data and show comprehensive notification
      if (response.data && response.data.barber) {
        // Calculate appointment commission (based on originalPrice if available, otherwise finalPrice)
        const appointmentPrice = response.data.originalPrice || response.data.finalPrice || 0;
        const appointmentEarnings = appointmentPrice * (response.data.barber.commissionRate / 100);
        
        // Product commission now comes from per-product fixed RM settings.
        const productCommission = actualProductCommission;
        
        // Total earnings (appointment + products)
        const totalEarnings = appointmentEarnings + productCommission;
        
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
              `Appointment completed. Earnings: +RM${totalEarnings.toFixed(2)}. Today: RM${summary.totalEarnings.toFixed(2)}.${memberLinkedNote}`,
              'success'
            );
          } else {
            showNotification(
              `Appointment completed. Earnings: +RM${totalEarnings.toFixed(2)}.${memberLinkedNote}`,
              'success'
            );
          }
        } catch (error) {
          showNotification(
            `Appointment completed. Earnings: +RM${totalEarnings.toFixed(2)}.${memberLinkedNote}`,
            'success'
          );
        }
      } else {
        showNotification(`Appointment completed successfully!${memberLinkedNote}`, 'success');
      }
      
      console.log('Appointment completion successful');
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      
      // Handle specific error cases
      if (error?.error === 'Access token required' || error?.error === 'Invalid or expired token') {
        showNotification('Your session has expired. Please refresh the page and log in again.', 'error');
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

  // Calculate appointment price only (packages + custom packages, NO products)
  const calculateAppointmentPriceOnly = React.useCallback(() => {
    if (!selectedAppointment) return 0;
    
    // Use selected price option if variable pricing is enabled, otherwise use base price
    let total = selectedAppointment.package.hasVariablePricing && selectedPriceOption !== null
      ? selectedPriceOption
      : selectedAppointment.package.price;
    
    // Add additional packages
    selectedAdditionalPackages.forEach(packageId => {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) total += pkg.price;
    });
    
    // Add custom packages
    customPackages.forEach(pkg => {
      total += pkg.price;
    });
    
    // DO NOT add products here - they are tracked separately via product sales
    
    return total;
  }, [selectedAppointment, selectedPriceOption, selectedAdditionalPackages, packages, customPackages]);

  // Calculate total price including products (for display purposes only)
  const calculateTotalPrice = React.useCallback(() => {
    let total = calculateAppointmentPriceOnly();
    
    // Add products for display
    selectedProducts.forEach(sp => {
      const product = retailProducts.find(p => p.id === sp.productId);
      if (product) {
        total += product.price * sp.quantity;
      }
    });
    
    return total;
  }, [calculateAppointmentPriceOnly, selectedProducts, retailProducts]);

  const calculateDiscountedPrice = React.useCallback(() => {
    const totalPrice = calculateTotalPrice();
    if (!discountInfo) return totalPrice;
    
    let discountableAmount = 0;
    
    if (discountAppliedTo.basePackage && selectedAppointment) {
      // Use selected price option if variable pricing is enabled
      const basePrice = selectedAppointment.package.hasVariablePricing && selectedPriceOption !== null
        ? selectedPriceOption
        : selectedAppointment.package.price;
      discountableAmount += basePrice;
    }
    
    discountAppliedTo.additionalPackages.forEach(packageId => {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) discountableAmount += pkg.price;
    });
    
    discountAppliedTo.customPackages.forEach(index => {
      if (customPackages[index]) {
        discountableAmount += customPackages[index].price;
      }
    });
    
    // Calculate discount amount based on discount type
    let discountAmount = 0;
    if (discountInfo.discountType === 'fixed_amount') {
      discountAmount = Math.min(discountInfo.discountAmount || 0, discountableAmount);
    } else {
      discountAmount = (discountableAmount * (discountInfo.discountPercent || 0)) / 100;
    }
    return totalPrice - discountAmount;
  }, [calculateTotalPrice, discountInfo, discountAppliedTo, selectedAppointment, selectedPriceOption, packages, customPackages]);

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
          discountType: 'percentage' | 'fixed_amount';
          discountPercent?: number;
          discountAmount?: number;
        };
        message: string;
      }>('/discount-codes/validate', {
        code: code.toUpperCase(),
        clientId: selectedAppointment.clientId
      });
      
      if (response.success) {
        setDiscountInfo(response.data);
        setDiscountError(null);
        // Update final price based on current discount system
        if (multipleDiscountCodes.length > 0) {
          setFinalPrice(calculateMultipleDiscountsTotal());
        } else {
          setFinalPrice(calculateDiscountedPrice());
        }
      }
    } catch (error: any) {
      setDiscountInfo(null);
      setDiscountError(error.message || 'Invalid discount code');
      // Update final price based on current discount system
      if (multipleDiscountCodes.length > 0) {
        setFinalPrice(calculateMultipleDiscountsTotal());
      } else {
        setFinalPrice(calculateTotalPrice());
      }
    } finally {
      setValidatingDiscount(false);
    }
  };

  // Multiple discount code functions
  const validateCurrentDiscountCode = async (code: string) => {
    if (!code.trim() || !selectedAppointment) return null;
    
    setValidatingCurrentDiscount(true);
    
    try {
      const response = await apiPost<{
        success: boolean;
        data: {
          id: number;
          code: string;
          description?: string;
          discountType: 'percentage' | 'fixed_amount';
          discountPercent?: number;
          discountAmount?: number;
        };
        message: string;
      }>('/discount-codes/validate', {
        code: code.toUpperCase(),
        clientId: selectedAppointment.clientId
      });
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Invalid discount code',
        severity: 'error'
      });
      return null;
    } finally {
      setValidatingCurrentDiscount(false);
    }
  };

  const addDiscountCode = async () => {
    if (!currentDiscountCode.trim() || currentDiscountPackages.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a discount code and select packages',
        severity: 'warning'
      });
      return;
    }

    // Check if discount code already added
    if (multipleDiscountCodes.some(d => d.code === currentDiscountCode.toUpperCase())) {
      setSnackbar({
        open: true,
        message: 'This discount code is already added',
        severity: 'warning'
      });
      return;
    }

    const discountData = await validateCurrentDiscountCode(currentDiscountCode);
    if (discountData) {
      const newDiscount = {
        code: discountData.code,
        discountType: discountData.discountType,
        discountPercent: discountData.discountPercent,
        discountAmount: discountData.discountAmount,
        appliedToPackages: [...currentDiscountPackages]
      };
      
      setMultipleDiscountCodes(prev => [...prev, newDiscount]);
      setCurrentDiscountCode('');
      setCurrentDiscountPackages([]);
      
      setSnackbar({
        open: true,
        message: `Discount code "${discountData.code}" added successfully`,
        severity: 'success'
      });
    }
  };

  const removeDiscountCode = (codeToRemove: string) => {
    setMultipleDiscountCodes(prev => prev.filter(d => d.code !== codeToRemove));
  };

  const calculateMultipleDiscountsTotal = React.useCallback(() => {
    if (!selectedAppointment || multipleDiscountCodes.length === 0) return calculateTotalPrice();

    let totalPrice = calculateTotalPrice();
    let totalDiscount = 0;

    multipleDiscountCodes.forEach(discount => {
      let discountableAmount = 0;
      
      // Calculate discountable amount for this specific discount
      discount.appliedToPackages.forEach(packageId => {
        if (packageId === selectedAppointment.packageId) {
          discountableAmount += selectedAppointment.package?.price || 0;
        } else {
          // Check additional packages
          const additionalPkg = packages.find(p => p.id === packageId);
          if (additionalPkg && selectedAdditionalPackages.includes(packageId)) {
            discountableAmount += additionalPkg.price;
          }
          // Check custom packages (use index as ID)
          const customPkgIndex = customPackages.findIndex((p, index) => index === packageId);
          if (customPkgIndex !== -1) {
            discountableAmount += customPackages[customPkgIndex].price;
          }
        }
      });

      // Calculate discount amount based on discount type
      let discountAmount = 0;
      if (discount.discountType === 'fixed_amount') {
        // For fixed amount, apply the discount amount directly (but don't exceed the discountable amount)
        discountAmount = Math.min(discount.discountAmount || 0, discountableAmount);
      } else {
        // For percentage discount (default)
        discountAmount = (discountableAmount * (discount.discountPercent || 0)) / 100;
      }
      totalDiscount += discountAmount;
    });

    return Math.max(0, totalPrice - totalDiscount);
  }, [selectedAppointment, multipleDiscountCodes, selectedAdditionalPackages, customPackages, packages, calculateTotalPrice]);

  const validateEditDiscountCode = async (code: string) => {
    if (!code.trim() || !editingAppointment) return;
    
    setEditValidatingDiscount(true);
    setEditDiscountError(null);
    
    try {
      const response = await apiPost<{
        success: boolean;
        data: {
          id: number;
          code: string;
          description?: string;
          discountType: 'percentage' | 'fixed_amount';
          discountPercent?: number;
          discountAmount?: number;
        };
        message: string;
      }>('/discount-codes/validate', {
        code: code.toUpperCase(),
        clientId: editingAppointment.clientId
      });
      
      if (response.success) {
        setEditDiscountInfo(response.data);
        setEditDiscountError(null);
      }
    } catch (error: any) {
      setEditDiscountInfo(null);
      setEditDiscountError(error.message || 'Invalid discount code');
    } finally {
      setEditValidatingDiscount(false);
    }
  };

  // Edit modal multiple discount code functions
  const validateEditCurrentDiscountCode = async (code: string) => {
    if (!code.trim() || !editingAppointment) return null;
    
    setEditValidatingCurrentDiscount(true);
    
    try {
      const response = await apiPost<{
        success: boolean;
        data: {
          id: number;
          code: string;
          description?: string;
          discountType: 'percentage' | 'fixed_amount';
          discountPercent?: number;
          discountAmount?: number;
        };
        message: string;
      }>('/discount-codes/validate', {
        code: code.toUpperCase(),
        clientId: editingAppointment.clientId
      });
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Invalid discount code',
        severity: 'error'
      });
      return null;
    } finally {
      setEditValidatingCurrentDiscount(false);
    }
  };

  const addEditDiscountCode = async () => {
    if (!editCurrentDiscountCode.trim() || editCurrentDiscountPackages.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a discount code and select packages',
        severity: 'warning'
      });
      return;
    }

    // Check if discount code already added
    if (editMultipleDiscountCodes.some(d => d.code === editCurrentDiscountCode.toUpperCase())) {
      setSnackbar({
        open: true,
        message: 'This discount code is already added',
        severity: 'warning'
      });
      return;
    }

    const discountData = await validateEditCurrentDiscountCode(editCurrentDiscountCode);
    if (discountData) {
      const newDiscount = {
        code: discountData.code,
        discountType: discountData.discountType,
        discountPercent: discountData.discountPercent,
        discountAmount: discountData.discountAmount,
        appliedToPackages: [...editCurrentDiscountPackages]
      };
      
      setEditMultipleDiscountCodes(prev => [...prev, newDiscount]);
      setEditCurrentDiscountCode('');
      setEditCurrentDiscountPackages([]);
      
      setSnackbar({
        open: true,
        message: `Discount code "${discountData.code}" added successfully`,
        severity: 'success'
      });
    }
  };

  const removeEditDiscountCode = (codeToRemove: string) => {
    setEditMultipleDiscountCodes(prev => prev.filter(d => d.code !== codeToRemove));
  };

  const calculateEditMultipleDiscountsTotal = () => {
    if (!editingAppointment || editMultipleDiscountCodes.length === 0) {
      return calculateEditBasePrice();
    }

    const basePrice = calculateEditBasePrice();
    const discountAmount = calculateEditDiscountAmount();
    
    return Math.max(0, basePrice - discountAmount);
  };

  const calculateEditBasePrice = () => {
    if (!editingAppointment) return 0;
    
    let basePrice = editingAppointment.package?.price || 0;
    editAdditionalPackages.forEach(packageId => {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) basePrice += pkg.price;
    });
    
    // Add products
    editSelectedProducts.forEach(sp => {
      const product = retailProducts.find(p => p.id === sp.productId);
      if (product) {
        basePrice += product.price * sp.quantity;
      }
    });
    
    return basePrice;
  };

  const calculateEditDiscountAmount = () => {
    if (!editingAppointment || editMultipleDiscountCodes.length === 0) {
      return 0;
    }

    let totalDiscount = 0;

    editMultipleDiscountCodes.forEach(discount => {
      let discountableAmount = 0;
      
      // Calculate discountable amount for this specific discount
      discount.appliedToPackages.forEach(packageId => {
        if (packageId === editingAppointment.packageId) {
          discountableAmount += editingAppointment.package?.price || 0;
        } else {
          // Check additional packages
          const additionalPkg = packages.find(p => p.id === packageId);
          if (additionalPkg && editAdditionalPackages.includes(packageId)) {
            discountableAmount += additionalPkg.price;
          }
        }
      });

      // Calculate discount amount based on discount type
      let discountAmount = 0;
      if (discount.discountType === 'fixed_amount') {
        discountAmount = Math.min(discount.discountAmount || 0, discountableAmount);
      } else {
        discountAmount = (discountableAmount * (discount.discountPercent || 0)) / 100;
      }
      totalDiscount += discountAmount;
    });

    return totalDiscount;
  };

  const resetConfirmationModal = () => {
    setConfirmationOpen(false);
    setSelectedAppointment(null);
    setSelectedAdditionalPackages([]);
    setCustomPackages([]);
    setSelectedProducts([]);
    setFinalPrice(0);
    setPaymentMethod('');
    setCustomPackageName('');
    setCustomPackagePrice(0);
    // Reset discount code state
    setDiscountCode('');
    setDiscountInfo(null);
    setDiscountError(null);
    setDiscountAppliedTo({
      basePackage: false,
      additionalPackages: [],
      customPackages: []
    });
    setValidatingDiscount(false);
    // Reset multiple discount codes state
    setMultipleDiscountCodes([]);
    setCurrentDiscountCode('');
    setCurrentDiscountPackages([]);
    setValidatingCurrentDiscount(false);
    setShowAddServices(false);
    setShowAddProducts(false);
    setShowAddCustom(false);
    setShowAddDiscount(false);
    setShowFinalAdjust(false);
    setGuestCompletionPhone('');
  };

  React.useEffect(() => {
    if (confirmationOpen) {
      // Update final price based on current discount system
      if (multipleDiscountCodes.length > 0) {
        setFinalPrice(calculateMultipleDiscountsTotal());
      } else if (discountInfo) {
        setFinalPrice(calculateDiscountedPrice());
      } else {
        setFinalPrice(calculateTotalPrice());
      }
    }
  }, [selectedAdditionalPackages, customPackages, confirmationOpen, selectedAppointment, calculateTotalPrice, calculateDiscountedPrice, discountInfo, multipleDiscountCodes, calculateMultipleDiscountsTotal]);


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
  const getStatusChipProps = (status: string) => {
    const statusStyleMap: Record<string, { bg: string; color: string; border: string }> = {
      pending: { bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
      confirmed: { bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' },
      completed: { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
      cancelled: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
    };
    const style = statusStyleMap[status] ?? statusStyleMap.pending;

    return {
      label: status.charAt(0).toUpperCase() + status.slice(1),
      color: getStatusColor(status) as any,
      icon: getStatusIcon(status),
      variant: 'filled' as const,
      sx: {
        fontWeight: 700,
        textTransform: 'capitalize',
        borderRadius: 2,
        border: '1px solid',
        borderColor: style.border,
        bgcolor: style.bg,
        color: style.color,
        '& .MuiChip-icon': {
          color: style.color,
          fontSize: '1rem',
        },
      },
    };
  };

  const getPaymentChipProps = (paymentMethod?: 'CASH' | 'TRANSFER' | null) => {
    if (paymentMethod === 'CASH') {
      return {
        label: 'Cash',
        sx: {
          fontWeight: 700,
          borderRadius: 2,
          border: '1px solid #6ee7b7',
          bgcolor: '#ecfdf5',
          color: '#047857',
        },
      };
    }
    if (paymentMethod === 'TRANSFER') {
      return {
        label: 'Transfer',
        sx: {
          fontWeight: 700,
          borderRadius: 2,
          border: '1px solid #93c5fd',
          bgcolor: '#eff6ff',
          color: '#1d4ed8',
        },
      };
    }
    return {
      label: '—',
      sx: {
        fontWeight: 700,
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        bgcolor: '#f8fafc',
        color: '#64748b',
      },
    };
  };

  // List rows are server-paginated and server-filtered
  const totalPages = listMeta?.totalPages ?? 1;
  const totalListed = listMeta?.total ?? 0;
  const startIndex = totalListed === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + appointments.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, staffFilter, dateFilter, debouncedSearch]);

  const statusCounts = {
    pending: listMeta?.statusCounts?.pending ?? 0,
    confirmed: listMeta?.statusCounts?.confirmed ?? 0,
    completed: listMeta?.statusCounts?.completed ?? 0,
    cancelled: listMeta?.statusCounts?.cancelled ?? 0,
    todayTotal: listMeta?.todayTotal ?? 0,
  };
  
  // Helper function to calculate total price including products
  const getAppointmentTotalPrice = (appointment: Appointment) => {
    let total = appointment.finalPrice || appointment.package.price;
    
    // Add product sales if any
    if (appointment.productSales && appointment.productSales.length > 0) {
      const productTotal = appointment.productSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      total += productTotal;
    }
    
    return total;
  };
  
  /** Sum of completed appointment finalPrice across all rows (excludes retail add-ons; fast server aggregate). */
  const totalRevenue = listMeta?.completedFinalPriceSum ?? 0;
  const dialogPaperProps = {
    sx: {
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
    },
  };
  const modalTitleSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    pr: 6,
    py: 2,
    borderBottom: '1px solid',
    borderColor: 'divider',
    bgcolor: 'rgba(248, 250, 252, 0.9)',
    fontWeight: 700,
  };
  const modalCloseButtonSx = {
    position: 'absolute',
    right: 10,
    top: 10,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    '&:hover': { bgcolor: 'grey.100' },
  };
  const modalContentSx = {
    px: { xs: 2, sm: 3 },
    py: { xs: 2, sm: 2.5 },
    overflow: 'auto',
    maxHeight: { xs: '70vh', sm: '65vh' },
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
  const formFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: '#ffffff',
      transition: 'all 0.18s ease',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
      '&.Mui-focused fieldset': { borderColor: '#dc2626' },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#b91c1c',
    },
  };
  const StatCard = ({
    title,
    value,
    icon,
    avatarBg,
    avatarColor,
    valueColor,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    avatarBg: string;
    avatarColor: string;
    valueColor: string;
  }) => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <CardContent sx={{ p: { xs: 1.75, sm: 2 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: '0.08em' }}
            >
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: valueColor }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: avatarBg,
              color: avatarColor,
              width: 44,
              height: 44,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

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
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 2 },
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Appointments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track bookings, manage status, and complete checkouts faster.
            </Typography>
          </Box>
          {(userRole === 'Boss' || userRole === 'Staff') && (
            <Button
              variant="contained"
              onClick={() => {
                setCreateClientSnapshot(null);
                setCreateClientNameDraft('');
                setNewClientPhoneNumber('');
                setNewAppointment({ clientId: '', packageId: '', barberId: '' });
                setNewAdditionalPackages([]);
                setCreateAppointmentOpen(true);
              }}
              sx={{
                px: { xs: 2, sm: 1.25 },
                py: 1,
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: 44 },
                borderRadius: 999,
                bgcolor: '#dc2626',
                boxShadow: '0 10px 25px rgba(220, 38, 38, 0.28)',
                textTransform: 'none',
                fontWeight: 700,
                overflow: 'hidden',
                transition: 'all 220ms ease',
                '&:hover': {
                  bgcolor: '#b91c1c',
                  boxShadow: '0 12px 28px rgba(185, 28, 28, 0.34)',
                  px: { xs: 2, sm: 2.25 },
                  '& .create-appointment-label': {
                    maxWidth: { xs: 200, sm: 180 },
                    opacity: 1,
                    marginLeft: 0.75,
                  },
                },
              }}
              aria-label="Create appointment"
            >
              <AddIcon sx={{ fontSize: 20, flexShrink: 0 }} />
              <Box
                component="span"
                className="create-appointment-label"
                sx={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: 200, sm: 0 },
                  opacity: { xs: 1, sm: 0 },
                  marginLeft: { xs: 0.75, sm: 0 },
                  transition: 'all 220ms ease',
                }}
              >
                Create Appointment
              </Box>
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={statusCounts.pending}
            icon={<PendingActionsIcon fontSize="small" />}
            avatarBg="warning.light"
            avatarColor="warning.main"
            valueColor="warning.main"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={statusCounts.todayTotal}
            icon={<CheckCircleIcon fontSize="small" />}
            avatarBg="success.light"
            avatarColor="success.main"
            valueColor="success.main"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={statusCounts.completed}
            icon={<EventIcon fontSize="small" />}
            avatarBg="info.light"
            avatarColor="info.main"
            valueColor="info.main"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`RM${totalRevenue}`}
            icon={<AttachMoneyIcon fontSize="small" />}
            avatarBg="error.light"
            avatarColor="error.main"
            valueColor="error.main"
          />
        </Grid>
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
                fontWeight={700}
                sx={{
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                Recent Appointments
              </Typography>

              {/* Filters and Search */}
              <Stack
                sx={{
                  mb: { xs: 2, sm: 3 },
                  flexDirection: { xs: 'column', lg: 'row' },
                  flexWrap: 'wrap',
                  gap: 1.25,
                  alignItems: { xs: 'stretch', lg: 'center' },
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#fafafa',
                }}
              >
                <TextField
                  placeholder="Search by client, service, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{
                    flex: { xs: 'none', lg: 1 },
                    minWidth: { xs: '100%', lg: 300 },
                    maxWidth: { xs: '100%', lg: 420 },
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                    },
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
                    minWidth: { xs: '100%', sm: 155 },
                    maxWidth: { xs: '100%', sm: 180 },
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
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon fontSize="small" color="action" />
                        All Status
                      </Box>
                    </MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>

                {/* Staff Filter */}
                <FormControl
                  size="small"
                  sx={{
                    minWidth: { xs: '100%', sm: 155 },
                    maxWidth: { xs: '100%', sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <Select
                    value={staffFilter}
                    displayEmpty
                    onChange={(e) => setStaffFilter(e.target.value)}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        All Staff
                      </Box>
                    </MenuItem>
                    <MenuItem value="unassigned">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="disabled" />
                        Unassigned
                      </Box>
                    </MenuItem>
                    {staff.filter(member => member.status === 'active').map((member) => (
                      <MenuItem key={member.id} value={member.id.toString()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="primary" />
                          {member.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Date Filter */}
                <FormControl
                  size="small"
                  sx={{
                    minWidth: { xs: '100%', sm: 155 },
                    maxWidth: { xs: '100%', sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <Select
                    value={dateFilter}
                    displayEmpty
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <MenuItem value="all">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="action" />
                        All Dates
                      </Box>
                    </MenuItem>
                    <MenuItem value="today">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="primary" />
                        Today
                      </Box>
                    </MenuItem>
                    <MenuItem value="yesterday">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="secondary" />
                        Yesterday
                      </Box>
                    </MenuItem>
                    <MenuItem value="this_week">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="info" />
                        This Week
                      </Box>
                    </MenuItem>
                    <MenuItem value="this_month">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="success" />
                        This Month
                      </Box>
                    </MenuItem>
                    <MenuItem value="custom">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="warning" />
                        Custom Date
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Custom Date Picker - Only show when Custom Date is selected */}
                {dateFilter === 'custom' && (
                  <TextField
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter(e.target.value); // Set the actual date as the filter value
                    }}
                    size="small"
                    sx={{ 
                      minWidth: { xs: '100%', sm: 160 },
                      maxWidth: { xs: '100%', sm: 180 },
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        borderRadius: { xs: 1.5, sm: 1.5 },
                        bgcolor: 'background.paper',
                      }
                    }}
                  />
                )}
                
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center', 
                  justifyContent: { xs: 'center', lg: 'flex-end' },
                  mt: { xs: 0.5, sm: 0 },
                  px: { xs: 0.5, sm: 0 },
                  ml: { xs: 0, lg: 'auto' },
                }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.78rem', sm: '0.82rem' },
                      textAlign: { xs: 'center', lg: 'right' },
                      px: 1.25,
                      py: 0.6,
                      borderRadius: 999,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    Showing page {currentPage} of {totalPages} ({totalListed.toLocaleString()} filtered)
                  </Typography>
                </Box>
              </Stack>
            
              {appointmentsLoading ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                Loading appointments...
              </Typography>
            ) : appointments.length === 0 ? (
              <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                {totalListed === 0 ? 'No appointments found.' : 'No appointments match your filters for this page.'}
              </Typography>
            ) : isMobile ? (
              // Mobile Card Layout
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {appointments.map((appointment) => (
                  <Grid item xs={12} key={appointment.id}>
                    <AppointmentCard
                      appointment={appointment}
                      onMenuClick={handleMenuClick}
                      onRestoreToPending={(apt) => handleStatusUpdate('pending', apt)}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Desktop Table Layout
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  borderColor: 'divider',
                  boxShadow: 'none',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                }}
              >
                <Table sx={{ minWidth: 860 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'rgba(148, 163, 184, 0.12)' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Barber</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow
                        key={appointment.id}
                        hover
                        sx={{
                          '&:last-of-type td': { borderBottom: 0 },
                          '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.04)',
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {appointment.client.fullName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {appointment.client.fullName}
                                </Typography>
                                <AppointmentLoyaltyIndicator progress={appointment.client.loyaltyProgress} />
                                {!appointment.client.phoneNumber && (
                                  <Chip
                                    icon={<PersonOffIcon sx={{ fontSize: '0.9rem !important' }} />}
                                    size="small"
                                    label="Guest"
                                    variant="outlined"
                                    sx={{
                                      height: 22,
                                      borderColor: '#cbd5e1',
                                      color: '#475569',
                                      '& .MuiChip-label': { px: 0.75, fontWeight: 600, fontSize: '0.72rem' },
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.client.clientId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" fontWeight={500}>
                              {getAppointmentServices(appointment)[0]}
                            </Typography>
                            {getAppointmentServices(appointment).length > 1 && (
                              <Tooltip
                                title={getAppointmentServices(appointment).slice(1).join(', ')}
                                arrow
                              >
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={`+${getAppointmentServices(appointment).length - 1} more`}
                                />
                              </Tooltip>
                            )}
                            {appointment.package.barber && (
                              <Typography variant="caption" color="text.secondary">
                                by {appointment.package.barber}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {appointment.barber?.name || appointment.package.barber || 'Not assigned'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.appointmentDate ? formatDate(appointment.appointmentDate) : formatDate(appointment.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            RM{getAppointmentTotalPrice(appointment).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip {...getStatusChipProps(appointment.status)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip {...getPaymentChipProps(appointment.paymentMethod)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <>
                              <Tooltip title="Mark as completed">
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusUpdate('completed', appointment)}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: '#86efac',
                                    color: 'success.main',
                                    bgcolor: 'transparent',
                                    width: 30,
                                    height: 30,
                                    p: 0.5,
                                    '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.08)' },
                                  }}
                                >
                                  <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                              {(userRole === 'Boss' || userRole === 'Staff') && appointment.status !== 'pending' && (
                                <Tooltip title="Edit appointment">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditAppointment(appointment)}
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
                                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Cancel appointment">
                                <IconButton
                                  size="small"
                                    onClick={() => handleStatusUpdate('cancelled', appointment)}
                                    sx={{
                                      border: '1px solid',
                                    borderColor: '#fca5a5',
                                      color: 'error.main',
                                    bgcolor: 'transparent',
                                    width: 30,
                                    height: 30,
                                    p: 0.5,
                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                                    }}
                                >
                                  <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <>
                              <Tooltip title="Generate invoice">
                                <IconButton
                                  size="small"
                                  onClick={() => handleGenerateInvoice(appointment)}
                                >
                                  <ReceiptLongIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {userRole === 'Boss' && (
                                <Tooltip title="View log">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewAuditLog(appointment)}
                                  >
                                    <HistoryIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </>
                          )}
                          {appointment.status === 'cancelled' && (userRole === 'Boss' || userRole === 'Staff') && (
                            <Tooltip title="Restore to pending — then edit or complete">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleStatusUpdate('pending', appointment)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'primary.light',
                                  width: 30,
                                  height: 30,
                                  p: 0.5,
                                }}
                              >
                                <RestoreIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, appointment)}
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
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
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
                  Showing {startIndex + 1}-{endIndex} of {totalListed.toLocaleString()} appointments
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

         {/* Action Menu */}
         <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
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
          {/* Generate Invoice - Available for completed appointments */}
          {selectedAppointment?.status === 'completed' && (
            <MenuItem
              onClick={() => selectedAppointment && handleGenerateInvoice(selectedAppointment)}
              sx={{ borderRadius: 1.5, py: 1.1 }}
            >
              <ReceiptLongIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Generate Invoice
            </MenuItem>
          )}
          {/* View Audit Log - Boss only */}
          {userRole === 'Boss' && (
            <MenuItem
              onClick={() => selectedAppointment && handleViewAuditLog(selectedAppointment)}
              sx={{ borderRadius: 1.5, py: 1.1 }}
            >
              <HistoryIcon sx={{ mr: 1, fontSize: '1rem' }} />
              View Log
            </MenuItem>
          )}
          {/* Restore cancelled → pending before any edit/checkout (avoids broken payment/status flows) */}
          {(userRole === 'Boss' || userRole === 'Staff') && selectedAppointment?.status === 'cancelled' && (
            <MenuItem
              onClick={() => handleStatusUpdate('pending')}
              sx={{ borderRadius: 1.5, py: 1.1, color: 'primary.main' }}
            >
              <RestoreIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Restore to pending
            </MenuItem>
          )}
          {/* Edit: confirmed or completed only (not pending, not cancelled) */}
          {(userRole === 'Boss' || userRole === 'Staff') &&
            selectedAppointment &&
            (selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'completed') && (
            <MenuItem onClick={() => handleEditAppointment(selectedAppointment)} sx={{ borderRadius: 1.5, py: 1.1 }}>
              <EditOutlinedIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Edit
            </MenuItem>
          )}
          {/* Boss can change barber for any appointment, Staff only for non-completed/non-cancelled */}
          {userRole === 'Boss' && (
            <MenuItem onClick={() => setChangeBarberOpen(true)} sx={{ borderRadius: 1.5, py: 1.1 }}>
              <SwapHorizIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Change Barber
            </MenuItem>
          )}
          {userRole === 'Staff' && selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
            <MenuItem onClick={() => setChangeBarberOpen(true)} sx={{ borderRadius: 1.5, py: 1.1 }}>
              <SwapHorizIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Change Barber
            </MenuItem>
          )}
          {(selectedAppointment?.status === 'pending' || selectedAppointment?.status === 'confirmed') && (
            <MenuItem onClick={() => handleStatusUpdate('completed')} sx={{ borderRadius: 1.5, py: 1.1 }}>
              <CheckCircleOutlineIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Mark as Completed
            </MenuItem>
          )}
          {(selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed') && <Divider />}
          {selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
            <MenuItem onClick={() => handleStatusUpdate('cancelled')} sx={{ color: 'error.main', borderRadius: 1.5, py: 1.1 }}>
              <CancelOutlinedIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Cancel
            </MenuItem>
          )}
          {/* Boss can delete any appointment */}
          {userRole === 'Boss' && (
            <MenuItem onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'error.main', borderRadius: 1.5, py: 1.1 }}>
              <DeleteOutlineIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Delete 
            </MenuItem>
          )}
        </Menu>


        {/* Confirmation Modal for Completion */}
        <Dialog 
          open={confirmationOpen} 
          onClose={resetConfirmationModal} 
          maxWidth="md" 
          fullWidth
          PaperProps={dialogPaperProps}
        >
          <DialogTitle sx={modalTitleSx}>
            <CheckCircleOutlineIcon color="success" fontSize="small" />
            Complete Appointment
            <IconButton
              onClick={resetConfirmationModal}
              size="small"
              sx={modalCloseButtonSx}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={modalContentSx}>
            <Stack spacing={3}>
              {selectedAppointment && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip size="small" label={selectedAppointment.client.fullName} />
                  <AppointmentLoyaltyIndicator
                    progress={selectedAppointment.client.loyaltyProgress}
                    size={28}
                  />
                  <Chip size="small" variant="outlined" label={selectedAppointment.client.clientId} />
                  <Typography variant="body2" color="text.secondary">
                    {getAppointmentServices(selectedAppointment).join(', ')}
                  </Typography>
                  {selectedAppointment.barber && (
                    <Typography variant="body2" color="text.secondary">
                      • {selectedAppointment.barber.name}
                    </Typography>
                  )}
                </Box>
              )}

              {selectedAppointment &&
                selectedAppointment.package.loyaltyEligible !== false &&
                (selectedAppointment.client.loyaltyProgress ?? 0) === 5 && (
                <Alert
                  severity="info"
                  icon={<LocalOfferIcon />}
                  sx={{
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    border: '2px solid',
                    borderColor: 'info.dark',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.28), 0 4px 14px rgba(25, 118, 210, 0.22)',
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                    <strong>5/6</strong> — <strong>RM10 off this visit</strong>. Mention it at checkout.
                  </Typography>
                </Alert>
              )}

              {selectedAppointment && !selectedAppointment.client.phoneNumber && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Turn guest into member (optional)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="01XXXXXXXX"
                    value={guestCompletionPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setGuestCompletionPhone(digits);
                    }}
                    placeholder="0123456789"
                    inputProps={{ inputMode: 'numeric', maxLength: 11 }}
                  />
                </Box>
              )}

              {/* Variable Price Selection (if applicable) */}
              {selectedAppointment && selectedAppointment.package.hasVariablePricing && selectedAppointment.package.priceOptions && selectedAppointment.package.priceOptions.length > 0 && (
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2.5,
                  border: '2px solid #ef4444',
                  bgcolor: '#fef2f2',
                }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Select Price Option *
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Choose {selectedAppointment.package.name} Price</InputLabel>
                    <Select
                      value={selectedPriceOption || ''}
                      onChange={(e) => setSelectedPriceOption(e.target.value as number)}
                      label={`Choose ${selectedAppointment.package.name} Price`}
                      required
                      sx={{ bgcolor: 'white' }}
                    >
                      {selectedAppointment.package.priceOptions.map((option, index) => (
                        <MenuItem key={index} value={option.price}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography>{option.label}</Typography>
                            <Typography color="success.main" fontWeight={600}>RM{option.price}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* ── PAYMENT METHOD ── */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ 
                  mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontSize: '0.75rem' 
                }}>
                  Payment Method <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Box 
                      onClick={() => setPaymentMethod('CASH')}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2.5,
                        border: '2px solid',
                        borderColor: paymentMethod === 'CASH' ? '#059669' : '#e5e7eb',
                        bgcolor: paymentMethod === 'CASH' ? '#ecfdf5' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        position: 'relative',
                        '&:hover': {
                          borderColor: paymentMethod === 'CASH' ? '#059669' : '#9ca3af',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }
                      }}
                    >
                      <AttachMoneyIcon
                        sx={{
                          fontSize: '1.75rem',
                          mb: 0.5,
                          lineHeight: 1,
                          color: paymentMethod === 'CASH' ? '#059669' : '#374151',
                        }}
                      />
                      <Typography fontWeight={700} sx={{ fontSize: '0.85rem', color: paymentMethod === 'CASH' ? '#059669' : '#374151' }}>
                        CASH
                      </Typography>
                      {paymentMethod === 'CASH' && (
                        <CheckCircleIcon sx={{ 
                          fontSize: 20, color: '#059669', position: 'absolute', top: 8, right: 8 
                        }} />
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box 
                      onClick={() => setPaymentMethod('TRANSFER')}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2.5,
                        border: '2px solid',
                        borderColor: paymentMethod === 'TRANSFER' ? '#2563eb' : '#e5e7eb',
                        bgcolor: paymentMethod === 'TRANSFER' ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        position: 'relative',
                        '&:hover': {
                          borderColor: paymentMethod === 'TRANSFER' ? '#2563eb' : '#9ca3af',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                        }
                      }}
                    >
                      <AccountBalanceWalletIcon
                        sx={{
                          fontSize: '1.75rem',
                          mb: 0.5,
                          lineHeight: 1,
                          color: paymentMethod === 'TRANSFER' ? '#2563eb' : '#374151',
                        }}
                      />
                      <Typography fontWeight={700} sx={{ fontSize: '0.85rem', color: paymentMethod === 'TRANSFER' ? '#2563eb' : '#374151' }}>
                        TRANSFER
                      </Typography>
                      {paymentMethod === 'TRANSFER' && (
                        <CheckCircleIcon sx={{ 
                          fontSize: 20, color: '#2563eb', position: 'absolute', top: 8, right: 8 
                        }} />
                      )}
                    </Box>
                  </Grid>
                </Grid>
                {!paymentMethod && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    Please select a payment method
                  </Typography>
                )}
              </Box>

              {/* ── OPTIONAL ADD-ONS ── */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ 
                  mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontSize: '0.75rem' 
                }}>
                  Optional Add-ons
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={<AddCircleOutlineIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`Services${selectedAdditionalPackages.length > 0 ? ` (${selectedAdditionalPackages.length})` : ''}`}
                    variant={showAddServices ? 'filled' : 'outlined'}
                    color={selectedAdditionalPackages.length > 0 ? 'primary' : (showAddServices ? 'primary' : 'default')}
                    onClick={() => setShowAddServices(!showAddServices)}
                    clickable
                    sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                  />
                  <Chip
                    icon={<ShoppingBagOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`Products${selectedProducts.length > 0 ? ` (${selectedProducts.length})` : ''}`}
                    variant={showAddProducts ? 'filled' : 'outlined'}
                    color={selectedProducts.length > 0 ? 'secondary' : (showAddProducts ? 'secondary' : 'default')}
                    onClick={() => setShowAddProducts(!showAddProducts)}
                    clickable
                    sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                  />
                  <Chip
                    icon={<BuildOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`Custom${customPackages.length > 0 ? ` (${customPackages.length})` : ''}`}
                    variant={showAddCustom ? 'filled' : 'outlined'}
                    color={customPackages.length > 0 ? 'warning' : (showAddCustom ? 'warning' : 'default')}
                    onClick={() => setShowAddCustom(!showAddCustom)}
                    clickable
                    sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                  />
                  <Chip
                    icon={<LocalOfferIcon sx={{ fontSize: '1rem !important' }} />}
                    label={`Discount${multipleDiscountCodes.length > 0 ? ` (${multipleDiscountCodes.length})` : ''}`}
                    variant={showAddDiscount ? 'filled' : 'outlined'}
                    color={multipleDiscountCodes.length > 0 ? 'success' : (showAddDiscount ? 'success' : 'default')}
                    onClick={() => setShowAddDiscount(!showAddDiscount)}
                    clickable
                    sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                  />
                </Box>

                {/* ── Additional Services (Collapsible) ── */}
                <Collapse in={showAddServices} timeout={250}>
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Additional Packages</InputLabel>
                      <Select
                        multiple
                        value={selectedAdditionalPackages}
                        onChange={(e) => setSelectedAdditionalPackages(e.target.value as number[])}
                        label="Select Additional Packages"
                        sx={{ bgcolor: 'white' }}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const pkg = packages.find(p => p.id === value);
                              return (
                                <Chip 
                                  key={value} 
                                  label={pkg ? `${pkg.name} (RM${pkg.price})` : String(value)}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
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
                              <Typography color="success.main" fontWeight={600}>RM{pkg.price}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Collapse>

                {/* ── Products (Collapsible) ── */}
                <Collapse in={showAddProducts} timeout={250}>
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <FormControl fullWidth size="small" sx={{ mb: selectedProducts.length > 0 ? 1.5 : 0 }}>
                      <InputLabel>Select Product</InputLabel>
                      <Select
                        value=""
                        onChange={(e) => {
                          const productId = parseInt(e.target.value as string);
                          if (!isNaN(productId)) {
                            const product = retailProducts.find(p => p.id === productId);
                            if (product && !selectedProducts.find(sp => sp.productId === productId)) {
                              setSelectedProducts([...selectedProducts, { productId, quantity: 1 }]);
                            }
                          }
                        }}
                        label="Select Product"
                        sx={{ bgcolor: 'white' }}
                      >
                        {retailProducts.filter(p => !selectedProducts.find(sp => sp.productId === p.id)).map((product) => (
                          <MenuItem key={product.id} value={product.id.toString()}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <Box>
                                <Typography>{product.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Stock: {product.stock !== null ? product.stock : '∞'}
                                </Typography>
                              </Box>
                              <Typography color="success.main" fontWeight={600}>RM{product.price}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedProducts.length > 0 && (
                      <Stack spacing={1}>
                        {selectedProducts.map((sp, index) => {
                          const product = retailProducts.find(p => p.id === sp.productId);
                          if (!product) return null;
                          return (
                            <Box key={sp.productId} sx={{ 
                              display: 'flex', alignItems: 'center', gap: 1, p: 1.5, 
                              bgcolor: 'white', borderRadius: 1.5, border: '1px solid #e2e8f0'
                            }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600} noWrap>{product.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  RM{product.price} ea · Stock: {product.stock !== null ? product.stock : '∞'}
                                </Typography>
                              </Box>
                              <TextField
                                type="number"
                                size="small"
                                value={sp.quantity}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value) || 1;
                                  const updated = [...selectedProducts];
                                  updated[index].quantity = Math.max(1, qty);
                                  setSelectedProducts(updated);
                                }}
                                inputProps={{ min: 1, style: { width: '40px', textAlign: 'center' } }}
                                sx={{ width: '65px' }}
                              />
                              <Typography variant="body2" fontWeight={700} sx={{ minWidth: '55px', textAlign: 'right' }}>
                                RM{(product.price * sp.quantity).toFixed(2)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== index))}
                                sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}
                              >
                                <CloseIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                </Collapse>

                {/* ── Custom Packages (Collapsible) ── */}
                <Collapse in={showAddCustom} timeout={250}>
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                      <TextField
                        label="Package Name"
                        value={customPackageName}
                        onChange={(e) => setCustomPackageName(e.target.value)}
                        sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: 'white' } }}
                        size="small"
                      />
                      <TextField
                        label="Price"
                        type="number"
                        value={customPackagePrice || ''}
                        onChange={(e) => setCustomPackagePrice(parseFloat(e.target.value) || 0)}
                        InputProps={{ startAdornment: <InputAdornment position="start">RM</InputAdornment> }}
                        sx={{ width: 120, '& .MuiInputBase-root': { bgcolor: 'white' } }}
                        size="small"
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAddCustomPackage}
                        disabled={!customPackageName.trim() || customPackagePrice <= 0}
                        sx={{ 
                          minWidth: 'auto', px: 2, py: 1, 
                          bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' },
                          fontWeight: 700, fontSize: '0.8rem', borderRadius: 1.5,
                          textTransform: 'none',
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                    {customPackages.length > 0 && (
                      <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {customPackages.map((pkg, index) => (
                          <Chip
                            key={index}
                            label={`${pkg.name} — RM${pkg.price}`}
                            onDelete={() => handleRemoveCustomPackage(index)}
                            color="warning"
                            variant="outlined"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Collapse>

                {/* ── Discount Codes (Collapsible) ── */}
                <Collapse in={showAddDiscount} timeout={250}>
                  <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: currentDiscountCode.trim() ? 1.5 : 0 }}>
                      <TextField
                        label="Discount Code"
                        value={currentDiscountCode}
                        onChange={(e) => setCurrentDiscountCode(e.target.value.toUpperCase())}
                        placeholder="e.g., SUMMER20"
                        size="small"
                        sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: 'white' } }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={addDiscountCode}
                        disabled={!currentDiscountCode.trim() || validatingCurrentDiscount || currentDiscountPackages.length === 0}
                        sx={{ 
                          minWidth: 'auto', px: 2, 
                          bgcolor: '#059669', '&:hover': { bgcolor: '#047857' },
                          fontWeight: 700, fontSize: '0.8rem', borderRadius: 1.5,
                          textTransform: 'none',
                        }}
                      >
                        {validatingCurrentDiscount ? '...' : 'Apply'}
                      </Button>
                    </Box>

                    {currentDiscountCode.trim() && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Apply &quot;{currentDiscountCode}&quot; to:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                          {selectedAppointment && (
                            <Chip
                              label={`${selectedAppointment.package.name} (RM${selectedAppointment.package.price})`}
                              variant={currentDiscountPackages.includes(selectedAppointment.packageId) ? 'filled' : 'outlined'}
                              color={currentDiscountPackages.includes(selectedAppointment.packageId) ? 'primary' : 'default'}
                              onClick={() => {
                                const packageId = selectedAppointment.packageId;
                                setCurrentDiscountPackages(prev => 
                                  prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
                                );
                              }}
                              size="small"
                              sx={{ cursor: 'pointer', fontWeight: 500 }}
                            />
                          )}
                          {selectedAdditionalPackages.map(packageId => {
                            const pkg = packages.find(p => p.id === packageId);
                            if (!pkg) return null;
                            return (
                              <Chip
                                key={packageId}
                                label={`${pkg.name} (RM${pkg.price})`}
                                variant={currentDiscountPackages.includes(packageId) ? 'filled' : 'outlined'}
                                color={currentDiscountPackages.includes(packageId) ? 'primary' : 'default'}
                                onClick={() => {
                                  setCurrentDiscountPackages(prev => 
                                    prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]
                                  );
                                }}
                                size="small"
                                sx={{ cursor: 'pointer', fontWeight: 500 }}
                              />
                            );
                          })}
                          {customPackages.map((pkg, index) => (
                            <Chip
                              key={`custom-${index}`}
                              label={`${pkg.name} (RM${pkg.price})`}
                              variant={currentDiscountPackages.includes(index) ? 'filled' : 'outlined'}
                              color={currentDiscountPackages.includes(index) ? 'primary' : 'default'}
                              onClick={() => {
                                setCurrentDiscountPackages(prev => 
                                  prev.includes(index) ? prev.filter(id => id !== index) : [...prev, index]
                                );
                              }}
                              size="small"
                              sx={{ cursor: 'pointer', fontWeight: 500 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {multipleDiscountCodes.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Applied Codes:
                        </Typography>
                        <Stack spacing={1}>
                          {multipleDiscountCodes.map((discount, index) => (
                            <Box key={index} sx={{ 
                              p: 1.5, bgcolor: 'white', borderRadius: 1.5, border: '1px solid #d1fae5',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={700} sx={{ color: '#059669' }}>
                                  {discount.code}
                                </Typography>
                                <Chip
                                  label={discount.discountType === 'fixed_amount' 
                                    ? `RM${discount.discountAmount} OFF` 
                                    : `${discount.discountPercent}% OFF`}
                                  size="small"
                                  sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                                />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {discount.appliedToPackages.map(packageId => {
                                    let packageName = '';
                                    if (selectedAppointment && packageId === selectedAppointment.packageId) {
                                      packageName = selectedAppointment.package.name;
                                    } else {
                                      const pkg = packages.find(p => p.id === packageId);
                                      if (pkg) packageName = pkg.name;
                                      else {
                                        const customPkg = customPackages[packageId];
                                        if (customPkg) packageName = customPkg.name;
                                      }
                                    }
                                    return (
                                      <Chip key={packageId} label={packageName} size="small" variant="outlined" 
                                        sx={{ fontSize: '0.65rem', height: 20 }} />
                                    );
                                  })}
                                </Box>
                              </Box>
                              <IconButton size="small" onClick={() => removeDiscountCode(discount.code)}
                                sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>

              {/* ── PRICE SUMMARY ── */}
              <Box sx={{ 
                p: 0,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
              }}>
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ 
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontSize: '0.75rem' 
                  }}>
                    Price Summary
                  </Typography>
                </Box>
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Stack spacing={0.75}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedAppointment?.package.name}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        RM{selectedAppointment?.package.price}
                      </Typography>
                    </Box>
                    
                    {selectedAdditionalPackages.map(packageId => {
                      const pkg = packages.find(p => p.id === packageId);
                      return pkg ? (
                        <Box key={packageId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">+ {pkg.name}</Typography>
                          <Typography variant="body2" color="text.secondary">RM{pkg.price}</Typography>
                        </Box>
                      ) : null;
                    })}
                    
                    {customPackages.map((pkg, index) => (
                      <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">+ {pkg.name} (Custom)</Typography>
                        <Typography variant="body2" color="text.secondary">RM{pkg.price}</Typography>
                      </Box>
                    ))}
                    
                    {selectedProducts.map((sp) => {
                      const product = retailProducts.find(p => p.id === sp.productId);
                      if (!product) return null;
                      return (
                        <Box key={sp.productId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">+ {product.name} ×{sp.quantity}</Typography>
                          <Typography variant="body2" color="text.secondary">RM{(product.price * sp.quantity).toFixed(2)}</Typography>
                        </Box>
                      );
                    })}
                    
                    <Divider sx={{ my: 0.5 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600}>Subtotal</Typography>
                      <Typography variant="body2" fontWeight={600}>RM{calculateTotalPrice().toFixed(2)}</Typography>
                    </Box>
                    
                    {selectedProducts.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Staff commission
                        </Typography>
                        <Typography variant="caption" color="info.main" fontWeight={600}>
                          Based on product RM settings
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Discount Lines */}
                    {multipleDiscountCodes.length > 0 && (
                      <>
                        {multipleDiscountCodes.map((discount, index) => (
                          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: '#059669' }} fontWeight={600}>
                              {discount.code} ({discount.discountType === 'fixed_amount' 
                                ? `RM${discount.discountAmount}` : `${discount.discountPercent}%`})
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#059669' }} fontWeight={600}>
                              -RM{(() => {
                                let discountableAmount = 0;
                                discount.appliedToPackages.forEach(packageId => {
                                  if (packageId === selectedAppointment?.packageId) {
                                    discountableAmount += selectedAppointment.package?.price || 0;
                                  } else {
                                    const additionalPkg = packages.find(p => p.id === packageId);
                                    if (additionalPkg && selectedAdditionalPackages.includes(packageId)) {
                                      discountableAmount += additionalPkg.price;
                                    }
                                    const customPkg = customPackages.find((p, idx) => idx === packageId);
                                    if (customPkg) discountableAmount += customPkg.price;
                                  }
                                });
                                if (discount.discountType === 'fixed_amount') {
                                  return Math.min(discount.discountAmount || 0, discountableAmount).toFixed(2);
                                } else {
                                  return ((discountableAmount * (discount.discountPercent || 0)) / 100).toFixed(2);
                                }
                              })()}
                            </Typography>
                          </Box>
                        ))}
                        <Divider sx={{ my: 0.25 }} />
                      </>
                    )}
                    
                    {discountInfo && multipleDiscountCodes.length === 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#059669' }} fontWeight={600}>
                          Discount ({discountInfo.discountType === 'fixed_amount' 
                            ? `RM${discountInfo.discountAmount}` : `${discountInfo.discountPercent}%`})
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#059669' }} fontWeight={600}>
                          -RM{(calculateTotalPrice() - calculateDiscountedPrice()).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Total Amount Bar */}
                <Box sx={{ 
                  px: 2.5, py: 2,
                  bgcolor: '#f0fdf4',
                  borderTop: '2px solid #bbf7d0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#14532d' }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: '#15803d' }}>
                    RM{(() => {
                      if (multipleDiscountCodes.length > 0) {
                        return calculateMultipleDiscountsTotal().toFixed(2);
                      } else if (discountInfo) {
                        return calculateDiscountedPrice().toFixed(2);
                      } else {
                        return calculateTotalPrice().toFixed(2);
                      }
                    })()}
                  </Typography>
                </Box>
              </Box>

              {/* ── FINAL PRICE ADJUSTMENT (toggle) ── */}
              <Box>
                <Button 
                  size="small" 
                  onClick={() => setShowFinalAdjust(!showFinalAdjust)}
                  sx={{ 
                    textTransform: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 500,
                    px: 1, '&:hover': { bgcolor: '#f1f5f9' }
                  }}
                  endIcon={<ExpandMoreIcon sx={{ 
                    transform: showFinalAdjust ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} />}
                >
                  Manual Price Adjustment
                </Button>
                <Collapse in={showFinalAdjust} timeout={200}>
                  <Box sx={{ mt: 1 }}>
                    <TextField
                      label="Override Final Price"
                      type="number"
                      value={finalPrice || ''}
                      onChange={(e) => setFinalPrice(parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position="start">RM</InputAdornment> }}
                      fullWidth
                      size="small"
                      helperText="Override the calculated total (e.g., rounding, special discounts)"
                    />
                  </Box>
                </Collapse>
              </Box>

            </Stack>
          </DialogContent>

          {/* Actions */}
          <Box
            sx={{
              ...modalActionsSx,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={resetConfirmationModal}
              sx={{ ...secondaryButtonSx, flex: 'none', minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleConfirmCompletion()}
              disabled={isCompleting || !paymentMethod}
              sx={{ ...primaryButtonSx, flex: 'none', minWidth: { xs: 160, sm: 220 } }}
            >
              {isCompleting ? 'Processing...' : `Complete · RM${(() => {
                if (multipleDiscountCodes.length > 0) return calculateMultipleDiscountsTotal().toFixed(2);
                else if (discountInfo) return calculateDiscountedPrice().toFixed(2);
                else return calculateTotalPrice().toFixed(2);
              })()}`}
            </Button>
          </Box>
        </Dialog>

        {/* Create Appointment Modal */}
        <Dialog 
          open={createAppointmentOpen} 
          onClose={() => {
            setCreateAppointmentOpen(false);
            setCreateClientSnapshot(null);
            setCreateClientNameDraft('');
            setNewClientPhoneNumber('');
            setNewAppointment({ clientId: '', packageId: '', barberId: '' });
            setNewAdditionalPackages([]);
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={dialogPaperProps}
        >
          <DialogTitle sx={modalTitleSx}>
            <AddIcon fontSize="small" />
            Create New Appointment
            <IconButton
              onClick={() => {
                setCreateAppointmentOpen(false);
                setCreateClientSnapshot(null);
                setCreateClientNameDraft('');
                setNewClientPhoneNumber('');
                setNewAppointment({ clientId: '', packageId: '', barberId: '' });
                setNewAdditionalPackages([]);
              }}
              size="small"
              sx={modalCloseButtonSx}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={modalContentSx}>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Client Selection with Search and Quick Add */}
              <Autocomplete
                fullWidth
                freeSolo
                options={clients}
                filterOptions={(opts) => opts}
                getOptionLabel={(option) =>
                  typeof option === 'string' ? option : formatClientPickerLabel(option)
                }
                value={createAppointmentClientValue}
                inputValue={newClientPhoneNumber}
                onInputChange={(event, newInputValue) => {
                  setNewClientPhoneNumber(newInputValue);
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setNewClientPhoneNumber(newValue);
                    setNewAppointment({ ...newAppointment, clientId: '' });
                    setCreateClientSnapshot(null);
                    setCreateClientNameDraft('');
                  } else if (newValue) {
                    setNewAppointment({ ...newAppointment, clientId: newValue.id });
                    setNewClientPhoneNumber('');
                    setCreateClientSnapshot(newValue);
                    setCreateClientNameDraft(newValue.fullName || '');
                  } else {
                    setNewAppointment({ ...newAppointment, clientId: '' });
                    setCreateClientSnapshot(null);
                    setCreateClientNameDraft('');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or Add Client"
                    placeholder="Search name, ID, or phone (01XXXXXXXX)..."
                    helperText={
                      isPendingNewClient ? 'New number — add their name below, then Create.' : undefined
                    }
                    size="small"
                    sx={formFieldSx}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography fontWeight={500}>{option.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.clientId} • Phone: {option.phoneNumber ?? '—'}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) =>
                  String(option.id) === String(value.id)
                }
              />

              {isPendingNewClient && (
                <TextField
                  label="Client name (new profile)"
                  value={createClientNameDraft}
                  onChange={(e) => setCreateClientNameDraft(e.target.value.replace(/[0-9]/g, ''))}
                  size="small"
                  fullWidth
                  required
                  sx={formFieldSx}
                />
              )}

              {newAppointment.clientId && !isPendingNewClient && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    label="Edit Selected Client Name"
                    value={createClientNameDraft}
                    onChange={(e) => setCreateClientNameDraft(e.target.value.replace(/[0-9]/g, ''))}
                    size="small"
                    fullWidth
                    helperText="Quick fix for wrong names before creating appointment"
                    sx={formFieldSx}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleUpdateCreateClientName}
                    disabled={updatingCreateClientName || !createClientNameDraft.trim()}
                    sx={{ ...secondaryButtonSx, minWidth: 90, mt: 0.4 }}
                  >
                    {updatingCreateClientName ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}

              {/* Package Selection */}
              <FormControl fullWidth size="small" sx={formFieldSx}>
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

              {/* Barber Selection - Only for Boss */}
              {userRole === 'Boss' && (
                <FormControl fullWidth size="small" sx={formFieldSx}>
                  <InputLabel>
                    Assign Barber{' '}
                    <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>
                      (optional)
                    </Box>
                  </InputLabel>
                  <Select
                    value={newAppointment.barberId}
                    onChange={(e) => setNewAppointment({...newAppointment, barberId: e.target.value})}
                    label="Assign Barber (optional)"
                  >
                    <MenuItem value="">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="disabled" />
                        <Typography>No barber assigned</Typography>
                      </Box>
                    </MenuItem>
                    {staff.filter(member => member.status === 'active').map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="primary" />
                            <Typography>{member.name}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {member.role}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Staff Auto-Assignment Info */}
              {userRole === 'Staff' && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'info.light', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'info.main'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon fontSize="small" color="info" />
                    <Typography variant="subtitle2" color="info.dark" fontWeight={600}>
                      Barber Assignment
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="info.dark">
                    You will be automatically assigned as the barber for this appointment.
                  </Typography>
                </Box>
              )}

              {/* Additional Packages */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                  Additional Packages{' '}
                  <Box component="span" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                    (optional)
                  </Box>
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {packages.filter(pkg => pkg.id !== parseInt(newAppointment.packageId)).map((pkg) => (
                    <Chip
                      key={pkg.id}
                      label={`${pkg.name} - RM${pkg.price}`}
                      variant={newAdditionalPackages.includes(pkg.id) ? "filled" : "outlined"}
                      color={newAdditionalPackages.includes(pkg.id) ? "error" : "default"}
                      onClick={() => {
                        if (newAdditionalPackages.includes(pkg.id)) {
                          setNewAdditionalPackages(newAdditionalPackages.filter(id => id !== pkg.id));
                        } else {
                          setNewAdditionalPackages([...newAdditionalPackages, pkg.id]);
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 2.5,
                        fontWeight: 600,
                        '&.MuiChip-outlined': {
                          borderColor: '#cbd5e1',
                          bgcolor: '#fff',
                        },
                      }}
                    />
                  ))}
                </Box>
                {newAdditionalPackages.length > 0 && (
                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      Selected Additional Packages:
                    </Typography>
                    {newAdditionalPackages.map(packageId => {
                      const pkg = packages.find(p => p.id === packageId);
                      return pkg ? (
                        <Typography key={packageId} variant="body2" color="text.secondary">
                          • {pkg.name} - RM{pkg.price}
                        </Typography>
                      ) : null;
                    })}
                    <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                      Additional Total: RM{newAdditionalPackages.reduce((sum, id) => {
                        const pkg = packages.find(p => p.id === id);
                        return sum + (pkg?.price || 0);
                      }, 0)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={modalActionsSx}>
            <Button
              variant="outlined"
              onClick={() => {
                setCreateAppointmentOpen(false);
                setCreateClientSnapshot(null);
                setCreateClientNameDraft('');
                setNewClientPhoneNumber('');
                setNewAppointment({ clientId: '', packageId: '', barberId: '' });
                setNewAdditionalPackages([]);
              }}
              sx={secondaryButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateAppointment}
              disabled={!canSubmitCreateAppointment}
              sx={primaryButtonSx}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Change Barber Dialog */}
        <Dialog 
          open={changeBarberOpen} 
          onClose={() => setChangeBarberOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={dialogPaperProps}
        >
          <DialogTitle sx={modalTitleSx}>
            <SwapHorizIcon fontSize="small" />
            Change Barber
            <IconButton
              onClick={() => setChangeBarberOpen(false)}
              size="small"
              sx={modalCloseButtonSx}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            {selectedAppointment && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedAppointment.client.fullName} - {getAppointmentServices(selectedAppointment).join(', ')}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers sx={modalContentSx}>
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
          <DialogActions sx={modalActionsSx}>
            <Button
              variant="outlined"
              onClick={() => setChangeBarberOpen(false)}
              sx={secondaryButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleChangeBarber}
              disabled={!selectedBarberId}
              sx={primaryButtonSx}
            >
              Change Barber
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteConfirmOpen} 
          onClose={() => setDeleteConfirmOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={dialogPaperProps}
        >
          <DialogTitle sx={modalTitleSx}>
            <DeleteOutlineIcon fontSize="small" color="error" />
            Delete Appointment
            <IconButton
              onClick={() => setDeleteConfirmOpen(false)}
              size="small"
              sx={modalCloseButtonSx}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
            {selectedAppointment && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Are you sure you want to delete this appointment?
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers sx={modalContentSx}>
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
                  <strong>Service:</strong> {getAppointmentServices(selectedAppointment).join(', ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {selectedAppointment.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Price:</strong> RM{getAppointmentTotalPrice(selectedAppointment).toFixed(2)}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 500 }}>
              ⚠️ This action cannot be undone. The appointment will be permanently deleted.
            </Typography>
          </DialogContent>
          <DialogActions sx={modalActionsSx}>
            <Button
              variant="outlined"
              onClick={() => setDeleteConfirmOpen(false)}
              sx={secondaryButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteAppointment}
              sx={{
                ...primaryButtonSx,
                bgcolor: '#ef4444',
                '&:hover': { bgcolor: '#dc2626', boxShadow: '0 10px 24px rgba(220, 38, 38, 0.34)' },
              }}
            >
              Delete Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Appointment Dialog */}
        <Dialog 
          open={editAppointmentOpen} 
          onClose={() => {
            setEditAppointmentOpen(false);
            setEditClientSnapshot(null);
          }} 
          maxWidth="md" 
          fullWidth
          PaperProps={dialogPaperProps}
        >
          <DialogTitle sx={modalTitleSx}>
            <EditOutlinedIcon fontSize="small" />
            Edit Appointment
            <IconButton
              onClick={() => {
                setEditAppointmentOpen(false);
                setEditClientSnapshot(null);
              }}
              size="small"
              sx={modalCloseButtonSx}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ ...modalContentSx, py: { xs: 1, sm: 2 } }}>
            {editingAppointment && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Client Selection with Search and Quick Add */}
                <Autocomplete
                  fullWidth
                  freeSolo
                  options={clients}
                  filterOptions={(opts) => opts}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : formatClientPickerLabel(option)
                  }
                  value={editAppointmentClientValue}
                  inputValue={editClientPhoneNumber}
                  onInputChange={(event, newInputValue) => {
                    setEditClientPhoneNumber(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                      setEditClientPhoneNumber(newValue.trim());
                      setEditingAppointment({ ...editingAppointment, clientId: '' });
                      setEditClientSnapshot(null);
                    } else if (newValue) {
                      setEditingAppointment({ ...editingAppointment, clientId: newValue.id });
                      setEditClientPhoneNumber('');
                      setEditClientSnapshot(newValue);
                    } else {
                      setEditingAppointment({ ...editingAppointment, clientId: '' });
                      setEditClientSnapshot(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select or Add Client"
                      placeholder="Search name, ID, or phone (01XXXXXXXX)..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography fontWeight={500}>{option.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {option.clientId} • Phone: {option.phoneNumber ?? '—'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) =>
                    String(option.id) === String(value.id)
                  }
                />

                {/* Package Selection */}
                <FormControl fullWidth>
                  <InputLabel>Select Package</InputLabel>
                  <Select
                    value={editingAppointment.packageId}
                    onChange={(e) => setEditingAppointment({...editingAppointment, packageId: e.target.value})}
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

                {/* Appointment Date - Only visible to Boss */}
                {userRole === 'Boss' && (
                  <TextField
                    label="Appointment Date & Time"
                    type="datetime-local"
                    value={editingAppointment.appointmentDate}
                    onChange={(e) => setEditingAppointment({...editingAppointment, appointmentDate: e.target.value})}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText="Optional - leave empty for walk-in appointments"
                  />
                )}

                {/* Notes */}
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={editingAppointment.notes}
                  onChange={(e) => setEditingAppointment({...editingAppointment, notes: e.target.value})}
                  fullWidth
                  placeholder="Any special requirements or notes..."
                />

                {/* Payment Method (editable) */}
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={editingAppointment.paymentMethod ?? ''}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setEditingAppointment({
                        ...editingAppointment,
                        paymentMethod: v === '' ? null : v,
                      });
                    }}
                    label="Payment Method"
                  >
                    <MenuItem value="">
                      Clear / Not set
                    </MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="TRANSFER">Online Transfer</MenuItem>
                  </Select>
                </FormControl>

                {/* Additional Packages */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Additional Packages (Optional)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {packages.filter(pkg => pkg.id !== editingAppointment.packageId).map((pkg) => (
                      <Chip
                        key={pkg.id}
                        label={`${pkg.name} - RM${pkg.price}`}
                        variant={editAdditionalPackages.includes(pkg.id) ? "filled" : "outlined"}
                        color={editAdditionalPackages.includes(pkg.id) ? "primary" : "default"}
                        onClick={() => {
                          if (editAdditionalPackages.includes(pkg.id)) {
                            setEditAdditionalPackages(editAdditionalPackages.filter(id => id !== pkg.id));
                          } else {
                            setEditAdditionalPackages([...editAdditionalPackages, pkg.id]);
                          }
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  {editAdditionalPackages.length > 0 && (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                        Selected Additional Packages:
                      </Typography>
                      {editAdditionalPackages.map(packageId => {
                        const pkg = packages.find(p => p.id === packageId);
                        return pkg ? (
                          <Typography key={packageId} variant="body2" color="text.secondary">
                            • {pkg.name} - RM{pkg.price}
                          </Typography>
                        ) : null;
                      })}
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                        Additional Total: RM{editAdditionalPackages.reduce((sum, id) => {
                          const pkg = packages.find(p => p.id === id);
                          return sum + (pkg?.price || 0);
                        }, 0)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Products */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Products (Optional)
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Select Product</InputLabel>
                    <Select
                      value=""
                      onChange={(e) => {
                        const productId = parseInt(e.target.value as string);
                        if (!isNaN(productId)) {
                          const product = retailProducts.find(p => p.id === productId);
                          if (product && !editSelectedProducts.find(sp => sp.productId === productId)) {
                            setEditSelectedProducts([...editSelectedProducts, { productId, quantity: 1 }]);
                          }
                        }
                      }}
                      label="Select Product"
                    >
                      {retailProducts.filter(p => !editSelectedProducts.find(sp => sp.productId === p.id)).map((product) => (
                        <MenuItem key={product.id} value={product.id.toString()}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Box>
                              <Typography>{product.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Stock: {product.stock !== null ? product.stock : '∞'}
                              </Typography>
                            </Box>
                            <Typography color="success.main" fontWeight={600}>
                              RM{product.price}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* Selected Products */}
                  {editSelectedProducts.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {editSelectedProducts.map((sp, index) => {
                        const product = retailProducts.find(p => p.id === sp.productId);
                        if (!product) return null;
                        return (
                          <Box key={sp.productId} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            p: 1, 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 1 
                          }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {product.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                RM{product.price} each • Stock: {product.stock !== null ? product.stock : '∞'}
                              </Typography>
                            </Box>
                            <TextField
                              type="number"
                              size="small"
                              value={sp.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                const updated = [...editSelectedProducts];
                                updated[index].quantity = Math.max(1, qty);
                                setEditSelectedProducts(updated);
                              }}
                              inputProps={{ min: 1, style: { width: '60px', textAlign: 'center' } }}
                              sx={{ width: '80px' }}
                            />
                            <Typography variant="body2" fontWeight={600} sx={{ minWidth: '60px', textAlign: 'right' }}>
                              RM{(product.price * sp.quantity).toFixed(2)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditSelectedProducts(editSelectedProducts.filter((_, i) => i !== index));
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* Multiple Discount Codes */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Discount Codes (Optional)
                  </Typography>
                  {/* Add New Discount Code */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      label="Enter Discount Code"
                      value={editCurrentDiscountCode}
                      onChange={(e) => setEditCurrentDiscountCode(e.target.value.toUpperCase())}
                      placeholder="e.g., SUMMER20"
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={addEditDiscountCode}
                      disabled={!editCurrentDiscountCode.trim() || editValidatingCurrentDiscount || editCurrentDiscountPackages.length === 0}
                      sx={{ px: 2, py: 1, fontSize: 12, minWidth: 'auto' }}
                    >
                      {editValidatingCurrentDiscount ? 'Checking...' : 'Add'}
                    </Button>
                  </Box>

                  {/* Package Selection for Current Discount */}
                  {editCurrentDiscountCode.trim() && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Select packages for &quot;{editCurrentDiscountCode}&quot;:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {/* Base Package */}
                        {editingAppointment && (
                          <Chip
                            label={`${editingAppointment.package?.name} (RM${editingAppointment.package?.price})`}
                            variant={editCurrentDiscountPackages.includes(editingAppointment.packageId) ? "filled" : "outlined"}
                            color={editCurrentDiscountPackages.includes(editingAppointment.packageId) ? "primary" : "default"}
                            onClick={() => {
                              const packageId = editingAppointment.packageId;
                              setEditCurrentDiscountPackages(prev => 
                                prev.includes(packageId) 
                                  ? prev.filter(id => id !== packageId)
                                  : [...prev, packageId]
                              );
                            }}
                            sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                          />
                        )}
                        
                        {/* Additional Packages */}
                        {editAdditionalPackages.map(packageId => {
                          const pkg = packages.find(p => p.id === packageId);
                          if (!pkg) return null;
                          return (
                            <Chip
                              key={packageId}
                              label={`${pkg.name} (RM${pkg.price})`}
                              variant={editCurrentDiscountPackages.includes(packageId) ? "filled" : "outlined"}
                              color={editCurrentDiscountPackages.includes(packageId) ? "primary" : "default"}
                              onClick={() => {
                                setEditCurrentDiscountPackages(prev => 
                                  prev.includes(packageId) 
                                    ? prev.filter(id => id !== packageId)
                                    : [...prev, packageId]
                                );
                              }}
                              sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Applied Discount Codes */}
                  {editMultipleDiscountCodes.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Applied Discount Codes:
                      </Typography>
                      <Stack spacing={1}>
                        {editMultipleDiscountCodes.map((discount, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              border: '1px solid #e0e0e0',
                              borderRadius: 2,
                              bgcolor: '#f8f9fa'
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {discount.code}
                                </Typography>
                                <Chip
                                  label={`${discount.discountPercent}% OFF`}
                                  size="small"
                                  color="success"
                                  variant="filled"
                                />
                              </Box>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removeEditDiscountCode(discount.code)}
                                sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                              >
                                Remove
                              </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {discount.appliedToPackages.map(packageId => {
                                let packageName = '';
                                let packagePrice = 0;
                                
                                if (editingAppointment && packageId === editingAppointment.packageId) {
                                  packageName = editingAppointment.package?.name || '';
                                  packagePrice = editingAppointment.package?.price || 0;
                                } else {
                                  const pkg = packages.find(p => p.id === packageId);
                                  if (pkg) {
                                    packageName = pkg.name;
                                    packagePrice = pkg.price;
                                  }
                                }
                                
                                return (
                                  <Chip
                                    key={packageId}
                                    label={`${packageName} (RM${packagePrice})`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                );
                              })}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                      
                      {/* Total Discount Summary */}
                      <Box sx={{ 
                        mt: 2,
                        p: 2,
                        bgcolor: 'success.light',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'success.main'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight={600} color="success.dark">
                            Total Discount
                          </Typography>
                          <Typography variant="h6" fontWeight={700} color="success.dark">
                            RM{calculateEditDiscountAmount().toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Price Summary */}
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Price Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Base Package: {editingAppointment?.package?.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      RM{editingAppointment?.package?.price || 0}
                    </Typography>
                  </Box>
                  
                  {editAdditionalPackages.length > 0 && (
                    <Box>
                      {editAdditionalPackages.map(packageId => {
                        const pkg = packages.find(p => p.id === packageId);
                        return pkg ? (
                          <Box key={packageId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              + {pkg.name}
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              RM{pkg.price}
                            </Typography>
                          </Box>
                        ) : null;
                      })}
                    </Box>
                  )}
                  
                  {editSelectedProducts.map((sp, index) => {
                    const product = retailProducts.find(p => p.id === sp.productId);
                    if (!product) return null;
                    const productTotal = product.price * sp.quantity;
                    return (
                      <Box key={sp.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          + {product.name} (x{sp.quantity})
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          RM{productTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    );
                  })}
                  
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        Subtotal:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        RM{calculateEditBasePrice().toFixed(2)}
                      </Typography>
                    </Box>
                    
                    {/* Product commission now uses fixed RM per-product settings */}
                    {editSelectedProducts.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Staff Commission:
                        </Typography>
                        <Typography variant="body2" color="info.main" fontWeight={600}>
                          Based on product RM settings
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {editMultipleDiscountCodes.length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="success.main" fontWeight={500}>
                          Total Discount ({editMultipleDiscountCodes.length} codes)
                        </Typography>
                        <Typography variant="body2" color="success.main" fontWeight={600}>
                          -RM{calculateEditDiscountAmount().toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2, pt: 2, borderTop: '2px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>
                        Final Total
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        RM{calculateEditMultipleDiscountsTotal().toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={modalActionsSx}>
            <Button
              variant="outlined"
              onClick={() => {
                setEditAppointmentOpen(false);
                setEditClientSnapshot(null);
                setEditAdditionalPackages([]);
                // Reset edit discount states
                setEditDiscountCode('');
                setEditDiscountInfo(null);
                setEditDiscountError(null);
                setEditDiscountAppliedTo({
                  basePackage: false,
                  additionalPackages: [],
                  customPackages: []
                });
                // Reset edit multiple discount codes state
                setEditMultipleDiscountCodes([]);
                setEditCurrentDiscountCode('');
                setEditCurrentDiscountPackages([]);
                setEditValidatingCurrentDiscount(false);
              }}
              sx={secondaryButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateAppointment}
              disabled={(!editingAppointment?.clientId && !editClientPhoneNumber) || !editingAppointment?.packageId}
              sx={primaryButtonSx}
            >
              Update Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Audit Log Dialog */}
        <Dialog
          open={auditLogOpen}
          onClose={() => setAuditLogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={dialogPaperProps}
        >
          <DialogTitle sx={modalTitleSx}>
            <HistoryIcon color="primary" />
            Appointment Edit History
            <IconButton
              onClick={() => setAuditLogOpen(false)}
              size="small"
              sx={modalCloseButtonSx}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {loadingAuditLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading audit logs...</Typography>
              </Box>
            ) : auditLogs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No edit history available for this appointment.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {auditLogs.map((log, index) => (
                  <Card key={log.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {log.user?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.user?.role} • {log.user?.email}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestamp).toLocaleString('en-MY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" fontWeight={500} color="primary" sx={{ mb: 1 }}>
                      Action: {log.action.toUpperCase()}
                    </Typography>
                    
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                          Changes Made:
                        </Typography>
                        {Object.entries(log.changes).map(([field, change]: [string, any]) => (
                          <Box key={field} sx={{ mb: 0.5 }}>
                            <Typography variant="caption" component="span" fontWeight={500}>
                              {field}:
                            </Typography>
                            <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip
                                size="small"
                                variant="outlined"
                                color="error"
                                label={change.from !== null && change.from !== undefined ? String(change.from) : 'null'}
                              />
                              <Typography variant="caption">to</Typography>
                              <Chip
                                size="small"
                                color="primary"
                                label={change.to !== null && change.to !== undefined ? String(change.to) : 'null'}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Card>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={modalActionsSx}>
            <Button onClick={() => setAuditLogOpen(false)} variant="outlined" sx={secondaryButtonSx}>
              Close
            </Button>
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
