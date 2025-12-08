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
  Autocomplete
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';
import jsPDF from 'jspdf';

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  barber: string | null;
  imageUrl: string | null;
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
  appointmentDate: string | null;
  notes: string | null;
  createdAt: string;
  additionalPackages?: number[];
  customPackages?: CustomPackage[];
  finalPrice?: number;
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
    phoneNumber: string;
  };
  package: {
    name: string;
    description: string;
    price: number;
    duration: number;
    barber: string | null;
    imageUrl: string | null;
    hasVariablePricing?: boolean;
    priceOptions?: Array<{ label: string; price: number }>;
  };
  barber?: {
    id: number;
    name: string;
    role: string;
    commissionRate: number;
    productCommissionRate?: number;
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
  const [discountCodes, setDiscountCodes] = React.useState<any[]>([]);
  const [selectedBarberId, setSelectedBarberId] = React.useState<string>('');
  const [editAppointmentOpen, setEditAppointmentOpen] = React.useState(false);
  const [editingAppointment, setEditingAppointment] = React.useState<any>(null);
  const [editAdditionalPackages, setEditAdditionalPackages] = React.useState<number[]>([]);
  const [editSelectedProducts, setEditSelectedProducts] = React.useState<{productId: number, quantity: number}[]>([]);
  
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  const [newAppointment, setNewAppointment] = React.useState({
    clientId: '',
    packageId: '',
    barberId: ''
  });
  const [newClientPhoneNumber, setNewClientPhoneNumber] = React.useState<string>('');
  const [editClientPhoneNumber, setEditClientPhoneNumber] = React.useState<string>('');
  const [newAdditionalPackages, setNewAdditionalPackages] = React.useState<number[]>([]);

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper function to get all services for an appointment
  const getAppointmentServices = (appointment: any) => {
    const services = [appointment.package.name];
    
    // Debug logging
    console.log('[getAppointmentServices] Appointment:', appointment.id, 'ProductSales:', appointment.productSales);
    
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
      console.log('[getAppointmentServices] Found product sales:', appointment.productSales.length);
      appointment.productSales.forEach((sale: any) => {
        if (sale.product) {
          const productName = sale.quantity > 1 
            ? `${sale.product.name} (x${sale.quantity})`
            : sale.product.name;
          services.push(`🛍️ ${productName}`);
        }
      });
    } else {
      console.log('[getAppointmentServices] No product sales found');
    }
    
    return services;
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
      fetchDiscountCodes();
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

  const fetchRetailProducts = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: any[] }>('/products?activeOnly=true');
      setRetailProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching retail products:', error);
      setRetailProducts([]);
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
      let clientId = newAppointment.clientId;
      
      // If no client selected but phone number typed, register new client first
      if (!clientId && newClientPhoneNumber) {
        const phoneNumber = newClientPhoneNumber.trim();
        
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
      
      // Refresh appointments and clients
      fetchAppointments();
      fetchClients();
      
      showNotification('Appointment created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      const errorMessage = error?.message || error?.error || 'Failed to create appointment. Please try again.';
      showNotification(errorMessage, 'error');
    }
  };

  const handleEditAppointment = (appointment: any) => {
    console.log('Editing appointment:', appointment); // Debug log
    
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
                quantity: sp.quantity
              };
              
              // Always include staffId if we have it
              if (barberId) {
                sellData.staffId = barberId;
              }

              // Use appointment's date for the product sale (appointmentDate or createdAt as fallback)
              const appointmentDate = editingAppointment.appointmentDate || editingAppointment.createdAt;
              if (appointmentDate) {
                sellData.saleDate = new Date(appointmentDate).toISOString();
              }
              
              console.log('Creating NEW product sale with date:', sellData);
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
      fetchAppointments();
      
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

  const handleGenerateInvoice = () => {
    if (!selectedAppointment) return;
    
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
      
      const invoiceDate = selectedAppointment.appointmentDate 
        ? new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date(selectedAppointment.createdAt).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
      
      pdf.text(`Invoice #: ${selectedAppointment.id}`, margin, yPosition);
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
      pdf.text(selectedAppointment.client.fullName, margin, yPosition);
      yPosition += 5;
      pdf.text(selectedAppointment.client.phoneNumber, margin, yPosition);
      yPosition += 5;
      pdf.text(`Client ID: ${selectedAppointment.client.clientId}`, margin, yPosition);
      
      yPosition += 15;
      
      // Barber Information
      if (selectedAppointment.barber) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Served By:', margin, yPosition);
        yPosition += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.text(selectedAppointment.barber.name, margin, yPosition);
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
      pdf.text(selectedAppointment.package.name, margin + 5, yPosition);
      pdf.text(`RM${selectedAppointment.package.price.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
      yPosition += 7;
      
      let subtotal = selectedAppointment.package.price;
      
      // Additional Packages
      if (selectedAppointment.additionalPackages && selectedAppointment.additionalPackages.length > 0) {
        for (const pkgId of selectedAppointment.additionalPackages) {
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
      if (selectedAppointment.customPackages && selectedAppointment.customPackages.length > 0) {
        for (const customPkg of selectedAppointment.customPackages) {
          pdf.text(`  + ${customPkg.name}`, margin + 5, yPosition);
          pdf.text(`RM${customPkg.price.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });
          yPosition += 7;
          subtotal += customPkg.price;
        }
      }
      
      // Products
      if (selectedAppointment.productSales && selectedAppointment.productSales.length > 0) {
        yPosition += 5;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Products:', margin + 5, yPosition);
        yPosition += 7;
        pdf.setFont('helvetica', 'normal');
        
        for (const productSale of selectedAppointment.productSales) {
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
      const finalPrice = selectedAppointment.finalPrice || subtotal;
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
      const statusText = `Status: ${selectedAppointment.status.toUpperCase()}`;
      const statusColor = selectedAppointment.status === 'completed' 
        ? [76, 175, 80] 
        : selectedAppointment.status === 'cancelled' 
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
      const fileName = `Invoice_${selectedAppointment.id}_${selectedAppointment.client.fullName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      showNotification('Invoice generated successfully!', 'success');
      handleMenuClose();
    } catch (error) {
      console.error('Error generating invoice:', error);
      showNotification('Failed to generate invoice', 'error');
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedAppointment) return;

    if (newStatus === 'completed') {
      // Populate additional packages from the appointment
      if (selectedAppointment.additionalPackages && Array.isArray(selectedAppointment.additionalPackages)) {
        setSelectedAdditionalPackages(selectedAppointment.additionalPackages);
      } else {
        setSelectedAdditionalPackages([]);
      }
      
      // Populate custom packages from the appointment
      if (selectedAppointment.customPackages && Array.isArray(selectedAppointment.customPackages)) {
        setCustomPackages(selectedAppointment.customPackages);
      } else {
        setCustomPackages([]);
      }
      
      // Reset products and fetch retail products
      setSelectedProducts([]);
      fetchRetailProducts();
      
      // Reset price option selection
      setSelectedPriceOption(null);
      
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

    // Check if price option is selected for variable pricing packages
    if (selectedAppointment.package.hasVariablePricing && selectedPriceOption === null) {
      showNotification('Please select a price option for ' + selectedAppointment.package.name, 'error');
      return;
    }

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
      
      const updateData = {
        status: 'completed',
        additionalPackages: selectedAdditionalPackages,
        customPackages: customPackages,
        finalPrice: appointmentFinalPrice, // Only appointment price, NO products
        // Legacy single discount support
        discountCodeId: discountInfo?.id || null,
        discountAmount: discountInfo ? (appointmentOnlyPrice - appointmentFinalPrice) : null,
        multipleDiscountCodes: multipleDiscountCodes.length > 0 ? multipleDiscountCodes.map(discount => ({
          code: discount.code,
          appliedToPackages: discount.appliedToPackages
        })) : null
      };

      console.log('Sending update data:', updateData);
      
      const response = await apiPut(`/appointments/${selectedAppointment.id}`, updateData) as any;
      console.log('Update response:', response);
      
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
              appointmentId: selectedAppointment.id  // Link product sale to appointment
            };
            
            // Always include staffId if we have it
            if (barberId) {
              sellData.staffId = barberId;
            }
            
            await apiPost('/products/sell', sellData);
          } catch (error) {
            console.error('Error selling product:', error);
            // Continue with other products even if one fails
          }
        }
      }
      
      // Reset modal state
      resetConfirmationModal();
      
      // Refresh appointments
      await fetchAppointments();
      
      // Fetch updated financial data and show comprehensive notification
      if (response.data && response.data.barber) {
        // Calculate appointment commission (based on originalPrice if available, otherwise finalPrice)
        const appointmentPrice = response.data.originalPrice || response.data.finalPrice || 0;
        const appointmentEarnings = appointmentPrice * (response.data.barber.commissionRate / 100);
        
        // Calculate product commission (using barber's productCommissionRate)
        let productCommission = 0;
        if (selectedProducts.length > 0) {
          const productTotal = selectedProducts.reduce((sum, sp) => {
            const product = retailProducts.find(p => p.id === sp.productId);
            return sum + (product ? product.price * sp.quantity : 0);
          }, 0);
          // Use barber's productCommissionRate if available, otherwise default to 5%
          const commissionRate = (response.data?.barber as any)?.productCommissionRate ?? 5.0;
          productCommission = productTotal * (commissionRate / 100);
        }
        
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
              `🎉 Appointment completed! +RM${totalEarnings.toFixed(2)} (Appointment: RM${appointmentEarnings.toFixed(2)}${productCommission > 0 ? ` + Products: RM${productCommission.toFixed(2)}` : ''}) | Today: RM${summary.totalEarnings.toFixed(2)} (${summary.totalCustomers} customers, ${summary.totalServices} services) | ${response.data.package.name}: ${serviceCount}x`,
              'success'
            );
          } else {
            showNotification(
              `Appointment completed! You earned RM${totalEarnings.toFixed(2)} (Appointment: RM${appointmentEarnings.toFixed(2)}${productCommission > 0 ? ` + Products: RM${productCommission.toFixed(2)}` : ''})`,
              'success'
            );
          }
        } catch (error) {
          showNotification(
            `Appointment completed! You earned RM${totalEarnings.toFixed(2)} (Appointment: RM${appointmentEarnings.toFixed(2)}${productCommission > 0 ? ` + Products: RM${productCommission.toFixed(2)}` : ''})`,
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

    // Apply staff filter
    if (staffFilter !== 'all') {
      if (staffFilter === 'unassigned') {
        filtered = filtered.filter(appointment => !appointment.barber || appointment.barber === null);
      } else {
        filtered = filtered.filter(appointment => appointment.barber && appointment.barber.id.toString() === staffFilter);
      }
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date(today);
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          const todayEnd = new Date(filterDate);
          todayEnd.setHours(23, 59, 59, 999);
          filtered = filtered.filter(appointment => {
            if (!appointment.appointmentDate) return false;
            const appointmentDate = new Date(appointment.appointmentDate);
            return appointmentDate >= filterDate && appointmentDate <= todayEnd;
          });
          break;
        case 'yesterday':
          filterDate.setDate(today.getDate() - 1);
          filterDate.setHours(0, 0, 0, 0);
          const yesterdayEnd = new Date(filterDate);
          yesterdayEnd.setHours(23, 59, 59, 999);
          filtered = filtered.filter(appointment => {
            if (!appointment.appointmentDate) return false;
            const appointmentDate = new Date(appointment.appointmentDate);
            return appointmentDate >= filterDate && appointmentDate <= yesterdayEnd;
          });
          break;
        case 'this_week':
          const dayOfWeek = today.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStart = new Date(today.getTime() - daysToMonday * 24 * 60 * 60 * 1000);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(today);
          weekEnd.setHours(23, 59, 59, 999);
          filtered = filtered.filter(appointment => {
            if (!appointment.appointmentDate) return false;
            const appointmentDate = new Date(appointment.appointmentDate);
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
          });
          break;
        case 'this_month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(today);
          monthEnd.setHours(23, 59, 59, 999);
          filtered = filtered.filter(appointment => {
            if (!appointment.appointmentDate) return false;
            const appointmentDate = new Date(appointment.appointmentDate);
            return appointmentDate >= monthStart && appointmentDate <= monthEnd;
          });
          break;
        default:
          // For custom date (specific date), expect dateFilter to be in YYYY-MM-DD format
          if (dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const customDate = new Date(dateFilter);
            customDate.setHours(0, 0, 0, 0);
            const customDateEnd = new Date(customDate);
            customDateEnd.setHours(23, 59, 59, 999);
            filtered = filtered.filter(appointment => {
              if (!appointment.appointmentDate) return false;
              const appointmentDate = new Date(appointment.appointmentDate);
              return appointmentDate >= customDate && appointmentDate <= customDateEnd;
            });
          }
      }
    }

    return filtered;
  }, [appointments, searchTerm, statusFilter, staffFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, staffFilter, dateFilter]);

  const getStatusCounts = () => {
    return {
      pending: appointments.filter(apt => apt.status === 'pending').length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length
    };
  };

  const statusCounts = getStatusCounts();
  
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
  
  const totalRevenue = appointments
    .filter(apt => apt.status === 'completed')
    .reduce((total, apt) => total + getAppointmentTotalPrice(apt), 0);

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
                    In Progress
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
                    {statusCounts.pending + statusCounts.confirmed}
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
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>

                {/* Staff Filter */}
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 150 },
                    maxWidth: { xs: '100%', sm: 200 }
                  }}
                >
                  <InputLabel>Staff Filter</InputLabel>
                  <Select
                    value={staffFilter}
                    label="Staff Filter"
                    onChange={(e) => setStaffFilter(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: 1.5, sm: 2 },
                      }
                    }}
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
                    minWidth: { xs: '100%', sm: 150 },
                    maxWidth: { xs: '100%', sm: 200 }
                  }}
                >
                  <InputLabel>Date Filter</InputLabel>
                  <Select
                    value={dateFilter}
                    label="Date Filter"
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: 1.5, sm: 2 },
                      }
                    }}
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
                    label="Select Date"
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter(e.target.value); // Set the actual date as the filter value
                    }}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ 
                      minWidth: { xs: '100%', sm: 150 },
                      maxWidth: { xs: '100%', sm: 200 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: 1.5, sm: 2 },
                      }
                    }}
                  />
                )}
                
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
                {paginatedAppointments.map((appointment, index) => (
                  <Grid item xs={12} key={appointment.id}>
                    <AppointmentCard
                      appointment={appointment}
                      onMenuClick={handleMenuClick}
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
                      <TableCell><strong>#</strong></TableCell>
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
                    {paginatedAppointments.map((appointment, index) => (
                      <TableRow key={appointment.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {startIndex + index + 1}
                          </Typography>
                        </TableCell>
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
                          <Box>
                            {getAppointmentServices(appointment).map((service, index) => (
                              <Typography 
                                key={index}
                                variant="body2" 
                                fontWeight={index === 0 ? 500 : 400}
                                color={index === 0 ? 'text.primary' : 'text.secondary'}
                                sx={{ 
                                  fontSize: index === 0 ? '0.875rem' : '0.75rem',
                                  lineHeight: 1.2
                                }}
                              >
                                {index === 0 ? service : `+ ${service}`}
                              </Typography>
                            ))}
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
                          <Box>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              RM{getAppointmentTotalPrice(appointment).toFixed(2)}
                            </Typography>
                            {appointment.productSales && appointment.productSales.length > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Service: RM{(appointment.finalPrice || appointment.package.price).toFixed(2)} + Products: RM{appointment.productSales.reduce((sum, sale) => sum + sale.totalPrice, 0).toFixed(2)}
                              </Typography>
                            )}
                          </Box>
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
                            {appointment.appointmentDate ? formatDate(appointment.appointmentDate) : formatDate(appointment.createdAt)}
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
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} appointments
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
        >
          {/* Generate Invoice - Available for completed appointments */}
          {selectedAppointment?.status === 'completed' && (
            <MenuItem onClick={handleGenerateInvoice}>
              <ReceiptIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Generate Invoice
            </MenuItem>
          )}
          {/* Edit Appointment - Boss and Staff can edit, but not when status is pending */}
          {(userRole === 'Boss' || userRole === 'Staff') && selectedAppointment?.status !== 'pending' && (
            <MenuItem onClick={() => handleEditAppointment(selectedAppointment!)}>
              Edit 
            </MenuItem>
          )}
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
          {(selectedAppointment?.status === 'pending' || selectedAppointment?.status === 'confirmed') && (
            <MenuItem onClick={() => handleStatusUpdate('completed')}>
              Mark as Completed
            </MenuItem>
          )}
          {selectedAppointment?.status !== 'cancelled' && selectedAppointment?.status !== 'completed' && (
            <MenuItem onClick={() => handleStatusUpdate('cancelled')} sx={{ color: 'error.main' }}>
              Cancel
            </MenuItem>
          )}
          {/* Boss can delete any appointment */}
          {userRole === 'Boss' && (
            <MenuItem onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1, fontSize: '1rem' }} />
              Delete 
            </MenuItem>
          )}
        </Menu>


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
              {selectedAppointment && `${selectedAppointment.client.fullName} - ${getAppointmentServices(selectedAppointment).join(', ')}`}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 1, sm: 3 },
            overflow: 'auto',
            maxHeight: { xs: '70vh', sm: '65vh' }
          }}>
            <Stack spacing={3.5} sx={{ mt: 0.5 }}>
              {/* Base Package Price Selection (if variable pricing) */}
              {selectedAppointment && selectedAppointment.package.hasVariablePricing && selectedAppointment.package.priceOptions && selectedAppointment.package.priceOptions.length > 0 && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.50', 
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                    Select {selectedAppointment.package.name} Price
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>Choose Price Option *</InputLabel>
                    <Select
                      value={selectedPriceOption || ''}
                      onChange={(e) => setSelectedPriceOption(e.target.value as number)}
                      label="Choose Price Option *"
                      required
                    >
                      {selectedAppointment.package.priceOptions.map((option, index) => (
                        <MenuItem key={index} value={option.price}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography>{option.label}</Typography>
                            <Typography color="success.main" fontWeight={600}>
                              RM{option.price}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    * Required: Select the appropriate price based on the service provided
                  </Typography>
                </Box>
              )}
              
              {/* Services Section - 3 Columns Layout */}
              <Box sx={{ ml: { xs: 0, md: -1 } }}>
                <Grid container spacing={2} sx={{ justifyContent: 'flex-start' }}>
                {/* Additional Packages */}
                <Grid item xs={12} md={4}>
                  <Box>
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

                {/* Products */}
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
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
                            if (product && !selectedProducts.find(sp => sp.productId === productId)) {
                              setSelectedProducts([...selectedProducts, { productId, quantity: 1 }]);
                            }
                          }
                        }}
                        label="Select Product"
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
                              <Typography color="success.main" fontWeight={600}>
                                RM{product.price}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {selectedProducts.map((sp, index) => {
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
                                  const updated = [...selectedProducts];
                                  updated[index].quantity = Math.max(1, qty);
                                  setSelectedProducts(updated);
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
                                  setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
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
                </Grid>

                {/* Multiple Discount Codes */}
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      Discount Codes (Optional)
                    </Typography>
                    {/* Add New Discount Code */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        label="Enter Discount Code"
                        value={currentDiscountCode}
                        onChange={(e) => setCurrentDiscountCode(e.target.value.toUpperCase())}
                        placeholder="e.g., SUMMER20"
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <GradientButton
                        variant="blue"
                        onClick={addDiscountCode}
                        disabled={!currentDiscountCode.trim() || validatingCurrentDiscount || currentDiscountPackages.length === 0}
                        sx={{ px: 2, py: 1, fontSize: 12, minWidth: 'auto' }}
                      >
                        {validatingCurrentDiscount ? 'Checking...' : 'Add'}
                      </GradientButton>
                    </Box>

                    {/* Package Selection for Current Discount */}
                    {currentDiscountCode.trim() && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Select packages for &quot;{currentDiscountCode}&quot;:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {/* Base Package */}
                          {selectedAppointment && (
                            <Chip
                              label={`${selectedAppointment.package.name} (RM${selectedAppointment.package.price})`}
                              variant={currentDiscountPackages.includes(selectedAppointment.packageId) ? "filled" : "outlined"}
                              color={currentDiscountPackages.includes(selectedAppointment.packageId) ? "primary" : "default"}
                              onClick={() => {
                                const packageId = selectedAppointment.packageId;
                                setCurrentDiscountPackages(prev => 
                                  prev.includes(packageId) 
                                    ? prev.filter(id => id !== packageId)
                                    : [...prev, packageId]
                                );
                              }}
                              sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                            />
                          )}
                          
                          {/* Additional Packages */}
                          {selectedAdditionalPackages.map(packageId => {
                            const pkg = packages.find(p => p.id === packageId);
                            if (!pkg) return null;
                            return (
                              <Chip
                                key={packageId}
                                label={`${pkg.name} (RM${pkg.price})`}
                                variant={currentDiscountPackages.includes(packageId) ? "filled" : "outlined"}
                                color={currentDiscountPackages.includes(packageId) ? "primary" : "default"}
                                onClick={() => {
                                  setCurrentDiscountPackages(prev => 
                                    prev.includes(packageId) 
                                      ? prev.filter(id => id !== packageId)
                                      : [...prev, packageId]
                                  );
                                }}
                                sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                              />
                            );
                          })}
                          
                          {/* Custom Packages */}
                          {customPackages.map((pkg, index) => (
                            <Chip
                              key={`custom-${index}`}
                              label={`${pkg.name} (RM${pkg.price})`}
                              variant={currentDiscountPackages.includes(index) ? "filled" : "outlined"}
                              color={currentDiscountPackages.includes(index) ? "primary" : "default"}
                              onClick={() => {
                                setCurrentDiscountPackages(prev => 
                                  prev.includes(index) 
                                    ? prev.filter(id => id !== index)
                                    : [...prev, index]
                                );
                              }}
                              sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Applied Discount Codes */}
                    {multipleDiscountCodes.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Applied Discount Codes:
                        </Typography>
                        <Stack spacing={1}>
                          {multipleDiscountCodes.map((discount, index) => (
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
                                    label={discount.discountType === 'fixed_amount' 
                                      ? `RM${discount.discountAmount} OFF` 
                                      : `${discount.discountPercent}% OFF`}
                                    size="small"
                                    color="success"
                                    variant="filled"
                                  />
                                </Box>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => removeDiscountCode(discount.code)}
                                  sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                                >
                                  Remove
                                </Button>
                              </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {discount.appliedToPackages.map(packageId => {
                                  let packageName = '';
                                  let packagePrice = 0;
                                  
                                  if (selectedAppointment && packageId === selectedAppointment.packageId) {
                                    packageName = selectedAppointment.package.name;
                                    packagePrice = selectedAppointment.package.price;
                                  } else {
                                    const pkg = packages.find(p => p.id === packageId);
                                    if (pkg) {
                                      packageName = pkg.name;
                                      packagePrice = pkg.price;
                                    } else {
                                      // Check custom packages by index
                                      const customPkg = customPackages[packageId];
                                      if (customPkg) {
                                        packageName = customPkg.name;
                                        packagePrice = customPkg.price;
                                      }
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
                              💰 Total Discount
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="success.dark">
                              RM{(calculateTotalPrice() - calculateMultipleDiscountsTotal()).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
              </Box>

              {/* Custom Packages - Compact Layout */}
              <Box sx={{ ml: { xs: 0, md: -1 } }}>
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
                  
                  {selectedProducts.map((sp, index) => {
                    const product = retailProducts.find(p => p.id === sp.productId);
                    if (!product) return null;
                    const productTotal = product.price * sp.quantity;
                    return (
                      <Box key={sp.productId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          + {product.name} (x{sp.quantity})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          RM{productTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    );
                  })}
                  
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
                      RM{calculateTotalPrice().toFixed(2)}
                    </Typography>
                  </Box>
                  
                  {/* Product Commission - Staff Earnings */}
                  {selectedProducts.length > 0 && (() => {
                    const productTotal = selectedProducts.reduce((sum, sp) => {
                      const product = retailProducts.find(p => p.id === sp.productId);
                      return sum + (product ? product.price * sp.quantity : 0);
                    }, 0);
                    // Use barber's productCommissionRate if available, otherwise default to 5%
                    const commissionRate = (selectedAppointment?.barber as any)?.productCommissionRate ?? 5.0;
                    const commission = productTotal * (commissionRate / 100);
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Staff Commission ({commissionRate}% of products):
                        </Typography>
                        <Typography variant="body2" color="info.main" fontWeight={600}>
                          RM{commission.toFixed(2)}
                        </Typography>
                      </Box>
                    );
                  })()}
                  
                  {/* Multiple Discount Codes Display */}
                  {multipleDiscountCodes.length > 0 && (
                    <Box>
                      {multipleDiscountCodes.map((discount, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            {discount.code} ({discount.discountType === 'fixed_amount' 
                              ? `RM${discount.discountAmount}` 
                              : `${discount.discountPercent}%`}):
                          </Typography>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
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
                                  if (customPkg) {
                                    discountableAmount += customPkg.price;
                                  }
                                }
                              });
                              // Calculate discount amount based on discount type
                              if (discount.discountType === 'fixed_amount') {
                                return Math.min(discount.discountAmount || 0, discountableAmount).toFixed(2);
                              } else {
                                return ((discountableAmount * (discount.discountPercent || 0)) / 100).toFixed(2);
                              }
                            })()}
                          </Typography>
                        </Box>
                      ))}
                      
                      {/* Total Discount Summary */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'grey.300' }}>
                        <Typography variant="body1" color="success.main" fontWeight={700}>
                          Total Discount ({multipleDiscountCodes.length} codes):
                        </Typography>
                        <Typography variant="body1" color="success.main" fontWeight={700}>
                          -RM{(calculateTotalPrice() - calculateMultipleDiscountsTotal()).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Legacy Single Discount Display */}
                  {discountInfo && multipleDiscountCodes.length === 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        Discount ({discountInfo.discountType === 'fixed_amount' 
                          ? `RM${discountInfo.discountAmount}` 
                          : `${discountInfo.discountPercent}%`}):
                      </Typography>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        -RM{(calculateTotalPrice() - calculateDiscountedPrice()).toFixed(2)}
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
              {/* Client Selection with Search and Quick Add */}
              <Autocomplete
                fullWidth
                freeSolo
                options={clients}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.fullName} - ${option.clientId} - ${option.phoneNumber}`;
                }}
                value={clients.find(c => c.id === newAppointment.clientId) || null}
                inputValue={newClientPhoneNumber}
                onInputChange={(event, newInputValue) => {
                  setNewClientPhoneNumber(newInputValue);
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    // Store the phone number for later registration
                    setNewClientPhoneNumber(newValue.trim());
                    setNewAppointment({...newAppointment, clientId: ''});
                  } else if (newValue) {
                    // User selected existing client
                    setNewAppointment({...newAppointment, clientId: newValue.id});
                    setNewClientPhoneNumber('');
                  } else {
                    setNewAppointment({...newAppointment, clientId: ''});
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select or Add Client"
                    placeholder="Search or type phone number (01XXXXXXXX)..."
                    helperText="Type a phone number to register a new client, or select existing"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography fontWeight={500}>{option.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.clientId} • Phone: {option.phoneNumber}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />

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

              {/* Barber Selection - Only for Boss */}
              {userRole === 'Boss' && (
                <FormControl fullWidth>
                  <InputLabel>Assign Barber (Optional)</InputLabel>
                  <Select
                    value={newAppointment.barberId}
                    onChange={(e) => setNewAppointment({...newAppointment, barberId: e.target.value})}
                    label="Assign Barber (Optional)"
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
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Additional Packages (Optional)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {packages.filter(pkg => pkg.id !== parseInt(newAppointment.packageId)).map((pkg) => (
                    <Chip
                      key={pkg.id}
                      label={`${pkg.name} - RM${pkg.price}`}
                      variant={newAdditionalPackages.includes(pkg.id) ? "filled" : "outlined"}
                      color={newAdditionalPackages.includes(pkg.id) ? "primary" : "default"}
                      onClick={() => {
                        if (newAdditionalPackages.includes(pkg.id)) {
                          setNewAdditionalPackages(newAdditionalPackages.filter(id => id !== pkg.id));
                        } else {
                          setNewAdditionalPackages([...newAdditionalPackages, pkg.id]);
                        }
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
                {newAdditionalPackages.length > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
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
          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 }, 
            gap: { xs: 1.5, sm: 2 },
            flexDirection: 'row'
          }}>
            <GradientButton
              variant="blue"
              animated
              onClick={() => {
                setCreateAppointmentOpen(false);
                setNewAdditionalPackages([]);
              }}
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
              disabled={(!newAppointment.clientId && !newClientPhoneNumber) || !newAppointment.packageId}
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
                {selectedAppointment.client.fullName} - {getAppointmentServices(selectedAppointment).join(', ')}
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

        {/* Edit Appointment Dialog */}
        <Dialog 
          open={editAppointmentOpen} 
          onClose={() => setEditAppointmentOpen(false)} 
          maxWidth="md" 
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 1, sm: 2 },
              borderRadius: { xs: 2, sm: 2 },
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
              Edit Appointment
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: { xs: 1, sm: 2 },
            overflow: 'auto',
            maxHeight: { xs: '70vh', sm: '65vh' }
          }}>
            {editingAppointment && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                {/* Client Selection with Search and Quick Add */}
                <Autocomplete
                  fullWidth
                  freeSolo
                  options={clients}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return `${option.fullName} - ${option.clientId} - ${option.phoneNumber}`;
                  }}
                  value={clients.find(c => c.id === editingAppointment.clientId) || null}
                  inputValue={editClientPhoneNumber}
                  onInputChange={(event, newInputValue) => {
                    setEditClientPhoneNumber(newInputValue);
                  }}
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                      // Store the phone number for later registration
                      setEditClientPhoneNumber(newValue.trim());
                      setEditingAppointment({...editingAppointment, clientId: ''});
                    } else if (newValue) {
                      // User selected existing client
                      setEditingAppointment({...editingAppointment, clientId: newValue.id});
                      setEditClientPhoneNumber('');
                    } else {
                      setEditingAppointment({...editingAppointment, clientId: ''});
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select or Add Client"
                      placeholder="Search or type phone number (01XXXXXXXX)..."
                      helperText="Type a phone number to register a new client, or select existing"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Typography fontWeight={500}>{option.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {option.clientId} • Phone: {option.phoneNumber}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
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

                {/* Appointment Date */}
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
                    <GradientButton
                      variant="blue"
                      onClick={addEditDiscountCode}
                      disabled={!editCurrentDiscountCode.trim() || editValidatingCurrentDiscount || editCurrentDiscountPackages.length === 0}
                      sx={{ px: 2, py: 1, fontSize: 12, minWidth: 'auto' }}
                    >
                      {editValidatingCurrentDiscount ? 'Checking...' : 'Add'}
                    </GradientButton>
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
                            💰 Total Discount
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
                    💰 Price Summary
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
                    
                    {/* Product Commission - Staff Earnings */}
                    {editSelectedProducts.length > 0 && (() => {
                      const productTotal = editSelectedProducts.reduce((sum, sp) => {
                        const product = retailProducts.find(p => p.id === sp.productId);
                        return sum + (product ? product.price * sp.quantity : 0);
                      }, 0);
                      // Use barber's productCommissionRate if available, otherwise default to 5%
                      const commissionRate = (editingAppointment?.barber as any)?.productCommissionRate ?? 5.0;
                      const commission = productTotal * (commissionRate / 100);
                      return (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Staff Commission ({commissionRate}% of products):
                          </Typography>
                          <Typography variant="body2" color="info.main" fontWeight={600}>
                            RM{commission.toFixed(2)}
                          </Typography>
                        </Box>
                      );
                    })()}
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
          <DialogActions sx={{ 
            p: { xs: 2, sm: 3 }, 
            gap: { xs: 1.5, sm: 2 },
            flexDirection: 'row'
          }}>
            <GradientButton
              variant="blue"
              animated
              onClick={() => {
                setEditAppointmentOpen(false);
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
              onClick={handleUpdateAppointment}
              disabled={(!editingAppointment?.clientId && !editClientPhoneNumber) || !editingAppointment?.packageId}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              Update Appointment
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
