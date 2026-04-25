import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import * as polylineCodec from '@mapbox/polyline';
import type { TripResult } from '../types/trip';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  trip: TripResult;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

const STOP_COLORS: Record<string, string> = {
  pre_trip: '#94a3b8',
  pickup: '#3b82f6',
  dropoff: '#a855f7',
  fuel: '#eab308',
  rest_break: '#f97316',
  overnight_rest: '#ef4444',
};

export default function RouteMap({ trip }: RouteMapProps) {
  const positions = polylineCodec.decode(trip.route_data.polyline) as [number, number][];

  // Build markers from all stops that have locations
  const markers = trip.stops
    .filter(s => s.location && s.location.lat && s.location.lng)
    .map(s => ({
      pos: [s.location!.lat, s.location!.lng] as [number, number],
      color: STOP_COLORS[s.type] || '#94a3b8',
      label: s.remark,
      name: s.location!.display_name || '',
      duration: s.duration_hours,
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 pb-0 flex items-center gap-3">
        <div className="bg-indigo-100 rounded-lg p-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Route Map</h2>
      </div>

      <div className="p-5">
        <MapContainer
          center={positions[0] || [39.8283, -98.5795]}
          zoom={5}
          style={{ height: '450px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={positions} color="#3b82f6" weight={4} opacity={0.7} />
          <FitBounds positions={positions} />

          {markers.map((m, i) => (
            <CircleMarker key={i} center={m.pos} radius={9} color="white" weight={2} fillColor={m.color} fillOpacity={1}>
              <Popup>
                <div className="text-sm">
                  <strong>{m.label}</strong><br />
                  <span className="text-gray-500">{m.name}</span><br />
                  <span className="text-gray-400">Duration: {m.duration}h</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
          {[
            { color: 'bg-green-500', label: 'Start' },
            { color: 'bg-blue-500', label: 'Pickup' },
            { color: 'bg-yellow-400', label: 'Fuel' },
            { color: 'bg-orange-400', label: 'Rest Break' },
            { color: 'bg-red-500', label: 'Overnight' },
            { color: 'bg-purple-500', label: 'Dropoff' },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
