import React, { useState, useEffect } from 'react';
import { Lead, LeadForm as LeadFormType, CallbackForm } from '../types';
import CallbackScheduler from './CallbackScheduler';
import { callbacksAPI } from '../api';
import { formatUKPostcode, formatName, formatAddress } from '../utils/formatting';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormType, pendingCallback?: CallbackForm) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  prepopulatedData?: {
    full_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    postcode?: string;
    notes?: string;
    lead_id?: string;
    // Comprehensive dialer data
    dialer_lead_id?: string;
    vendor_id?: string;
    list_id?: string;
    gmt_offset_now?: string;
    phone_code?: string;
    phone_number?: string;
    title?: string;
    first_name?: string;
    middle_initial?: string;
    last_name?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    city?: string;
    state?: string;
    province?: string;
    postal_code?: string;
    country_code?: string;
    gender?: string;
    date_of_birth?: string;
    alt_phone?: string;
    security_phrase?: string;
    comments?: string;
    user?: string;
    campaign?: string;
    phone_login?: string;
    fronter?: string;
    closer?: string;
    group?: string;
    channel_group?: string;
    SQLdate?: string;
    epoch?: string;
    uniqueid?: string;
    customer_zap_channel?: string;
    server_ip?: string;
    SIPexten?: string;
    session_id?: string;
    dialed_number?: string;
    dialed_label?: string;
    rank?: string;
    owner?: string;
    camp_script?: string;
    in_script?: string;
    script_width?: string;
    script_height?: string;
    recording_file?: string;
  };
  onSendToQualifier?: (data: LeadFormType) => Promise<void>;
}

interface ExtendedLeadFormData {
  // Contact Information
  full_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  preferred_contact_time: string;
  
  // Property Information
  property_ownership: string;
  property_type: string;
  number_of_bedrooms: string;
  roof_type: string;
  roof_material: string;
  
  // Energy Usage
  average_monthly_electricity_bill: string;
  energy_bill_amount: string;
  has_ev_charger: string;
  day_night_rate: string;
  current_energy_supplier: string;
  electric_heating_appliances: string;
  energy_details: string;
  
  // Timeframe & Interest
  timeframe: string;
  moving_properties_next_five_years: string;
  timeframe_details: string;
  has_previous_quotes: string;
  previous_quotes_details: string;
  
