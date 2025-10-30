import { Lead } from '../types';

// Allowed statuses for qualifier views
export const allowedQualifierStatuses = new Set<string>([
  'sent_to_kelly',
  'qualified',
  'no_contact',
  'blow_out',
  'not_interested',
  'pass_back_to_agent',
  'appointment_set',
  'on_hold',
  'qualifier_callback',
]);

export function dedupeLeadsById(leads: Lead[]): Lead[] {
  return Array.from(new Map(leads.map(l => [l.id, l])).values());
}

export function filterLeadsForQualifier(leads: Lead[]): Lead[] {
  return dedupeLeadsById(leads).filter(l => allowedQualifierStatuses.has(l.status));
}


