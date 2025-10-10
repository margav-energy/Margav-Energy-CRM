import React, { useState } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';

interface QualifyLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

const QualifyLeadModal: React.FC<QualifyLeadModalProps> = ({ 
  lead, 
  isOpen, 
  onClose, 
  onLeadUpdated 
}) => {
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNotes(lead.notes || '');
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      const response = await leadsAPI.qualifyLead(lead.id, {
        status: status as Lead['status'],
        notes: notes
      });
      
      // The API returns { lead: Lead, notification: {...}, calendar_synced: boolean }
      const updatedLead = response.lead;
      onLeadUpdated(updatedLead);
      toast.success('Lead status updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead status');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  const statusOptions = [
    { value: 'qualified', label: 'Qualified', color: 'text-green-600' },
    { value: 'appointment_set', label: 'Appointment Set', color: 'text-purple-600' },
    { value: 'no_contact', label: 'No Contact', color: 'text-yellow-600' },
    { value: 'not_interested', label: 'Not Interested', color: 'text-red-600' },
    { value: 'blow_out', label: 'Blow Out', color: 'text-red-600' },
    { value: 'pass_back_to_agent', label: 'Pass Back to Agent', color: 'text-blue-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Qualify Lead</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Update the status for {lead.full_name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select a status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Add any additional notes about this lead..."
            />
          </div>

          {/* Special handling for no contact */}
          {status === 'no_contact' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-800 font-medium">No Contact Selected</p>
                  <p className="text-xs text-yellow-700">This lead will be moved to the "Callback Required" column for follow-up.</p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !status}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QualifyLeadModal;
