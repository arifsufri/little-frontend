'use client';

import * as React from 'react';
import { Card, CardContent, Box, Typography, IconButton, Menu, MenuItem, Chip } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useUserRole } from '../../hooks/useUserRole';

export default function ProductCard({
  title,
  price,
  imageSrc,
  imageAlt,
  isActive = true,
  onClick,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  title: string;
  price: string;
  imageSrc?: string;
  imageAlt?: string;
  isActive?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}) {
  const { userRole } = useUserRole();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit?.();
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete?.();
  };

  const handleToggleStatus = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onToggleStatus?.();
  };
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      sx={{
        borderRadius: 3,
        border: `1px solid ${isActive ? '#d1d5db' : '#ef4444'}`,
        boxShadow: '0 8px 0 #0000000d, 0 12px 24px rgba(0,0,0,0.10)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 150ms ease, transform 150ms ease, outline-color 150ms ease, opacity 150ms ease',
        opacity: isActive ? 1 : 0.7,
        '&:hover': onClick ? { borderColor: '#ef4444' } : undefined,
        '&:focus-visible': onClick ? { outline: '2px solid #ef4444', outlineOffset: 2 } : undefined,
        '&:active': onClick ? { transform: 'translateY(1px)' } : undefined,
      }}
    >
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 'none',
          backgroundColor: '#fff',
        }}
      >
        <Box sx={{ width: '100%', height: { xs: 120, sm: 160 }, position: 'relative', backgroundColor: '#f3f4f6' }}>
          {imageSrc ? (
            <Box component="img" src={imageSrc} alt={imageAlt || title} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
              No image
            </Box>
          )}
          {/* Status Chip */}
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: isActive ? 'success.main' : 'error.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        </Box>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: { xs: 1.25, sm: 2 }, position: 'relative' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 18 } }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 18 } }}>
              {price}
            </Typography>
            {userRole === 'Boss' && (onEdit || onDelete || onToggleStatus) && (
              <IconButton
                size="small"
                onClick={handleMenuClick}
                sx={{ 
                  ml: 1,
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Menu for Boss actions */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: 120
          }
        }}
      >
        {onEdit && (
          <MenuItem onClick={handleEdit} sx={{ gap: 1.5, py: 1 }}>
            <EditIcon fontSize="small" />
            Edit
          </MenuItem>
        )}
        {onToggleStatus && (
          <MenuItem onClick={handleToggleStatus} sx={{ gap: 1.5, py: 1, color: isActive ? 'warning.main' : 'success.main' }}>
            {isActive ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            {isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ gap: 1.5, py: 1, color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
