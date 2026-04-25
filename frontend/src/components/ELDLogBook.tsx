import { useState } from 'react';
import type { ELDLog } from '../types/trip';
import ELDLogSheet from './ELDLogSheet';

interface ELDLogBookProps {
  logs: ELDLog[];
}

export default function ELDLogBook({ logs }: ELDLogBookProps) {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-amber-100 rounded-lg p-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">ELD Daily Log Sheets</h2>
          <p className="text-xs text-slate-400">FMCSA-compliant driver's daily log</p>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 mb-5 border-b border-slate-200 pb-3">
        {logs.map((log, i) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
              activeDay === i
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Day {i + 1}
            <span className={`block text-xs mt-0.5 ${activeDay === i ? 'text-slate-300' : 'text-slate-400'}`}>
              {log.date}
            </span>
          </button>
        ))}
      </div>

      {/* Log sheet */}
      <div className="border-2 border-slate-300 rounded-lg p-2 bg-white overflow-x-auto">
        <ELDLogSheet log={logs[activeDay]} />
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-4 gap-3 mt-5">
        <SummaryCard label="Off Duty" value={logs[activeDay].totals.off_duty} color="slate" />
        <SummaryCard label="Sleeper Berth" value={logs[activeDay].totals.sleeper_berth} color="red" />
        <SummaryCard label="Driving" value={logs[activeDay].totals.driving} color="blue" />
        <SummaryCard label="On Duty (ND)" value={logs[activeDay].totals.on_duty_not_driving} color="amber" />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`rounded-lg p-3 text-center border ${colors[color]}`}>
      <p className="text-xl font-bold">{value.toFixed(1)}<span className="text-xs font-normal ml-0.5">h</span></p>
      <p className="text-xs mt-0.5 opacity-70">{label}</p>
    </div>
  );
}
