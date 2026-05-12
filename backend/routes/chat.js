const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getChatList,
  getUnreadMessageCount
} = require('../controllers/chatController');

// All routes require authentication
router.post('/message', auth, sendMessage);
router.get('/messages/:userId', auth, getMessages);
router.get('/list', auth, getChatList);
router.get('/unread-count', auth, getUnreadMessageCount);

module.exports = router;