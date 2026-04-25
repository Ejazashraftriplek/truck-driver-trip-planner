import { useState } from 'react';
import TripForm from './components/TripForm';
import TripSummary from './components/TripSummary';
import RouteMap from './components/RouteMap';
import ELDLogBook from './components/ELDLogBook';
import { createTrip } from './api/tripApi';
import type { TripInput, TripResult } from './types/trip';

function App() {
  const [trip, setTrip] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: TripInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createTrip(data);
      setTrip(result);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Something went wrong. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="bg-blue-500 rounded-lg p-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">TruckRoute Pro</h1>
            <p className="text-slate-400 text-sm">HOS-Compliant Trip Planning & ELD Log Generation</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar - Form */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-8">
              <TripForm onSubmit={handleSubmit} loading={loading} />
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex gap-2">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right content - Results */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            {loading && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-slate-600 text-lg">Calculating optimal route...</p>
                <p className="text-slate-400 text-sm mt-1">Applying HOS regulations & generating ELD logs</p>
              </div>
            )}

            {!trip && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
                <div className="text-slate-300 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-slate-500 text-lg font-medium">Plan Your Route</p>
                <p className="text-slate-400 text-sm mt-1">Enter trip details to generate your HOS-compliant route and ELD logs</p>
              </div>
            )}

            {trip && !loading && (
              <>
                <TripSummary trip={trip} />
                <RouteMap trip={trip} />
                <ELDLogBook logs={trip.eld_logs} />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 text-center py-4 text-sm mt-12">
        FMCSA Hours of Service Compliant | Property Carrier | 70hr/8day Cycle
      </footer>
    </div>
  );
}

export default App;
