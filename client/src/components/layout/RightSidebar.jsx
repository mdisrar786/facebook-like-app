// src/components/layout/RightSidebar.jsx
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  Paper,
  TextField,
  InputAdornment,
  Badge,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Search, PersonAdd, Chat, Send } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sendFriendRequest, getFriends } from '../../redux/slices/friendSlice';

const RightSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { friends } = useSelector((state) => state.friends);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchAllUsers();
    dispatch(getFriends());
  }, [dispatch]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/search?q=`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const users = await response.json();
      
      // Filter out current user and existing friends
      const filteredUsers = users.filter(user => 
        user._id !== currentUser?._id && 
        !friends.some(friend => friend._id === user._id)
      );
      setAllUsers(filteredUsers.slice(0, 5));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/search?q=${searchQuery}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      setSearchResults(results.filter(user => user._id !== currentUser?._id));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    await dispatch(sendFriendRequest(userId));
    // Remove from suggestions
    setAllUsers(allUsers.filter(u => u._id !== userId));
    setSearchResults(searchResults.filter(u => u._id !== userId));
  };

  const handleStartChat = (userId) => {
    navigate(`/messages/${userId}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <Box>
      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searching && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Search Results</Typography>
          <List>
            {searchResults.map((user) => (
              <ListItem key={user._id} sx={{ px: 0, mb: 1 }}>
                <ListItemAvatar>
                  <Badge
                    color="success"
                    variant="dot"
                    invisible={!user.isOnline}
                  >
                    <Avatar 
                      src={user.profilePicture}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewProfile(user._id)}
                    >
                      {user.name?.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => handleViewProfile(user._id)}
                    >
                      {user.name}
                    </Typography>
                  }
                  secondary={user.isOnline ? 'Online' : 'Offline'}
                />
                <Button 
                  size="small" 
                  variant="contained" 
                  startIcon={<PersonAdd />}
                  onClick={() => handleSendRequest(user._id)}
                  sx={{ borderRadius: 5, mr: 1 }}
                >
                  Add
                </Button>
                <IconButton size="small" onClick={() => handleStartChat(user._id)}>
                  <Chat fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Suggestions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>People You May Know</Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : allUsers.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No suggestions available
          </Typography>
        ) : (
          <List>
            {allUsers.map((user) => (
              <ListItem key={user._id} sx={{ px: 0, mb: 2 }}>
                <ListItemAvatar>
                  <Badge
                    color="success"
                    variant="dot"
                    invisible={!user.isOnline}
                  >
                    <Avatar 
                      src={user.profilePicture}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewProfile(user._id)}
                    >
                      {user.name?.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => handleViewProfile(user._id)}
                    >
                      {user.name}
                    </Typography>
                  }
                  secondary={user.bio || 'Available'}
                />
                <Button 
                  size="small" 
                  variant="contained" 
                  startIcon={<PersonAdd />}
                  onClick={() => handleSendRequest(user._id)}
                  sx={{ borderRadius: 5, mr: 1 }}
                >
                  Add
                </Button>
                <IconButton size="small" onClick={() => handleStartChat(user._id)}>
                  <Chat fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Online Friends */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Online Friends</Typography>
        {friends.filter(f => f.isOnline).length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No friends online
          </Typography>
        ) : (
          <List>
            {friends.filter(f => f.isOnline).map((friend) => (
              <ListItem key={friend._id} sx={{ px: 0, mb: 1 }}>
                <ListItemAvatar>
                  <Badge
                    color="success"
                    variant="dot"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  >
                    <Avatar 
                      src={friend.profilePicture}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewProfile(friend._id)}
                    >
                      {friend.name?.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography 
                      variant="subtitle2"
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => handleViewProfile(friend._id)}
                    >
                      {friend.name}
                    </Typography>
                  }
                  secondary="Online"
                />
                <IconButton size="small" onClick={() => handleStartChat(friend._id)}>
                  <Send fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default RightSidebar;