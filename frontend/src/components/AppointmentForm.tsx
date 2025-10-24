import React, { useState } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';

interface AppointmentFormProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ lead, onClose, onSuccess }) => {
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentDate || !appointmentTime) {
      toast.error('Please select both date and time');
      return;
    }

    try {
      setLoading(true);
      
      // Combine date and time
      const appointmentDateTime = `${appointmentDate}T${appointmentTime}`;
      
      // Update the lead with appointment date
      await leadsAPI.updateLead(lead.id, {
        appointment_date: appointmentDateTime,
        status: 'appointment_set'
      });
      
      // Send email if requested and lead has email
      if (sendEmail && lead.email) {
        try {
          await leadsAPI.sendAppointmentEmail(
            lead.id,
            appointmentDateTime,
            appointmentTime,
            notes
          );
          toast.success('Appointment scheduled and confirmation email sent!');
        } catch (emailError) {
          toast.warning('Appointment scheduled but failed to send email');
        }
      } else if (sendEmail && !lead.email) {
        toast.warning('Appointment scheduled but no email address available');
      } else {
        toast.success('Appointment scheduled successfully!');
      }
      
      onSuccess();
      onClose();
      
    } catch (error) {
      toast.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Schedule Appointment</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="appointmentDate"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">
              Time
            </label>
            <input
              type="time"
              id="appointmentTime"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              placeholder="Any additional notes for the appointment..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
              Send confirmation email to {lead.email || 'customer'}
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
