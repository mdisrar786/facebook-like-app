const User = require('../models/User');
const Notification = require('../models/Notification');

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const receiver = await User.findById(req.params.id);
    const sender = await User.findById(req.user.id);
    
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (receiver.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot send request to yourself' });
    }
    
    // Check if already friends
    if (receiver.friends.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already friends' });
    }
    
    // Check if request already sent
    const existingRequest = receiver.friendRequests.find(
      req => req.from.toString() === req.user.id && req.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }
    
    receiver.friendRequests.push({
      from: req.user.id,
      status: 'pending',
      createdAt: new Date()
    });
    
    await receiver.save();
    
    // Create notification with sender details
    const notification = new Notification({
      userId: receiver.id,
      type: 'friend_request',
      fromUserId: req.user.id,
      message: `${sender.name} sent you a friend request`,
      data: {
        senderName: sender.name,
        senderProfilePicture: sender.profilePicture,
        senderId: sender.id
      }
    });
    await notification.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(receiver.id.toString()).emit('newNotification', {
        ...notification.toObject(),
        fromUser: {
          _id: sender.id,
          name: sender.name,
          profilePicture: sender.profilePicture
        }
      });
    }
    
    res.json({ message: 'Friend request sent', request: { from: sender, status: 'pending' } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(req.params.id);
    
    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the pending request
    const requestIndex = currentUser.friendRequests.findIndex(
      req => req.from.toString() === req.params.id && req.status === 'pending'
    );
    
    if (requestIndex === -1) {
      return res.status(400).json({ message: 'No friend request found' });
    }
    
    // Remove the request from current user's friendRequests
    currentUser.friendRequests.splice(requestIndex, 1);
    
    // Add to friends list (bidirectional)
    if (!currentUser.friends.includes(requester._id)) {
      currentUser.friends.push(requester._id);
    }
    if (!requester.friends.includes(currentUser._id)) {
      requester.friends.push(currentUser._id);
    }
    
    await currentUser.save();
    await requester.save();
    
    // Create notification for requester
    const notification = new Notification({
      userId: requester.id,
      type: 'friend_request_accepted',
      fromUserId: req.user.id,
      message: `${currentUser.name} accepted your friend request`,
      data: {
        accepterName: currentUser.name,
        accepterProfilePicture: currentUser.profilePicture,
        accepterId: currentUser.id
      }
    });
    await notification.save();
    
    const io = req.app.get('io');
    if (io) {
      io.to(requester.id.toString()).emit('newNotification', {
        ...notification.toObject(),
        fromUser: {
          _id: currentUser.id,
          name: currentUser.name,
          profilePicture: currentUser.profilePicture
        }
      });
    }
    
    res.json({ 
      message: 'Friend request accepted', 
      friend: {
        _id: requester._id,
        name: requester.name,
        profilePicture: requester.profilePicture,
        email: requester.email
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    const requestIndex = currentUser.friendRequests.findIndex(
      req => req.from.toString() === req.params.id && req.status === 'pending'
    );
    
    if (requestIndex === -1) {
      return res.status(400).json({ message: 'No friend request found' });
    }
    
    // Remove the request
    currentUser.friendRequests.splice(requestIndex, 1);
    await currentUser.save();
    
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friend requests with user details
exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'name email profilePicture bio isOnline');
    
    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');
    
    // Format requests with full user details
    const formattedRequests = pendingRequests.map(req => ({
      _id: req._id,
      from: req.from,
      status: req.status,
      createdAt: req.createdAt
    }));
    
    res.json(formattedRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friends list with details
exports.getFriends = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const user = await User.findById(userId)
      .populate('friends', 'name email profilePicture bio isOnline lastSeen');
    
    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfriend
exports.unfriend = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const friend = await User.findById(req.params.id);
    
    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove from both friends lists
    currentUser.friends = currentUser.friends.filter(f => f.toString() !== req.params.id);
    friend.friends = friend.friends.filter(f => f.toString() !== req.user.id);
    
    await currentUser.save();
    await friend.save();
    
    res.json({ message: 'Unfriended successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};