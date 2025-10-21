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
        console.log(`BroadcastChannel created: ${channelName}`);
      } catch (error) {
        console.error('Failed to create BroadcastChannel:', error);
        return;
      }
    }

    const channel = channelRef.current;

    // Set up message listener
    const handleMessage = (event: MessageEvent) => {
      console.log(`BroadcastChannel ${channelName} received:`, event.data);
      try {
        onMessage(event.data);
      } catch (error) {
        console.error(`Error handling BroadcastChannel message:`, error);
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
        console.log(`BroadcastChannel ${channelName} sent:`, message);
      } catch (error) {
        console.error('Failed to send BroadcastChannel message:', error);
      }
    }
  };

  // Cleanup function to close the channel when component unmounts
  const closeChannel = () => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
      console.log(`BroadcastChannel ${channelName} closed`);
    }
  };

  return { sendMessage, closeChannel };
};
