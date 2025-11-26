import React, { useState } from 'react';
import { Lead } from '../types';
import { formatDateSafe, formatDateShortSafe } from '../utils/dateUtils';
import QualifierLeadModal from './QualifierLeadModal';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ 
  lead, 
  isOpen, 
  onClose, 
  userRole,
  onLeadUpdated 
}) => {
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{type: string, src: string} | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  
  if (!isOpen || !lead) return null;

  // Sanitize notes to avoid duplicated detailed sections
  const sanitizeNotes = (notes?: string) => {
    if (!notes) return '';
    const marker = '--- DETAILED LEAD INFORMATION ---';
    const idx = notes.indexOf(marker);
    if (idx === -1) return notes;
    const before = notes.substring(0, idx).trim();
    const after = notes.substring(idx);
    // Split by marker and keep only the first detailed block
    const parts = after.split(marker).filter(Boolean);
    const firstDetails = parts.length > 0 ? parts[0].trim() : '';
    const rebuilt = `${before ? before + '\n\n' : ''}${marker}\n${firstDetails}`.trim();
    return rebuilt;
  };

  const openPhotoModal = (type: string, src: string) => {
    setSelectedPhoto({ type, src });
    setShowPhotoModal(true);
  };

  const handleSendAppointmentEmail = async () => {
    if (!lead.email) {
      toast.error('No email address available for this lead');
      return;
    }

    if (!lead.appointment_date) {
      toast.error('No appointment date set for this lead');
      return;
    }

    try {
      setEmailLoading(true);
      
      // Extract time from appointment_date if it exists
      const appointmentDateTime = new Date(lead.appointment_date);
      const appointmentTime = appointmentDateTime.toTimeString().slice(0, 5); // HH:MM format
      
      await leadsAPI.sendAppointmentEmail(
        lead.id,
        lead.appointment_date,
        appointmentTime,
        lead.notes || ''
      );
      
      toast.success('Appointment confirmation email sent successfully!');
      
    } catch (error: any) {
      toast.error('Failed to send appointment email');
    } finally {
      setEmailLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'cold_call': 'bg-gray-100 text-gray-800',
      'interested': 'bg-blue-100 text-blue-800',
      'sent_to_kelly': 'bg-green-100 text-green-800',
      'qualified': 'bg-green-100 text-green-800',
      'appointment_set': 'bg-purple-100 text-purple-800',
      'appointment_completed': 'bg-yellow-100 text-yellow-800',
      'sale_made': 'bg-green-100 text-green-800',
      'sale_lost': 'bg-red-100 text-red-800',
      'not_interested': 'bg-red-100 text-red-800',
      'tenant': 'bg-orange-100 text-orange-800',
      'other_disposition': 'bg-gray-100 text-gray-800',
      'no_contact': 'bg-gray-100 text-gray-800',
      'blow_out': 'bg-red-100 text-red-800',
      'callback': 'bg-yellow-100 text-yellow-800',
      'pass_back_to_agent': 'bg-blue-100 text-blue-800',
      'on_hold': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status: string) => {
    const names: { [key: string]: string } = {
      'cold_call': 'Cold Call',
      'interested': 'Interested',
      'sent_to_kelly': 'Sent to Qualifier',
      'qualified': 'Qualified',
      'appointment_set': 'Appointment Set',
      'appointment_completed': 'Completed',
      'sale_made': 'Sale Made',
      'sale_lost': 'Sale Lost',
      'not_interested': 'Not Interested',
      'tenant': 'Tenant',
      'other_disposition': 'Other',
      'no_contact': 'No Contact',
      'blow_out': 'Blow Out',
      'callback': 'Call Back',
      'pass_back_to_agent': 'Pass Back',
      'on_hold': 'On Hold',
    };
    return names[status] || status;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {lead.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{lead.full_name}</h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(lead.status)}`}>
                    {getStatusDisplayName(lead.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ID: #{lead.id}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <p className="text-gray-900 font-mono">{lead.phone}</p>
              </div>
              {lead.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="text-gray-900">{lead.email}</p>
                </div>
              )}
              {lead.address1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{lead.address1}</p>
                </div>
              )}
              {lead.city && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <p className="text-gray-900">{lead.city}</p>
                </div>
              )}
              {lead.postal_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <p className="text-gray-900">{lead.postal_code}</p>
                </div>
              )}
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lead Details
            </h3>
            <div className="space-y-3">
              {lead.appointment_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                  <p className="text-gray-900">{formatDateSafe(lead.appointment_date)}</p>
                </div>
              )}
              {lead.sale_amount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount</label>
                  <p className="text-green-600 font-semibold">${lead.sale_amount.toLocaleString()}</p>
                </div>
              )}
              {lead.disposition && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disposition</label>
                  <p className="text-gray-900">{lead.disposition}</p>
                </div>
              )}
            </div>
          </div>

          {/* General Notes - show for qualifiers always, or for others if no canvasser data */}
          {lead.notes && (userRole === 'qualifier' || !lead.field_submission_data) && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                General Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{sanitizeNotes(lead.notes)}</p>
            </div>
          )}

          {/* Qualifier's Notes - separate section for qualifier-specific notes */}
          {userRole === 'qualifier' && (
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Qualifier's Notes
              </h3>
              {lead.qualifier_notes ? (
                <p className="text-gray-700 whitespace-pre-wrap">{lead.qualifier_notes}</p>
              ) : (
                <p className="text-gray-500 italic">No qualifier notes yet. Click "Qualify Lead" to add notes.</p>
              )}
            </div>
          )}

          {/* Assignment Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Assignment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Agent</label>
                <p className="text-gray-900">{lead.assigned_agent_name || lead.assigned_agent_username}</p>
              </div>
              {lead.field_sales_rep_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Sales Rep</label>
                  <p className="text-gray-900">{lead.field_sales_rep_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Canvasser Photos Section */}
          {lead.field_submission_data && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <span className="mr-2">📸</span>
                Canvasser Assessment Photos
              </h3>
              <div className="mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Canvasser:</strong> {lead.field_submission_data?.canvasser_name || 'Unknown'}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Assessment Date:</strong> {lead.field_submission_data?.assessment_date || 'Unknown'} at {lead.field_submission_data?.assessment_time || 'Unknown'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Front Roof Photo */}
                {lead.field_submission_data?.photos?.frontRoof && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">🏠 Front Roof</h4>
                    <img
                      src={lead.field_submission_data.photos.frontRoof}
                      alt="Front Roof"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openPhotoModal('Front Roof', lead.field_submission_data!.photos.frontRoof)}
                    />
                  </div>
                )}
                
                {/* Rear Roof Photo */}
                {lead.field_submission_data?.photos?.rearRoof && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">🏡 Rear Roof</h4>
                    <img
                      src={lead.field_submission_data.photos.rearRoof}
                      alt="Rear Roof"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openPhotoModal('Rear Roof', lead.field_submission_data!.photos.rearRoof)}
                    />
                  </div>
                )}
                
                {/* Side Roof Photo */}
                {lead.field_submission_data?.photos?.sideRoof && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">🏘️ Side Roof</h4>
                    <img
                      src={lead.field_submission_data.photos.sideRoof}
                      alt="Side Roof"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openPhotoModal('Side Roof', lead.field_submission_data!.photos.sideRoof)}
                    />
                  </div>
                )}
                
                {/* Energy Bill Photo */}
                {lead.field_submission_data?.photos?.energyBill && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">⚡ Energy Bill</h4>
                    <img
                      src={lead.field_submission_data.photos.energyBill}
                      alt="Energy Bill"
                      className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openPhotoModal('Energy Bill', lead.field_submission_data!.photos.energyBill)}
                    />
                  </div>
                )}
              </div>
              
              {/* Additional Photos */}
              {lead.field_submission_data?.photos?.additional && lead.field_submission_data.photos.additional.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-blue-900 mb-2">📷 Additional Photos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {lead.field_submission_data.photos.additional.map((photo: string, index: number) => (
                      photo && (
                        <div key={index} className="bg-white rounded-lg p-2 border border-green-200">
                          <img
                            src={photo}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openPhotoModal(`Additional ${index + 1}`, photo)}
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Signature */}
              {lead.field_submission_data?.signature && (
                <div className="mt-4 bg-white rounded-lg p-3 border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">✍️ Customer Signature</h4>
                  <img
                    src={lead.field_submission_data.signature}
                    alt="Customer Signature"
                    className="w-full h-20 object-contain rounded cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openPhotoModal('Signature', lead.field_submission_data!.signature)}
                  />
                </div>
              )}
              
              {/* Detailed Notes */}
              <div className="mt-4 bg-white rounded-lg p-3 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📝 Assessment Details</h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {lead.field_submission_data?.formatted_notes || 'No assessment details available'}
                </pre>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-gray-900">{formatDateShortSafe(lead.created_at)}</span>
              </div>
              {lead.updated_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">{formatDateShortSafe(lead.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            {lead.appointment_date && lead.email && (
              <button
                onClick={handleSendAppointmentEmail}
                disabled={emailLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading ? 'Sending...' : '📧 Send Email'}
              </button>
            )}
            {userRole === 'qualifier' && (
            <button
              onClick={() => setShowQualifyModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Qualify Lead
            </button>
            )}
          </div>
        </div>
      </div>

      {/* Qualify Lead Modal */}
      {showQualifyModal && (
        <QualifierLeadModal
          lead={lead}
          onClose={() => setShowQualifyModal(false)}
          onSuccess={() => {
            if (onLeadUpdated && lead) {
              // Refetch the lead to get updated data
              leadsAPI.getLead(lead.id).then((updatedLead) => {
                onLeadUpdated(updatedLead);
              }).catch(() => {
                // If refetch fails, just close the modal
                onLeadUpdated(lead);
              });
            }
            setShowQualifyModal(false);
          }}
        />
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                📸 {selectedPhoto.type} - {lead.full_name}
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.type}
                className="w-full h-auto max-h-96 object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailsModal;
