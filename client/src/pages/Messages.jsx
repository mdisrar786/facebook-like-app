import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  CircularProgress,
  InputAdornment,
  Alert,
  Button
} from '@mui/material';
import { 
  Send, 
  ArrowBack, 
  Search,
  MoreVert,
  PersonAdd,
  Chat as ChatIcon
} from '@mui/icons-material';
import { getChatList, getMessages, sendMessage, setCurrentChat, addNewMessage, clearMessages } from '../redux/slices/chatSlice';
import { getFriends } from '../redux/slices/friendSlice';
import { searchUsers } from '../redux/slices/userSlice';
import io from 'socket.io-client';

const Messages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { chats, messages, currentChat, isLoading } = useSelector((state) => state.chat);
  const { friends } = useSelector((state) => state.friends);
  const { searchResults } = useSelector((state) => state.users);
  const [messageText, setMessageText] = useState('');
  const [socket, setSocket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const [connectionError, setConnectionError] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnectionError(false);
      if (currentUser?._id) {
        newSocket.emit('join', currentUser._id);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(true);
    });

    newSocket.on('newMessage', (data) => {
      dispatch(addNewMessage(data.message));
    });

    return () => {
      newSocket.close();
      dispatch(clearMessages());
    };
  }, [dispatch, currentUser]);

  // Load chat data
  useEffect(() => {
    const loadData = async () => {
      await dispatch(getChatList());
      await dispatch(getFriends());
      if (userId) {
        await dispatch(getMessages(userId));
        // Try to find existing chat
        const existingChat = chats.find(c => c.user?._id === userId);
        if (existingChat) {
          dispatch(setCurrentChat(existingChat));
        } else {
          // Create a temporary chat object for new conversation
          const user = [...friends, ...searchResults].find(u => u._id === userId);
          if (user) {
            dispatch(setCurrentChat({ user, _id: 'new' }));
          }
        }
      }
    };
    loadData();
  }, [dispatch, userId, chats.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageText.trim() && userId) {
      try {
        const result = await dispatch(sendMessage({ receiverId: userId, message: messageText }));
        if (!result.error) {
          setMessageText('');
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleSelectChat = (chat) => {
    dispatch(setCurrentChat(chat));
    navigate(`/messages/${chat.user._id}`);
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await dispatch(searchUsers(searchQuery));
      setShowSearch(true);
    }
  };

  const handleStartNewChat = (userId) => {
    navigate(`/messages/${userId}`);
    setShowSearch(false);
    setSearchQuery('');
  };

  const allChats = [...chats];
  const onlineFriends = friends.filter(f => f.isOnline);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ height: '100%', py: 2 }}>
        {connectionError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Real-time connection issue. Messages will still be sent but may have delay.
          </Alert>
        )}
        
        <Paper sx={{ height: '100%', display: 'flex', overflow: 'hidden', borderRadius: 2 }}>
          
          {/* Chat List Sidebar */}
          <Box sx={{ 
            width: { xs: userId ? '0' : '100%', md: '320px' }, 
            display: { xs: userId ? 'none' : 'flex', md: 'flex' },
            borderRight: 1, 
            borderColor: 'divider', 
            flexDirection: 'column',
            bgcolor: 'background.paper'
          }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>Messages</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users to chat..."
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
              />
            </Box>
            
            {/* Search Results */}
            {showSearch && searchResults.length > 0 && (
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ p: 1, bgcolor: 'action.hover' }}>
                  Search Results
                </Typography>
                <List>
                  {searchResults.filter(u => u._id !== currentUser?._id).map((user) => (
                    <ListItem 
                      key={user._id} 
                      button 
                      onClick={() => handleStartNewChat(user._id)}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.profilePicture}>
                          {user.name?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.name}
                        secondary={user.isOnline ? 'Online' : 'Offline'}
                      />
                      <Button size="small" variant="outlined" startIcon={<ChatIcon />}>
                        Message
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Online Friends Section */}
            {onlineFriends.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ p: 1, bgcolor: 'action.hover' }}>
                  Online Friends ({onlineFriends.length})
                </Typography>
                <List>
                  {onlineFriends.map((friend) => (
                    <ListItem 
                      key={friend._id} 
                      button 
                      onClick={() => handleStartNewChat(friend._id)}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="success"
                          variant="dot"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar src={friend.profilePicture}>
                            {friend.name?.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={friend.name}
                        secondary="Online"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* All Chats */}
            <Typography variant="subtitle2" sx={{ p: 1, bgcolor: 'action.hover', mt: 1 }}>
              All Chats
            </Typography>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : allChats.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No chats yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Search for users to start chatting
                  </Typography>
                </Box>
              ) : (
                allChats.map((chat) => (
                  <React.Fragment key={chat._id}>
                    <ListItem 
                      button 
                      onClick={() => handleSelectChat(chat)}
                      selected={currentChat?._id === chat._id}
                      sx={{ 
                        bgcolor: currentChat?._id === chat._id ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="success"
                          variant="dot"
                          invisible={!chat.user?.isOnline}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                          <Avatar src={chat.user?.profilePicture}>
                            {chat.user?.name?.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" noWrap>
                            {chat.user?.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {chat.lastMessage?.substring(0, 40) || 'No messages yet'}
                          </Typography>
                        }
                      />
                      {chat.unreadCount > 0 && (
                        <Badge 
                          badgeContent={chat.unreadCount} 
                          color="error"
                        />
                      )}
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </Box>

          {/* Chat Area */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            display: { xs: userId ? 'flex' : 'none', md: 'flex' }
          }}>
            {userId ? (
              <>
                {/* Chat Header */}
                <Box sx={{ 
                  p: 2, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      onClick={() => navigate('/messages')} 
                      sx={{ display: { md: 'none' } }}
                    >
                      <ArrowBack />
                    </IconButton>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!currentChat?.user?.isOnline}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar 
                        src={currentChat?.user?.profilePicture}
                        sx={{ width: 45, height: 45 }}
                      >
                        {currentChat?.user?.name?.charAt(0)}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {currentChat?.user?.name || 'Loading...'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentChat?.user?.isOnline ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                </Box>

                {/* Messages Area */}
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  bgcolor: 'background.default'
                }}>
                  {messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                      <ChatIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                      <Typography color="text.secondary">No messages yet</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Send a message to start the conversation
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwnMessage = msg.senderId?._id === currentUser?._id;
                      return (
                        <Box
                          key={msg._id || index}
                          sx={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                            mb: 2
                          }}
                        >
                          {!isOwnMessage && (
                            <Avatar 
                              src={currentChat?.user?.profilePicture}
                              sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }}
                            >
                              {currentChat?.user?.name?.charAt(0)}
                            </Avatar>
                          )}
                          <Box sx={{ maxWidth: '70%' }}>
                            <Paper
                              sx={{
                                p: 1.5,
                                bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                                color: isOwnMessage ? 'white' : 'text.primary',
                                borderRadius: isOwnMessage 
                                  ? '18px 4px 18px 18px' 
                                  : '4px 18px 18px 18px'
                              }}
                            >
                              <Typography variant="body2" sx={{ wordWrap: 'break-word' }}>
                                {msg.message}
                              </Typography>
                            </Paper>
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                display: 'block', 
                                mt: 0.5,
                                textAlign: isOwnMessage ? 'right' : 'left'
                              }}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isOwnMessage && msg.read && ' ✓✓'}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider', 
                  bgcolor: 'background.paper',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center'
                }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5 } }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    sx={{ 
                      bgcolor: messageText.trim() ? 'primary.main' : 'transparent',
                      color: messageText.trim() ? 'white' : 'primary.main',
                      '&:hover': {
                        bgcolor: messageText.trim() ? 'primary.dark' : 'transparent'
                      }
                    }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                flexDirection: 'column',
                gap: 2
              }}>
                <ChatIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                <Typography variant="h5" color="text.secondary">
                  Select a chat to start messaging
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a friend from the left sidebar or search for users to begin chatting
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/friends')}
                >
                  Find Friends
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Messages;