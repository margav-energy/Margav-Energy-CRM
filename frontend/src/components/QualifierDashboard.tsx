import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
// import LeadCard from './LeadCard';
import QualifierLeadModal from './QualifierLeadModal';
import AppointmentForm from './AppointmentForm';

const QualifierDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLead, setUpdatingLead] = useState<Lead | null>(null);
  const [appointmentLead, setAppointmentLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      // Fetch all leads that the qualifier has processed (not just sent_to_kelly)
      const response = await leadsAPI.getLeads();
      setLeads(response.results);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // const handleUpdateLead = async (lead: Lead) => {
  //   setUpdatingLead(lead);
  // };

  const handleLeadUpdate = async () => {
    try {
      // Refresh the leads list to get updated data
      await fetchLeads();
      
      setUpdatingLead(null);
    } catch (error) {
      console.error('Failed to qualify lead:', error);
      toast.error('Failed to qualify lead');
    }
  };

  // const handleScheduleAppointment = (lead: Lead) => {
  //   setAppointmentLead(lead);
  // };

  const handleAppointmentSuccess = async () => {
    await fetchLeads();
    setAppointmentLead(null);
  };

  const getStatusCounts = () => {
    const counts = {
      cold_call: 0,
      interested: 0,
      qualified: 0,
      appointment_set: 0,
      not_interested: 0,
      tenant: 0,
      other_disposition: 0,
      sent_to_kelly: 0,
      appointment_completed: 0,
      sale_made: 0,
      sale_lost: 0,
      no_contact: 0,
      blow_out: 0,
      pass_back_to_agent: 0,
    };

    leads.forEach(lead => {
      if (lead.status in counts) {
        counts[lead.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  // Filter leads based on current filters
  const getFilteredLeads = () => {
    let filtered = leads;
    
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    if (agentFilter) {
      filtered = filtered.filter(lead => lead.assigned_agent === parseInt(agentFilter));
    }
    
    return filtered;
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setAgentFilter(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {user?.first_name || 'Qualifier'}'s Dashboard
            </h2>
            <p className="text-gray-600">Review and qualify leads sent from agents</p>
          </div>
          <button
            onClick={fetchLeads}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Refresh Leads
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sent to Kelly</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.sent_to_kelly}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">📞</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">No Contact</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.no_contact}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-medium">💨</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Blow Out</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.blow_out}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Appointments Set</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.appointment_set}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

      </div>



      {/* Qualification Modal */}
      {updatingLead && (
        <QualifierLeadModal
          lead={updatingLead}
          onClose={() => setUpdatingLead(null)}
          onSuccess={handleLeadUpdate}
        />
      )}

      {/* Appointment Form Modal */}
      {appointmentLead && (
        <AppointmentForm
          lead={appointmentLead}
          onClose={() => setAppointmentLead(null)}
          onSuccess={handleAppointmentSuccess}
        />
      )}
    </div>
  );
};

export default QualifierDashboard;
