import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatUKPostcode, formatName, formatAddress } from '../utils/formatting';
import { fieldSubmissionsAPI } from '../api';

interface FieldFormData {
  id?: string;
  backendId?: number; // Backend database ID for synced submissions
  userId?: number; // User ID to filter submissions by canvasser
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
  
  // Property & Decision Making
  ownsProperty: string; // 'yes' | 'no'
  isDecisionMaker: string; // 'yes' | 'no' | 'partner'
  ageRange: string; // '18-74' | 'outside_range'
  
  // Electric Bill
  electricBill: string; // Electric bill amount
  
  // Interest
  hasReceivedOtherQuotes: string; // 'yes' | 'no'
  
  // Photos - only electric bill now
  photos: {
    energyBill: string;
  };
  
  // Canvasser Notes
  notes: string;
  
  // System fields
  timestamp: string;
  isOnline: boolean;
  synced: boolean;
}

type FormStep = 'contact' | 'interest' | 'electricBill' | 'photos' | 'notes' | 'review';

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
    
    // Property & Decision Making
    ownsProperty: '',
    isDecisionMaker: '',
    ageRange: '',
    
    // Electric Bill
    electricBill: '',
    
    // Interest
    hasReceivedOtherQuotes: '',
    
    // Photos - only electric bill
    photos: {
      energyBill: ''
    },
    
    // Canvasser Notes
    notes: '',
    
    // System
    timestamp: new Date().toISOString(),
    isOnline: navigator.onLine,
    synced: false
  });

  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<'energyBill' | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<FieldFormData[]>([]);
  const [syncedSubmissions, setSyncedSubmissions] = useState<FieldFormData[]>([]);
  const [actualSyncedCount, setActualSyncedCount] = useState<number>(0);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSyncedSubmissions, setShowSyncedSubmissions] = useState(false);
  const [showAllSyncedSubmissions, setShowAllSyncedSubmissions] = useState(false);
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
      case 'interest':
        return !!(
          (formData.ownsProperty === 'yes' || formData.ownsProperty === 'no') &&
          formData.isDecisionMaker &&
          (formData.ageRange === '18-74' || formData.ageRange === 'outside_range') &&
          (formData.hasReceivedOtherQuotes === 'yes' || formData.hasReceivedOtherQuotes === 'no')
        );
      case 'electricBill':
        return !!formData.electricBill;
      case 'photos':
        // Only electric bill photo is required
        return !!formData.photos.energyBill;
      case 'notes':
        // Notes are optional, so always valid
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const canProceedToStep = (step: FormStep): boolean => {
    const stepOrder: FormStep[] = ['contact', 'interest', 'electricBill', 'photos', 'notes', 'review'];
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
        request.onsuccess = () => {
          const data = request.result as FieldFormData[];
          // Filter by current user ID - only check existing submissions for current user
          const userFiltered = user?.id 
            ? data.filter(sub => sub.userId === user.id)
            : [];
          resolve(userFiltered);
        };
          request.onerror = () => reject(request.error);
        });
        
      // Convert backend submissions to FieldFormData format
      // Use backend ID as the key to ensure proper deduplication
      const syncedData = userSubmissions.map((submission: any) => ({
        id: `backend_${submission.id}`, // Use backend ID to identify synced submissions
        backendId: submission.id, // Store original backend ID for updates/deletes
        userId: user?.id || submission.field_agent || submission.field_agent_id, // Store user ID for filtering
        canvasserName: submission.field_agent_name || submission.canvasser_name || user?.first_name || 'Unknown',
        date: submission.assessment_date || (submission.created_at 
          ? new Date(submission.created_at).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB')),
        time: submission.assessment_time || (submission.created_at
          ? new Date(submission.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })),
        customerName: submission.customer_name || 'Unknown',
        address: submission.address || '',
        postalCode: submission.postal_code || '',
        phone: submission.phone || '',
        email: submission.email || '',
        preferredContactTime: submission.preferred_contact_time ?? '',
        ownsProperty: submission.owns_property ?? submission.property_ownership ?? '',
        isDecisionMaker: submission.is_decision_maker ?? '',
        ageRange: submission.age_range ?? '',
        electricBill: submission.electric_bill ?? '',
        hasReceivedOtherQuotes: submission.has_received_other_quotes ?? '',
        photos: submission.photos || { energyBill: '' },
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
      
      
      // Load pending submissions - filter by current user
      const pendingData = await new Promise<FieldFormData[]>((resolve, reject) => {
        const pendingTransaction = db.transaction(['pendingSubmissions'], 'readonly');
        const pendingStore = pendingTransaction.objectStore('pendingSubmissions');
        const pendingRequest = pendingStore.getAll();
        
        pendingRequest.onsuccess = () => {
          const data = pendingRequest.result as FieldFormData[];
          // Filter by current user ID - only show submissions for current user
          // If user is logged in, only show their submissions
          // If no user, show nothing (shouldn't happen, but safety check)
          const userFiltered = user?.id 
            ? data.filter(sub => sub.userId === user.id)
            : [];
          resolve(userFiltered);
        };
        
        pendingRequest.onerror = () => {
          
          reject(pendingRequest.error);
        };
      });
      
      // Always sync with backend to ensure cross-device data persistence
      // This ensures that when a user logs in on a different device, they see all their submissions
      await restoreSyncedSubmissions();
      
      // Reload synced submissions after backend sync to get the updated data - filter by current user
      const updatedSyncedData = await new Promise<FieldFormData[]>((resolve, reject) => {
        const updatedTransaction = db.transaction(['syncedSubmissions'], 'readonly');
        const updatedStore = updatedTransaction.objectStore('syncedSubmissions');
        const updatedRequest = updatedStore.getAll();
        
        updatedRequest.onsuccess = () => {
          const data = updatedRequest.result as FieldFormData[];
          // Filter by current user ID - only show submissions for current user
          // If user is logged in, only show their submissions
          // If no user, show nothing (shouldn't happen, but safety check)
          const userFiltered = user?.id 
            ? data.filter(sub => sub.userId === user.id)
            : [];
          resolve(userFiltered);
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
          userId: user?.id || data.userId, // Store user ID for filtering
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

  const capturePhoto = async (photoType: 'energyBill') => {
    try {
      setCurrentPhotoType(photoType);
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
          setFormData(prev => ({
            ...prev,
            photos: {
              ...prev.photos,
              [currentPhotoType]: photoData
            }
          }));
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

  const removePhoto = (photoType: 'energyBill') => {
    setFormData(prev => ({
      ...prev,
      photos: {
        ...prev.photos,
        [photoType]: ''
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
      // If submission has a backendId, try to fetch fresh data from backend first
      let freshSubmission: FieldFormData | null = null;
      if (submission.backendId && formData.isOnline) {
        try {
          const backendData = await fieldSubmissionsAPI.getFieldSubmission(submission.backendId);
          // Helper function to get value from backend or fallback to local submission
          // Treats empty strings and null/undefined as missing values
          const getValue = (backendValue: any, localValue: any, defaultValue: any = '') => {
            // If backend has a non-empty value, use it
            if (backendValue !== null && backendValue !== undefined && backendValue !== '') {
              return backendValue;
            }
            // Otherwise, use local value if available, or default
            return localValue ?? defaultValue;
          };
          
          // Convert backend response to FieldFormData format
          freshSubmission = {
            id: `backend_${backendData.id}`,
            backendId: backendData.id,
            userId: user?.id || submission.userId,
            canvasserName: backendData.field_agent_name || backendData.canvasser_name || canvasserName,
            date: backendData.assessment_date || (backendData.created_at ? new Date(backendData.created_at).toLocaleDateString('en-GB') : currentDate),
            time: backendData.assessment_time || (backendData.created_at ? new Date(backendData.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : currentTime),
            customerName: backendData.customer_name || submission.customerName || '',
            address: backendData.address || submission.address || '',
            postalCode: backendData.postal_code || submission.postalCode || '',
            phone: backendData.phone || submission.phone || '',
            email: backendData.email || submission.email || '',
            preferredContactTime: getValue(backendData.preferred_contact_time, submission.preferredContactTime),
            ownsProperty: getValue(backendData.owns_property, submission.ownsProperty),
            isDecisionMaker: getValue(backendData.is_decision_maker, submission.isDecisionMaker),
            ageRange: getValue(backendData.age_range, submission.ageRange),
            electricBill: getValue(backendData.electric_bill, submission.electricBill),
            hasReceivedOtherQuotes: getValue(backendData.has_received_other_quotes, submission.hasReceivedOtherQuotes),
            photos: backendData.photos || submission.photos || { energyBill: '' },
            notes: backendData.notes || submission.notes || '',
            timestamp: backendData.created_at || backendData.timestamp || submission.timestamp || new Date().toISOString(),
            isOnline: navigator.onLine,
            synced: true
          };
        } catch (error) {
          console.warn('Failed to fetch fresh data from backend, using local data:', error);
        }
      }
      
      // Use fresh data if available, otherwise use the submission passed in
      const sourceSubmission = freshSubmission || submission;
      
      // Ensure all fields are properly loaded, especially the ones that might be missing
      // Create a complete form data object with all fields explicitly set
      // Use nullish coalescing (??) instead of || to preserve empty strings and falsy values
      const loadedData: FieldFormData = {
        id: sourceSubmission.id,
        backendId: sourceSubmission.backendId,
        userId: sourceSubmission.userId,
        // Canvasser Info
        canvasserName: sourceSubmission.canvasserName ?? canvasserName,
        date: sourceSubmission.date ?? currentDate,
        time: sourceSubmission.time ?? currentTime,
        // Contact Information - preserve empty strings if they exist
        customerName: sourceSubmission.customerName ?? '',
        address: sourceSubmission.address ?? '',
        postalCode: sourceSubmission.postalCode ?? '',
        phone: sourceSubmission.phone ?? '',
        email: sourceSubmission.email ?? '',
        preferredContactTime: sourceSubmission.preferredContactTime ?? '',
        // Property & Decision Making - preserve empty strings if they exist
        ownsProperty: sourceSubmission.ownsProperty ?? '',
        isDecisionMaker: sourceSubmission.isDecisionMaker ?? '',
        ageRange: sourceSubmission.ageRange ?? '',
        // Electric Bill - preserve empty strings if they exist
        electricBill: sourceSubmission.electricBill ?? '',
        // Interest - preserve empty strings if they exist
        hasReceivedOtherQuotes: sourceSubmission.hasReceivedOtherQuotes ?? '',
        // Photos - ensure proper structure
        photos: sourceSubmission.photos && typeof sourceSubmission.photos === 'object' 
          ? { energyBill: (sourceSubmission.photos as any).energyBill ?? '' }
          : { energyBill: '' },
        // Canvasser Notes - preserve empty strings if they exist
        notes: sourceSubmission.notes ?? '',
        // System fields
        timestamp: sourceSubmission.timestamp ?? new Date().toISOString(),
        isOnline: navigator.onLine,
        synced: sourceSubmission.synced ?? false
      };
      
      // Log the loaded data for debugging
      console.log('Loading submission for edit:', {
        original: submission,
        fresh: freshSubmission,
        loaded: loadedData
      });
      
      setFormData(loadedData);
      
      // Set editing state
      setEditingSubmissionId(submission.id || null);
      
      // Mark all steps as completed so user can navigate freely
      const stepOrder: FormStep[] = ['contact', 'interest', 'electricBill', 'photos', 'notes', 'review'];
      setCompletedSteps(new Set(stepOrder));
      
      // Navigate to contact step
      setCurrentStep('contact');
      
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setSuccessMessage('Form loaded for editing. Make your changes and submit.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error loading submission for edit:', error);
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
    
    // Property & Decision Making
    if (!formData.ownsProperty) missingFields.push('Property Ownership');
    if (!formData.isDecisionMaker) missingFields.push('Decision Maker');
    if (!formData.ageRange) missingFields.push('Age Range (18-74 years old)');
    
    // Electric Bill
    if (!formData.electricBill) missingFields.push('Electric Bill Amount');
    
    // Interest
    if (!formData.hasReceivedOtherQuotes) missingFields.push('Received Other Quotes');
    
    // Photos
    if (!formData.photos.energyBill) missingFields.push('Electric Bill Photo');
    
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
          // Log the result from server to debug
          console.log('Server response after save:', {
            owns_property: result.owns_property,
            is_decision_maker: result.is_decision_maker,
            age_range: result.age_range,
            electric_bill: result.electric_bill,
            has_received_other_quotes: result.has_received_other_quotes,
            preferred_contact_time: result.preferred_contact_time,
            full_result: result
          });
          
          // Convert server response (snake_case) to form data format (camelCase)
          // Ensure all fields are preserved, especially the new simplified fields
          const syncedSubmission: FieldFormData = {
            id: `backend_${result.id}`,
            backendId: result.id,
            userId: user?.id || submissionData.userId, // Store user ID for filtering
            canvasserName: result.field_agent_name || submissionData.canvasserName,
            date: result.assessment_date || submissionData.date,
            time: result.assessment_time || submissionData.time,
            customerName: result.customer_name || submissionData.customerName,
            address: result.address || submissionData.address,
            postalCode: result.postal_code || submissionData.postalCode,
            phone: result.phone || submissionData.phone,
            email: result.email || submissionData.email,
            // Preserve these fields explicitly - use submissionData first, then result, then empty string
            // Use nullish coalescing to preserve empty strings
            // Prioritize server response (result) since that's what was just saved
            // Only fall back to submissionData if result is null/undefined/empty
            preferredContactTime: (result.preferred_contact_time !== null && result.preferred_contact_time !== undefined && result.preferred_contact_time !== '') 
              ? result.preferred_contact_time 
              : (submissionData.preferredContactTime ?? ''),
            ownsProperty: (result.owns_property !== null && result.owns_property !== undefined && result.owns_property !== '') 
              ? result.owns_property 
              : (submissionData.ownsProperty ?? ''),
            isDecisionMaker: (result.is_decision_maker !== null && result.is_decision_maker !== undefined && result.is_decision_maker !== '') 
              ? result.is_decision_maker 
              : (submissionData.isDecisionMaker ?? ''),
            ageRange: (result.age_range !== null && result.age_range !== undefined && result.age_range !== '') 
              ? result.age_range 
              : (submissionData.ageRange ?? ''),
            electricBill: (result.electric_bill !== null && result.electric_bill !== undefined && result.electric_bill !== '') 
              ? result.electric_bill 
              : (submissionData.electricBill ?? ''),
            hasReceivedOtherQuotes: (result.has_received_other_quotes !== null && result.has_received_other_quotes !== undefined && result.has_received_other_quotes !== '') 
              ? result.has_received_other_quotes 
              : (submissionData.hasReceivedOtherQuotes ?? ''),
            photos: result.photos || submissionData.photos || { energyBill: '' },
            notes: result.notes || submissionData.notes || '',
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
        
        // Property & Decision Making
        ownsProperty: '',
        isDecisionMaker: '',
        ageRange: '',
        
        // Electric Bill
        electricBill: '',
        
        // Interest
        hasReceivedOtherQuotes: '',
        
        // Photos - only electric bill
        photos: {
          energyBill: ''
        },
        
        // Canvasser Notes
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
          const request = store.put({ ...submissionData, id: editingSubmissionId, userId: user?.id });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        
        setPendingSubmissions(prev => prev.map(s => 
          s.id === editingSubmissionId ? { ...submissionData, id: editingSubmissionId, userId: user?.id } : s
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
        
        // Property & Decision Making
        ownsProperty: '',
        isDecisionMaker: '',
        ageRange: '',
        
        // Electric Bill
        electricBill: '',
        
        // Interest
        hasReceivedOtherQuotes: '',
        
        // Photos - only electric bill
        photos: {
          energyBill: ''
        },
        
        // Canvasser Notes
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
    // Convert camelCase to snake_case for Django backend and apply UK formatting
    const backendData: any = {
      canvasser_name: formatName(data.canvasserName),
      assessment_date: data.date,
      assessment_time: data.time,
      customer_name: formatName(data.customerName),
      phone: data.phone,
      email: data.email,
      address: formatAddress(data.address),
      postal_code: formatUKPostcode(data.postalCode),
      notes: data.notes,
      photos: data.photos,
      timestamp: data.timestamp
    };
    
    // Include simplified form fields - send null for empty strings to match backend null=True
    // Always include these fields so backend can properly handle them
    backendData.preferred_contact_time = (data.preferredContactTime !== undefined && data.preferredContactTime !== '') 
      ? data.preferredContactTime 
      : null;
    backendData.owns_property = (data.ownsProperty !== undefined && data.ownsProperty !== '') 
      ? data.ownsProperty 
      : null;
    backendData.is_decision_maker = (data.isDecisionMaker !== undefined && data.isDecisionMaker !== '') 
      ? data.isDecisionMaker 
      : null;
    backendData.age_range = (data.ageRange !== undefined && data.ageRange !== '') 
      ? data.ageRange 
      : null;
    backendData.electric_bill = (data.electricBill !== undefined && data.electricBill !== '') 
      ? data.electricBill 
      : null;
    backendData.has_received_other_quotes = (data.hasReceivedOtherQuotes !== undefined && data.hasReceivedOtherQuotes !== '') 
      ? data.hasReceivedOtherQuotes 
      : null;
    
    // Log what we're sending to debug
    console.log('Sending to server:', {
      owns_property: backendData.owns_property,
      is_decision_maker: backendData.is_decision_maker,
      age_range: backendData.age_range,
      electric_bill: backendData.electric_bill,
      has_received_other_quotes: backendData.has_received_other_quotes,
      preferred_contact_time: backendData.preferred_contact_time,
      isEditing: editingSubmissionId !== null || !!submissionIdToCheck || !!data.backendId
    });
    
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
    
    // Use the API instance which handles authentication automatically
    try {
      let result;
      if (isEditing && submissionId) {
        // Update existing submission
        result = await fieldSubmissionsAPI.updateFieldSubmission(submissionId, backendData);
        // Ensure result has the ID
        if (!result.id) {
          result.id = submissionId;
        }
      } else {
        // Create new submission
        result = await fieldSubmissionsAPI.createFieldSubmission(backendData);
      }
      
      return result;
    } catch (error: any) {
      // Handle API errors with better logging
      console.error('Error submitting to server:', error);
      if (error.response) {
        const errorData = error.response.data;
        console.error('Server error response:', errorData);
        // Format validation errors
        if (errorData && typeof errorData === 'object') {
          const errors = Object.entries(errorData).map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          }).join('\n');
          throw new Error(errors || `Server error: ${error.response.status}`);
        }
        throw new Error(errorData.detail || errorData.error || `Server error: ${error.response.status}`);
      }
      // Network or other errors
      if (error.message) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error('Failed to sync submission. Please check your connection and try again.');
    }
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
            
            let transactionResolved = false;
            
            // Handle transaction completion
            transaction.oncomplete = () => {
              if (!transactionResolved) {
                transactionResolved = true;
                // Update React state after transaction completes
                setPendingSubmissions(prev => prev.filter(s => s.id !== submission.id));
                setSyncedSubmissions(prev => {
                  const existing = prev.find(s => s.id === `backend_${result.id}`);
                  if (existing) {
                    return prev.map(s => s.id === `backend_${result.id}` ? {
            ...submission,
                      id: `backend_${result.id}`,
                      backendId: result.id,
            synced: true
                    } : s);
                  }
                  return [...prev, {
                    ...submission,
                    id: `backend_${result.id}`,
                    backendId: result.id,
                    synced: true
                  }];
                });
                setActualSyncedCount(prev => {
                  const hasExisting = syncedSubmissions.some(s => s.id === `backend_${result.id}`);
                  return hasExisting ? prev : prev + 1;
                });
                
                // Only show success message if not in bulk sync mode
                if (syncingSubmissionId !== 'all') {
              setSuccessMessage(`Submission for ${submission.customerName} synced successfully!`);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
                }
                  
                  resolve();
              }
            };
            
            transaction.onerror = (event) => {
              console.error('Transaction error:', event);
              if (!transactionResolved) {
                transactionResolved = true;
                reject((event.target as IDBTransaction).error || new Error('Transaction failed'));
              }
            };
            
            // Create synced submission with backend ID
            const syncedSubmission: FieldFormData = {
              ...submission,
              id: `backend_${result.id}`,
              backendId: result.id,
              userId: user?.id || submission.userId, // Store user ID for filtering
              synced: true
            };

            // Use put() instead of add() - it will add if new, or update if exists
            // This prevents "Key already exists" errors when re-syncing
            const putRequest = syncedStore.put(syncedSubmission);
              
            putRequest.onsuccess = () => {
              // Remove from pending submissions (only if it was pending)
              // Check if submission exists in pending before trying to delete
                const deleteRequest = pendingStore.delete(submission.id!);
              
                deleteRequest.onsuccess = () => {
                // Transaction will complete automatically, oncomplete handler will resolve
              };
              
              deleteRequest.onerror = () => {
                // If delete fails (e.g., item wasn't in pending), that's okay
                // The item might already be in synced, so we can continue
                // Transaction will complete automatically, oncomplete handler will resolve
              };
            };
              
            putRequest.onerror = (event) => {
              const error = (event.target as IDBRequest).error;
              if (!transactionResolved) {
                transactionResolved = true;
                reject(error || new Error('Failed to save synced submission'));
            }
          };
          }).catch(error => {
            reject(error);
          });
        });

      } catch (error) {
      console.error('Sync error for submission:', submission.id, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync submission. Please try again.';
      // Only show error if not syncing all (errors will be handled in syncAllSubmissions)
      if (syncingSubmissionId !== 'all') {
      setErrorMessage(`Failed to sync submission: ${errorMessage}`);
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
      // Process one at a time with delays to avoid IndexedDB transaction conflicts
      for (let i = 0; i < allSubmissions.length; i++) {
        const submission = allSubmissions[i];
        try {
          // Wait a bit longer between syncs to ensure previous transaction completes
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          await syncSingleSubmission(submission);
          successCount++;
          
          // Additional delay after successful sync to ensure database operations complete
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error: any) {
          failCount++;
          // Check if it's an IndexedDB transaction error
          if (error?.name === 'AbortError' || error?.message?.includes('transaction was aborted')) {
            console.warn(`Transaction conflict for submission ${submission.id}, will retry later`);
            // Wait longer before continuing to next submission
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            console.error('Error syncing submission:', error);
          }
        }
      }

      setSyncingSubmissionId(null);

      // Wait a bit before reloading to ensure all transactions are complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
        if (failCount < allSubmissions.length) {
          setErrorMessage(`${failCount} submissions failed to sync. You can try syncing them individually.`);
        } else {
          setErrorMessage('All submissions failed to sync. Please check your connection and try again.');
        }
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
    { key: 'interest', title: 'Property & Decision', description: 'Ownership & decision maker' },
    { key: 'electricBill', title: 'Electric Bill', description: 'Bill amount' },
    { key: 'photos', title: 'Photo', description: 'Electric bill photo' },
    { key: 'notes', title: 'Notes', description: 'Canvasser notes' },
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

      case 'interest':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Property & Decision Making</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you own the property? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ownsProperty"
                      value="yes"
                      checked={formData.ownsProperty === 'yes'}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownsProperty: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ownsProperty"
                      value="no"
                      checked={formData.ownsProperty === 'no'}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownsProperty: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you the decision maker? <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isDecisionMaker"
                      value="yes"
                      checked={formData.isDecisionMaker === 'yes'}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDecisionMaker: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isDecisionMaker"
                      value="no"
                      checked={formData.isDecisionMaker === 'no'}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDecisionMaker: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isDecisionMaker"
                      value="partner"
                      checked={formData.isDecisionMaker === 'partner'}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDecisionMaker: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">Partner</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you 18-74 years old? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ageRange"
                      value="18-74"
                      checked={formData.ageRange === '18-74'}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageRange: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">Yes (18-74 years old)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ageRange"
                      value="outside_range"
                      checked={formData.ageRange === 'outside_range'}
                      onChange={(e) => setFormData(prev => ({ ...prev, ageRange: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">No (outside 18-74 range)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Have you received other quotes? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasReceivedOtherQuotes"
                      value="yes"
                      checked={formData.hasReceivedOtherQuotes === 'yes'}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasReceivedOtherQuotes: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasReceivedOtherQuotes"
                      value="no"
                      checked={formData.hasReceivedOtherQuotes === 'no'}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasReceivedOtherQuotes: e.target.value }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'electricBill':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Electric Bill</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="electricBill" className="block text-sm font-medium text-gray-700 mb-1">
                  Electric Bill Amount (£) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="electricBill"
                  name="electricBill"
                  required
                  value={formData.electricBill}
                  onChange={(e) => setFormData(prev => ({ ...prev, electricBill: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Electric Bill Photo <span className="text-red-500">*</span>
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Please take a photo of the electric bill showing PPKw and annual usage.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-md">
              {/* Energy Bill Photo */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <h3 className="font-semibold mb-2">Electric Bill Photo <span className="text-red-500">*</span></h3>
                <p className="text-sm text-gray-600 mb-2">Show PPKw and annual usage</p>
                {formData.photos.energyBill ? (
                  <div className="relative">
                    <img
                      src={formData.photos.energyBill}
                      alt="Energy bill"
                      className="w-full h-64 object-contain rounded-lg mb-2"
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
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-gray-400">No photo</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => capturePhoto('energyBill')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  📷 Take Electric Bill Photo
                </button>
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Canvasser Notes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add any additional observations, concerns, or special requirements (optional).
            </p>
              <div>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes or observations..."
              />
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
            
            {/* Property & Decision Making */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Property & Decision Making</h3>
              <p><strong>Owns Property:</strong> {formData.ownsProperty}</p>
              <p><strong>Decision Maker:</strong> {formData.isDecisionMaker}</p>
              <p><strong>Age Range:</strong> {formData.ageRange === '18-74' ? 'Yes (18-74 years old)' : formData.ageRange === 'outside_range' ? 'No (outside 18-74 range)' : 'Not specified'}</p>
              <p><strong>Received Other Quotes:</strong> {formData.hasReceivedOtherQuotes}</p>
            </div>

            {/* Electric Bill */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Electric Bill</h3>
              <p><strong>Electric Bill Amount:</strong> £{formData.electricBill}</p>
            </div>

            {/* Photo */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-2">Electric Bill Photo</h3>
              <p><strong>Status:</strong> {formData.photos.energyBill ? '✅ Captured' : '❌ Missing'}</p>
              {formData.photos.energyBill && (
                <div className="mt-2">
                  <img
                    src={formData.photos.energyBill}
                    alt="Electric bill"
                    className="max-w-full h-48 object-contain rounded-lg border border-gray-300"
                  />
            </div>
              )}
            </div>

            {/* Canvasser Notes */}
            {formData.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold mb-2 text-yellow-900">Canvasser Notes</h3>
                <p className="whitespace-pre-wrap">{formData.notes}</p>
            </div>
            )}

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
                  onClick={() => setCurrentStep('notes')}
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
                  {(showAllSyncedSubmissions ? syncedSubmissions : syncedSubmissions.slice(0, 5)).map((submission, index) => (
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
                              onClick={() => syncSingleSubmission(submission)}
                              disabled={!formData.isOnline || syncingSubmissionId === submission.id || syncingSubmissionId === 'all' || editingSubmissionId !== null}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Re-sync to ensure sent to qualifier"
                            >
                              {syncingSubmissionId === submission.id ? '⏳ Syncing...' : '🔄 Sync'}
                            </button>
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
                  {actualSyncedCount > 5 && syncedSubmissions.length > 0 && !showAllSyncedSubmissions && (
                    <button
                      onClick={() => setShowAllSyncedSubmissions(true)}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 text-center py-2 font-medium hover:underline"
                    >
                      ... and {actualSyncedCount - 5} more (click to show all)
                    </button>
                  )}
                  {showAllSyncedSubmissions && actualSyncedCount > 5 && (
                    <button
                      onClick={() => setShowAllSyncedSubmissions(false)}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 text-center py-2 font-medium hover:underline"
                    >
                      Show less
                    </button>
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
                const stepOrder: FormStep[] = ['contact', 'interest', 'electricBill', 'photos', 'notes', 'review'];
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
                    const stepOrder: FormStep[] = ['contact', 'interest', 'electricBill', 'photos', 'notes', 'review'];
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

