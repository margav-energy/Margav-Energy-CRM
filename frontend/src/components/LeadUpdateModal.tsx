import React, { useState } from 'react';
import { Lead, LeadUpdateForm } from '../types';

interface LeadUpdateModalProps {
  lead: Lead;
  onUpdate: (id: number, data: LeadUpdateForm) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const LeadUpdateModal: React.FC<LeadUpdateModalProps> = ({ 
  lead, 
  onUpdate, 
  onClose, 
  loading = false 
}) => {
  // Helper function to convert date to datetime-local format
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      // Convert to local timezone and format for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const [formData, setFormData] = useState<LeadUpdateForm>({
    status: lead.status,
    notes: lead.notes || '',
    appointment_date: lead.appointment_date ? formatDateForInput(lead.appointment_date) : '',
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
      const updateData: LeadUpdateForm = {
        status: formData.status,
        notes: formData.notes,
      };

      // Only include appointment_date if status is appointment_set
      if (formData.status === 'appointment_set' && formData.appointment_date) {
        try {
          const date = new Date(formData.appointment_date);
          if (!isNaN(date.getTime())) {
            updateData.appointment_date = date.toISOString();
          }
        } catch (error) {
          console.error('Invalid date format:', error);
        }
      }

      await onUpdate(lead.id, updateData);
      onClose();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Update Lead: {lead.full_name}
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={loading}
              >
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
                <option value="qualified">Qualified</option>
                <option value="appointment_set">Appointment Set</option>
              </select>
            </div>

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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter any additional notes"
                disabled={loading}
              />
            </div>

            {formData.status === 'appointment_set' && (
              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700">
                  Appointment Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="appointment_date"
                  name="appointment_date"
                  value={formData.appointment_date || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={loading}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadUpdateModal;
