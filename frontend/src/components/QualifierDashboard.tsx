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
      let allLeads = [...response.results];
      
      // Show first page immediately (don't wait for all pages) - dashboard loads fast!
      if (!silent) {
        setLeads(allLeads);
        setLoading(false);
      } else {
        // For silent refreshes during background loading, merge with existing leads instead of overwriting
        if (backgroundLoadingInProgress.current) {
          setLeads(prevLeads => {
            const leadMap = new Map<number, Lead>();
            prevLeads.forEach(lead => leadMap.set(lead.id, lead));
            allLeads.forEach(lead => leadMap.set(lead.id, lead));
            return Array.from(leadMap.values()).sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          });
        } else {
          setLeads(allLeads);
        }
      }
      
      // Check if there are more pages - use response.next as the primary indicator
      const hasMorePages = !!response.next || (response.count && response.count > allLeads.length);
      const totalCount = response.count || allLeads.length;
      
      // OPTIMIZATION: Load remaining pages in background without blocking UI
      if (hasMorePages && !backgroundLoadingInProgress.current) {
        backgroundLoadingInProgress.current = true;
        // Calculate expected pages from count, but also use next URL if available
        const estimatedTotalPages = Math.ceil(totalCount / 100);
        // Use a higher limit to ensure we get all leads, but still cap it
        const maxPagesToLoad = Math.min(Math.max(estimatedTotalPages, 10), 200); // At least 10 pages, max 20,000 leads
        
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
                  leadsAPI.getLeads({ 
                    page_size: 100, 
                    page: pageNum.toString(),
                    ordering: '-created_at'
                  }).catch((err) => {
                    // Silently handle individual page errors - return empty results
                    return { results: [], next: null, count: 0 };
                  })
                );
              }
              
              // Wait for batch to complete
              const batchResults = await Promise.all(batchPromises);
              
              // Filter out empty/error responses and get valid results
              const validResults = batchResults.filter(result => result?.results && result.results.length > 0);
              
              // Check the LAST valid result to see if there are more pages
              // This is critical: we need to check the last page in the batch, not just any page
              if (validResults.length > 0) {
                const lastResult = validResults[validResults.length - 1];
                hasNextPage = !!lastResult.next;
              } else {
                // If no valid results, check if we got any results at all
                hasNextPage = batchResults.some(result => result?.next);
              }
              
              // Add results to allLeads (using functional approach to avoid closure issue)
              const newLeads = validResults
                .flatMap((batchResponse) => batchResponse.results);
              
              // Only add if we have new leads
              if (newLeads.length > 0) {
                allLeads = [...allLeads, ...newLeads];
              }
              
              // Move to next batch
              currentPage += batchSize;
              
              // Stop if no more pages
              if (!hasNextPage) break;
            }
            
            // Single final update with all loaded leads after background loading completes
            // This prevents multiple state updates that cause counter fluctuations
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
              toast.success(`All leads loaded (${allLeads.length} total)`);
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
          toast.info(`New lead received! Total leads: ${allLeads.length}`);
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

  const handleLeadUpdate = async () => {
    try {
      // Refresh the leads list to get updated data
      await fetchLeads();
      
      setUpdatingLead(null);
    } catch (error) {
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

  const getStatusCounts = (leadsToCount: Lead[]) => {
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

    leadsToCount.forEach(lead => {
      if (lead.status in counts) {
        counts[lead.status as keyof typeof counts]++;
      }
    });

    return counts;
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


      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Sent to Kelly</dt>
                  <dd className="text-lg font-medium text-gray-900">{statusCounts.sent_to_kelly}</dd>
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

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Leads - {currentFilterType?.replace('_', ' ').toUpperCase()}
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
