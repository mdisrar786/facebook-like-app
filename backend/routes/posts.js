const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');
const {
  createPost,
  getFeed,
  likePost,
  addComment,
  editComment,
  deleteComment,
  deletePost,
  getUserPosts,
  savePost,
  getSavedPosts,
  updatePost
} = require('../controllers/postController');

// Post routes with image upload
router.post('/', auth, uploadMultiple, createPost);
router.put('/:id', auth, uploadMultiple, updatePost);
router.get('/feed', auth, getFeed);
router.get('/saved', auth, getSavedPosts);
router.get('/user/:userId', auth, getUserPosts);
router.post('/:id/like', auth, likePost);
router.post('/:id/save', auth, savePost);
router.post('/:postId/comment', auth, addComment);
router.put('/:postId/comment/:commentId', auth, editComment);
router.delete('/:postId/comment/:commentId', auth, deleteComment);
router.delete('/:id', auth, deletePost);

module.exports = router;