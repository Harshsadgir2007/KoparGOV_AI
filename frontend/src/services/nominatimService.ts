/**
 * OpenStreetMap Nominatim Reverse Geocoding Service.
 * Converts [latitude, longitude] coordinates to human-readable address with
 * a robust offline fallback to Kopargaon ward boundaries and landmarks.
 */

import { resolveKopargaonAddress } from '../components/map/LocationPickerModal';

export interface ReverseGeocodeResult {
  displayName: string;
  road?: string;
  suburb?: string;
  city?: string;
  ward: string;
  source: 'NOMINATIM' | 'LOCAL_INDEX';
}

// In-memory cache to prevent hitting OSM rate limits
const geocodeCache = new Map<string, ReverseGeocodeResult>();

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Attempt Nominatim reverse geocoding with a short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KoparGov-AI-CivicIntelligence/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const localFallback = resolveKopargaonAddress(lat, lng);

      const result: ReverseGeocodeResult = {
        displayName: data.display_name || localFallback.address,
        road: addr.road || addr.pedestrian || addr.footway || localFallback.landmark,
        suburb: addr.suburb || addr.neighbourhood || localFallback.ward,
        city: addr.city || addr.town || 'Kopargaon',
        ward: localFallback.ward,
        source: 'NOMINATIM',
      };

      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    // Network offline or timeout -> use local Kopargaon geometry resolution
  }

  // Graceful fallback to deterministic local Kopargaon ward and landmark index
  const localRes = resolveKopargaonAddress(lat, lng);
  const fallbackResult: ReverseGeocodeResult = {
    displayName: `${localRes.landmark}, ${localRes.ward}, Kopargaon`,
    road: localRes.landmark,
    suburb: localRes.ward,
    city: 'Kopargaon',
    ward: localRes.ward,
    source: 'LOCAL_INDEX',
  };

  geocodeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}
