// src/pages/Saved.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress
} from '@mui/material';
import { fetchSavedPosts } from '../redux/slices/postSlice';
import PostCard from '../components/posts/PostCard';

const Saved = () => {
  const dispatch = useDispatch();
  const { savedPosts, isLoading, error } = useSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchSavedPosts());
  }, [dispatch]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">Error loading saved posts: {error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Saved Posts</Typography>
      {savedPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No saved posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Save posts to read them later
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {savedPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Saved;