"use client";

import React, { useState } from "react";
import { TopBar } from "@/components/ui/top-bar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { FooterNotice } from "@/components/ui/footer-notice";
import { useDemo } from "@/lib/demo-context";
import { calculateLockerSummary } from "@/lib/seed";
import JSZip from "jszip";
import { Download, Trash2, Check, AlertCircle, FileArchive, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { sip, instalments, resetDemoState } = useDemo();
  const summary = calculateLockerSummary(instalments, sip.current_nav);

  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Generate ZIP bundle containing JSON ledger + printable HTML
  const handleDownloadLocker = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // 1. JSON Export of all rows
      const lockerData = {
        exported_at: new Date().toISOString(),
        sip,
        summary,
        instalments,
      };
      zip.file("locker-data.json", JSON.stringify(lockerData, null, 2));

      // 2. Printable HTML Ledger
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The SIP Locker - Exported Ledger</title>
  <style>
    body { font-family: sans-serif; margin: 40px; color: #111; }
    h1 { color: #00875A; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f4f5f7; }
    .footer { margin-top: 30px; font-size: 11px; color: #777; }
  </style>
</head>
<body>
  <h1>The SIP Locker: ${sip.name}</h1>
  <p><strong>Fund:</strong> ${sip.fund_label}</p>
  <p><strong>Dedication:</strong> "${sip.dedication}"</p>
  <p><strong>Total Units:</strong> ${summary.totalUnits} units</p>
  <p><strong>Total Invested:</strong> ₹${summary.totalInvested}</p>

  <h2>Instalments Ledger</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Status</th>
        <th>Amount</th>
        <th>NAV</th>
        <th>Units</th>
        <th>Notes / Memory</th>
      </tr>
    </thead>
    <tbody>
      ${instalments
        .map(
          (i) => `<tr>
        <td>${i.due_date}</td>
        <td>${i.status}</td>
        <td>₹${i.amount}</td>
        <td>${i.nav ? "₹" + i.nav.toFixed(2) : "-"}</td>
        <td>${i.units ? i.units.toFixed(3) : "-"}</td>
        <td>${i.memory?.text || i.note || i.failure_text || "-"}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>Exported from The SIP Locker concept prototype. Keepsake archive.</p>
  </div>
</body>
</html>`;

      zip.file("locker-ledger.html", htmlContent);

      // Generate blob & download
      const blob = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `sip-locker-export-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteEverything = () => {
    resetDemoState();
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <TopBar title="Settings &amp; Data Sovereignty" showBack backHref="/consent" />

      <main className="flex-1 p-4 space-y-4">
        {/* Data Export Card */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800">
            <Download className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Download My Locker
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Export a full ZIP archive containing your JSON metadata, receipt
            slips, attached memories, and a printable HTML ledger file.
          </p>

          <button
            type="button"
            onClick={handleDownloadLocker}
            disabled={downloading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
          >
            <FileArchive className="w-4 h-4" />
            <span>{downloading ? "Creating ZIP..." : "Download ZIP Archive"}</span>
          </button>

          {downloadDone && (
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center space-x-1.5 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Archive downloaded successfully!</span>
            </div>
          )}
        </section>

        {/* Delete Everything Card (§10) */}
        <section className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-red-700">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h2 className="text-sm font-bold text-gray-900">
              Delete Everything
            </h2>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Permanently purges all rows, slips, uploaded photos, voice notes,
            and personal entries from cloud storage and signs out immediately.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold border border-red-200 transition-colors"
            >
              Request Complete Deletion
            </button>
          ) : (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
              <div className="flex items-start space-x-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>
                  Are you sure? This cannot be undone. All demo and account data
                  will be wiped.
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-xs text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEverything}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Yes, Delete All
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <FooterNotice />
      <BottomNav />
    </div>
  );
}
