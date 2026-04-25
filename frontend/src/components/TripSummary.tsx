import type { TripResult } from '../types/trip';

interface TripSummaryProps {
  trip: TripResult;
}

export default function TripSummary({ trip }: TripSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-green-100 rounded-lg p-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Trip Summary</h2>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard value={trip.total_distance_miles.toLocaleString()} unit="miles" label="Total Distance" color="blue" />
        <StatCard value={trip.total_driving_hours.toString()} unit="hrs" label="Driving Time" color="green" />
        <StatCard value={trip.total_trip_days.toString()} unit={trip.total_trip_days === 1 ? 'day' : 'days'} label="Trip Duration" color="purple" />
        <StatCard value={(70 - trip.current_cycle_used).toString()} unit="hrs" label="Cycle Remaining" color="orange" />
      </div>

      {/* Route & Stops */}
      <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Route Stops</h3>
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

        <div className="space-y-3">
          {trip.stops.map((stop, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 ${getStopBg(stop.type)}`}>
                {getStopIcon(stop.type)}
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{stop.remark}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stop.location?.display_name || 'En route'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-600">{formatTime(stop.arrival_time)}</p>
                    <p className="text-xs text-slate-400">{stop.duration_hours}h</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, unit, label, color }: { value: string; unit: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <p className="text-2xl font-bold">{value} <span className="text-sm font-normal opacity-70">{unit}</span></p>
      <p className="text-xs mt-1 opacity-70">{label}</p>
    </div>
  );
}

function getStopBg(type: string): string {
  const map: Record<string, string> = {
    pre_trip: 'bg-slate-200',
    pickup: 'bg-blue-500',
    dropoff: 'bg-purple-500',
    fuel: 'bg-yellow-400',
    rest_break: 'bg-orange-400',
    overnight_rest: 'bg-red-500',
  };
  return map[type] || 'bg-slate-300';
}

function getStopIcon(type: string): JSX.Element {
  const cls = "w-3.5 h-3.5 text-white";
  switch (type) {
    case 'pickup':
    case 'dropoff':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
    case 'fuel':
      return <span className="text-xs font-bold text-white">F</span>;
    case 'rest_break':
      return <span className="text-xs font-bold text-white">R</span>;
    case 'overnight_rest':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
    default:
      return <span className="w-2 h-2 bg-white rounded-full"></span>;
  }
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
