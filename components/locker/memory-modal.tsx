"use client";

import React, { useState } from "react";
import { DemoInstalment } from "@/lib/seed";
import { X, Image as ImageIcon, Mic, FileText, Check } from "lucide-react";

interface MemoryModalProps {
  instalment: DemoInstalment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (memory: any) => void;
}

export function MemoryModal({
  instalment,
  isOpen,
  onClose,
  onSave,
}: MemoryModalProps) {
  const [activeTab, setActiveTab] = useState<"text" | "photo" | "voice">("text");
  const [text, setText] = useState(instalment.memory?.text || "");
  const [photoConsent, setPhotoConsent] = useState(false);
  const [selectedIllustration, setSelectedIllustration] = useState<string | null>(
    instalment.memory?.illustration || null
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      kind: activeTab,
      text: text.trim() || null,
      illustration: selectedIllustration,
    });
    onClose();
  };

  const sampleIllustrations = [
    { label: "Key", path: "/illustrations/key.svg" },
    { label: "Road", path: "/illustrations/road.svg" },
    { label: "Cake", path: "/illustrations/cake.svg" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 no-print">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Add a memory to this month
            </h3>
            <p className="text-xs text-gray-500">
              {new Date(instalment.due_date).toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "text"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            A line about this month
          </button>
          <button
            onClick={() => setActiveTab("photo")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "photo"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Illustration / Photo
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "voice"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Voice note
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-700">
              What happened in your life this month?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Moved into a flat, got my promotion, family wedding..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-[11px] text-gray-400 leading-snug">
              This note is woven into your month story (&ldquo;Your month, your
              money&rdquo;) and remains private to you.
            </p>
          </div>
        )}

        {activeTab === "photo" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-700 font-medium">
              Choose an illustrative icon or upload:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {sampleIllustrations.map((ill) => (
                <button
                  key={ill.path}
                  type="button"
                  onClick={() => setSelectedIllustration(ill.path)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    selectedIllustration === ill.path
                      ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={ill.path}
                    alt={ill.label}
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-[11px] font-medium text-gray-700">
                    {ill.label}
                  </span>
                </button>
              ))}
            </div>

            {/* DPDP Consent affirmation */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={photoConsent}
                  onChange={(e) => setPhotoConsent(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] leading-tight text-gray-600">
                  I will only add photos of people who agree, or of children in
                  my care. EXIF data is stripped before saving.
                </span>
              </label>
            </div>
          </div>
        )}

        {activeTab === "voice" && (
          <div className="space-y-3 text-center py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <Mic className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-gray-800">
              Voice notes up to 60 seconds
            </p>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
              Optional transcription via Groq Whisper. Voice notes remain
              private and stored securely in India.
            </p>
            <button
              type="button"
              onClick={() => {
                setText("Spoken note recorded for this month.");
                setActiveTab("text");
              }}
              className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200"
            >
              Record voice note (demo simulator)
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
          >
            Save memory
          </button>
        </div>
      </div>
    </div>
  );
}
