import React, { useState, useEffect } from 'react';
import { Lead, CallData } from '../types';

interface CallSimulatorProps {
  onLeadInterest: (lead: Lead) => void;
  onCallEnd: () => void;
}

const CallSimulator: React.FC<CallSimulatorProps> = ({ onLeadInterest, onCallEnd }) => {
  const [callData, setCallData] = useState<CallData>({
    isActive: false,
    duration: 0,
  });
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);

  // Mock lead data for simulation
  const mockLeads: Lead[] = [
    {
      id: 999,
      full_name: 'John Smith',
      phone: '+1234567890',
      email: 'john.smith@email.com',
      status: 'interested',
      assigned_agent: 1,
      assigned_agent_name: 'Current Agent',
      assigned_agent_username: 'agent1',
      notes: 'Mock lead for call simulation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 998,
      full_name: 'Sarah Johnson',
      phone: '+1234567891',
      email: 'sarah.johnson@email.com',
      status: 'interested',
      assigned_agent: 1,
      assigned_agent_name: 'Current Agent',
      assigned_agent_username: 'agent1',
      notes: 'Mock lead for call simulation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callData.isActive) {
      interval = setInterval(() => {
        setCallData(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callData.isActive]);

  const startCall = () => {
    const randomLead = mockLeads[Math.floor(Math.random() * mockLeads.length)];
    setCurrentLead(randomLead);
    setCallData({
      isActive: true,
      lead: randomLead,
      duration: 0,
    });
  };

  const endCall = () => {
    setCallData({
      isActive: false,
      duration: 0,
    });
    setCurrentLead(null);
    onCallEnd();
  };

  const handleLeadInterest = () => {
    if (currentLead) {
      onLeadInterest(currentLead);
      endCall();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callData.isActive && currentLead) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-green-800">Active Call</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-green-700">{formatTime(callData.duration)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900">{currentLead.full_name}</h4>
          <p className="text-sm text-gray-600">{currentLead.phone}</p>
          {currentLead.email && (
            <p className="text-sm text-gray-600">{currentLead.email}</p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleLeadInterest}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Lead Shows Interest
          </button>
          <button
            onClick={endCall}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            End Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Call Simulator</h3>
      <p className="text-sm text-gray-600 mb-4">
        Simulate an incoming call to test the lead management workflow.
      </p>
      <button
        onClick={startCall}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Start Mock Call
      </button>
    </div>
  );
};

export default CallSimulator;
