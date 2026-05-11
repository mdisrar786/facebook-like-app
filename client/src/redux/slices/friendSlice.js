import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

export const sendFriendRequest = createAsyncThunk(
  'friends/sendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/friends/request/${userId}`, {}, {
        headers: { 'x-auth-token': getToken() }
      });
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptRequest',
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${API_URL}/friends/accept/${userId}`, {}, {
        headers: { 'x-auth-token': getToken() }
      });
      // Refresh friend list after accepting
      await dispatch(getFriends());
      await dispatch(getFriendRequests());
      return { userId, friend: response.data.friend };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectRequest',
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.post(`${API_URL}/friends/reject/${userId}`, {}, {
        headers: { 'x-auth-token': getToken() }
      });
      await dispatch(getFriendRequests());
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getFriendRequests = createAsyncThunk(
  'friends/getRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/friends/requests`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getFriends = createAsyncThunk(
  'friends/getFriends',
  async (userId, { rejectWithValue }) => {
    try {
      const url = userId ? `${API_URL}/friends/list/${userId}` : `${API_URL}/friends/list`;
      const response = await axios.get(url, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const unfriend = createAsyncThunk(
  'friends/unfriend',
  async (userId, { rejectWithValue, dispatch }) => {
    try {
      const response = await axios.delete(`${API_URL}/friends/unfriend/${userId}`, {
        headers: { 'x-auth-token': getToken() }
      });
      await dispatch(getFriends());
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const friendSlice = createSlice({
  name: 'friends',
  initialState: {
    friendRequests: [],
    friends: [],
    isLoading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addFriend: (state, action) => {
      if (!state.friends.some(f => f._id === action.payload._id)) {
        state.friends.push(action.payload);
      }
    },
    removeFriend: (state, action) => {
      state.friends = state.friends.filter(f => f._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getFriendRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFriendRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friendRequests = action.payload;
      })
      .addCase(getFriendRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getFriends.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friends = action.payload;
      })
      .addCase(getFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        // Remove from friend requests
        state.friendRequests = state.friendRequests.filter(
          req => req.from?._id !== action.payload.userId && req.from !== action.payload.userId
        );
        // Add to friends if friend data is available
        if (action.payload.friend) {
          if (!state.friends.some(f => f._id === action.payload.friend._id)) {
            state.friends.push(action.payload.friend);
          }
        }
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.friendRequests = state.friendRequests.filter(
          req => req.from?._id !== action.payload.userId && req.from !== action.payload.userId
        );
      })
      .addCase(unfriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(f => f._id !== action.payload.userId);
      });
  }
});

export const { clearError, addFriend, removeFriend } = friendSlice.actions;
export default friendSlice.reducer;