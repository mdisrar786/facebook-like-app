// backend/controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Create post with images
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrls = [];
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => {
        // Return the URL path to access the image
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });
    }
    
    const post = new Post({
      userId: req.user.id,
      content: content || '',
      images: imageUrls
    });
    
    await post.save();
    await post.populate('userId', 'name profilePicture');
    
    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Update post (edit)
exports.updatePost = async (req, res) => {
  try {
    const { content, imagesToRemove } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }
    
    // Update content
    if (content !== undefined) {
      post.content = content;
    }
    
    // Remove images if specified
    if (imagesToRemove && imagesToRemove.length > 0) {
      // Delete physical files
      for (const imageUrl of imagesToRemove) {
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      post.images = post.images.filter(img => !imagesToRemove.includes(img));
    }
    
    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => 
        `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      );
      post.images = [...post.images, ...newImages];
    }
    
    post.isEdited = true;
    await post.save();
    await post.populate('userId', 'name profilePicture');
    await post.populate('comments.userId', 'name profilePicture');
    
    res.json(post);
  } catch (err) {
    console.error('Error updating post:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }
    
    // Delete image files from server
    if (post.images && post.images.length > 0) {
      for (const imageUrl of post.images) {
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get feed posts
exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(req.user.id);
    const following = user.following;
    
    const posts = await Post.find({
      $or: [
        { userId: req.user.id },
        { userId: { $in: following } }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name profilePicture')
    .populate('comments.userId', 'name profilePicture');
    
    const total = await Post.countDocuments({
      $or: [
        { userId: req.user.id },
        { userId: { $in: following } }
      ]
    });
    
    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting feed:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get user posts
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name profilePicture')
      .populate('comments.userId', 'name profilePicture');
    
    const total = await Post.countDocuments({ userId: req.params.userId });
    
    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (err) {
    console.error('Error getting user posts:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Like/Unlike post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const io = req.app.get('io');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const likeIndex = post.likes.indexOf(req.user.id);
    let liked = false;
    
    if (likeIndex === -1) {
      post.likes.push(req.user.id);
      liked = true;
      
      if (post.userId.toString() !== req.user.id) {
        const user = await User.findById(req.user.id);
        const notification = new Notification({
          userId: post.userId,
          type: 'like',
          fromUserId: req.user.id,
          postId: post._id,
          message: `${user.name} liked your post`
        });
        await notification.save();
        
        if (io) {
          io.to(post.userId.toString()).emit('newNotification', notification);
        }
      }
    } else {
      post.likes.splice(likeIndex, 1);
    }
    
    await post.save();
    res.json({ likes: post.likes.length, liked });
  } catch (err) {
    console.error('Error liking post:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Add comment to post
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const io = req.app.get('io');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = {
      userId: req.user.id,
      text: req.body.text,
      createdAt: new Date()
    };
    
    post.comments.push(comment);
    await post.save();
    
    if (post.userId.toString() !== req.user.id) {
      const user = await User.findById(req.user.id);
      const notification = new Notification({
        userId: post.userId,
        type: 'comment',
        fromUserId: req.user.id,
        postId: post._id,
        message: `${user.name} commented on your post`
      });
      await notification.save();
      
      if (io) {
        io.to(post.userId.toString()).emit('newNotification', notification);
      }
    }
    
    await post.populate('comments.userId', 'name profilePicture');
    res.json(post.comments);
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Edit comment
exports.editComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this comment' });
    }
    
    comment.text = req.body.text;
    comment.edited = true;
    comment.editedAt = new Date();
    
    await post.save();
    await post.populate('comments.userId', 'name profilePicture');
    
    res.json(post.comments);
  } catch (err) {
    console.error('Error editing comment:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (comment.userId.toString() !== req.user.id && post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }
    
    comment.deleteOne();
    await post.save();
    await post.populate('comments.userId', 'name profilePicture');
    
    res.json(post.comments);
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Save/Unsave post
exports.savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const postId = req.params.id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const index = user.savedPosts.indexOf(postId);
    
    if (index === -1) {
      user.savedPosts.push(postId);
      await user.save();
      res.json({ saved: true, message: 'Post saved' });
    } else {
      user.savedPosts.splice(index, 1);
      await user.save();
      res.json({ saved: false, message: 'Post unsaved' });
    }
  } catch (err) {
    console.error('Error saving post:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Get saved posts
exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedPosts',
      populate: { 
        path: 'userId', 
        select: 'name profilePicture' 
      }
    });
    
    res.json(user.savedPosts);
  } catch (err) {
    console.error('Error getting saved posts:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};