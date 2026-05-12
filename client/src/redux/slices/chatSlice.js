import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ receiverId, message }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/chat/message`, 
        { receiverId, message }, 
        { headers: { 'x-auth-token': getToken() } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chat/messages/${userId}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return { userId, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getChatList = createAsyncThunk(
  'chat/getChatList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chat/list`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getUnreadMessageCount = createAsyncThunk(
  'chat/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chat/unread-count`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data.unreadCount;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    currentChat: null,
    messages: [],
    unreadCount: 0,
    isLoading: false,
    error: null
  },
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addNewMessage: (state, action) => {
      state.messages.push(action.payload);
      const chatIndex = state.chats.findIndex(c => c.user?._id === action.payload.senderId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = action.payload.message;
        state.chats[chatIndex].lastMessageTime = new Date();
        if (action.payload.receiverId === state.currentChat?.user?._id) {
          state.chats[chatIndex].unreadCount = (state.chats[chatIndex].unreadCount || 0) + 1;
          state.unreadCount++;
        }
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChatList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getChatList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
        // Calculate total unread count
        state.unreadCount = action.payload.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      })
      .addCase(getChatList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(getUnreadMessageCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  }
});

export const { setCurrentChat, addNewMessage, clearMessages, resetUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;