const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  unfriend
} = require('../controllers/friendController');

router.post('/request/:id', auth, sendFriendRequest);
router.post('/accept/:id', auth, acceptFriendRequest);
router.post('/reject/:id', auth, rejectFriendRequest);
router.get('/requests', auth, getFriendRequests);
// Changed from /list/:id? to separate routes
router.get('/list', auth, getFriends);
router.get('/list/:id', auth, getFriends);
router.delete('/unfriend/:id', auth, unfriend);

module.exports = router;