import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { SurveyResponse } from '../store';
import pincodeData from '../data/pincodes.json';

const getLatLongFromPincode = (pincode: string): [number, number] | null => {
  const data = pincodeData as unknown as Record<string, [number, number]>;
  const coords = data[pincode];
  if (coords && coords.length === 2) {
    return [coords[0], coords[1]];
  }
  return null;
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 13.0827,
  lng: 80.2707,
};

export const LocationHeatmap = ({ responses }: { responses: SurveyResponse[] }) => {
  const [points, setPoints] = useState<[number, number, number][]>([]);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['visualization', 'geocoding']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const heatmapLayer = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const geocoder = new google.maps.Geocoder();
    const processLocations = async () => {
      const newPoints: [number, number, number][] = [];
      const locationCounts: Record<string, number> = {};

      // 1. First pass: count locations (Pincode + City + Country)
      responses.forEach(r => {
        const { pinCode, city, country } = r.answers || {};
        if (pinCode && city && country) {
          const key = `${pinCode}-${city}-${country}`;
          locationCounts[key] = (locationCounts[key] || 0) + 1;
        }
      });

      // 2. Second pass: geocode unique locations
      for (const key of Object.keys(locationCounts)) {
        const [pinCode, city, country] = key.split('-');
        
        // Try local JSON first for speed
        const localCoords = getLatLongFromPincode(pinCode);
        if (localCoords) {
          newPoints.push([...localCoords, locationCounts[key]] as [number, number, number]);
          continue;
        }

        // Fallback to Google Geocoder
        try {
          const result = await geocoder.geocode({ address: `${pinCode}, ${city}, ${country}` });
          if (result.results && result.results[0]) {
            const { lat, lng } = result.results[0].geometry.location;
            newPoints.push([lat(), lng(), locationCounts[key]] as [number, number, number]);
          }
        } catch (e) {
          console.error("Geocoding failed for:", key, e);
        }
      }
      setPoints(newPoints);
    };

    processLocations();
  }, [responses, isLoaded]);

  useEffect(() => {
    if (map && isLoaded && points.length > 0) {
      if (heatmapLayer.current) {
        heatmapLayer.current.setMap(null);
      }
      
      const heatmapPoints = points.map(p => ({
        location: new google.maps.LatLng(p[0], p[1]),
        weight: p[2]
      }));

      heatmapLayer.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapPoints as any,
        map: map,
        radius: 40,
        opacity: 0.8
      });
    }
  }, [map, isLoaded, points]);

  if (!isLoaded) return <div className="h-96 w-full flex items-center justify-center bg-slate-50 rounded-xl text-slate-500">Loading Map...</div>;
  if (points.length === 0) return <div className="h-96 w-full flex items-center justify-center bg-slate-50 rounded-xl text-slate-500">No location data available.</div>;

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-200">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={(map) => setMap(map)}
      />
    </div>
  );
};
