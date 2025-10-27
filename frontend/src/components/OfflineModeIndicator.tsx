import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Offline Mode Indicator Component
 * 
 * Displays a banner/badge when the app is running in offline mode.
 * Shows:
 * - Network connection status (offline/online)
 * - Sync status information
 * - Optionally can show count of pending offline actions
 */

interface OfflineModeIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const { offlineMode } = useAuth();

  // Only show indicator when actually in offline mode
  if (!offlineMode) {
    return null;
  }

  return (
    <div className={`bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-md flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Offline icon */}
        <svg
          className="w-5 h-5 animate-pulse"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        
        {/* Status text */}
        <span className="font-semibold">
          Offline Mode
        </span>
        
        {/* Optional details */}
        {showDetails && (
          <span className="text-xs ml-2 opacity-75">
            (Data will sync when connection is restored)
          </span>
        )}
      </div>
    </div>
  );
};

export default OfflineModeIndicator;


