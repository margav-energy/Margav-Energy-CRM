import React, { useState, useEffect } from 'react';
import { Lead, LeadForm as LeadFormType, Callback, CallbackForm } from '../types';
import { leadsAPI, notificationsAPI, callbacksAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import LeadCard from './LeadCard';
import LeadForm from './LeadForm';
import NotificationPanel from './NotificationPanel';
import CallbackCompletionModal from './CallbackCompletionModal';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [dueCallbacks, setDueCallbacks] = useState<Callback[]>([]);
  const [shownNotifications, setShownNotifications] = useState<Set<number>>(new Set());
  const [selectedCallback, setSelectedCallback] = useState<Callback | null>(null);
  const [showCallbackCompletion, setShowCallbackCompletion] = useState(false);
  const cardsPerPage = 4;
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [prepopulatedData, setPrepopulatedData] = useState<{
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
  } | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchNotificationCount();
    fetchCallbacks();
    checkForDialerLead();
    
    // Set up auto-refresh every 30 seconds (reduced frequency)
    const refreshInterval = setInterval(() => {
      fetchLeads(false); // Don't show loading during auto-refresh
      fetchNotificationCount();
      // fetchCallbacks(); // Disabled to prevent spam notifications
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for URL parameters indicating a lead from dialer
  // Filtering and pagination logic
  const filteredLeads = statusFilter ? leads.filter(lead => lead.status === statusFilter) : leads;
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

  const checkForDialerLead = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromDialer = urlParams.get('from_dialer');
    const leadId = urlParams.get('lead_id');
    
    if (fromDialer === 'true') {
      // Extract comprehensive prepopulated data from URL parameters
      const prepopulatedData = {
        // Basic fields
        full_name: urlParams.get('full_name') || '',
        phone: urlParams.get('phone') || '',
        email: urlParams.get('email') || '',
        address: urlParams.get('address') || '',
        postcode: urlParams.get('postcode') || '',
        notes: urlParams.get('notes') || '',
        lead_id: leadId || undefined,
        
        // Comprehensive dialer fields
        dialer_lead_id: urlParams.get('dialer_lead_id') || '',
        vendor_id: urlParams.get('vendor_id') || '',
        list_id: urlParams.get('list_id') || '',
        gmt_offset_now: urlParams.get('gmt_offset_now') || '',
        phone_code: urlParams.get('phone_code') || '',
        phone_number: urlParams.get('phone_number') || '',
        title: urlParams.get('title') || '',
        first_name: urlParams.get('first_name') || '',
        middle_initial: urlParams.get('middle_initial') || '',
        last_name: urlParams.get('last_name') || '',
        address1: urlParams.get('address1') || '',
        address2: urlParams.get('address2') || '',
        address3: urlParams.get('address3') || '',
        city: urlParams.get('city') || '',
        state: urlParams.get('state') || '',
        province: urlParams.get('province') || '',
        postal_code: urlParams.get('postal_code') || '',
        country_code: urlParams.get('country_code') || '',
        gender: urlParams.get('gender') || '',
        date_of_birth: urlParams.get('date_of_birth') || '',
        alt_phone: urlParams.get('alt_phone') || '',
        security_phrase: urlParams.get('security_phrase') || '',
        comments: urlParams.get('comments') || '',
        user: urlParams.get('user') || '',
        campaign: urlParams.get('campaign') || '',
        phone_login: urlParams.get('phone_login') || '',
        fronter: urlParams.get('fronter') || '',
        closer: urlParams.get('closer') || '',
        group: urlParams.get('group') || '',
        channel_group: urlParams.get('channel_group') || '',
        SQLdate: urlParams.get('SQLdate') || '',
        epoch: urlParams.get('epoch') || '',
        uniqueid: urlParams.get('uniqueid') || '',
        customer_zap_channel: urlParams.get('customer_zap_channel') || '',
        server_ip: urlParams.get('server_ip') || '',
        SIPexten: urlParams.get('SIPexten') || '',
        session_id: urlParams.get('session_id') || '',
        dialed_number: urlParams.get('dialed_number') || '',
        dialed_label: urlParams.get('dialed_label') || '',
        rank: urlParams.get('rank') || '',
        owner: urlParams.get('owner') || '',
        camp_script: urlParams.get('camp_script') || '',
        in_script: urlParams.get('in_script') || '',
        script_width: urlParams.get('script_width') || '',
        script_height: urlParams.get('script_height') || '',
        recording_file: urlParams.get('recording_file') || '',
      };
      
      // Set prepopulated data and open the form
      setPrepopulatedData(prepopulatedData);
      setShowLeadForm(true);
      
      // Show success notification
      toast.success('New lead received from dialer! Form is prepopulated and ready to complete.', {
        position: 'top-right',
        autoClose: 5000,
      });
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      const unread = response.results.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const fetchLeads = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await leadsAPI.getMyLeads();
      
      // DISABLED: Toast notifications for new leads are disabled
      // if (newLeads.length > 0 && !showLoading && !isInitialLoad) {
      //   toast.success(`${newLeads.length} new lead(s) received!`, {
      //     position: 'top-right',
      //     autoClose: 3000,
      //   });
      // }
      
      setLeads(response.results);
      
      // Reset to first page if current page is beyond available pages
      const newTotalPages = Math.ceil(response.results.length / cardsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
      }
      
      // Mark that initial load is complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      if (showLoading) {
        toast.error('Failed to fetch leads');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const fetchCallbacks = async () => {
    try {
      const [callbacksData, dueCallbacksData] = await Promise.all([
        callbacksAPI.getCallbacks(),
        callbacksAPI.getDueCallbacks()
      ]);
      
      setCallbacks(callbacksData);
      setDueCallbacks(dueCallbacksData);
      
      // DISABLED: Automatic callback notifications to prevent spam
      // Callback reminders are now shown in the UI instead of toasters
    } catch (error) {
      console.error('Error fetching callbacks:', error);
    }
  };

  const handleCreateLead = async (leadData: LeadFormType, pendingCallback?: CallbackForm) => {
    try {
      console.log('AgentDashboard: User authenticated:', !!user);
      console.log('AgentDashboard: User ID:', user?.id);
      setFormLoading(true);
      
      // Check if we're updating an existing lead from dialer
      if (prepopulatedData?.lead_id) {
        // Update existing lead from dialer
        const leadDataWithStatus: LeadFormType & { status: Lead['status']; assigned_agent: number } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status'],
          assigned_agent: user?.id || 0
        };
        const updatedLead = await leadsAPI.updateLead(parseInt(prepopulatedData.lead_id), leadDataWithStatus);
        
        // Update the leads list
        setLeads(prev => prev.map(lead => 
          lead.id === updatedLead.id ? updatedLead : lead
        ));
        
        toast.success('Lead updated successfully and sent to qualifier!');
      } else {
        // Create new lead - check if it's a callback lead by looking for callback status in the data
        const isCallbackLead = (leadData as any).status === 'callback';
        console.log('Lead data status:', (leadData as any).status);
        console.log('Is callback lead:', isCallbackLead);
        const leadDataWithStatus: LeadFormType & { status: Lead['status'] } = {
          ...leadData,
          status: isCallbackLead ? 'callback' as Lead['status'] : 'sent_to_kelly' as Lead['status']
        };
        console.log('Creating lead with data:', leadDataWithStatus);
        const newLead = await leadsAPI.createLead(leadDataWithStatus);
        setLeads(prev => [newLead, ...prev]);
        
        if (isCallbackLead) {
          toast.success('Lead created successfully with callback status!');
          
          // Schedule the callback if there's pending callback data
          if (pendingCallback) {
            try {
              console.log('Original callback data:', pendingCallback);
              console.log('New lead ID:', newLead.id);
              
              const callbackDataWithLeadId = {
                lead: Number(newLead.id), // Ensure it's a number
                scheduled_time: pendingCallback.scheduled_time,
                notes: pendingCallback.notes || ''
              };
              console.log('Original pendingCallback:', pendingCallback);
              console.log('New lead ID:', newLead.id);
              console.log('New lead ID type:', typeof newLead.id);
              console.log('Creating callback with data:', callbackDataWithLeadId);
              console.log('Callback data lead field type:', typeof callbackDataWithLeadId.lead);
              await callbacksAPI.createCallback(callbackDataWithLeadId);
              toast.success('Callback scheduled successfully!');
              
              // Refresh callbacks to update the display
              await fetchCallbacks(); // Immediate refresh
            } catch (callbackError: any) {
              console.error('Error scheduling callback:', callbackError);
              console.error('Callback error details:', callbackError.response?.data);
              toast.error(`Lead created but callback scheduling failed: ${callbackError.response?.data?.error || callbackError.message || 'Unknown error'}. Please schedule manually.`);
            }
          }
        } else {
          toast.success('Lead created successfully and sent to qualifier!');
        }
      }
      
      setShowLeadForm(false);
      setEditingLead(null);
      setPrepopulatedData(null);
    } catch (error) {
      console.error('Failed to create/update lead:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to create/update lead';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data) {
          if (typeof axiosError.response.data === 'string') {
            errorMessage = axiosError.response.data;
          } else if (axiosError.response.data.detail) {
            errorMessage = axiosError.response.data.detail;
          } else if (axiosError.response.data.phone) {
            errorMessage = axiosError.response.data.phone[0];
          } else if (axiosError.response.data.full_name) {
            errorMessage = axiosError.response.data.full_name[0];
          }
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLead = async (lead: Lead) => {
    setEditingLead(lead);
    setShowLeadForm(true);
  };

  const handleUpdateLeadSubmit = async (leadData: LeadFormType) => {
    if (!editingLead) return;
    
    try {
      setFormLoading(true);
      const updatedLead = await leadsAPI.updateLead(editingLead.id, leadData);
      setLeads(prev => prev.map(lead => lead.id === editingLead.id ? updatedLead : lead));
      setShowLeadForm(false);
      setEditingLead(null);
      setPrepopulatedData(null);
      toast.success('Lead updated successfully!');
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendToQualifier = async (leadData: LeadFormType) => {
    try {
      setFormLoading(true);
      
      if (editingLead) {
        // Update existing lead and send to qualifier
        const leadDataWithStatus: LeadFormType & { status: Lead['status']; assigned_agent: number } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status'],
          assigned_agent: user?.id || 0
        };
        const updatedLead = await leadsAPI.updateLead(editingLead.id, leadDataWithStatus);
        setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead updated and sent to qualifier!');
      } else if (prepopulatedData?.lead_id) {
        // Update existing lead from dialer and send to qualifier
        const leadDataWithStatus: LeadFormType & { status: Lead['status']; assigned_agent: number } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status'],
          assigned_agent: user?.id || 0
        };
        const updatedLead = await leadsAPI.updateLead(parseInt(prepopulatedData.lead_id), leadDataWithStatus);
        setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead updated and sent to qualifier!');
      } else {
        // Create new lead and send to qualifier
        const leadDataWithStatus: LeadFormType & { status: Lead['status']; assigned_agent: number } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status'],
          assigned_agent: user?.id || 0
        };
        const newLead = await leadsAPI.createLead(leadDataWithStatus);
        setLeads(prev => [newLead, ...prev]);
        toast.success('Lead created and sent to qualifier!');
      }
      
      setShowLeadForm(false);
      setEditingLead(null);
      setPrepopulatedData(null);
    } catch (error) {
      console.error('Failed to send lead to qualifier:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to send lead to qualifier';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data) {
          if (typeof axiosError.response.data === 'string') {
            errorMessage = axiosError.response.data;
          } else if (axiosError.response.data.detail) {
            errorMessage = axiosError.response.data.detail;
          } else if (axiosError.response.data.phone) {
            errorMessage = axiosError.response.data.phone[0];
          } else if (axiosError.response.data.full_name) {
            errorMessage = axiosError.response.data.full_name[0];
          }
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!window.confirm(`Are you sure you want to delete the lead for ${lead.full_name}?`)) {
      return;
    }

    try {
      await leadsAPI.deleteLead(lead.id);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      toast.success('Lead deleted successfully!');
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleCancelForm = () => {
    setShowLeadForm(false);
    setEditingLead(null);
    setPrepopulatedData(null);
  };

  const handleCompleteCallback = (callback: Callback) => {
    setSelectedCallback(callback);
    setShowCallbackCompletion(true);
  };

  const handleCallbackCompleted = async () => {
    if (selectedCallback) {
      // Refresh callbacks to update the display
      await fetchCallbacks();
      toast.success('Callback marked as completed!');
    }
    setSelectedCallback(null);
    setShowCallbackCompletion(false);
  };



  const getStatusCounts = () => {
    const counts = {
      cold_call: 0,
      interested: 0,
      appointment_set: 0,
      not_interested: 0,
      tenant: 0,
      other_disposition: 0,
      sent_to_kelly: 0,
      appointment_completed: 0,
      sale_made: 0,
      sale_lost: 0,
      callbacks: 0,
    };

    leads.forEach(lead => {
      if (lead.status in counts) {
        counts[lead.status as keyof typeof counts]++;
      }
    });

    // Update callback count from actual callbacks data
    counts.callbacks = callbacks.filter(callback => callback.status === 'scheduled').length;

    return counts;
  };

  const getCallbackCount = () => {
    return callbacks.filter(callback => callback.status === 'scheduled').length;
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
              {user?.first_name ? `${user.first_name}'s Dashboard` : 'Agent Dashboard'}
            </h2>
            <p className="text-gray-600 mt-1">Manage your assigned leads</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-2xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowLeadForm(true)}
              className="btn-margav-primary"
            >
              Add New Lead
            </button>
          </div>
        </div>
      </div>

      {/* Callback Reminders */}
      {dueCallbacks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Callback Reminders ({dueCallbacks.length})
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                {dueCallbacks.slice(0, 3).map((callback, index) => (
                  <div key={callback.id} className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <span className="font-medium">{callback.lead_name}</span>
                      <span className="ml-2 text-orange-600">
                        {new Date(callback.scheduled_time).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCompleteCallback(callback)}
                      className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                    >
                      Complete
                    </button>
                  </div>
                ))}
                {dueCallbacks.length > 3 && (
                  <div className="text-orange-600 font-medium">
                    +{dueCallbacks.length - 3} more callbacks
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => handleStatusFilter(statusFilter === 'interested' ? null : 'interested')}
          className={`card-margav p-6 transition-all duration-200 hover:shadow-lg ${statusFilter === 'interested' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">I</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Interested</dt>
                <dd className="text-2xl font-bold text-gray-900">{statusCounts.interested + statusCounts.sent_to_kelly}</dd>
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
                <span className="text-white text-lg font-bold">N</span>
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

        <button 
          onClick={() => handleStatusFilter(statusFilter === 'callback' ? null : 'callback')}
          className={`card-margav p-6 transition-all duration-200 hover:shadow-lg ${statusFilter === 'callback' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">📞</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Callbacks</dt>
                <dd className="text-2xl font-bold text-gray-900">{getCallbackCount()}</dd>
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
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <LeadForm
                  lead={editingLead || undefined}
                  onSubmit={editingLead ? handleUpdateLeadSubmit : handleCreateLead}
                  onCancel={handleCancelForm}
                  loading={formLoading}
                  prepopulatedData={prepopulatedData || undefined}
                  onSendToQualifier={handleSendToQualifier}
                />
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="card-margav">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Your Leads</h3>
          <p className="text-sm text-gray-600 mt-1">Manage and track your assigned leads</p>
        </div>
        <div className="p-6">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl text-gray-400">📋</span>
              </div>
              <p className="text-gray-500 text-lg">No leads assigned to you yet.</p>
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
                    callbacks={callbacks}
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

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchNotificationCount(); // Refresh count when closing
        }}
      />

      {/* Callback Completion Modal */}
      {selectedCallback && (
        <CallbackCompletionModal
          callback={selectedCallback}
          isOpen={showCallbackCompletion}
          onClose={() => {
            setShowCallbackCompletion(false);
            setSelectedCallback(null);
          }}
          onComplete={handleCallbackCompleted}
        />
      )}
    </div>
  );
};

export default AgentDashboard;
