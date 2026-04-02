import { useRef, useCallback } from 'react';

const SOUND_CONFIGS = {
  rain:   { type: 'highpass', freq: 900, Q: 1   },
  cafe:   { type: 'bandpass', freq: 400, Q: 0.5 },
  forest: { type: 'lowpass',  freq: 600, Q: 1   },
  waves:  { type: 'lowpass',  freq: 250, Q: 0.3 },
};

export function useAmbientSound() {
  const ctxRef   = useRef(null);
  const nodesRef = useRef({});

  const stopAll = useCallback(() => {
    Object.values(nodesRef.current).forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = {};
  }, []);

  const play = useCallback((id, volume = 0.5) => {
    stopAll();
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const bufSize = 2 * ctx.sampleRate;
      const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data    = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop   = true;

      const filter = ctx.createBiquadFilter();
      const cfg = SOUND_CONFIGS[id];
      filter.type            = cfg.type;
      filter.frequency.value = cfg.freq;
      filter.Q.value         = cfg.Q;

      const gain = ctx.createGain();
      gain.gain.value = volume * 0.12;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      nodesRef.current = { source, gain };
      return true;
    } catch (e) {
      console.warn('Audio error:', e);
      return false;
    }
  }, [stopAll]);

  const setVolume = useCallback((v) => {
    if (nodesRef.current.gain) {
      nodesRef.current.gain.gain.value = parseFloat(v) * 0.12;
    }
  }, []);

  return { play, stopAll, setVolume };
}
