// Utility functions for UK formatting
export const formatUKPostcode = (postcode: string): string => {
  if (!postcode) return '';
  return postcode.toUpperCase();
};

export const formatName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return address
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
