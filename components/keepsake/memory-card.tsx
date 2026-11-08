"use client";

import React, { useEffect, useState } from "react";
import { Camera, Plus, Trash2, PenLine } from "lucide-react";
import { VoicePlayer, VoiceRecorder } from "./voice-recorder";
import { useKeepsakeTick } from "./use-keepsake";
import { compressImage } from "@/lib/image-compression";
import {
  blobToDataUrl,
  deleteMemory,
  formatSeconds,
  getMemory,
  hasContent,
  saveMemory,
  type MemoryRecord,
} from "@/lib/keepsake";

// Version B: one memory per month (a photo, a voice note and/or a line), kept as a promise or memory for the
// investor's future self. Invited gently only on months whose units were allotted; never prompted on failed,
// refunded, skipped or stopped months (the investor can still add one there). Stays on this device; no AI reads it.
export function MemoryCard({
  month,
  monthLabel,
  invite,
}: {
  month: string;
  monthLabel: string;
  invite: boolean;
}) {
  const tick = useKeepsakeTick();
  const [memory, setMemory] = useState<MemoryRecord | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();
  const [voice, setVoice] = useState<{ blob: Blob; sec: number } | undefined>();
  const [keepOldVoice, setKeepOldVoice] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(false);
    getMemory(month).then((m) => {
      setMemory(m);
      setLoaded(true);
    });
  }, [month, tick]);

  const openEditor = () => {
    setPhoto(memory?.photo);
    setVoice(undefined);
    setKeepOldVoice(true);
    setText(memory?.text ?? "");
    setError(null);
    setEditing(true);
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const out = await compressImage(file, 1280, 250 * 1024);
      setPhoto(await blobToDataUrl(out.blob));
    } catch {
      setError("That photo couldn't be read. Try a JPEG or PNG.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setError(null);
    const next = {
      month,
      photo,
      text,
      voice: voice?.blob ?? (keepOldVoice ? memory?.voice : undefined),
      voiceSec: voice?.sec ?? (keepOldVoice ? memory?.voiceSec : undefined),
    };
    if (!hasContent(next)) {
      setError("Add a photo, a voice note or a line first.");
      return;
    }
    try {
      await saveMemory(next);
      setEditing(false);
    } catch {
      setError("This couldn't be saved on this device. Try a smaller photo.");
    }
  };

  if (!loaded) return null;
  const has = hasContent(memory);

  return (
    <section
      className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm space-y-2.5"
      data-testid="memory-card"
    >
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Your memory for {monthLabel}</h2>

      {has && !editing && memory && (
        <div className="space-y-2">
          {memory.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={memory.photo}
              alt={`Your photo for ${monthLabel}`}
              className="w-full max-h-72 object-cover rounded-xl border border-gray-100"
              data-testid="memory-photo"
            />
          )}
          {memory.voice && <VoicePlayer blob={memory.voice} label={`Voice note · ${formatSeconds(memory.voiceSec)}`} />}
          {memory.text && (
            <p className="text-sm text-gray-900 italic" data-testid="memory-text">
              &ldquo;{memory.text}&rdquo;
            </p>
          )}
          <div className="flex gap-4 pt-0.5">
            <button type="button" onClick={openEditor} className="text-xs font-medium text-purple-800 underline">
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteMemory(month)}
              className="inline-flex items-center space-x-1 text-xs text-gray-500 underline"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {!has && !editing && (
        <div className="space-y-2">
          {invite && (
            <p className="text-xs text-gray-700">
              Keep something from {monthLabel} for your future self: a photo, a voice note or a line about what this
              month was.
            </p>
          )}
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-xs font-medium text-purple-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a memory to {monthLabel}</span>
          </button>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="inline-flex items-center space-x-1.5 text-xs font-medium text-gray-800">
              <Camera className="w-3.5 h-3.5 text-purple-700" />
              <span>Photo</span>
            </label>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Selected photo" className="w-full max-h-48 object-cover rounded-xl border border-gray-100" />
            )}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={onPhoto}
                aria-label={`Choose a photo for ${monthLabel}`}
                className="text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border file:border-gray-200 file:bg-white file:text-[11px]"
              />
              {photo && (
                <button type="button" onClick={() => setPhoto(undefined)} className="text-[11px] text-gray-500 underline">
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              Only add photos of people who are happy to be in them. Location data is removed and the photo is made
              smaller.
            </p>
            {busy && <p className="text-[11px] text-gray-500">Preparing the photo…</p>}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-800">Voice note</p>
            {memory?.voice && keepOldVoice && !voice && (
              <div className="space-y-1">
                <VoicePlayer blob={memory.voice} label={`Saved voice note · ${formatSeconds(memory.voiceSec)}`} />
                <button type="button" onClick={() => setKeepOldVoice(false)} className="text-[11px] text-gray-500 underline">
                  Remove or replace it
                </button>
              </div>
            )}
            {(!memory?.voice || !keepOldVoice || voice) && (
              <VoiceRecorder onRecorded={(blob, sec) => setVoice(blob ? { blob, sec } : undefined)} />
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`memory-text-${month}`} className="inline-flex items-center space-x-1.5 text-xs font-medium text-gray-800">
              <PenLine className="w-3.5 h-3.5 text-purple-700" />
              <span>A line</span>
            </label>
            <input
              id={`memory-text-${month}`}
              type="text"
              value={text}
              maxLength={200}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder="First month at the new job"
              className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <p className="text-[11px] text-gray-500">Stays on this device. No AI reads it.</p>
          {error && <p className="text-[11px] text-amber-800">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold disabled:opacity-60"
            >
              Save memory
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
    </section>
  );
}
