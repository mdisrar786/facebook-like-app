// src/redux/slices/postSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

// Fetch feed posts
export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/posts/feed?page=${page}&limit=${limit}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch user posts (for profile page)
export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/posts/user/${userId}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return { userId, posts: response.data.posts };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create new post
export const createPost = createAsyncThunk(
  'posts/createPost',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/posts`, formData, {
        headers: { 
          'x-auth-token': getToken(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update existing post
export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/posts/${postId}`, formData, {
        headers: { 
          'x-auth-token': getToken(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete post
export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return postId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Like/Unlike post
export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/like`, {}, {
        headers: { 'x-auth-token': getToken() }
      });
      return { postId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add comment to post
export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comment`, { text }, {
        headers: { 'x-auth-token': getToken() }
      });
      return { postId, comments: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Edit comment
export const editComment = createAsyncThunk(
  'posts/editComment',
  async ({ postId, commentId, text }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/posts/${postId}/comment/${commentId}`, { text }, {
        headers: { 'x-auth-token': getToken() }
      });
      return { postId, comments: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete comment
export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/posts/${postId}/comment/${commentId}`, {
        headers: { 'x-auth-token': getToken() }
      });
      return { postId, comments: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Save/Unsave post
export const savePost = createAsyncThunk(
  'posts/savePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/save`, {}, {
        headers: { 'x-auth-token': getToken() }
      });
      return { postId, saved: response.data.saved };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch saved posts
export const fetchSavedPosts = createAsyncThunk(
  'posts/fetchSavedPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/posts/saved`, {
        headers: { 'x-auth-token': getToken() }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    savedPosts: [],
    userPosts: [], // Add this for user specific posts
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    isLoading: false,
    error: null
  },
  reducers: {
    clearPosts: (state) => {
      state.posts = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
    clearUserPosts: (state) => {
      state.userPosts = [];
    },
    updatePostInList: (state, action) => {
      const index = state.posts.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      const userPostIndex = state.userPosts.findIndex(p => p._id === action.payload._id);
      if (userPostIndex !== -1) {
        state.userPosts[userPostIndex] = action.payload;
      }
    },
    removePostFromList: (state, action) => {
      state.posts = state.posts.filter(p => p._id !== action.payload);
      state.userPosts = state.userPosts.filter(p => p._id !== action.payload);
    },
    clearSavedPosts: (state) => {
      state.savedPosts = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Feed
      .addCase(fetchFeed.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.currentPage === 1) {
          state.posts = action.payload.posts;
        } else {
          state.posts = [...state.posts, ...action.payload.posts];
        }
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.hasMore = action.payload.currentPage < action.payload.totalPages;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch posts';
      })
      
      // Fetch User Posts (for profile)
      .addCase(fetchUserPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userPosts = action.payload.posts;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch user posts';
      })
      
      // Create Post
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts = [action.payload, ...state.posts];
        state.userPosts = [action.payload, ...state.userPosts];
      })
      
      // Update Post
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        const userPostIndex = state.userPosts.findIndex(p => p._id === action.payload._id);
        if (userPostIndex !== -1) {
          state.userPosts[userPostIndex] = action.payload;
        }
        const savedIndex = state.savedPosts.findIndex(p => p._id === action.payload._id);
        if (savedIndex !== -1) {
          state.savedPosts[savedIndex] = action.payload;
        }
      })
      
      // Delete Post
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter(p => p._id !== action.payload);
        state.userPosts = state.userPosts.filter(p => p._id !== action.payload);
        state.savedPosts = state.savedPosts.filter(p => p._id !== action.payload);
      })
      
      // Like Post
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          if (action.payload.liked) {
            if (!post.likes.includes(action.meta.arg)) {
              post.likes.push(action.meta.arg);
            }
          } else {
            post.likes = post.likes.filter(id => id !== action.meta.arg);
          }
        }
        // Update in userPosts
        const userPost = state.userPosts.find(p => p._id === action.payload.postId);
        if (userPost) {
          if (action.payload.liked) {
            if (!userPost.likes.includes(action.meta.arg)) {
              userPost.likes.push(action.meta.arg);
            }
          } else {
            userPost.likes = userPost.likes.filter(id => id !== action.meta.arg);
          }
        }
        // Also update in saved posts
        const savedPost = state.savedPosts.find(p => p._id === action.payload.postId);
        if (savedPost) {
          if (action.payload.liked) {
            if (!savedPost.likes.includes(action.meta.arg)) {
              savedPost.likes.push(action.meta.arg);
            }
          } else {
            savedPost.likes = savedPost.likes.filter(id => id !== action.meta.arg);
          }
        }
      })
      
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.comments = action.payload.comments;
        }
        const userPost = state.userPosts.find(p => p._id === action.payload.postId);
        if (userPost) {
          userPost.comments = action.payload.comments;
        }
        const savedPost = state.savedPosts.find(p => p._id === action.payload.postId);
        if (savedPost) {
          savedPost.comments = action.payload.comments;
        }
      })
      
      // Edit Comment
      .addCase(editComment.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.comments = action.payload.comments;
        }
        const userPost = state.userPosts.find(p => p._id === action.payload.postId);
        if (userPost) {
          userPost.comments = action.payload.comments;
        }
        const savedPost = state.savedPosts.find(p => p._id === action.payload.postId);
        if (savedPost) {
          savedPost.comments = action.payload.comments;
        }
      })
      
      // Delete Comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.comments = action.payload.comments;
        }
        const userPost = state.userPosts.find(p => p._id === action.payload.postId);
        if (userPost) {
          userPost.comments = action.payload.comments;
        }
        const savedPost = state.savedPosts.find(p => p._id === action.payload.postId);
        if (savedPost) {
          savedPost.comments = action.payload.comments;
        }
      })
      
      // Save Post
      .addCase(savePost.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) {
          post.isSaved = action.payload.saved;
        }
        const userPost = state.userPosts.find(p => p._id === action.payload.postId);
        if (userPost) {
          userPost.isSaved = action.payload.saved;
        }
      })
      
      // Fetch Saved Posts
      .addCase(fetchSavedPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedPosts = action.payload;
      })
      .addCase(fetchSavedPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to fetch saved posts';
      });
  }
});

export const { 
  clearPosts, 
  clearUserPosts,
  updatePostInList, 
  removePostFromList,
  clearSavedPosts 
} = postSlice.actions;

export default postSlice.reducer;