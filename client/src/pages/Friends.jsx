import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search, PersonRemove, Message } from '@mui/icons-material';
import { getFriends, unfriend } from '../redux/slices/friendSlice';
import { searchUsers } from '../redux/slices/userSlice';
import { sendFriendRequest } from '../redux/slices/friendSlice';

const Friends = () => {
  const dispatch = useDispatch();
  const { friends } = useSelector((state) => state.friends);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    dispatch(getFriends(currentUser?._id));
  }, [dispatch, currentUser]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const result = await dispatch(searchUsers(searchQuery));
      if (!result.error) {
        setSearchResults(result.payload);
      }
    }
  };

  const handleUnfriend = (userId) => {
    dispatch(unfriend(userId));
  };

  const handleAddFriend = (userId) => {
    dispatch(sendFriendRequest(userId));
  };

  const isFriend = (userId) => {
    return friends.some(friend => friend._id === userId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>Friends</Typography>
        <TextField
          fullWidth
          placeholder="Search for friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>
      
      <Grid container spacing={3}>
        {/* Your Friends */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2 }}>Your Friends ({friends.length})</Typography>
          <Grid container spacing={2}>
            {friends.map((friend) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={friend._id}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={friend.profilePicture}
                      sx={{ width: 80, height: 80, margin: '0 auto', mb: 1 }}
                    >
                      {friend.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="h6">{friend.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {friend.bio || 'No bio'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<Message />} fullWidth>
                      Message
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<PersonRemove />}
                      onClick={() => handleUnfriend(friend._id)}
                      fullWidth
                    >
                      Unfriend
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>Search Results</Typography>
            <Grid container spacing={2}>
              {searchResults.map((result) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={result._id}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={result.profilePicture}
                        sx={{ width: 80, height: 80, margin: '0 auto', mb: 1 }}
                      >
                        {result.name?.charAt(0)}
                      </Avatar>
                      <Typography variant="h6">{result.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.email}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {isFriend(result._id) ? (
                        <Button
                          fullWidth
                          size="small"
                          color="error"
                          onClick={() => handleUnfriend(result._id)}
                        >
                          Unfriend
                        </Button>
                      ) : result._id !== currentUser?._id && (
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          onClick={() => handleAddFriend(result._id)}
                        >
                          Add Friend
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Friends;