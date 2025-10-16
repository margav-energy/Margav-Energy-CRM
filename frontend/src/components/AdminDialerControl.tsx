import React, { useState, useEffect } from 'react';
import { Dialer } from '../types';
import { dialerAPI } from '../api';
import { toast } from 'react-toastify';

const AdminDialerControl: React.FC = () => {
  const [dialer, setDialer] = useState<Dialer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDialerStatus();
  }, []);

  const fetchDialerStatus = async () => {
    try {
      setLoading(true);
      const dialerData = await dialerAPI.getDialerStatus();
      setDialer(dialerData);
    } catch (error) {
      toast.error('Failed to fetch dialer status');
    } finally {
      setLoading(false);
    }
  };

  const toggleDialer = async () => {
    if (!dialer) return;

    try {
      setUpdating(true);
      const newStatus = !dialer.is_active;
      const updatedDialer = await dialerAPI.updateDialerStatus(newStatus);
      setDialer(updatedDialer);
      
      if (newStatus) {
        toast.success('Dialer activated! Calls will now be distributed to agents.');
      } else {
        toast.info('Dialer deactivated. No new calls will be distributed.');
      }
    } catch (error) {
      toast.error('Failed to update dialer status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="card-margav p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-margav p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Dialer Control</h3>
          <p className="text-sm text-gray-600 mt-1">
            Control the call distribution system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            dialer?.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {dialer?.is_active ? 'Active' : 'Inactive'}
          </div>
          <button
            onClick={toggleDialer}
            disabled={updating}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              dialer?.is_active
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {updating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              dialer?.is_active ? 'Deactivate' : 'Activate'
            )}
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• When <span className="font-semibold text-green-600">Active</span>: Calls are automatically distributed to available agents</li>
          <li>• When <span className="font-semibold text-gray-600">Inactive</span>: No new calls are distributed</li>
          <li>• Agents receive cold call leads when the dialer is active</li>
          <li>• Agents can update lead disposition after each call</li>
        </ul>
      </div>

      {dialer && (
        <div className="mt-4 text-xs text-gray-500">
          Last updated: {new Date(dialer.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AdminDialerControl;
