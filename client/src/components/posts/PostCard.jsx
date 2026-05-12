import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Button,
  TextField,
  Box,
  Collapse,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MoreHoriz,
  Edit,
  Delete,
  Save,
  Close,
  AddPhotoAlternate,
  Send
} from '@mui/icons-material';
import { likePost, addComment, editComment, deleteComment, updatePost, deletePost } from '../../redux/slices/postSlice';
import { sendMessage } from '../../redux/slices/chatSlice';

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  return Math.floor(seconds) + ' seconds ago';
};

const PostCard = ({ post, onPostUpdate }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState(post.images || []);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef(null);
  
  const liked = post.likes?.includes(user?._id);
  const isOwnPost = post.userId?._id === user?._id;
  
  const handleLike = () => {
    dispatch(likePost(post._id));
  };
  
  const handleComment = () => {
    if (commentText.trim()) {
      dispatch(addComment({ postId: post._id, text: commentText }));
      setCommentText('');
    }
  };
  
  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditText(comment.text);
    setAnchorEl(null);
  };
  
  const handleUpdateComment = () => {
    if (editText.trim()) {
      dispatch(editComment({ 
        postId: post._id, 
        commentId: editingComment._id, 
        text: editText 
      }));
      setEditingComment(null);
      setEditText('');
    }
  };
  
  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setDeleteConfirmOpen(true);
    setAnchorEl(null);
  };
  
  const handleDeleteComment = () => {
    dispatch(deleteComment({ 
      postId: post._id, 
      commentId: commentToDelete._id 
    }));
    setDeleteConfirmOpen(false);
    setCommentToDelete(null);
  };
  
  const handleEditPost = () => {
    setIsEditing(true);
    setEditContent(post.content);
    setEditImages(post.images || []);
    setAnchorEl(null);
  };
  
  const handleUpdatePost = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('content', editContent);
    
    newImageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const result = await dispatch(updatePost({ postId: post._id, formData }));
    if (!result.error) {
      setIsEditing(false);
      setNewImageFiles([]);
      if (onPostUpdate) onPostUpdate();
    }
    setLoading(false);
  };
  
  const handleDeletePost = async () => {
    setLoading(true);
    const result = await dispatch(deletePost(post._id));
    if (!result.error && onPostUpdate) {
      onPostUpdate();
    }
    setLoading(false);
    setAnchorEl(null);
  };
  
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    setSendingMessage(true);
    const result = await dispatch(sendMessage({ 
      receiverId: post.userId._id, 
      message: messageText 
    }));
    
    if (!result.error) {
      setMessageText('');
      setMessageDialogOpen(false);
      // Show success message
      alert('Message sent successfully!');
    }
    setSendingMessage(false);
  };
  
  const handleAddEditImages = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setEditImages([...editImages, event.target.result]);
          setNewImageFiles([...newImageFiles, file]);
        };
        reader.readAsDataURL(file);
      }
    });
  };
  
  const handleRemoveEditImage = (index) => {
    setEditImages(editImages.filter((_, i) => i !== index));
    if (index >= (post.images?.length || 0)) {
      const newIndex = index - (post.images?.length || 0);
      setNewImageFiles(newImageFiles.filter((_, i) => i !== newIndex));
    }
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleViewProfile = () => {
    navigate(`/profile/${post.userId._id}`);
  };
  
  if (isEditing) {
    return (
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardHeader
          avatar={<Avatar src={post.userId?.profilePicture} />}
          title="Edit Post"
        />
        <CardContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            placeholder="What's on your mind?"
          />
          
          {editImages.length > 0 && (
            <ImageList sx={{ mt: 2 }} cols={3} rowHeight={120}>
              {editImages.map((img, idx) => (
                <ImageListItem key={idx}>
                  <img src={img} alt={`edit-${idx}`} style={{ height: 120, objectFit: 'cover' }} />
                  <ImageListItemBar
                    position="top"
                    actionIcon={
                      <IconButton sx={{ color: 'white' }} onClick={() => handleRemoveEditImage(idx)}>
                        <Delete />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={handleAddEditImages}
          />
        </CardContent>
        <CardActions>
          <Button startIcon={<AddPhotoAlternate />} onClick={() => fileInputRef.current.click()}>
            Add Photo
          </Button>
          <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdatePost}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            Save Changes
          </Button>
        </CardActions>
      </Card>
    );
  }
  
  return (
    <>
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardHeader
          avatar={
            <Avatar 
              src={post.userId?.profilePicture}
              sx={{ cursor: 'pointer' }}
              onClick={handleViewProfile}
            >
              {post.userId?.name?.charAt(0)}
            </Avatar>
          }
          action={
            <IconButton onClick={handleMenuOpen}>
              <MoreHoriz />
            </IconButton>
          }
          title={
            <Typography 
              variant="subtitle1" 
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={handleViewProfile}
            >
              {post.userId?.name}
            </Typography>
          }
          subheader={
            <Box>
              {formatTimeAgo(post.createdAt)}
              {post.isEdited && <Chip label="Edited" size="small" sx={{ ml: 1 }} />}
            </Box>
          }
        />
        
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          {isOwnPost && (
            <>
              <MenuItem onClick={handleEditPost}>
                <Edit sx={{ mr: 1 }} /> Edit Post
              </MenuItem>
              <MenuItem onClick={handleDeletePost} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} /> Delete Post
              </MenuItem>
            </>
          )}
          <MenuItem onClick={handleMenuClose}>Report</MenuItem>
        </Menu>
        
        {post.content && (
          <CardContent>
            <Typography variant="body1">{post.content}</Typography>
          </CardContent>
        )}
        
        {post.images && post.images.length > 0 && (
          <Box sx={{ p: 2 }}>
            <ImageList cols={post.images.length === 1 ? 1 : 2} rowHeight={300}>
              {post.images.map((img, idx) => (
                <ImageListItem key={idx}>
                  <img 
                    src={img} 
                    alt={`post-${idx}`} 
                    style={{ height: 300, objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => window.open(img, '_blank')}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}
        
        <CardActions disableSpacing>
          <IconButton onClick={handleLike} color={liked ? 'error' : 'default'}>
            {liked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {post.likes?.length || 0}
          </Typography>
          
          <IconButton onClick={() => setShowComments(!showComments)}>
            <Comment />
          </IconButton>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {post.comments?.length || 0}
          </Typography>
          
          <IconButton onClick={() => setMessageDialogOpen(true)}>
            <Send />
          </IconButton>
          <Typography variant="body2">
            Message
          </Typography>
          
          <IconButton sx={{ ml: 'auto' }}>
            <Share />
          </IconButton>
        </CardActions>
        
        <Collapse in={showComments}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button variant="contained" onClick={handleComment} disabled={!commentText.trim()}>
                Post
              </Button>
            </Box>
            
            {post.comments?.map((comment) => (
              <Box key={comment._id} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Avatar 
                  src={comment.userId?.profilePicture} 
                  sx={{ width: 32, height: 32, cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${comment.userId?._id}`)}
                >
                  {comment.userId?.name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => navigate(`/profile/${comment.userId?._id}`)}
                    >
                      {comment.userId?.name}
                    </Typography>
                    {comment.edited && (
                      <Chip label="Edited" size="small" variant="outlined" sx={{ height: 20, fontSize: '10px' }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeAgo(comment.createdAt)}
                    </Typography>
                  </Box>
                  
                  {editingComment?._id === comment._id ? (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <Button size="small" onClick={handleUpdateComment}>Save</Button>
                      <Button size="small" onClick={() => setEditingComment(null)}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography variant="body2">{comment.text}</Typography>
                  )}
                </Box>
                
                {(comment.userId?._id === user?._id || isOwnPost) && !editingComment && (
                  <Box>
                    <IconButton size="small" onClick={() => handleEditComment(comment)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(comment)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Collapse>
      </Card>
      
      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Message to {post.userId?.name}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setMessageDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Avatar src={post.userId?.profilePicture} sx={{ width: 50, height: 50 }}>
              {post.userId?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1">{post.userId?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {post.userId?.isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Write your message here..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendMessage} 
            variant="contained" 
            disabled={!messageText.trim() || sendingMessage}
            startIcon={sendingMessage ? <CircularProgress size={20} /> : <Send />}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this comment?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteComment} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCard;