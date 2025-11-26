// Notification types
export interface LeadNotification {
  id: number;
  lead: number;
  lead_name: string;
  lead_phone: string;
  agent: number;
  qualifier: number;
  qualifier_name: string;
  message: string;
  notification_type: 'status_update' | 'appointment_set' | 'qualification_result';
  is_read: boolean;
  created_at: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'agent' | 'qualifier' | 'salesrep' | 'admin' | 'canvasser' | 'staff4dshire' | 'ai_agent';
  phone?: string;
  date_joined: string;
}

// Lead types
export interface Lead {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  address1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  status: 'cold_call' | 'interested' | 'not_interested' | 'tenant' | 'other_disposition' | 'sent_to_kelly' | 'qualified' | 'appointment_set' | 'appointment_completed' | 'sale_made' | 'sale_lost' | 'no_contact' | 'blow_out' | 'callback' | 'pass_back_to_agent' | 'on_hold' | 'qualifier_callback';
  disposition?: 'not_interested' | 'tenant' | 'wrong_number' | 'no_answer' | 'callback_requested' | 'do_not_call' | 'other';
  assigned_agent: number;
  assigned_agent_name: string;
  assigned_agent_username: string;
  field_sales_rep?: number;
  field_sales_rep_name?: string;
  field_sales_rep_username?: string;
  notes?: string;
  qualifier_notes?: string;
  appointment_date?: string;
  qualifier_callback_date?: string;
  google_calendar_event_id?: string;
  sale_amount?: number;
  energy_bill_amount?: number;
  has_ev_charger?: boolean;
  day_night_rate?: 'yes' | 'no';
  has_previous_quotes?: boolean;
  previous_quotes_details?: string;
  // Contact Information
  preferred_contact_time?: string;
  // Property Information
  property_ownership?: string;
  lives_with_partner?: boolean;
  age_range_18_74?: boolean;
  moving_within_5_years?: boolean;
  // Roof and Property Condition
  loft_conversions?: boolean;
  velux_windows?: boolean;
  dormers?: boolean;
  dormas_shading_windows?: boolean;
  spray_foam_roof?: boolean;
  building_work_roof?: boolean;
  // Financial and Employment Status
  monthly_electricity_spend?: number;
  employment_status?: 'employed' | 'unemployed' | 'self-employed' | 'retired';
  debt_management_bankruptcy?: boolean;
  government_grants_aware?: boolean;
  // Energy Usage
  current_energy_supplier?: string;
  electric_heating_appliances?: string;
  energy_details?: string;
  // Appointment Booking
  assessment_date_preference?: string;
  assessment_time_preference?: string;
  // Qualifier Lead Sheet Fields
  desktop_roof_check_completed?: boolean;
  property_type_qualifier?: 'detached' | 'semi-detached' | 'terraced' | 'bungalow' | 'caravan' | 'commercial' | 'other';
  roof_type_qualifier?: 'hip' | 'gable' | 'flat';
  speaking_to_homeowner?: boolean;
  both_homeowners_present?: boolean;
  property_listed?: boolean;
  conservation_area?: boolean;
  building_work_ongoing?: boolean;
  roof_shaded_obstructed?: boolean;
  customer_aware_no_grants?: boolean;
  current_electric_bill_type?: 'electric' | 'gas' | 'dual';
  customer_age?: number;
  aged_18_70?: boolean;
  currently_employed?: boolean;
  has_good_credit?: boolean;
  earns_over_12k?: boolean;
  planning_to_move_5_years?: boolean;
  available_3_working_days?: boolean;
  field_submission_data?: {
    id: number;
    canvasser_name: string;
    assessment_date: string;
    assessment_time: string;
    photos: {
      frontRoof: string;
      rearRoof: string;
      sideRoof: string;
      energyBill: string;
      additional?: string[];
    };
    signature: string;
    formatted_notes: string;
    timestamp: string;
  };
  created_at: string;
  updated_at: string;
}

