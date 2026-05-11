const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUser,
  updateUser,
  followUser,
  unfollowUser,
  searchUsers
} = require('../controllers/userController');

router.get('/search', auth, searchUsers);
router.get('/:id', auth, getUser);
router.put('/:id', auth, updateUser);
router.post('/:id/follow', auth, followUser);
router.post('/:id/unfollow', auth, unfollowUser);

module.exports = router;