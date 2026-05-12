// src/redux/store.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postReducer from './slices/postSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';
import friendReducer from './slices/friendSlice';
import chatReducer from './slices/chatSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  posts: postReducer,
  users: userReducer,
  notifications: notificationReducer,
  ui: uiReducer,
  friends: friendReducer,
  chat: chatReducer
});

// Custom middleware for logging (only in development)
const loggerMiddleware = (store) => (next) => (action) => {
  if (import.meta.env.DEV) {
    console.log('Dispatching:', action.type);
  }
  return next(action);
};

// Error handling middleware
const errorMiddleware = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (err) {
    console.error('Redux Error:', err);
    return action;
  }
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: {
        extraArgument: { /* custom extra argument */ }
      }
    }).concat(loggerMiddleware, errorMiddleware),
  devTools: import.meta.env.DEV
});

// Enable hot reloading for reducers
if (import.meta.hot) {
  import.meta.hot.accept('./slices/authSlice', () => {
    const newAuthReducer = require('./slices/authSlice').default;
    store.replaceReducer(combineReducers({
      auth: newAuthReducer,
      posts: postReducer,
      users: userReducer,
      notifications: notificationReducer,
      ui: uiReducer,
      friends: friendReducer,
      chat: chatReducer
    }));
  });
}