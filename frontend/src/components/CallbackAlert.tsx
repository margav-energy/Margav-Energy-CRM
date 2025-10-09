import React, { useState, useEffect, useCallback } from 'react';
import { callbacksAPI } from '../api';

interface Callback {
  id: number;
  lead: number;
  lead_id?: number;
  lead_name: string;
  lead_phone: string;
  scheduled_time: string;
  status: string;
  notes: string;
  is_due: boolean;
  is_overdue: boolean;
}

interface CallbackAlertProps {
  onCallbackClick: (callback: Callback) => void;
}

const CallbackAlert: React.FC<CallbackAlertProps> = ({ onCallbackClick }) => {
  console.log('🎯 CallbackAlert: Component rendered');
  
  const [callbacks, setCallbacks] = useState<{
    due_callbacks: Callback[];
    overdue_callbacks: Callback[];
  }>({ due_callbacks: [], overdue_callbacks: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [notifiedCallbacks, setNotifiedCallbacks] = useState<Set<number>>(new Set());

  const playPingSound = useCallback(() => {
    try {
      // Create a simple ping sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play ping sound:', error);
    }
  }, []);

  const fetchDueCallbacks = useCallback(async () => {
    console.log('🔍 CallbackAlert: Fetching due callbacks...');
    setIsLoading(true);
    try {
      const response = await callbacksAPI.getDueCallbacks();
      console.log('📞 CallbackAlert: API Response:', response);
      
      const hasCallbacks = response.due_callbacks.length > 0 || response.overdue_callbacks.length > 0;
      console.log('📊 CallbackAlert: Has callbacks:', hasCallbacks);
      console.log('📊 CallbackAlert: Due callbacks:', response.due_callbacks.length);
      console.log('📊 CallbackAlert: Overdue callbacks:', response.overdue_callbacks.length);

      setCallbacks(response);
      setIsVisible(hasCallbacks);
      console.log('👁️ CallbackAlert: Visibility set to:', hasCallbacks);

      // Play ping sound only for new callbacks that haven't been notified yet
      if (hasCallbacks) {
        const allCallbacks = [...response.due_callbacks, ...response.overdue_callbacks];
        const newCallbacks = allCallbacks.filter(callback => !notifiedCallbacks.has(callback.id));
        console.log('🆕 CallbackAlert: New callbacks:', newCallbacks.length);
        
        if (newCallbacks.length > 0) {
          console.log('🔔 CallbackAlert: Playing ping sound for new callbacks');
          playPingSound();
          // Mark these callbacks as notified
          setNotifiedCallbacks(prev => {
            const newSet = new Set(prev);
            newCallbacks.forEach(callback => newSet.add(callback.id));
            console.log('✅ CallbackAlert: Marked callbacks as notified:', Array.from(newSet));
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('❌ CallbackAlert: Error fetching due callbacks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [playPingSound, notifiedCallbacks]);

  useEffect(() => {
    fetchDueCallbacks();

    // Check for due callbacks every 30 seconds (more frequent checking)
    const interval = setInterval(fetchDueCallbacks, 30000);
    return () => clearInterval(interval);
  }, [fetchDueCallbacks]);

  const updateCallbackStatus = async (callbackId: number, status: string) => {
    try {
      await callbacksAPI.updateCallbackStatus(callbackId, { status });
      fetchDueCallbacks(); // Refresh the list
    } catch (error) {
      console.error('Error updating callback status:', error);
    }
  };

  const formatTime = (scheduledTime: string) => {
    const date = new Date(scheduledTime);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 0) {
      return `${Math.abs(diffMins)}m overdue`;
    } else if (diffMins < 60) {
      return `in ${diffMins}m`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  console.log('👁️ CallbackAlert: isVisible =', isVisible, 'callbacks =', callbacks);
  if (!isVisible) {
    console.log('❌ CallbackAlert: Not visible, returning null');
    return null;
  }

  const allCallbacks = [...callbacks.overdue_callbacks, ...callbacks.due_callbacks];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-red-200">
        <div className="flex items-center justify-between p-4 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">
              Callback Alerts
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="h-6 w-6 mx-auto mb-2 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">Loading callbacks...</p>
            </div>
          ) : allCallbacks.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <svg className="h-6 w-6 mx-auto mb-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">No callbacks due</p>
            </div>
          ) : (
            <div className="p-2">
              {allCallbacks.map((callback) => (
                <div
                  key={callback.id}
                  className={`p-3 mb-2 rounded-lg border ${
                    callback.is_overdue
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {callback.is_overdue ? (
                          <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {callback.lead_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mb-2">
                        <svg className="h-3 w-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="text-xs text-gray-600">{callback.lead_phone}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {formatTime(callback.scheduled_time)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        console.log('🔍 CallbackAlert: View Lead clicked for callback:', callback);
                        // Scroll to the lead card in the dashboard
                        const leadCard = document.querySelector(`[data-lead-id="${callback.lead || callback.lead_id || callback.id}"]`);
                        if (leadCard) {
                          leadCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Highlight the card temporarily
                          leadCard.classList.add('ring-4', 'ring-blue-500', 'ring-opacity-50');
                          setTimeout(() => {
                            leadCard.classList.remove('ring-4', 'ring-blue-500', 'ring-opacity-50');
                          }, 3000);
                        }
                        onCallbackClick(callback);
                      }}
                      className="flex-shrink-0 ml-2 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      View Lead
                    </button>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => {
                        window.open(`tel:${callback.lead_phone}`, '_self');
                        updateCallbackStatus(callback.id, 'completed'); // Mark as completed after calling
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg> Call
                    </button>
                    <button
                      onClick={() => updateCallbackStatus(callback.id, 'completed')}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg> Complete
                    </button>
                    <button
                      onClick={() => updateCallbackStatus(callback.id, 'no_answer')}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg> No Answer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallbackAlert;