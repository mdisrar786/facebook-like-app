import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import { PhotoCamera, Save } from '@mui/icons-material';
import { toggleTheme } from '../redux/slices/uiSlice';
import { updateUser } from '../redux/slices/userSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    email: user?.email || ''
  });
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateUser(formData));
    if (!result.error) {
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Appearance</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>Dark Mode</Typography>
          <Switch checked={isDarkMode} onChange={() => dispatch(toggleTheme())} />
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Profile Settings</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={user?.profilePicture} sx={{ width: 100, height: 100 }}>
              {user?.name?.charAt(0)}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'background.paper'
              }}
              size="small"
            >
              <PhotoCamera />
            </IconButton>
          </Box>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
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
          
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            sx={{ mt: 2 }}
          >
            Save Changes
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Settings;