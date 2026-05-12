const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
const profileDir = 'uploads/profiles';
const postsDir = 'uploads/posts';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

// Configure memory storage for profile pictures
const profileStorage = multer.memoryStorage();

// Configure disk storage for post images
const postStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/posts/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer for profile pictures (memory storage)
const uploadProfile = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Configure multer for post images (disk storage)
const uploadPost = multer({ 
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Multiple image upload for posts (max 5 images)
const uploadMultiple = uploadPost.array('images', 5);

// Single image upload for profile
const uploadSingleProfile = uploadProfile.single('profilePicture');

// Export all upload configurations
module.exports = {
  upload: uploadPost,           // For single file upload
  uploadMultiple,               // For multiple file upload (posts)
  uploadSingleProfile,          // For profile picture upload
  uploadProfile                 // For profile picture upload (alternative)
};