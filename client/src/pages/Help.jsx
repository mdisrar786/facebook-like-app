import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import { 
  ExpandMore, 
  Help as HelpIcon, 
  Email, 
  Send,
  CheckCircle,
  Phone,
  Chat,
  Facebook,
  Twitter,
  Instagram
} from '@mui/icons-material';

const faqs = [
  {
    question: "How do I create a post?",
    answer: "Click on 'What's on your mind?' at the top of your feed, write your post, add photos if desired, and click 'Post'. You can also add multiple images to make your post more engaging."
  },
  {
    question: "How do I send a friend request?",
    answer: "Go to the person's profile by clicking on their name or avatar, click on 'Add Friend' button. They will receive a notification. Once they accept, you'll be connected as friends."
  },
  {
    question: "How do I edit or delete a comment?",
    answer: "Click on the three dots (⋮) next to your comment, select 'Edit' or 'Delete' from the menu. You can edit your comment anytime or delete it if you change your mind."
  },
  {
    question: "How do I save a post?",
    answer: "Click on the bookmark icon on any post to save it. You can find all saved posts in the 'Saved' section from the left sidebar. This helps you revisit interesting content later."
  },
  {
    question: "How do I change my profile picture?",
    answer: "Go to Settings, click on the camera icon on your profile picture, and upload a new image. You can also remove your profile picture and set a default one."
  },
  {
   question: "How do I chat with a friend?",
    answer: "Click on the Messages icon in the top bar or go to Messages from the left sidebar. Select a friend from the list to start chatting. You can also send messages directly from someone's profile page or from their posts."
  },
  {
    question: "How do I report inappropriate content?",
    answer: "Click on the three dots menu on any post or comment and select 'Report'. Our team will review the content and take appropriate action."
  },
  {
    question: "How do I block or unfriend someone?",
    answer: "Go to the person's profile, click on the 'Friends' button, and select 'Unfriend'. To block someone, go to their profile, click on the three dots menu, and select 'Block User'."
  },
  {
    question: "How do I change the theme (Dark/Light mode)?",
    answer: "Click on the theme toggle button (sun/moon icon) in the top bar to switch between dark and light mode. Your preference will be saved for future sessions."
  },
  {
    question: "How do I reset my password?",
    answer: "If you forgot your password, click on 'Forgot Password' on the login page. You'll receive an email with instructions to reset your password securely."
  }
];

const Help = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Send email to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/contact/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Message sent successfully! We will get back to you soon.',
        severity: 'success'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send message. Please try again later.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Header Section */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <HelpIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h3" gutterBottom>
          How Can We Help You?
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Find answers to common questions or contact our support team
        </Typography>
      </Paper>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* FAQ Section */}
        <Box sx={{ flex: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Frequently Asked Questions
          </Typography>
          
          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        
        {/* Contact Form Section */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 88 }}>
            <Typography variant="h5" gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Send us a message and our support team will get back to you within 24 hours.
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Your Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Your Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="Brief description of your issue"
              />
              
              <TextField
                fullWidth
                label="Message *"
                name="message"
                multiline
                rows={6}
                value={formData.message}
                onChange={handleChange}
                margin="normal"
                required
                variant="outlined"
                placeholder="Please describe your issue in detail..."
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Contact Information */}
            <Typography variant="subtitle1" gutterBottom>
              Other Ways to Reach Us
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Email color="primary" />
                <Typography variant="body2">
                  support@socialhub.com
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Phone color="primary" />
                <Typography variant="body2">
                  +1 (555) 123-4567
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chat color="primary" />
                <Typography variant="body2">
                  Live Chat: Mon-Fri, 9am-6pm
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Social Media Links */}
            <Typography variant="subtitle2" gutterBottom align="center">
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton color="primary" sx={{ bgcolor: 'action.hover' }}>
                <Facebook />
              </IconButton>
              <IconButton color="primary" sx={{ bgcolor: 'action.hover' }}>
                <Twitter />
              </IconButton>
              <IconButton color="primary" sx={{ bgcolor: 'action.hover' }}>
                <Instagram />
              </IconButton>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Help;