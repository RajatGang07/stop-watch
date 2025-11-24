import React, { useEffect, useRef, useState } from "react";
import "./CountdownFromInputs.css";

export default function CountdownFromInputs() {
  // Inputs stored as strings so user can type freely
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [second, setSecond] = useState("");

  // timer state
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false); // true if paused after running
  const [display, setDisplay] = useState("00 : 00 : 00");

  // timers / refs
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);
  const remainingRef = useRef(0);

  // ---- Helpers ----
  // Normalize numerical h/m/s and update states (keeps inputs in normalized form)
  const normalizeAll = (h = hour, m = minute, s = second) => {
    const H = Math.max(0, Number(String(h).replace(/\D/g, "")) || 0);
    const M = Math.max(0, Number(String(m).replace(/\D/g, "")) || 0);
    const S = Math.max(0, Number(String(s).replace(/\D/g, "")) || 0);

    // convert everything into total seconds then derive normalized parts
    const totalSeconds = H * 3600 + M * 60 + S;
    const nh = Math.floor(totalSeconds / 3600);
    const nm = Math.floor((totalSeconds % 3600) / 60);
    const ns = totalSeconds % 60;

    setHour(String(nh));
    setMinute(String(nm));
    setSecond(String(ns));

    return { nh, nm, ns, totalMs: totalSeconds * 1000 };
  };

  // Format ms to "hh : mm : ss"
  const formatMs = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hrs)} : ${pad(mins)} : ${pad(secs)}`;
  };

  // get ms from current (normalized) inputs
  const inputsToMs = () => {
    const { totalMs } = normalizeAll(hour, minute, second); // normalize and get ms
    return totalMs;
  };

  // Tick: update display and stop when done
  const tick = () => {
    if (!endTimeRef.current) return;
    const remaining = Math.max(0, Math.round(endTimeRef.current - Date.now()));
    setDisplay(formatMs(remaining));

    if (remaining <= 0) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setRunning(false);
      setPaused(false);
      remainingRef.current = 0;
      // Optionally: beep or callback
    }
  };

  // ---- Controls ----
  const handleStart = () => {
    if (running) return;

    // if paused, resume from remainingRef
    if (paused && remainingRef.current > 0) {
      endTimeRef.current = Date.now() + remainingRef.current;
      setRunning(true);
      setPaused(false);
      tick();
      intervalRef.current = setInterval(tick, 250);
      return;
    }

    // new start: normalize inputs then start
    const totalMs = inputsToMs();
    if (totalMs <= 0) return; // nothing to start

    endTimeRef.current = Date.now() + totalMs;
    remainingRef.current = totalMs;
    setRunning(true);
    setPaused(false);
    tick();
    intervalRef.current = setInterval(tick, 250);
  };

  const handlePause = () => {
    if (!running) return;
    const remaining = Math.max(0, Math.round(endTimeRef.current - Date.now()));
    remainingRef.current = remaining;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setPaused(true);
    setDisplay(formatMs(remaining));
    // Also set inputs to normalized remaining so user can see/edit while paused
    const totalSeconds = Math.floor(remaining / 1000);
    const nh = Math.floor(totalSeconds / 3600);
    const nm = Math.floor((totalSeconds % 3600) / 60);
    const ns = totalSeconds % 60;
    setHour(String(nh));
    setMinute(String(nm));
    setSecond(String(ns));
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    endTimeRef.current = null;
    remainingRef.current = 0;
    setRunning(false);
    setPaused(false);
    setHour("");
    setMinute("");
    setSecond("");
    setDisplay("00 : 00 : 00");
  };

  // Sync display when editing inputs while timer is idle
  useEffect(() => {
    if (!running && !paused) {
      const { totalMs } = normalizeAll(hour, minute, second);
      setDisplay(formatMs(totalMs));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, second, running, paused]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ---- Input handlers with normalization while typing ----
  // When typing, compute new combined normalized value for immediate UX feedback
  const handleHourChange = (val) => {
    if (val === "") {
      setHour("");
      return;
    }
    const cleaned = val.replace(/\D/g, "");
    // cap hours at reasonable limit (e.g., 999)
    const num = Math.min(999, Number(cleaned || 0));
    // normalize using other fields as well
    const { nh } = normalizeAll(String(num), minute, second);
    // normalizeAll already sets states; but ensure hour reflects typed (or normalized) value
    setHour(String(nh));
  };

  const handleMinuteChange = (val) => {
    if (val === "") {
      setMinute("");
      return;
    }
    const cleaned = val.replace(/\D/g, "");
    const num = Number(cleaned || 0);
    // normalize all (this will carry `num` into hours if >=60)
    const { nm } = normalizeAll(hour, String(num), second);
    setMinute(String(nm));
  };

  const handleSecondChange = (val) => {
    if (val === "") {
      setSecond("");
      return;
    }
    const cleaned = val.replace(/\D/g, "");
    const num = Number(cleaned || 0);
    // normalize all (this will carry `num` into minutes/hours if >=60)
    const { ns } = normalizeAll(hour, minute, String(num));
    setSecond(String(ns));
  };

  return (
    <div className="countdown-root" role="application" aria-label="Countdown timer">
      <h2 className="countdown-title">Countdown Timer</h2>

      <div className="countdown-display" aria-live="polite">{display}</div>

      <div className="inputs-row">
        <div className="input-col">
          <label htmlFor="hour">Hour</label>
          <input
            id="hour"
            className="time-input"
            inputMode="numeric"
            value={hour}
            onChange={(e) => handleHourChange(e.target.value)}
            disabled={running}
            placeholder="0"
          />
        </div>

        <div className="input-col">
          <label htmlFor="min">Minute</label>
          <input
            id="min"
            className="time-input"
            inputMode="numeric"
            value={minute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            disabled={running}
            placeholder="0"
          />
        </div>

        <div className="input-col">
          <label htmlFor="sec">Second</label>
          <input
            id="sec"
            className="time-input"
            inputMode="numeric"
            value={second}
            onChange={(e) => handleSecondChange(e.target.value)}
            disabled={running}
            placeholder="0"
          />
        </div>
      </div>

      <div className="buttons-row">
        <button
          className="btn start-btn"
          onClick={handleStart}
          aria-pressed={running}
        >
          {!running && paused ? "Continue" : "Start"}
        </button>

        {running ? (
          <button className="btn pause-btn" onClick={handlePause}>
            Pause
          </button>
        ) : (
          <button className="btn placeholder-btn" aria-hidden style={{ visibility: "hidden" }}>
            Pause
          </button>
        )}

        <button className="btn reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
