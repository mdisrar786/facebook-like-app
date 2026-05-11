import React from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Badge } from '@mui/material';
import { Home, Person, People, Notifications, Settings, Bookmark, Help, Chat } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { friendRequests } = useSelector((state) => state.friends);
  
  // Get the correct user ID
  const userId = user?._id || user?.id;
  
  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/', badge: 0 },
    { text: 'Profile', icon: <Person />, path: userId ? `/profile/${userId}` : '/profile', badge: 0 },
    { text: 'Friends', icon: <People />, path: '/friends', badge: 0 },
    { text: 'Messages', icon: <Chat />, path: '/messages', badge: 0 },
    { text: 'Saved', icon: <Bookmark />, path: '/saved', badge: 0 },
    { text: 'Notifications', icon: <Notifications />, path: '/notifications', badge: friendRequests?.length || 0 },
    { text: 'Settings', icon: <Settings />, path: '/settings', badge: 0 },
    { text: 'Help', icon: <Help />, path: '/help', badge: 0 }
  ];
  
  return (
    <List>
      {menuItems.map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton onClick={() => navigate(item.path)}>
            <ListItemIcon>
              {item.badge > 0 ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default LeftSidebar;