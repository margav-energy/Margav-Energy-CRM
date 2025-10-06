import React, { useState, useEffect } from 'react';
import { Lead, LeadDispositionForm } from '../types';
import { leadsAPI, dialerAPI } from '../api';
import { toast } from 'react-toastify';
import LeadCard from './LeadCard';
import LeadDispositionModal from './LeadDispositionModal';

const ColdCallDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispositionLead, setDispositionLead] = useState<Lead | null>(null);
  const [dispositionLoading, setDispositionLoading] = useState(false);
  const [dialerActive, setDialerActive] = useState(false);

  useEffect(() => {
    fetchDialerStatus();
    fetchColdCallLeads();
    
    // Poll for new leads every 60 seconds when dialer is active and no modals are open
    const interval = setInterval(() => {
      if (dialerActive && !dispositionLead) {
        fetchColdCallLeads();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [dialerActive, dispositionLead]);

  const fetchDialerStatus = async () => {
    try {
      const dialer = await dialerAPI.getDialerStatus();
      setDialerActive(dialer.is_active);
    } catch (error) {
      console.error('Failed to fetch dialer status:', error);
    }
  };

  const fetchColdCallLeads = async () => {
    try {
      setLoading(true);
      const response = await leadsAPI.getColdCallLeads();
      setLeads(response.results);
    } catch (error) {
      console.error('Failed to fetch cold call leads:', error);
      toast.error('Failed to fetch cold call leads');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadDisposition = async (lead: Lead) => {
    setDispositionLead(lead);
  };

  const handleDispositionUpdate = async (disposition: LeadDispositionForm) => {
    if (!dispositionLead) return;

    try {
      setDispositionLoading(true);
      await leadsAPI.updateLeadDisposition(dispositionLead.id, disposition);
      
      // Remove the lead from the list
      setLeads(prev => prev.filter(lead => lead.id !== dispositionLead.id));
      setDispositionLead(null);
      
      toast.success('Lead disposition updated successfully!');
    } catch (error) {
      console.error('Failed to update disposition:', error);
      toast.error('Failed to update lead disposition');
    } finally {
      setDispositionLoading(false);
    }
  };

  const handleInterestedLead = (lead: Lead) => {
    // Instead of opening modal, redirect to agent dashboard with prepopulated data
    const params = new URLSearchParams({
      full_name: lead.full_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      notes: lead.notes || '',
      from_dialer: 'true',
      lead_id: lead.id.toString()
    });
    
    // Redirect to agent dashboard with prepopulated data
    window.location.href = `/agent-dashboard?${params.toString()}`;
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-margav p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Cold Call Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              {dialerActive ? 'Dialer is active - receiving calls' : 'Dialer is inactive - no new calls'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              dialerActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {dialerActive ? 'Dialer Active' : 'Dialer Inactive'}
            </div>
            <button
              onClick={fetchColdCallLeads}
              className="btn-margav-secondary"
            >
              Refresh Leads
            </button>
          </div>
        </div>
      </div>


      {/* Leads List */}
      <div className="card-margav">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Cold Call Leads</h3>
          <p className="text-sm text-gray-600 mt-1">
            {leads.length} leads available for calling
          </p>
        </div>
        <div className="p-6">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-400">📞</span>
              </div>
              <p className="text-gray-500 text-lg">
                {dialerActive ? 'No cold call leads available at the moment.' : 'Dialer is inactive.'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {dialerActive ? 'New leads will appear here when available.' : 'Activate the dialer to receive calls.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {leads.map((lead) => (
                <div key={lead.id} className="card-margav p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{lead.full_name}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Cold Call
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>📞 {lead.phone}</p>
                    {lead.email && <p>📧 {lead.email}</p>}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleLeadDisposition(lead)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Not Interested
                    </button>
                    <button
                      onClick={() => handleInterestedLead(lead)}
                      className="flex-1 btn-margav-primary text-sm px-3 py-2"
                    >
                      Interested
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disposition Modal */}
      {dispositionLead && (
        <LeadDispositionModal
          lead={dispositionLead}
          onUpdate={handleDispositionUpdate}
          onClose={() => setDispositionLead(null)}
          loading={dispositionLoading}
        />
      )}

    </div>
  );
};

export default ColdCallDashboard;
