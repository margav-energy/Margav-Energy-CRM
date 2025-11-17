import React, { useState, useEffect, useRef } from 'react';
import { Lead, LeadUpdateForm } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface QualifierLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: (updatedLead?: Lead) => void;
}

const QualifierLeadModal: React.FC<QualifierLeadModalProps> = ({
  lead,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  
  // Parse agent notes to extract agent-provided data
  const parseAgentNotes = (notes: string) => {
    const agentData: any = {};
    if (!notes) return agentData;
    
    const lines = notes.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        const lowerKey = key.toLowerCase();
        
        // Map agent form fields
        if (lowerKey.includes('property type')) agentData.property_type = value;
        if (lowerKey.includes('roof type')) agentData.roof_type = value;
        if (lowerKey.includes('roof material')) agentData.roof_material = value;
        if (lowerKey.includes('property ownership')) agentData.property_ownership = value;
        if (lowerKey.includes('lives with partner')) agentData.lives_with_partner = value.toLowerCase().includes('yes');
        if (lowerKey.includes('age range 18-74')) agentData.age_range_18_74 = value.toLowerCase().includes('yes');
        if (lowerKey.includes('moving within 5 years')) agentData.moving_within_5_years = value.toLowerCase().includes('yes');
        if (lowerKey.includes('monthly electricity spend')) agentData.monthly_electricity_spend = value.replace(/[£,]/g, '');
        if (lowerKey.includes('has ev charger')) agentData.has_ev_charger = value.toLowerCase().includes('yes');
        if (lowerKey.includes('day/night rate')) agentData.day_night_rate = value;
        if (lowerKey.includes('employment status')) agentData.employment_status = value;
        if (lowerKey.includes('debt management') || lowerKey.includes('bankruptcy')) agentData.debt_management_bankruptcy = value.toLowerCase().includes('yes');
        if (lowerKey.includes('government grants')) agentData.government_grants_aware = value.toLowerCase().includes('yes');
        if (lowerKey.includes('spray foam')) agentData.spray_foam_roof = value.toLowerCase().includes('yes');
        if (lowerKey.includes('building work')) agentData.building_work_roof = value.toLowerCase().includes('yes');
        if (lowerKey.includes('loft conversions')) agentData.loft_conversions = value.toLowerCase().includes('yes');
        if (lowerKey.includes('velux windows')) agentData.velux_windows = value.toLowerCase().includes('yes');
        if (lowerKey.includes('dormers')) agentData.dormers = value.toLowerCase().includes('yes');
        if (lowerKey.includes('dormas')) agentData.dormas_shading_windows = value.toLowerCase().includes('yes');
      }
    }
    return agentData;
  };
  
  // Extract agent data from lead
  const agentData = React.useMemo(() => {
    const parsed = parseAgentNotes(lead.notes || '');
    return {
      ...parsed,
      // Also get data from lead fields (agent may have filled these)
      property_ownership: lead.property_ownership || parsed.property_ownership,
      lives_with_partner: lead.lives_with_partner ?? parsed.lives_with_partner,
      age_range_18_74: lead.age_range_18_74 ?? parsed.age_range_18_74,
      moving_within_5_years: lead.moving_within_5_years ?? parsed.moving_within_5_years,
      monthly_electricity_spend: lead.monthly_electricity_spend || parsed.monthly_electricity_spend,
      has_ev_charger: lead.has_ev_charger ?? parsed.has_ev_charger,
      day_night_rate: lead.day_night_rate || parsed.day_night_rate,
      employment_status: lead.employment_status || parsed.employment_status,
      debt_management_bankruptcy: lead.debt_management_bankruptcy ?? parsed.debt_management_bankruptcy,
      government_grants_aware: lead.government_grants_aware ?? parsed.government_grants_aware,
      spray_foam_roof: lead.spray_foam_roof ?? parsed.spray_foam_roof,
      building_work_roof: lead.building_work_roof ?? parsed.building_work_roof,
      loft_conversions: lead.loft_conversions ?? parsed.loft_conversions,
      velux_windows: lead.velux_windows ?? parsed.velux_windows,
      dormers: lead.dormers ?? parsed.dormers,
      dormas_shading_windows: lead.dormas_shading_windows ?? parsed.dormas_shading_windows,
    };
  }, [lead]);
  
  // Helper function to convert date to datetime-local format
  const formatDateForInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
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
  
  // Initialize form data from lead
  const initializeFormData = (): LeadUpdateForm => {
    const currentAgentData = parseAgentNotes(lead.notes || '');
    const currentGetInitialPropertyType = () => {
      if (lead.property_type_qualifier) return lead.property_type_qualifier;
      const agentType = currentAgentData.property_type?.toLowerCase();
      if (agentType?.includes('detached')) return 'detached';
      if (agentType?.includes('semi')) return 'semi-detached';
      if (agentType?.includes('terraced') || agentType?.includes('terrace')) return 'terraced';
      if (agentType?.includes('bungalow')) return 'bungalow';
      if (agentType?.includes('caravan')) return 'caravan';
      if (agentType?.includes('commercial')) return 'commercial';
      return undefined;
    };
    const currentGetInitialRoofType = () => {
      if (lead.roof_type_qualifier) return lead.roof_type_qualifier;
      const agentType = currentAgentData.roof_type?.toLowerCase();
      if (agentType?.includes('hip')) return 'hip';
      if (agentType?.includes('gable')) return 'gable';
      if (agentType?.includes('flat')) return 'flat';
      return undefined;
    };
    const currentGetInitialBillType = () => {
      if (lead.current_electric_bill_type) return lead.current_electric_bill_type;
      if (currentAgentData.day_night_rate?.toLowerCase().includes('yes')) return 'electric';
      return undefined;
    };

    return {
      status: lead.status,
      notes: lead.notes || '',
      appointment_date: lead.appointment_date ? formatDateForInput(lead.appointment_date) : '',
      field_sales_rep: lead.field_sales_rep || null,
      // Contact Information (editable)
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      address1: lead.address1 || '',
      postal_code: lead.postal_code || '',
      // Qualifier Lead Sheet Fields - pre-populate with agent data where applicable
      desktop_roof_check_completed: lead.desktop_roof_check_completed ?? undefined,
      property_type_qualifier: currentGetInitialPropertyType(),
      roof_type_qualifier: currentGetInitialRoofType(),
      speaking_to_homeowner: lead.speaking_to_homeowner ?? undefined,
      both_homeowners_present: lead.both_homeowners_present ?? undefined,
      property_listed: lead.property_listed ?? undefined,
      conservation_area: lead.conservation_area ?? undefined,
      building_work_ongoing: lead.building_work_ongoing ?? undefined,
      roof_shaded_obstructed: lead.roof_shaded_obstructed ?? undefined,
      spray_foam_roof: lead.spray_foam_roof ?? (currentAgentData.spray_foam_roof !== undefined ? currentAgentData.spray_foam_roof : undefined),
      customer_aware_no_grants: lead.customer_aware_no_grants ?? undefined,
      current_electric_bill_type: currentGetInitialBillType(),
      customer_age: lead.customer_age,
      aged_18_70: lead.aged_18_70 ?? (currentAgentData.age_range_18_74 ? true : undefined),
      currently_employed: lead.currently_employed ?? (currentAgentData.employment_status ? currentAgentData.employment_status !== 'unemployed' : undefined),
      has_good_credit: lead.has_good_credit ?? (currentAgentData.debt_management_bankruptcy === false ? true : undefined),
      earns_over_12k: lead.earns_over_12k ?? undefined,
      planning_to_move_5_years: lead.planning_to_move_5_years ?? (currentAgentData.moving_within_5_years !== undefined ? currentAgentData.moving_within_5_years : undefined),
      available_3_working_days: lead.available_3_working_days ?? undefined,
    };
  };

  const [formData, setFormData] = useState<LeadUpdateForm>(initializeFormData());
  const [loading, setLoading] = useState(false);

  // Update form data when lead changes (e.g., after refetch or when different lead is selected)
  // Use a ref to track if we should update (to avoid resetting while user is typing)
  const previousLeadIdRef = useRef<number>(lead.id);
  const previousUpdatedAtRef = useRef<string | undefined>(lead.updated_at);
  const hasSubmittedRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);
  
  // Update form data when lead changes (e.g., after refetch or when different lead is selected)
  useEffect(() => {
    // On initial mount, formData is already initialized from lead
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousLeadIdRef.current = lead.id;
      previousUpdatedAtRef.current = lead.updated_at;
      return;
    }
    
    // If lead ID changed, it's a different lead - reset form
    if (lead.id !== previousLeadIdRef.current) {
      setFormData(initializeFormData());
      previousLeadIdRef.current = lead.id;
      previousUpdatedAtRef.current = lead.updated_at;
      hasSubmittedRef.current = false;
      return;
    }
    
    // If same lead but updated_at changed, update form with saved data
    // This ensures the form shows the persisted data from the backend
    if (lead.id === previousLeadIdRef.current && 
        lead.updated_at !== previousUpdatedAtRef.current) {
      // Update form data with the saved lead data to ensure persistence
      setFormData(initializeFormData());
      previousUpdatedAtRef.current = lead.updated_at;
      hasSubmittedRef.current = false; // Reset flag
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, lead.updated_at]); // Depend on ID and updated_at to detect changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
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
      
      const response = await leadsAPI.qualifyLead(lead.id, cleanFormData);
      
      if (formData.status === 'appointment_set' && !response.calendar_synced) {
        toast.warning('Lead qualified successfully, but Google Calendar sync failed. The appointment may not appear in the calendar.', {
          autoClose: 8000,
          position: 'top-right'
        });
      } else {
        toast.success('Lead qualified successfully!');
      }
      
      // Mark that we've successfully submitted - this will trigger form update when lead prop changes
      hasSubmittedRef.current = true;
      
      // Update form data immediately with the response to ensure it matches what was saved
      // This ensures the form shows the persisted data
      if (response.lead) {
        // Update form data with the saved lead data to ensure persistence
        setFormData(prev => {
          const savedFormData = {
            status: response.lead.status,
            notes: response.lead.notes || prev.notes,
            appointment_date: response.lead.appointment_date ? formatDateForInput(response.lead.appointment_date) : prev.appointment_date,
            field_sales_rep: response.lead.field_sales_rep || prev.field_sales_rep,
            full_name: response.lead.full_name || prev.full_name,
            phone: response.lead.phone || prev.phone,
            email: response.lead.email || prev.email,
            address1: response.lead.address1 || prev.address1,
            postal_code: response.lead.postal_code || prev.postal_code,
            // Qualifier fields - use response data to ensure persistence
            desktop_roof_check_completed: response.lead.desktop_roof_check_completed ?? prev.desktop_roof_check_completed,
            property_type_qualifier: response.lead.property_type_qualifier || prev.property_type_qualifier,
            roof_type_qualifier: response.lead.roof_type_qualifier || prev.roof_type_qualifier,
            speaking_to_homeowner: response.lead.speaking_to_homeowner ?? prev.speaking_to_homeowner,
            both_homeowners_present: response.lead.both_homeowners_present ?? prev.both_homeowners_present,
            property_listed: response.lead.property_listed ?? prev.property_listed,
            conservation_area: response.lead.conservation_area ?? prev.conservation_area,
            building_work_ongoing: response.lead.building_work_ongoing ?? prev.building_work_ongoing,
            roof_shaded_obstructed: response.lead.roof_shaded_obstructed ?? prev.roof_shaded_obstructed,
            spray_foam_roof: response.lead.spray_foam_roof ?? prev.spray_foam_roof,
            customer_aware_no_grants: response.lead.customer_aware_no_grants ?? prev.customer_aware_no_grants,
            current_electric_bill_type: response.lead.current_electric_bill_type || prev.current_electric_bill_type,
            customer_age: response.lead.customer_age ?? prev.customer_age,
            aged_18_70: response.lead.aged_18_70 ?? prev.aged_18_70,
            currently_employed: response.lead.currently_employed ?? prev.currently_employed,
            has_good_credit: response.lead.has_good_credit ?? prev.has_good_credit,
            earns_over_12k: response.lead.earns_over_12k ?? prev.earns_over_12k,
            planning_to_move_5_years: response.lead.planning_to_move_5_years ?? prev.planning_to_move_5_years,
            available_3_working_days: response.lead.available_3_working_days ?? prev.available_3_working_days,
          };
          return savedFormData;
        });
      }
      
      setTimeout(() => {
        onSuccess(response.lead);
      }, 100);
    } catch (error) {
      toast.error('Failed to qualify lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'field_sales_rep' ? (value ? parseInt(value) : null) : 
        name === 'customer_age' ? (value ? parseInt(value) : undefined) : value),
    }));
  };

  const handleBooleanChange = (name: string, value: boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Qualifier Lead Sheet - {lead.full_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Qualifier: {user?.first_name} {user?.last_name} | Agent: {lead.assigned_agent_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Agent Data Summary Section */}
          {lead.assigned_agent_name && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📋</span>
                  Agent Information (from {lead.assigned_agent_name})
                </h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Read-Only</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {agentData.property_type && (
                  <div>
                    <span className="font-medium text-gray-700">Property Type:</span>{' '}
                    <span className="text-gray-600">{agentData.property_type}</span>
                  </div>
                )}
                {agentData.roof_type && (
                  <div>
                    <span className="font-medium text-gray-700">Roof Type:</span>{' '}
                    <span className="text-gray-600">{agentData.roof_type}</span>
                  </div>
                )}
                {agentData.property_ownership && (
                  <div>
                    <span className="font-medium text-gray-700">Property Ownership:</span>{' '}
                    <span className="text-gray-600">{agentData.property_ownership}</span>
                  </div>
                )}
                {agentData.monthly_electricity_spend && (
                  <div>
                    <span className="font-medium text-gray-700">Monthly Electricity Spend:</span>{' '}
                    <span className="text-gray-600">£{agentData.monthly_electricity_spend}</span>
                  </div>
                )}
                {agentData.employment_status && (
                  <div>
                    <span className="font-medium text-gray-700">Employment Status:</span>{' '}
                    <span className="text-gray-600">{agentData.employment_status}</span>
                  </div>
                )}
                {agentData.has_ev_charger !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">Has EV Charger:</span>{' '}
                    <span className="text-gray-600">{agentData.has_ev_charger ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {agentData.day_night_rate && (
                  <div>
                    <span className="font-medium text-gray-700">Day/Night Rate:</span>{' '}
                    <span className="text-gray-600">{agentData.day_night_rate}</span>
                  </div>
                )}
                {agentData.age_range_18_74 !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">Age Range 18-74:</span>{' '}
                    <span className="text-gray-600">{agentData.age_range_18_74 ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {agentData.moving_within_5_years !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">Moving Within 5 Years:</span>{' '}
                    <span className="text-gray-600">{agentData.moving_within_5_years ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {agentData.spray_foam_roof !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">Spray Foam Roof:</span>{' '}
                    <span className="text-gray-600">{agentData.spray_foam_roof ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {agentData.building_work_roof !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">Building Work on Roof:</span>{' '}
                    <span className="text-gray-600">{agentData.building_work_roof ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
              {lead.notes && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                      View Full Agent Notes
                    </summary>
                    <div className="mt-2 p-3 bg-white rounded border max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs text-gray-600">{lead.notes}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Contact Information Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Desktop Roof Check */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Desktop Roof Check</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desktop Roof Check Completed?
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Have you reviewed the roof of the property to ensure that the roof is suitable for a minimum of EIGHT panels.
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="desktop_roof_check_completed"
                      checked={formData.desktop_roof_check_completed === true}
                      onChange={() => handleBooleanChange('desktop_roof_check_completed', true)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="desktop_roof_check_completed"
                      checked={formData.desktop_roof_check_completed === false}
                      onChange={() => handleBooleanChange('desktop_roof_check_completed', false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Property Information</h4>
                {agentData.property_type && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Pre-filled from agent data
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="property_type_qualifier" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type?
                    {agentData.property_type && (
                      <span className="ml-2 text-xs text-green-600">(Agent: {agentData.property_type})</span>
                    )}
                  </label>
                  <select
                    id="property_type_qualifier"
                    name="property_type_qualifier"
                    value={formData.property_type_qualifier || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select...</option>
                    <option value="detached">Detached</option>
                    <option value="semi-detached">Semi-Detached</option>
                    <option value="terraced">Terrace</option>
                    <option value="bungalow">Bungalow</option>
                    <option value="caravan">Caravan</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="roof_type_qualifier" className="block text-sm font-medium text-gray-700 mb-1">
                    Roof Type?
                    {agentData.roof_type && (
                      <span className="ml-2 text-xs text-green-600">(Agent: {agentData.roof_type})</span>
                    )}
                  </label>
                  <select
                    id="roof_type_qualifier"
                    name="roof_type_qualifier"
                    value={formData.roof_type_qualifier || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select...</option>
                    <option value="hip">Hip</option>
                    <option value="gable">Gable</option>
                    <option value="flat">Flat</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Homeowner Verification */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Homeowner Verification</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are you speaking to the homeowner?
                  </label>
                  <p className="text-xs text-red-600 mb-3">
                    You cannot proceed unless you are speaking to the property owner, or the person you are speaking to can confirm ALL owners of the property will be available on the day of appointment.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="speaking_to_homeowner"
                        checked={formData.speaking_to_homeowner === true}
                        onChange={() => handleBooleanChange('speaking_to_homeowner', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="speaking_to_homeowner"
                        checked={formData.speaking_to_homeowner === false}
                        onChange={() => handleBooleanChange('speaking_to_homeowner', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Will both home owners be present?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    This is important to ensure we meet our legal requirements under FCA and EPVS as both homeowners are required to review all figures we produce on the day.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="both_homeowners_present"
                        checked={formData.both_homeowners_present === true}
                        onChange={() => handleBooleanChange('both_homeowners_present', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="both_homeowners_present"
                        checked={formData.both_homeowners_present === false}
                        onChange={() => handleBooleanChange('both_homeowners_present', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Restrictions */}
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Property Restrictions</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is the property listed?
                  </label>
                  <p className="text-xs text-red-600 mb-3">
                    If YES you cannot proceed as it is unlikely the customer will get planning permission.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="property_listed"
                        checked={formData.property_listed === true}
                        onChange={() => handleBooleanChange('property_listed', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="property_listed"
                        checked={formData.property_listed === false}
                        onChange={() => handleBooleanChange('property_listed', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is the property in a conservation area?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    If YES please map check and ensure that there is room for at least x1 array with a minimum of 8 panels on a part of the roof NOT visible from a main road.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="conservation_area"
                        checked={formData.conservation_area === true}
                        onChange={() => handleBooleanChange('conservation_area', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="conservation_area"
                        checked={formData.conservation_area === false}
                        onChange={() => handleBooleanChange('conservation_area', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have any building work ongoing or planning in next 6 months?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    If the roof is in a state of disrepair, we MAY not be able to offer an appointment. Find out more information here and offer our range of services (i.e. in roof solar system / quote for repair while on site) Also check if work recently finished as we MAY be able to utilize existing scaffolding (saving customer £500-£1000).
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="building_work_ongoing"
                        checked={formData.building_work_ongoing === true}
                        onChange={() => handleBooleanChange('building_work_ongoing', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="building_work_ongoing"
                        checked={formData.building_work_ongoing === false}
                        onChange={() => handleBooleanChange('building_work_ongoing', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Does the property have spray foam?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    We MAY not be able to install where spray foam is present or we MAY have to have the customer sign a disclaimer for any future water ingress. Strongly consider if it is worthwhile booking the appointment.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="spray_foam_roof"
                        checked={formData.spray_foam_roof === true}
                        onChange={() => handleBooleanChange('spray_foam_roof', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="spray_foam_roof"
                        checked={formData.spray_foam_roof === false}
                        onChange={() => handleBooleanChange('spray_foam_roof', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is the roof shaded or obstructed?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Ensure that the EIGHT panels are able to be placed in an area of the roof that is free from obstructions (velux/dormas) and that they will not be completely shaded by nearby trees or properties.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="roof_shaded_obstructed"
                        checked={formData.roof_shaded_obstructed === true}
                        onChange={() => handleBooleanChange('roof_shaded_obstructed', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="roof_shaded_obstructed"
                        checked={formData.roof_shaded_obstructed === false}
                        onChange={() => handleBooleanChange('roof_shaded_obstructed', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Awareness */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Awareness</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  The customer is aware there are NO grants for solar?
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Ensure that the customer is aware there are NO schemes or grants available to cover the cost of solar. Instead advise them that solar is now cheaper with 0% VAT, we offer no deposit option paid over a maximum of 25 years (to make monthly cost as low as possible) and that we are currently offering a £1500 discount on installations.
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="customer_aware_no_grants"
                      checked={formData.customer_aware_no_grants === true}
                      onChange={() => handleBooleanChange('customer_aware_no_grants', true)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="customer_aware_no_grants"
                      checked={formData.customer_aware_no_grants === false}
                      onChange={() => handleBooleanChange('customer_aware_no_grants', false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Financial Information</h4>
                {(agentData.monthly_electricity_spend || agentData.employment_status) && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Some data from agent
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="current_electric_bill_type" className="block text-sm font-medium text-gray-700 mb-1">
                    What is their current electric bill?
                    {agentData.day_night_rate && (
                      <span className="ml-2 text-xs text-green-600">(Agent: {agentData.day_night_rate})</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Ideally needs to be a minimum of £70 electric only or £140 if they only know their combined (dual fuel) spend.
                    {agentData.monthly_electricity_spend && (
                      <span className="block mt-1 text-green-600">Agent reported: £{agentData.monthly_electricity_spend}/month</span>
                    )}
                  </p>
                  <select
                    id="current_electric_bill_type"
                    name="current_electric_bill_type"
                    value={formData.current_electric_bill_type || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select...</option>
                    <option value="electric">Electric</option>
                    <option value="gas">Gas</option>
                    <option value="dual">Dual</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="customer_age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age:
                  </label>
                  <input
                    type="number"
                    id="customer_age"
                    name="customer_age"
                    value={formData.customer_age || ''}
                    onChange={handleChange}
                    min="18"
                    max="70"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aged between 18 & 70?
                    {agentData.age_range_18_74 !== undefined && (
                      <span className="ml-2 text-xs text-green-600">
                        (Agent: {agentData.age_range_18_74 ? 'Yes' : 'No'})
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-red-600 mb-3">
                    Customers MUST be between these ages to access finances or lease options. If NOT advise them that they may not see the full returns of the system and will only be able to pay cash. Price condition them at £10K to £14K to ensure they are fully aware before offering an appointment.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="aged_18_70"
                        checked={formData.aged_18_70 === true}
                        onChange={() => handleBooleanChange('aged_18_70', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="aged_18_70"
                        checked={formData.aged_18_70 === false}
                        onChange={() => handleBooleanChange('aged_18_70', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is the customer currently employed?
                    {agentData.employment_status && (
                      <span className="ml-2 text-xs text-green-600">
                        (Agent: {agentData.employment_status})
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    If the customer is NOT employed it is unlikely they will be able to access finance or lease options. Price condition them so they are aware of £10K to £14K cash price. Retired customer under age of 70 should be considered as employed.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="currently_employed"
                        checked={formData.currently_employed === true}
                        onChange={() => handleBooleanChange('currently_employed', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="currently_employed"
                        checked={formData.currently_employed === false}
                        onChange={() => handleBooleanChange('currently_employed', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do they have good credit?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    If NO the customer is unlikely to qualify for finance or lease options. Customer with CCJs, bankruptcy (within 7 years) or CIFAS markers on their credit file can be price conditioned at £10K to £14K as a cash purchase.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_good_credit"
                        checked={formData.has_good_credit === true}
                        onChange={() => handleBooleanChange('has_good_credit', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="has_good_credit"
                        checked={formData.has_good_credit === false}
                        onChange={() => handleBooleanChange('has_good_credit', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you earn over £12K per year?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="earns_over_12k"
                        checked={formData.earns_over_12k === true}
                        onChange={() => handleBooleanChange('earns_over_12k', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="earns_over_12k"
                        checked={formData.earns_over_12k === false}
                        onChange={() => handleBooleanChange('earns_over_12k', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are they planning to move within 5 years?
                    {agentData.moving_within_5_years !== undefined && (
                      <span className="ml-2 text-xs text-green-600">
                        (Agent: {agentData.moving_within_5_years ? 'Yes' : 'No'})
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    If YES advise the customer the solar is often long-term investment and as such it may not be suitable if they are planning to move. We CANNOT move solar panels to their next property after they are installed. If the customer is still interested despite this, price condition them at £10K to £14K before booking.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="planning_to_move_5_years"
                        checked={formData.planning_to_move_5_years === true}
                        onChange={() => handleBooleanChange('planning_to_move_5_years', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="planning_to_move_5_years"
                        checked={formData.planning_to_move_5_years === false}
                        onChange={() => handleBooleanChange('planning_to_move_5_years', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is the customer available for an appointment within the next 3 working days?
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    If NO then please ring to appoint the customer as our calendars are very busy and we can only secure them a surveyor within a 3 working day window.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="available_3_working_days"
                        checked={formData.available_3_working_days === true}
                        onChange={() => handleBooleanChange('available_3_working_days', true)}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="available_3_working_days"
                        checked={formData.available_3_working_days === false}
                        onChange={() => handleBooleanChange('available_3_working_days', false)}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
          </div>

            {/* Qualification Status and Appointment */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Qualification Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="sent_to_kelly">📋 Sent to Qualifier (Current)</option>
                  <option value="no_contact">📞 No Contact</option>
                  <option value="blow_out">💨 Blow Out</option>
                  <option value="appointment_set">📅 Appointment Set</option>
                  <option value="not_interested">❌ Not Interested</option>
                  <option value="pass_back_to_agent">↩️ Pass Back to Agent</option>
                  <option value="on_hold">⏸️ On Hold</option>
        <option value="qualifier_callback">📞 Qualifier Callback</option>
                </select>
              </div>
                {formData.status === 'appointment_set' && (
                  <div>
                    <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      id="appointment_date"
                      name="appointment_date"
                      value={formData.appointment_date || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
                {formData.status === 'appointment_set' && (
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
            </div>

            {/* Qualifier Notes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Qualifier Notes</h4>
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
                  placeholder="Add any additional notes about this qualification..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white pb-4">
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
                  'Save Qualification'
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
