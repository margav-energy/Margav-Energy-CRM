import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
import LeadDetailsModal from './LeadDetailsModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanBoardProps {
  userRole: string;
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

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({
  lead,
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  onCardClick,
  userRole,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead?.id?.toString() || 'invalid' });

  // Safety check for lead data
  if (!lead || typeof lead.id === 'undefined') {
    console.warn('SortableLeadCard received invalid lead data:', lead);
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCardClick && userRole === 'qualifier' && !isDragging) {
      onCardClick(lead);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative ${
        userRole === 'qualifier' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Drag handle - only for non-qualifier users */}
      {userRole !== 'qualifier' && (
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        />
      )}
      
      {/* Drag handle for qualifiers - on the right side */}
      {userRole === 'qualifier' && (
        <div 
          {...attributes} 
          {...listeners} 
          className="absolute top-2 right-2 w-6 h-6 cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100 transition-opacity bg-gray-100 hover:bg-gray-200 rounded"
          title="Drag to move"
        >
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      )}
      
      {/* Content area */}
      <div 
        className="relative z-10"
        onClick={handleCardClick}
      >
      <div className="mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{lead.full_name}</h4>
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadgeColor(lead.status)}`}>
          {getStatusDisplayName(lead.status)}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <p>📞 {lead.phone}</p>
        {lead.email && <p>📧 {lead.email}</p>}
        {lead.appointment_date && (
          <p>📅 {formatDate(lead.appointment_date)}</p>
        )}
        {lead.sale_amount && (
          <p className="font-semibold text-green-600">💰 ${lead.sale_amount.toLocaleString()}</p>
        )}
      </div>
      
      {lead.notes && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{lead.notes}</p>
      )}
      
      <div className="mt-2 text-xs text-gray-400">
        Assigned to: {lead.assigned_agent_name || lead.assigned_agent_username}
      </div>
      </div>
    </div>
  );
};

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  column,
  onCardClick,
  userRole,
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
  activeId,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column: column,
    },
  });

  return (
    <div key={column.id} className="flex-shrink-0 w-64 lg:w-72">
      <div 
        ref={setNodeRef}
        className={`${column.color} rounded-lg p-4 h-full min-h-[400px] transition-all duration-200 ${
          isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{column.title}</h3>
          <span className="bg-white bg-opacity-50 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {column.leads.length}
          </span>
        </div>
        
        <SortableContext
          items={column.leads
            .filter(lead => lead && typeof lead.id !== 'undefined')
            .map(lead => lead.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {column.leads.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-xs">No leads</p>
              </div>
            ) : (
              column.leads
                .filter(lead => lead && typeof lead.id !== 'undefined')
                .map((lead) => (
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

const KanbanBoard: React.FC<KanbanBoardProps> = ({ userRole }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLeads();
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh disabled for qualifier dashboard to avoid distraction
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchLeads();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await leadsAPI.getLeads();
      const leads = response.results;
      
      // Define columns based on user role
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

      // Populate columns with leads - filter out any undefined leads
      const validLeads = leads.filter(lead => lead && lead.id);
      const populatedColumns = columnDefinitions.map(column => ({
        ...column,
        leads: validLeads.filter(lead => column.statuses.includes(lead.status))
      }));

      setColumns(populatedColumns);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'cold_call': 'bg-gray-100 text-gray-800',
      'interested': 'bg-blue-100 text-blue-800',
      'sent_to_kelly': 'bg-green-100 text-green-800',
      'qualified': 'bg-green-100 text-green-800',
      'appointment_set': 'bg-purple-100 text-purple-800',
      'appointment_completed': 'bg-yellow-100 text-yellow-800',
      'sale_made': 'bg-green-100 text-green-800',
      'sale_lost': 'bg-red-100 text-red-800',
      'not_interested': 'bg-red-100 text-red-800',
      'tenant': 'bg-orange-100 text-orange-800',
      'other_disposition': 'bg-gray-100 text-gray-800',
      'no_contact': 'bg-gray-100 text-gray-800',
      'blow_out': 'bg-red-100 text-red-800',
      'callback': 'bg-yellow-100 text-yellow-800',
      'pass_back_to_agent': 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status: string) => {
    const names: { [key: string]: string } = {
      'cold_call': 'Cold Call',
      'interested': 'Interested',
      'sent_to_kelly': 'Sent to Kelly',
      'qualified': 'Qualified',
      'appointment_set': 'Appointment Set',
      'appointment_completed': 'Completed',
      'sale_made': 'Sale Made',
      'sale_lost': 'Sale Lost',
      'not_interested': 'Not Interested',
      'tenant': 'Tenant',
      'other_disposition': 'Other',
      'no_contact': 'No Contact',
      'blow_out': 'Blow Out',
      'callback': 'Call Back',
      'pass_back_to_agent': 'Pass Back',
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

  const handleLeadUpdated = (updatedLead: Lead) => {
    // Update the lead in the columns
    setColumns(prevColumns => {
      return prevColumns.map(column => ({
        ...column,
        leads: column.leads.filter(lead => lead && lead.id).map(lead => 
          lead.id === updatedLead.id ? updatedLead : lead
        )
      }));
    });
    // Refresh the data to ensure consistency
    fetchLeads();
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

    // Find the source column and lead
    let sourceColumn: KanbanColumn | null = null;
    let sourceLead: Lead | null = null;

    for (const column of columns) {
      const leadIndex = column.leads.findIndex(lead => lead.id.toString() === activeId);
      if (leadIndex !== -1) {
        sourceColumn = column;
        sourceLead = column.leads[leadIndex];
        break;
      }
    }

    if (!sourceColumn || !sourceLead) return;

    // Find the target column
    let targetColumn: KanbanColumn | null = null;
    
    // Check if dropping on a column (empty or with leads)
    const targetColumnDirect = columns.find(col => col.id === overId);
    if (targetColumnDirect) {
      targetColumn = targetColumnDirect;
    } else {
      // Check if dropping on a lead (find which column contains the target lead)
      for (const column of columns) {
        if (column.leads.some(lead => lead.id.toString() === overId)) {
          targetColumn = column;
          break;
        }
      }
    }

    if (!targetColumn || sourceColumn.id === targetColumn.id) return;

    // Determine new status based on target column
    let newStatus = sourceLead.status;
    if (targetColumn.statuses.length > 0) {
      newStatus = targetColumn.statuses[0] as Lead['status'];
    }

    // Update the lead status in the backend
    try {
      let updatedLead: Lead | undefined;
      
      // For qualifiers, allow unrestricted movement between any columns
      if (userRole === 'qualifier') {
        // Qualifiers can move leads to any status without restrictions
        const response = await leadsAPI.qualifyLead(sourceLead.id, { status: newStatus });
        updatedLead = response.lead;
      } else {
        // For other roles, use the regular update endpoint
        updatedLead = await leadsAPI.updateLead(sourceLead.id, { status: newStatus });
      }
      
      // Update local state
      setColumns(prevColumns => {
        const newColumns = [...prevColumns];
        
        // Remove from source column
        const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn!.id);
        if (sourceColIndex !== -1) {
          newColumns[sourceColIndex] = {
            ...newColumns[sourceColIndex],
            leads: newColumns[sourceColIndex].leads.filter(lead => lead.id?.toString() !== activeId)
          };
        }
        
        // Add to target column
        const targetColIndex = newColumns.findIndex(col => col.id === targetColumn!.id);
        if (targetColIndex !== -1) {
          const leadToAdd: Lead = updatedLead || { ...sourceLead!, status: newStatus };
          newColumns[targetColIndex] = {
            ...newColumns[targetColIndex],
            leads: [...newColumns[targetColIndex].leads, leadToAdd]
          };
        }
        
        return newColumns;
      });

      // If the new status is 'appointment_set', sync to Google Calendar
      if (newStatus === 'appointment_set' && updatedLead) {
        try {
          // Check if the lead has an appointment date
          if (updatedLead.appointment_date) {
            // The backend should automatically sync to Google Calendar via the Lead model's sync_to_google_calendar method
            toast.success(`Lead moved to ${targetColumn.title} and synced to Google Calendar`);
          } else {
            toast.success(`Lead moved to ${targetColumn.title}. Please set an appointment date to sync to Google Calendar.`);
          }
        } catch (calendarError) {
          console.error('Google Calendar sync failed:', calendarError);
          toast.warning(`Lead moved to ${targetColumn.title}, but Google Calendar sync failed. Please check calendar integration.`);
        }
      } else {
        toast.success(`Lead moved to ${targetColumn.title}`);
      }
    } catch (error) {
      console.error('Failed to update lead status:', error);
      toast.error('Failed to update lead status');
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
        <button
          onClick={fetchLeads}
          className="btn-margav-secondary"
        >
          Refresh
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto">
          <div className="flex space-x-2 min-w-max pb-4">
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
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
            <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-green-500 opacity-90">
              <div className="text-sm font-medium text-gray-900">
                {columns.flatMap(col => col.leads).find(lead => lead.id.toString() === activeId)?.full_name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Lead Details Modal */}
      <LeadDetailsModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        userRole={userRole}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
};

export default KanbanBoard;
