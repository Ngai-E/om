'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthNotification } from './auth-notification';

interface Notification {
  id: string;
  type: 'recovery-success' | 'recovery-failed' | 'session-expired';
  message: string;
  timestamp: number;
}

export function AuthNotificationContainer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate unique ID with timestamp and random component
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification (called by external components)
  const addNotification = useCallback((type: Notification['type'], message: string) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      type,
      message,
      timestamp: Date.now(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove success notifications after 5 seconds
    if (type === 'recovery-success') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  }, [generateId]);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Listen for custom events
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { type, message } = event.detail;
      addNotification(type, message);
    };

    window.addEventListener('auth-notification', handleNotification as EventListener);
    return () => window.removeEventListener('auth-notification', handleNotification as EventListener);
  }, [addNotification]);

  // Expose methods globally for other components
  useEffect(() => {
    (window as any).addAuthNotification = addNotification;
    return () => {
      delete (window as any).addAuthNotification;
    };
  }, [addNotification]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <AuthNotification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}
