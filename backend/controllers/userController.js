const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, bio, profilePicture, coverPhoto } = req.body;
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
    
    // Update only provided fields, but ensure name is never empty
    if (name && name.trim() !== '') {
      user.name = name.trim();
    }
    
    if (bio !== undefined) {
      user.bio = bio;
    }
    
    if (profilePicture) {
      user.profilePicture = profilePicture;
    }
    
    if (coverPhoto) {
      user.coverPhoto = coverPhoto;
    }
    
    // Validate before saving
    const validationError = user.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationError.errors 
      });
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
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt
    };
    
    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    const io = req.app.get('io');
    
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userToFollow.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    if (!currentUser.following.includes(userToFollow.id)) {
      currentUser.following.push(userToFollow.id);
      userToFollow.followers.push(req.user.id);
      
      await currentUser.save();
      await userToFollow.save();
      
      // Create notification
      const notification = new Notification({
        userId: userToFollow.id,
        type: 'follow',
        fromUserId: req.user.id,
        message: `${currentUser.name} started following you`
      });
      await notification.save();
      
      if (io) {
        io.to(userToFollow.id.toString()).emit('newNotification', notification);
      }
      
      res.json({ message: 'User followed successfully' });
    } else {
      res.status(400).json({ message: 'Already following this user' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);
    
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userToUnfollow.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.id
    );
    
    await currentUser.save();
    await userToUnfollow.save();
    
    res.json({ message: 'User unfollowed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

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
      .limit(20);
    
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};