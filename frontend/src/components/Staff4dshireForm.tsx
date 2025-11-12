import React, { useState, useEffect } from 'react';
import { LeadForm, Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface Staff4dshireFormProps {
  lead?: Lead;
  onSuccess?: () => void;
  onSubmit?: (leadData: LeadForm) => Promise<void>;
}

interface Staff4dshireFormData {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  postcode: string;
  homeowner: 'yes' | 'no' | '';
  property_type: 'residential' | 'commercial' | '';
  monthly_electricity_spend: string;
  has_ev_charger: string;
  day_night_rate: string;
  current_energy_supplier: string;
  electric_heating_appliances: string;
  energy_details: string;
  notes: string;
}

const Staff4dshireForm: React.FC<Staff4dshireFormProps> = ({ lead, onSuccess, onSubmit }) => {
  const { user } = useAuth();
  
  // Parse lead data to populate form
  const parseLeadData = (lead: Lead | undefined): Staff4dshireFormData => {
    if (!lead) {
      return {
        full_name: '',
        phone: '',
        email: '',
        address: '',
        postcode: '',
        homeowner: '',
        property_type: '',
        monthly_electricity_spend: '',
        has_ev_charger: '',
        day_night_rate: '',
        current_energy_supplier: '',
        electric_heating_appliances: '',
        energy_details: '',
        notes: '',
      };
    }

    // Extract data from notes
    const notes = lead.notes || '';
    let homeowner = '';
    let propertyType = '';
    let monthlySpend = '';
    let evCharger = '';
    let dayNightRate = '';
    let energySupplier = '';
    let heatingAppliances = '';
    let energyDetails = '';
    let additionalNotes = '';

    // Parse notes
    if (notes.includes('Address:')) {
      const match = notes.match(/Address:\s*([^\n]+)/i);
      if (match) {
        // Address is already extracted from lead.address1
      }
    }
    if (notes.includes('Postcode:') || notes.includes('Postal Code:')) {
      const match = notes.match(/(?:Postcode|Postal Code):\s*([^\n]+)/i);
      if (match) {
        // Postcode is already extracted from lead.postal_code
      }
    }
    if (notes.includes('Homeowner:')) {
      const match = notes.match(/Homeowner:\s*(Yes|No)/i);
      if (match) homeowner = match[1].toLowerCase();
    }
    if (notes.includes('Property Type:')) {
      const match = notes.match(/Property Type:\s*(Residential|Commercial)/i);
      if (match) propertyType = match[1].toLowerCase();
    }
    if (notes.includes('Monthly Electricity Spend:')) {
      const match = notes.match(/Monthly Electricity Spend:\s*£?([\d.]+)/i);
      if (match) monthlySpend = match[1];
    }
    if (notes.includes('Has EV Charger:')) {
      const match = notes.match(/Has EV Charger:\s*(Yes|No|Not specified)/i);
      if (match) {
        evCharger = match[1].toLowerCase() === 'yes' ? 'true' : match[1].toLowerCase() === 'no' ? 'false' : '';
      }
    }
    if (notes.includes('Day/Night Rate:')) {
      const match = notes.match(/Day\/Night Rate:\s*(yes|no|unsure|Not specified)/i);
      if (match && match[1].toLowerCase() !== 'not specified') dayNightRate = match[1].toLowerCase();
    }
    if (notes.includes('Current Energy Supplier:')) {
      const match = notes.match(/Current Energy Supplier:\s*([^\n]+)/i);
      if (match) energySupplier = match[1].trim();
    }
    if (notes.includes('Electric Heating/Appliances:')) {
      const match = notes.match(/Electric Heating\/Appliances:\s*([^\n]+)/i);
      if (match) heatingAppliances = match[1].trim();
    }
    if (notes.includes('Energy Details:')) {
      const match = notes.match(/Energy Details:\s*([^\n]+)/i);
      if (match) energyDetails = match[1].trim();
    }
    if (notes.includes('Additional Notes:')) {
      const match = notes.match(/Additional Notes:\s*([\s\S]*?)(?:\n\n|$)/i);
      if (match) additionalNotes = match[1].trim();
    }

    // Determine homeowner value with proper type
    let homeownerValue: 'yes' | 'no' | '' = '';
    if (homeowner === 'yes' || homeowner === 'no') {
      homeownerValue = homeowner;
    } else if (lead.property_ownership === 'yes') {
      homeownerValue = 'yes';
    } else if (lead.property_ownership === 'no') {
      homeownerValue = 'no';
    }

    return {
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address: lead.address1 || '',
      postcode: lead.postal_code || '',
      homeowner: homeownerValue,
      property_type: propertyType as 'residential' | 'commercial' | '',
      monthly_electricity_spend: monthlySpend || (lead.monthly_electricity_spend ? lead.monthly_electricity_spend.toString() : ''),
      has_ev_charger: evCharger || (lead.has_ev_charger === true ? 'true' : lead.has_ev_charger === false ? 'false' : ''),
      day_night_rate: dayNightRate || (lead.day_night_rate || ''),
      current_energy_supplier: energySupplier || (lead.current_energy_supplier || ''),
      electric_heating_appliances: heatingAppliances || (lead.electric_heating_appliances || ''),
      energy_details: energyDetails || (lead.energy_details || ''),
      notes: additionalNotes,
    };
  };

  const [formData, setFormData] = useState<Staff4dshireFormData>(parseLeadData(lead));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [sendToQualifier, setSendToQualifier] = useState(false);

  // Update form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData(parseLeadData(lead));
      setSendToQualifier(false); // Reset checkbox when lead changes
    } else {
      setSendToQualifier(false); // Reset checkbox when no lead (new form)
    }
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.full_name?.trim()) {
      newErrors.full_name = 'Name is required';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Telephone number is required';
    } else if (!/^[+]?[0-9\s\-()]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email?.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.postcode?.trim()) {
      newErrors.postcode = 'Postcode is required';
    }

    if (!formData.homeowner) {
      newErrors.homeowner = 'Please select if homeowner';
    }

    if (!formData.property_type) {
      newErrors.property_type = 'Please select property type';
    }

    if (formData.monthly_electricity_spend && isNaN(Number(formData.monthly_electricity_spend))) {
      newErrors.monthly_electricity_spend = 'Monthly electricity spend must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    try {
      setLoading(true);

      // Build notes with form data
      // Preserve original submission info when editing
      let submissionHeader = '';
      if (lead && lead.notes) {
        // Extract original submission header
        const lines = lead.notes.split('\n');
        if (lines[0] && lines[0].includes('Staff4dshire Lead Submission')) {
          submissionHeader = lines[0] + '\n';
          if (lines[1] && lines[1].includes('Submitted by:')) {
            submissionHeader += lines[1] + '\n';
          }
        }
      }
      
      // If no existing header, create new one
      if (!submissionHeader) {
        submissionHeader = `Staff4dshire Lead Submission\n` +
          `Submitted by: ${user?.first_name} ${user?.last_name}\n`;
      }
      
      // Add updated timestamp if editing
      if (lead) {
        submissionHeader += `Last updated: ${new Date().toLocaleString()}\n`;
      }
      
      const notes = submissionHeader + '\n' +
        `Address: ${formData.address}\n` +
        `Postcode: ${formData.postcode}\n` +
        `Homeowner: ${formData.homeowner === 'yes' ? 'Yes' : 'No'}\n` +
        `Property Type: ${formData.property_type === 'residential' ? 'Residential' : 'Commercial'}\n` +
        (formData.monthly_electricity_spend ? `Monthly Electricity Spend: £${formData.monthly_electricity_spend}\n` : '') +
        (formData.has_ev_charger ? `Has EV Charger: ${formData.has_ev_charger === 'true' ? 'Yes' : formData.has_ev_charger === 'false' ? 'No' : 'Not specified'}\n` : '') +
        (formData.day_night_rate ? `Day/Night Rate: ${formData.day_night_rate || 'Not specified'}\n` : '') +
        (formData.current_energy_supplier ? `Current Energy Supplier: ${formData.current_energy_supplier}\n` : '') +
        (formData.electric_heating_appliances ? `Electric Heating/Appliances: ${formData.electric_heating_appliances}\n` : '') +
        (formData.energy_details ? `Energy Details: ${formData.energy_details}\n` : '') +
        (formData.notes ? `Additional Notes: ${formData.notes}\n` : '');

      // Convert to LeadForm format
      // If editing and sendToQualifier is checked, set status to 'sent_to_kelly'
      // Otherwise, preserve existing status for edits or set to 'sent_to_kelly' for new leads
      const leadStatus = lead 
        ? (sendToQualifier ? 'sent_to_kelly' : lead.status)
        : 'sent_to_kelly';

      const leadData: LeadForm = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || undefined,
        address1: formData.address,
        postal_code: formData.postcode,
        status: leadStatus as Lead['status'],
        notes: notes,
        property_ownership: formData.homeowner === 'yes' ? 'yes' : 'no',
        monthly_electricity_spend: formData.monthly_electricity_spend ? parseFloat(formData.monthly_electricity_spend) : undefined,
        has_ev_charger: formData.has_ev_charger === 'true' ? true : formData.has_ev_charger === 'false' ? false : undefined,
        day_night_rate: formData.day_night_rate as 'yes' | 'no' | undefined,
        current_energy_supplier: formData.current_energy_supplier || undefined,
        electric_heating_appliances: formData.electric_heating_appliances || undefined,
        energy_details: formData.energy_details || undefined,
      };

      // If onSubmit is provided (for editing), use it; otherwise create new lead
      if (onSubmit && lead) {
        await onSubmit(leadData);
        if (sendToQualifier) {
          toast.success('Lead updated and sent to qualifier!');
        } else {
          toast.success('Lead updated successfully!');
        }
      } else {
        await leadsAPI.createLead(leadData);
        toast.success('Lead submitted successfully! It has been sent to the qualifier.');
        
        // Reset form only for new leads
        setFormData({
          full_name: '',
          phone: '',
          email: '',
          address: '',
          postcode: '',
          homeowner: '',
          property_type: '',
          monthly_electricity_spend: '',
          has_ev_charger: '',
          day_night_rate: '',
          current_energy_supplier: '',
          electric_heating_appliances: '',
          energy_details: '',
          notes: '',
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to submit lead';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {lead && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Editing Lead:</strong> {lead.full_name} - {lead.phone}
          </p>
        </div>
      )}
        {/* Contact Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telephone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postcode *
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.postcode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              {errors.postcode && (
                <p className="mt-1 text-sm text-red-600">{errors.postcode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Homeowner *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="homeowner"
                    value="yes"
                    checked={formData.homeowner === 'yes'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="homeowner"
                    value="no"
                    checked={formData.homeowner === 'no'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              {errors.homeowner && (
                <p className="mt-1 text-sm text-red-600">{errors.homeowner}</p>
              )}
            </div>

            <div>
              <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                Residential or Commercial *
              </label>
              <select
                id="property_type"
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.property_type ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
              >
                <option value="">Select...</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
              {errors.property_type && (
                <p className="mt-1 text-sm text-red-600">{errors.property_type}</p>
              )}
            </div>
          </div>
        </div>

        {/* Energy Usage Section */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">⚡ Energy Usage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="monthly_electricity_spend" className="block text-sm font-medium text-gray-700">
                Current Monthly Electricity Spend (over £60)
              </label>
              <input
                type="number"
                id="monthly_electricity_spend"
                name="monthly_electricity_spend"
                value={formData.monthly_electricity_spend}
                onChange={handleChange}
                className={`mt-2 block w-full px-4 py-3 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors duration-200 ${
                  errors.monthly_electricity_spend ? 'border-red-500' : ''
                }`}
                placeholder="Enter amount in £"
                disabled={loading}
              />
              {errors.monthly_electricity_spend && (
                <p className="mt-1 text-sm text-red-600">{errors.monthly_electricity_spend}</p>
              )}
            </div>

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

        {/* Additional Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Any additional information about this lead..."
          />
        </div>

        {/* Send to Qualifier Option (only when editing) */}
        {lead && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendToQualifier}
                onChange={(e) => setSendToQualifier(e.target.checked)}
                className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Send updated lead to qualifier
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  Check this box to send the lead back to the qualifier after updating
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-margav-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {lead ? 'Updating...' : 'Submitting...'}
              </div>
            ) : (
              lead 
                ? (sendToQualifier ? 'Update & Send to Qualifier' : 'Update Lead')
                : 'Submit to Qualifier'
            )}
          </button>
        </div>
      </form>
  );
};

export default Staff4dshireForm;

