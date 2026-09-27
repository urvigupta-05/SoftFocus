/**
 * useTimer.js
 *
 * Calls `recordSession` (from AppContext) instead of `addSessionToday` directly.
 * Supports customizable preset durations (25/5, 45/15, 50/10).
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export const RING_CIRC = 2 * Math.PI * 140; // r=140

function pad(n) { return String(n).padStart(2, '0'); }
export function formatTime(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

export function useTimer({ userEmail, goals, onSessionComplete, recordSession }) {
  const [preset, setPresetState]  = useState('25-5'); // '25-5' | '45-15' | '50-10'
  const [focusSecs, setFocusSecs] = useState(25 * 60);
  const [breakSecs, setBreakSecs] = useState(5 * 60);

  const [seconds,   setSeconds]   = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [phase,     setPhase]     = useState('focus'); // 'focus' | 'break'
  const intervalRef = useRef(null);

  const totalSeconds = phase === 'focus' ? focusSecs : breakSecs;
  const progress     = 1 - seconds / totalSeconds;
  const ringOffset   = RING_CIRC * (1 - progress);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const setPreset = useCallback((presetKey) => {
    stop();
    setPresetState(presetKey);
    let f = 25 * 60, b = 5 * 60;
    if (presetKey === '45-15') { f = 45 * 60; b = 15 * 60; }
    else if (presetKey === '50-10') { f = 50 * 60; b = 10 * 60; }
    setFocusSecs(f);
    setBreakSecs(b);
    setPhase('focus');
    setSeconds(f);
  }, [stop]);

  const start = useCallback(() => { setIsRunning(true); }, []);
  const pause = useCallback(() => { stop(); }, [stop]);

  const reset = useCallback(() => {
    stop();
    setPhase('focus');
    setSeconds(focusSecs);
  }, [stop, focusSecs]);

  const skip = useCallback(() => {
    stop();
    setPhase(p => {
      const next = p === 'focus' ? 'break' : 'focus';
      setSeconds(next === 'focus' ? focusSecs : breakSecs);
      return next;
    });
  }, [stop, focusSecs, breakSecs]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          if (phase === 'focus') {
            if (userEmail && recordSession) recordSession(userEmail);
            onSessionComplete?.();
            setTimeout(() => {
              setPhase('break');
              setSeconds(breakSecs);
              if (goals?.remind === 'gentle') setIsRunning(true);
            }, 500);
          } else {
            setPhase('focus');
            setSeconds(focusSecs);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, userEmail, breakSecs, focusSecs, goals?.remind, onSessionComplete, recordSession]);

  return { preset, setPreset, seconds, isRunning, phase, progress, ringOffset, totalSeconds, start, pause, reset, skip };
}