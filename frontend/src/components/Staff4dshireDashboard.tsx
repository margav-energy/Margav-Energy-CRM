import React, { useState, useEffect, useCallback } from 'react';
import { Lead, LeadForm } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import Staff4dshireForm from './Staff4dshireForm';
import LeadCard from './LeadCard';

const Staff4dshireDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const cardsPerPage = 4;

  const fetchLeads = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await leadsAPI.getLeads({
        page_size: 50,
      });
      // Filter to show only leads created by this staff4dshire user
      const myLeads = response.results.filter(lead => 
        lead.assigned_agent === user?.id || 
        (lead.notes && lead.notes.includes('Staff4dshire Lead Submission'))
      );
      setLeads(myLeads);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeads();
    
    // Set up auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchLeads(false); // Don't show loading during auto-refresh
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchLeads]);

  // Filtering and pagination logic
  const getFilteredLeads = () => {
    if (!statusFilter) return leads;
    
    // Group related statuses for filtering
    const statusGroups: { [key: string]: string[] } = {
      'sent_to_kelly': ['sent_to_kelly'],
      'qualified': ['qualified'],
      'appointment_set': ['appointment_set'],
      'not_interested': ['not_interested', 'blow_out'],
    };
    
    const statusesToInclude = statusGroups[statusFilter] || [statusFilter];
    return leads.filter(lead => statusesToInclude.includes(lead.status));
  };
  
  const filteredLeads = getFilteredLeads();
  const totalPages = Math.ceil(filteredLeads.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleCancelForm = () => {
    setShowLeadForm(false);
    setEditingLead(null);
  };

  const handleUpdateLead = async (lead: Lead) => {
    setEditingLead(lead);
    setShowLeadForm(true);
  };

  const handleUpdateLeadSubmit = async (leadData: LeadForm) => {
    if (!editingLead) return;
    
    try {
      const updatedLead = await leadsAPI.updateLead(editingLead.id, leadData);
      setLeads(prev => prev.map(lead => lead.id === editingLead.id ? updatedLead : lead));
      setShowLeadForm(false);
      setEditingLead(null);
      toast.success('Lead updated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to update lead';
      toast.error(errorMessage);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!window.confirm(`Are you sure you want to delete the lead for ${lead.full_name}?`)) {
      return;
    }

    try {
      await leadsAPI.deleteLead(lead.id);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      toast.success('Lead deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const getStatusCounts = () => {
    const counts = {
      sent_to_kelly: 0,
      qualified: 0,
      appointment_set: 0,
      not_interested: 0,
    };

    leads.forEach(lead => {
      if (lead.status === 'sent_to_kelly') {
        counts.sent_to_kelly++;
      } else if (lead.status === 'qualified') {
        counts.qualified++;
      } else if (lead.status === 'appointment_set') {
        counts.appointment_set++;
      } else if (lead.status === 'not_interested' || lead.status === 'blow_out') {
        counts.not_interested++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

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
      <div className="card-margav p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {user?.first_name ? `${user.first_name}'s Dashboard` : 'Staff4dshire Dashboard'}
            </h2>
            <p className="text-gray-600 mt-1">Submit leads for qualification</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLeadForm(true)}
              className="btn-margav-primary"
            >
              Add New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => handleStatusFilter(statusFilter === 'sent_to_kelly' ? null : 'sent_to_kelly')}
          className={`card-margav p-6 transition-all duration-200 hover:shadow-lg ${statusFilter === 'sent_to_kelly' ? 'ring-2 ring-amber-500 bg-amber-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">📤</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Sent to Qualifier</dt>
                <dd className="text-2xl font-bold text-gray-900">{statusCounts.sent_to_kelly}</dd>
              </dl>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleStatusFilter(statusFilter === 'qualified' ? null : 'qualified')}
          className={`card-margav p-6 transition-all duration-200 hover:shadow-lg ${statusFilter === 'qualified' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">✓</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Qualified</dt>
                <dd className="text-2xl font-bold text-gray-900">{statusCounts.qualified}</dd>
              </dl>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleStatusFilter(statusFilter === 'appointment_set' ? null : 'appointment_set')}
          className={`card-margav p-6 transition-all duration-200 hover:shadow-lg ${statusFilter === 'appointment_set' ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">📅</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Appointments Set</dt>
                <dd className="text-2xl font-bold text-gray-900">{statusCounts.appointment_set}</dd>
              </dl>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleStatusFilter(statusFilter === 'not_interested' ? null : 'not_interested')}
          className={`card-margav p-6 transition-all duration-200 hover:shadow-lg ${statusFilter === 'not_interested' ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">✗</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Not Interested</dt>
                <dd className="text-2xl font-bold text-gray-900">{statusCounts.not_interested}</dd>
              </dl>
            </div>
          </div>
        </button>
      </div>

      {/* Filter Indicator */}
      {statusFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-800 font-medium">
                Filtering by: <span className="capitalize">{statusFilter.replace('_', ' ')}</span>
              </span>
              <span className="ml-2 text-blue-600 text-sm">
                ({filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''})
              </span>
            </div>
            <button
              onClick={() => handleStatusFilter(null)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingLead ? 'Edit Lead' : 'Submit New Lead'}
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <Staff4dshireForm 
              lead={editingLead || undefined}
              onSubmit={editingLead ? handleUpdateLeadSubmit : undefined}
              onSuccess={() => {
                fetchLeads();
                setShowLeadForm(false);
                setEditingLead(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="card-margav">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Your Submitted Leads</h3>
          <p className="text-sm text-gray-600 mt-1">Track the status of your submitted leads</p>
        </div>
        <div className="p-6">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-400">📋</span>
              </div>
              <p className="text-gray-500 text-lg">No leads submitted yet.</p>
              <p className="text-gray-400 text-sm mt-2">Use the "Add New Lead" button to get started.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentLeads.map((lead) => (
                  <LeadCard
                    key={`lead-${lead.id}`}
                    lead={lead}
                    onUpdate={handleUpdateLead}
                    onDelete={handleDeleteLead}
                    showActions={true}
                    callbacks={[]}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff4dshireDashboard;
