import React, { useState, useEffect, useRef } from 'react';
import { Lead, LeadForm as LeadFormType, Callback, CallbackForm } from '../types';
import { leadsAPI, notificationsAPI, callbacksAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import LeadCard from './LeadCard';
import LeadForm from './LeadForm';
import NotificationPanel from './NotificationPanel';
import CallbackCompletionModal from './CallbackCompletionModal';
import { useLocalStorageEvents } from '../hooks/useLocalStorageEvents';

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
  // const [shownNotifications, setShownNotifications] = useState<Set<number>>(new Set());
  const [selectedCallback, setSelectedCallback] = useState<Callback | null>(null);
  const [showCallbackCompletion, setShowCallbackCompletion] = useState(false);
  const lastLeadCreationTimeRef = useRef<number>(0);
  const backgroundLoadingInProgress = useRef<boolean>(false);
  const cardsPerPage = 4;
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // LocalStorage events for real-time communication
  const { sendMessage } = useLocalStorageEvents('lead_updates', () => {});
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
    
    // Set up auto-refresh every 60 seconds (increased frequency to prevent interference)
    const refreshInterval = setInterval(() => {
      // Only refresh if no lead was created in the last 90 seconds (increased buffer)
      const timeSinceLastLeadCreation = Date.now() - lastLeadCreationTimeRef.current;
      if (timeSinceLastLeadCreation > 90000) {
        fetchLeads(false); // Don't show loading during auto-refresh
      }
      fetchNotificationCount();
      // fetchCallbacks(); // Disabled to prevent spam notifications
    }, 60000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check for URL parameters indicating a lead from dialer
  // Filtering and pagination logic
  const getFilteredLeads = () => {
    if (!statusFilter) return leads;
    
    // Group related statuses for filtering
    const statusGroups: { [key: string]: string[] } = {
      'interested': ['interested', 'sent_to_kelly'],
      'appointment_set': ['appointment_set'],
      'not_interested': ['not_interested', 'blow_out'],
      'callback': ['callback', 'pass_back_to_agent', 'on_hold']
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
    }
  };

  const fetchLeads = async (showLoading = true) => {
    // Skip if background loading is already in progress (unless it's a manual refresh)
    if (backgroundLoadingInProgress.current && !showLoading) {
      return;
    }
    
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // OPTIMIZATION: Fetch first page immediately to show dashboard quickly
      const response = await leadsAPI.getMyLeads({ page_size: 100 });
      let allLeads = [...response.results];
      
      // Show first page immediately (don't wait for all pages) - dashboard loads fast!
      if (showLoading || !backgroundLoadingInProgress.current) {
        setLeads(allLeads);
      } else {
        // For silent refreshes during background loading, merge with existing leads instead of overwriting
        setLeads(prevLeads => {
          const leadMap = new Map<number, Lead>();
          prevLeads.forEach(lead => leadMap.set(lead.id, lead));
          allLeads.forEach(lead => leadMap.set(lead.id, lead));
          return Array.from(leadMap.values()).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      }
      
      if (showLoading) {
        setLoading(false);
      }
      
      // Mark that initial load is complete
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
      
      // Check if there are more pages - use response.next as the primary indicator
      const hasMorePages = !!response.next || (response.count && response.count > allLeads.length);
      const totalCount = response.count || allLeads.length;
      
      // OPTIMIZATION: Load remaining pages in background without blocking UI
      if (hasMorePages && !backgroundLoadingInProgress.current) {
        backgroundLoadingInProgress.current = true;
        // Calculate expected pages from count using actual page size returned
        const pageSize = Math.max(1, response.results?.length || 100);
        const estimatedTotalPages = Math.ceil(totalCount / pageSize);
        // Cap to prevent runaway loops; no artificial minimum so we don't over-fetch
        const maxPagesToLoad = Math.min(estimatedTotalPages, 200);
        
        // Load pages in parallel batches for speed (don't block UI)
        const batchSize = 5; // Load 5 pages at a time
        
        // Load all remaining pages in background
        (async () => {
          try {
            let currentPage = 2;
            let hasNextPage = true;
            
            while (hasNextPage && currentPage <= maxPagesToLoad) {
              const batchPromises = [];
              const batchEndPage = Math.min(currentPage + batchSize - 1, maxPagesToLoad);
              
              // Create batch of page requests
              for (let pageNum = currentPage; pageNum <= batchEndPage; pageNum++) {
                batchPromises.push(
                  leadsAPI.getMyLeads({ 
                    page_size: 100, 
                    page: pageNum.toString()
                  })
                  .then((res) => ({ data: res, had404: false, isError: false }))
                  .catch((err: any) => {
                    const had404 = err?.response?.status === 404 || err?.response?.status === 400;
                    return { data: { results: [], next: null, count: 0 }, had404, isError: true };
                  })
                );
              }
              
              // Wait for batch to complete
              const batchResults: Array<{ data: any; had404: boolean; isError: boolean }> = await Promise.all(batchPromises);
              
              // If any 404 occurred, stop at the first error index and process those before it
              const errorIndex = batchResults.findIndex((r) => r?.had404 === true);
              if (errorIndex >= 0) {
                hasNextPage = false;
                const resultsBefore404 = batchResults.slice(0, errorIndex).map((r) => r.data);
                const validResults = resultsBefore404.filter((result: any) => result?.results && result.results.length > 0);
                const newLeads = validResults.flatMap((batchResponse: any) => batchResponse.results);
                if (newLeads.length > 0) {
                  allLeads = [...allLeads, ...newLeads];
                }
                break;
              }
              
              // Filter out empty/error responses and get valid results
              const validResults = batchResults
                .filter((r) => r && !r.isError && r.data?.results && r.data.results.length > 0)
                .map((r) => r.data);
              
              // Check the LAST valid result to see if there are more pages
              if (validResults.length > 0) {
                const lastResult = validResults[validResults.length - 1];
                hasNextPage = !!lastResult.next;
              } else {
                hasNextPage = false;
              }
              
              // Add results to allLeads (using functional approach to avoid closure issue)
              const newLeads = validResults.flatMap((batchResponse: any) => batchResponse.results);
              if (newLeads.length > 0) {
                allLeads = [...allLeads, ...newLeads];
              }
              
              // If we already reached the expected total, stop
              if (totalCount && allLeads.length >= totalCount) {
                hasNextPage = false;
              }
              
              // Update leads state periodically (every batch or when approaching limit) using functional update to prevent race conditions
              if (!hasNextPage || currentPage + batchSize > maxPagesToLoad || (currentPage - 1) % 10 === 1) {
                // Create a copy and sort to avoid mutation issues
                const sortedLeads = [...allLeads].sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                // Use functional update to merge with any new leads that arrived during loading
                setLeads(prevLeads => {
                  // Create a map of existing leads by ID to deduplicate
                  const leadMap = new Map<number, Lead>();
                  // Add existing leads first (they might have been updated)
                  prevLeads.forEach(lead => leadMap.set(lead.id, lead));
                  // Add new leads (newer data takes precedence)
                  sortedLeads.forEach(lead => leadMap.set(lead.id, lead));
                  // Convert back to array and sort
                  return Array.from(leadMap.values()).sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  );
                });
              }
              
              // Move to next batch
              currentPage += batchSize;
              
              // Stop if no more pages
              if (!hasNextPage) break;
            }
            
            // Final update with all loaded leads, sorted - using functional update
            const sortedLeads = [...allLeads].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            // Use functional update to ensure we don't overwrite any new leads
            setLeads(prevLeads => {
              const leadMap = new Map<number, Lead>();
              // Add existing leads first
              prevLeads.forEach(lead => leadMap.set(lead.id, lead));
              // Add all loaded leads (newer takes precedence)
              sortedLeads.forEach(lead => leadMap.set(lead.id, lead));
              // Return sorted array
              const finalLeads = Array.from(leadMap.values()).sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              
              // Reset to first page if current page is beyond available pages
              const newTotalPages = Math.ceil(finalLeads.length / cardsPerPage);
              setCurrentPage(prevPage => {
                if (prevPage > newTotalPages && newTotalPages > 0) {
                  return 1;
                }
                return prevPage;
              });
              
              return finalLeads;
            });
          } catch (error) {
            // Background loading errors are handled silently
            // We already have the first page showing, so dashboard still works
          } finally {
            backgroundLoadingInProgress.current = false;
          }
        })();
      } else {
        // No additional pages - reset pagination if needed
        const newTotalPages = Math.ceil(allLeads.length / cardsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(1);
        }
      }
    } catch (error) {
      setLeads([]); // Set empty array on error
      if (showLoading) {
        toast.error('Failed to fetch leads');
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
      
      // Handle different response structures
      setCallbacks(Array.isArray(callbacksData) ? callbacksData : []);
      setDueCallbacks(Array.isArray(dueCallbacksData) ? dueCallbacksData : []);
      
      // DISABLED: Automatic callback notifications to prevent spam
      // Callback reminders are now shown in the UI instead of toasters
    } catch (error) {
      setCallbacks([]);
      setDueCallbacks([]);
    }
  };

  const handleCreateLead = async (leadData: LeadFormType, pendingCallback?: CallbackForm) => {
    try {
      setFormLoading(true);
      
      // Check if we're updating an existing lead from dialer
      if (prepopulatedData?.lead_id) {
        // Update existing lead from dialer
        const leadDataWithStatus: LeadFormType & { status: Lead['status'] } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status']
        };
        const updatedLead = await leadsAPI.updateLead(parseInt(prepopulatedData.lead_id), leadDataWithStatus);
        
        // Update the leads list
        setLeads(prev => prev.map(lead => 
          lead.id === updatedLead.id ? updatedLead : lead
        ));
        
        toast.success('Lead updated successfully and sent to qualifier!');
      } else {
        // Set the lead creation time before making the API call to prevent auto-refresh interference
        const now = Date.now();
        lastLeadCreationTimeRef.current = now;
        
        // Create new lead - check if it's a callback lead by looking for callback status in the data
        const isCallbackLead = (leadData as any).status === 'callback';
        const leadDataWithStatus: LeadFormType & { status: Lead['status'] } = {
          ...leadData,
          status: isCallbackLead ? 'callback' as Lead['status'] : 'sent_to_kelly' as Lead['status']
        };
        
        // Log the data being sent for debugging
        console.log('Creating lead with data:', JSON.stringify(leadDataWithStatus, null, 2));
        
        const newLead = await leadsAPI.createLead(leadDataWithStatus);
        setLeads(prev => [newLead, ...prev]);
        
        // Broadcast new lead to qualifier dashboard if status is sent_to_kelly
        if (newLead.status === 'sent_to_kelly') {
          sendMessage({ type: 'NEW_LEAD', lead: newLead });
        }
        
        if (isCallbackLead) {
          toast.success('Lead created successfully with callback status!');
          
          // Schedule the callback if there's pending callback data
          if (pendingCallback) {
            try {
              
              const callbackDataWithLeadId = {
                lead: Number(newLead.id), // Ensure it's a number
                scheduled_time: pendingCallback.scheduled_time,
                notes: pendingCallback.notes || ''
              };
              await callbacksAPI.createCallback(callbackDataWithLeadId);
              toast.success('Callback scheduled successfully!');
              
              // Refresh callbacks to update the display
              await fetchCallbacks(); // Immediate refresh
            } catch (callbackError: any) {
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
      // Log full error for debugging
      console.error('Lead creation/update error:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to create/update lead';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Full error response:', axiosError.response?.data);
        
        if (axiosError.response?.data) {
          if (typeof axiosError.response.data === 'string') {
            errorMessage = axiosError.response.data;
          } else if (axiosError.response.data.detail) {
            errorMessage = axiosError.response.data.detail;
          } else if (axiosError.response.data.phone) {
            errorMessage = Array.isArray(axiosError.response.data.phone) 
              ? axiosError.response.data.phone[0] 
              : axiosError.response.data.phone;
          } else if (axiosError.response.data.full_name) {
            errorMessage = Array.isArray(axiosError.response.data.full_name) 
              ? axiosError.response.data.full_name[0] 
              : axiosError.response.data.full_name;
          } else if (axiosError.response.data.postal_code) {
            errorMessage = Array.isArray(axiosError.response.data.postal_code) 
              ? axiosError.response.data.postal_code[0] 
              : axiosError.response.data.postal_code;
          } else if (axiosError.response.data.non_field_errors) {
            errorMessage = Array.isArray(axiosError.response.data.non_field_errors) 
              ? axiosError.response.data.non_field_errors[0] 
              : axiosError.response.data.non_field_errors;
          } else {
            // Show all validation errors
            const errorKeys = Object.keys(axiosError.response.data);
            if (errorKeys.length > 0) {
              const firstError = axiosError.response.data[errorKeys[0]];
              errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
              console.error('Validation errors:', axiosError.response.data);
            }
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
        const leadDataWithStatus: LeadFormType & { status: Lead['status'] } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status']
        };
        const updatedLead = await leadsAPI.updateLead(editingLead.id, leadDataWithStatus);
        setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        
        // Broadcast updated lead to qualifier dashboard
        sendMessage({ type: 'LEAD_UPDATED', lead: updatedLead });
        
        toast.success('Lead updated and sent to qualifier!');
      } else if (prepopulatedData?.lead_id) {
        // Update existing lead from dialer and send to qualifier
        const leadDataWithStatus: LeadFormType & { status: Lead['status'] } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status']
        };
        const updatedLead = await leadsAPI.updateLead(parseInt(prepopulatedData.lead_id), leadDataWithStatus);
        setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        
        // Broadcast updated lead to qualifier dashboard
        sendMessage({ type: 'LEAD_UPDATED', lead: updatedLead });
        
        toast.success('Lead updated and sent to qualifier!');
      } else {
        // Set the lead creation time before making the API call to prevent auto-refresh interference
        const now = Date.now();
        lastLeadCreationTimeRef.current = now;
        
        // Create new lead and send to qualifier
        const leadDataWithStatus: LeadFormType & { status: Lead['status'] } = {
          ...leadData,
          status: 'sent_to_kelly' as Lead['status']
        };
        
        // Log the data being sent for debugging
        console.log('Creating lead (send to qualifier) with data:', JSON.stringify(leadDataWithStatus, null, 2));
        
        const newLead = await leadsAPI.createLead(leadDataWithStatus);
        setLeads(prev => [newLead, ...prev]);
        
        // Broadcast new lead to qualifier dashboard
        sendMessage({ type: 'NEW_LEAD', lead: newLead });
        
        toast.success('Lead created and sent to qualifier!');
      }
      
      setShowLeadForm(false);
      setEditingLead(null);
      setPrepopulatedData(null);
    } catch (error) {
      // Log full error for debugging
      console.error('Send to qualifier error:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to send lead to qualifier';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('Full error response:', axiosError.response?.data);
        
        if (axiosError.response?.data) {
          if (typeof axiosError.response.data === 'string') {
            errorMessage = axiosError.response.data;
          } else if (axiosError.response.data.detail) {
            errorMessage = axiosError.response.data.detail;
          } else if (axiosError.response.data.phone) {
            errorMessage = Array.isArray(axiosError.response.data.phone) 
              ? axiosError.response.data.phone[0] 
              : axiosError.response.data.phone;
          } else if (axiosError.response.data.full_name) {
            errorMessage = Array.isArray(axiosError.response.data.full_name) 
              ? axiosError.response.data.full_name[0] 
              : axiosError.response.data.full_name;
          } else if (axiosError.response.data.postal_code) {
            errorMessage = Array.isArray(axiosError.response.data.postal_code) 
              ? axiosError.response.data.postal_code[0] 
              : axiosError.response.data.postal_code;
          } else if (axiosError.response.data.non_field_errors) {
            errorMessage = Array.isArray(axiosError.response.data.non_field_errors) 
              ? axiosError.response.data.non_field_errors[0] 
              : axiosError.response.data.non_field_errors;
          } else {
            // Show all validation errors
            const errorKeys = Object.keys(axiosError.response.data);
            if (errorKeys.length > 0) {
              const firstError = axiosError.response.data[errorKeys[0]];
              errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
              console.error('Validation errors:', axiosError.response.data);
            }
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
      interested: 0,
      appointment_set: 0,
      not_interested: 0,
      callbacks: 0,
    };

    leads.forEach(lead => {
      // Group related statuses for counting
      if (lead.status === 'interested' || lead.status === 'sent_to_kelly') {
        counts.interested++;
      } else if (lead.status === 'appointment_set') {
        counts.appointment_set++;
      } else if (lead.status === 'not_interested' || lead.status === 'blow_out') {
        counts.not_interested++;
      }
    });

    // Update callback count from:
    // 1. Scheduled callbacks from the callbacks data
    // 2. Leads with callback status
    // 3. Leads with pass_back_to_agent status
    // Note: on_hold status is for qualifiers only - agents should not call these back
    const scheduledCallbacks = callbacks.filter(callback => callback.status === 'scheduled').length;
    const callbackLeads = leads.filter(lead => lead.status === 'callback').length;
    const passBackLeads = leads.filter(lead => lead.status === 'pass_back_to_agent').length;
    counts.callbacks = scheduledCallbacks + callbackLeads + passBackLeads;

    return counts;
  };

  const getCallbackCount = () => {
    // Note: on_hold status is for qualifiers only - agents should not call these back
    const scheduledCallbacks = callbacks.filter(callback => callback.status === 'scheduled').length;
    const callbackLeads = leads.filter(lead => lead.status === 'callback').length;
    const passBackLeads = leads.filter(lead => lead.status === 'pass_back_to_agent').length;
    return scheduledCallbacks + callbackLeads + passBackLeads;
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
      {Array.isArray(dueCallbacks) && dueCallbacks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Callback Reminders ({Array.isArray(dueCallbacks) ? dueCallbacks.length : 0})
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                {Array.isArray(dueCallbacks) && dueCallbacks.slice(0, 3).map((callback, index) => (
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
                {Array.isArray(dueCallbacks) && dueCallbacks.length > 3 && (
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
                <dd className="text-2xl font-bold text-gray-900">{statusCounts.interested}</dd>
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
