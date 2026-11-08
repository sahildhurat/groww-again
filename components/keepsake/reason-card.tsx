"use client";

import React, { useEffect, useState } from "react";
import { PenLine, Mic, Trash2 } from "lucide-react";
import { VoicePlayer, VoiceRecorder } from "./voice-recorder";
import { useKeepsakeTick } from "./use-keepsake";
import { deleteReason, formatSeconds, getReason, saveReason, type ReasonRecord } from "@/lib/keepsake";

// Version B: "Why I started" in the investor's own words, written or recorded. No AI, stays on this device.
// When the SIP is stopped or the latest instalment failed, it folds away so it never reads as guilt; the investor
// can still choose to show it.
export function ReasonCard({ folded }: { folded: boolean }) {
  const tick = useKeepsakeTick();
  const [reason, setReason] = useState<ReasonRecord | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showFolded, setShowFolded] = useState(false);
  const [mode, setMode] = useState<"write" | "record">("write");
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<{ blob: Blob; sec: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReason().then((r) => {
      setReason(r);
      setLoaded(true);
    });
  }, [tick]);

  const openEditor = (m: "write" | "record") => {
    setMode(m);
    setText(reason?.text ?? "");
    setVoice(null);
    setError(null);
    setEditing(true);
  };

  const save = async () => {
    setError(null);
    if (mode === "write" && !text.trim()) {
      setError("Write a line first, or record a voice note instead.");
      return;
    }
    if (mode === "record" && !voice) {
      setError("Record a voice note first, or write a line instead.");
      return;
    }
    try {
      await saveReason(
        mode === "write"
          ? { text, voice: reason?.voice, voiceSec: reason?.voiceSec }
          : { text: reason?.text, voice: voice!.blob, voiceSec: voice!.sec }
      );
      setEditing(false);
    } catch {
      setError("This couldn't be saved on this device. Try again.");
    }
  };

  if (!loaded) return null;
  const has = Boolean(reason && (reason.text || reason.voice));

  // Next to a stop or a failed instalment, don't invite: nothing here should read as guilt.
  if (folded && !has && !editing) return null;

  if (folded && has && !showFolded && !editing) {
    return (
      <div className="flex items-center justify-between text-xs text-gray-600" data-testid="reason-card">
        <span>Your reason for starting is saved.</span>
        <button type="button" onClick={() => setShowFolded(true)} className="underline font-medium text-purple-800">
          Show
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="reason-card">
      {has && !editing && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-gray-500">Why I started</p>
          {reason?.text && (
            <p className="text-sm text-gray-900 italic" data-testid="reason-text">
              &ldquo;{reason.text}&rdquo;
            </p>
          )}
          {reason?.voice && (
            <VoicePlayer blob={reason.voice} label={`Voice note · ${formatSeconds(reason.voiceSec)}`} />
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
            <button type="button" onClick={() => openEditor("write")} className="text-xs font-medium text-purple-800 underline">
              {reason?.text ? "Edit the line" : "Add a line"}
            </button>
            <button type="button" onClick={() => openEditor("record")} className="text-xs font-medium text-purple-800 underline">
              {reason?.voice ? "Record again" : "Add a voice note"}
            </button>
            <button
              type="button"
              onClick={() => deleteReason()}
              className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {!has && !editing && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-700">
            Why did you start this SIP? Keep it in your own words, for your future self.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openEditor("write")}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-medium text-purple-800"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Write why you started</span>
            </button>
            <button
              type="button"
              onClick={() => openEditor("record")}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-medium text-purple-800"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record it</span>
            </button>
          </div>
        </div>
      )}

      {editing && (
        <div className="space-y-2 p-3 bg-white rounded-xl border border-purple-200">
          <p className="text-xs font-semibold text-gray-900">Why I started</p>
          {mode === "write" ? (
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              maxLength={280}
              rows={3}
              aria-label="Why I started"
              placeholder="For my first bike, without a loan"
              className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          ) : (
            <VoiceRecorder
              onRecorded={(blob, sec) => {
                setVoice(blob ? { blob, sec } : null);
                setError(null);
              }}
            />
          )}
          <p className="text-[11px] text-gray-500">Stays on this device. No AI reads it.</p>
          {error && <p className="text-[11px] text-amber-800">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
