import { useEffect, useRef } from 'react';

interface BroadcastMessage {
  type: 'NEW_LEAD' | 'LEAD_UPDATED';
  lead: any;
}

export const useBroadcastChannel = (
  channelName: string,
  onMessage: (message: BroadcastMessage) => void
) => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // Create or reuse the BroadcastChannel
    if (!channelRef.current) {
      try {
        channelRef.current = new BroadcastChannel(channelName);
      } catch (error) {
        return;
      }
    }

    const channel = channelRef.current;

    // Set up message listener
    const handleMessage = (event: MessageEvent) => {
      try {
        onMessage(event.data);
      } catch (error) {
      }
    };

    channel.addEventListener('message', handleMessage);

    // Cleanup function
    return () => {
      channel.removeEventListener('message', handleMessage);
      // Don't close the channel here - let it persist
    };
  }, [channelName, onMessage]);

  // Function to send messages
  const sendMessage = (message: BroadcastMessage) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage(message);
      } catch (error) {
      }
    }
  };

  // Cleanup function to close the channel when component unmounts
  const closeChannel = () => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
  };

  return { sendMessage, closeChannel };
};

interface BroadcastMessage {
  type: 'NEW_LEAD' | 'LEAD_UPDATED';
  lead: any;
}

