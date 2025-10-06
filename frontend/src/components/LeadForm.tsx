import React, { useState } from 'react';
import { Lead, LeadForm as LeadFormType } from '../types';

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: LeadFormType) => Promise<void>;
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
  current_energy_supplier: string;
  electric_heating_appliances: string;
  energy_details: string;
  
  // Timeframe & Interest
  timeframe: string;
  moving_properties_next_five_years: string;
  timeframe_details: string;
  
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
    if (parsedData.postcode) return parsedData.postcode;
    if (prepopulatedData?.postal_code) return prepopulatedData.postal_code;
    return '';
  };
  
  const [formData, setFormData] = useState<ExtendedLeadFormData>({
    // Contact Information - prioritize prepopulated data
    full_name: buildFullName(),
    phone: getPhoneNumber(),
    email: prepopulatedData?.email || lead?.email || '',
    address: buildAddress(),
    postcode: getPostcode(),
    preferred_contact_time: parsedData.preferred_contact_time || '',
    
    // Property Information
    property_ownership: parsedData.property_ownership || '',
    property_type: parsedData.property_type || '',
    number_of_bedrooms: parsedData.number_of_bedrooms || '',
    roof_type: parsedData.roof_type || '',
    roof_material: parsedData.roof_material || '',
    
    // Energy Usage
    average_monthly_electricity_bill: parsedData.average_monthly_electricity_bill || '',
    current_energy_supplier: parsedData.current_energy_supplier || '',
    electric_heating_appliances: parsedData.electric_heating_appliances || '',
    energy_details: parsedData.energy_details || '',
    
    // Timeframe & Interest
    timeframe: parsedData.timeframe || '',
    moving_properties_next_five_years: parsedData.moving_properties_next_five_years || '',
    timeframe_details: parsedData.timeframe_details || '',
    
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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

    // Required fields
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Convert extended form data to basic LeadFormType for API
      const basicFormData: LeadFormType = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        notes: `${formData.notes}\n\n--- DETAILED LEAD INFORMATION ---\n` +
               `Address: ${formData.address}\n` +
               `Postcode: ${formData.postcode}\n` +
               `Preferred Contact Time: ${formData.preferred_contact_time}\n` +
               `Property Ownership: ${formData.property_ownership}\n` +
               `Property Type: ${formData.property_type}\n` +
               `Number of Bedrooms: ${formData.number_of_bedrooms}\n` +
               `Roof Type: ${formData.roof_type}\n` +
               `Roof Material: ${formData.roof_material}\n` +
               `Average Monthly Electricity Bill: ${formData.average_monthly_electricity_bill}\n` +
               `Current Energy Supplier: ${formData.current_energy_supplier}\n` +
               `Electric Heating/Appliances: ${formData.electric_heating_appliances}\n` +
               `Energy Details: ${formData.energy_details}\n` +
               `Timeframe: ${formData.timeframe}\n` +
               `Moving Properties Next 5 Years: ${formData.moving_properties_next_five_years}\n` +
               `Timeframe Details: ${formData.timeframe_details}`
      };
      
      await onSubmit(basicFormData);
    } catch (error) {
      console.error('Form submission error:', error);
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
        notes: `${formData.notes}\n\n--- DETAILED LEAD INFORMATION ---\n` +
               `Address: ${formData.address}\n` +
               `Postcode: ${formData.postcode}\n` +
               `Preferred Contact Time: ${formData.preferred_contact_time}\n` +
               `Property Ownership: ${formData.property_ownership}\n` +
               `Property Type: ${formData.property_type}\n` +
               `Number of Bedrooms: ${formData.number_of_bedrooms}\n` +
               `Roof Type: ${formData.roof_type}\n` +
               `Roof Material: ${formData.roof_material}\n` +
               `Average Monthly Electricity Bill: ${formData.average_monthly_electricity_bill}\n` +
               `Current Energy Supplier: ${formData.current_energy_supplier}\n` +
               `Electric Heating/Appliances: ${formData.electric_heating_appliances}\n` +
               `Energy Details: ${formData.energy_details}\n` +
               `Timeframe: ${formData.timeframe}\n` +
               `Moving Properties Next 5 Years: ${formData.moving_properties_next_five_years}\n` +
               `Timeframe Details: ${formData.timeframe_details}`
      };
      
      await onSendToQualifier(basicFormData);
    } catch (error) {
      console.error('Send to qualifier error:', error);
    }
  };

  return (
    <div className="card-margav p-6 max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
        {lead ? 'Update Lead Information' : 'Complete Lead Sheet'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information Section */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">📞 Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 ${
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
                Phone Number *
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Enter full address"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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

            <div>
              <label htmlFor="current_energy_supplier" className="block text-sm font-medium text-gray-700">
                Current Energy Supplier
              </label>
              <select
                id="current_energy_supplier"
                name="current_energy_supplier"
                value={formData.current_energy_supplier}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
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
                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
                placeholder="Any additional timeframe or interest details..."
                disabled={loading}
              />
            </div>
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
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200"
              placeholder="Enter any additional notes or comments..."
              disabled={loading}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto bg-white py-3 px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          
          {lead && onSendToQualifier && (
            <button
              type="button"
              onClick={handleSendToQualifier}
              className="w-full sm:w-auto bg-green-600 py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending to Qualifier...
                </div>
              ) : (
                'Send to Qualifier'
              )}
            </button>
          )}
          
          <button
            type="submit"
            className="btn-margav-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving Lead...
              </div>
            ) : (
              lead ? 'Update Lead' : 'Send to Qualifier'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;