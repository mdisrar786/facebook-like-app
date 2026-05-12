// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Person,
  People,
  Notifications,
  Settings,
  Logout,
  DarkMode,
  LightMode,
  Chat
} from '@mui/icons-material';
import { fetchFeed, clearPosts } from '../redux/slices/postSlice';
import { logout } from '../redux/slices/authSlice';
import { toggleTheme } from '../redux/slices/uiSlice';
import PostCard from '../components/posts/PostCard';
import CreatePost from '../components/posts/CreatePost';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import InfiniteScroll from 'react-infinite-scroll-component';
import { getFriendRequests } from '../redux/slices/friendSlice';
import { getUnreadMessageCount } from '../redux/slices/chatSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { posts, hasMore, currentPage, isLoading } = useSelector((state) => state.posts);
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.ui);
  const { friendRequests } = useSelector((state) => state.friends);
  const { unreadCount: messageUnreadCount } = useSelector((state) => state.chat);

  useEffect(() => {
    dispatch(fetchFeed({ page: 1, limit: 10 }));
    dispatch(getFriendRequests());
    dispatch(getUnreadMessageCount());
    
    // Refresh unread count every 30 seconds
    const interval = setInterval(() => {
      dispatch(getUnreadMessageCount());
    }, 30000);
    
    return () => {
      dispatch(clearPosts());
      clearInterval(interval);
    };
  }, [dispatch]);

  const loadMorePosts = () => {
    if (hasMore && !isLoading) {
      dispatch(fetchFeed({ page: currentPage + 1, limit: 10 }));
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  };

  const unreadRequests = friendRequests?.length || 0;

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ flexGrow: 1, color: '#1877f2', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            SocialHub
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => dispatch(toggleTheme())}>
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            <IconButton onClick={() => navigate('/friends')}>
              <Badge badgeContent={unreadRequests} color="error">
                <People />
              </Badge>
            </IconButton>
            
            <IconButton onClick={() => navigate('/messages')}>
              <Badge badgeContent={messageUnreadCount} color="error">
                <Chat />
              </Badge>
            </IconButton>
            
            <IconButton onClick={() => navigate('/notifications')}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton onClick={handleMenuOpen}>
              <Avatar src={user?.profilePicture} sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate(`/profile/${user?._id}`); }}>
              <Person sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
              <Settings sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Left Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
            bgcolor: 'background.paper'
          }
        }}
      >
        <LeftSidebar />
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {/* Main Feed Column */}
            <Grid size={{ xs: 12, md: 8, lg: 7 }}>
              <CreatePost />
              
              <InfiniteScroll
                dataLength={posts.length}
                next={loadMorePosts}
                hasMore={hasMore}
                loader={
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <Typography>Loading more posts...</Typography>
                  </Box>
                }
                endMessage={
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">No more posts to show</Typography>
                  </Box>
                }
              >
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </InfiniteScroll>
            </Grid>
            
            {/* Right Sidebar - Suggestions */}
            <Grid item xs={12} md={4} lg={5}>
              <RightSidebar />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;