import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface MockCallProps {
  onIncomingCall: (callData: {
    full_name: string;
    phone: string;
    email?: string;
    address?: string;
    postcode?: string;
    notes?: string;
  }) => void;
}

const MockCall: React.FC<MockCallProps> = ({ onIncomingCall }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callCount, setCallCount] = useState(0);

  // Mock call data for agent 1
  const mockCalls = [
    {
      full_name: 'Emma Thompson',
      phone: '07123456789',
      email: 'emma.thompson@email.com',
      address: '123 Oak Street, Manchester',
      postcode: 'M1 2AB',
      notes: 'Interested in solar panels for her 3-bedroom house in Manchester'
    },
    {
      full_name: 'James Wilson',
      phone: '07987654321',
      email: 'james.wilson@company.co.uk',
      address: '45 Business Park, Birmingham',
      postcode: 'B15 2TT',
      notes: 'Commercial property owner looking for renewable energy solutions'
    },
    {
      full_name: 'Sarah Davis',
      phone: '07555123456',
      email: 'sarah.davis@email.com',
      address: '78 Maple Avenue, Leeds',
      postcode: 'LS1 4DF',
      notes: 'Recently moved house, interested in energy efficiency improvements'
    },
    {
      full_name: 'Michael Brown',
      phone: '07444111222',
      email: 'mike.brown@business.com',
      address: '92 High Street, Liverpool',
      postcode: 'L1 8GH',
      notes: 'Small business owner wanting to reduce energy costs'
    },
    {
      full_name: 'Lisa Johnson',
      phone: '07333111222',
      email: 'lisa.johnson@email.com',
      address: '156 Elm Road, Sheffield',
      postcode: 'S1 3JK',
      notes: 'Homeowner interested in heat pumps and solar combination'
    },
    {
      full_name: 'David Smith',
      phone: '07222111333',
      email: 'david.smith@email.com',
      address: '34 Pine Close, Newcastle',
      postcode: 'NE1 7LM',
      notes: 'New homeowner looking for energy solutions'
    },
    {
      full_name: 'Rachel Green',
      phone: '07111122333',
      email: 'rachel.green@email.com',
      address: '67 Cedar Lane, Bristol',
      postcode: 'BS1 5NP',
      notes: 'Environmental enthusiast interested in green energy'
    },
    {
      full_name: 'Tom Anderson',
      phone: '07000111222',
      email: 'tom.anderson@email.com',
      address: '89 Birch Way, Cardiff',
      postcode: 'CF1 6QR',
      notes: 'Retired engineer interested in solar technology'
    }
  ];

  const generateUniquePhone = (basePhone: string) => {
    // Add timestamp to make phone number unique
    const timestamp = Date.now().toString().slice(-4);
    return `07${timestamp}${basePhone.slice(2, 5)}`;
  };

  const startMockCall = () => {
    if (callCount >= mockCalls.length) {
      toast.info('All mock calls completed!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const callData = {
      ...mockCalls[callCount],
      phone: generateUniquePhone(mockCalls[callCount].phone)
    };
    setCurrentCall(callData);
    setIsActive(true);
    setCallCount(prev => prev + 1);

    // Show incoming call notification
    toast.info(`Incoming call from ${callData.full_name}`, {
      position: 'top-right',
      autoClose: 2000,
    });

    // Simulate call duration (3-5 seconds)
    const callDuration = Math.random() * 2000 + 3000;
    setTimeout(() => {
      setIsActive(false);
      // Trigger the lead form with call data
      onIncomingCall(callData);
      setCurrentCall(null);
    }, callDuration);
  };

  const stopMockCalls = () => {
    setIsActive(false);
    setCurrentCall(null);
    setCallCount(0);
    toast.info('Mock calls stopped', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  return (
    <div className="card-margav p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Mock Call Simulator
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">
            {isActive ? 'Call Active' : 'Ready'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Call Queue Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Calls Completed:</span>
              <span className="ml-2 font-medium">{callCount}</span>
            </div>
            <div>
              <span className="text-gray-600">Remaining:</span>
              <span className="ml-2 font-medium">{mockCalls.length - callCount}</span>
            </div>
          </div>
        </div>

        {currentCall && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Call</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div><strong>Name:</strong> {currentCall.full_name}</div>
              <div><strong>Phone:</strong> {currentCall.phone}</div>
              <div><strong>Email:</strong> {currentCall.email}</div>
              <div><strong>Notes:</strong> {currentCall.notes}</div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={startMockCall}
            disabled={isActive || callCount >= mockCalls.length}
            className="btn-margav-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActive ? 'Call in Progress...' : callCount >= mockCalls.length ? 'All Calls Complete' : 'Start Next Call'}
          </button>
          
          <button
            onClick={stopMockCalls}
            disabled={!isActive && callCount === 0}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Stop Calls
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>This simulator will automatically trigger the Lead Form with pre-populated data from each mock call.</p>
          <p>Each call lasts 3-5 seconds and will open the form when completed.</p>
        </div>
      </div>
    </div>
  );
};

export default MockCall;
