import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

export const searchUsers = createAsyncThunk(
  'users/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/search?q=${query}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const userId = auth.user?._id || auth.user?.id;
      
      if (!userId) {
        return rejectWithValue('User ID not found');
      }
      
      // Only send fields that are provided
      const updateData = {};
      if (userData.name && userData.name.trim()) updateData.name = userData.name.trim();
      if (userData.bio !== undefined) updateData.bio = userData.bio;
      if (userData.profilePicture) updateData.profilePicture = userData.profilePicture;
      if (userData.coverPhoto) updateData.coverPhoto = userData.coverPhoto;
      
      const response = await axios.put(`${API_URL}/users/${userId}`, updateData, {
        headers: { 'x-auth-token': getToken() }
      });
      
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'users/getProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    currentProfile: null,
    searchResults: [],
    suggestions: [],
    isLoading: false,
    error: null
  },
  reducers: {
    setCurrentProfile: (state, action) => {
      state.currentProfile = action.payload;
    },
    clearSearch: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentProfile && state.currentProfile._id === action.payload._id) {
          state.currentProfile = { ...state.currentProfile, ...action.payload };
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProfile = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setCurrentProfile, clearSearch, clearError } = userSlice.actions;
export default userSlice.reducer;