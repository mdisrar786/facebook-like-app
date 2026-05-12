// src/hooks/useAutoReconnect.js
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

export const useAutoReconnect = () => {
  const dispatch = useDispatch();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Back online');
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check network status periodically
    const interval = setInterval(() => {
      if (navigator.onLine !== isOnline) {
        setIsOnline(navigator.onLine);
        if (navigator.onLine) {
          window.location.reload();
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return isOnline;
};