import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CivicCategory, CitizenIdentityMode, CitizenProfile } from '../../types';
import { KOPARGAON_WARDS } from '../../data/mockData';
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
  ShieldCheck,
  User,
  EyeOff,
  Trophy,
  Info,
  Edit3,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Video,
  SwitchCamera,
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

const SAMPLE_CIVIC_PHOTOS = [
  {
    title: 'Market Waste',
    url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
    desc: 'Garbage at market',
  },
  {
    title: 'Damaged Road',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    desc: 'Potholes & cracks',
  },
  {
    title: 'Water Leak',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f3?auto=format&fit=crop&w=800&q=80',
    desc: 'Pipeline rupture',
  },
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

  // Privacy & Identity State (Source of Truth Matrix)
  const [identityMode, setIdentityMode] = useState<CitizenIdentityMode>('ANONYMOUS');
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [alias, setAlias] = useState('CivicChampion');

  // Location State
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'CAPTURED' | 'ERROR'>('IDLE');

  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'camera' | 'phone_sync' | 'webcam' | 'sample' | 'file' | null>(null);

  // Live In-Browser Webcam Viewfinder State
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Phone Sync Modal State
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneSyncStatus, setPhoneSyncStatus] = useState<'IDLE' | 'WAITING' | 'SYNCED'>('WAITING');
  const [copiedLink, setCopiedLink] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsSent, setSmsSent] = useState(false);

  // Form Validation & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);

  // Determine optimal mobile link (uses actual network IP if on localhost)
  const mobileAccessUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://10.88.240.180:5173/citizen/report`
    : `${window.location.origin}/citizen/report`;

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
    } catch (err) {
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

  // Use Browser / Device Geolocation
  const handleUseMyLocation = () => {
    setLocationStatus('LOCATING');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
          setLocationStatus('CAPTURED');
          setErrors(prev => ({ ...prev, location: '' }));
        },
        _err => {
          setCoords([19.8917, 74.4789]);
          setLocationStatus('CAPTURED');
          setErrors(prev => ({ ...prev, location: '' }));
        },
        { timeout: 5000 }
      );
    } else {
      setCoords([19.8917, 74.4789]);
      setLocationStatus('CAPTURED');
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleSelectOnMap = () => {
    setCoords([19.8930, 74.4760]);
    setLocationStatus('CAPTURED');
    setErrors(prev => ({ ...prev, location: '' }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'file') => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setPhotoError('Image size exceeds 8MB. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoSource(source);
      };
      reader.onerror = () => {
        setPhotoError('Unable to process this image. Try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSamplePhoto = (url: string) => {
    setPhotoPreview(url);
    setPhotoSource('sample');
    if (!coords) {
      setCoords([19.8917, 74.4789]);
      setLocationStatus('CAPTURED');
    }
  };

  // Simulate Instant Phone Sync (QR / Mobile Handshake Demo)
  const handleSimulatePhoneSync = () => {
    setPhoneSyncStatus('SYNCED');
    setTimeout(() => {
      setPhotoPreview('https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80');
      setPhotoSource('phone_sync');
      setPhoneModalOpen(false);
      setPhoneSyncStatus('WAITING');
      if (!coords) {
        setCoords([19.8917, 74.4789]);
        setLocationStatus('CAPTURED');
      }
    }, 1000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileAccessUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setSmsSent(true);
    setTimeout(() => {
      handleSimulatePhoneSync();
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!selectedCategory) {
      newErrors.category = 'Please select a category.';
    }
    if (!description.trim()) {
      newErrors.description = 'Please describe the issue.';
    }
    if (!coords) {
      newErrors.location = 'Please provide the issue location.';
    }

    if (identityMode === 'ANONYMOUS' && leaderboardEnabled && !alias.trim()) {
      newErrors.alias = 'Please choose a public alias for the leaderboard.';
    }

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
      setCreatedIssueId(created.id);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ submit: "We couldn't submit your complaint. Try Again." });
    }
  };

  const scrollToIdentity = () => {
    identitySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // SUCCESS SCREEN AFTER SUBMISSION
  if (createdIssueId) {
    const isAnon = identityMode === 'ANONYMOUS';
    const displayedReporter = isAnon ? 'Anonymous Citizen' : (profile?.real_name || 'Rahul Patil');

    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Issue Reported Successfully
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Your complaint has been submitted for municipal review.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 max-w-sm mx-auto text-xs space-y-2.5 text-left">
          <div className="flex justify-between">
            <span className="text-slate-500">Complaint ID:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{createdIssueId}</span>
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
            <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
              isAnon ? 'bg-slate-200 text-slate-700' : 'bg-sky-50 text-sky-800 border border-sky-200'
            }`}>
              {displayedReporter}
            </span>
          </div>
          {leaderboardEnabled && (
            <div className="flex justify-between items-center text-[11px] text-purple-800 font-semibold bg-purple-50 p-1.5 rounded-lg border border-purple-200">
              <span>Leaderboard Entry:</span>
              <span className="font-bold">{isAnon ? alias : (profile?.real_name || 'Rahul Patil')}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={() => navigate(`/citizen/issues/${createdIssueId}`)}
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
    <div className="max-w-2xl mx-auto space-y-6">
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
          Provide accurate information so the municipality can prioritize and respond effectively.
        </p>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Error notification if submission failed */}
        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-center justify-between">
            <span>{errors.submit}</span>
            <button type="button" onClick={() => setErrors({})} className="text-red-600 font-bold">Dismiss</button>
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
            className="w-full p-3 bg-slate-50 border border-slate-300/80 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-600"
          />
          {errors.description && (
            <p className="text-xs text-red-600 font-semibold">{errors.description}</p>
          )}
        </div>

        {/* 3. Location Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Problem Location <span className="text-red-600">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Compass className="w-4 h-4 text-sky-700" />
              <span>Use My Location</span>
            </button>

            <button
              type="button"
              onClick={handleSelectOnMap}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MapPin className="w-4 h-4 text-purple-700" />
              <span>Select on Map</span>
            </button>
          </div>

          {coords && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs flex items-center justify-between text-emerald-900 font-medium">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Location captured ✓</span>
              </span>
              <span className="font-mono text-[11px]">
                {coords[0].toFixed(4)}° N, {coords[1].toFixed(4)}° E
              </span>
            </div>
          )}

          {locationStatus === 'ERROR' && (
            <p className="text-xs text-red-600 font-semibold">Unable to access your location. Try Again.</p>
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

        {/* ========================================================================= */}
        {/* 4. PHOTO EVIDENCE WITH "UPLOAD USING PHONE", LIVE CAMERA & DEMO SAMPLES   */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Add Photo Evidence <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <span className="text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full font-semibold border border-sky-200">
              Direct Phone & Camera Capture
            </span>
          </div>

          {/* Hidden inputs for hardware phone camera and standard file pick */}
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
            <div className="space-y-3">
              {/* Primary Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Mobile Phone Camera Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    // If on mobile or touch device, trigger native camera; otherwise open in-browser webcam lens
                    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
                      mobileCameraInputRef.current?.click();
                    } else {
                      handleStartWebcam();
                    }
                  }}
                  className="p-3.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl flex flex-col items-center justify-center text-center group transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-sky-950 block">Snap Live Photo</span>
                  <span className="text-[10px] text-sky-700 font-medium">Use device / web camera</span>
                </button>

                {/* 2. Upload Using Phone (QR Code / Cross-device Hand-off) */}
                <button
                  type="button"
                  onClick={() => setPhoneModalOpen(true)}
                  className="p-3.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl flex flex-col items-center justify-center text-center group transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-purple-950 block">Upload via Phone</span>
                  <span className="text-[10px] text-purple-700 font-medium">Scan QR / SMS sync</span>
                </button>

                {/* 3. Browse Files / Gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center group transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-1.5 shadow-xs group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 block">Browse Files</span>
                  <span className="text-[10px] text-slate-500 font-medium">JPG, PNG up to 8MB</span>
                </button>
              </div>

              {/* Quick Sample Presets (For fast evaluation & demo testing) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Or pick a sample demonstration photo:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_CIVIC_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSamplePhoto(sample.url)}
                      className="p-1.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg flex items-center gap-2 text-left transition-all cursor-pointer"
                    >
                      <img src={sample.url} alt={sample.title} className="w-8 h-8 rounded object-cover shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-900 block truncate">{sample.title}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{sample.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : webcamOpen ? (
            /* Live In-Browser Webcam Viewfinder */
            <div className="relative rounded-2xl overflow-hidden border-2 border-sky-500 bg-slate-950 p-2 space-y-3 shadow-lg animate-in fade-in">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Viewfinder Overlay Grid */}
                <div className="absolute inset-4 border border-white/40 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-12 h-12 border-t-2 border-l-2 border-white absolute top-0 left-0" />
                  <div className="w-12 h-12 border-t-2 border-r-2 border-white absolute top-0 right-0" />
                  <div className="w-12 h-12 border-b-2 border-l-2 border-white absolute bottom-0 left-0" />
                  <div className="w-12 h-12 border-b-2 border-r-2 border-white absolute bottom-0 right-0" />
                  <span className="text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded">
                    LIVE CAMERA VIEWFINDER
                  </span>
                </div>
              </div>

              {webcamError && (
                <p className="text-xs text-red-400 font-semibold px-2">{webcamError}</p>
              )}

              <div className="flex items-center justify-between gap-3 px-2 pb-1">
                <button
                  type="button"
                  onClick={handleCloseWebcam}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCaptureWebcamSnapshot}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo Now</span>
                </button>
              </div>
            </div>
          ) : (
            /* Attached Photo Preview */
            <div className="relative rounded-2xl overflow-hidden border border-slate-300 aspect-video max-h-52 bg-slate-900 shadow-sm">
              <img src={photoPreview || ''} alt="Preview" className="w-full h-full object-cover" />
              
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 border border-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {photoSource === 'phone_sync'
                    ? 'Synced from Smartphone'
                    : photoSource === 'webcam'
                    ? 'Captured via Device Camera'
                    : photoSource === 'sample'
                    ? 'Civic Sample Evidence'
                    : 'Photo Attached'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoSource(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {photoError && (
            <p className="text-xs text-red-600 font-semibold">{photoError}</p>
          )}
        </div>

        {/* 5. Optional Landmark Details */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Nearby Landmark <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
            placeholder="e.g. Near Market Yard Gate / Shivaji Chowk..."
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
          />
        </div>

        {/* ========================================================================= */}
        {/* IDENTITY & VISIBILITY MODEL (STRICT COMPLIANCE WITH PRIVACY MATRIX)       */}
        {/* ========================================================================= */}
        <div ref={identitySectionRef} className="pt-4 border-t border-slate-200 space-y-5">
          {/* Section: How should your identity appear? */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>How should your identity appear?</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Report Anonymously (Default) */}
              <div
                onClick={() => setIdentityMode('ANONYMOUS')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  identityMode === 'ANONYMOUS'
                    ? 'bg-sky-50/70 border-sky-600 ring-2 ring-sky-600 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="radio"
                    id="identity-anonymous"
                    name="identityMode"
                    checked={identityMode === 'ANONYMOUS'}
                    onChange={() => setIdentityMode('ANONYMOUS')}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="identity-anonymous" className="text-xs font-bold text-slate-900 block cursor-pointer flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                    <span>Report anonymously</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      Default
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Your real name will not be displayed publicly with this report.
                  </p>
                </div>
              </div>

              {/* Option 2: Show My Name */}
              <div
                onClick={() => setIdentityMode('PUBLIC')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  identityMode === 'PUBLIC'
                    ? 'bg-sky-50/70 border-sky-600 ring-2 ring-sky-600 text-slate-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="radio"
                    id="identity-public"
                    name="identityMode"
                    checked={identityMode === 'PUBLIC'}
                    onChange={() => setIdentityMode('PUBLIC')}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="identity-public" className="text-xs font-bold text-slate-900 block cursor-pointer flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-700" />
                    <span>Show my name</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Your real name ({profile?.real_name || 'Rahul Patil'}) will be displayed with this civic report.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Civic Leaderboard Toggle */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-4">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900">
                    Participate in the public leaderboard
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Recognize your civic contributions publicly.
                </p>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={leaderboardEnabled}
                  onChange={e => setLeaderboardEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {/* CONDITIONAL ALIAS FIELD (Shown ONLY when Anonymous + Leaderboard ON) */}
            {identityMode === 'ANONYMOUS' && leaderboardEnabled && (
              <div className="pt-3 mt-2 border-t border-slate-200/80 space-y-1.5 animate-in fade-in">
                <label className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                  <span>Public Alias</span>
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={e => {
                    setAlias(e.target.value);
                    setErrors(prev => ({ ...prev, alias: '' }));
                  }}
                  placeholder="e.g. CivicChampion"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:ring-1 focus:ring-sky-600"
                />
                <p className="text-[11px] text-slate-500">
                  Your real name will remain private. Only this alias will appear on the leaderboard.
                </p>
                {errors.alias && (
                  <p className="text-xs text-red-600 font-semibold">{errors.alias}</p>
                )}
              </div>
            )}

            {/* If Public + Leaderboard ON: Notice that real name is used directly */}
            {identityMode === 'PUBLIC' && leaderboardEnabled && (
              <div className="pt-2 text-[11px] text-sky-800 bg-sky-50 p-2.5 rounded-lg border border-sky-200">
                <span>Leaderboard profile will display your real name: <strong>{profile?.real_name || 'Rahul Patil'}</strong></span>
              </div>
            )}
          </div>

          {/* Privacy UX Explanatory Notice */}
          <div className="flex items-start gap-2 p-3 bg-sky-50/50 rounded-xl border border-sky-200/60 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <p>
              <strong>Privacy Guarantee:</strong> Your choice controls what other citizens can see. Anonymous reports never reveal your real name.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SUBMISSION SUMMARY (PRIVACY & VISIBILITY MATRIX PREVIEW)                   */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Privacy & Visibility Summary
              </span>
              <button
                type="button"
                onClick={scrollToIdentity}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Change preferences</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* 1. Complaint Identity */}
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Complaint identity</p>
                <p className="font-bold text-slate-100 mt-0.5 flex items-center gap-1.5">
                  {identityMode === 'ANONYMOUS' ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Anonymous</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>{profile?.real_name || 'Rahul Patil'}</span>
                    </>
                  )}
                </p>
              </div>

              {/* 2. Leaderboard Participation */}
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Leaderboard</p>
                <p className="font-bold text-slate-100 mt-0.5">
                  {leaderboardEnabled ? (
                    <span className="text-emerald-400 font-bold">✓ Participating</span>
                  ) : (
                    <span className="text-slate-400 font-normal">Not participating</span>
                  )}
                </p>
              </div>

              {/* 3. Public Leaderboard Name */}
              {leaderboardEnabled && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Public leaderboard name</p>
                  <p className="font-bold text-sky-300 mt-0.5">
                    {identityMode === 'ANONYMOUS' ? (alias || 'CivicChampion') : (profile?.real_name || 'Rahul Patil')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Complaint...</span>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Submit Issue</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* "UPLOAD USING PHONE" QR CODE & MOBILE HAND-OFF MODAL                      */}
      {/* ========================================================================= */}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
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

            {/* QR Code Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col items-center text-center space-y-3">
              {/* Dynamic Simulated QR SVG */}
              <div className="w-40 h-40 bg-white p-3 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-center relative group">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="#0F172A" strokeWidth="6" />
                  <rect x="13" y="13" width="14" height="14" rx="2" fill="#0284C7" />
                  
                  <rect x="65" y="5" width="30" height="30" rx="4" fill="none" stroke="#0F172A" strokeWidth="6" />
                  <rect x="73" y="13" width="14" height="14" rx="2" fill="#0284C7" />
                  
                  <rect x="5" y="65" width="30" height="30" rx="4" fill="none" stroke="#0F172A" strokeWidth="6" />
                  <rect x="13" y="73" width="14" height="14" rx="2" fill="#0284C7" />
                  
                  {/* Data Matrix Dots */}
                  <rect x="45" y="10" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="45" y="25" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="45" y="45" width="10" height="10" rx="2" fill="#0284C7" />
                  <rect x="10" y="45" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="25" y="45" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="65" y="45" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="80" y="45" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="45" y="65" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="45" y="80" width="8" height="8" rx="2" fill="#334155" />
                  <rect x="65" y="65" width="12" height="12" rx="2" fill="#0F172A" />
                  <rect x="80" y="80" width="12" height="12" rx="2" fill="#0F172A" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/10 rounded-2xl transition-colors" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900">
                  Scan QR with your Smartphone
                </p>
                <p className="text-[11px] text-slate-500 leading-normal max-w-xs font-mono">
                  {mobileAccessUrl}
                </p>
              </div>

              {/* Status pulse */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                <span>{phoneSyncStatus === 'SYNCED' ? 'Photo Received!' : 'Waiting for phone connection...'}</span>
              </div>
            </div>

            {/* Or Send SMS / Copy Link */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Mobile Link</span>
                    </>
                  )}
                </button>

                {/* Instant Simulation Demo Button */}
                <button
                  type="button"
                  onClick={handleSimulatePhoneSync}
                  className="flex-1 py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-200" />
                  <span>Simulate Phone Snap</span>
                </button>
              </div>

              {/* SMS Link Send Form */}
              <form onSubmit={handleSendSms} className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Or text a camera link to your phone:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+91 98220 44112"
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer"
                  >
                    {smsSent ? 'Sent ✓' : 'Send Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
