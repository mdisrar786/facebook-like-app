const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadSingleProfile } = require('../middleware/upload');
const {
  getUser,
  updateUser,
  followUser,
  unfollowUser,
  searchUsers,
  getFollowers,
  getFollowing,
  updateOnlineStatus,
  getSuggestedUsers
} = require('../controllers/userController');

// User routes
router.get('/search', auth, searchUsers);
router.get('/suggested', auth, getSuggestedUsers);
router.get('/:id', auth, getUser);
router.get('/:id/followers', auth, getFollowers);
router.get('/:id/following', auth, getFollowing);
router.put('/:id', auth, uploadSingleProfile, (req, res, next) => {
  // Ensure req.body exists
  if (!req.body || Object.keys(req.body).length === 0) {
    req.body = {};
  }
  next();
}, updateUser);
router.post('/:id/follow', auth, followUser);
router.post('/:id/unfollow', auth, unfollowUser);
router.put('/online/status', auth, updateOnlineStatus);

module.exports = router;