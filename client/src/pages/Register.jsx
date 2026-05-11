import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Avatar
} from '@mui/material';
import { register } from '../redux/slices/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordError('');
    const { confirmPassword, ...registerData } = formData;
    const result = await dispatch(register(registerData));
    if (!result.error) {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar sx={{ 
            width: 60, 
            height: 60, 
            bgcolor: '#1877f2', 
            margin: '0 auto',
            fontSize: 30
          }}>
            S
          </Avatar>
          <Typography variant="h4" sx={{ mt: 2, color: '#1877f2' }}>
            Join SocialHub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create an account to connect with friends
          </Typography>
        </Box>

        {(error || passwordError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError || (typeof error === 'string' ? error : error?.message)}
          </Alert>
        )}

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
            required
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            required
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, bgcolor: '#1877f2' }}
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <Typography align="center">
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1877f2', textDecoration: 'none' }}>
            Log In
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Register;