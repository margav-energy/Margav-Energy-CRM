import React, { useState } from 'react';
import { Lead, CallbackForm } from '../types';

interface CallbackSchedulerProps {
  lead?: Lead;
  leadData?: {
    full_name: string;
    phone: string;
    email?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (callbackData: CallbackForm) => Promise<void>;
}

const CallbackScheduler: React.FC<CallbackSchedulerProps> = ({
  lead,
  leadData,
  isOpen,
  onClose,
  onSchedule
}) => {
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Set default time to 1 hour from now
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const defaultTime = now.toISOString().slice(0, 16);
      setScheduledTime(defaultTime);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledTime) {
      alert('Please select a scheduled time');
      return;
    }

    setLoading(true);
    try {
      // For new leads, we'll need to create the lead first, then schedule callback
      // This will be handled by the parent component
      await onSchedule({
        lead: lead?.id ? Number(lead.id) : 0, // Ensure it's always a number
        scheduled_time: scheduledTime,
        notes: notes
      });
      
      // Reset form
      setScheduledTime('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to schedule callback:', error);
      alert('Failed to schedule callback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setScheduledTime('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            📞 Schedule Callback
          </h3>
          <p className="text-sm text-gray-600">
            Schedule a callback for {lead?.full_name || leadData?.full_name || 'this lead'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Lead Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Lead Details</h4>
            <div className="text-sm text-gray-600">
              <p><strong>Name:</strong> {lead?.full_name || leadData?.full_name || 'Not provided'}</p>
              <p><strong>Phone:</strong> {lead?.phone || leadData?.phone || 'Not provided'}</p>
              <p><strong>Email:</strong> {lead?.email || leadData?.email || 'Not provided'}</p>
            </div>
          </div>

          {/* Scheduled Time */}
          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Time *
            </label>
            <input
              type="datetime-local"
              id="scheduledTime"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use your local timezone. The system will handle timezone conversion automatically.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Callback Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about the callback..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !scheduledTime}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </div>
              ) : (
                'Schedule Callback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallbackScheduler;
