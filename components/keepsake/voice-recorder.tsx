"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw } from "lucide-react";
import { formatSeconds } from "@/lib/keepsake";

// Records a voice note of up to 60 seconds in the browser. Nothing is uploaded or transcribed.
export function VoiceRecorder({
  onRecorded,
  maxSec = 60,
}: {
  onRecorded: (blob: Blob | null, seconds: number) => void;
  maxSec?: number;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secRef = useRef(0);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    setRecording(false);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime =
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        onRecorded(blob, Math.max(1, secRef.current));
      };
      rec.start();
      recRef.current = rec;
      secRef.current = 0;
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        secRef.current += 1;
        setSeconds(secRef.current);
        if (secRef.current >= maxSec) stop();
      }, 1000);
    } catch {
      setError("Microphone access wasn't allowed. You can write a line instead.");
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    onRecorded(null, 0);
  };

  return (
    <div className="space-y-2" data-testid="voice-recorder">
      {!recording && !previewUrl && (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800 hover:bg-gray-50"
        >
          <Mic className="w-3.5 h-3.5 text-purple-700" />
          <span>Record a voice note (up to {maxSec} seconds)</span>
        </button>
      )}
      {recording && (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 text-xs text-gray-800">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>Recording {formatSeconds(seconds)}</span>
          </span>
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-800"
          >
            <Square className="w-3 h-3" />
            <span>Stop</span>
          </button>
        </div>
      )}
      {!recording && previewUrl && (
        <div className="space-y-1.5">
          <audio controls src={previewUrl} className="w-full h-9" />
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center space-x-1 text-[11px] text-gray-600 underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Record again</span>
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-amber-800">{error}</p>}
    </div>
  );
}

/** Plays a stored voice note (a Blob from the keepsake store). */
export function VoicePlayer({ blob, label }: { blob: Blob; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return null;
  return (
    <div className="space-y-1">
      {label && <p className="text-[11px] text-gray-500">{label}</p>}
      <audio controls src={url} className="w-full h-9" data-testid="voice-player" />
    </div>
  );
}