// Dialer types
export interface Dialer {
  id: number;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface LeadForm {
  full_name?: string;
  phone?: string;
  email?: string;
  address1?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
  energy_bill_amount?: number;
  has_ev_charger?: boolean;
  day_night_rate?: 'yes' | 'no';
  has_previous_quotes?: boolean;
  previous_quotes_details?: string;
  // Contact Information
  preferred_contact_time?: string;
  // Property Information
  property_ownership?: string;
  lives_with_partner?: boolean;
  age_range_18_74?: boolean;
  moving_within_5_years?: boolean;
  property_type?: string;
  number_of_bedrooms?: string;
  roof_type?: string;
  roof_material?: string;
  // Roof and Property Condition
  loft_conversions?: boolean;
  velux_windows?: boolean;
  dormers?: boolean;
  dormas_shading_windows?: boolean;
  spray_foam_roof?: boolean;
  building_work_roof?: boolean;
  // Financial and Employment Status
  monthly_electricity_spend?: number;
  employment_status?: 'employed' | 'unemployed' | 'self-employed' | 'retired';
  debt_management_bankruptcy?: boolean;
  government_grants_aware?: boolean;
  // Energy Usage
  current_energy_supplier?: string;
  electric_heating_appliances?: string;
  energy_details?: string;
  // Timeframe & Interest
  timeframe?: string;
  timeframe_details?: string;
  // Appointment Booking
  assessment_date_preference?: string;
  assessment_time_preference?: string;
  // Add fields needed for updates
  status?: Lead['status'];
  appointment_date?: string;
}

export interface LeadUpdateForm {
  status?: Lead['status'];
  disposition?: Lead['disposition'];
  notes?: string;
  qualifier_notes?: string;
  appointment_date?: string | null;
  qualifier_callback_date?: string | null;
  field_sales_rep?: number | null;
  sale_amount?: number;
  energy_bill_amount?: number;
  has_ev_charger?: boolean;
  day_night_rate?: 'yes' | 'no';
  has_previous_quotes?: boolean;
  previous_quotes_details?: string;
  // Add missing fields for complete lead updates
  full_name?: string;
  phone?: string;
  email?: string;
  address1?: string;
  city?: string;
  postal_code?: string;
  // Qualifier Lead Sheet Fields
  desktop_roof_check_completed?: boolean;
  property_type_qualifier?: 'detached' | 'semi-detached' | 'terraced' | 'bungalow' | 'caravan' | 'commercial' | 'other';
  roof_type_qualifier?: 'hip' | 'gable' | 'flat';
  speaking_to_homeowner?: boolean;
  both_homeowners_present?: boolean;
  property_listed?: boolean;
  conservation_area?: boolean;
  building_work_ongoing?: boolean;
  roof_shaded_obstructed?: boolean;
  spray_foam_roof?: boolean;
  customer_aware_no_grants?: boolean;
  current_electric_bill_type?: 'electric' | 'gas' | 'dual';
  customer_age?: number;
  aged_18_70?: boolean;
  currently_employed?: boolean;
  has_good_credit?: boolean;
  earns_over_12k?: boolean;
  planning_to_move_5_years?: boolean;
  available_3_working_days?: boolean;
}

export interface LeadDispositionForm {
  status: Lead['status'];
  disposition?: Lead['disposition'];
  notes?: string;
}

// Dashboard props
export interface DashboardProps {
  user: User;
}

// Call simulation types
export interface CallData {
  isActive: boolean;
  lead?: Lead;
  duration: number;
}

// Callback types
export interface Callback {
  id: number;
  lead: number;
  lead_name: string;
  lead_phone: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_answer' | 'sent_to_qualifier';
  notes?: string;
  created_by: number;
  created_by_name: string;
  completed_at?: string;
  is_due: boolean;
  is_overdue: boolean;
}

export interface CallbackForm {
  lead?: number;
  scheduled_time: string;
  notes?: string;
}

// Callback types
export interface Callback {
  id: number;
  lead: number;
  lead_name: string;
  lead_phone: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_answer' | 'sent_to_qualifier';
  notes?: string;
  created_by: number;
  created_by_name: string;
  completed_at?: string;
  is_due: boolean;
  is_overdue: boolean;
}

export interface CallbackForm {
  lead?: number;
  scheduled_time: string;
  notes?: string;
}
