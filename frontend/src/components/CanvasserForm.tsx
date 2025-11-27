import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatUKPostcode, formatName, formatAddress } from '../utils/formatting';
import { fieldSubmissionsAPI } from '../api';

interface FieldFormData {
  id?: string;
  backendId?: number; // Backend database ID for synced submissions
  // Canvasser Info (auto-generated)
  canvasserName: string;
  date: string;
  time: string;
  
  // Contact Information
  customerName: string;
  address: string;
  postalCode: string;
  phone: string;
  email: string;
  preferredContactTime: string;
  
  // Property Information
  ownsProperty: string; // 'yes' | 'no'
  propertyType: string;
  numberOfBedrooms: string;
  roofType: string;
  roofMaterial: string;
  roofCondition: string;
  roofAge: string;
  
  // Energy Usage
  averageMonthlyBill: string;
  energyType: string; // 'gas' | 'electric' | 'dual'
  currentEnergySupplier: string;
  usesElectricHeating: string; // 'yes' | 'no'
  electricHeatingDetails: string; // EV, heat pump, etc.
  
  // Timeframe and Interest
  hasReceivedOtherQuotes: string; // 'yes' | 'no'
  isDecisionMaker: string; // 'yes' | 'no'
  movingIn5Years: string; // 'yes' | 'no'
  
  // Photos
  photos: {
    frontRoof: string;
    rearRoof: string;
    sideRoof: string;
    energyBill: string;
    additional: string[];
  };
  
  // Optional
  notes: string;
  
  // System fields
  timestamp: string;
  isOnline: boolean;
  synced: boolean;
}

type FormStep = 'contact' | 'property' | 'energy' | 'photos' | 'interest' | 'review';

