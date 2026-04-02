/**
 * useTimer.js
 *
 * Calls `recordSession` (from AppContext) instead of `addSessionToday` directly.
 * recordSession handles both localStorage and API persistence.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export const FOCUS_SECS      = 25 * 60;
export const BREAK_SECS      = 5  * 60;
export const LONG_BREAK_SECS = 10 * 60;
export const RING_CIRC       = 2 * Math.PI * 140; // r=140

function pad(n) { return String(n).padStart(2, '0'); }
export function formatTime(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; }

export function useTimer({ userEmail, goals, onSessionComplete, recordSession }) {
  const [seconds,   setSeconds]   = useState(FOCUS_SECS);
  const [isRunning, setIsRunning] = useState(false);
  const [phase,     setPhase]     = useState('focus'); // 'focus' | 'break'
  const intervalRef = useRef(null);

  const breakDuration = goals?.remind === 'long' ? LONG_BREAK_SECS : BREAK_SECS;
  const totalSeconds  = phase === 'focus' ? FOCUS_SECS : breakDuration;
  const progress      = 1 - seconds / totalSeconds;
  const ringOffset    = RING_CIRC * (1 - progress);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
  }, []);

  const start = useCallback(() => { setIsRunning(true); }, []);
  const pause = useCallback(() => { stop(); }, [stop]);

  const reset = useCallback(() => {
    stop();
    setPhase('focus');
    setSeconds(FOCUS_SECS);
  }, [stop]);

  const skip = useCallback(() => {
    stop();
    setPhase(p => {
      const next = p === 'focus' ? 'break' : 'focus';
      setSeconds(next === 'focus' ? FOCUS_SECS : breakDuration);
      return next;
    });
  }, [stop, breakDuration]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          if (phase === 'focus') {
            // Record the session (API + localStorage)
            if (userEmail && recordSession) recordSession(userEmail);
            onSessionComplete?.();
            setTimeout(() => {
              setPhase('break');
              setSeconds(breakDuration);
              if (goals?.remind === 'gentle') setIsRunning(true);
            }, 500);
          } else {
            setPhase('focus');
            setSeconds(FOCUS_SECS);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, userEmail, breakDuration, goals?.remind, onSessionComplete, recordSession]);

  return { seconds, isRunning, phase, progress, ringOffset, totalSeconds, start, pause, reset, skip };
}