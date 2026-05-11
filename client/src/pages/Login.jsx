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
import { login } from '../redux/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(formData));
    if (!result.error) {
      navigate('/');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
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
            SocialHub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect with friends and share your world
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof error === 'string' ? error : error.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, bgcolor: '#1877f2' }}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <Typography align="center">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1877f2', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Login;