import { useState, useEffect, useCallback, useRef } from "react";

function useExecution(lastMessage) {
  const [frames, setFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(500);
  const playRef = useRef(null);

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "frame":
        setFrames((prev) => [...prev, lastMessage]);
        if (lastMessage.stdout) {
          setOutput(lastMessage.stdout);
        }
        break;
      case "compile_error":
        setError(lastMessage.message);
        setStatus("error");
        break;
      case "error":
        setError(lastMessage.message);
        setStatus("error");
        break;
      case "execution_start":
        setStatus("running");
        break;
      case "execution_complete":
        setStatus("complete");
        break;
      case "end":
        if (status === "running") {
          setStatus("complete");
        }
        break;
      case "stdout":
        setOutput(lastMessage.output);
        break;
      case "start":
        break;
      default:
        break;
    }
  }, [lastMessage]);

  useEffect(() => {
    if (status === "complete" && frames.length > 0 && currentStep === 0) {
      setCurrentStep(1);
      setIsPlaying(true);
    }
  }, [status, frames.length, currentStep]);

  useEffect(() => {
    clearInterval(playRef.current);

    if (isPlaying && frames.length > 0) {
      playRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= frames.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    }

    return () => clearInterval(playRef.current);
  }, [isPlaying, frames.length, playSpeed]);

  const execute = useCallback(async (code, sessionId) => {
    setFrames([]);
    setCurrentStep(0);
    setOutput("");
    setError(null);
    setStatus("running");
    setIsPlaying(false);

    try {
      const resp = await fetch("http://localhost:3001/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, sessionId }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || "Execution failed");
        setStatus("error");
      }
    } catch (e) {
      setError("Failed to connect to server");
      setStatus("error");
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, frames.length));
  }, [frames.length]);

  const stepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(frames.length > 0 ? 1 : 0);
  }, [frames.length]);

  return {
    frames,
    currentStep,
    setCurrentStep,
    status,
    output,
    error,
    execute,
    isPlaying,
    togglePlay,
    stepForward,
    stepBackward,
    reset,
    playSpeed,
    setPlaySpeed,
  };
}

export default useExecution;
