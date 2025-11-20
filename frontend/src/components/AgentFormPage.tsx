import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LeadForm as LeadFormType } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import LeadForm from './LeadForm';

/**
 * Standalone Agent Form Page
 * 
 * This page is designed to be accessed directly from the dialer system.
 * When an agent clicks "Interested", the dialer redirects here with URL parameters.
 * 
 * URL Parameters from Dialer:
 * - data_list_name: Name of the data list/campaign
 * - first_name: Contact's first name
 * - last_name: Contact's last name
 * - email: Contact's email
 * - phone: Contact's phone number
 * - postcode: Contact's postcode
 * - agent: Agent's display name (used to find the agent)
 * - source: Source/campaign name
 */
const AgentFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formLoading, setFormLoading] = useState(false);

  // Extract parameters from URL
  const dataListName = searchParams.get('data_list_name') || '';
  const firstName = searchParams.get('first_name') || '';
  const lastName = searchParams.get('last_name') || '';
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const postcode = searchParams.get('postcode') || '';
  const agentDisplayName = searchParams.get('agent') || '';
  const source = searchParams.get('source') || '';

  // Build full name from first and last name
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  // Build prepopulated data for the form
  const prepopulatedData = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    phone: phone,
    email: email,
    postal_code: postcode,
    postcode: postcode,
    // Store dialer metadata in notes
    notes: [
      source && `Source: ${source}`,
      dataListName && `Data List: ${dataListName}`,
      agentDisplayName && `Agent: ${agentDisplayName}`
    ].filter(Boolean).join('\n'),
    // Store campaign/source info
    campaign: source || dataListName,
    user: agentDisplayName, // This will be used to find the agent
  };

  // Helper function to add dialer metadata
  const addDialerMetadata = (leadData: LeadFormType) => {
    const dialerInfo = [
      source && `Source: ${source}`,
      dataListName && `Data List: ${dataListName}`,
      agentDisplayName && `Dialer Agent: ${agentDisplayName}`
    ].filter(Boolean).join('\n');

    return {
      ...leadData,
      // Add dialer info to notes (campaign field is not in LeadCreateSerializer, so we store it in notes)
      notes: leadData.notes 
        ? `${leadData.notes}\n\n--- Dialer Information ---\n${dialerInfo}`
        : `--- Dialer Information ---\n${dialerInfo}`,
    };
  };

  // Handle form submission (create lead normally)
  const handleSubmit = async (leadData: LeadFormType) => {
    try {
      setFormLoading(true);

      const leadDataWithMetadata = addDialerMetadata(leadData);

      // Create the lead via API
      // Note: Lead will be automatically assigned to the current logged-in user
      await leadsAPI.createLead(leadDataWithMetadata);

      toast.success('Lead created successfully!');
      
      // Redirect to agent dashboard after a short delay
      setTimeout(() => {
        navigate('/agent-dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      console.error('Error response:', error.response?.data);
      
      // Show detailed error message
      let errorMessage = 'Failed to create lead';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.phone) {
          errorMessage = `Phone: ${errorData.phone}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ');
        } else {
          // Format validation errors
          const errors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMessage = errors || 'Validation error';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle sending to qualifier (create lead with sent_to_kelly status)
  const handleSendToQualifier = async (leadData: LeadFormType) => {
    try {
      setFormLoading(true);

      const leadDataWithMetadata = addDialerMetadata(leadData);

      // Create lead with status 'sent_to_kelly' to send directly to qualifier
      // Only include fields that LeadCreateSerializer accepts
      const leadDataWithStatus: LeadFormType = {
        full_name: leadDataWithMetadata.full_name,
        phone: leadDataWithMetadata.phone,
        email: leadDataWithMetadata.email,
        address1: leadDataWithMetadata.address1,
        city: leadDataWithMetadata.city,
        postal_code: leadDataWithMetadata.postal_code,
        notes: leadDataWithMetadata.notes,
        status: 'sent_to_kelly',
        // Energy fields
        energy_bill_amount: leadDataWithMetadata.energy_bill_amount,
        has_ev_charger: leadDataWithMetadata.has_ev_charger,
        day_night_rate: leadDataWithMetadata.day_night_rate,
        has_previous_quotes: leadDataWithMetadata.has_previous_quotes,
        previous_quotes_details: leadDataWithMetadata.previous_quotes_details,
        // Contact info
        preferred_contact_time: leadDataWithMetadata.preferred_contact_time,
        // Property info
        property_ownership: leadDataWithMetadata.property_ownership,
      };

      // Remove undefined/null/empty values
      Object.keys(leadDataWithStatus).forEach(key => {
        const value = (leadDataWithStatus as any)[key];
        if (value === undefined || value === null || value === '') {
          delete (leadDataWithStatus as any)[key];
        }
      });

      console.log('Sending lead data to create:', leadDataWithStatus);

      // Create the lead via API
      // Note: Lead will be automatically assigned to the current logged-in user
      await leadsAPI.createLead(leadDataWithStatus);

      toast.success('Lead created and sent to qualifier!');
      
      // Redirect to agent dashboard after a short delay
      setTimeout(() => {
        navigate('/agent-dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      console.error('Error response:', error.response?.data);
      
      // Show detailed error message
      let errorMessage = 'Failed to create lead';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.phone) {
          errorMessage = `Phone: ${Array.isArray(errorData.phone) ? errorData.phone.join(', ') : errorData.phone}`;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ')
            : errorData.non_field_errors;
        } else {
          // Format validation errors
          const errors = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMessage = errors || 'Validation error';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved data will be lost.')) {
      navigate('/agent-dashboard');
    }
  };

  // Check if we have minimum required data
  const hasMinimumData = phone && (fullName || firstName || lastName);

  // Debug: Log URL parameters (remove in production)
  useEffect(() => {
    console.log('AgentFormPage - URL Parameters:', {
      dataListName,
      firstName,
      lastName,
      email,
      phone,
      postcode,
      agentDisplayName,
      source,
      hasMinimumData
    });
  }, [dataListName, firstName, lastName, email, phone, postcode, agentDisplayName, source, hasMinimumData]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Complete Lead Information
          </h1>
          <p className="text-gray-600 mt-2">
            Please complete the form below with the customer's information
          </p>
          
          {/* Show prepopulated info */}
          {hasMinimumData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Pre-filled from dialer:</strong> {fullName || 'Customer'} - {phone}
                {email && ` - ${email}`}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        {hasMinimumData ? (
          <LeadForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={formLoading}
            prepopulatedData={prepopulatedData}
            onSendToQualifier={handleSendToQualifier}
          />
        ) : (
          <div className="card-margav p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Missing required information from dialer. Please ensure the dialer is sending:
              </p>
              <ul className="text-left list-disc list-inside text-gray-600 space-y-1">
                <li>Phone number</li>
                <li>First name or last name (or both)</li>
              </ul>
              <button
                onClick={() => navigate('/agent-dashboard')}
                className="mt-6 btn-margav-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentFormPage;

