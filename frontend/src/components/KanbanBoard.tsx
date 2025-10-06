import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { leadsAPI } from '../api';
import { toast } from 'react-toastify';
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
}

const SortableLeadCard: React.FC<SortableLeadCardProps> = ({
  lead,
  getStatusBadgeColor,
  getStatusDisplayName,
  formatDate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{lead.full_name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(lead.status)}`}>
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
  );
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ userRole }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLeads();
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

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
          { id: 'qualified', title: 'Qualified', statuses: ['qualified'], color: 'bg-green-100' },
          { id: 'appointments', title: 'Appointments Set', statuses: ['appointment_set'], color: 'bg-purple-100' },
          { id: 'not_qualified', title: 'Not Qualified', statuses: ['not_interested', 'no_contact', 'blow_out', 'callback', 'pass_back_to_agent'], color: 'bg-red-100' },
        ];
      } else if (userRole === 'salesrep') {
        columnDefinitions = [
          { id: 'appointments', title: 'My Appointments', statuses: ['appointment_set'], color: 'bg-purple-100' },
          { id: 'completed', title: 'Completed', statuses: ['appointment_completed'], color: 'bg-yellow-100' },
          { id: 'sales', title: 'Sales Results', statuses: ['sale_made', 'sale_lost'], color: 'bg-indigo-100' },
        ];
      }

      // Populate columns with leads
      const populatedColumns = columnDefinitions.map(column => ({
        ...column,
        leads: leads.filter(lead => column.statuses.includes(lead.status))
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
    for (const column of columns) {
      if (column.id === overId || column.leads.some(lead => lead.id.toString() === overId)) {
        targetColumn = column;
        break;
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
      
      // Use different API endpoints based on user role
      if (userRole === 'qualifier') {
        // For qualifiers, use the qualify endpoint for any status change
        updatedLead = await leadsAPI.qualifyLead(sourceLead.id, { status: newStatus });
      } else {
        // For other roles, use the regular update endpoint
        updatedLead = await leadsAPI.updateLead(sourceLead.id, { status: newStatus });
      }
      
      // Update local state
      setColumns(prevColumns => {
        const newColumns = [...prevColumns];
        
        // Remove from source column
        const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn!.id);
        newColumns[sourceColIndex] = {
          ...newColumns[sourceColIndex],
          leads: newColumns[sourceColIndex].leads.filter(lead => lead.id?.toString() !== activeId)
        };
        
        // Add to target column
        const targetColIndex = newColumns.findIndex(col => col.id === targetColumn!.id);
        const leadToAdd: Lead = updatedLead || { ...sourceLead!, status: newStatus };
        newColumns[targetColIndex] = {
          ...newColumns[targetColIndex],
          leads: [...newColumns[targetColIndex].leads, leadToAdd]
        };
        
        return newColumns;
      });

      toast.success(`Lead moved to ${targetColumn.title}`);
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
          <div className="flex space-x-3 min-w-max pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-64 lg:w-72">
                <div className={`${column.color} rounded-lg p-4 h-full min-h-[500px]`}>
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
                            />
                          ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              </div>
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
    </div>
  );
};

export default KanbanBoard;
