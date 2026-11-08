"use client";

import React, { useEffect, useState } from "react";
import { Users, Copy, Share2, X } from "lucide-react";
import type { Instalment } from "@/lib/passbook-types";
import { friendMessage, whatsappLink } from "@/lib/ask-friend";
import { getFriend, saveFriend } from "@/lib/keepsake";
import { useKeepsakeTick } from "./use-keepsake";

// Version B: ask ONE person you trust about this instalment. The investor sends the message from their own
// WhatsApp or messages app; Groww sends nothing and keeps nothing but the friend's first name on this device.
// The text is built in code from the passbook facts (no AI), with no reference IDs, folio, fund, bank or account
// details, and the investor can edit or delete anything before sending.
export function AskFriend({ entry }: { entry: Instalment }) {
  const tick = useKeepsakeTick();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [text, setText] = useState("");
  const [edited, setEdited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remembered, setRemembered] = useState(false);
  const [canShare, setCanShare] = useState(false);
  // MVP sessions, 9 Nov: participants deleted the rupee amount by hand before sending, so it's left out by default.
  const [withAmount, setWithAmount] = useState(false);

  useEffect(() => {
    getFriend().then((f) => {
      setSavedName(f.name ?? "");
      setName((n) => n || f.name || "");
    });
  }, [tick]);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!edited) setText(friendMessage(entry, name, true, withAmount));
  }, [entry, name, edited, withAmount]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ text });
    } catch {
      /* the investor closed the share sheet */
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-medium text-purple-900"
      >
        <Users className="w-3.5 h-3.5" />
        <span>{savedName ? `Ask ${savedName} about this` : "Ask a friend about this"}</span>
      </button>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-purple-200 bg-white space-y-3" data-testid="ask-friend">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-900">Ask a friend</p>
          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
            One person you trust. You send it from your own WhatsApp or messages; nothing goes through Groww.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close Ask a friend" className="p-1 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="friend-name" className="text-[11px] text-gray-500 block mb-1">
            Their first name (optional, stays on this device)
          </label>
          <input
            id="friend-name"
            value={name}
            maxLength={30}
            onChange={(e) => {
              setName(e.target.value);
              setRemembered(false);
            }}
            className="w-full text-xs p-2 rounded-lg border border-gray-200"
          />
        </div>
        <button
          type="button"
          onClick={async () => {
            await saveFriend({ name });
            setRemembered(true);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-800"
        >
          Remember
        </button>
      </div>

      {remembered && (
        <p role="status" className="text-[11px] text-emerald-800">
          {name.trim() ? "Saved on this device." : "Name removed from this device."}
        </p>
      )}

      {/* Once the investor edits the message, the text is theirs: the toggle goes away rather than overwrite it */}
      {!edited && (
      <label className="flex items-center gap-2 text-[11px] text-gray-700" data-testid="friend-amount-toggle">
        <input
          type="checkbox"
          checked={withAmount}
          onChange={(e) => setWithAmount(e.target.checked)}
          className="w-3.5 h-3.5 accent-purple-700"
        />
        <span>Include the amount and units (left out unless you tick this)</span>
      </label>
      )}

      <div>
        <label htmlFor="friend-message" className="text-[11px] text-gray-500 block mb-1">
          Your message (edit anything before you send it)
        </label>
        <textarea
          id="friend-message"
          value={text}
          rows={8}
          onChange={(e) => {
            setText(e.target.value);
            setEdited(true);
          }}
          className="w-full text-xs p-2 rounded-lg border border-gray-200 leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={whatsappLink(text)}
          target="_blank"
          rel="noreferrer"
          data-testid="friend-whatsapp"
          className="flex items-center justify-center p-2.5 rounded-xl bg-purple-700 text-white text-xs font-semibold"
        >
          Send on WhatsApp
        </a>
        {canShare ? (
          <button
            type="button"
            onClick={share}
            className="flex items-center justify-center space-x-1 p-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share another way</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={copy}
            className="flex items-center justify-center space-x-1 p-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? "Copied" : "Copy the message"}</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 leading-relaxed" data-testid="friend-safety">
        Never send OTPs, PINs, passwords or full account numbers. A friend&apos;s view isn&apos;t financial advice; for
        an official answer, use Groww support or your CAS.
      </p>
    </div>
  );
}
