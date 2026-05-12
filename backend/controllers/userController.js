// backend/controllers/userController.js
const User = require('../models/User');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require('fs');

// Get user by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture')
      .populate('friends', 'name profilePicture email isOnline lastSeen')
      .populate('friendRequests.from', 'name profilePicture email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error getting user:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    // Ensure req.body exists
    const body = req.body || {};
    const { name, bio, profilePicture, coverPhoto } = body;
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is updating their own profile
    if (user._id.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this profile' });
    }
    
    // Handle image upload from file
    if (req.file) {
      // Save file locally
      const uploadDir = path.join(__dirname, '../uploads/profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Delete old profile picture if it's not default
      if (user.profilePicture && !user.profilePicture.includes('placeholder')) {
        const oldFilename = path.basename(user.profilePicture);
        const oldFilepath = path.join(uploadDir, oldFilename);
        if (fs.existsSync(oldFilepath)) {
          try {
            fs.unlinkSync(oldFilepath);
          } catch (unlinkErr) {
            console.error('Error deleting old profile picture:', unlinkErr);
          }
        }
      }
      
      const filename = `${Date.now()}-${req.file.originalname}`;
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      
      user.profilePicture = `${req.protocol}://${req.get('host')}/uploads/profiles/${filename}`;
    }
    
    // Update text fields
    if (name && name.trim() !== '') {
      user.name = name.trim();
    }
    
    if (bio !== undefined && bio !== null) {
      user.bio = bio;
    }
    
    if (profilePicture && !req.file && profilePicture !== 'undefined') {
      user.profilePicture = profilePicture;
    }
    
    if (coverPhoto && coverPhoto !== 'undefined') {
      user.coverPhoto = coverPhoto;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      friends: user.friends,
      friendRequests: user.friendRequests,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    const io = req.app.get('io');
    
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToFollow._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(req.user.id);
    
    await currentUser.save();
    await userToFollow.save();
    
    // Create notification
    const notification = new Notification({
      userId: userToFollow._id,
      type: 'follow',
      fromUserId: req.user.id,
      message: `${currentUser.name} started following you`
    });
    await notification.save();
    
    if (io) {
      io.to(userToFollow._id.toString()).emit('newNotification', notification);
    }
    
    res.json({ 
      message: 'User followed successfully',
      following: currentUser.following,
      followers: userToFollow.followers
    });
  } catch (err) {
    console.error('Error following user:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );
    
    await currentUser.save();
    await userToUnfollow.save();
    
    res.json({ 
      message: 'User unfollowed successfully',
      following: currentUser.following,
      followers: userToUnfollow.followers
    });
  } catch (err) {
    console.error('Error unfollowing user:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    let query = {};
    if (q && q.trim()) {
      query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query)
      .select('-password')
      .limit(20)
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get user's followers
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name profilePicture email isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.followers);
  } catch (err) {
    console.error('Error getting followers:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get user's following
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name profilePicture email isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.following);
  } catch (err) {
    console.error('Error getting following:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Update online status
exports.updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isOnline = isOnline === true || isOnline === 'true';
    user.lastSeen = new Date();
    await user.save();
    
    // Broadcast online status to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('userOnline', { userId: req.user.id, isOnline: user.isOnline });
    }
    
    res.json({ message: 'Online status updated', isOnline: user.isOnline, lastSeen: user.lastSeen });
  } catch (err) {
    console.error('Error updating online status:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get suggested users (users not followed)
exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    const suggestedUsers = await User.find({
      _id: { 
        $ne: req.user.id,
        $nin: currentUser.following 
      }
    })
    .select('-password')
    .limit(10)
    .sort({ createdAt: -1 });
    
    res.json(suggestedUsers);
  } catch (err) {
    console.error('Error getting suggested users:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};