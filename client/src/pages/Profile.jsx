import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Badge,
  Divider
} from '@mui/material';
import { 
  Edit, 
  PersonAdd, 
  PersonRemove, 
  Chat, 
  PhotoCamera,
  Save,
  Close
} from '@mui/icons-material';
import PostCard from '../components/posts/PostCard';
import { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriends } from '../redux/slices/friendSlice';
import { updateUser } from '../redux/slices/userSlice';
import { fetchUserPosts, clearUserPosts } from '../redux/slices/postSlice';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { friends } = useSelector((state) => state.friends);
  const { userPosts, isLoading: postsLoading } = useSelector((state) => state.posts);
  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profilePicture: ''
  });
  const [success, setSuccess] = useState('');
  const [friendRequestStatus, setFriendRequestStatus] = useState(null);

  // Get the actual user ID to fetch
  const targetUserId = userId || currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!targetUserId) {
      console.error('No user ID available');
      setLoading(false);
      return;
    }
    fetchProfile();
    fetchUserPostsData();
    dispatch(getFriends());
    
    return () => {
      dispatch(clearUserPosts());
    };
  }, [targetUserId, dispatch]);

  const fetchProfile = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${targetUserId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfileUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPostsData = async () => {
    if (!targetUserId) return;
    await dispatch(fetchUserPosts(targetUserId));
  };

  useEffect(() => {
    if (profileUser && currentUser) {
      // Check if already friends
      const isFriend = friends.some(friend => friend._id === profileUser._id);
      setIsFollowing(isFriend);
      
      // Check if friend request sent
      const hasPendingRequest = profileUser.friendRequests?.some(
        req => req.from === currentUser._id && req.status === 'pending'
      );
      setFriendRequestStatus(hasPendingRequest ? 'pending' : null);
    }
  }, [profileUser, currentUser, friends]);

  const handleUpdateProfile = async () => {
    const result = await dispatch(updateUser(editForm));
    if (!result.error) {
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setEditDialogOpen(false);
      fetchProfile();
      // Update local storage
      const updatedUser = { ...currentUser, ...editForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const handleSendFriendRequest = () => {
    dispatch(sendFriendRequest(profileUser._id));
    setFriendRequestStatus('pending');
  };

  const handleAcceptRequest = () => {
    dispatch(acceptFriendRequest(profileUser._id));
    setIsFollowing(true);
    setFriendRequestStatus(null);
  };

  const handleRejectRequest = () => {
    dispatch(rejectFriendRequest(profileUser._id));
    setFriendRequestStatus(null);
  };

  const handleStartChat = () => {
    navigate(`/messages/${profileUser._id}`);
  };

  const isOwnProfile = !userId || userId === (currentUser?._id || currentUser?.id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileUser) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5">User not found</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')} 
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Profile Header */}
      <Paper sx={{ mb: 3, overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ 
          height: 200, 
          bgcolor: 'primary.main',
          position: 'relative',
          backgroundImage: profileUser.coverPhoto ? `url(${profileUser.coverPhoto})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -6, position: 'relative' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color="success"
            invisible={!profileUser.isOnline}
          >
            <Avatar
              src={profileUser.profilePicture}
              sx={{ width: 120, height: 120, border: '4px solid white', cursor: 'pointer' }}
            >
              {profileUser.name?.charAt(0)}
            </Avatar>
          </Badge>
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: 2, pb: 2 }}>
          <Typography variant="h4">{profileUser.name}</Typography>
          <Typography variant="body1" color="text.secondary">
            {profileUser.email}
          </Typography>
          {profileUser.bio && (
            <Typography variant="body1" sx={{ mt: 1, px: 3, maxWidth: 600, mx: 'auto' }}>
              {profileUser.bio}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
            <Typography variant="body2">
              <strong>{profileUser.friends?.length || 0}</strong> Friends
            </Typography>
            <Typography variant="body2">
              <strong>{profileUser.followers?.length || 0}</strong> Followers
            </Typography>
            <Typography variant="body2">
              <strong>{profileUser.following?.length || 0}</strong> Following
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            {isOwnProfile ? (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => {
                  setEditForm({
                    name: profileUser.name,
                    bio: profileUser.bio || '',
                    profilePicture: profileUser.profilePicture || ''
                  });
                  setEditDialogOpen(true);
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                {isFollowing ? (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<PersonRemove />}
                  >
                    Unfriend
                  </Button>
                ) : friendRequestStatus === 'pending' ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAcceptRequest}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRejectRequest}
                    >
                      Reject
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleSendFriendRequest}
                  >
                    Add Friend
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<Chat />}
                  onClick={handleStartChat}
                >
                  Message
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} centered>
          <Tab label="Posts" />
          <Tab label="Photos" />
          <Tab label="Friends" />
        </Tabs>
      </Paper>
      
      {/* Content based on active tab */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Posts Tab */}
          {activeTab === 0 && (
            postsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : userPosts && userPosts.length > 0 ? (
              userPosts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onPostUpdate={fetchUserPostsData}
                />
              ))
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">No posts yet</Typography>
                {isOwnProfile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Share your first post to connect with friends!
                  </Typography>
                )}
              </Paper>
            )
          )}
          
          {/* Photos Tab */}
          {activeTab === 1 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Photos</Typography>
              {userPosts && userPosts.filter(p => p.images && p.images.length > 0).length > 0 ? (
                <Grid container spacing={2}>
                  {userPosts.map((post) => (
                    post.images && post.images.map((img, idx) => (
                      <Grid item xs={6} sm={4} md={3} key={`${post._id}-${idx}`}>
                        <img 
                          src={img} 
                          alt={`post-${idx}`} 
                          style={{ 
                            width: '100%', 
                            height: 150, 
                            objectFit: 'cover',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(img, '_blank')}
                        />
                      </Grid>
                    ))
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No photos yet
                </Typography>
              )}
            </Paper>
          )}
          
          {/* Friends Tab */}
          {activeTab === 2 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Friends ({profileUser.friends?.length || 0})</Typography>
              {profileUser.friends && profileUser.friends.length > 0 ? (
                <Grid container spacing={2}>
                  {profileUser.friends.map((friend) => (
                    <Grid item xs={12} sm={6} key={friend._id}>
                      <Card>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Badge
                            color="success"
                            variant="dot"
                            invisible={!friend.isOnline}
                          >
                            <Avatar src={friend.profilePicture} sx={{ width: 50, height: 50 }}>
                              {friend.name?.charAt(0)}
                            </Avatar>
                          </Badge>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1">{friend.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {friend.isOnline ? 'Online' : 'Offline'}
                            </Typography>
                          </Box>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => navigate(`/profile/${friend._id}`)}
                          >
                            View
                          </Button>
                          <IconButton size="small" onClick={() => navigate(`/messages/${friend._id}`)}>
                            <Chat fontSize="small" />
                          </IconButton>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No friends yet
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
        
        {/* About Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: 88 }}>
            <Typography variant="h6" gutterBottom>About</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Member since:</strong> {new Date(profileUser.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Last seen:</strong> {profileUser.isOnline ? 'Online now' : profileUser.lastSeen ? new Date(profileUser.lastSeen).toLocaleString() : 'Recently'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Total Posts:</strong> {userPosts?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Total Photos:</strong> {userPosts?.filter(p => p.images && p.images.length > 0).reduce((acc, p) => acc + p.images.length, 0) || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Profile
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setEditDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={editForm.profilePicture} 
                sx={{ width: 100, height: 100 }}
              >
                {editForm.name?.charAt(0)}
              </Avatar>
              <IconButton
                sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper' }}
                size="small"
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) setEditForm({ ...editForm, profilePicture: url });
                }}
              >
                <PhotoCamera />
              </IconButton>
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={3}
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            margin="normal"
            placeholder="Tell us about yourself"
          />
          
          <TextField
            fullWidth
            label="Profile Picture URL"
            value={editForm.profilePicture}
            onChange={(e) => setEditForm({ ...editForm, profilePicture: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained" startIcon={<Save />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;