"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

const SOUNDTRACK_SRC = "/audio/bob-dylan-knockin-on-heavens-door.mp3";
const SOUNDTRACK_VOLUME = 0.28;

type PlaybackState = "missing" | "paused" | "playing" | "blocked";

let soundtrackAudio: HTMLAudioElement | null = null;

function getSoundtrackAudio() {
  if (typeof Audio === "undefined") return null;
  if (!soundtrackAudio) {
    soundtrackAudio = new Audio(SOUNDTRACK_SRC);
    soundtrackAudio.preload = "auto";
    soundtrackAudio.loop = true;
    soundtrackAudio.volume = SOUNDTRACK_VOLUME;
  }
  return soundtrackAudio;
}

interface BackgroundSoundtrackProps {
  disabled?: boolean;
  className?: string;
}

export default function BackgroundSoundtrack({
  disabled = false,
  className = "",
}: BackgroundSoundtrackProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = useState(false);
  const [playbackState, setPlaybackState] =
    useState<PlaybackState>("missing");

  const attemptPlay = useCallback(() => {
    const audio = audioRef.current ?? getSoundtrackAudio();
    audioRef.current = audio;
    if (!audio || disabled) return;

    void audio.play().catch(() => {
      setPlaybackState("blocked");
    });
  }, [disabled]);

  useEffect(() => {
    let cancelled = false;

    fetch(SOUNDTRACK_SRC, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!cancelled && response.ok) {
          setAvailable(true);
        }
      })
      .catch(() => {
        // The soundtrack is optional until the local MP3 is added.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = SOUNDTRACK_VOLUME;
    audio.loop = true;
  }, [available]);

  useEffect(() => {
    if (!available) return;
    const audio = getSoundtrackAudio();
    audioRef.current = audio;
    if (!audio) return;

    const handleCanPlay = () => {
      setPlaybackState((state) => (state === "missing" ? "paused" : state));
    };
    const handlePlaying = () => setPlaybackState("playing");
    const handlePause = () => setPlaybackState("paused");
    const handleError = () => setAvailable(false);

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    const syncTimer = window.setTimeout(() => {
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        handleCanPlay();
      }
      if (!audio.paused) {
        setPlaybackState("playing");
      }
    }, 0);

    return () => {
      window.clearTimeout(syncTimer);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [available]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || disabled) return;

    const unlockPlayback = () => {
      if (audio.paused) attemptPlay();
    };

    attemptPlay();
    window.addEventListener("pointerdown", unlockPlayback, { once: true });
    window.addEventListener("keydown", unlockPlayback, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("keydown", unlockPlayback);
    };
  }, [attemptPlay, available, disabled]);

  useEffect(() => {
    if (disabled) {
      audioRef.current?.pause();
    }
  }, [disabled]);

  const togglePlayback = () => {
    const audio = audioRef.current ?? getSoundtrackAudio();
    audioRef.current = audio;
    if (!audio) return;

    if (audio.paused) {
      attemptPlay();
    } else {
      audio.pause();
    }
  };

  if (!available) return null;

  const isPlaying = playbackState === "playing";
  const isBlocked = playbackState === "blocked";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
        title={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
        className={`flex h-8 items-center gap-1.5 rounded border px-2.5 text-data-mono text-[10px] uppercase tracking-widest backdrop-blur transition-colors ${
          isBlocked
            ? "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
            : "border-white/15 bg-surface-container-low/60 text-stone-300 hover:border-primary/40 hover:text-primary"
        }`}
      >
        {isPlaying ? (
          <Pause size={14} strokeWidth={1.75} />
        ) : (
          <Play size={14} strokeWidth={1.75} />
        )}
        {isPlaying ? (
          <Volume2 size={14} strokeWidth={1.75} />
        ) : (
          <VolumeX size={14} strokeWidth={1.75} />
        )}
        <span className="text-data-mono text-[10px] uppercase tracking-widest">
          {isBlocked ? "Start soundtrack" : "Dylan"}
        </span>
      </button>
    </div>
  );
}
