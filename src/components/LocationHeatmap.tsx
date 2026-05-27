import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
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
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps) return;

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

      // 2. Second pass: map pincodes to local coordinates
      for (const key of Object.keys(locationCounts)) {
        const [pinCode] = key.split('-');
        
        const coords = getLatLongFromPincode(pinCode);
        if (coords) {
          const [lat, lng] = coords;
          newPoints.push([lat, lng, locationCounts[key]] as [number, number, number]);
        }
      }
      setPoints(newPoints);
    };

    processLocations();
  }, [responses, isLoaded]);

  useEffect(() => {
    if (!map || points.length === 0) return;

    try {
      const heatmapLayer = new HeatmapLayer({
        data: points.map(p => ({ position: [p[1], p[0]], weight: p[2] })),
        getPosition: (d: any) => d.position,
        getWeight: (d: any) => d.weight,
        radiusPixels: 30,
        intensity: 1,
        threshold: 0.05,
        colorRange: [
          [0, 0, 255],      // Blue (Cold)
          [0, 255, 255],    // Cyan
          [0, 255, 0],      // Green
          [255, 255, 0],    // Yellow
          [255, 0, 0]       // Red (Hot)
        ],
      });

      const overlay = new GoogleMapsOverlay({
        layers: [heatmapLayer],
      });

      overlay.setMap(map);

      return () => {
        overlay.setMap(null);
      };
    } catch (error) {
      console.error('Error setting up Deck.gl heatmap:', error);
      return;
    }
  }, [map, points]);

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