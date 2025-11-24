import React, { useState, useRef } from "react";

const Stopwatch = () => {
    const [time, setTime] = useState({ hr: 0, min: 0, sec: 0, milli: 0 });
    const [running, setRunning] = useState(false);

    // Purpose:
    // Keeps the setInterval ID so we can stop the timer with clearInterval().
    // Must NOT be stored in state, because updating state would re-render and restart the interval.
    // Why a ref?
    // ref persists across renders
    // ref does NOT trigger re-render
    // This makes it perfect for storing timer IDs.
    const intervalRef = useRef(null);

    // Purpose:
    // Stores the moment the timer started in Date.now().
    // Used to calculate elapsed time:
    // Why do we need this?
    // Because if the stopwatch is paused and resumed, you must not restart from zero — you need to compute from the original start time + saved elapsed time.
    const startTimeRef = useRef(null);

    // Purpose:
    // When you hit Stop, it stores the elapsed time so far.
    // When you hit Start again, the timer resumes from where it left.
    const savedElapsedRef = useRef(0);

    const start = () => {
        if (running) return; // prevent multiple intervals

        setRunning(true);

        // Mark when we started
        startTimeRef.current = Date.now() - savedElapsedRef.current;

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            updateTimeDisplay(elapsed);
        }, 10);
    };

    const stop = () => {
        if (!running) return;

        clearInterval(intervalRef.current);
        setRunning(false);

        // store elapsed time
        savedElapsedRef.current = Date.now() - startTimeRef.current;
    };

    const reset = () => {
        clearInterval(intervalRef.current);
        setRunning(false);

        savedElapsedRef.current = 0;
        startTimeRef.current = null;

        setTime({ hr: 0, min: 0, sec: 0, milli: 0 });
    };

    const updateTimeDisplay = (ms) => {
        let milli = Math.floor((ms % 1000) / 10);
        let sec = Math.floor((ms / 1000) % 60);
        let min = Math.floor((ms / (1000 * 60)) % 60);
        let hr = Math.floor(ms / (1000 * 60 * 60));

        setTime({ hr, min, sec, milli });
    };

    return (
        <div className="container">
            <h1>
                {time.hr.toString().padStart(2, "0")} :
                {time.min.toString().padStart(2, "0")} :
                {time.sec.toString().padStart(2, "0")} :
                {time.milli.toString().padStart(2, "0")}
            </h1>

            <div className="buttons">
                <button className="start" onClick={start} disabled={running}>
                    {running ? "Running..." : "Start"}
                </button>

                <button className="stop" onClick={stop} disabled={!running}>
                    Stop
                </button>

                <button className="reset" onClick={reset}>
                    Reset
                </button>
            </div>
        </div>
    );
};

export default Stopwatch;
