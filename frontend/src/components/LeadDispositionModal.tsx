import React, { useState } from 'react';
import { Lead, LeadDispositionForm } from '../types';

interface LeadDispositionModalProps {
  lead: Lead;
  onUpdate: (disposition: LeadDispositionForm) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const LeadDispositionModal: React.FC<LeadDispositionModalProps> = ({ 
  lead, 
  onUpdate, 
  onClose, 
  loading = false 
}) => {
  const [formData, setFormData] = useState<LeadDispositionForm>({
    status: 'not_interested',
    disposition: 'not_interested',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onUpdate(formData);
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const getDispositionOptions = (status: string) => {
    switch (status) {
      case 'not_interested':
        return [
          { value: 'not_interested', label: 'Not Interested' },
          { value: 'do_not_call', label: 'Do Not Call' },
          { value: 'callback_requested', label: 'Callback Requested' },
        ];
      case 'tenant':
        return [
          { value: 'tenant', label: 'Tenant' },
        ];
      case 'other_disposition':
        return [
          { value: 'wrong_number', label: 'Wrong Number' },
          { value: 'no_answer', label: 'No Answer' },
          { value: 'other', label: 'Other' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Update Lead Disposition: {lead.full_name}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                disabled={loading}
              >
                <option value="not_interested">Not Interested</option>
                <option value="tenant">Tenant</option>
                <option value="other_disposition">Other Disposition</option>
              </select>
            </div>

            {formData.status !== 'interested' && (
              <div>
                <label htmlFor="disposition" className="block text-sm font-medium text-gray-700">
                  Disposition
                </label>
                <select
                  id="disposition"
                  name="disposition"
                  value={formData.disposition}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  disabled={loading}
                >
                  {getDispositionOptions(formData.status).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Add any additional notes about the call"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Disposition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadDispositionModal;
