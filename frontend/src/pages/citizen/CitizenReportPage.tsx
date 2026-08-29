import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CivicCategory, CitizenIdentityMode, CitizenProfile } from '../../types';
import { KOPARGAON_WARDS } from '../../data/mockData';
import { API_ENDPOINTS } from '../../config/api';
import {
  LocationPickerModal,
  KopargaonLocationResult,
  resolveKopargaonAddress,
} from '../../components/map/LocationPickerModal';
import {
  Trash2,
  Droplets,
  AlertTriangle,
  Flame,
  Lightbulb,
  Sparkles,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  ArrowLeft,
  X,
  Compass,
  FileCheck,
  User,
  EyeOff,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

interface CategoryOption {
  id: CivicCategory;
  label: string;
  icon: React.ElementType;
  desc: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Garbage Accumulation', label: 'Garbage', icon: Trash2, desc: 'Solid waste, dump yards' },
  { id: 'Water Supply & Pipeline', label: 'Water', icon: Droplets, desc: 'Leakage, no water supply' },
  { id: 'Drainage & Sewage', label: 'Drainage', icon: AlertTriangle, desc: 'Clogged gutter, overflow' },
  { id: 'Potholes & Road Damage', label: 'Road', icon: Flame, desc: 'Potholes, broken asphalt' },
  { id: 'Streetlight Outage', label: 'Streetlight', icon: Lightbulb, desc: 'Dark street, broken bulb' },
  { id: 'Public Health & Sanitation', label: 'Sanitation', icon: Sparkles, desc: 'Mosquito breeding, spray' },
];

export const CitizenReportPage: React.FC = () => {
  const navigate = useNavigate();

  const identitySectionRef = useRef<HTMLDivElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // User Profile
  const [profile, setProfile] = useState<CitizenProfile | null>(null);

  // Form Fields State
  const [selectedCategory, setSelectedCategory] = useState<CivicCategory | ''>('');
  const [description, setDescription] = useState('');
  const [selectedWard, setSelectedWard] = useState('Ward 5 - Shivaji Chowk');
  const [landmark, setLandmark] = useState('');

  // Privacy & Identity State
  const [identityMode, setIdentityMode] = useState<CitizenIdentityMode>('ANONYMOUS');
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [alias, setAlias] = useState('CivicChampion');

  // Location State & Modal
  const [coords, setCoords] = useState<[number, number] | null>([19.8917, 74.4789]);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'CAPTURED' | 'ERROR'>('CAPTURED');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationDisplay, setLocationDisplay] = useState('Near Old Market Yard Gate, Shivaji Chowk');

  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'phone_sync' | 'webcam' | 'file' | null>(null);

  // Live In-Browser Webcam Viewfinder State
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Phone Sync Modal & Dedicated Session State
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [syncSessionId, setSyncSessionId] = useState<string>(() => 'cam_' + Math.random().toString(36).substring(2, 9));
  const [phoneSyncStatus, setPhoneSyncStatus] = useState<'IDLE' | 'WAITING' | 'SYNCED'>('WAITING');
  const [copiedLink, setCopiedLink] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91 98220 44112');
  const [smsSent, setSmsSent] = useState(false);

  // Form Validation & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<any>(null);

  const [networkIp, setNetworkIp] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.hostname;
    }
    return '30.0.6.192';
  });
  const [isEditingIp, setIsEditingIp] = useState(false);

  // Determine dedicated mobile photo bridge URL for QR Code
  const mobileAccessUrl = `http://${networkIp}:5173/mobile-upload?session=${syncSessionId}`;

  // Real dynamic scannable QR Code URL
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    mobileAccessUrl
  )}&margin=10&color=0f172a&bgcolor=ffffff`;

  useEffect(() => {
    async function loadProfile() {
      const p = await citizenService.getProfile();
      setProfile(p);
      setIdentityMode(p.identity_mode || 'ANONYMOUS');
      setLeaderboardEnabled(p.leaderboard_enabled || false);
      if (p.alias) setAlias(p.alias);
      if (p.phone) setPhoneNumber(p.phone);
    }
    loadProfile();
  }, []);

  const handleOpenPhoneModal = () => {
    const newSession = 'cam_' + Math.random().toString(36).substring(2, 9);
    setSyncSessionId(newSession);
    setPhoneSyncStatus('WAITING');
    try {
      localStorage.removeItem('kopargov_phone_photo_sync');
      localStorage.removeItem(`kopargov_sync_${newSession}`);
    } catch (e) {
      // ignore
    }
    setPhoneModalOpen(true);
  };

  // Poll backend sync endpoint when QR modal is open
  useEffect(() => {
    if (!phoneModalOpen || !syncSessionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(API_ENDPOINTS.SYNC_PHOTO(syncSessionId));
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'SYNCED' && data.photo_data) {
            setPhotoPreview(data.photo_data);
            setPhotoSource('phone_sync');
            setPhoneSyncStatus('SYNCED');
            fetch(API_ENDPOINTS.SYNC_PHOTO(syncSessionId), { method: 'DELETE' }).catch(() => {});
            setTimeout(() => setPhoneModalOpen(false), 600);
          }
        }
      } catch (err) {
        // network polling fallback
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phoneModalOpen, syncSessionId]);

  // Cleanup webcam stream if component unmounts
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Start in-browser live webcam stream
  const handleStartWebcam = async () => {
    setWebcamError(null);
    setWebcamOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Webcam permission denied or unavailable, opening file camera fallback', err);
      setWebcamError('Unable to access device camera directly. Please use the mobile camera or file upload.');
    }
  };

  const handleCaptureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoPreview(dataUrl);
      setPhotoSource('webcam');
      handleCloseWebcam();
      if (!coords) {
        setCoords([19.8917, 74.4789]);
        setLocationStatus('CAPTURED');
      }
    }
  };

  const handleCloseWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setWebcamOpen(false);
  };

  // Device Geolocation & Location Methods
  const handleUseMyLocation = () => {
    setLocationStatus('LOCATING');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const res = resolveKopargaonAddress(pos.coords.latitude, pos.coords.longitude);
          setCoords(res.coordinates);
          setSelectedWard(res.ward);
          setLandmark(res.landmark);
          setLocationDisplay(res.address);
          setLocationStatus('CAPTURED');
          setErrors(prev => ({ ...prev, location: '' }));
        },
        _err => {
          // Fallback to Kopargaon center
          const res = resolveKopargaonAddress(19.8917, 74.4789);
          setCoords(res.coordinates);
          setSelectedWard(res.ward);
          setLandmark(res.landmark);
          setLocationDisplay(res.address);
          setLocationStatus('CAPTURED');
          setErrors(prev => ({ ...prev, location: '' }));
        },
        { timeout: 5000 }
      );
    } else {
      const res = resolveKopargaonAddress(19.8917, 74.4789);
      setCoords(res.coordinates);
      setSelectedWard(res.ward);
      setLandmark(res.landmark);
      setLocationDisplay(res.address);
      setLocationStatus('CAPTURED');
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  // Callback when user picks exact point on Kopargaon Leaflet Map
  const handleLocationPicked = (result: KopargaonLocationResult) => {
    setCoords(result.coordinates);
    setSelectedWard(result.ward);
    setLandmark(result.landmark);
    setLocationDisplay(result.address);
    setLocationStatus('CAPTURED');
    setErrors(prev => ({ ...prev, location: '' }));
  };

  // Handle Photo Upload from PC file explorer
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Image size exceeds 10MB limit.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      setPhotoSource(source);
      if (!coords) {
        setCoords([19.8917, 74.4789]);
        setLocationStatus('CAPTURED');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileAccessUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 3000);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoSource(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedCategory) newErrors.category = 'Please select an issue category.';
    if (!description.trim() || description.trim().length < 5) {
      newErrors.description = 'Please provide a descriptive explanation (at least 5 characters).';
    }
    if (!coords) {
      newErrors.location = 'Please capture or select the location on the map.';
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const wardNumber = parseInt(selectedWard.replace(/\D/g, ''), 10) || 5;
      const created = await citizenService.submitIssue({
        category: selectedCategory as CivicCategory,
        description,
        ward: selectedWard,
        ward_number: wardNumber,
        latitude: coords![0],
        longitude: coords![1],
        landmark: landmark || undefined,
        photoUrl: photoPreview || undefined,
        identity_mode: identityMode,
        leaderboard_enabled: leaderboardEnabled,
        alias: identityMode === 'ANONYMOUS' && leaderboardEnabled ? alias.trim() : undefined,
      });

      setIsSubmitting(false);
      setCreatedIssue(created);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ submit: "We couldn't submit your complaint. Try Again." });
    }
  };

  const scrollToIdentity = () => {
    identitySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // SUCCESS / QUEUED SCREEN AFTER SUBMISSION
  if (createdIssue) {
    const isAnon = identityMode === 'ANONYMOUS';
    const displayedReporter = isAnon ? 'Anonymous Citizen' : (profile?.real_name || 'Rahul Patil');
    const isQueued = createdIssue.status === 'PENDING_RECOVERY' || createdIssue.recovery_queued;

    if (isQueued) {
      return (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-amber-300 p-6 sm:p-8 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95 ring-2 ring-amber-400/30">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs border border-amber-300 animate-pulse">
            <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
              DEGRADED RESILIENCE MODE
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">
              ⚠️ System in Recovery Mode
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
              Your complaint has <strong>NOT</strong> been lost. It has been safely queued in the municipal operation journal and will be committed once data services are restored.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-amber-200/80 max-w-sm mx-auto text-xs space-y-2.5 text-left font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Complaint ID:</span>
              <span className="font-bold text-slate-900 text-sm">{createdIssue.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Recovery Operation:</span>
              <span className="font-bold text-sky-800">{createdIssue.operation_id || 'OP-QUEUED'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-sans">Status:</span>
              <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                PENDING RECOVERY (QUEUED)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Category:</span>
              <span className="font-semibold text-slate-800 font-sans">{selectedCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Ward:</span>
              <span className="font-semibold text-slate-800 font-sans">{selectedWard}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => navigate(`/citizen/issues/${createdIssue.id}`)}
              className="w-full sm:w-auto px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
            >
              Track Queue Status &rarr;
            </button>
            <Link
              to="/citizen"
              className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }

    // Normal Committed Success Screen
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md text-center space-y-5 animate-in fade-in zoom-in-95 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Issue Reported Successfully
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Your complaint has been submitted for municipal triage and MCDA evaluation.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs space-y-2.5 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Complaint ID:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{createdIssue.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Category:</span>
            <span className="font-semibold text-slate-800">{selectedCategory}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ward:</span>
            <span className="font-semibold text-slate-800">{selectedWard}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
            <span className="text-slate-500">Public Display:</span>
            <span
              className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                isAnon ? 'bg-slate-200 text-slate-700' : 'bg-sky-50 text-sky-800 border border-sky-200'
              }`}
            >
              {displayedReporter}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={() => navigate(`/citizen/issues/${createdIssue.id}`)}
            className="w-full sm:w-auto px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
          >
            Track Complaint &rarr;
          </button>
          <Link
            to="/citizen"
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/citizen"
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Public Redressal Form
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Report a Civic Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Upload photo evidence and pinpoint your exact location for rapid municipal response.
        </p>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Error notification if submission failed */}
        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-center justify-between">
            <span>{errors.submit}</span>
            <button type="button" onClick={() => setErrors({})} className="text-red-600 font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Category Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Select Category <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setErrors(prev => ({ ...prev, category: '' }));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-600 text-sky-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-sky-700' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold text-xs block">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 block leading-tight">{cat.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="text-xs text-red-600 font-semibold">{errors.category}</p>
          )}
        </div>

        {/* 2. Description Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Problem Description <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              setErrors(prev => ({ ...prev, description: '' }));
            }}
            placeholder="Describe the problem (e.g. Garbage has not been collected near the market for 3 days)..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-600"
          />
          {errors.description && (
            <p className="text-xs text-red-600 font-semibold">{errors.description}</p>
          )}
        </div>

        {/* 3. Problem Location Section with Map Pinning */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Problem Location <span className="text-red-600">*</span>
            </label>
            <span className="text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full font-semibold border border-sky-200">
              Interactive Map & Ward Match
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Compass className="w-4 h-4 text-sky-700" />
              <span>Use My GPS Location</span>
            </button>

            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-xl border border-sky-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              <MapPin className="w-4 h-4 text-sky-700" />
              <span>📍 Pin Exact Point on Map</span>
            </button>
          </div>

          {/* Selected Location Card */}
          {coords && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-sky-600 text-white font-bold">
                    <MapPin className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-bold text-slate-900">
                    {landmark || 'Pinned Location'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  className="text-[11px] font-bold text-sky-700 hover:text-sky-800 underline cursor-pointer"
                >
                  Change on Map
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1 pt-1 border-t border-slate-200">
                <span className="font-medium truncate">{locationDisplay}</span>
                <span className="font-mono text-slate-500 font-bold shrink-0">
                  {coords[0].toFixed(4)}° N, {coords[1].toFixed(4)}° E
                </span>
              </div>
            </div>
          )}

          {locationStatus === 'ERROR' && (
            <p className="text-xs text-red-600 font-semibold">Unable to access your location. Please select on map.</p>
          )}
          {errors.location && (
            <p className="text-xs text-red-600 font-semibold">{errors.location}</p>
          )}

          {/* Ward Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Ward Jurisdiction</label>
            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
            >
              {KOPARGAON_WARDS.map(w => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. PHOTO EVIDENCE WITH DEDICATED PHONE CAMERA QR & UPLOAD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Add Photo Evidence <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <span className="text-[10px] text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full font-semibold border border-purple-200">
              Direct Phone Camera & Files
            </span>
          </div>

          {/* Hidden file pickers */}
          <input
            ref={mobileCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => handlePhotoUpload(e, 'camera')}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={e => handlePhotoUpload(e, 'file')}
            className="hidden"
          />

          {!photoPreview && !webcamOpen ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Cross-Device Phone QR Modal Trigger */}
              <button
                type="button"
                onClick={handleOpenPhoneModal}
                className="p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl border border-purple-300 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-center group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Snap from Phone</span>
                  <span className="text-[10px] text-purple-700 block">Scan QR code</span>
                </div>
              </button>

              {/* 2. In-Browser Live Webcam Stream */}
              <button
                type="button"
                onClick={handleStartWebcam}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-center group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Video className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Use Web Camera</span>
                  <span className="text-[10px] text-slate-400 block">Live laptop lens</span>
                </div>
              </button>

              {/* 3. Upload File / Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-center group shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Browse Files</span>
                  <span className="text-[10px] text-slate-400 block">JPG, PNG up to 10MB</span>
                </div>
              </button>
            </div>
          ) : null}

          {/* Webcam Viewfinder */}
          {webcamOpen && (
            <div className="relative rounded-2xl overflow-hidden border-2 border-sky-500 bg-slate-950 p-2 space-y-2 animate-in zoom-in-95">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover rounded-xl" />
              <div className="flex items-center justify-between gap-2 px-2">
                <button
                  type="button"
                  onClick={handleCloseWebcam}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureWebcamSnapshot}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* Photo Preview Container */}
          {photoPreview && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-300 group shadow-xs">
              <img src={photoPreview} alt="Attached civic evidence" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3">
                <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-md">
                  ✓ Photo Attached ({photoSource === 'phone_sync' ? 'Phone Camera' : 'Direct'})
                </span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {photoError && <p className="text-xs text-red-600 font-semibold">{photoError}</p>}
        </div>

        {/* 5. Privacy & Identity Mode Section */}
        <div ref={identitySectionRef} className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Reporting Identity Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIdentityMode('ANONYMOUS')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                identityMode === 'ANONYMOUS'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <EyeOff className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Anonymous Mode</span>
                <span className="text-[10px] opacity-80 block leading-tight">
                  Name and phone hidden from public view
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIdentityMode('PUBLIC')}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                identityMode === 'PUBLIC'
                  ? 'bg-sky-900 text-white border-sky-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <User className="w-4 h-4 mt-0.5 text-sky-300 shrink-0" />
              <div>
                <span className="font-bold text-xs block">Public Citizen Profile</span>
                <span className="text-[10px] opacity-80 block leading-tight">
                  Display verified citizen badge on resolution
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting & Prioritizing via CIE...</span>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Submit Civic Complaint for Municipal Triage</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* "UPLOAD USING PHONE" REAL SCANNABLE QR CODE MODAL                         */}
      {/* ========================================================================= */}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Upload Photo using Phone</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Cross-device live camera sync</p>
                </div>
              </div>
              <button
                onClick={() => setPhoneModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Scannable QR Code Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col items-center text-center space-y-3">
              <div className="w-44 h-44 bg-white p-2 rounded-2xl border border-slate-300 shadow-sm flex items-center justify-center relative group">
                <img
                  src={qrCodeImageUrl}
                  alt="Scan QR code with your phone camera"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-900">
                  Scan QR with your Smartphone Camera
                </p>
                <p className="text-[11px] text-slate-500 leading-normal max-w-xs font-mono break-all bg-white py-1 px-2 rounded-lg border border-slate-200">
                  {mobileAccessUrl}
                </p>

                {/* Inline Wi-Fi IP Setting */}
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                  <span>Host IP:</span>
                  {isEditingIp ? (
                    <input
                      type="text"
                      value={networkIp}
                      onChange={e => setNetworkIp(e.target.value.trim())}
                      onBlur={() => setIsEditingIp(false)}
                      autoFocus
                      className="w-28 px-1.5 py-0.5 bg-white border border-purple-400 rounded text-[10px] font-mono font-bold text-slate-900"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingIp(true)}
                      className="font-mono font-bold text-purple-700 hover:underline cursor-pointer bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                      title="Click to edit if using a different Wi-Fi or hotspot IP"
                    >
                      {networkIp} ✎
                    </button>
                  )}
                </div>
              </div>

              {/* Status pulse */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                <span>{phoneSyncStatus === 'SYNCED' ? '✓ Photo Received from Phone!' : 'Waiting for photo from your phone...'}</span>
              </div>
            </div>

            {/* Copy Mobile Link & SMS Option */}
            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Phone Upload Link</span>
                  </>
                )}
              </button>

              {/* SMS Link Form */}
              <form onSubmit={handleSendSms} className="pt-2 border-t border-slate-100 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Or text camera link to your phone:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+91 98220 44112"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {smsSent ? 'Sent ✓' : 'Send Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE KOPARGAON MAP PINNING MODAL                                   */}
      {/* ========================================================================= */}
      <LocationPickerModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        initialCoords={coords}
        onSelectLocation={handleLocationPicked}
      />
    </div>
  );
};
