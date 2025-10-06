import React from 'react';
import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
  onUpdate?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  showActions?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onUpdate, onDelete, showActions = true }) => {
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'interested': 'bg-emerald-100 text-emerald-700',
      'not_interested': 'bg-red-100 text-red-700',
      'qualified': 'bg-blue-100 text-blue-700',
      'appointment_set': 'bg-purple-100 text-purple-700',
      'sent_to_kelly': 'bg-amber-100 text-amber-700',
      'cold_call': 'bg-gray-100 text-gray-700',
      'appointment_completed': 'bg-green-100 text-green-700',
      'sale_made': 'bg-green-100 text-green-700',
      'sale_lost': 'bg-red-100 text-red-700',
      'no_contact': 'bg-gray-100 text-gray-700',
      'blow_out': 'bg-red-100 text-red-700',
      'callback': 'bg-yellow-100 text-yellow-700',
      'pass_back_to_agent': 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusDisplayName = (status: string) => {
    const names: { [key: string]: string } = {
      'interested': 'Interested',
      'not_interested': 'Not Interested',
      'qualified': 'Qualified',
      'appointment_set': 'Appointment Set',
      'sent_to_kelly': 'Sent to Kelly',
      'cold_call': 'Cold Call',
      'appointment_completed': 'Appointment Completed',
      'sale_made': 'Sale Made',
      'sale_lost': 'Sale Lost',
      'no_contact': 'No Contact',
      'blow_out': 'Blow Out',
      'callback': 'Callback',
      'pass_back_to_agent': 'Pass Back to Agent',
    };
    return names[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {lead.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{lead.full_name}</h3>
            <p className="text-xs text-gray-500">{lead.phone}</p>
            {/* Status badge under the name */}
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                {getStatusDisplayName(lead.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {/* Contact info */}
        <div className="space-y-2 mb-3">
          {lead.email && (
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {lead.appointment_date && (
            <div className="flex items-center text-xs text-indigo-600">
              <svg className="w-3 h-3 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Appointment: {formatDate(lead.appointment_date)}</span>
            </div>
          )}
        </div>

        {/* Notes preview */}
        {lead.notes && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {lead.notes.length > 100 ? `${lead.notes.substring(0, 100)}...` : lead.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{lead.assigned_agent_name || lead.assigned_agent_username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDateShort(lead.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (onUpdate || onDelete) && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex space-x-2">
          {onUpdate && (
            <button
              onClick={() => onUpdate(lead)}
              className="flex-1 bg-white text-gray-700 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(lead)}
              className="flex-1 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors font-medium"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadCard;
