import React, { useState } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface InterestedLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

interface LeadSheetForm {
  // Contact Information
  full_name: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  preferred_contact_time: string;
  
  // Property Information
  property_ownership: string;
  property_type: string;
  bedrooms: string;
  roof_type: string;
  roof_material: string;
  
  // Energy Usage
  monthly_electricity_bill: string;
  current_energy_supplier: string;
  electric_heating_appliances: string;
  electric_heating_details: string;
  
  // Timeframe & Interest
  timeframe: string;
  timeframe_details: string;
  moving_properties: string;
  
  // Notes
  notes: string;
}

const InterestedLeadModal: React.FC<InterestedLeadModalProps> = ({
  lead,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  
  // Initialize form data only once when component mounts
  const [formData, setFormData] = useState<LeadSheetForm>(() => ({
    // Contact Information
    full_name: lead.full_name || '',
    address: '',
    postcode: '',
    phone: lead.phone || '',
    email: lead.email || '',
    preferred_contact_time: '',
    
    // Property Information
    property_ownership: '',
    property_type: '',
    bedrooms: '',
    roof_type: '',
    roof_material: '',
    
    // Energy Usage
    monthly_electricity_bill: '',
    current_energy_supplier: '',
    electric_heating_appliances: '',
    electric_heating_details: '',
    
    // Timeframe & Interest
    timeframe: '',
    timeframe_details: '',
    moving_properties: '',
    
    // Notes
    notes: lead.notes || '',
  }));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Format the lead sheet data into notes
      const leadSheetData = `
LEAD SHEET INFORMATION:
Agent: ${user?.first_name} ${user?.last_name}

CONTACT INFORMATION:
Full Name: ${formData.full_name}
Address: ${formData.address}
Postcode: ${formData.postcode}
Phone: ${formData.phone}
Email: ${formData.email}
Preferred Contact Time: ${formData.preferred_contact_time}

PROPERTY INFORMATION:
Property Ownership: ${formData.property_ownership}
Property Type: ${formData.property_type}
Bedrooms: ${formData.bedrooms}
Roof Type: ${formData.roof_type}
Roof Material: ${formData.roof_material}

ENERGY USAGE:
Monthly Electricity Bill: £${formData.monthly_electricity_bill}
Current Energy Supplier: ${formData.current_energy_supplier}
Electric Heating/Appliances: ${formData.electric_heating_appliances}
${formData.electric_heating_details ? `Details: ${formData.electric_heating_details}` : ''}

TIMEFRAME & INTEREST:
Timeframe: ${formData.timeframe}
${formData.timeframe_details ? `Details: ${formData.timeframe_details}` : ''}
Moving Properties: ${formData.moving_properties}

ADDITIONAL NOTES:
${formData.notes}
      `.trim();
      
      // First, update the lead with the lead sheet information
      await leadsAPI.updateLead(lead.id, {
        notes: leadSheetData,
        status: 'interested',
      });
      
      // Then send to Kelly
      await leadsAPI.sendToKelly(lead.id);
      
      toast.success('Lead sheet completed and sent to Kelly for qualification!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to submit lead sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Lead Sheet - Interested Customer
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Complete the lead sheet and send to Kelly for qualification
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Agent: {user?.first_name} {user?.last_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information Section */}
            <div className="border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="preferred_contact_time" className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Time</label>
                  <select id="preferred_contact_time" name="preferred_contact_time" value={formData.preferred_contact_time} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Weekdays 9am-5pm">Weekdays 9am-5pm</option>
                    <option value="Weekdays 5pm-8pm">Weekdays 5pm-8pm</option>
                    <option value="Saturday 9am-5pm">Saturday 9am-5pm</option>
                    <option value="Sunday 10am-4pm">Sunday 10am-4pm</option>
                    <option value="Anytime">Anytime</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">UK Postcode</label>
                  <input type="text" id="postcode" name="postcode" value={formData.postcode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g., SW1A 1AA" />
                </div>
              </div>
            </div>

            {/* Property Information Section */}
            <div className="border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Property Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="property_ownership" className="block text-sm font-medium text-gray-700 mb-1">Do you own the property?</label>
                  <select id="property_ownership" name="property_ownership" value={formData.property_ownership} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select id="property_type" name="property_type" value={formData.property_type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Detached">Detached</option>
                    <option value="Semi-Detached">Semi-Detached</option>
                    <option value="Terraced">Terraced</option>
                    <option value="Flat">Flat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">Number of Bedrooms</label>
                  <select id="bedrooms" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="roof_type" className="block text-sm font-medium text-gray-700 mb-1">Roof Type</label>
                  <select id="roof_type" name="roof_type" value={formData.roof_type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Pitched">Pitched</option>
                    <option value="Flat">Flat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="roof_material" className="block text-sm font-medium text-gray-700 mb-1">Roof Material</label>
                  <select id="roof_material" name="roof_material" value={formData.roof_material} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Tile">Tile</option>
                    <option value="Slate">Slate</option>
                    <option value="Metal">Metal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Energy Usage Section */}
            <div className="border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Energy Usage</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="monthly_electricity_bill" className="block text-sm font-medium text-gray-700 mb-1">Average Monthly Electricity Bill (£)</label>
                  <input type="number" id="monthly_electricity_bill" name="monthly_electricity_bill" value={formData.monthly_electricity_bill} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g., 120" step="0.01" />
                </div>
                <div>
                  <label htmlFor="current_energy_supplier" className="block text-sm font-medium text-gray-700 mb-1">Current Energy Supplier</label>
                  <select id="current_energy_supplier" name="current_energy_supplier" value={formData.current_energy_supplier} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select supplier...</option>
                    <option value="British Gas">British Gas</option>
                    <option value="EDF Energy">EDF Energy</option>
                    <option value="E.ON">E.ON</option>
                    <option value="npower">npower</option>
                    <option value="Scottish Power">Scottish Power</option>
                    <option value="SSE">SSE</option>
                    <option value="Octopus Energy">Octopus Energy</option>
                    <option value="Bulb">Bulb</option>
                    <option value="Ovo Energy">Ovo Energy</option>
                    <option value="Utility Warehouse">Utility Warehouse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="electric_heating_appliances" className="block text-sm font-medium text-gray-700 mb-1">Do you use electric heating or appliances (e.g. EV, Heat pump)?</label>
                  <select id="electric_heating_appliances" name="electric_heating_appliances" value={formData.electric_heating_appliances} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="electric_heating_details" className="block text-sm font-medium text-gray-700 mb-1">More Details (if Yes)</label>
                  <input type="text" id="electric_heating_details" name="electric_heating_details" value={formData.electric_heating_details} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g., Electric vehicle, heat pump, electric boiler" />
                </div>
              </div>
            </div>

            {/* Timeframe & Interest Section */}
            <div className="border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Timeframe & Interest</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-1">How soon are you looking?</label>
                  <select id="timeframe" name="timeframe" value={formData.timeframe} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="Immediately">Immediately</option>
                    <option value="1-3 months">1-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6-12 months">6-12 months</option>
                    <option value="More than a year">More than a year</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="moving_properties" className="block text-sm font-medium text-gray-700 mb-1">Are you moving properties in the next five years?</label>
                  <select id="moving_properties" name="moving_properties" value={formData.moving_properties} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select...</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="timeframe_details" className="block text-sm font-medium text-gray-700 mb-1">More Details</label>
                  <textarea id="timeframe_details" name="timeframe_details" value={formData.timeframe_details} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Additional details about timeframe or interest..." />
                </div>
              </div>
            </div>

            {/* Additional Notes Section */}
            <div className="border rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Additional Notes</h4>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Any additional notes about the lead, call, or customer requirements..." />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                    Sending...
                  </div>
                ) : (
                  'Complete Lead Sheet & Send to Kelly'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterestedLeadModal;
