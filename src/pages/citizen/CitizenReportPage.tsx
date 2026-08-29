import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { citizenService } from '../../services/citizenService';
import { CivicCategory } from '../../types';
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

  // Form Fields State
  const [selectedCategory, setSelectedCategory] = useState<CivicCategory | ''>('');
  const [description, setDescription] = useState('');
  const [selectedWard, setSelectedWard] = useState('Ward 5 - Shivaji Chowk');
  const [landmark, setLandmark] = useState('');

  // Location State
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<'IDLE' | 'LOCATING' | 'CAPTURED' | 'ERROR'>('IDLE');

  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Form Validation & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null);

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
          // Fallback to Kopargaon town coordinates
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
    // Fast mock map point selection
    setCoords([19.8930, 74.4760]);
    setLocationStatus('CAPTURED');
    setErrors(prev => ({ ...prev, location: '' }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Image size exceeds 5MB. Try Again.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.onerror = () => {
        setPhotoError('Unable to add this photo. Try Again.');
      };
      reader.readAsDataURL(file);
    }
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
      });

      setIsSubmitting(false);
      setCreatedIssueId(created.id);
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ submit: "We couldn't submit your complaint. Try Again." });
    }
  };

  // 11. SUCCESS SCREEN AFTER SUBMISSION
  if (createdIssueId) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Issue Reported Successfully
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Your complaint has been submitted for municipal review.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-xs space-y-2 text-left">
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
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">REPORTED</span>
          </div>
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
      {/* 4. Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/citizen"
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Public Redressal Form
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Report a Civic Problem
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Provide accurate information so the municipality can respond effectively.
        </p>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Error notification if submission failed */}
        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-center justify-between">
            <span>{errors.submit}</span>
            <button type="button" onClick={() => setErrors({})} className="text-red-600 font-bold">Dismiss</button>
          </div>
        )}

        {/* 5. Category Selector */}
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

        {/* 6. Description Textarea */}
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

        {/* 7. Location Section */}
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

          {/* Location Captured Status */}
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

        {/* 8. Photo Upload & Preview */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
            Add Photo Evidence <span className="text-slate-400 font-normal">(Optional)</span>
          </label>

          {!photoPreview ? (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl bg-slate-50 cursor-pointer transition-colors">
              <Camera className="w-8 h-8 text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-700">Take Photo or Upload Image</span>
              <span className="text-[10px] text-slate-400">JPG, PNG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-300 aspect-video max-h-48 bg-slate-100">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          )}

          {photoError && (
            <p className="text-xs text-red-600 font-semibold">{photoError}</p>
          )}
        </div>

        {/* 9. Optional Landmark Details */}
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

        {/* 11. Submit Button */}
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
    </div>
  );
};
