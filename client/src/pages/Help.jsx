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
  Link
} from '@mui/material';
import { ExpandMore, Help as HelpIcon, Email } from '@mui/icons-material';

const faqs = [
  {
    question: "How do I create a post?",
    answer: "Click on 'What's on your mind?' at the top of your feed, write your post, add photos if desired, and click 'Post'."
  },
  {
    question: "How do I send a friend request?",
    answer: "Go to the person's profile, click on 'Add Friend' button, they will receive a notification."
  },
  {
    question: "How do I edit or delete a comment?",
    answer: "Click on the three dots next to your comment, select 'Edit' or 'Delete' from the menu."
  },
  {
    question: "How do I save a post?",
    answer: "Click on the bookmark icon on any post to save it. You can find saved posts in the 'Saved' section."
  },
  {
    question: "How do I change my profile picture?",
    answer: "Go to Settings, click on the camera icon on your profile picture, and upload a new image."
  },
  {
    question: "How do I report inappropriate content?",
    answer: "Click on the three dots menu on any post and select 'Report' to report inappropriate content."
  }
];

const Help = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Support request sent! We will get back to you soon.');
    setEmail('');
    setMessage('');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Help Center</Typography>
      
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HelpIcon sx={{ fontSize: 40 }} />
          <Typography variant="h5">How can we help you?</Typography>
        </Box>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Find answers to common questions or contact our support team
        </Typography>
      </Paper>
      
      <Typography variant="h5" gutterBottom>Frequently Asked Questions</Typography>
      {faqs.map((faq, index) => (
        <Accordion key={index}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">{faq.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">{faq.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Still Need Help?</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Contact our support team and we'll get back to you within 24 hours.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Your Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<Email />}
            sx={{ mt: 2 }}
          >
            Send Message
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Help;