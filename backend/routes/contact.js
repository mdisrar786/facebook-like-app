const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Send contact message (store in database)
router.post('/send', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required' 
      });
    }
    
    // Save to database
    const contact = new Contact({
      name,
      email,
      subject: subject || '',
      message,
      status: 'pending'
    });
    
    await contact.save();
    
    res.json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
    
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    });
  }
});

// Get all contact messages (for admin)
router.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update message status
router.put('/messages/:id', async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;