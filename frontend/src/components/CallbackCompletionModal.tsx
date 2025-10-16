import React, { useState } from 'react';
import { Callback } from '../types';
import { callbacksAPI } from '../api';

interface CallbackCompletionModalProps {
  callback: Callback;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const CallbackCompletionModal: React.FC<CallbackCompletionModalProps> = ({ 
  callback, 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const handleComplete = async () => {
    try {
      setLoading(true);
      
      // Update callback status to completed
      await callbacksAPI.updateCallback(callback.id, {
        status: 'completed',
        notes: notes.trim() || callback.notes,
        completed_at: new Date().toISOString()
      });
      
      onComplete();
      onClose();
    } catch (error) {
      alert('Failed to complete callback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Complete Callback
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Lead:</strong> {callback.lead_name}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Phone:</strong> {callback.lead_phone}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Scheduled for:</strong> {new Date(callback.scheduled_time).toLocaleString()}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="completion-notes" className="block text-sm font-medium text-gray-700 mb-2">
            Completion Notes (Optional)
          </label>
          <textarea
            id="completion-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Add any notes about the callback completion..."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completing...
              </div>
            ) : (
              'Mark as Complete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallbackCompletionModal;

