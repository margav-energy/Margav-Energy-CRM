import React from 'react';
import { Callback } from '../types';

interface CallbackBadgeProps {
  callbacks: Callback[];
  leadId: number;
  leadStatus?: string; // Add lead status to check if it's not callback
}

const CallbackBadge: React.FC<CallbackBadgeProps> = ({ callbacks, leadId, leadStatus }) => {
  const leadCallbacks = callbacks.filter(callback => callback.lead === leadId && callback.status === 'scheduled');
  
  if (leadCallbacks.length === 0) {
    return null;
  }
  
  // Don't show overdue status if lead status is not 'callback'
  if (leadStatus && leadStatus !== 'callback') {
    return null;
  }

  const nextCallback = leadCallbacks.sort((a, b) => 
    new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
  )[0];

  const isOverdue = new Date(nextCallback.scheduled_time) < new Date();
  const isDue = !isOverdue && (new Date(nextCallback.scheduled_time).getTime() - new Date().getTime()) <= 15 * 60 * 1000; // 15 minutes

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isOverdue 
        ? 'bg-red-100 text-red-800 border border-red-200' 
        : isDue 
        ? 'bg-orange-100 text-orange-800 border border-orange-200'
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }`}>
      <span className="mr-1">📞</span>
      <span>
        {isOverdue ? 'Overdue' : isDue ? 'Due Soon' : 'Scheduled'}
      </span>
      <span className="ml-1 text-xs opacity-75">
        {new Date(nextCallback.scheduled_time).toLocaleDateString()} {new Date(nextCallback.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export default CallbackBadge;
