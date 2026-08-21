"use client";

import { useRef, useCallback, useEffect } from "react";

type SoundType =
  | "click"
  | "send"
  | "receive"
  | "error"
  | "success"
  | "copy"
  | "delete"
  | "toggle"
  | "hover"
  | "notification";

const soundFrequencies: Record<SoundType, { freq: number; type: OscillatorType; duration: number; volume: number }> = {
  click: { freq: 800, type: "sine", duration: 0.08, volume: 0.15 },
  send: { freq: 600, type: "sine", duration: 0.15, volume: 0.2 },
  receive: { freq: 400, type: "sine", duration: 0.2, volume: 0.15 },
  error: { freq: 200, type: "sawtooth", duration: 0.3, volume: 0.25 },
  success: { freq: 880, type: "sine", duration: 0.2, volume: 0.2 },
  copy: { freq: 1000, type: "triangle", duration: 0.1, volume: 0.15 },
  delete: { freq: 300, type: "square", duration: 0.15, volume: 0.2 },
  toggle: { freq: 500, type: "sine", duration: 0.1, volume: 0.12 },
  hover: { freq: 1200, type: "sine", duration: 0.05, volume: 0.08 },
  notification: { freq: 660, type: "sine", duration: 0.25, volume: 0.18 },
};

let audioContext: AudioContext | null = null;
let enabled = true;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(type: SoundType) {
  if (!enabled) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const { freq, type: waveType, duration, volume } = soundFrequencies[type];
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is not available
  }
}

export function useSound() {
  const play = useCallback((type: SoundType) => {
    playTone(type);
  }, []);

  return { play };
}

export function useSoundEffects() {
  const { play } = useSound();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, [role=button], input[type=submit], input[type=button]")) {
        play("click");
      }
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button:not(:disabled), a, [role=button]:not(:disabled)")) {
        play("hover");
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("mouseover", handleHover, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("mouseover", handleHover, true);
    };
  }, [play]);

  return { play };
}

export function enableSound() {
  enabled = true;
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
}

export function disableSound() {
  enabled = false;
}

export function isSoundEnabled() {
  return enabled;
}

export function playNotificationSound() {
  playTone("notification");
}

export function playSuccessSound() {
  playTone("success");
}

export function playErrorSound() {
  playTone("error");
}

export function playSendSound() {
  playTone("send");
}

export function playReceiveSound() {
  playTone("receive");
}

export function playCopySound() {
  playTone("copy");
}