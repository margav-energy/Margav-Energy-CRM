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
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [fieldSalesRep, setFieldSalesRep] = useState<number | null>(null);
  const [fieldSalesReps, setFieldSalesReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNotes(lead.notes || '');
      setFieldSalesRep(lead.field_sales_rep || null);
      // Format existing appointment date for datetime-local input
      if (lead.appointment_date) {
        try {
          const date = new Date(lead.appointment_date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          setAppointmentDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        } catch (error) {
          console.error('Error formatting appointment date:', error);
          setAppointmentDate('');
        }
      } else {
        setAppointmentDate('');
      }
    }
  }, [lead]);

  // Fetch field sales reps
  React.useEffect(() => {
    const fetchFieldSalesReps = async () => {
      try {
        // For now, use hardcoded list. In a real app, fetch from API
        setFieldSalesReps([
          { id: 1, name: 'John Smith' },
          { id: 2, name: 'Jane Doe' },
          { id: 3, name: 'Mike Johnson' }
        ]);
      } catch (error) {
        console.error('Failed to fetch field sales reps:', error);
      }
    };
    
    if (isOpen) {
      fetchFieldSalesReps();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    // Validate appointment date is required when status is appointment_set
    if (status === 'appointment_set' && !appointmentDate) {
      toast.error('Please select an appointment date and time');
      return;
    }

    setLoading(true);
    try {
      // Prepare form data
      const formData: any = {
        status: status as Lead['status'],
        notes: notes
      };

      // Add field sales rep if selected
      if (fieldSalesRep) {
        formData.field_sales_rep = fieldSalesRep;
      }

      // Add appointment date if provided
      if (appointmentDate) {
        try {
          const date = new Date(appointmentDate);
          if (!isNaN(date.getTime())) {
            formData.appointment_date = date.toISOString();
          }
        } catch (error) {
          console.error('Invalid appointment date format:', error);
        }
      }

      const response = await leadsAPI.qualifyLead(lead.id, formData);
      
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
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Review & Qualify Lead</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Review lead details and update status for {lead.full_name}</p>
        </div>

        <div className="flex">
          {/* Lead Review Section */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h3>
            
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Status</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded capitalize">{lead.status?.replace('_', ' ')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.address1 || 'Not provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.city || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postcode</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.postal_code || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded min-h-[60px]">{lead.notes || 'No notes available'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Agent</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.assigned_agent_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field Sales Rep</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{lead.field_sales_rep_name || 'Not assigned'}</p>
                </div>
              </div>

              {lead.appointment_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Appointment</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(lead.appointment_date).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {lead.created_at ? new Date(lead.created_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {lead.updated_at ? new Date(lead.updated_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualification Section */}
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Qualification</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
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
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Add any additional notes about this lead..."
                />
              </div>

              {/* Field Sales Rep Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Field Sales Rep (Optional)
                </label>
                <select
                  value={fieldSalesRep || ''}
                  onChange={(e) => setFieldSalesRep(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a field sales rep</option>
                  {fieldSalesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Date - only show when appointment_set is selected */}
              {status === 'appointment_set' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Appointment *
                  </label>
                  <input
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This appointment will be synced to Google Calendar</p>
                </div>
              )}

              {/* Special handling for no contact */}
              {status === 'no_contact' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">No Contact Selected</p>
                      <p className="text-xs text-yellow-700">This lead will be moved to the "No Contact" column for follow-up.</p>
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
      </div>
    </div>
  );
};

export default QualifyLeadModal;
