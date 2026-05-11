import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Notifications from './pages/Notifications';
import Saved from './pages/Saved';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Messages from './pages/Messages';
import { updateUserOnlineStatus } from './redux/slices/authSlice';

let socket;

const App = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);
  
  useEffect(() => {
    if (user) {
      // Connect to socket
      socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      
      socket.emit('join', user._id);
      
      socket.on('userOnline', (data) => {
        dispatch(updateUserOnlineStatus(data));
      });
      
      return () => {
        socket.disconnect();
      };
    }
  }, [user, dispatch]);
  
  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1877f2',
      },
      secondary: {
        main: '#e4e6eb',
      },
      background: {
        default: isDarkMode ? '#18191a' : '#f0f2f5',
        paper: isDarkMode ? '#242526' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile/:userId?" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/friends" element={user ? <Friends /> : <Navigate to="/login" />} />
          <Route path="/messages/:userId?" element={user ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/saved" element={user ? <Saved /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/help" element={user ? <Help /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;