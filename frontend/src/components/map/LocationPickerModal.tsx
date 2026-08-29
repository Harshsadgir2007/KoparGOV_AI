import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Check, X, Navigation } from 'lucide-react';

// Fix for default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom High-Visibility Pin Marker
const pickerIcon = L.divIcon({
  className: 'custom-picker-pin',
  html: `
    <div style="
      background-color: #0284C7;
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #FFFFFF;
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    ">
      <div style="
        width: 14px;
        height: 14px;
        background-color: #FFFFFF;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export interface KopargaonLocationResult {
  coordinates: [number, number];
  ward: string;
  wardNumber: number;
  address: string;
  landmark: string;
}

// Preset Kopargaon municipal landmarks
export const KOPARGAON_LANDMARKS = [
  {
    name: 'Shivaji Chowk (Market Yard)',
    ward: 'Ward 5 - Shivaji Chowk',
    wardNumber: 5,
    coords: [19.8917, 74.4789] as [number, number],
    address: 'Near Old Market Yard Gate, Shivaji Chowk, Kopargaon',
  },
  {
    name: 'Tilak Road (Kanya Shala)',
    ward: 'Ward 1 - Gandhi Chowk',
    wardNumber: 1,
    coords: [19.8902, 74.4765] as [number, number],
    address: 'Opposite Kanya Shala, Tilak Road, Kopargaon',
  },
  {
    name: 'Station Road (Godavari Colony)',
    ward: 'Ward 2 - Station Road',
    wardNumber: 2,
    coords: [19.8885, 74.4820] as [number, number],
    address: 'Near Railway Station Approach Road, Godavari Colony, Kopargaon',
  },
  {
    name: 'Subhash Nagar (Health Center)',
    ward: 'Ward 3 - Subhash Road',
    wardNumber: 3,
    coords: [19.8942, 74.4721] as [number, number],
    address: 'Near Municipal Dispensary & Health Post, Subhash Road, Kopargaon',
  },
  {
    name: 'Sai Nagar (Shirdi Highway)',
    ward: 'Ward 4 - Sai Nagar',
    wardNumber: 4,
    coords: [19.8850, 74.4740] as [number, number],
    address: 'Near Shirdi-Kopargaon Highway Junction, Sai Nagar, Kopargaon',
  },
  {
    name: 'Ambedkar Nagar (Samata Path)',
    ward: 'Ward 6 - Ambedkar Nagar',
    wardNumber: 6,
    coords: [19.8965, 74.4690] as [number, number],
    address: 'Near Samata Community Hall, Ambedkar Nagar, Kopargaon',
  },
  {
    name: 'MIDC Industrial Bypass',
    ward: 'Ward 7 - Industrial Area',
    wardNumber: 7,
    coords: [19.8810, 74.4870] as [number, number],
    address: 'Near Industrial Estate Sub-Station, MIDC Bypass, Kopargaon',
  },
];

// Offline Geocoding Engine
export function resolveKopargaonAddress(lat: number, lng: number): KopargaonLocationResult {
  let closest = KOPARGAON_LANDMARKS[0];
  let minDistance = Number.MAX_VALUE;

  for (const lm of KOPARGAON_LANDMARKS) {
    const d = Math.hypot(lat - lm.coords[0], lng - lm.coords[1]);
    if (d < minDistance) {
      minDistance = d;
      closest = lm;
    }
  }

  const formattedAddress = `${closest.address} (GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

  return {
    coordinates: [lat, lng],
    ward: closest.ward,
    wardNumber: closest.wardNumber,
    address: formattedAddress,
    landmark: closest.name,
  };
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoords?: [number, number] | null;
  onSelectLocation: (result: KopargaonLocationResult) => void;
}

// Controller component to fix modal sizing and handle click events
const MapController: React.FC<{
  coords: [number, number];
  onMapClick: (lat: number, lng: number) => void;
}> = ({ coords, onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size immediately and with small delays so tiles load properly in modal
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    map.setView(coords, map.getZoom(), { animate: true });
  }, [coords, map]);

  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialCoords,
  onSelectLocation,
}) => {
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(
    initialCoords || [19.8917, 74.4789]
  );
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (initialCoords) {
      setCurrentCoords(initialCoords);
    }
  }, [initialCoords, isOpen]);

  const resolved = useMemo(
    () => resolveKopargaonAddress(currentCoords[0], currentCoords[1]),
    [currentCoords]
  );

  if (!isOpen) return null;

  const handleMapClick = (lat: number, lng: number) => {
    setCurrentCoords([lat, lng]);
  };

  const handleSelectPreset = (landmark: typeof KOPARGAON_LANDMARKS[0]) => {
    setCurrentCoords(landmark.coords);
  };

  const handleUseDeviceGps = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setCurrentCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          setIsLocating(false);
          setCurrentCoords([19.8917, 74.4789]);
        },
        { timeout: 5000 }
      );
    }
  };

  const handleConfirm = () => {
    onSelectLocation(resolved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Select Exact Location on Kopargaon Map
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tap or drag anywhere on the map to pin your civic issue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Kopargaon Landmarks Quick Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap mr-1">
            Quick Landmarks:
          </span>
          {KOPARGAON_LANDMARKS.slice(0, 5).map((lm) => (
            <button
              key={lm.name}
              type="button"
              onClick={() => handleSelectPreset(lm)}
              className={`px-2.5 py-1 rounded-lg border font-bold whitespace-nowrap text-[11px] transition-colors cursor-pointer shadow-2xs ${
                resolved.landmark === lm.name
                  ? 'bg-sky-600 text-white border-sky-700'
                  : 'bg-white border-slate-200 hover:border-sky-400 text-slate-700 hover:bg-sky-50'
              }`}
            >
              {lm.name.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* Interactive Leaflet Map Area with Explicit Height */}
        <div className="relative w-full h-[360px] sm:h-[400px] bg-slate-200 shrink-0">
          <MapContainer
            center={currentCoords}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', minHeight: '360px' }}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController coords={currentCoords} onMapClick={handleMapClick} />
            <Marker
              position={currentCoords}
              icon={pickerIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  setCurrentCoords([pos.lat, pos.lng]);
                },
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-slate-900 font-bold block">{resolved.landmark}</strong>
                  <span className="text-sky-700 font-semibold">{resolved.ward}</span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Floating Device GPS button */}
          <button
            type="button"
            onClick={handleUseDeviceGps}
            disabled={isLocating}
            className="absolute bottom-4 right-4 z-[400] px-3 py-2 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Navigation className={`w-3.5 h-3.5 text-sky-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting...' : 'My GPS'}</span>
          </button>
        </div>

        {/* Selected Location Summary Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                {resolved.ward}
              </span>
              <span className="text-xs font-bold text-slate-900 truncate">
                {resolved.landmark}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-md">
              {resolved.address}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
