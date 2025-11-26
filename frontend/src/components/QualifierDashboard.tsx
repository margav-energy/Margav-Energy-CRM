import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
// import LeadCard from './LeadCard';
import QualifierLeadModal from './QualifierLeadModal';
import AppointmentForm from './AppointmentForm';
import LeadDetailsModal from './LeadDetailsModal';
import { useLocalStorageEvents } from '../hooks/useLocalStorageEvents';
import { filterLeadsForQualifier, dedupeLeadsById } from '../utils/leadFilters';

interface QualifierDashboardProps {
  onKanbanLeadUpdate?: React.MutableRefObject<((lead: Lead) => void) | null>;
}

const QualifierDashboard: React.FC<QualifierDashboardProps> = ({ onKanbanLeadUpdate }) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLead, setUpdatingLead] = useState<Lead | null>(null);
  const [appointmentLead, setAppointmentLead] = useState<Lead | null>(null);
  const [modalFilteredLeads, setModalFilteredLeads] = useState<Lead[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [currentFilterType, setCurrentFilterType] = useState<string | null>(null);
  const [selectedLeadFromFilter, setSelectedLeadFromFilter] = useState<Lead | null>(null);
  const [isLeadDetailsModalOpen, setIsLeadDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const previousLeadCount = useRef<number>(0);
  const backgroundLoadingInProgress = useRef<boolean>(false);
  

  // Handle lead updates from KanbanBoard
  const handleKanbanLeadUpdate = useCallback((updatedLead: Lead) => {
    
    // Update the leads state immediately for instant counter updates
    setLeads(prev => {
      const existingIndex = prev.findIndex(l => l.id === updatedLead.id);
      if (existingIndex !== -1) {
        // Update existing lead
        const newLeads = [...prev];
        newLeads[existingIndex] = updatedLead;
        return newLeads;
      } else {
        // Add new lead if it doesn't exist
        return [updatedLead, ...prev];
      }
    });
    
    // Show immediate toast notification
    toast.success(`Lead ${updatedLead.full_name} updated successfully`);
  }, []);

  // Handle clicking on a lead in the filter modal
  const handleFilterLeadClick = (lead: Lead) => {
    setSelectedLeadFromFilter(lead);
    setIsLeadDetailsModalOpen(true);
  };

  // Handle closing the lead details modal
  const handleCloseLeadDetailsModal = () => {
    setIsLeadDetailsModalOpen(false);
    setSelectedLeadFromFilter(null);
  };

  // Helper function to format filter type display name
  const getFilterDisplayName = (filterType: string | null): string => {
    if (!filterType) return '';
    
    const displayNames: { [key: string]: string } = {
      'sent_to_kelly': 'Sent to Qualifier',
      'blow_out': 'Blow Out',
      'on_hold': 'On Hold',
      'qualified': 'Qualified',
      'appointment_set': 'Appointment Set',
      'no_contact': 'No Contact',
    };
    
    return displayNames[filterType] || filterType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle filter clicks - open modal with filtered leads
  const handleFilterClick = (filterType: string) => {
    let filtered: Lead[] = [];
    
    if (filterType === 'blow_out') {
      // Blow Out includes multiple statuses
      filtered = leads.filter(lead => 
        ['blow_out', 'not_interested', 'pass_back_to_agent'].includes(lead.status)
      );
    } else if (filterType === 'on_hold') {
      // On Hold includes both on_hold and qualifier_callback
      filtered = leads.filter(lead => 
        ['on_hold', 'qualifier_callback'].includes(lead.status)
      );
    } else {
      filtered = leads.filter(lead => lead.status === filterType);
    }
    
    setModalFilteredLeads(filtered);
    setCurrentFilterType(filterType);
    setFilterModalOpen(true);
  };

  // Set up the ref for KanbanBoard to call back to this component
  useEffect(() => {
    if (onKanbanLeadUpdate) {
      onKanbanLeadUpdate.current = handleKanbanLeadUpdate;
    }
    return () => {
      if (onKanbanLeadUpdate) {
        onKanbanLeadUpdate.current = null;
      }
    };
  }, [onKanbanLeadUpdate, handleKanbanLeadUpdate]);

  // Function to play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
    }
  }, []);

  const fetchLeads = useCallback(async (silent = false, forceRefresh = false) => {
    // Skip if background loading is already in progress (unless it's a force refresh or non-silent)
    if (backgroundLoadingInProgress.current && silent && !forceRefresh) {
      return;
    }
    
    try {
      if (!silent) setLoading(true);
      
      // OPTIMIZATION: Fetch first page immediately to show dashboard quickly
      const response = await leadsAPI.getLeads({ page_size: 100, ordering: '-created_at' });
      // Single source of truth for filtering + dedupe
      let allLeads = filterLeadsForQualifier(response.results);
      
      // Show first page immediately (don't wait for all pages) - dashboard loads fast!
      if (!silent) {
        setLeads(allLeads);
        setLoading(false);
      } else {
        // For silent refreshes, ALWAYS merge with existing leads to avoid overwriting full dataset
        setLeads(prevLeads => {
          const leadMap = new Map<number, Lead>();
          filterLeadsForQualifier(prevLeads).forEach(lead => leadMap.set(lead.id, lead));
          allLeads.forEach(lead => leadMap.set(lead.id, lead));
          return Array.from(leadMap.values()).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
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
              
              // Create batch of page requests without mutating outer vars inside catch
              for (let pageNum = currentPage; pageNum <= batchEndPage; pageNum++) {
                batchPromises.push(
                  leadsAPI.getLeads({ 
                    page_size: 100, 
                    page: pageNum.toString(),
                    ordering: '-created_at'
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
              
              // Add results to allLeads
              const newLeads = filterLeadsForQualifier(
                validResults.flatMap((batchResponse: any) => batchResponse.results)
              );
              if (newLeads.length > 0) {
                allLeads = [...allLeads, ...newLeads];
              }
              
              // If we already reached the expected total, stop
              if (totalCount && allLeads.length >= totalCount) {
                hasNextPage = false;
              }
              
              // Move to next batch
              currentPage += batchSize;
              if (!hasNextPage) break;
            }
            
            // Single final update with all loaded leads after background loading completes
            // This prevents multiple state updates that cause counter fluctuations
            const sortedLeads = filterLeadsForQualifier(allLeads)
              .sort((a, b) => 
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
              
              // Update count only after all leads are loaded
              const finalCount = finalLeads.length;
              if (previousLeadCount.current > 0 && finalCount > previousLeadCount.current) {
      if (!silent) {
                  playNotificationSound();
                  toast.info(`New lead received! Total leads: ${finalCount}`);
                }
              }
              previousLeadCount.current = finalCount;
              
              return finalLeads;
            });
            
            if (!silent && allLeads.length > 100) {
              toast.success(`All leads loaded`);
            }
          } catch (error) {
            // Background loading errors are handled silently
            // We already have the first page showing, so dashboard still works
          } finally {
            backgroundLoadingInProgress.current = false;
          }
        })();
      } else {
        // No additional pages - update count and check for new leads
        if (!silent && previousLeadCount.current > 0 && allLeads.length > previousLeadCount.current) {
          playNotificationSound();
          toast.info(`New lead received!`);
        }
        previousLeadCount.current = allLeads.length;
      }
    } catch (error) {
      if (!silent) {
        toast.error('Failed to fetch leads');
        setLoading(false);
      }
    }
  }, [playNotificationSound]);


  // Track which notifications have been shown to prevent duplicates
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  // Check for callback notifications
  useEffect(() => {
    const checkCallbackNotifications = () => {
      const now = new Date();
      const callbackLeads = leads.filter(lead => 
        lead.status === 'qualifier_callback' && 
        lead.qualifier_callback_date
      );

      // Clean up old notification keys (older than 2 hours) to prevent memory leaks
      const twoHoursAgo = now.getTime() - (2 * 60 * 60 * 1000);
      const keysToRemove: string[] = [];
      shownNotificationsRef.current.forEach(key => {
        const parts = key.split('-');
        if (parts.length >= 3) {
          const leadId = parseInt(parts[1]);
          const lead = callbackLeads.find(l => l.id === leadId);
          if (lead && lead.qualifier_callback_date) {
            const callbackDate = new Date(lead.qualifier_callback_date);
            if (callbackDate.getTime() < twoHoursAgo) {
              keysToRemove.push(key);
            }
          }
        }
      });
      keysToRemove.forEach(key => shownNotificationsRef.current.delete(key));

      callbackLeads.forEach(lead => {
        if (!lead.qualifier_callback_date) return;
        
        const callbackDate = new Date(lead.qualifier_callback_date);
        const timeDiff = callbackDate.getTime() - now.getTime();
        const minutesUntilCallback = timeDiff / (1000 * 60);
        
        // Check if callback is due (within 15 minutes) or overdue (up to 60 minutes past)
        if (minutesUntilCallback <= 15 && minutesUntilCallback >= -60) {
          // Create a unique key for this notification (per lead, per 5-minute window)
          // This ensures we show a notification every 5 minutes if still in range
          const windowIndex = Math.floor(minutesUntilCallback / 5);
          const notificationKey = `callback-${lead.id}-${windowIndex}`;
          
          // Only show notification if we haven't shown it for this time window
          if (!shownNotificationsRef.current.has(notificationKey)) {
            // Request notification permission if not already granted
            if ('Notification' in window) {
              if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    showCallbackNotification(lead, minutesUntilCallback, notificationKey);
                  }
                });
              } else if (Notification.permission === 'granted') {
                showCallbackNotification(lead, minutesUntilCallback, notificationKey);
              } else {
                // Permission denied, still show toast
                showCallbackNotification(lead, minutesUntilCallback, notificationKey);
              }
            } else {
              // Notifications not supported, show toast only
              showCallbackNotification(lead, minutesUntilCallback, notificationKey);
            }
          }
        }
      });
    };

    const showCallbackNotification = (lead: Lead, minutesUntilCallback: number, notificationKey: string) => {
      const isOverdue = minutesUntilCallback < 0;
      
      // Mark as shown first to prevent duplicates
      shownNotificationsRef.current.add(notificationKey);
      
      // Play sound only (banner will show the visual reminder)
      playNotificationSound();
      
      // Show browser notification if permission is granted (banner handles visual display)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification(
            isOverdue ? '⚠️ Callback Overdue' : '⏰ Callback Due',
            {
              body: `Time to call back ${lead.full_name} (${lead.phone})`,
              icon: '/favicon.ico',
              tag: `callback-${lead.id}`, // Browser-level duplicate prevention
              requireInteraction: isOverdue, // Keep overdue notifications visible
              badge: '/favicon.ico',
            }
          );
          
          // Handle notification click - open the lead
          notification.onclick = () => {
            window.focus();
            setUpdatingLead(lead);
            notification.close();
          };
          
          // Auto-close after 10 seconds if not overdue
          if (!isOverdue) {
            setTimeout(() => {
              notification.close();
            }, 10000);
          }
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      }
    };

    // Check immediately and then every minute
    if (leads.length > 0) {
      checkCallbackNotifications();
    }
    
    const notificationInterval = setInterval(() => {
      if (leads.length > 0) {
        checkCallbackNotifications();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(notificationInterval);
  }, [leads, playNotificationSound]);

  useEffect(() => {
    fetchLeads();
    
    // Auto-refresh every 30 seconds silently (no screen flicker)
    // Skip if background loading is in progress to prevent interference
    const interval = setInterval(() => {
      if (!backgroundLoadingInProgress.current) {
        fetchLeads(true);
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchLeads]);

  //

  // Listen for lead updates from AgentDashboard via localStorage events
  const handleLeadUpdateMessage = useCallback((message: { type: string; lead: Lead; timestamp: number }) => {
    const { type, lead } = message;
    
    if (type === 'NEW_LEAD' && lead.status === 'sent_to_kelly') {
      
      // Play notification sound
      playNotificationSound();
      
      // Show toast notification
      toast.info(`New lead received: ${lead.full_name || 'Unnamed lead'}`);
      
      // Update the lead in state immediately instead of triggering a full refresh
      setLeads(prevLeads => {
        // Check if lead already exists
        const existingIndex = prevLeads.findIndex(l => l.id === lead.id);
        if (existingIndex !== -1) {
          // Update existing lead
          const newLeads = [...prevLeads];
          newLeads[existingIndex] = lead;
          return newLeads;
        } else {
          // Add new lead at the beginning (most recent first)
          return [lead, ...prevLeads].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      });
      
      // Update count
      previousLeadCount.current += 1;
      
      // Only trigger a refresh if background loading is not in progress
      if (!backgroundLoadingInProgress.current) {
      fetchLeads(true);
      }
    } else if (type === 'LEAD_UPDATED' && lead.status === 'sent_to_kelly') {
      
      // Play notification sound for updated leads sent to qualifier
      playNotificationSound();
      
      // Show toast notification
      toast.info(`Lead updated: ${lead.full_name || 'Unnamed lead'}`);
      
      // Update the lead in state immediately
      setLeads(prevLeads => {
        const existingIndex = prevLeads.findIndex(l => l.id === lead.id);
        if (existingIndex !== -1) {
          // Update existing lead
          const newLeads = [...prevLeads];
          newLeads[existingIndex] = lead;
          return newLeads;
        } else {
          // Add if doesn't exist
          return [lead, ...prevLeads].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      });
      
      // Only trigger a refresh if background loading is not in progress
      if (!backgroundLoadingInProgress.current) {
      fetchLeads(true);
      }
    } else {
    }
  }, [playNotificationSound, fetchLeads]);

  useLocalStorageEvents('lead_updates', handleLeadUpdateMessage);

  // Unlock audio context on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      } catch (error) {
        // Ignore audio context errors
      }
    };
    
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // const handleUpdateLead = async (lead: Lead) => {
  //   setUpdatingLead(lead);
  // };

  const handleLeadUpdate = async (updatedLead?: Lead) => {
    try {
      // If updated lead is provided, use it directly; otherwise refetch
      if (updatedLead) {
        // Update the lead in the modal with the saved data - this will trigger form update
        setUpdatingLead(updatedLead);
        // Also update it in the leads list
        setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
      } else if (updatingLead) {
        // Refetch the specific lead to ensure we have the latest data
        try {
          const refetchedLead = await leadsAPI.getLead(updatingLead.id);
          setUpdatingLead(refetchedLead); // Update the lead in the modal with fresh data
          setLeads(prev => prev.map(lead => lead.id === refetchedLead.id ? refetchedLead : lead));
        } catch (error) {
          // If refetch fails, refresh the leads list
          await fetchLeads(true, true);
        }
      }
      
      // Refresh the leads list to get updated counts (in background)
      fetchLeads(true, true);
    } catch (error) {
      toast.error('Failed to qualify lead');
    }
    // Don't close the modal automatically - let user close it manually to see the persisted data
  };

  // const handleScheduleAppointment = (lead: Lead) => {
  //   setAppointmentLead(lead);
  // };

  const handleAppointmentSuccess = async () => {
    await fetchLeads();
    setAppointmentLead(null);
  };

  const getStatusCounts = (leadsToCount: Lead[]) => {
    // Deduplicate by ID to ensure counts are accurate across pages/refreshes
    const uniqueLeads = dedupeLeadsById(leadsToCount);
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
      on_hold: 0,
      qualifier_callback: 0,
    };

    uniqueLeads.forEach(lead => {
      if (lead.status in counts) {
        counts[lead.status as keyof typeof counts]++;
      }
    });

    return counts;
  };


  // Get due qualifier callbacks (similar to AgentDashboard logic)
  const getDueQualifierCallbacks = useCallback(() => {
    const now = new Date();
    return leads.filter(lead => {
      if (lead.status !== 'qualifier_callback' || !lead.qualifier_callback_date) {
        return false;
      }
      
      const callbackDate = new Date(lead.qualifier_callback_date);
      const timeDiff = callbackDate.getTime() - now.getTime();
      const minutesUntilCallback = timeDiff / (1000 * 60);
      
      // Due if within 15 minutes or overdue (up to 60 minutes past)
      return minutesUntilCallback <= 15 && minutesUntilCallback >= -60;
    }).sort((a, b) => {
      // Sort by callback date (earliest first)
      const dateA = a.qualifier_callback_date ? new Date(a.qualifier_callback_date).getTime() : 0;
      const dateB = b.qualifier_callback_date ? new Date(b.qualifier_callback_date).getTime() : 0;
      return dateA - dateB;
    });
  }, [leads]);

  const dueQualifierCallbacks = getDueQualifierCallbacks();

  const handleQualifierCallbackClick = (lead: Lead) => {
    setUpdatingLead(lead);
  };

  const statusCounts = getStatusCounts(leads);

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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchLeads(false, true)}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Qualifier Callback Reminders */}
      {dueQualifierCallbacks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⏰</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Qualifier Callback Reminders ({dueQualifierCallbacks.length})
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                {dueQualifierCallbacks.slice(0, 3).map((lead) => {
                  const callbackDate = lead.qualifier_callback_date ? new Date(lead.qualifier_callback_date) : null;
                  const now = new Date();
                  const timeDiff = callbackDate ? callbackDate.getTime() - now.getTime() : 0;
                  const minutesUntilCallback = timeDiff / (1000 * 60);
                  const isOverdue = minutesUntilCallback < 0;
                  const timeText = isOverdue 
                    ? `${Math.abs(Math.floor(minutesUntilCallback))} minutes ago`
                    : `in ${Math.floor(minutesUntilCallback)} minutes`;
                  
                  return (
                    <div key={lead.id} className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-medium">{lead.full_name}</span>
                        <span className="ml-2 text-orange-600">
                          {callbackDate ? callbackDate.toLocaleString() : 'No date set'} ({timeText})
                        </span>
                      </div>
                      <button
                        onClick={() => handleQualifierCallbackClick(lead)}
                        className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                      >
                        Open Lead
                      </button>
                    </div>
                  );
                })}
                {dueQualifierCallbacks.length > 3 && (
                  <div className="text-orange-600 font-medium">
                    +{dueQualifierCallbacks.length - 3} more callbacks
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleFilterClick('sent_to_kelly')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sent to Qualifier</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.sent_to_kelly}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleFilterClick('qualified')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Qualified</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.qualified}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleFilterClick('no_contact')}
        >
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

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleFilterClick('blow_out')}
        >
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
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.blow_out + statusCounts.not_interested + statusCounts.pass_back_to_agent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleFilterClick('appointment_set')}
        >
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

        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleFilterClick('on_hold')}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm font-medium">⏸️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">On Hold</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.on_hold + statusCounts.qualifier_callback}</dd>
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

      {/* Admin/Qualifier Tools removed per request */}

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Leads - {getFilterDisplayName(currentFilterType)}
              </h3>
              <button
                onClick={() => {
                  setFilterModalOpen(false);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search Box */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Search by name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  Showing {(() => {
                    const count = modalFilteredLeads.filter(lead => {
                      const query = searchQuery.toLowerCase();
                      return (
                        lead.full_name?.toLowerCase().includes(query) ||
                        lead.phone?.includes(query) ||
                        lead.address1?.toLowerCase().includes(query) ||
                        lead.city?.toLowerCase().includes(query) ||
                        lead.postal_code?.toLowerCase().includes(query) ||
                        lead.email?.toLowerCase().includes(query)
                      );
                    }).length;
                    return count;
                  })()} of {modalFilteredLeads.length} results
                </p>
              )}
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {(() => {
                // Filter leads based on search query
                const searchedLeads = modalFilteredLeads.filter(lead => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    lead.full_name?.toLowerCase().includes(query) ||
                    lead.phone?.includes(query) ||
                    lead.address1?.toLowerCase().includes(query) ||
                    lead.city?.toLowerCase().includes(query) ||
                    lead.postal_code?.toLowerCase().includes(query) ||
                    lead.email?.toLowerCase().includes(query)
                  );
                });
                
                if (searchedLeads.length === 0) {
                  return (
                <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <p>No leads found matching your search</p>
                </div>
                  );
                }
                
                return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchedLeads.map(lead => (
                    <div 
                      key={lead.id} 
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors"
                      onClick={() => handleFilterLeadClick(lead)}
                    >
                      <div className="mb-2">
                        <h4 className="font-medium text-gray-900">{lead.full_name}</h4>
                        <p className="text-sm text-gray-600">📞 {lead.phone}</p>
                        {lead.address1 && <p className="text-sm text-gray-600">📍 {lead.address1}</p>}
                        {lead.city && <p className="text-sm text-gray-600">🏙️ {lead.city}</p>}
                        {lead.postal_code && <p className="text-sm text-gray-600">📮 {lead.postal_code}</p>}
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Assigned to: {lead.assigned_agent_name || lead.assigned_agent_username}</p>
                        <p>Created: {new Date(lead.created_at).toLocaleDateString()}</p>
                        <p className="text-blue-600 mt-1">Click to view details</p>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilterModalOpen(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal for Filter Modal */}
      {selectedLeadFromFilter && (
        <LeadDetailsModal
          lead={selectedLeadFromFilter}
          isOpen={isLeadDetailsModalOpen}
          onClose={handleCloseLeadDetailsModal}
          userRole="qualifier"
          onLeadUpdated={() => {
            // Refresh leads when a lead is updated
            fetchLeads(true);
          }}
        />
      )}
    </div>
  );
};

export default QualifierDashboard;
