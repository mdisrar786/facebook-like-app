const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getChatList
} = require('../controllers/chatController');

// All routes require authentication
router.post('/message', auth, sendMessage);
router.get('/messages/:userId', auth, getMessages);
router.get('/list', auth, getChatList);

module.exports = router;