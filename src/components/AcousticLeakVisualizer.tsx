import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ShieldAlert, Radio } from 'lucide-react';

interface AcousticLeakVisualizerProps {
  terminalTheme: 'emerald' | 'crimson';
  isAlarmActive: boolean;
  leakType: 'pressure' | 'temperature' | null;
  onDismissAlarm: () => void;
  addLog: (msg: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const AcousticLeakVisualizer: React.FC<AcousticLeakVisualizerProps> = ({
  terminalTheme,
  isAlarmActive,
  leakType,
  onDismissAlarm,
  addLog
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isListeningNominal, setIsListeningNominal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Synthesizer node refs to dynamically update sounds
  const rumbleOscRef = useRef<OscillatorNode | null>(null);
  const rumbleGainRef = useRef<GainNode | null>(null);
  const whistleOscRef = useRef<OscillatorNode | null>(null);
  const whistleGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Theme settings
  const themeColors = {
    emerald: {
      primary: 'rgb(16, 185, 129)',
      primaryLight: 'rgba(16, 185, 129, 0.25)',
      primaryDeep: 'rgba(2, 44, 30, 0.5)',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/5',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
    },
    crimson: {
      primary: 'rgb(239, 68, 68)',
      primaryLight: 'rgba(239, 68, 68, 0.25)',
      primaryDeep: 'rgba(67, 12, 12, 0.5)',
      text: 'text-red-400',
      border: 'border-red-500/20',
      bg: 'bg-red-950/5',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]'
    }
  };

  const colors = themeColors[terminalTheme] || themeColors.emerald;

  // Cleanup Web Audio Context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Initialize Audio Environment (lazy loaded on user interaction to abide by browser play restrictions)
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      // 1. Create Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // 2. Add main AnalyserNode
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // 3. Create Master Gain Node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGainRef.current = masterGain;

      // Connect nodes
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      // 4. Create continuous low-frequency mud fluid rumble oscillator
      const rumbleOsc = ctx.createOscillator();
      rumbleOsc.type = 'sawtooth';
      rumbleOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A

      // Low pass filter to make it a muddy fluid rumble sounds
      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(140, ctx.currentTime);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.0, ctx.currentTime); // silent initially

      rumbleOsc.connect(lpFilter);
      lpFilter.connect(rumbleGain);
      rumbleGain.connect(masterGain);

      rumbleOsc.start();
      rumbleOscRef.current = rumbleOsc;
      rumbleGainRef.current = rumbleGain;

      // 5. Create high-frequency venting whistle (gas decompression leak) oscillator
      const whistleOsc = ctx.createOscillator();
      whistleOsc.type = 'sine';
      whistleOsc.frequency.setValueAtTime(4500, ctx.currentTime); // Squealing leak frequency

      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.setValueAtTime(3000, ctx.currentTime);

      const whistleGain = ctx.createGain();
      whistleGain.gain.setValueAtTime(0.0, ctx.currentTime);

      whistleOsc.connect(hpFilter);
      hpFilter.connect(whistleGain);
      whistleGain.connect(masterGain);

      whistleOsc.start();
      whistleOscRef.current = whistleOsc;
      whistleGainRef.current = whistleGain;

      // 6. Create simulated white noise stream for venting sound using legacy ScriptProcessor (fully supported & reliable fallback in general containers)
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0, ctx.currentTime);

      try {
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoiseSource = ctx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1800, ctx.currentTime);
        noiseFilter.Q.setValueAtTime(1.5, ctx.currentTime);

        whiteNoiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        whiteNoiseSource.start();
      } catch (err) {
        console.warn('Advanced white noise generation skipped, using oscillator components', err);
      }

      // Keep white noise gain node reference in whistle gain or handle separately
      // For simplicity, we just use oscillators to build awesome downhole telemetry warning and flow signals

      addLog('Acoustic Downhole Hydrophone Probe initialized successfully.', 'success');
    } catch (e: any) {
      console.error(e);
      addLog(`Failed to configure downhole hydrophone hardware: ${e.message}`, 'error');
    }
  };

  // Toggle sensor listening state
  const handleToggleMute = async () => {
    // Lazy initialize the audio system on first click
    if (!audioCtxRef.current) {
      initAudio();
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (isMuted) {
      // Resume audio context if browser suspended it
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Smooth unmute transition
      masterGainRef.current?.gain.setTargetAtTime(0.45, ctx.currentTime, 0.1);
      setIsMuted(false);
      addLog('Hydrophone audio telemetry feed ONLINE (sensory audio gates open).', 'info');
    } else {
      // Smooth mute transition
      masterGainRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      setIsMuted(true);
      addLog('Hydrophone audio telemetry feed MUTED (sensory audio gates closed).', 'warning');
    }
  };

  // Activate a 10s manual diagnostic probe listen test
  const handleListenNominal = async () => {
    if (!audioCtxRef.current) {
      initAudio();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (isMuted) {
      masterGainRef.current?.gain.setTargetAtTime(0.45, ctx.currentTime, 0.1);
      setIsMuted(false);
    }

    setIsListeningNominal(true);
    addLog('Acoustic listen diagnostic trigger: auditing downhole hydraulic flow hum...', 'info');

    // Smoothly kick the background rumble
    const now = ctx.currentTime;
    rumbleGainRef.current?.gain.setTargetAtTime(0.35, now, 0.3);
    whistleGainRef.current?.gain.setTargetAtTime(0.02, now, 0.25);

    // Stop after 6 seconds
    setTimeout(() => {
      setIsListeningNominal(false);
      if (audioCtxRef.current && !isAlarmActive) {
        const endNow = audioCtxRef.current.currentTime;
        rumbleGainRef.current?.gain.setTargetAtTime(0.0, endNow, 0.5);
        whistleGainRef.current?.gain.setTargetAtTime(0.0, endNow, 0.5);
        addLog('Diagnostic acoustic audit complete. Fluid hum dampening.', 'success');
      }
    }, 6000);
  };

  // Dynamic sound synthesizer response to alarm conditions
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    if (isAlarmActive) {
      // Unmute instantly to provide prompt sensory alert if context is up
      if (isMuted) {
        masterGainRef.current?.gain.setTargetAtTime(0.6, now, 0.02);
        setIsMuted(false);
      }

      if (leakType === 'pressure') {
        // High-stress hydraulic kick: massive, low-frequency pulsated rhythmic booming
        rumbleGainRef.current?.gain.setTargetAtTime(0.6, now, 0.1);
        rumbleOscRef.current?.frequency.setTargetAtTime(80, now, 0.1);

        // Slow periodic pulse
        whistleGainRef.current?.gain.setTargetAtTime(0.05, now, 0.1);
        whistleOscRef.current?.frequency.setValueAtTime(1000, now);
      } else {
        // Joule-Thomson Cryogenic expansion: high-pitched decompression squealing/hissing!
        whistleGainRef.current?.gain.setTargetAtTime(0.5, now, 0.15);
        whistleOscRef.current?.frequency.setValueAtTime(5200, now);
        
        // Moderate roaring rumble
        rumbleGainRef.current?.gain.setTargetAtTime(0.2, now, 0.1);
        rumbleOscRef.current?.frequency.setTargetAtTime(65, now, 0.15);
      }
    } else if (!isListeningNominal) {
      // Return to quiet state
      rumbleGainRef.current?.gain.setTargetAtTime(0.0, now, 0.8);
      whistleGainRef.current?.gain.setTargetAtTime(0.0, now, 0.8);
    }
  }, [isAlarmActive, leakType, isListeningNominal]);

  // Rhythm oscillator sweep effects for alarms
  useEffect(() => {
    let timer: any;
    let tick = 0;

    const triggerSirenWave = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || !isAlarmActive) return;

      const now = ctx.currentTime;
      tick++;

      if (leakType === 'pressure') {
        // Pulse low rumble pitch between 55Hz and 110Hz to mimic mechanical stress shockwaves
        const targetFreq = tick % 2 === 0 ? 95 : 45;
        rumbleOscRef.current?.frequency.setTargetAtTime(targetFreq, now, 0.2);
        
        // Rhythmic alarm synth beeps
        if (tick % 2 === 0) {
          whistleGainRef.current?.gain.setTargetAtTime(0.4, now, 0.05);
          whistleOscRef.current?.frequency.setValueAtTime(880, now); // standard diagnostic alarm chime (High A)
        } else {
          whistleGainRef.current?.gain.setTargetAtTime(0.01, now, 0.09);
        }
      } else {
        // Decompression whistling screams
        // Sweep frequency up and down like a venting gas decompression valve
        const targetFreqWhistle = 4500 + Math.sin(tick * 0.8) * 1200;
        whistleOscRef.current?.frequency.setTargetAtTime(targetFreqWhistle, now, 0.1);
      }

      timer = setTimeout(triggerSirenWave, 350);
    };

    if (isAlarmActive) {
      triggerSirenWave();
    } else {
      if (audioCtxRef.current) {
        // restore nominal pitch
        const now = audioCtxRef.current.currentTime;
        rumbleOscRef.current?.frequency.setTargetAtTime(55, now, 0.5);
        whistleOscRef.current?.frequency.setTargetAtTime(4500, now, 0.5);
      }
    }

    return () => clearTimeout(timer);
  }, [isAlarmActive, leakType]);

  // Canvas spectrogram / audio-frequency loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctxGrid = canvas.getContext('2d');
    if (!ctxGrid) return;

    // Fluid auto scaling
    const scaleCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = 95 * (window.devicePixelRatio || 1);
    };
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);

    // Dynamic frequency synthesis buffer data
    const frequencyData = new Uint8Array(128);

    const render = () => {
      animationId = requestAnimationFrame(render);
      
      const width = canvas.width;
      const height = canvas.height;
      const nowMs = Date.now();
      
      // Clear black background
      ctxGrid.fillStyle = '#020617';
      ctxGrid.fillRect(0, 0, width, height);

      // Draw horizontal decibel grids and background scope
      ctxGrid.strokeStyle = 'rgba(51, 65, 85, 0.18)';
      ctxGrid.lineWidth = 1;
      
      const gridRows = 4;
      for (let i = 1; i < gridRows; i++) {
        const y = (height / gridRows) * i;
        ctxGrid.beginPath();
        ctxGrid.moveTo(0, y);
        ctxGrid.lineTo(width, y);
        ctxGrid.stroke();

        // Add small high-tech diagnostic marks
        ctxGrid.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctxGrid.font = '7px monospace';
        ctxGrid.fillText(`-${i * 24} dB`, 5, y - 2);
      }

      // Vertical frequencies grids mapping
      const gridCols = 8;
      for (let i = 1; i < gridCols; i++) {
        const x = (width / gridCols) * i;
        ctxGrid.beginPath();
        ctxGrid.moveTo(x, 0);
        ctxGrid.lineTo(x, height);
        ctxGrid.stroke();

        ctxGrid.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctxGrid.font = '7px monospace';
        const rawKhz = ((i * 24000) / gridCols) / 1000;
        ctxGrid.fillText(`${rawKhz.toFixed(1)} kHz`, x + 3, height - 4);
      }

      // Read real-world byte frequency data if audio is active and playing
      if (analyserRef.current && !isMuted) {
        analyserRef.current.getByteFrequencyData(frequencyData);
      } else {
        // Procedural simulation if muted/idle or context is loading!
        // This guarantees gorgeous, silky-smooth live physics waveforms showing signal rates anyway!
        for (let i = 0; i < frequencyData.length; i++) {
          let baseAmplitude = 5;

          if (isAlarmActive) {
            if (leakType === 'pressure') {
              // Low frequency pulsing focus
              const harmonicPulse1 = Math.abs(Math.sin(nowMs * 0.006 + i * 0.12)) * 140;
              const subBass = Math.exp(-Math.pow((i - 8) / 12, 2)) * 110;
              const flicker = Math.random() * 20;
              baseAmplitude += Math.max(0, harmonicPulse1 + subBass + flicker - i * 0.8);
            } else {
              // High frequency hissing sweeping focus
              const sweepCenter = 85 + Math.sin(nowMs * 0.0051) * 35;
              const jetVentNoise = Math.exp(-Math.pow((i - sweepCenter) / 18, 2)) * 195;
              const bassGrumble = Math.exp(-Math.pow((i - 4) / 4, 2)) * 55;
              const jitter = Math.random() * 32;
              baseAmplitude += Math.max(0, jetVentNoise + bassGrumble + jitter - i * 0.5);
            }
          } else if (isListeningNominal) {
            // General background flow fluid hum (focused on very low sub bass & trace hiss)
            const fluidHum = Math.exp(-Math.pow((i - 6) / 5, 2)) * 65;
            const flowNoise = Math.sin(nowMs * 0.002 + i * 0.4) * 20;
            const jitter = Math.random() * 10;
            baseAmplitude += Math.max(0, fluidHum + flowNoise + jitter - i * 0.3);
          } else {
            // Idle background thermal electronic chatter (very minor noise)
            const therm = Math.abs(Math.sin(nowMs * 0.0012 + i * 1.5)) * 11;
            const noise = Math.random() * 5;
            baseAmplitude += therm + noise - i * 0.05;
          }

          frequencyData[i] = Math.min(255, Math.max(0, baseAmplitude));
        }
      }

      // Draw frequency spectrum graph
      const barCount = Math.min(frequencyData.length, 90);
      const barWidth = (width / barCount);
      const renderColor = colors.primary;

      for (let i = 0; i < barCount; i++) {
        const val = frequencyData[i];
        const percent = val / 255;
        const bHeight = height * percent;
        const x = i * barWidth;
        const y = height - bHeight;

        // Draw double layer gradient columns
        const gradient = ctxGrid.createLinearGradient(x, height, x, y);
        if (isAlarmActive) {
          // Dynamic flash alarm color
          gradient.addColorStop(0, '#f43f5e'); // Rose
          gradient.addColorStop(0.5, '#f59e0b'); // Amber
          gradient.addColorStop(1, '#ffffff'); // White tip
        } else {
          gradient.addColorStop(0, renderColor);
          gradient.addColorStop(0.7, colors.primaryLight);
          gradient.addColorStop(1, 'rgba(255,255,255,0.7)');
        }

        ctxGrid.fillStyle = gradient;
        ctxGrid.fillRect(x + 1, y, barWidth - 2, bHeight);

        // Subtly outline peak dots
        if (val > 15) {
          ctxGrid.fillStyle = isAlarmActive ? '#ffffff' : renderColor;
          ctxGrid.fillRect(x + 1, Math.max(0, y - 1.5), barWidth - 2, 1.5);
        }
      }

      // Draw high-intensity warning signal if alarm is tripped
      if (isAlarmActive) {
        ctxGrid.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctxGrid.lineWidth = 1.5;
        ctxGrid.beginPath();
        // Superimpose an oscilloscope sine overlay across the monitor to represent "Acoustic Overdrive Leakage"
        const waveSpeed = nowMs * 0.021;
        for (let x = 0; x < width; x += 4) {
          const sineY = (height / 2) + Math.sin(x * 0.04 - waveSpeed) * (20 + Math.sin(nowMs * 0.005) * 12);
          if (x === 0) ctxGrid.moveTo(x, sineY);
          else ctxGrid.lineTo(x, sineY);
        }
        ctxGrid.stroke();

        // Warning Overlay Text
        ctxGrid.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctxGrid.fillRect(0, 0, width, height);

        ctxGrid.fillStyle = '#ffffff';
        ctxGrid.font = 'bold 8px monospace';
        ctxGrid.fillText('ACOUSTIC ANOMALY SEVERITY GATE CLOSED // HARMONIC LEAK INTENSITY', 10, 16);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', scaleCanvas);
    };
  }, [colors, isAlarmActive, leakType, isMuted, isListeningNominal]);

  return (
    <div className={`border ${isAlarmActive ? 'border-red-500 animate-pulse bg-red-950/10' : colors.border} bg-[#020617] rounded p-2.5 flex flex-col gap-2 transition-all duration-300 relative overflow-hidden ${isAlarmActive ? 'shadow-[0_0_20px_rgba(239,68,68,0.25)]' : colors.glow}`} id="acoustic-signal-visualizer">
      {/* Background High-Tech Watermark */}
      <div className="absolute right-2 bottom-1 pointer-events-none opacity-5 font-mono text-[42px] font-black tracking-widest select-none">
        SONAR v4.2
      </div>

      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio className={`w-3.5 h-3.5 ${isAlarmActive ? 'text-red-500 animate-ping' : colors.text}`} />
          <span className={`font-mono text-[9px] font-bold uppercase tracking-wider truncate text-white`}>
            Acoustic Signal Frequency Analyzer
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAlarmActive && (
            <button
              type="button"
              onClick={onDismissAlarm}
              className="bg-red-950/60 border border-red-500/40 hover:border-red-400 text-red-400 hover:bg-red-950/80 text-[7.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Acknowledge and silence auditory alert sirens"
            >
              Mute Alarm Sirens
            </button>
          )}

          <button
            type="button"
            onClick={handleListenNominal}
            disabled={isAlarmActive || isListeningNominal}
            className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold tracking-wider transition-all uppercase ${
              isListeningNominal
                ? 'bg-amber-500/20 border border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600/50 cursor-pointer'
            }`}
            title="Conduct a 6-second diagnostic audio scan of structural borehole fluids"
          >
            {isListeningNominal ? 'SCANNING...' : 'DIAGNOSTIC PROBE'}
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-1 rounded cursor-pointer transition-all border ${
              isMuted 
                ? 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300' 
                : `${colors.bg} border-transparent ${colors.text}`
            }`}
            title={isMuted ? 'Unmute downhole hydrophone fluid listeners' : 'Mute downhole hydrophone fluid listeners'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-orange-400 animate-pulse" />}
          </button>
        </div>
      </div>

      {/* Primary Spectrogram Canvas Container */}
      <div className="relative border border-zinc-950 bg-black/60 rounded overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="w-full h-[95px] block cursor-crosshair"
          title="Downhole acoustic signal frequency trace matrix"
        />

        {/* Warning Indicator overlays */}
        {isAlarmActive && (
          <div className="absolute right-3 top-3 flex items-center gap-1 bg-red-950/80 border border-red-500/40 rounded px-1.5 py-0.5 pointer-events-none">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            <span className="font-mono text-[7px] font-black text-red-400 uppercase tracking-widest leading-none">
              {leakType === 'pressure' ? 'HYDRAULIC SHOCK OVERPRESSURE' : 'THERMAL VENT COOLING DECOMPRESSION'}
            </span>
          </div>
        )}
      </div>

      {/* Hydrophone Spec Label Footers */}
      <div className="flex items-center justify-between font-mono text-[7.5px] uppercase text-zinc-500 z-10">
        <div className="flex items-center gap-1.5">
          <span>PROBE STATUS:</span>
          <span className={`font-black ${isAlarmActive ? 'text-red-400' : isListeningNominal ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`}>
            {isAlarmActive ? 'ALARM OVERDRIVE' : isListeningNominal ? 'DIAGNOSTIC HEAR' : 'NOMINAL FLOW LISTEN'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>SAMPLING: <strong className="text-zinc-400">48 kSps</strong></span>
          <span>SENSITIVITY: <strong className="text-zinc-400">-120 dBV/µPa</strong></span>
        </div>
      </div>
    </div>
  );
};
