import React from "react";

export function FooterNotice() {
  return (
    <footer className="w-full mt-auto py-6 px-4 bg-white border-t border-gray-100 text-center text-xs text-gray-400 leading-relaxed no-print">
      <div className="max-w-md mx-auto space-y-1">
        <p>
          Concept prototype, not affiliated with Groww. All data is synthetic demo data.
        </p>
        <div className="pt-2 flex justify-center items-center space-x-3 text-[11px] text-gray-500">
          <a href="/quality" className="hover:text-gray-800 underline">
            Quality &amp; Safety
          </a>
          <span>&bull;</span>
          <a href="/demo-tools" className="hover:text-gray-800 underline">
            Demo tools
          </a>
        </div>
      </div>
    </footer>
  );
}
