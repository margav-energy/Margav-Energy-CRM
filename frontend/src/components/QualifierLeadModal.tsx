import React, { useState } from 'react';
import { Lead, LeadUpdateForm } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface QualifierLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

const QualifierLeadModal: React.FC<QualifierLeadModalProps> = ({
  lead,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  
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
      return '';
    }
  };
  
  const [formData, setFormData] = useState<LeadUpdateForm>({
    status: lead.status,
    notes: lead.notes || '',
    appointment_date: lead.appointment_date ? formatDateForInput(lead.appointment_date) : '',
    field_sales_rep: lead.field_sales_rep || null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate appointment date is required when status is appointment_set
    if (formData.status === 'appointment_set' && !formData.appointment_date) {
      toast.error('Please select an appointment date and time');
      return;
    }
    
    try {
      setLoading(true);
      
      // Debug: Log the form data being sent
      
      // Clean up form data before sending
      const cleanFormData = {
        ...formData,
        appointment_date: formData.appointment_date ? (() => {
          try {
            const date = new Date(formData.appointment_date);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          } catch (error) {
          }
          return null;
        })() : null,
        field_sales_rep: formData.field_sales_rep || null,
      };
      
      
      // Update the lead with qualification data
      const response = await leadsAPI.qualifyLead(lead.id, cleanFormData);
      
      // Check if Google Calendar sync failed
      if (formData.status === 'appointment_set' && !response.calendar_synced) {
        toast.warning('Lead qualified successfully, but Google Calendar sync failed. The appointment may not appear in the calendar.', {
          autoClose: 8000,
          position: 'top-right'
        });
      } else {
        toast.success('Lead qualified successfully!');
      }
      
      // Call onSuccess after a short delay to allow toast to be visible
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error) {
      toast.error('Failed to qualify lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'field_sales_rep' ? (value ? parseInt(value) : null) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Qualify Lead - {lead.full_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review and qualify lead from {lead.assigned_agent_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Qualifier: {user?.first_name} {user?.last_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Lead Information Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Lead Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span> {lead.full_name}
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span> {lead.phone}
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span> {lead.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Agent:</span> {lead.assigned_agent_name}
              </div>
              <div>
                <span className="font-medium text-gray-700">Address:</span> {lead.address1 || 'N/A'}
              </div>
              <div>
                <span className="font-medium text-gray-700">Postcode:</span> {lead.postal_code || 'N/A'}
              </div>
            </div>
            {lead.notes && (
              <div className="mt-3">
                <span className="font-medium text-gray-700">Lead Sheet Details:</span>
                <div className="mt-1 text-sm text-gray-600 bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{lead.notes}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Qualification Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="sent_to_kelly">📋 Sent to Kelly (Current)</option>
                  <option value="no_contact">📞 No Contact</option>
                  <option value="blow_out">💨 Blow Out</option>
                  <option value="appointment_set">📅 Appointment Set</option>
                  <option value="not_interested">❌ Not Interested</option>
                  <option value="pass_back_to_agent">↩️ Pass Back to Agent</option>
                  <option value="on_hold">⏸️ On Hold</option>
        <option value="qualifier_callback">📞 Qualifier Callback</option>
                </select>
              </div>

              {/* Field Sales Rep */}
              {formData.status === 'qualified' && (
                <div>
                  <label htmlFor="field_sales_rep" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Field Sales Rep
                  </label>
                  <select
                    id="field_sales_rep"
                    name="field_sales_rep"
                    value={formData.field_sales_rep || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select sales rep...</option>
                    <option value="7">Sales Rep 1</option>
                    <option value="8">Sales Rep 2</option>
                  </select>
                </div>
              )}
            </div>

            {/* Appointment Date */}
            {formData.status === 'appointment_set' && (
              <div>
                <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Appointment
                </label>
                <input
                  type="datetime-local"
                  id="appointment_date"
                  name="appointment_date"
                  value={formData.appointment_date || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            )}

            {/* Qualification Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Qualification Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add notes about the qualification process..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-margav-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  (() => {
                    switch (formData.status) {
                      case 'qualified':
                        return 'Set as Qualified';
                      case 'no_contact':
                        return 'Mark as No Contact';
                      case 'blow_out':
                        return 'Mark as Blow Out';
                      case 'callback':
                        return 'Schedule Callback';
                      case 'pass_back_to_agent':
                        return 'Pass Back to Agent';
                      default:
                        return 'Update Lead Status';
                    }
                  })()
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QualifierLeadModal;
