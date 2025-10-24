import React, { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AgentDashboard from './AgentDashboard';
import QualifierDashboard from './QualifierDashboard';
import AdminDialerControl from './AdminDialerControl';
import CanvasserCreation from './CanvasserCreation';
import KanbanBoard from './KanbanBoard';
import { Lead } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qualifierLeadUpdateRef = useRef<((lead: Lead) => void) | null>(null);

  // Redirect canvassers to the canvasser form
  useEffect(() => {
    if (user?.role === 'canvasser') {
      navigate('/canvasser');
    }
  }, [user, navigate]);

  const handleKanbanLeadUpdate = useCallback((updatedLead?: Lead) => {
    // Pass the lead update to QualifierDashboard if it's a qualifier
    if (user?.role === 'qualifier' && qualifierLeadUpdateRef.current && updatedLead) {
      qualifierLeadUpdateRef.current(updatedLead);
    }
  }, [user?.role]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'agent':
      return <AgentDashboard />;
    case 'qualifier':
      return (
        <div className="space-y-6">
          <QualifierDashboard onKanbanLeadUpdate={qualifierLeadUpdateRef} />
          <KanbanBoard userRole={user.role} onLeadUpdate={handleKanbanLeadUpdate} />
        </div>
      );
    case 'salesrep':
      return (
        <div className="space-y-6">
          <div className="card-margav p-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Field Sales Rep Dashboard
            </h2>
            <p className="text-gray-600 mt-2">
              Welcome, {user.first_name}! Manage your sales pipeline and appointments.
            </p>
          </div>
          <KanbanBoard userRole={user.role} />
        </div>
      );
    case 'admin':
      return (
        <div className="space-y-6">
          <div className="card-margav p-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h2>
            <p className="text-gray-600 mt-2">
              Welcome, {user.first_name}! Control the dialer system and manage the CRM.
            </p>
          </div>
          <AdminDialerControl />
          <CanvasserCreation />
          <KanbanBoard userRole={user.role} />
        </div>
      );
    default:
      return (
        <div className="space-y-6">
          <div className="card-margav p-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-gray-600 mt-2">
              Welcome, {user.first_name}! Your role: {user.role}
            </p>
            <p className="text-gray-500 mt-4">
              No specific dashboard available for your role.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;

