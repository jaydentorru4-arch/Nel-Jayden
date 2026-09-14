import React from 'react';
import { LandingReport } from '../types';
import { soundEngine } from '../simulation/audio';

interface ReportProps {
  report: LandingReport;
  onRestart: () => void;
  onNewFlight: () => void;
}

export const FlightReportModal: React.FC<ReportProps> = ({ report, onRestart, onNewFlight }) => {
  const isCrash = report.rating === 'CRASH';

  const getRatingBadge = () => {
    switch (report.rating) {
      case 'BUTTER':
        return <span className="text-yellow-400 bg-yellow-950/60 border border-yellow-500 px-3 py-1 rounded-full font-extrabold text-sm">BUTTER SMOOTH! 5/5 STARS</span>;
      case 'EXCELLENT':
        return <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500 px-3 py-1 rounded-full font-extrabold text-sm">EXCELLENT LANDING! 4/5 STARS</span>;
      case 'GOOD':
        return <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-500 px-3 py-1 rounded-full font-extrabold text-sm">GOOD LANDING (AIRLINE STANDARD)</span>;
      case 'FIRM':
        return <span className="text-amber-400 bg-amber-950/60 border border-amber-500 px-3 py-1 rounded-full font-extrabold text-sm">FIRM TOUCHDOWN</span>;
      case 'HARD':
        return <span className="text-orange-500 bg-orange-950/60 border border-orange-500 px-3 py-1 rounded-full font-extrabold text-sm">HARD LANDING - INSPECTION REQUIRED</span>;
      case 'CRASH':
      default:
        return <span className="text-red-500 bg-red-950/80 border border-red-500 px-3 py-1 rounded-full font-extrabold text-sm animate-pulse">CATASTROPHIC IMPACT / CRASH</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-xl max-w-lg w-full p-5 shadow-2xl font-mono text-xs flex flex-col gap-4">
        {/* Title */}
        <div className="text-center border-b border-neutral-700 pb-3">
          <div className="text-lg font-black tracking-wider text-white mb-2">
            {isCrash ? 'FLIGHT TERMINATED: ACCIDENT REPORT' : 'FLIGHT DEBRIEF & TOUCHDOWN ANALYSIS'}
          </div>
          <div className="flex justify-center">{getRatingBadge()}</div>
        </div>

        {/* Narrative comments */}
        <div className={`p-3 rounded-lg border text-xs leading-relaxed ${isCrash ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-neutral-950 border-neutral-800 text-neutral-200'}`}>
          {report.comments}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
            <span className="text-[10px] text-neutral-400 font-semibold block">TOUCHDOWN SINK RATE:</span>
            <span className={`text-base font-bold ${Math.abs(report.touchdownRateFpm) > 600 ? 'text-red-400' : 'text-emerald-400'}`}>
              {Math.round(report.touchdownRateFpm)} <span className="text-xs text-neutral-400">FT/MIN</span>
            </span>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
            <span className="text-[10px] text-neutral-400 font-semibold block">MAX G-FORCE:</span>
            <span className="text-base font-bold text-white">
              {report.gForceMax.toFixed(2)} <span className="text-xs text-neutral-400">G</span>
            </span>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
            <span className="text-[10px] text-neutral-400 font-semibold block">AIRPORT & RUNWAY:</span>
            <span className="text-sm font-bold text-cyan-400">
              {report.airport} / {report.runway}
            </span>
          </div>

          <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
            <span className="text-[10px] text-neutral-400 font-semibold block">CENTERLINE DEVIATION:</span>
            <span className="text-sm font-bold text-white">
              {report.centerlineOffsetM.toFixed(1)} <span className="text-xs text-neutral-400">METERS</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 border-t border-neutral-800">
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg border border-neutral-600 transition-colors"
          >
            RETRY FLIGHT
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onNewFlight();
            }}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg transition-colors"
          >
            PLAN NEW ROUTE
          </button>
        </div>
      </div>
    </div>
  );
};
