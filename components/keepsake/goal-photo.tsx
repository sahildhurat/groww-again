"use client";

// Piece by piece: the goal photo, added on the Start SIP screen (version B). Compressed, location data removed, kept on
// this device only; deletable in Your data.
import React, { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/image-compression";
import { blobToDataUrl, deleteGoal, getGoal, saveGoal, type GoalRecord } from "@/lib/keepsake";
import { useKeepsakeTick } from "./use-keepsake";

export function GoalPhoto() {
  const tick = useKeepsakeTick();
  const [goal, setGoal] = useState<GoalRecord | undefined>();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGoal().then((g) => {
      setGoal(g);
      // Keep what the investor is typing if nothing is saved yet (the panel can open and be typed in at once)
      setLabel((typed) => g?.label ?? (g ? "" : typed));
    });
  }, [tick]);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const out = await compressImage(file, 1280, 300 * 1024);
      await saveGoal({ photo: await blobToDataUrl(out.blob), label });
    } catch {
      setError("That photo couldn't be read. Try a JPEG or PNG.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2" data-testid="goal-photo">
      <p className="text-[13px] font-semibold text-gray-900">What is it for? Add a photo</p>
      <p className="text-[12px] text-gray-600">
        Your passbook builds this picture piece by piece: one piece each time a month&apos;s units are confirmed in your
        name.
      </p>
      {goal?.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={goal.photo} alt="Your goal photo" className="w-full max-h-48 object-cover rounded-2xl border border-gray-100" />
      )}
      <input
        type="text"
        value={label}
        maxLength={40}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => goal?.photo && saveGoal({ photo: goal.photo, label })}
        aria-label="Name your goal (optional)"
        placeholder="My first bike (optional)"
        className="w-full text-xs p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white text-xs font-medium text-purple-800 cursor-pointer">
          <ImagePlus className="w-3.5 h-3.5" aria-hidden />
          <span>{goal?.photo ? "Change the photo" : "Choose a photo"}</span>
          <input type="file" accept="image/*" onChange={onPhoto} className="sr-only" aria-label="Choose a goal photo" />
        </label>
        {goal?.photo && (
          <button type="button" onClick={() => deleteGoal()} className="inline-flex items-center gap-1 text-xs text-gray-500 underline">
            <Trash2 className="w-3 h-3" aria-hidden />
            Remove
          </button>
        )}
      </div>
      {busy && <p className="text-[11px] text-gray-500">Preparing the photo…</p>}
      {error && <p className="text-[11px] text-amber-800">{error}</p>}
      <p className="text-[11px] text-gray-500 leading-relaxed" data-testid="goal-photo-storage">
        Stays on this phone, in this browser: it isn&apos;t uploaded and the AI never sees it. Location data is removed
        and the photo is made smaller. Changing or removing it never changes your units, your SIP or how many pieces you
        have.
      </p>
    </div>
  );
}
