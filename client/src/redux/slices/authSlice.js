import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const loadUserFromStorage = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const parsedUser = JSON.parse(user);
    // Ensure both id and _id are present
    return {
      ...parsedUser,
      id: parsedUser.id || parsedUser._id,
      _id: parsedUser._id || parsedUser.id
    };
  }
  return null;
};

const loadTokenFromStorage = () => {
  return localStorage.getItem('token');
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const userData = {
        ...response.data.user,
        id: response.data.user.id || response.data.user._id,
        _id: response.data.user._id || response.data.user.id
      };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      return { token: response.data.token, user: userData };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const userData = {
        ...response.data.user,
        id: response.data.user.id || response.data.user._id,
        _id: response.data.user._id || response.data.user.id
      };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      return { token: response.data.token, user: userData };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: loadUserFromStorage(),
    token: loadTokenFromStorage(),
    isLoading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      state.user = null;
      state.token = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserOnlineStatus: (state, action) => {
      if (state.user && state.user._id === action.payload.userId) {
        state.user.isOnline = action.payload.isOnline;
        const updatedUser = { ...state.user, isOnline: action.payload.isOnline };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      });
  }
});

export const { logout, clearError, updateUserOnlineStatus } = authSlice.actions;
export default authSlice.reducer;