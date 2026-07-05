"use client";

import { useState, useEffect, useCallback } from "react";

const CODE_SAMPLES = [
  'npm create ai-app',
  'const ai = new Assistant()',
  'ai.ask("debug this code")',
  'git push origin main',
  'npx tsc --noEmit',
  'curl -X POST /api/chat',
  'docker compose up -d',
  'pip install ai-tools',
];

const TYPING_SPEED = 60;
const DELETING_SPEED = 30;
const PAUSE_AFTER_TYPING = 1500;
const PAUSE_AFTER_DELETING = 400;

export function Typewriter() {
  const [displayText, setDisplayText] = useState("");
  const [sampleIndex, setSampleIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  const currentSample = CODE_SAMPLES[sampleIndex];

  useEffect(() => {
    if (phase === "typing") {
      if (displayText.length < currentSample.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentSample.slice(0, displayText.length + 1));
        }, TYPING_SPEED);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => setPhase("pausing"), PAUSE_AFTER_TYPING);
        return () => clearTimeout(timer);
      }
    }

    if (phase === "pausing") {
      const timer = setTimeout(() => setPhase("deleting"), 100);
      return () => clearTimeout(timer);
    }

    if (phase === "deleting") {
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, DELETING_SPEED);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setSampleIndex((prev) => (prev + 1) % CODE_SAMPLES.length);
          setPhase("typing");
        }, PAUSE_AFTER_DELETING);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, displayText, currentSample, sampleIndex]);

  return (
    <span>
      {displayText}<span className="animate-terminal-blink text-primary">▊</span>
    </span>
  );
}
