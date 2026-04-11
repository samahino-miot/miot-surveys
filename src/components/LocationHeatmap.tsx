import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { SurveyResponse } from '../store';
import pincodeData from '../data/pincodes.json';

// Local geocoding service using static dataset
const getLatLongFromPincode = (pincode: string): [number, number] | null => {
  const data = pincodeData as unknown as Record<string, [number, number]>;
  const coords = data[pincode];
  if (coords && coords.length === 2) {
    return [coords[0], coords[1]];
  }
  return null;
};

const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const heat = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

export const LocationHeatmap = ({ responses }: { responses: SurveyResponse[] }) => {
  const [points, setPoints] = useState<[number, number, number][]>([]);

  useEffect(() => {
    const pincodes = responses
      .map(r => r.answers?.pinCode as string)
      .filter(p => p && p.trim() !== '');

    const uniquePincodes = Array.from(new Set(pincodes));
    const counts: Record<string, number> = {};
    pincodes.forEach(p => counts[p] = (counts[p] || 0) + 1);

    const newPoints: [number, number, number][] = [];
    for (const pincode of uniquePincodes) {
      const coords = getLatLongFromPincode(pincode);
      if (coords) {
        newPoints.push([...coords, counts[pincode]] as [number, number, number]);
      }
    }
    setPoints(newPoints);
  }, [responses]);

  if (points.length === 0) return <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl text-slate-500">No location data available.</div>;

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-200">
      <MapContainer center={[13.0827, 80.2707] as [number, number]} zoom={12} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <HeatmapLayer points={points} />
      </MapContainer>
    </div>
  );
};
