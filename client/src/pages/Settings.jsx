import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Switch,
  Button,
  Box,
  TextField,
  Divider,
  Alert,
  Avatar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import { PhotoCamera, Save, CloudUpload, Delete } from '@mui/icons-material';
import { toggleTheme } from '../redux/slices/uiSlice';
import { updateUser } from '../redux/slices/userSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openCropDialog, setOpenCropDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(user?.profilePicture || '');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(file);
        setPreviewImage(event.target.result);
        setOpenCropDialog(true);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    try {
      // Create form data for image upload
      const formDataImg = new FormData();
      formDataImg.append('profilePicture', selectedImage);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${user?._id}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token
        },
        body: formDataImg
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile picture');
      }
      
      const updatedUser = await response.json();
      
      // Update local storage and redux state
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setFormData(prev => ({ ...prev, profilePicture: updatedUser.profilePicture }));
      setPreviewImage(updatedUser.profilePicture);
      setSuccess('Profile picture updated successfully!');
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to update profile picture');
    } finally {
      setLoading(false);
      setOpenCropDialog(false);
      setSelectedImage(null);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ profilePicture: 'https://via.placeholder.com/150' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove profile picture');
      }
      
      const updatedUser = await response.json();
      
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setFormData(prev => ({ ...prev, profilePicture: updatedUser.profilePicture }));
      setPreviewImage(updatedUser.profilePicture);
      setSuccess('Profile picture removed successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error removing image:', error);
      setError('Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || formData.name.trim() === '') {
      setError('Name cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    const result = await dispatch(updateUser(formData));
    if (!result.error) {
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      setError(result.payload || 'Failed to update profile');
      setTimeout(() => setError(''), 3000);
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>{success}</Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
      
      {/* Appearance Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Appearance</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>Dark Mode</Typography>
          <Switch checked={isDarkMode} onChange={() => dispatch(toggleTheme())} />
        </Box>
      </Paper>
      
      {/* Profile Settings */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Profile Settings</Typography>
        <Divider sx={{ mb: 3 }} />
        
        {/* Profile Picture Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>Profile Picture</Typography>
          
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={previewImage}
              sx={{ 
                width: 150, 
                height: 150, 
                border: '4px solid',
                borderColor: 'primary.main',
                boxShadow: 3
              }}
            >
              {formData.name?.charAt(0) || 'U'}
            </Avatar>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageSelect}
            />
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
              >
                Change Photo
              </Button>
              
              {previewImage && previewImage !== 'https://via.placeholder.com/150' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleRemoveImage}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
            </Box>
          </Box>
          
          <Typography variant="caption" color="text.secondary" align="center">
            Click to change profile picture.<br />
            Supported formats: JPG, PNG, GIF (Max 5MB)
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        {/* Profile Information Form */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            disabled
            helperText="Email cannot be changed"
          />
          
          <TextField
            fullWidth
            label="Bio"
            name="bio"
            multiline
            rows={3}
            value={formData.bio}
            onChange={handleChange}
            margin="normal"
            placeholder="Tell us about yourself"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
      
      {/* Crop/Preview Dialog */}
      <Dialog open={openCropDialog} onClose={() => setOpenCropDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Preview Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Avatar
              src={previewImage}
              sx={{ width: 200, height: 200, border: '2px solid', borderColor: 'primary.main' }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Your profile picture will be displayed as a circle
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCropDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveImage} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Picture'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;