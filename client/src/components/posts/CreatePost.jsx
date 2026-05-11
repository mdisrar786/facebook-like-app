import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Box,
  TextField,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import { PhotoLibrary, Delete, Close, AddPhotoAlternate } from '@mui/icons-material';
import { createPost } from '../../redux/slices/postSlice';

const CreatePost = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newFiles = [];
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          newImages.push(event.target.result);
          newFiles.push(file);
          if (newImages.length === files.length) {
            setImages([...images, ...newImages]);
            setImageFiles([...imageFiles, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const result = await dispatch(createPost(formData));
    if (!result.error) {
      setContent('');
      setImages([]);
      setImageFiles([]);
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar src={user?.profilePicture}>{user?.name?.charAt(0)}</Avatar>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 5, justifyContent: 'flex-start', textTransform: 'none' }}
          >
            What's on your mind, {user?.name?.split(' ')[0]}?
          </Button>
        </Box>
      </Paper>
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create Post
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar src={user?.profilePicture}>{user?.name?.charAt(0)}</Avatar>
            <Typography variant="subtitle1">{user?.name}</Typography>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
          />
          
          {images.length > 0 && (
            <ImageList sx={{ mt: 2 }} cols={3} rowHeight={120}>
              {images.map((img, idx) => (
                <ImageListItem key={idx}>
                  <img src={img} alt={`preview-${idx}`} style={{ height: 120, objectFit: 'cover' }} />
                  <ImageListItemBar
                    position="top"
                    actionIcon={
                      <IconButton sx={{ color: 'white' }} onClick={() => handleRemoveImage(idx)}>
                        <Delete />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </DialogContent>
        <DialogActions>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
            onChange={handleImageSelect}
          />
          <Button 
            startIcon={<AddPhotoAlternate />} 
            onClick={() => fileInputRef.current.click()}
          >
            Add Photo
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={(!content.trim() && images.length === 0) || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CreatePost;