  // Notes
  notes: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onSubmit, onCancel, loading = false, prepopulatedData, onSendToQualifier }) => {
  // Function to parse notes and extract form data
  const parseNotesData = (notes: string) => {
    const data: Partial<ExtendedLeadFormData> = {};
    
    if (notes) {
      const lines = notes.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // More flexible parsing - handle different formats
        if (trimmedLine.toLowerCase().includes('address:')) {
          data.address = trimmedLine.replace(/address:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('postcode:')) {
          data.postcode = trimmedLine.replace(/postcode:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('postal code:')) {
          data.postcode = trimmedLine.replace(/postal code:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('zip:')) {
          data.postcode = trimmedLine.replace(/zip:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('preferred contact time:')) {
          data.preferred_contact_time = trimmedLine.replace(/preferred contact time:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('property ownership:')) {
          data.property_ownership = trimmedLine.replace(/property ownership:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('property type:')) {
          data.property_type = trimmedLine.replace(/property type:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('number of bedrooms:')) {
          data.number_of_bedrooms = trimmedLine.replace(/number of bedrooms:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('bedrooms:')) {
          data.number_of_bedrooms = trimmedLine.replace(/bedrooms:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('roof type:')) {
          data.roof_type = trimmedLine.replace(/roof type:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('roof material:')) {
          data.roof_material = trimmedLine.replace(/roof material:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('average monthly electricity bill:')) {
          data.average_monthly_electricity_bill = trimmedLine.replace(/average monthly electricity bill:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('electricity bill:')) {
          data.average_monthly_electricity_bill = trimmedLine.replace(/electricity bill:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('current energy supplier:')) {
          data.current_energy_supplier = trimmedLine.replace(/current energy supplier:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('energy supplier:')) {
          data.current_energy_supplier = trimmedLine.replace(/energy supplier:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('electric heating/appliances:')) {
          data.electric_heating_appliances = trimmedLine.replace(/electric heating\/appliances:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('energy details:')) {
          data.energy_details = trimmedLine.replace(/energy details:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('timeframe:')) {
          data.timeframe = trimmedLine.replace(/timeframe:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('moving properties next 5 years:')) {
          data.moving_properties_next_five_years = trimmedLine.replace(/moving properties next 5 years:/i, '').trim();
        } else if (trimmedLine.toLowerCase().includes('timeframe details:')) {
          data.timeframe_details = trimmedLine.replace(/timeframe details:/i, '').trim();
        }
      }
      
      // Extract basic notes (before the detailed information section)
      const detailedSectionIndex = notes.indexOf('--- DETAILED LEAD INFORMATION ---');
      if (detailedSectionIndex > 0) {
        data.notes = notes.substring(0, detailedSectionIndex).trim();
      }
    }
    
    return data;
  };

  const parsedData = lead?.notes ? parseNotesData(lead.notes) : {};
  
  // Function to build full name from dialer components
  const buildFullName = () => {
    if (prepopulatedData?.full_name) return prepopulatedData.full_name;
    if (lead?.full_name) return lead.full_name;
    
    const first = prepopulatedData?.first_name || '';
    const middle = prepopulatedData?.middle_initial || '';
    const last = prepopulatedData?.last_name || '';
    
    const nameParts = [first];
    if (middle) nameParts.push(middle);
    if (last) nameParts.push(last);
    
    return nameParts.join(' ').trim();
  };
  
  // Function to get phone number from dialer data
  const getPhoneNumber = () => {
    if (prepopulatedData?.phone) return prepopulatedData.phone;
    if (lead?.phone) return lead.phone;
    if (prepopulatedData?.phone_number) return prepopulatedData.phone_number;
    return '';
  };
  
  // Function to build address from dialer components
  const buildAddress = () => {
    if (prepopulatedData?.address) return prepopulatedData.address;
    if (lead?.address1) return lead.address1;
    if (parsedData.address) return parsedData.address;
    
    const address1 = prepopulatedData?.address1 || '';
    const address2 = prepopulatedData?.address2 || '';
    const address3 = prepopulatedData?.address3 || '';
    
    const addressParts = [address1, address2, address3].filter(Boolean);
    return addressParts.join(', ');
  };
  
  // Function to get postcode from dialer data
  const getPostcode = () => {
    if (prepopulatedData?.postcode) return prepopulatedData.postcode;
    if (lead?.postal_code) return lead.postal_code;
    if (parsedData.postcode) return parsedData.postcode;
    if (prepopulatedData?.postal_code) return prepopulatedData.postal_code;
    return '';
  };
  
  const [formData, setFormData] = useState<ExtendedLeadFormData>({
    // Contact Information - prioritize prepopulated data
    full_name: buildFullName() || '',
    phone: getPhoneNumber() || '',
    email: prepopulatedData?.email || lead?.email || '',
    address: buildAddress() || '',
    city: prepopulatedData?.city || lead?.city || parsedData.city || '',
    postcode: getPostcode() || '',
    preferred_contact_time: parsedData.preferred_contact_time || '',
    
    // Property Information
    property_ownership: parsedData.property_ownership || '',
    property_type: parsedData.property_type || '',
    number_of_bedrooms: parsedData.number_of_bedrooms || '',
    roof_type: parsedData.roof_type || '',
    roof_material: parsedData.roof_material || '',
    
    // Energy Usage
    average_monthly_electricity_bill: parsedData.average_monthly_electricity_bill || '',
    energy_bill_amount: lead?.energy_bill_amount !== null && lead?.energy_bill_amount !== undefined ? lead.energy_bill_amount.toString() : (parsedData.energy_bill_amount || ''),
    has_ev_charger: lead?.has_ev_charger !== null && lead?.has_ev_charger !== undefined ? lead.has_ev_charger.toString() : (parsedData.has_ev_charger || ''),
    day_night_rate: lead?.day_night_rate || parsedData.day_night_rate || '',
    current_energy_supplier: parsedData.current_energy_supplier || '',
    electric_heating_appliances: parsedData.electric_heating_appliances || '',
    energy_details: parsedData.energy_details || '',
    
    // Timeframe & Interest
    timeframe: parsedData.timeframe || '',
    moving_properties_next_five_years: parsedData.moving_properties_next_five_years || '',
    timeframe_details: parsedData.timeframe_details || '',
    has_previous_quotes: lead?.has_previous_quotes !== null && lead?.has_previous_quotes !== undefined ? lead.has_previous_quotes.toString() : (parsedData.has_previous_quotes || ''),
    previous_quotes_details: lead?.previous_quotes_details || parsedData.previous_quotes_details || '',
    
    // Notes - combine dialer comments with existing notes
    notes: (() => {
      const dialerComments = prepopulatedData?.comments || '';
      const existingNotes = prepopulatedData?.notes || parsedData.notes || '';
      
      if (dialerComments && existingNotes) {
        return `${existingNotes}\n\nDialer Comments: ${dialerComments}`;
      } else if (dialerComments) {
        return `Dialer Comments: ${dialerComments}`;
      } else {
        return existingNotes;
      }
    })(),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showCallbackScheduler, setShowCallbackScheduler] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<CallbackForm | null>(null);

  // Update form data when lead prop changes (for editing)
  useEffect(() => {
    if (lead) {
      const parsedFromLead = lead.notes ? parseNotesData(lead.notes) : {} as any;
      setFormData(prev => ({
        ...prev,
        full_name: lead.full_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.address1 || '',
        city: lead.city || '',
        postcode: lead.postal_code || '',
        // Strip any previous detailed section when editing to avoid duplication
        notes: (parsedFromLead as any).notes || '',
        appointment_date: lead.appointment_date || '',
        energy_bill_amount: lead.energy_bill_amount !== null && lead.energy_bill_amount !== undefined ? lead.energy_bill_amount.toString() : '',
        has_ev_charger: lead.has_ev_charger !== null && lead.has_ev_charger !== undefined ? lead.has_ev_charger.toString() : '',
        day_night_rate: lead.day_night_rate || '',
        has_previous_quotes: lead.has_previous_quotes !== null && lead.has_previous_quotes !== undefined ? lead.has_previous_quotes.toString() : '',
        previous_quotes_details: lead.previous_quotes_details || '',
      }));
    }
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Apply formatting based on field type
    let formattedValue = value;
    if (name === 'full_name') {
      formattedValue = formatName(value);
    } else if (name === 'address1') {
      formattedValue = formatAddress(value);
    } else if (name === 'postal_code') {
      formattedValue = formatUKPostcode(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Only required fields: full_name, phone, and postcode (only validate if we're creating a new lead)
    if (!lead) {
      if (!formData.full_name?.trim()) {
        newErrors.full_name = 'Full name is required';
      }

      if (!formData.phone?.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[+]?[0-9\s\-()]{10,}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      if (!formData.postcode?.trim()) {
        newErrors.postcode = 'Postcode is required';
      }
    }

    // Optional fields - only validate format if provided
    if (formData.email?.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // All other fields are optional - no validation needed

    // Energy bill amount validation (if provided)
    if (formData.energy_bill_amount && isNaN(Number(formData.energy_bill_amount))) {
      newErrors.energy_bill_amount = 'Energy bill amount must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      
      // Show validation summary
      const errorCount = Object.keys(errors).length;
      alert(`Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before submitting the form.`);
      return;
    }

    try {
      // Convert extended form data to basic LeadFormType for API
      const basicFormData: LeadFormType = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        address1: formData.address,
        city: formData.city,
        postal_code: formData.postcode,
        energy_bill_amount: formData.energy_bill_amount ? parseFloat(formData.energy_bill_amount) : undefined,
        has_ev_charger: formData.has_ev_charger === 'true' ? true : formData.has_ev_charger === 'false' ? false : undefined,
        day_night_rate: formData.day_night_rate as 'yes' | 'no' | undefined,
        has_previous_quotes: formData.has_previous_quotes === 'true' ? true : formData.has_previous_quotes === 'false' ? false : undefined,
        previous_quotes_details: formData.previous_quotes_details || undefined,
        // Ensure we don't duplicate an existing detailed section
        notes: `${(formData.notes || '').split('--- DETAILED LEAD INFORMATION ---')[0].trim()}\n\n--- DETAILED LEAD INFORMATION ---\n` +
               `Preferred Contact Time: ${formData.preferred_contact_time}\n` +
               `Property Ownership: ${formData.property_ownership}\n` +
               `Property Type: ${formData.property_type}\n` +
               `Number of Bedrooms: ${formData.number_of_bedrooms}\n` +
               `Roof Type: ${formData.roof_type}\n` +
               `Roof Material: ${formData.roof_material}\n` +
               `Average Monthly Electricity Bill: ${formData.average_monthly_electricity_bill}\n` +
               (formData.energy_bill_amount ? `Specific Energy Bill Amount: £${formData.energy_bill_amount}\n` : '') +
               `Has EV Charger: ${formData.has_ev_charger === 'true' ? 'Yes' : formData.has_ev_charger === 'false' ? 'No' : 'Not specified'}\n` +
               `Day/Night Rate: ${formData.day_night_rate || 'Not specified'}\n` +
               `Current Energy Supplier: ${formData.current_energy_supplier}\n` +
               `Electric Heating/Appliances: ${formData.electric_heating_appliances}\n` +
               `Energy Details: ${formData.energy_details}\n` +
               `Timeframe: ${formData.timeframe}\n` +
               `Moving Properties Next 5 Years: ${formData.moving_properties_next_five_years}\n` +
               `Timeframe Details: ${formData.timeframe_details}\n` +
               `Has Previous Quotes: ${formData.has_previous_quotes === 'true' ? 'Yes' : formData.has_previous_quotes === 'false' ? 'No' : 'Not specified'}\n` +
               (formData.previous_quotes_details ? `Previous Quotes Details: ${formData.previous_quotes_details}\n` : '')
      };
      
      // Debug: Log the final form data being sent
      
      // Pass pending callback data as separate parameter
      await onSubmit(basicFormData, pendingCallback || undefined);
      
      // Clear pending callback after submission
      if (pendingCallback) {
        setPendingCallback(null);
      }
    } catch (error) {
    }
  };


  const handleSendToQualifier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!onSendToQualifier) return;
    
    
    if (!validateForm()) {
      return;
    }

    try {
      // Convert extended form data to basic LeadFormType for API
      const basicFormData: LeadFormType = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        address1: formData.address,
        city: formData.city,
        postal_code: formData.postcode,
        energy_bill_amount: formData.energy_bill_amount ? parseFloat(formData.energy_bill_amount) : undefined,
        has_ev_charger: formData.has_ev_charger === 'true' ? true : formData.has_ev_charger === 'false' ? false : undefined,
        day_night_rate: formData.day_night_rate as 'yes' | 'no' | undefined,
        has_previous_quotes: formData.has_previous_quotes === 'true' ? true : formData.has_previous_quotes === 'false' ? false : undefined,
        previous_quotes_details: formData.previous_quotes_details || undefined,
        notes: `${(formData.notes || '').split('--- DETAILED LEAD INFORMATION ---')[0].trim()}\n\n--- DETAILED LEAD INFORMATION ---\n` +
               `Preferred Contact Time: ${formData.preferred_contact_time}\n` +
               `Property Ownership: ${formData.property_ownership}\n` +
               `Property Type: ${formData.property_type}\n` +
               `Number of Bedrooms: ${formData.number_of_bedrooms}\n` +
               `Roof Type: ${formData.roof_type}\n` +
               `Roof Material: ${formData.roof_material}\n` +
               `Average Monthly Electricity Bill: ${formData.average_monthly_electricity_bill}\n` +
               (formData.energy_bill_amount ? `Specific Energy Bill Amount: £${formData.energy_bill_amount}\n` : '') +
               `Has EV Charger: ${formData.has_ev_charger === 'true' ? 'Yes' : formData.has_ev_charger === 'false' ? 'No' : 'Not specified'}\n` +
               `Day/Night Rate: ${formData.day_night_rate || 'Not specified'}\n` +
               `Current Energy Supplier: ${formData.current_energy_supplier}\n` +
               `Electric Heating/Appliances: ${formData.electric_heating_appliances}\n` +
               `Energy Details: ${formData.energy_details}\n` +
               `Timeframe: ${formData.timeframe}\n` +
               `Moving Properties Next 5 Years: ${formData.moving_properties_next_five_years}\n` +
               `Timeframe Details: ${formData.timeframe_details}\n` +
               `Has Previous Quotes: ${formData.has_previous_quotes === 'true' ? 'Yes' : formData.has_previous_quotes === 'false' ? 'No' : 'Not specified'}\n` +
               (formData.previous_quotes_details ? `Previous Quotes Details: ${formData.previous_quotes_details}\n` : '')
      };
      
      await onSendToQualifier(basicFormData);
    } catch (error) {
    }
  };

  const handleScheduleCallback = async (callbackData: CallbackForm) => {
    try {
      if (lead) {
        // Existing lead - schedule callback directly with correct lead ID
        const callbackDataWithLeadId = {
          ...callbackData,
          lead: lead.id
        };
        await callbacksAPI.createCallback(callbackDataWithLeadId);
        alert('Callback scheduled successfully!');
        setShowCallbackScheduler(false);
        
        // Refresh the page to show the callback
        window.location.reload();
      } else {
        // New lead - auto-create lead with callback status and schedule callback
        if (!validateForm()) {
          alert('Please fill in all required fields before scheduling callback.');
          return;
        }
        
        const basicFormData: LeadFormType = {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          address1: formData.address,
          city: formData.city,
          postal_code: formData.postcode,
          energy_bill_amount: formData.energy_bill_amount ? parseFloat(formData.energy_bill_amount) : undefined,
          has_ev_charger: formData.has_ev_charger === 'true' ? true : formData.has_ev_charger === 'false' ? false : undefined,
          day_night_rate: formData.day_night_rate as 'yes' | 'no' | undefined,
        has_previous_quotes: formData.has_previous_quotes === 'true' ? true : formData.has_previous_quotes === 'false' ? false : undefined,
        previous_quotes_details: formData.previous_quotes_details || undefined,
          notes: `${(formData.notes || '').split('--- DETAILED LEAD INFORMATION ---')[0].trim()}\n\n--- DETAILED LEAD INFORMATION ---\n` +
                 `Preferred Contact Time: ${formData.preferred_contact_time}\n` +
                 `Property Ownership: ${formData.property_ownership}\n` +
                 `Property Type: ${formData.property_type}\n` +
                 `Number of Bedrooms: ${formData.number_of_bedrooms}\n` +
                 `Roof Type: ${formData.roof_type}\n` +
                 `Roof Material: ${formData.roof_material}\n` +
                 `Average Monthly Electricity Bill: ${formData.average_monthly_electricity_bill}\n` +
                 (formData.energy_bill_amount ? `Specific Energy Bill Amount: £${formData.energy_bill_amount}\n` : '') +
                 `Has EV Charger: ${formData.has_ev_charger === 'true' ? 'Yes' : formData.has_ev_charger === 'false' ? 'No' : 'Not specified'}\n` +
                 `Day/Night Rate: ${formData.day_night_rate || 'Not specified'}\n` +
                 `Current Energy Supplier: ${formData.current_energy_supplier}\n` +
                 `Electric Heating/Appliances: ${formData.electric_heating_appliances}\n` +
                 `Energy Details: ${formData.energy_details}\n` +
                 `Timeframe: ${formData.timeframe}\n` +
                 `Moving Properties Next 5 Years: ${formData.moving_properties_next_five_years}\n` +
                 `Timeframe Details: ${formData.timeframe_details}\n` +
                 `Has Previous Quotes: ${formData.has_previous_quotes === 'true' ? 'Yes' : formData.has_previous_quotes === 'false' ? 'No' : 'Not specified'}\n` +
                 (formData.previous_quotes_details ? `Previous Quotes Details: ${formData.previous_quotes_details}\n` : '')
        };
        
        // Create lead with callback status (without pendingCallback in the data)
        const leadDataWithCallback = {
          ...basicFormData,
          status: 'callback' as Lead['status'],
          assigned_agent: 0 // Will be set by parent
        };
        
        // Store the callback data for later use (without the lead field)
        const callbackDataWithoutLead = {
          scheduled_time: callbackData.scheduled_time,
          notes: callbackData.notes
        };
        setPendingCallback(callbackDataWithoutLead);
        
        // Submit the form with callback status and pending callback data
        await onSubmit(leadDataWithCallback, callbackDataWithoutLead);
        setShowCallbackScheduler(false);
      }
    } catch (error) {
      alert('Failed to schedule callback. Please try again.');
    }
  };

  return (
    <div className="card-margav p-4 max-w-8xl mx-auto">
      <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
        {lead ? 'Update Lead Information' : 'Complete Lead Sheet'}
      </h3>
      

      {Object.keys(errors).length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''}:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      <strong>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information Section */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">📞 Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 ${
                  errors.full_name ? 'border-red-300' : ''
                }`}
                placeholder="Enter full name"
                disabled={loading}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 ${
                  errors.phone ? 'border-red-300' : ''
                }`}
                placeholder="Enter phone number"
                disabled={loading}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 ${
                  errors.email ? 'border-red-300' : ''
                }`}
                placeholder="Enter email address"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Enter full address"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Enter city"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Enter postcode"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="preferred_contact_time" className="block text-sm font-medium text-gray-700">
                Preferred Contact Time
              </label>
              <select
                id="preferred_contact_time"
                name="preferred_contact_time"
                value={formData.preferred_contact_time}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select preferred time</option>
                <option value="morning">Morning (9AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>
        </div>

        {/* Property Information Section */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">🏠 Property Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="property_ownership" className="block text-sm font-medium text-gray-700">
                Property Ownership
              </label>
              <select
                id="property_ownership"
                name="property_ownership"
                value={formData.property_ownership}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select ownership</option>
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">
                Property Type
              </label>
              <select
                id="property_type"
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select property type</option>
                <option value="detached">Detached House</option>
                <option value="semi_detached">Semi-Detached House</option>
                <option value="terraced">Terraced House</option>
                <option value="flat">Flat/Apartment</option>
                <option value="bungalow">Bungalow</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="number_of_bedrooms" className="block text-sm font-medium text-gray-700">
                Number of Bedrooms
              </label>
              <select
                id="number_of_bedrooms"
                name="number_of_bedrooms"
                value={formData.number_of_bedrooms}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5+">5+ Bedrooms</option>
              </select>
            </div>

            <div>
              <label htmlFor="roof_type" className="block text-sm font-medium text-gray-700">
                Roof Type
              </label>
              <select
                id="roof_type"
                name="roof_type"
                value={formData.roof_type}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select roof type</option>
                <option value="pitched">Pitched</option>
                <option value="flat">Flat</option>
                <option value="mixed">Mixed</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label htmlFor="roof_material" className="block text-sm font-medium text-gray-700">
                Roof Material
              </label>
              <select
                id="roof_material"
                name="roof_material"
                value={formData.roof_material}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select roof material</option>
                <option value="tiles">Tiles</option>
                <option value="slate">Slate</option>
                <option value="metal">Metal</option>
                <option value="felt">Felt</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Energy Usage Section */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">⚡ Energy Usage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="average_monthly_electricity_bill" className="block text-sm font-medium text-gray-700">
                Average Monthly Electricity Bill
              </label>
              <select
                id="average_monthly_electricity_bill"
                name="average_monthly_electricity_bill"
                value={formData.average_monthly_electricity_bill}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select bill range</option>
                <option value="under_50">Under £50</option>
                <option value="50_100">£50 - £100</option>
                <option value="100_150">£100 - £150</option>
                <option value="150_200">£150 - £200</option>
                <option value="200_300">£200 - £300</option>
                <option value="over_300">Over £300</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {/* Energy Bill Amount - only show if a range is selected */}
            {formData.average_monthly_electricity_bill && formData.average_monthly_electricity_bill !== 'unknown' && (
              <div>
                <label htmlFor="energy_bill_amount" className="block text-sm font-medium text-gray-700">
                  Specific Energy Bill Amount (if known)
                </label>
                <input
                  type="number"
                  id="energy_bill_amount"
                  name="energy_bill_amount"
                  value={formData.energy_bill_amount}
                  onChange={handleChange}
                  className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                  placeholder="Enter specific amount in £"
                  disabled={loading}
                />
              </div>
            )}

            {/* EV Charger */}
            <div>
              <label htmlFor="has_ev_charger" className="block text-sm font-medium text-gray-700">
                Do you have an EV charger?
              </label>
              <select
                id="has_ev_charger"
                name="has_ev_charger"
                value={formData.has_ev_charger}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select option</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Day/Night Rate */}
            <div>
              <label htmlFor="day_night_rate" className="block text-sm font-medium text-gray-700">
                Do you have a day/night rate?
              </label>
              <select
                id="day_night_rate"
                name="day_night_rate"
                value={formData.day_night_rate}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Unsure</option>
              </select>
            </div>

            <div>
              <label htmlFor="current_energy_supplier" className="block text-sm font-medium text-gray-700">
                Current Energy Supplier
              </label>
              <select
                id="current_energy_supplier"
                name="current_energy_supplier"
                value={formData.current_energy_supplier}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select energy supplier</option>
                <option value="british_gas">British Gas</option>
                <option value="edf_energy">EDF Energy</option>
                <option value="eon">E.ON</option>
                <option value="npower">npower</option>
                <option value="scottish_power">Scottish Power</option>
                <option value="sse">SSE</option>
                <option value="octopus_energy">Octopus Energy</option>
                <option value="ovo_energy">OVO Energy</option>
                <option value="bulb">Bulb</option>
                <option value="utilita">Utilita</option>
                <option value="ecotricity">Ecotricity</option>
                <option value="good_energy">Good Energy</option>
                <option value="green_energy_uk">Green Energy UK</option>
                <option value="shell_energy">Shell Energy</option>
                <option value="utility_warehouse">Utility Warehouse</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label htmlFor="electric_heating_appliances" className="block text-sm font-medium text-gray-700">
                Electric Heating/Appliances
              </label>
              <select
                id="electric_heating_appliances"
                name="electric_heating_appliances"
                value={formData.electric_heating_appliances}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select heating type</option>
                <option value="gas_heating">Gas Heating</option>
                <option value="electric_heating">Electric Heating</option>
                <option value="heat_pump">Heat Pump</option>
                <option value="storage_heaters">Storage Heaters</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="energy_details" className="block text-sm font-medium text-gray-700">
                More Energy Details
              </label>
              <textarea
                id="energy_details"
                name="energy_details"
                rows={3}
                value={formData.energy_details}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Any additional energy usage information..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Timeframe & Interest Section */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">⏰ Timeframe & Interest</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">
                How Soon Are You Looking?
              </label>
              <select
                id="timeframe"
                name="timeframe"
                value={formData.timeframe}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select timeframe</option>
                <option value="immediately">Immediately</option>
                <option value="within_month">Within a month</option>
                <option value="within_3_months">Within 3 months</option>
                <option value="within_6_months">Within 6 months</option>
                <option value="within_year">Within a year</option>
                <option value="just_researching">Just researching</option>
                <option value="not_sure">Not sure</option>
              </select>
            </div>

            <div>
              <label htmlFor="moving_properties_next_five_years" className="block text-sm font-medium text-gray-700">
                Moving Properties in Next 5 Years?
              </label>
              <select
                id="moving_properties_next_five_years"
                name="moving_properties_next_five_years"
                value={formData.moving_properties_next_five_years}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
                <option value="not_sure">Not sure</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="timeframe_details" className="block text-sm font-medium text-gray-700">
                More Details
              </label>
              <textarea
                id="timeframe_details"
                name="timeframe_details"
                rows={3}
                value={formData.timeframe_details}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Any additional timeframe or interest details..."
                disabled={loading}
              />
            </div>

            {/* Previous Quotes */}
            <div>
              <label htmlFor="has_previous_quotes" className="block text-sm font-medium text-gray-700">
                Have you had any previous quotes?
              </label>
              <select
                id="has_previous_quotes"
                name="has_previous_quotes"
                value={formData.has_previous_quotes}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                disabled={loading}
              >
                <option value="">Select option</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Previous Quotes Details - only show if they have previous quotes */}
            {formData.has_previous_quotes === 'true' && (
              <div>
                <label htmlFor="previous_quotes_details" className="block text-sm font-medium text-gray-700">
                  Details about previous quotes
                </label>
                <textarea
                  id="previous_quotes_details"
                  name="previous_quotes_details"
                  rows={3}
                  value={formData.previous_quotes_details}
                  onChange={handleChange}
                  className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                  placeholder="Please provide details about your previous quotes..."
                  disabled={loading}
                />
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">📝 Additional Notes</h4>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
              placeholder="Enter any additional notes or comments..."
              disabled={loading}
            />
          </div>
        </div>


        {/* Submit Buttons */}
        <div className="flex flex-wrap gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => setShowCallbackScheduler(true)}
            className={`px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              pendingCallback ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {pendingCallback ? '✅ Callback Scheduled' : '📞 Schedule Callback'}
          </button>

          {lead && onSendToQualifier && (
            <button
              type="button"
              onClick={handleSendToQualifier}
              className="px-3 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send to Qualifier'
              )}
            </button>
          )}
          
          <button
            type="submit"
            className="px-3 py-2 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              lead ? 'Update Lead' : 'Create Lead'
            )}
          </button>
        </div>
      </form>

      {/* Callback Scheduler Modal */}
      <CallbackScheduler
        lead={lead}
        leadData={lead ? undefined : {
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email
        }}
        isOpen={showCallbackScheduler}
        onClose={() => setShowCallbackScheduler(false)}
        onSchedule={handleScheduleCallback}
      />
    </div>
  );
};

export default LeadForm;

