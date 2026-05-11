import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Box,
  Divider,
  Tabs,
  Tab,
  Chip,
  Badge
} from '@mui/material';
import {
  Favorite,
  Chat,
  PersonAdd,
  CheckCircle,
  Cancel,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../redux/slices/friendSlice';
import { markNotificationAsRead } from '../redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { friendRequests } = useSelector((state) => state.friends);
  const { notifications: allNotifications } = useSelector((state) => state.notifications);
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getFriendRequests());
    fetchNotifications();
  }, [dispatch]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (userId) => {
    await dispatch(acceptFriendRequest(userId));
    await dispatch(getFriendRequests());
    await fetchNotifications();
  };

  const handleRejectRequest = async (userId) => {
    await dispatch(rejectFriendRequest(userId));
    await dispatch(getFriendRequests());
    await fetchNotifications();
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      // Mark as read
      try {
        const token = localStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: { 'x-auth-token': token }
        });
        // Update local state
        setNotifications(notifications.map(n => 
          n._id === notification._id ? { ...n, read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate based on notification type
    if (notification.type === 'friend_request' || notification.type === 'friend_request_accepted') {
      navigate(`/profile/${notification.fromUserId?._id}`);
    } else if (notification.postId) {
      // Scroll to post or navigate to post
      navigate(`/`);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return <Favorite color="error" />;
      case 'comment': return <Chat color="primary" />;
      case 'friend_request': return <PersonAdd color="success" />;
      case 'friend_request_accepted': return <CheckCircle color="primary" />;
      default: return <PersonAddIcon />;
    }
  };

  const getNotificationMessage = (notification) => {
    switch(notification.type) {
      case 'friend_request':
        return `${notification.fromUserId?.name} sent you a friend request`;
      case 'friend_request_accepted':
        return `${notification.fromUserId?.name} accepted your friend request`;
      case 'like':
        return `${notification.fromUserId?.name} liked your post`;
      case 'comment':
        return `${notification.fromUserId?.name} commented on your post`;
      default:
        return notification.message;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Paper>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { position: 'relative', top: -10 } }}>
                Notifications
              </Badge>
            } 
          />
          <Tab label={`Friend Requests (${friendRequests.length})`} />
        </Tabs>
        
        {/* Friend Requests Tab */}
        {tabValue === 1 && (
          <List>
            {friendRequests.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No pending friend requests</Typography>
              </Box>
            ) : (
              friendRequests.map((request) => (
                <React.Fragment key={request._id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar 
                        src={request.from?.profilePicture}
                        sx={{ width: 56, height: 56, cursor: 'pointer' }}
                        onClick={() => handleViewProfile(request.from?._id)}
                      >
                        {request.from?.name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          <strong 
                            style={{ cursor: 'pointer', color: '#1877f2' }}
                            onClick={() => handleViewProfile(request.from?._id)}
                          >
                            {request.from?.name}
                          </strong>
                          {' sent you a friend request'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {request.createdAt && formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip 
                              label={request.from?.isOnline ? 'Online' : 'Offline'} 
                              size="small" 
                              color={request.from?.isOnline ? 'success' : 'default'}
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleAcceptRequest(request.from._id)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<Cancel />}
                        onClick={() => handleRejectRequest(request.from._id)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        )}
        
        {/* All Notifications Tab */}
        {tabValue === 0 && (
          <List>
            {notifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No notifications yet</Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <React.Fragment key={notification._id}>
                  <ListItem 
                    sx={{ 
                      py: 2, 
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={notification.fromUserId?.profilePicture}
                        sx={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(notification.fromUserId?._id);
                        }}
                      >
                        {notification.fromUserId?.name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography>
                          <strong 
                            style={{ cursor: 'pointer', color: '#1877f2' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(notification.fromUserId?._id);
                            }}
                          >
                            {notification.fromUserId?.name}
                          </strong>
                          {' '}{getNotificationMessage(notification)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      }
                    />
                    {!notification.read && (
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1877f2', ml: 1 }} />
                    )}
                    {getNotificationIcon(notification.type)}
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Notifications;