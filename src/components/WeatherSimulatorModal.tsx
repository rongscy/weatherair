import React from 'react';
import { X, CloudRain, Sun, Flame, Wind, Eye } from 'lucide-react';

export type WeatherSimulationMode = 'auto' | 'clear' | 'moderate' | 'unhealthy' | 'hazardous';

interface WeatherSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: WeatherSimulationMode;
  onSelectMode: (mode: WeatherSimulationMode) => void;
  actualPsi: number;
  actualPm25: number;
}

export const WeatherSimulatorModal: React.FC<WeatherSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  actualPsi,
  actualPm25,
}) => {
  if (!isOpen) return null;

  const presets = [
    {
      id: 'auto' as WeatherSimulationMode,
      name: 'Live NEA API Auto',
      icon: <Wind className="w-4 h-4 text-emerald-400" />,
      tag: 'Real-time',
      psiVal: actualPsi,
      pm25Val: actualPm25,
      description: 'Driven dynamically by current NEA API readings across Singapore.',
      visualEffect: actualPsi > 100 || actualPm25 > 55 ? 'Smog atmosphere active' : 'Clear atmosphere',
    },
    {
      id: 'clear' as WeatherSimulationMode,
      name: 'Clear Blue Sky',
      icon: <Sun className="w-4 h-4 text-sky-400" />,
      tag: 'Good (PSI ~30)',
      psiVal: 30,
      pm25Val: 12,
      description: 'High visibility (>10 km). Clear crisp skyline silhouette, minimal particulate scattering.',
      visualEffect: 'Deep midnight cerulean background, no smog',
    },
    {
      id: 'moderate' as WeatherSimulationMode,
      name: 'Moderate Haze',
      icon: <CloudRain className="w-4 h-4 text-amber-400" />,
      tag: 'Moderate (PSI ~75)',
      psiVal: 75,
      pm25Val: 48,
      description: 'Slight atmospheric turbidity (~7 km visibility). Subtle golden warmth in the upper air.',
      visualEffect: 'Soft amber ambient mist and gentle floating motes',
    },
    {
      id: 'unhealthy' as WeatherSimulationMode,
      name: 'Unhealthy Haze (Transboundary Smog)',
      icon: <Flame className="w-4 h-4 text-amber-500" />,
      tag: 'Unhealthy (PSI ~145)',
      psiVal: 145,
      pm25Val: 110,
      description: 'Noticeable smoke smell and lowered visibility (~3 km). Obscured skyline, warm ochre haze overlay.',
      visualEffect: 'Dense amber-ochre haze clouds, particulate aerosol drift, blurred skyline',
    },
    {
      id: 'hazardous' as WeatherSimulationMode,
      name: 'Hazardous Smog Emergency',
      icon: <Flame className="w-4 h-4 text-rose-500" />,
      tag: 'Hazardous (PSI ~320)',
      psiVal: 320,
      pm25Val: 290,
      description: 'Severe smoke plume (<1.5 km visibility). Heavy particulate occlusion, eerie crimson-brown sky.',
      visualEffect: 'Deep dark reddish smog haze, maximum particle density, heavily occluded skyline',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Weather & Haze Atmospheric Effect
              </h3>
              <p className="text-xs text-slate-400">
                Interactive background simulation & visibility engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The background interface dynamically responds to haze levels with procedural particulate aerosols, sky gradient shifts, and skyline visibility attenuation. Test different states below:
        </p>

        {/* Presets List */}
        <div className="space-y-2.5">
          {presets.map((preset) => {
            const isSelected = currentMode === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectMode(preset.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/80 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {preset.icon}
                    <span className="font-bold text-sm text-slate-100">{preset.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {preset.tag}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  {preset.description}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-amber-300/80 font-medium">
                  <span>Effect: {preset.visualEffect}</span>
                  {isSelected && <span className="text-emerald-400 font-bold">Active Mode ✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
