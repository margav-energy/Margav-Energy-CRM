import { useEffect, useCallback } from 'react';

interface LeadUpdateMessage {
  type: 'NEW_LEAD' | 'LEAD_UPDATED';
  lead: any;
  timestamp: number;
}

export const useLocalStorageEvents = (
  eventName: string,
  onMessage: (message: LeadUpdateMessage) => void
) => {
  // Function to send messages via localStorage
  const sendMessage = useCallback((message: Omit<LeadUpdateMessage, 'timestamp'>) => {
    try {
      const messageWithTimestamp: LeadUpdateMessage = {
        ...message,
        timestamp: Date.now()
      };
      
      // Store message in localStorage with unique key
      const key = `${eventName}_${Date.now()}_${Math.random()}`;
      localStorage.setItem(key, JSON.stringify(messageWithTimestamp));
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(messageWithTimestamp),
        oldValue: null,
        storageArea: localStorage
      }));
      
      
      // Clean up the message after a short delay
      setTimeout(() => {
        localStorage.removeItem(key);
      }, 1000);
      
    } catch (error) {
    }
  }, [eventName]);

  // Listen for localStorage events
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key && event.key.startsWith(eventName) && event.newValue) {
        try {
          const message: LeadUpdateMessage = JSON.parse(event.newValue);
          onMessage(message);
        } catch (error) {
        }
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageEvent);
    
    // Also listen for custom events (for same-tab communication)
    const handleCustomEvent = (event: CustomEvent) => {
      onMessage(event.detail);
    };
    
    window.addEventListener(eventName, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener(eventName, handleCustomEvent as EventListener);
    };
  }, [eventName, onMessage]);

  return { sendMessage };
};




interface LeadUpdateMessage {
  type: 'NEW_LEAD' | 'LEAD_UPDATED';
  lead: any;
  timestamp: number;
}