const CanvasserForm: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>('contact');
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  
  // Get current user for canvasser name
  const canvasserName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Unknown';
  
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-GB');
  const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  const [formData, setFormData] = useState<FieldFormData>({
    // Auto-generated
    canvasserName: canvasserName,
    date: currentDate,
    time: currentTime,
    
    // Contact Information
    customerName: '',
    address: '',
    postalCode: '',
    phone: '',
    email: '',
    preferredContactTime: '',
    
    // Property Information
    ownsProperty: '',
    propertyType: '',
    numberOfBedrooms: '',
    roofType: '',
    roofMaterial: '',
    roofCondition: '',
    roofAge: '',
    
    // Energy Usage
    averageMonthlyBill: '',
    energyType: '',
    currentEnergySupplier: '',
    usesElectricHeating: '',
    electricHeatingDetails: '',
    
    // Timeframe and Interest
    hasReceivedOtherQuotes: '',
    isDecisionMaker: '',
    movingIn5Years: '',
    
    // Photos
    photos: {
      frontRoof: '',
      rearRoof: '',
      sideRoof: '',
      energyBill: '',
      additional: []
    },
    
    // Optional
    notes: '',
    
    // System
    timestamp: new Date().toISOString(),
    isOnline: navigator.onLine,
    synced: false
  });

  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'frontRoof' | 'rearRoof' | 'sideRoof' | 'energyBill' | 'additional' | null>(null);
  const [capturingAdditionalIndex, setCapturingAdditionalIndex] = useState<number>(0);
  const [pendingSubmissions, setPendingSubmissions] = useState<FieldFormData[]>([]);
  const [syncedSubmissions, setSyncedSubmissions] = useState<FieldFormData[]>([]);
  const [actualSyncedCount, setActualSyncedCount] = useState<number>(0);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSyncedSubmissions, setShowSyncedSubmissions] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; synced: boolean; customerName: string } | null>(null);
  const [syncingSubmissionId, setSyncingSubmissionId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setFormData(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setFormData(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending submissions from IndexedDB
  useEffect(() => {
    loadPendingSubmissions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  }, [pendingSubmissions.length, syncedSubmissions.length, actualSyncedCount]);

  // Step validation functions
  const validateStep = (step: FormStep): boolean => {
    switch (step) {
      case 'contact':
        return !!(
          formData.customerName && 
          formData.address && 
          formData.postalCode && 
          formData.phone && 
          formData.email &&
          formData.preferredContactTime
        );
      case 'property':
        return !!(
          formData.ownsProperty &&
          formData.propertyType &&
          formData.numberOfBedrooms &&
          formData.roofType &&
          formData.roofMaterial &&
          formData.roofCondition &&
          formData.roofAge
        );
      case 'energy':
        const basicEnergyFields = !!(
          formData.averageMonthlyBill &&
          formData.energyType &&
          formData.currentEnergySupplier &&
          formData.usesElectricHeating
        );
        
        // If yes, electricHeatingDetails is required
        if (formData.usesElectricHeating === 'yes') {
          return basicEnergyFields && !!formData.electricHeatingDetails;
        }
        
        return basicEnergyFields;
      case 'interest':
        return !!(
          formData.hasReceivedOtherQuotes &&
          formData.isDecisionMaker &&
          formData.movingIn5Years
        );
      case 'photos':
        // Photos are now required - check all four compulsory photos
        return !!(
          formData.photos.frontRoof && 
          formData.photos.rearRoof && 
          formData.photos.sideRoof &&
          formData.photos.energyBill
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const canProceedToStep = (step: FormStep): boolean => {
    const stepOrder: FormStep[] = ['contact', 'property', 'energy', 'photos', 'interest', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const targetIndex = stepOrder.indexOf(step);
    
    // Can only proceed to next step or go back
    if (targetIndex > currentIndex + 1) {
      return false;
    }
    
    // Check if all previous steps are completed
    for (let i = 0; i < targetIndex; i++) {
      if (!completedSteps.has(stepOrder[i]) && !validateStep(stepOrder[i])) {
        return false;
      }
    }
    
    return true;
  };

  const markStepCompleted = (step: FormStep) => {
    if (validateStep(step)) {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(step);
        return newSet;
      });
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (formData.isOnline && pendingSubmissions.length > 0) {
      syncPendingSubmissions();
    }
  }, [formData.isOnline, pendingSubmissions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to sync submissions from backend (always called to ensure cross-device sync)
  const restoreSyncedSubmissions = async () => {
    try {
      // Fetch all submissions from backend using the proper API
      const userSubmissions = await fieldSubmissionsAPI.getFieldSubmissions();
      
      if (!userSubmissions || userSubmissions.length === 0) {
        return 0;
      }
      
      const db = await openDB();
      const checkTransaction = db.transaction(['syncedSubmissions'], 'readonly');
      const checkStore = checkTransaction.objectStore('syncedSubmissions');
      const existingData = await new Promise<FieldFormData[]>((resolve, reject) => {
        const request = checkStore.getAll();
        request.onsuccess = () => resolve(request.result as FieldFormData[]);
        request.onerror = () => reject(request.error);
      });
      
      // Convert backend submissions to FieldFormData format
      // Use backend ID as the key to ensure proper deduplication
      const syncedData = userSubmissions.map((submission: any) => ({
        id: `backend_${submission.id}`, // Use backend ID to identify synced submissions
        backendId: submission.id, // Store original backend ID for updates/deletes
        canvasserName: submission.field_agent_name || submission.canvasser_name || user?.first_name || 'Unknown',
        date: submission.created_at 
          ? new Date(submission.created_at).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB'),
        time: submission.created_at
          ? new Date(submission.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        customerName: submission.customer_name || 'Unknown',
        address: submission.address || '',
        postalCode: submission.postal_code || '',
        phone: submission.phone || '',
        email: submission.email || '',
        preferredContactTime: submission.preferred_contact_time || '',
        ownsProperty: submission.property_ownership || '',
        propertyType: submission.property_type || '',
        numberOfBedrooms: submission.number_of_bedrooms || '',
        roofType: submission.roof_type || '',
        roofMaterial: submission.roof_material || '',
        roofCondition: submission.roof_condition || '',
        roofAge: submission.roof_age || '',
        averageMonthlyBill: submission.average_monthly_bill || '',
        energyType: submission.energy_type || '',
        currentEnergySupplier: submission.current_energy_supplier || '',
        usesElectricHeating: submission.uses_electric_heating || '',
        electricHeatingDetails: submission.electric_heating_details || '',
        hasReceivedOtherQuotes: submission.has_received_other_quotes || '',
        isDecisionMaker: submission.is_decision_maker || '',
        movingIn5Years: submission.moving_in_5_years || '',
        photos: submission.photos || { frontRoof: '', rearRoof: '', sideRoof: '', energyBill: '', additional: [] },
        notes: submission.notes || '',
        synced: true,
        timestamp: submission.created_at || new Date().toISOString(),
        isOnline: true
      }));
      
      // Create a map of existing submissions by backend ID for efficient lookup
      const existingByBackendId = new Map<string, FieldFormData>();
      existingData.forEach(item => {
        const backendId = (item as any).backendId;
        if (backendId) {
          existingByBackendId.set(String(backendId), item);
        }
      });
      
      // Find new submissions and updates
      const newSubmissions: FieldFormData[] = [];
      const updatedSubmissions: FieldFormData[] = [];
      
      syncedData.forEach((submission: FieldFormData) => {
        const backendId = (submission as any).backendId;
        const existing = backendId ? existingByBackendId.get(String(backendId)) : null;
        
        if (!existing) {
          // New submission from backend
          newSubmissions.push(submission);
        } else {
          // Update existing submission with latest data from backend
          updatedSubmissions.push(submission);
        }
      });
      
      // Update IndexedDB with new and updated submissions
      if (newSubmissions.length > 0 || updatedSubmissions.length > 0) {
        const transaction = db.transaction(['syncedSubmissions'], 'readwrite');
        const store = transaction.objectStore('syncedSubmissions');
        
        // Add new submissions
        for (const submission of newSubmissions) {
          await new Promise<void>((resolve, reject) => {
            const request = store.put(submission);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
        
        // Update existing submissions
        for (const submission of updatedSubmissions) {
          await new Promise<void>((resolve, reject) => {
            const request = store.put(submission);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }
      
      // Merge all submissions: existing (that weren't updated) + new + updated
      const existingNotUpdated = existingData.filter(item => {
        const backendId = (item as any).backendId;
        return backendId && !updatedSubmissions.find(u => (u as any).backendId === backendId);
      });
      
      const allSyncedSubmissions = [...existingNotUpdated, ...newSubmissions, ...updatedSubmissions];
      setSyncedSubmissions(allSyncedSubmissions);
      setActualSyncedCount(allSyncedSubmissions.length);
      
      return newSubmissions.length + updatedSubmissions.length;
    } catch (error) {
      console.error('Error syncing submissions from backend:', error);
      return 0;
    }
  };

  const loadPendingSubmissions = async () => {
    if (isLoadingSubmissions) {
      
      return;
    }
    
    try {
      setIsLoadingSubmissions(true);
      
      const db = await openDB();
      
      
      // Load pending submissions
      const pendingData = await new Promise<FieldFormData[]>((resolve, reject) => {
        const pendingTransaction = db.transaction(['pendingSubmissions'], 'readonly');
        const pendingStore = pendingTransaction.objectStore('pendingSubmissions');
        const pendingRequest = pendingStore.getAll();
        
        pendingRequest.onsuccess = () => {
          const data = pendingRequest.result as FieldFormData[];
          
          resolve(data);
        };
        
        pendingRequest.onerror = () => {
          
          reject(pendingRequest.error);
        };
      });
      
      // Always sync with backend to ensure cross-device data persistence
      // This ensures that when a user logs in on a different device, they see all their submissions
      await restoreSyncedSubmissions();
      
      // Reload synced submissions after backend sync to get the updated data
      const updatedSyncedData = await new Promise<FieldFormData[]>((resolve, reject) => {
        const updatedTransaction = db.transaction(['syncedSubmissions'], 'readonly');
        const updatedStore = updatedTransaction.objectStore('syncedSubmissions');
        const updatedRequest = updatedStore.getAll();
        
        updatedRequest.onsuccess = () => {
          const data = updatedRequest.result as FieldFormData[];
          resolve(data);
        };
        
        updatedRequest.onerror = () => {
          reject(updatedRequest.error);
        };
      });
      
      // Update React state with both datasets (local pending + synced from backend)
      setPendingSubmissions(pendingData);
      setSyncedSubmissions(updatedSyncedData);
      setActualSyncedCount(updatedSyncedData.length);
      
    } catch (error) {
      
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FieldAgentDB', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('pendingSubmissions')) {
          const store = db.createObjectStore('pendingSubmissions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('syncedSubmissions')) {
          const store = db.createObjectStore('syncedSubmissions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  };

  const saveToOfflineStorage = async (data: FieldFormData): Promise<FieldFormData> => {
    return new Promise((resolve, reject) => {
      openDB().then(db => {
        const transaction = db.transaction(['pendingSubmissions'], 'readwrite');
        const store = transaction.objectStore('pendingSubmissions');
        
        const submissionData = {
          ...data,
          id: data.id || `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        const request = store.add(submissionData);
        
        request.onsuccess = () => {
          setPendingSubmissions(prev => [...prev, submissionData]);
          resolve(submissionData);
        };
        
        request.onerror = () => {
          
          reject(request.error);
        };
      }).catch(error => {
        
        reject(error);
      });
    });
  };

  const capturePhoto = async (photoType: 'frontRoof' | 'rearRoof' | 'sideRoof' | 'energyBill' | 'additional', additionalIndex?: number) => {
    try {
      setCurrentPhotoType(photoType);
      if (photoType === 'additional' && additionalIndex !== undefined) {
        setCapturingAdditionalIndex(additionalIndex);
      }
      setIsCapturingPhoto(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      
      setErrorMessage('Unable to access camera. Please check permissions.');
      setShowError(true);
      setIsCapturingPhoto(false);
      setCurrentPhotoType(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        if (currentPhotoType) {
          if (currentPhotoType === 'additional') {
            setFormData(prev => {
              const newAdditional = [...prev.photos.additional];
              newAdditional[capturingAdditionalIndex] = photoData;
              return {
                ...prev,
                photos: {
                  ...prev.photos,
                  additional: newAdditional
                }
              };
            });
          } else {
          setFormData(prev => ({
            ...prev,
            photos: {
              ...prev.photos,
              [currentPhotoType]: photoData
            }
          }));
          }
        }
        
        // Stop camera
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
      }
    }
    
    setIsCapturingPhoto(false);
    setCurrentPhotoType(null);
  };

  const removePhoto = (photoType: 'frontRoof' | 'rearRoof' | 'sideRoof' | 'energyBill' | 'additional', additionalIndex?: number) => {
    if (photoType === 'additional' && additionalIndex !== undefined) {
      setFormData(prev => {
        const newAdditional = [...prev.photos.additional];
        newAdditional.splice(additionalIndex, 1);
        return {
          ...prev,
          photos: {
            ...prev.photos,
            additional: newAdditional
          }
        };
      });
    } else {
    setFormData(prev => ({
      ...prev,
      photos: {
        ...prev.photos,
        [photoType]: ''
      }
    }));
    }
  };
  
  const addAdditionalPhotoSlot = () => {
    setFormData(prev => ({
      ...prev,
      photos: {
        ...prev.photos,
        additional: [...prev.photos.additional, '']
      }
    }));
  };


  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      
    }
  };

  const loadSubmissionForEdit = async (submission: FieldFormData) => {
    try {
      setFormData({
        ...submission,
        // Update timestamp and online status
        timestamp: new Date().toISOString(),
        isOnline: navigator.onLine,
      });
      
      // Set editing state
      setEditingSubmissionId(submission.id || null);
      
      // Mark all steps as completed so user can navigate freely
      const stepOrder: FormStep[] = ['contact', 'property', 'energy', 'photos', 'interest', 'review'];
      setCompletedSteps(new Set(stepOrder));
      
      // Navigate to contact step
      setCurrentStep('contact');
      
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setSuccessMessage('Form loaded for editing. Make your changes and submit.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setErrorMessage('Failed to load submission for editing.');
      setShowError(true);
    }
  };

  const deletePendingSubmission = async (submissionId: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['pendingSubmissions'], 'readwrite');
      const store = transaction.objectStore('pendingSubmissions');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(submissionId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // Update state
      setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));
      
      setSuccessMessage('Submission deleted successfully.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setErrorMessage('Failed to delete submission.');
      setShowError(true);
    }
  };

  const deleteSyncedSubmission = async (submissionId: string, backendId?: number) => {
    try {
      // If we have a backend ID and we're online, delete from backend
      if (backendId && formData.isOnline) {
        try {
          await fieldSubmissionsAPI.deleteFieldSubmission(backendId);
        } catch (error) {
          // If backend deletion fails, still try to remove from local storage
          console.warn('Failed to delete from backend, removing from local storage only');
        }
      }
      
      // Remove from local IndexedDB
      const db = await openDB();
      const transaction = db.transaction(['syncedSubmissions'], 'readwrite');
      const store = transaction.objectStore('syncedSubmissions');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(submissionId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // Update state
      setSyncedSubmissions(prev => prev.filter(s => s.id !== submissionId));
      setActualSyncedCount(prev => Math.max(0, prev - 1));
      
      setSuccessMessage('Submission deleted successfully.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setErrorMessage('Failed to delete submission.');
      setShowError(true);
    }
  };

  const confirmDelete = (submission: FieldFormData, isSynced: boolean) => {
    setDeleteTarget({
      id: submission.id || '',
      synced: isSynced,
      customerName: submission.customerName
    });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.synced) {
      // Find the submission to get backend ID
      const submission = syncedSubmissions.find(s => s.id === deleteTarget.id);
      // Prefer backendId field, fallback to extracting from ID
      let backendId: number | undefined = submission?.backendId;
      if (!backendId && submission?.id) {
        if (submission.id.startsWith('backend_')) {
          backendId = parseInt(submission.id.replace('backend_', ''));
        } else if (submission.id.startsWith('restored_')) {
          backendId = parseInt(submission.id.replace('restored_', ''));
        }
      }
      await deleteSyncedSubmission(deleteTarget.id, backendId);
    } else {
      await deletePendingSubmission(deleteTarget.id);
    }
    
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Validate all mandatory fields
    const missingFields = [];
    
    // Contact information
    if (!formData.customerName) missingFields.push('Full Name');
    if (!formData.address) missingFields.push('Address');
    if (!formData.postalCode) missingFields.push('Postcode');
    if (!formData.phone) missingFields.push('Phone Number');
    if (!formData.email) missingFields.push('Email Address');
    if (!formData.preferredContactTime) missingFields.push('Preferred Contact Time');
    
    // Property information
    if (!formData.ownsProperty) missingFields.push('Property Ownership');
    if (!formData.propertyType) missingFields.push('Property Type');
    if (!formData.numberOfBedrooms) missingFields.push('Number of Bedrooms');
    if (!formData.roofType) missingFields.push('Roof Type');
    if (!formData.roofMaterial) missingFields.push('Roof Material');
    if (!formData.roofCondition) missingFields.push('Roof Condition');
    if (!formData.roofAge) missingFields.push('Roof Age');
    
    // Energy usage
    if (!formData.averageMonthlyBill) missingFields.push('Average Monthly Bill');
    if (!formData.energyType) missingFields.push('Energy Type');
    if (!formData.currentEnergySupplier) missingFields.push('Current Energy Supplier');
    if (!formData.usesElectricHeating) missingFields.push('High Electric Usage Items');
    
    // Timeframe and interest
    if (!formData.hasReceivedOtherQuotes) missingFields.push('Other Quotes Received');
    if (!formData.isDecisionMaker) missingFields.push('Decision Maker Status');
    if (!formData.movingIn5Years) missingFields.push('Moving Plans');
    
    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setShowError(true);
      setIsSubmitting(false);
      return;
    }
    
    try {
      const submissionData = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      // Check if we're editing
      const isEditing = editingSubmissionId !== null;
      
      if (formData.isOnline) {
        // Submit directly to server
        const result = await submitToServer(submissionData);
        
        // If editing, remove old submission from local storage
        if (isEditing && editingSubmissionId) {
          // Remove from pending if it exists there
          const db = await openDB();
          const transaction = db.transaction(['pendingSubmissions', 'syncedSubmissions'], 'readwrite');
          const pendingStore = transaction.objectStore('pendingSubmissions');
          const syncedStore = transaction.objectStore('syncedSubmissions');
          
          // Try to delete from both stores
          try {
            await new Promise<void>((resolve, reject) => {
              const deleteRequest = pendingStore.delete(editingSubmissionId);
              deleteRequest.onsuccess = () => resolve();
              deleteRequest.onerror = () => {
                // Try synced store
                const syncedDeleteRequest = syncedStore.delete(editingSubmissionId);
                syncedDeleteRequest.onsuccess = () => resolve();
                syncedDeleteRequest.onerror = () => reject(syncedDeleteRequest.error);
              };
            });
            
            // Update state
            setPendingSubmissions(prev => prev.filter(s => s.id !== editingSubmissionId));
            setSyncedSubmissions(prev => prev.filter(s => s.id !== editingSubmissionId));
          } catch (error) {
            // Ignore errors if submission not found in storage
          }
        }
        
        // Add/update in synced submissions
        if (result && result.id) {
          // Convert server response (snake_case) to form data format (camelCase)
          const syncedSubmission: FieldFormData = {
            id: `backend_${result.id}`,
            backendId: result.id,
            canvasserName: result.field_agent_name || submissionData.canvasserName,
            date: result.assessment_date || submissionData.date,
            time: result.assessment_time || submissionData.time,
            customerName: result.customer_name || submissionData.customerName,
            address: result.address || submissionData.address,
            postalCode: result.postal_code || submissionData.postalCode,
            phone: result.phone || submissionData.phone,
            email: result.email || submissionData.email,
            preferredContactTime: result.preferred_contact_time || submissionData.preferredContactTime,
            ownsProperty: result.owns_property || submissionData.ownsProperty,
            propertyType: result.property_type || submissionData.propertyType,
            numberOfBedrooms: result.number_of_bedrooms || submissionData.numberOfBedrooms,
            roofType: result.roof_type || submissionData.roofType,
            roofMaterial: result.roof_material || submissionData.roofMaterial,
            roofCondition: result.roof_condition || submissionData.roofCondition,
            roofAge: result.roof_age || submissionData.roofAge,
            averageMonthlyBill: result.average_monthly_bill || submissionData.averageMonthlyBill,
            energyType: result.energy_type || submissionData.energyType,
            currentEnergySupplier: result.current_energy_supplier || submissionData.currentEnergySupplier,
            usesElectricHeating: result.uses_electric_heating || submissionData.usesElectricHeating,
            electricHeatingDetails: result.electric_heating_details || submissionData.electricHeatingDetails,
            hasReceivedOtherQuotes: result.has_received_other_quotes || submissionData.hasReceivedOtherQuotes,
            isDecisionMaker: result.is_decision_maker || submissionData.isDecisionMaker,
            movingIn5Years: result.moving_in_5_years || submissionData.movingIn5Years,
            photos: result.photos || submissionData.photos,
            notes: result.notes || submissionData.notes,
            timestamp: result.created_at || result.timestamp || submissionData.timestamp,
            isOnline: navigator.onLine,
            synced: true
          };
          
          const db = await openDB();
          const transaction = db.transaction(['syncedSubmissions'], 'readwrite');
          const store = transaction.objectStore('syncedSubmissions');
          
          // Always use put to update (or create if doesn't exist)
          const updateKey = `backend_${result.id}`;
          const oldUpdateKey = `restored_${result.id}`; // For backward compatibility
          await new Promise<void>((resolve, reject) => {
            const request = store.put(syncedSubmission);
            request.onsuccess = () => {
              // Update state - remove old entry if editing, then add updated one
              setSyncedSubmissions(prev => {
                const filtered = prev.filter(s => 
                  s.id !== editingSubmissionId && 
                  s.id !== updateKey && 
                  s.id !== oldUpdateKey &&
                  s.backendId !== result.id
                );
                return [...filtered, syncedSubmission];
              });
              
              // Only increment count if this is a new submission (not an edit)
              if (!isEditing) {
                setActualSyncedCount(prev => prev + 1);
              }
              resolve();
            };
            request.onerror = () => reject(request.error);
          });
          
          // Reload submissions to ensure we have the latest data
          await loadPendingSubmissions();
        }
        
        setSuccessMessage(isEditing ? 'Form updated successfully!' : 'Form submitted to qualifier successfully!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        // If editing offline, update existing submission; otherwise create new
        if (isEditing && editingSubmissionId) {
          // Update existing pending submission
          const db = await openDB();
          const transaction = db.transaction(['pendingSubmissions'], 'readwrite');
          const store = transaction.objectStore('pendingSubmissions');
          
          await new Promise<void>((resolve, reject) => {
            const request = store.put({ ...submissionData, id: editingSubmissionId });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          
          setPendingSubmissions(prev => prev.map(s => 
            s.id === editingSubmissionId ? { ...submissionData, id: editingSubmissionId } : s
          ));
          
          setSuccessMessage('Form updated offline successfully!');
        } else {
          // Save to offline storage as new
        await saveToOfflineStorage(submissionData);
        setSuccessMessage('Form saved offline successfully!');
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
      
      // Reset form (keep canvasser info, update timestamp)
      const now = new Date();
      setFormData({
        // Auto-generated
        canvasserName: canvasserName,
        date: now.toLocaleDateString('en-GB'),
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        
        // Contact Information
        customerName: '',
        address: '',
        postalCode: '',
        phone: '',
        email: '',
        preferredContactTime: '',
        
        // Property Information
        ownsProperty: '',
        propertyType: '',
        numberOfBedrooms: '',
        roofType: '',
        roofMaterial: '',
        roofCondition: '',
        roofAge: '',
        
        // Energy Usage
        averageMonthlyBill: '',
        energyType: '',
        currentEnergySupplier: '',
        usesElectricHeating: '',
        electricHeatingDetails: '',
        
        // Timeframe and Interest
        hasReceivedOtherQuotes: '',
        isDecisionMaker: '',
        movingIn5Years: '',
        
        // Photos
        photos: {
          frontRoof: '',
          rearRoof: '',
          sideRoof: '',
          energyBill: '',
          additional: []
        },
        
        // Optional
        notes: '',
        
        // System
        timestamp: now.toISOString(),
        isOnline: navigator.onLine,
        synced: false
      });
      
      // Reset editing state
      setEditingSubmissionId(null);
      
      // Reset steps
      setCurrentStep('contact');
      setCompletedSteps(new Set());
      
    } catch (error) {
      
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit form. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveOffline = async () => {
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        timestamp: new Date().toISOString()
      };
      
      const isEditing = editingSubmissionId !== null;
      
      if (isEditing && editingSubmissionId) {
        // Update existing pending submission
        const db = await openDB();
        const transaction = db.transaction(['pendingSubmissions'], 'readwrite');
        const store = transaction.objectStore('pendingSubmissions');
        
        await new Promise<void>((resolve, reject) => {
          const request = store.put({ ...submissionData, id: editingSubmissionId });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        setPendingSubmissions(prev => prev.map(s => 
          s.id === editingSubmissionId ? { ...submissionData, id: editingSubmissionId } : s
        ));
        
        setSuccessMessage('Form updated offline successfully!');
      } else {
      await saveToOfflineStorage(submissionData);
      setSuccessMessage('Form saved offline successfully!');
      }
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Reset form
      const now = new Date();
      setFormData({
        // Auto-generated
        canvasserName: canvasserName,
        date: now.toLocaleDateString('en-GB'),
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        
        // Contact Information
        customerName: '',
        address: '',
        postalCode: '',
        phone: '',
        email: '',
        preferredContactTime: '',
        
        // Property Information
        ownsProperty: '',
        propertyType: '',
        numberOfBedrooms: '',
        roofType: '',
        roofMaterial: '',
        roofCondition: '',
        roofAge: '',
        
        // Energy Usage
        averageMonthlyBill: '',
        energyType: '',
        currentEnergySupplier: '',
        usesElectricHeating: '',
        electricHeatingDetails: '',
        
        // Timeframe and Interest
        hasReceivedOtherQuotes: '',
        isDecisionMaker: '',
        movingIn5Years: '',
        
        // Photos
        photos: {
          frontRoof: '',
          rearRoof: '',
          sideRoof: '',
          energyBill: '',
          additional: []
        },
        
        // Optional
        notes: '',
        
        // System
        timestamp: now.toISOString(),
        isOnline: navigator.onLine,
        synced: false
      });
      
      // Reset editing state
      setEditingSubmissionId(null);
      
      // Reset steps
      setCurrentStep('contact');
      setCompletedSteps(new Set());
      
    } catch (error) {
      
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save offline. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitToServer = async (data: FieldFormData, submissionIdToCheck?: string) => {
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://crm.margav.energy/api' 
      : 'http://localhost:8000/api';
    
    // Get token from localStorage (stored as 'authToken' by AuthContext)
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication token not found. Please refresh the page and try again.');
    }
    
    // Convert camelCase to snake_case for Django backend and apply UK formatting
    const backendData = {
      canvasser_name: formatName(data.canvasserName),
      assessment_date: data.date,
      assessment_time: data.time,
      customer_name: formatName(data.customerName),
      phone: data.phone,
      email: data.email,
      address: formatAddress(data.address),
      postal_code: formatUKPostcode(data.postalCode),
      preferred_contact_time: data.preferredContactTime,
      owns_property: data.ownsProperty,
      property_type: data.propertyType,
      number_of_bedrooms: data.numberOfBedrooms,
      roof_type: data.roofType,
      roof_material: data.roofMaterial,
      roof_condition: data.roofCondition,
      roof_age: data.roofAge,
      average_monthly_bill: data.averageMonthlyBill,
      energy_type: data.energyType,
      current_energy_supplier: data.currentEnergySupplier,
      uses_electric_heating: data.usesElectricHeating,
      electric_heating_details: data.electricHeatingDetails,
      has_received_other_quotes: data.hasReceivedOtherQuotes,
      is_decision_maker: data.isDecisionMaker,
      moving_in_5_years: data.movingIn5Years,
      notes: data.notes,
      photos: data.photos,
      timestamp: data.timestamp
    };
    
    // Check if we're editing an existing submission
    // Priority: 1) submissionIdToCheck parameter, 2) editingSubmissionId state, 3) data.backendId, 4) data.id
    const isEditing = editingSubmissionId !== null || !!submissionIdToCheck || !!data.backendId;
    let submissionId: number | undefined;
    
    // First, try to get ID from submissionIdToCheck parameter (for sync operations)
    if (submissionIdToCheck) {
      if (submissionIdToCheck.startsWith('backend_')) {
        submissionId = parseInt(submissionIdToCheck.replace('backend_', ''));
      } else if (submissionIdToCheck.startsWith('restored_')) {
        submissionId = parseInt(submissionIdToCheck.replace('restored_', ''));
      }
    }
    
    // If not found, try data.backendId (preferred method)
    if (!submissionId && data.backendId) {
      submissionId = data.backendId;
    }
    
    // If still not found, check editingSubmissionId state
    if (!submissionId && isEditing && editingSubmissionId) {
      // Try to find the submission first to get backendId directly
      const editingSubmission = pendingSubmissions.find(s => s.id === editingSubmissionId) ||
                               syncedSubmissions.find(s => s.id === editingSubmissionId);
      
      // First check if the submission has a backendId field (preferred method)
      if (editingSubmission?.backendId) {
        submissionId = editingSubmission.backendId;
      } else if (editingSubmissionId.startsWith('backend_')) {
        // New format: backend_123
        const extractedId = parseInt(editingSubmissionId.replace('backend_', ''));
        if (!isNaN(extractedId)) {
          submissionId = extractedId;
        }
      } else if (editingSubmissionId.startsWith('restored_')) {
        // Old format: restored_123 (for backward compatibility)
        const extractedId = parseInt(editingSubmissionId.replace('restored_', ''));
        if (!isNaN(extractedId)) {
          submissionId = extractedId;
        }
      } else if (editingSubmission?.id) {
        // Fallback: check submission's ID field
        if (editingSubmission.id.startsWith('backend_')) {
          const extractedId = parseInt(editingSubmission.id.replace('backend_', ''));
          if (!isNaN(extractedId)) {
            submissionId = extractedId;
          }
        } else if (editingSubmission.id.startsWith('restored_')) {
          const extractedId = parseInt(editingSubmission.id.replace('restored_', ''));
          if (!isNaN(extractedId)) {
            submissionId = extractedId;
          }
        }
      }
    }
    
    // Final fallback: check data.id directly
    if (!submissionId && data.id) {
      if (data.id.startsWith('backend_')) {
        submissionId = parseInt(data.id.replace('backend_', ''));
      } else if (data.id.startsWith('restored_')) {
        submissionId = parseInt(data.id.replace('restored_', ''));
      }
    }
    
    const url = isEditing && submissionId
      ? `${API_BASE_URL}/field-submissions/${submissionId}/`
      : `${API_BASE_URL}/field-submissions/`;
    
    const method = isEditing && submissionId ? 'PATCH' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify(backendData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Format validation errors
      if (errorData && typeof errorData === 'object') {
        const errors = Object.entries(errorData).map(([field, messages]) => {
          const msgArray = Array.isArray(messages) ? messages : [messages];
          return `${field}: ${msgArray.join(', ')}`;
        }).join('\n');
        throw new Error(errors || `Server error: ${response.status}`);
      }
      
      throw new Error(errorData.detail || errorData.error || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // If updating, ensure the result has the same ID
    if (isEditing && submissionId && !result.id) {
      // If backend doesn't return ID, use the one we sent
      result.id = submissionId;
    }
    
    return result;
  };

  const syncSingleSubmission = async (submission: FieldFormData) => {
    if (!formData.isOnline) {
      setErrorMessage('Cannot sync while offline. Please check your internet connection.');
      setShowError(true);
      return;
    }

    if (!submission.id) {
      setErrorMessage('Submission ID not found.');
      setShowError(true);
      return;
    }

    // Only set syncingSubmissionId if not already syncing all
    if (syncingSubmissionId !== 'all') {
      setSyncingSubmissionId(submission.id);
    }

    try {
      // Submit to server - it will check for backendId to determine if it's an update or create
      const result = await submitToServer(submission, submission.id);
      
      if (!result || !result.id) {
        throw new Error('Server did not return a valid submission ID');
      }
        
        // Move to synced submissions
        await new Promise<void>((resolve, reject) => {
          openDB().then(db => {
            const transaction = db.transaction(['syncedSubmissions', 'pendingSubmissions'], 'readwrite');
            const syncedStore = transaction.objectStore('syncedSubmissions');
            const pendingStore = transaction.objectStore('pendingSubmissions');
            
          // Create synced submission with backend ID
          const syncedSubmission: FieldFormData = {
            ...submission,
            id: `backend_${result.id}`,
            backendId: result.id,
            synced: true
          };

              // Add to synced submissions
          const addRequest = syncedStore.add(syncedSubmission);
              
              addRequest.onsuccess = () => {
                // Remove from pending submissions
                const deleteRequest = pendingStore.delete(submission.id!);
                
                deleteRequest.onsuccess = () => {
                  // Update React state
                  setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
              setSyncedSubmissions(prev => [...prev, syncedSubmission]);
              setActualSyncedCount(prev => prev + 1);
              
              setSuccessMessage(`Submission for ${submission.customerName} synced successfully!`);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
                  
                  resolve();
                };
                
                deleteRequest.onerror = () => {
                  reject(deleteRequest.error);
                };
              };
              
          addRequest.onerror = (event) => {
            // If it's a duplicate key error, try to update instead
            const error = (event.target as IDBRequest).error;
            if (error && error.name === 'ConstraintError') {
              // Update existing record
              const updateRequest = syncedStore.put(syncedSubmission);
              updateRequest.onsuccess = () => {
                const deleteRequest = pendingStore.delete(submission.id!);
                deleteRequest.onsuccess = () => {
                  setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
                  setSyncedSubmissions(prev => {
                    const filtered = prev.filter(s => s.id !== syncedSubmission.id);
                    return [...filtered, syncedSubmission];
                  });
                  setSuccessMessage(`Submission for ${submission.customerName} synced successfully!`);
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                  resolve();
                };
                deleteRequest.onerror = () => reject(deleteRequest.error);
              };
              updateRequest.onerror = () => reject(updateRequest.error);
            } else {
              reject(error);
            }
          };
          }).catch(error => {
            reject(error);
          });
        });

      } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync submission. Please try again.';
      // Only show error if not syncing all (errors will be handled in syncAllSubmissions)
      if (syncingSubmissionId !== 'all') {
        setErrorMessage(`Failed to sync: ${errorMessage}`);
        setShowError(true);
      }
      throw error; // Re-throw so syncAllSubmissions can catch it
    } finally {
      // Only clear syncingSubmissionId if not syncing all
      if (syncingSubmissionId !== 'all') {
        setSyncingSubmissionId(null);
      }
    }
  };

  const syncPendingSubmissions = async () => {
    const submissionsToSync = [...pendingSubmissions]; // Create a copy to avoid state issues
    
    for (const submission of submissionsToSync) {
      try {
        await syncSingleSubmission(submission);
      } catch (error) {
        // Continue with other submissions even if one fails
        console.error('Error syncing submission:', error);
      }
    }
  };

  const manualSync = async () => {
    if (pendingSubmissions.length === 0) {
      setErrorMessage('No pending submissions to sync');
      setShowError(true);
      return;
    }

    try {
      await syncPendingSubmissions();
      setSuccessMessage('All pending submissions synced successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setErrorMessage('Failed to sync submissions. Please try again.');
      setShowError(true);
    }
  };

  const syncAllSubmissions = async () => {
    if (!formData.isOnline) {
      setErrorMessage('Cannot sync while offline. Please check your internet connection.');
      setShowError(true);
      return;
    }

    const allSubmissions = [...pendingSubmissions, ...syncedSubmissions];
    
    if (allSubmissions.length === 0) {
      setErrorMessage('No submissions to sync');
      setShowError(true);
      return;
    }

    try {
      setSyncingSubmissionId('all'); // Use special ID to indicate bulk sync
      let successCount = 0;
      let failCount = 0;

      // Sync all submissions (both pending and already synced)
      for (const submission of allSubmissions) {
        try {
          await syncSingleSubmission(submission);
          successCount++;
          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failCount++;
          console.error('Error syncing submission:', error);
        }
      }

      setSyncingSubmissionId(null);

      // Reload submissions to get updated state
      await loadPendingSubmissions();

      if (failCount === 0) {
        setSuccessMessage(`✅ All ${successCount} submissions synced successfully and sent to qualifier!`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setSuccessMessage(`✅ ${successCount} submissions synced successfully. ${failCount} failed.`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
        setErrorMessage(`${failCount} submissions failed to sync. Please try again.`);
        setShowError(true);
      }
    } catch (error) {
      setSyncingSubmissionId(null);
      setErrorMessage('Failed to sync all submissions. Please try again.');
      setShowError(true);
    }
  };

  const steps: { key: FormStep; title: string; description: string }[] = [
    { key: 'contact', title: 'Contact Info', description: 'Customer contact details' },
    { key: 'property', title: 'Property Info', description: 'Property assessment' },
    { key: 'energy', title: 'Energy Usage', description: 'Energy consumption' },
    { key: 'photos', title: 'Photos', description: 'Property photos' },
    { key: 'interest', title: 'Timeframe & Interest', description: 'Decision-making info' },
    { key: 'review', title: 'Review', description: 'Final review' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
            
            {/* Canvasser Info - Auto-generated */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Canvasser Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Canvasser:</span>
                  <p className="font-medium break-words">{formData.canvasserName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <p className="font-medium">{formData.date}</p>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <p className="font-medium">{formData.time}</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: formatName(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData(prev => ({ ...prev, phone: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Numbers only"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: formatAddress(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full property address"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: formatUKPostcode(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SW1A 1AA"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="preferredContactTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Contact Time <span className="text-red-500">*</span>
                </label>
                <select
                  id="preferredContactTime"
                  name="preferredContactTime"
                  required
                  value={formData.preferredContactTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredContactTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select preferred time</option>
                  <option value="morning">Morning (9am-12pm)</option>
                  <option value="afternoon">Afternoon (12pm-5pm)</option>
                  <option value="evening">Evening (5pm-8pm)</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'property':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ownsProperty" className="block text-sm font-medium text-gray-700 mb-1">
                  Do you own the property? <span className="text-red-500">*</span>
                </label>
                <select
                  id="ownsProperty"
                  name="ownsProperty"
                  required
                  value={formData.ownsProperty}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownsProperty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="propertyType"
                  name="propertyType"
                  required
                  value={formData.propertyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Property Type</option>
                  <option value="detached">Detached House</option>
                  <option value="semi-detached">Semi-Detached House</option>
                  <option value="terraced">Terraced House</option>
                  <option value="flat">Flat/Apartment</option>
                  <option value="bungalow">Bungalow</option>
                </select>
              </div>
              <div>
                <label htmlFor="numberOfBedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Bedrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="numberOfBedrooms"
                  name="numberOfBedrooms"
                  required
                  value={formData.numberOfBedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfBedrooms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select bedrooms</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
              </div>
              <div>
                <label htmlFor="roofType" className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="roofType"
                  name="roofType"
                  required
                  value={formData.roofType}
                  onChange={(e) => setFormData(prev => ({ ...prev, roofType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Roof Type</option>
                  <option value="pitched">Pitched</option>
                  <option value="flat">Flat</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label htmlFor="roofMaterial" className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Material <span className="text-red-500">*</span>
                </label>
                <select
                  id="roofMaterial"
                  name="roofMaterial"
                  required
                  value={formData.roofMaterial}
                  onChange={(e) => setFormData(prev => ({ ...prev, roofMaterial: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Material</option>
                  <option value="tiled">Tiled</option>
                  <option value="slate">Slate</option>
                  <option value="metal">Metal</option>
                  <option value="rosemary">Rosemary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="roofCondition" className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Condition <span className="text-red-500">*</span>
                </label>
                <select
                  id="roofCondition"
                  name="roofCondition"
                  required
                  value={formData.roofCondition}
                  onChange={(e) => setFormData(prev => ({ ...prev, roofCondition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Condition</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label htmlFor="roofAge" className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Age <span className="text-red-500">*</span>
                </label>
                <select
                  id="roofAge"
                  name="roofAge"
                  required
                  value={formData.roofAge}
                  onChange={(e) => setFormData(prev => ({ ...prev, roofAge: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Age</option>
                  <option value="0-5">0-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="11-20">11-20 years</option>
                  <option value="21-30">21-30 years</option>
                  <option value="30+">30+ years</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Energy Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currentEnergySupplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Energy Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  id="currentEnergySupplier"
                  name="currentEnergySupplier"
                  required
                  value={formData.currentEnergySupplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentEnergySupplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supplier</option>
                  <option value="British Gas">British Gas</option>
                  <option value="EDF Energy">EDF Energy</option>
                  <option value="E.ON">E.ON</option>
                  <option value="Octopus Energy">Octopus Energy</option>
                  <option value="OVO Energy">OVO Energy</option>
                  <option value="Scottish Power">Scottish Power</option>
                  <option value="SSE">SSE</option>
                  <option value="Bulb Energy">Bulb Energy</option>
                  <option value="Shell Energy">Shell Energy</option>
                  <option value="Utility Warehouse">Utility Warehouse</option>
                  <option value="Npower">Npower</option>
                  <option value="Together Energy">Together Energy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="averageMonthlyBill" className="block text-sm font-medium text-gray-700 mb-1">
                  Average Monthly Bill (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="averageMonthlyBill"
                  name="averageMonthlyBill"
                  required
                  value={formData.averageMonthlyBill}
                  onChange={(e) => setFormData(prev => ({ ...prev, averageMonthlyBill: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label htmlFor="energyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="energyType"
                  name="energyType"
                  required
                  value={formData.energyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, energyType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select energy type</option>
                  <option value="gas">Gas Only</option>
                  <option value="electric">Electric Only</option>
                  <option value="dual">Dual (Gas & Electric)</option>
                </select>
              </div>
              <div>
                <label htmlFor="usesElectricHeating" className="block text-sm font-medium text-gray-700 mb-1">
                  Do you have high electric usage items? <span className="text-red-500">*</span>
                </label>
                <select
                  id="usesElectricHeating"
                  name="usesElectricHeating"
                  required
                  value={formData.usesElectricHeating}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    usesElectricHeating: e.target.value,
                    electricHeatingDetails: e.target.value === 'no' ? '' : prev.electricHeatingDetails
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {formData.usesElectricHeating === 'yes' && (
                <>
                  <div>
                  <label htmlFor="electricHeatingDetails" className="block text-sm font-medium text-gray-700 mb-1">
                      Please select your high electric usage items <span className="text-red-500">*</span>
                  </label>
                    <select
                    id="electricHeatingDetails"
                    name="electricHeatingDetails"
                      required={formData.usesElectricHeating === 'yes'}
                    value={formData.electricHeatingDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, electricHeatingDetails: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select item</option>
                      <option value="EV Charger">EV Charger</option>
                      <option value="Hot Tub">Hot Tub</option>
                      <option value="Electric Storage Heater">Electric Storage Heater</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.electricHeatingDetails === 'Other' && (
                    <div>
                      <label htmlFor="electricHeatingOtherDetails" className="block text-sm font-medium text-gray-700 mb-1">
                        Please specify <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="electricHeatingOtherDetails"
                        name="electricHeatingOtherDetails"
                        required={formData.electricHeatingDetails === 'Other'}
                        value={formData.electricHeatingDetails}
                        onChange={(e) => setFormData(prev => ({ ...prev, electricHeatingDetails: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Please specify"
                  />
                </div>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Required Photos <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-red-600 mb-4">
              All four photos must be captured before proceeding.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Roof Photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <h3 className="font-semibold mb-2">Front Roof Photo <span className="text-red-500">*</span></h3>
                {formData.photos.frontRoof ? (
                  <div className="relative">
                    <img
                      src={formData.photos.frontRoof}
                      alt="Front Roof"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto('frontRoof')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => capturePhoto('frontRoof')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  📷 Take Front Roof Photo
                </button>
              </div>

              {/* Rear Roof Photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <h3 className="font-semibold mb-2">Rear Roof Photo <span className="text-red-500">*</span></h3>
                {formData.photos.rearRoof ? (
                  <div className="relative">
                    <img
                      src={formData.photos.rearRoof}
                      alt="Rear Roof"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto('rearRoof')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => capturePhoto('rearRoof')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  📷 Take Rear Roof Photo
                </button>
              </div>

              {/* Side Roof Photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <h3 className="font-semibold mb-2">Side Roof Photo <span className="text-red-500">*</span></h3>
                {formData.photos.sideRoof ? (
                  <div className="relative">
                    <img
                      src={formData.photos.sideRoof}
                      alt="Side Roof"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto('sideRoof')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => capturePhoto('sideRoof')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  📷 Take Side Roof Photo
                </button>
              </div>

              {/* Energy Bill Photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <h3 className="font-semibold mb-2">Energy Bill Photo <span className="text-red-500">*</span></h3>
                <p className="text-sm text-gray-600 mb-2">Show PPKw and annual usage</p>
                {formData.photos.energyBill ? (
                  <div className="relative">
                    <img
                      src={formData.photos.energyBill}
                      alt="Energy bill"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto('energyBill')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => capturePhoto('energyBill')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  📷 Take Energy Bill Photo
                </button>
              </div>
            </div>

            {/* Additional Photos Section */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Photos (Optional)</h3>
                {formData.photos.additional.length < 5 && (
                  <button
                    type="button"
                    onClick={addAdditionalPhotoSlot}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                  >
                    + Add Photo ({formData.photos.additional.length}/5)
                  </button>
                )}
              </div>
              
              {formData.photos.additional.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.photos.additional.map((photo, index) => (
                    <div key={index} className="border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
                      <h3 className="font-semibold mb-2 text-sm text-gray-600">Additional Photo {index + 1}</h3>
                      {photo ? (
                        <div className="relative">
                          <img
                            src={photo}
                            alt={`Additional ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto('additional', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-gray-400">No photo</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => capturePhoto('additional', index)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                      >
                        📷 Take Photo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'interest':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Timeframe and Interest</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hasReceivedOtherQuotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Have you received other quotes? <span className="text-red-500">*</span>
                </label>
                <select
                  id="hasReceivedOtherQuotes"
                  name="hasReceivedOtherQuotes"
                  required
                  value={formData.hasReceivedOtherQuotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, hasReceivedOtherQuotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label htmlFor="isDecisionMaker" className="block text-sm font-medium text-gray-700 mb-1">
                  Are you the decision maker? <span className="text-red-500">*</span>
                </label>
                <select
                  id="isDecisionMaker"
                  name="isDecisionMaker"
                  required
                  value={formData.isDecisionMaker}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDecisionMaker: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="movingIn5Years" className="block text-sm font-medium text-gray-700 mb-1">
                  Are you planning to move in the next 5 years? <span className="text-red-500">*</span>
                </label>
                <select
                  id="movingIn5Years"
                  name="movingIn5Years"
                  required
                  value={formData.movingIn5Years}
                  onChange={(e) => setFormData(prev => ({ ...prev, movingIn5Years: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
            
            {/* Canvasser Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-900">Canvasser Information</h3>
              <p><strong>Name:</strong> {formData.canvasserName}</p>
              <p><strong>Date:</strong> {formData.date}</p>
              <p><strong>Time:</strong> {formData.time}</p>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p><strong>Name:</strong> {formData.customerName}</p>
              <p><strong>Phone:</strong> {formData.phone}</p>
              <p><strong>Address:</strong> {formData.address}</p>
              <p><strong>Postcode:</strong> {formData.postalCode}</p>
              {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
              <p><strong>Preferred Contact Time:</strong> {formData.preferredContactTime}</p>
            </div>
            
            {/* Property Details */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Property Information</h3>
              <p><strong>Owns Property:</strong> {formData.ownsProperty}</p>
              <p><strong>Property Type:</strong> {formData.propertyType}</p>
              <p><strong>Number of Bedrooms:</strong> {formData.numberOfBedrooms}</p>
              <p><strong>Roof Type:</strong> {formData.roofType}</p>
              <p><strong>Roof Material:</strong> {formData.roofMaterial}</p>
              <p><strong>Roof Condition:</strong> {formData.roofCondition}</p>
              <p><strong>Roof Age:</strong> {formData.roofAge}</p>
            </div>

            {/* Energy Usage */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Energy Usage</h3>
              <p><strong>Current Energy Supplier:</strong> {formData.currentEnergySupplier}</p>
              <p><strong>Average Monthly Bill:</strong> £{formData.averageMonthlyBill}</p>
              <p><strong>Energy Type:</strong> {formData.energyType}</p>
              <p><strong>High Electric Usage Items:</strong> {formData.usesElectricHeating}</p>
              {formData.electricHeatingDetails && (
                <p><strong>Electric Heating Details:</strong> {formData.electricHeatingDetails}</p>
              )}
            </div>

            {/* Timeframe and Interest */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Timeframe & Interest</h3>
              <p><strong>Has Received Other Quotes:</strong> {formData.hasReceivedOtherQuotes}</p>
              <p><strong>Is Decision Maker:</strong> {formData.isDecisionMaker}</p>
              <p><strong>Moving in 5 Years:</strong> {formData.movingIn5Years}</p>
            </div>
            
            {/* Photos */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Photos</h3>
              <p><strong>Front Roof Photo:</strong> {formData.photos.frontRoof ? '✅ Captured' : '❌ Missing'}</p>
              <p><strong>Rear Roof Photo:</strong> {formData.photos.rearRoof ? '✅ Captured' : '❌ Missing'}</p>
              <p><strong>Side Roof Photo:</strong> {formData.photos.sideRoof ? '✅ Captured' : '❌ Missing'}</p>
              <p><strong>Energy Bill Photo:</strong> {formData.photos.energyBill ? '✅ Captured' : '❌ Missing'}</p>
              {formData.photos.additional && formData.photos.additional.length > 0 && (
                <p><strong>Additional Photos:</strong> {formData.photos.additional.filter(p => p).length} captured</p>
              )}
            </div>

            {/* Optional Notes */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-2 text-yellow-900">Additional Notes (Optional)</h3>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional observations, concerns, or special requirements..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-4 text-blue-900">
                {editingSubmissionId ? 'Update Lead Sheet' : 'Submit Lead Sheet'}
              </h3>
              {editingSubmissionId && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ You are editing an existing submission. Changes will update the original.
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Always show Submit to Qualifier button when online */}
                {formData.isOnline && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>{editingSubmissionId ? 'Updating...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{editingSubmissionId ? '🔄' : '📤'}</span>
                        <span>{editingSubmissionId ? 'Update Submission' : 'Submit to Qualifier'}</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* Always show Save Offline button */}
                <button
                  onClick={handleSaveOffline}
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>{editingSubmissionId ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{editingSubmissionId ? '🔄' : '💾'}</span>
                      <span>{editingSubmissionId ? 'Update Offline' : 'Save Offline'}</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setCurrentStep('interest')}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>←</span>
                  <span>Back</span>
                </button>
              </div>
              
              {!formData.isOnline && (
                <p className="text-sm text-orange-700 mt-3 text-center">
                  📱 You're offline. This will be saved locally and synced when you're back online.
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto w-full overflow-x-hidden">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Canvas Team Lead Sheet</h1>
              <p className="text-sm sm:text-lg text-gray-600 mt-1">
                Welcome, <span className="font-semibold text-[#3333cc]">{user?.first_name || user?.username || 'Canvasser'}</span>! 
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className={`flex items-center space-x-2 ${formData.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-base sm:text-lg">{formData.isOnline ? '📶' : '❌'}</span>
                <span className="text-xs sm:text-sm font-medium">
                  {formData.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center space-x-1 sm:space-x-2 text-orange-600">
                  <span className="text-base sm:text-lg">📤</span>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{pendingSubmissions.length} pending</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 text-green-600">
                  <button
                    onClick={() => setShowSyncedSubmissions(!showSyncedSubmissions)}
                    className="relative flex items-center space-x-1 sm:space-x-2 hover:text-green-700 transition-colors"
                  >
                    <span className="text-base sm:text-lg">🔔</span>
                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{actualSyncedCount} synced</span>
                    {actualSyncedCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                </div>
                {actualSyncedCount > 0 && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap hidden sm:block">
                    Great work! 🎉
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Offline Submissions Section */}
        {(pendingSubmissions.length > 0 || (showSyncedSubmissions && actualSyncedCount > 0)) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📋 Your Submissions</h2>
              {formData.isOnline && (pendingSubmissions.length > 0 || actualSyncedCount > 0) && (
                <button
                  onClick={syncAllSubmissions}
                  disabled={syncingSubmissionId === 'all' || editingSubmissionId !== null}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
                >
                  {syncingSubmissionId === 'all' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Syncing All Submissions...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🔄</span>
                      <span>Sync All to Qualifier ({pendingSubmissions.length + actualSyncedCount})</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Pending Submissions */}
            {pendingSubmissions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-orange-600 mb-2 flex items-center">
                  <span className="mr-2">📤</span>
                  Pending Sync ({pendingSubmissions.length})
                </h3>
                <div className="space-y-2">
                  {pendingSubmissions.map((submission, index) => (
                    <div key={submission.id || index} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{submission.customerName}</p>
                          <p className="text-sm text-gray-600">{submission.address}, {submission.postalCode}</p>
                          <p className="text-sm text-gray-500">Saved: {new Date(submission.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-sm text-orange-600">⏳ Waiting to sync</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadSubmissionForEdit(submission)}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              disabled={editingSubmissionId !== null}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(submission, false)}
                              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              🗑️ Delete
                            </button>
                          <button
                            onClick={async () => {
                                await syncSingleSubmission(submission);
                              }}
                              disabled={!formData.isOnline || syncingSubmissionId === submission.id || editingSubmissionId !== null}
                              className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {syncingSubmissionId === submission.id ? '⏳ Syncing...' : (formData.isOnline ? 'Sync' : 'Offline')}
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Synced Submissions */}
              {showSyncedSubmissions && actualSyncedCount > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-green-600 flex items-center">
                    <span className="mr-2">✅</span>
                    Sent to Qualifier ({actualSyncedCount})
                  </h3>
                </div>
                <div className="space-y-2">
                  {syncedSubmissions.slice(0, 5).map((submission, index) => (
                    <div key={submission.id || index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{submission.customerName}</p>
                          <p className="text-sm text-gray-600">{submission.address}, {submission.postalCode}</p>
                          <p className="text-sm text-gray-500">Sent: {new Date(submission.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-sm text-green-600">✅ Synced</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadSubmissionForEdit(submission)}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                              disabled={editingSubmissionId !== null}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(submission, true)}
                              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {actualSyncedCount > 5 && syncedSubmissions.length > 0 && (
                    <p className="text-sm text-gray-500 text-center">... and {actualSyncedCount - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success/Error Messages */}
        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <span className="mr-2 text-lg">✅</span>
            {successMessage || 'Form submitted successfully!'}
          </div>
        )}
        
        {showError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <span className="mr-2 text-lg">⚠️</span>
            {errorMessage}
          </div>
        )}

        {/* Step Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
            <div className="text-sm text-gray-600">
              Step {steps.findIndex(s => s.key === currentStep) + 1} of {steps.length}
            </div>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(step.key);
              const isCurrent = currentStep === step.key;
              const canAccess = canProceedToStep(step.key);
              
              return (
                <button
                  key={step.key}
                  onClick={() => canAccess && setCurrentStep(step.key)}
                  disabled={!canAccess}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : canAccess
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg ${isCompleted ? '✅' : isCurrent ? '📍' : '⭕'}`}></span>
                    <div className="text-left">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs opacity-75">{step.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons - Hidden on review step */}
          {currentStep !== 'review' && (
            <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between">
            <button
              type="button"
              onClick={() => {
                const stepOrder: FormStep[] = ['contact', 'property', 'energy', 'photos', 'interest', 'review'];
                const currentIndex = stepOrder.indexOf(currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(stepOrder[currentIndex - 1]);
                }
              }}
              disabled={currentStep === 'contact'}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex space-x-4">
              {pendingSubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={manualSync}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center space-x-2"
                >
                  <span className="text-lg">🔄</span>
                  <span>Sync {pendingSubmissions.length} Pending</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  markStepCompleted(currentStep);
                    const stepOrder: FormStep[] = ['contact', 'property', 'energy', 'photos', 'interest', 'review'];
                  const currentIndex = stepOrder.indexOf(currentStep);
                  if (currentIndex < stepOrder.length - 1) {
                    setCurrentStep(stepOrder[currentIndex + 1]);
                  }
                }}
                disabled={!validateStep(currentStep)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Camera Modal */}
        {isCapturingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Take Photo</h3>
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-200 rounded-lg mb-4"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => setIsCapturingPhoto(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deleteTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Confirm Delete</h3>
              <p className="mb-4 text-gray-700">
                Are you sure you want to delete the submission for <strong>{deleteTarget.customerName}</strong>?
                {deleteTarget.synced && ' This submission has been synced to the server.'}
              </p>
              <p className="mb-6 text-sm text-gray-500">
                This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CanvasserForm;

