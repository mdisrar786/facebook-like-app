const Chat = require('../models/Chat');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver ID and message are required' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const sender = await User.findById(senderId);

    // Find existing chat or create new
    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, receiverId],
        messages: [],
        lastMessage: message,
        lastMessageTime: new Date()
      });
    }

    const newMessage = {
      senderId,
      receiverId,
      message,
      read: false
    };

    chat.messages.push(newMessage);
    chat.lastMessage = message;
    chat.lastMessageTime = new Date();

    await chat.save();

    // Create notification for message
    const notification = new Notification({
      userId: receiverId,
      type: 'message',
      fromUserId: senderId,
      message: `${sender.name} sent you a message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
      data: {
        messageId: newMessage._id,
        chatId: chat._id,
        messagePreview: message.substring(0, 100)
      }
    });
    await notification.save();

    // Populate sender details
    await chat.populate('messages.senderId', 'name profilePicture');
    await chat.populate('messages.receiverId', 'name profilePicture');

    // Get the last message
    const sentMessage = chat.messages[chat.messages.length - 1];

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('newMessage', {
        chatId: chat._id,
        message: sentMessage,
        sender: { id: senderId, name: sender.name, profilePicture: sender.profilePicture }
      });
      
      // Emit notification event
      io.to(receiverId).emit('newNotification', {
        ...notification.toObject(),
        fromUser: {
          _id: senderId,
          name: sender.name,
          profilePicture: sender.profilePicture
        }
      });
    }

    res.status(201).json(sentMessage);
  } catch (err) {
    console.error('Error in sendMessage:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] }
    }).populate('messages.senderId', 'name profilePicture')
      .populate('messages.receiverId', 'name profilePicture');

    if (!chat) {
      return res.json([]);
    }

    // Mark messages as read
    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.receiverId && msg.receiverId._id && 
          msg.receiverId._id.toString() === currentUserId && 
          !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
        updated = true;
      }
    });
    
    if (updated) {
      await chat.save();
    }

    res.json(chat.messages);
  } catch (err) {
    console.error('Error in getMessages:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get chat list for user
exports.getChatList = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user.id] }
    })
    .populate('participants', 'name profilePicture bio isOnline lastSeen')
    .sort({ lastMessageTime: -1 });

    // Format chat list
    const chatList = chats.map(chat => {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== req.user.id
      );
      
      const unreadCount = chat.messages.filter(
        m => m.receiverId && m.receiverId.toString() === req.user.id && !m.read
      ).length;

      return {
        _id: chat._id,
        user: otherParticipant,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount
      };
    });

    res.json(chatList);
  } catch (err) {
    console.error('Error in getChatList:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get unread message count
exports.getUnreadMessageCount = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $in: [req.user.id] }
    });

    let totalUnread = 0;
    chats.forEach(chat => {
      const unreadCount = chat.messages.filter(
        m => m.receiverId && m.receiverId.toString() === req.user.id && !m.read
      ).length;
      totalUnread += unreadCount;
    });

    res.json({ unreadCount: totalUnread });
  } catch (err) {
    console.error('Error in getUnreadMessageCount:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};