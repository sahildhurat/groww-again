"use client";

// Owner, 9 Nov 2026: one reminder of why you're starting, in whichever form you like: a photo, a voice note or a line.
// The photo is the picture the passbook builds piece by piece (saved as the goal photo); the voice note and the line come
// back on the passbook cover (saved as the reason). Optional, stays on this phone, no AI reads any of it.
import React, { useEffect, useState } from "react";
import { ImagePlus, Mic, PenLine, Check, Trash2 } from "lucide-react";
import { GoalPhoto } from "./goal-photo";
import { VoicePlayer, VoiceRecorder } from "./voice-recorder";
import { useKeepsakeTick } from "./use-keepsake";
import { formatSeconds, getGoal, getReason, saveReason, type GoalRecord, type ReasonRecord } from "@/lib/keepsake";

type Kind = "photo" | "voice" | "line";

export function StartReminder() {
  const tick = useKeepsakeTick();
  const [goal, setGoal] = useState<GoalRecord | undefined>();
  const [reason, setReason] = useState<ReasonRecord | undefined>();
  const [open, setOpen] = useState<Kind | null>(null);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<{ blob: Blob; sec: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGoal().then(setGoal);
    getReason().then(setReason);
  }, [tick]);

  const has: Record<Kind, boolean> = { photo: Boolean(goal?.photo), voice: Boolean(reason?.voice), line: Boolean(reason?.text) };

  const openPanel = (k: Kind) => {
    setError(null);
    setVoice(null);
    setText(reason?.text ?? "");
    setOpen((cur) => (cur === k ? null : k));
  };

  const saveLine = async () => {
    if (!text.trim()) return setError("Write a line first.");
    await saveReason({ text, voice: reason?.voice, voiceSec: reason?.voiceSec });
    setOpen(null);
  };
  const saveVoice = async () => {
    if (!voice) return setError("Record a voice note first.");
    await saveReason({ text: reason?.text, voice: voice.blob, voiceSec: voice.sec });
    setOpen(null);
  };
  const removeLine = () => saveReason({ voice: reason?.voice, voiceSec: reason?.voiceSec });
  const removeVoice = () => saveReason({ text: reason?.text });

  const options: { kind: Kind; label: string; icon: typeof ImagePlus }[] = [
    { kind: "photo", label: "A photo", icon: ImagePlus },
    { kind: "voice", label: "A voice note", icon: Mic },
    { kind: "line", label: "A line", icon: PenLine },
  ];

  return (
    <section className="bg-violet-50 border border-violet-100 rounded-3xl p-5 space-y-3" data-testid="start-reason">
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900">Why are you starting this SIP?</h2>
        <p className="text-[12px] text-gray-600 leading-relaxed mt-1">
          Optional. Keep a reminder in whichever form you like. Your photo becomes the picture your passbook builds piece
          by piece, one piece for each month your units arrive. A voice note or a line comes back on your passbook.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Add a reminder">
        {options.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => openPanel(kind)}
            aria-pressed={open === kind}
            data-testid={`reminder-${kind}`}
            className={`flex flex-col items-center gap-1 py-3 rounded-2xl border text-[12px] font-medium transition-colors ${
              open === kind ? "bg-white border-violet-400 text-violet-900" : "bg-white/70 border-violet-200 text-violet-800 hover:bg-white"
            }`}
          >
            <span className="relative">
              <Icon className="w-5 h-5" aria-hidden />
              {has[kind] && (
                <Check className="w-3 h-3 absolute -right-2.5 -top-1 text-emerald-700" aria-label="added" />
              )}
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {open === "photo" && (
        <div className="p-3 bg-white rounded-2xl border border-violet-200">
          <GoalPhoto />
        </div>
      )}

      {open === "voice" && (
        <div className="p-3 bg-white rounded-2xl border border-violet-200 space-y-2">
          <p className="text-xs font-semibold text-gray-900">Why I&apos;m starting this SIP, in my voice</p>
          <VoiceRecorder onRecorded={(blob, sec) => { setVoice(blob ? { blob, sec } : null); setError(null); }} />
          {error && <p className="text-[11px] text-amber-800">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={saveVoice} className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold">
              Save
            </button>
            <button type="button" onClick={() => setOpen(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {open === "line" && (
        <div className="p-3 bg-white rounded-2xl border border-violet-200 space-y-2">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            maxLength={280}
            rows={3}
            aria-label="Why I'm starting this SIP"
            placeholder="For my first bike, without a loan"
            className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          {error && <p className="text-[11px] text-amber-800">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={saveLine} className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold">
              Save
            </button>
            <button type="button" onClick={() => setOpen(null)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {(has.photo || has.voice || has.line) && open === null && (
        <div className="space-y-2" data-testid="reminder-saved">
          <p className="text-[11px] text-gray-500">Your reminder</p>
          {goal?.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={goal.photo} alt="Your goal photo" className="w-full max-h-40 object-cover rounded-2xl border border-violet-100" />
          )}
          {reason?.text && (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-900 italic" data-testid="reason-text">&ldquo;{reason.text}&rdquo;</p>
              <button type="button" onClick={removeLine} aria-label="Remove the line" className="p-1 text-gray-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {reason?.voice && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <VoicePlayer blob={reason.voice} label={`Voice note · ${formatSeconds(reason.voiceSec)}`} />
              </div>
              <button type="button" onClick={removeVoice} aria-label="Remove the voice note" className="p-1 text-gray-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-gray-500">Stays on this phone. It isn&apos;t uploaded and no AI reads it.</p>
    </section>
  );
}
