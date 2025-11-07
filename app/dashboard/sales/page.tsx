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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Divider,
  Stack
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiGet, apiPost, apiDelete } from '../../../src/utils/axios';
import GradientButton from '../../../components/GradientButton';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
}

interface Client {
  id: number;
  clientId: string;
  fullName: string;
  phoneNumber: string;
}

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ProductSale {
  id: number;
  product: Product;
  client?: Client;
  staff: Staff;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commissionAmount: number;
  createdAt: string;
}

export default function SalesPage() {
  const { userRole } = useUserRole();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [products, setProducts] = React.useState<Product[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [sales, setSales] = React.useState<ProductSale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [saleToDelete, setSaleToDelete] = React.useState<ProductSale | null>(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deletingSaleId, setDeletingSaleId] = React.useState<number | null>(null);

  // Form state
  const [selectedProductId, setSelectedProductId] = React.useState<number | ''>('');
  const [selectedClientId, setSelectedClientId] = React.useState<number | ''>('');
  const [selectedStaffId, setSelectedStaffId] = React.useState<number | ''>('');
  const [quantity, setQuantity] = React.useState('1');
  const [notes, setNotes] = React.useState('');
  const [selling, setSelling] = React.useState(false);

  React.useEffect(() => {
    if (userRole === 'Boss' || userRole === 'Staff') {
      fetchProducts();
      fetchClients();
      fetchStaff();
      fetchSales();
    }
  }, [userRole]);

  const fetchProducts = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Product[] }>('/products?activeOnly=true');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Client[] }>('/clients');
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await apiGet<{ success: boolean; data: Staff[] }>('/staff');
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await apiGet<{ success: boolean; data: ProductSale[] }>('/products/sales/all');
      setSales(response.data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenSellDialog = () => {
    setSellDialogOpen(true);
    setSelectedProductId('');
    setSelectedClientId('');
    setSelectedStaffId('');
    setQuantity('1');
    setNotes('');
  };

  const handleCloseSellDialog = () => {
    setSellDialogOpen(false);
    setSelectedProductId('');
    setSelectedClientId('');
    setSelectedStaffId('');
    setQuantity('1');
    setNotes('');
  };

  const handleSellProduct = async () => {
    if (!selectedProductId || !quantity) {
      showNotification('Please select a product and enter quantity', 'error');
      return;
    }

    if (!selectedStaffId) {
      showNotification('Please select a barber/staff member', 'error');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      showNotification('Please enter a valid quantity', 'error');
      return;
    }

    setSelling(true);
    try {
      const saleData: any = {
        productId: selectedProductId,
        quantity: qty,
        staffId: selectedStaffId, // Assign to selected staff
        commissionRate: 5.0 // 5% commission
      };

      if (selectedClientId) {
        saleData.clientId = selectedClientId;
      }

      if (notes) {
        saleData.notes = notes;
      }

      await apiPost('/products/sell', saleData);
      
      showNotification('Product sold successfully!', 'success');
      handleCloseSellDialog();
      fetchSales();
      fetchProducts(); // Refresh to update stock
    } catch (error: any) {
      console.error('Error selling product:', error);
      const errorMessage = error?.message || error?.error || 'Failed to sell product. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setSelling(false);
    }
  };

  const handleDeleteClick = (sale: ProductSale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;

    setDeletingSaleId(saleToDelete.id);
    try {
      await apiDelete(`/products/sales/${saleToDelete.id}`);
      showNotification('Sale deleted successfully! Related appointments have been updated.', 'success');
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
      fetchSales();
      fetchProducts(); // Refresh to update stock
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      const errorMessage = error?.message || error?.error || 'Failed to delete sale. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setDeletingSaleId(null);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalPrice = selectedProduct && quantity ? selectedProduct.price * parseInt(quantity) : 0;
  const commission = totalPrice * 0.05; // 5% commission

  if (userRole !== 'Boss' && userRole !== 'Staff') {
    return (
      <DashboardLayout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            Only Boss and Staff can access this page.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

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
            Product Sales
          </Typography>
          <GradientButton
            variant="maroon"
            animated
            startIcon={<AddIcon />}
            onClick={handleOpenSellDialog}
            sx={{ 
              px: { xs: 2, sm: 3 }, 
              py: { xs: 1, sm: 1.2 }, 
              fontSize: { xs: 13, sm: 14 },
              width: { xs: '100%', sm: 'auto' },
              borderRadius: { xs: 3, sm: 4 }
            }}
          >
            Sell Product
          </GradientButton>
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
              {loading ? (
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  Loading sales...
                </Typography>
              ) : sales.length === 0 ? (
                <Typography variant="body1" textAlign="center" sx={{ py: 4 }}>
                  No sales yet. Start selling products!
                </Typography>
              ) : isMobile ? (
                // Mobile Card Layout
                <Stack spacing={2}>
                  {sales.slice(0, 20).map((sale) => (
                    <Card 
                      key={sale.id} 
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
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {sale.product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(sale.createdAt).toLocaleDateString('en-MY', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(sale)}
                          disabled={deletingSaleId === sale.id}
                          sx={{ ml: 1 }}
                        >
                          {deletingSaleId === sale.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Box>
                      
                      <Divider sx={{ my: 1.5 }} />
                      
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Client
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {sale.client ? sale.client.fullName : 'Walk-in'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Barber/Staff
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip 
                              label={sale.staff?.name || 'Unknown'} 
                              color="primary" 
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Quantity
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {sale.quantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Total Price
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            RM{sale.totalPrice.toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">
                            Commission
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip 
                              label={`RM ${sale.commissionAmount.toFixed(2)}`} 
                              color="success" 
                              size="small"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Stack>
            ) : (
                // Desktop Table Layout
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell><strong>Client</strong></TableCell>
                        <TableCell><strong>Barber/Staff</strong></TableCell>
                        <TableCell><strong>Quantity</strong></TableCell>
                        <TableCell align="right"><strong>Total Price</strong></TableCell>
                        <TableCell align="right"><strong>Commission</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sales.slice(0, 20).map((sale) => (
                        <TableRow key={sale.id} hover>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(sale.createdAt).toLocaleDateString('en-MY', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {sale.product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {sale.client ? sale.client.fullName : 'Walk-in'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={sale.staff?.name || 'Unknown'} 
                              color="primary" 
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {sale.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              RM{sale.totalPrice.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`RM ${sale.commissionAmount.toFixed(2)}`} 
                              color="success" 
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(sale)}
                              disabled={deletingSaleId === sale.id}
                            >
                              {deletingSaleId === sale.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
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

      {/* Sell Product Dialog */}
      <Dialog 
          open={sellDialogOpen} 
          onClose={handleCloseSellDialog} 
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
              Sell Product
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Product *</InputLabel>
                <Select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value as number)}
                  label="Product *"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - RM {product.price.toFixed(2)} 
                      {product.stock !== null && ` (Stock: ${product.stock})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Barber/Staff *</InputLabel>
                <Select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value as number)}
                  label="Barber/Staff *"
                  required
                >
                  {staff.filter(s => s.role === 'Boss' || s.role === 'Staff').map((staffMember) => (
                    <MenuItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.name} ({staffMember.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Client (Optional)</InputLabel>
                <Select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value as number)}
                  label="Client (Optional)"
                >
                  <MenuItem value="">
                    <em>Walk-in Customer</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.fullName} ({client.clientId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Quantity *"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                inputProps={{ min: 1 }}
              />

              {selectedProduct && quantity && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Unit Price: RM {selectedProduct.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Price: RM {totalPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold', mt: 1 }}>
                    Your Commission (5%): RM {commission.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <TextField
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
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
              onClick={handleCloseSellDialog}
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
              variant="maroon"
              animated
              onClick={handleSellProduct}
              disabled={selling || !selectedProductId || !quantity || !selectedStaffId}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              {selling ? <CircularProgress size={20} color="inherit" /> : 'Sell Product'}
            </GradientButton>
          </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
          open={deleteDialogOpen} 
          onClose={() => {
            setDeleteDialogOpen(false);
            setSaleToDelete(null);
          }} 
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
              Delete Product Sale
            </Typography>
            {saleToDelete && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Are you sure you want to delete this sale?
              </Typography>
            )}
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 }, overflow: 'auto' }}>
            {saleToDelete && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Sale Details:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Product:</strong> {saleToDelete.product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Client:</strong> {saleToDelete.client ? saleToDelete.client.fullName : 'Walk-in'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Barber/Staff:</strong> {saleToDelete.staff?.name || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Quantity:</strong> {saleToDelete.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total Price:</strong> RM{saleToDelete.totalPrice.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Commission:</strong> RM{saleToDelete.commissionAmount.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The product stock will be restored and related appointment prices will be updated.
            </Typography>
            <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 500 }}>
              ⚠️ This action cannot be undone.
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
              onClick={() => {
                setDeleteDialogOpen(false);
                setSaleToDelete(null);
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
              onClick={handleDeleteConfirm}
              disabled={deletingSaleId !== null}
              sx={{ 
                flex: 1,
                px: { xs: 2, sm: 3 }, 
                py: { xs: 1, sm: 1.2 }, 
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              {deletingSaleId !== null ? <CircularProgress size={20} color="inherit" /> : 'Delete Sale'}
            </GradientButton>
          </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

