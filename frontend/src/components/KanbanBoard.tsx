
import React, { useState, useEffect, useCallback } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import LeadDetailsModal from './LeadDetailsModal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanBoardProps {
  userRole: string;
  onLeadUpdate?: (updatedLead?: Lead) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  statuses: string[];
  color: string;
  leads: Lead[];
}

interface SortableLeadCardProps {
  lead: Lead;
  getStatusBadgeColor: (status: string) => string;
  getStatusDisplayName: (status: string) => string;
  formatDate: (dateString: string) => string;
  onCardClick?: (lead: Lead) => void;
  userRole: string;
  isDragging?: boolean;
}

interface DroppableColumnProps {
  column: KanbanColumn;
  onCardClick?: (lead: Lead) => void;
  userRole: string;
  getStatusBadgeColor: (status: string) => string;
  getStatusDisplayName: (status: string) => string;
  formatDate: (dateString: string) => string;
  activeId?: string | null;
}

// --------------------- Sortable Lead Card ---------------------
const SortableLeadCard: React.FC<SortableLeadCardProps> = ({
  lead,
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  onCardClick,
  userRole,
  isDragging = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCardClick && userRole === 'qualifier' && !isDragging) {
      onCardClick(lead);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative cursor-pointer"
      onClick={handleClick}
    >
      {/* Drag handle - visible for all roles */}
      <div
        className="absolute top-2 right-2 w-6 h-6 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-all duration-200 hover:scale-110"
        {...attributes}
        {...listeners}
        title="Drag to move between columns"
      >
        <div className="w-full h-full bg-gray-300 hover:bg-gray-400 rounded-md flex items-center justify-center shadow-sm">
          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </div>
      </div>
      
      <div className="mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{lead.full_name}</h4>
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadgeColor(lead.status)}`}>
          {getStatusDisplayName(lead.status)}
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <p>📞 {lead.phone}</p>
        {lead.email && <p>📧 {lead.email}</p>}
        {lead.appointment_date && <p>📅 {formatDate(lead.appointment_date)}</p>}
        {lead.sale_amount && <p className="font-semibold text-green-600">💰 ${lead.sale_amount.toLocaleString()}</p>}
      </div>
      {lead.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{lead.notes}</p>}
      <div className="mt-2 text-xs text-gray-400">
        Assigned to: {lead.assigned_agent_name || lead.assigned_agent_username}
      </div>
    </div>
  );
};

// --------------------- Droppable Column ---------------------
const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  onCardClick,
  userRole,
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  activeId,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });
  const sortedLeadIds = column.leads.map(lead => lead.id.toString());

  return (
    <div className="flex-shrink-0 w-64 lg:w-72">
      <div
        ref={setNodeRef}
        className={`${column.color} rounded-lg p-4 h-full min-h-[400px] transition-all duration-200 ${
          isOver ? 'ring-2 ring-blue-400 ring-opacity-70 bg-opacity-80 scale-[1.02]' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{column.title}</h3>
          <span className="bg-white bg-opacity-50 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {column.leads.length}
          </span>
        </div>

        <SortableContext items={sortedLeadIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {column.leads.length === 0 ? (
              <div className={`text-center py-6 text-gray-500 transition-all duration-200 ${
                isOver ? 'text-blue-500 scale-105' : ''
              }`}>
                <div className="text-3xl mb-2">📋</div>
                <p className="text-xs">
                  {isOver ? 'Drop here' : 'No leads'}
                </p>
              </div>
            ) : (
              column.leads.map(lead => (
                <SortableLeadCard
                  key={lead.id.toString()}
                  lead={lead}
                  getStatusBadgeColor={getStatusBadgeColor}
                  getStatusDisplayName={getStatusDisplayName}
                  formatDate={formatDate}
                  onCardClick={onCardClick}
                  userRole={userRole}
                  isDragging={activeId === lead.id.toString()}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

// --------------------- Kanban Board ---------------------
const KanbanBoard: React.FC<KanbanBoardProps> = ({ userRole, onLeadUpdate }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      
      // OPTIMIZATION: Fetch first page immediately to show board quickly
      const response = await leadsAPI.getLeads({ page_size: 100, ordering: '-created_at' });
      let allLeads = [...response.results];
      
      // Define column definitions based on role
      let columnDefinitions: Omit<KanbanColumn, 'leads'>[] = [];

      if (userRole === 'admin') {
        columnDefinitions = [
          { id: 'cold_call', title: 'Cold Calls', statuses: ['cold_call'], color: 'bg-gray-100' },
          { id: 'interested', title: 'Interested', statuses: ['sent_to_kelly'], color: 'bg-blue-100' },
          { id: 'qualified', title: 'Qualified', statuses: ['qualified'], color: 'bg-green-100' },
          { id: 'appointments', title: 'Appointments', statuses: ['appointment_set'], color: 'bg-purple-100' },
          { id: 'completed', title: 'Completed', statuses: ['appointment_completed'], color: 'bg-yellow-100' },
          { id: 'sales', title: 'Sales', statuses: ['sale_made', 'sale_lost'], color: 'bg-indigo-100' },
        ];
      } else if (userRole === 'agent') {
        columnDefinitions = [
          { id: 'cold_call', title: 'Cold Calls', statuses: ['cold_call'], color: 'bg-gray-100' },
          { id: 'interested', title: 'Interested', statuses: ['interested'], color: 'bg-blue-100' },
          { id: 'sent_to_kelly', title: 'Sent to Kelly', statuses: ['sent_to_kelly'], color: 'bg-green-100' },
          { id: 'not_interested', title: 'Not Interested', statuses: ['not_interested', 'tenant', 'other_disposition'], color: 'bg-red-100' },
        ];
      } else if (userRole === 'qualifier') {
        columnDefinitions = [
          { id: 'sent_to_kelly', title: 'To Qualify', statuses: ['sent_to_kelly'], color: 'bg-blue-100' },
          { id: 'appointments', title: 'Appointments Set', statuses: ['appointment_set'], color: 'bg-purple-100' },
          { id: 'qualifier_callback', title: 'On Hold/Callback', statuses: ['on_hold', 'qualifier_callback'], color: 'bg-orange-100' },
          { id: 'no_contact', title: 'No Contact', statuses: ['no_contact'], color: 'bg-yellow-100' },
          { id: 'not_qualified', title: 'Not Qualified', statuses: ['not_interested', 'blow_out', 'pass_back_to_agent'], color: 'bg-red-100' },
        ];
      } else if (userRole === 'salesrep') {
        columnDefinitions = [
          { id: 'appointments', title: 'My Appointments', statuses: ['appointment_set'], color: 'bg-purple-100' },
          { id: 'completed', title: 'Completed', statuses: ['appointment_completed'], color: 'bg-yellow-100' },
          { id: 'sales', title: 'Sales Results', statuses: ['sale_made', 'sale_lost'], color: 'bg-indigo-100' },
        ];
      }

      const validLeads = allLeads.filter(lead => lead && lead.id);
      
      // Show board immediately with first page of leads
      const populatedColumns = columnDefinitions.map(column => ({
        ...column,
        leads: validLeads.filter(lead => column.statuses.includes(lead.status)),
      }));

      setColumns(populatedColumns);
      setLoading(false); // Show board immediately
      
      // Check if there are more pages - use response.next as the primary indicator
      const hasMorePages = !!response.next || (response.count && response.count > allLeads.length);
      const totalCount = response.count || allLeads.length;
      
      // OPTIMIZATION: Load remaining pages in background without blocking UI
      if (hasMorePages) {
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
              
              // Update columns periodically (every batch or when approaching limit) to show progress
              if (!hasNextPage || currentPage + batchSize > maxPagesToLoad || (currentPage - 1) % 10 === 1) {
                const validLeads = allLeads.filter(lead => lead && lead.id);
                const populatedColumns = columnDefinitions.map(column => ({
                  ...column,
                  leads: validLeads.filter(lead => column.statuses.includes(lead.status)),
                }));
                setColumns(populatedColumns);
              }
              
              // Move to next batch
              currentPage += batchSize;
              
              // Stop if no more pages
              if (!hasNextPage) break;
            }
            
            // Final update with all loaded leads
            const validLeads = allLeads.filter(lead => lead && lead.id);
            const populatedColumns = columnDefinitions.map(column => ({
              ...column,
              leads: validLeads.filter(lead => column.statuses.includes(lead.status)),
            }));
            setColumns(populatedColumns);
          } catch (error) {
            // Background loading errors are handled silently
            // We already have the first page showing, so board still works
          }
        })();
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchLeads();
  }, [userRole, fetchLeads]);

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      cold_call: 'bg-gray-100 text-gray-800',
      interested: 'bg-blue-100 text-blue-800',
      sent_to_kelly: 'bg-green-100 text-green-800',
      qualified: 'bg-green-100 text-green-800',
      appointment_set: 'bg-purple-100 text-purple-800',
      appointment_completed: 'bg-yellow-100 text-yellow-800',
      sale_made: 'bg-green-100 text-green-800',
      sale_lost: 'bg-red-100 text-red-800',
      not_interested: 'bg-red-100 text-red-800',
      tenant: 'bg-orange-100 text-orange-800',
      other_disposition: 'bg-gray-100 text-gray-800',
      no_contact: 'bg-gray-100 text-gray-800',
      blow_out: 'bg-red-100 text-red-800',
      callback: 'bg-yellow-100 text-yellow-800',
      pass_back_to_agent: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      qualifier_callback: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status: string) => {
    const names: { [key: string]: string } = {
      cold_call: 'Cold Call',
      interested: 'Interested',
      sent_to_kelly: 'Sent to Kelly',
      qualified: 'Qualified',
      appointment_set: 'Appointment Set',
      appointment_completed: 'Completed',
      sale_made: 'Sale Made',
      sale_lost: 'Sale Lost',
      not_interested: 'Not Interested',
      tenant: 'Tenant',
      other_disposition: 'Other',
      no_contact: 'No Contact',
      blow_out: 'Blow Out',
      callback: 'Call Back',
      pass_back_to_agent: 'Pass Back',
      on_hold: 'On Hold',
      qualifier_callback: 'Qualifier Callback',
    };
    return names[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceColumnIndex = columns.findIndex(col => col.leads.some(l => l.id.toString() === activeId));
    const targetColumnIndex = columns.findIndex(col => col.leads.some(l => l.id.toString() === overId) || col.id === overId);

    if (sourceColumnIndex === -1 || targetColumnIndex === -1) return;

    const sourceColumn = columns[sourceColumnIndex];
    const targetColumn = columns[targetColumnIndex];

    // If dragging within the same column, don't do anything (just a click)
    if (sourceColumn.id === targetColumn.id) return;

    const activeLeadIndex = sourceColumn.leads.findIndex(l => l.id.toString() === activeId);
    const activeLead = sourceColumn.leads[activeLeadIndex];

    const newStatus = targetColumn.statuses[0] as Lead['status'];

    // Update local state immediately for instant UI feedback
    setColumns(prev => {
      const newColumns = [...prev];

      // Remove from source
      newColumns[sourceColumnIndex] = {
        ...sourceColumn,
        leads: sourceColumn.leads.filter(l => l.id.toString() !== activeId),
      };

      // Add to target at the beginning (first position)
      newColumns[targetColumnIndex] = {
        ...targetColumn,
        leads: [{ ...activeLead, status: newStatus }, ...targetColumn.leads],
      };

      return newColumns;
    });

    try {
      let updatedLead: Lead;
      if (userRole === 'qualifier') {
        const response = await leadsAPI.qualifyLead(activeLead.id, { status: newStatus });
        updatedLead = response.lead;
      } else {
        const response = await leadsAPI.updateLead(activeLead.id, { status: newStatus });
        updatedLead = response;
      }
      
      // Call the onLeadUpdate callback with the updated lead
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
      
      toast.success(`Lead moved to ${targetColumn.title}`);
    } catch (err) {
      toast.error('Failed to update lead status');
      fetchLeads();
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Lead Pipeline - Kanban Board
        </h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto">
          <div className="flex space-x-2 min-w-max pb-4">
            {columns.map(col => (
              <DroppableColumn
                key={col.id}
                column={col}
                onCardClick={handleCardClick}
                userRole={userRole}
                getStatusBadgeColor={getStatusBadgeColor}
                getStatusDisplayName={getStatusDisplayName}
                formatDate={formatDate}
                activeId={activeId}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg p-4 shadow-xl border-2 border-green-500 opacity-95 transform rotate-2 scale-105">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {columns.flatMap(col => col.leads).find(l => l.id.toString() === activeId)?.full_name}
              </div>
              <div className="text-xs text-gray-600">
                📞 {columns.flatMap(col => col.leads).find(l => l.id.toString() === activeId)?.phone}
              </div>
              <div className="text-xs text-green-600 font-medium mt-1">
                Moving to new status...
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userRole={userRole}
        onLeadUpdated={(updatedLead) => {
          // Update the lead and move it to the correct column based on its new status
          setColumns(prev => {
            const newColumns = [...prev];
            
            // Find which column the lead should be in based on its new status
            const targetColumnIndex = newColumns.findIndex(col => 
              col.statuses.includes(updatedLead.status)
            );
            
            if (targetColumnIndex !== -1) {
              // Remove the lead from all columns first
              newColumns.forEach((col, index) => {
                newColumns[index] = {
                  ...col,
                  leads: col.leads.filter(l => l.id !== updatedLead.id)
                };
              });
              
              // Add the updated lead to the correct column at the beginning
              newColumns[targetColumnIndex] = {
                ...newColumns[targetColumnIndex],
                leads: [updatedLead, ...newColumns[targetColumnIndex].leads]
              };
            } else {
              // If no matching column found, just update in place
              newColumns.forEach((col, index) => {
                newColumns[index] = {
                  ...col,
                  leads: col.leads.map(l => (l.id === updatedLead.id ? updatedLead : l))
                };
              });
            }
            
            return newColumns;
          });
          
          if (onLeadUpdate) onLeadUpdate();
        }}
      />
    </div>
  );
};


export default KanbanBoard;
