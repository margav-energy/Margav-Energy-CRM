import React, { useState, useEffect } from 'react';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: {
    id: number;
    full_name: string;
    phone: string;
  };
  formData?: {
    full_name: string;
    phone: string;
    email?: string;
    address?: string;
    postcode?: string;
  };
  onSchedule: (callbackData: CallbackData) => void;
}

interface CallbackData {
  lead?: number;
  scheduled_time: string;
  notes: string;
  lead_name?: string;
  lead_phone?: string;
  callback_date?: string;
  callback_time?: string;
}

const CallbackModal: React.FC<CallbackModalProps> = ({ isOpen, onClose, lead, formData: leadFormData, onSchedule }) => {
  const [formData, setFormData] = useState<CallbackData>({
    lead: lead?.id,
    scheduled_time: '',
    notes: '',
    lead_name: lead?.full_name || leadFormData?.full_name || '',
    lead_phone: lead?.phone || leadFormData?.phone || '',
    callback_date: '',
    callback_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when props change
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        lead: lead?.id,
        scheduled_time: prev.scheduled_time,
        notes: prev.notes,
        lead_name: lead?.full_name || leadFormData?.full_name || '',
        lead_phone: lead?.phone || leadFormData?.phone || '',
        callback_date: prev.callback_date,
        callback_time: prev.callback_time,
      }));
    }
  }, [isOpen, lead, leadFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.callback_date || !formData.callback_time) {
      alert('Please select both date and time for the callback');
      return;
    }

    // Combine date and time into scheduled_time with timezone
    const scheduledDateTime = `${formData.callback_date}T${formData.callback_time}:00+01:00`; // UK timezone
    const callbackData = {
      lead: formData.lead,
      scheduled_time: scheduledDateTime,
      notes: formData.notes,
      lead_name: formData.lead_name,
      lead_phone: formData.lead_phone
    };

    setIsSubmitting(true);
    try {
      await onSchedule(callbackData);
      setFormData({
        lead: lead?.id,
        scheduled_time: '',
        notes: '',
        lead_name: lead?.full_name || leadFormData?.full_name || '',
        lead_phone: lead?.phone || leadFormData?.phone || '',
        callback_date: '',
        callback_time: '',
      });
      onClose();
    } catch (error) {
      console.error('Error scheduling callback:', error);
      alert('Failed to schedule callback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Callback</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lead Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Lead Information</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-900 font-medium">{formData.lead_name || lead?.full_name || 'New Lead'}</p>
              <div className="flex items-center space-x-1">
                <svg className="h-3 w-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <p className="text-sm text-gray-600">{formData.lead_phone || lead?.phone || 'Phone not provided'}</p>
              </div>
            </div>
          </div>

          {/* Callback Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="inline h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Date *
              </label>
              <input
                type="date"
                name="callback_date"
                value={formData.callback_date || ''}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="inline h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Time *
              </label>
              <input
                type="time"
                name="callback_time"
                value={formData.callback_time || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Time is in BST (British Summer Time)</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <svg className="inline h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add any notes about this callback..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.callback_date || !formData.callback_time}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Callback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallbackModal;
