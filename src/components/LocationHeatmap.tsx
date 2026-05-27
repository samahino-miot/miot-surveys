import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, MarkerClusterer } from '@react-google-maps/api';
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

    const geocoder = new window.google.maps.Geocoder();
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
      const geocodeLocation = (address: string): Promise<any | null> => {
        return new Promise((resolve) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              resolve(results[0]);
            } else {
              resolve(null);
            }
          });
        });
      };

      for (const key of Object.keys(locationCounts)) {
        const [pinCode, city, country] = key.split('-');
        
        // Always use Google Geocoder
        try {
          const result = await geocodeLocation(`${pinCode}, ${city}, ${country}`);
          if (result) {
            const lat = result.geometry.location.lat();
            const lng = result.geometry.location.lng();
            newPoints.push([lat, lng, locationCounts[key]] as [number, number, number]);
          }
        } catch (e) {
          console.error('--- Geocoding error ---', e);
        }
      }
      setPoints(newPoints);
    };

    processLocations();
  }, [responses, isLoaded]);

  if (!isLoaded) return <div className="h-96 w-full flex items-center justify-center bg-slate-50 rounded-xl text-slate-500">Loading Map...</div>;
  if (points.length === 0) return <div className="h-96 w-full flex items-center justify-center bg-slate-50 rounded-xl text-slate-500">No location data available.</div>;

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-200">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={(map) => setMap(map)}
      >
        <MarkerClusterer>
          {(clusterer) =>
            points.map((p, i) => (
              <Marker key={i} position={{ lat: p[0], lng: p[1] }} clusterer={clusterer} />
            ))
          }
        </MarkerClusterer>
      </GoogleMap>
    </div>
  );
};
