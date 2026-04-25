import { useForm } from 'react-hook-form';
import type { TripInput } from '../types/trip';

interface TripFormProps {
  onSubmit: (data: TripInput) => void;
  loading: boolean;
}

export default function TripForm({ onSubmit, loading }: TripFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<TripInput>({
    defaultValues: { current_location: '', pickup_location: '', dropoff_location: '', current_cycle_used: 0 },
  });

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 rounded-lg p-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Trip Details</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Current Location</label>
          <input {...register('current_location', { required: 'Required' })} placeholder="e.g. Dallas, TX" className={inputClass} />
          {errors.current_location && <p className="text-red-500 text-xs mt-1">{errors.current_location.message}</p>}
        </div>

        <div className="relative">

          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Pickup Location
            </span>
          </label>
          <input {...register('pickup_location', { required: 'Required' })} placeholder="e.g. Oklahoma City, OK" className={inputClass} />
          {errors.pickup_location && <p className="text-red-500 text-xs mt-1">{errors.pickup_location.message}</p>}
        </div>

        <div className="relative">

          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Dropoff Location
            </span>
          </label>
          <input {...register('dropoff_location', { required: 'Required' })} placeholder="e.g. Denver, CO" className={inputClass} />
          {errors.dropoff_location && <p className="text-red-500 text-xs mt-1">{errors.dropoff_location.message}</p>}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Current Cycle Used</label>
          <div className="relative">
            <input
              type="number" step="0.5" min="0" max="70"
              {...register('current_cycle_used', {
                required: 'Required',
                min: { value: 0, message: 'Must be 0 or more' },
                max: { value: 70, message: 'Cannot exceed 70' },
                valueAsNumber: true,
              })}
              className={inputClass}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ 70 hrs</span>
          </div>
          {errors.current_cycle_used && <p className="text-red-500 text-xs mt-1">{errors.current_cycle_used.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            Calculating...
          </span>
        ) : 'Generate Trip Plan'}
      </button>
    </form>
  );
}
