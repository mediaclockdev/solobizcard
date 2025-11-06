"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TrackingCodeSection() {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Tracking Code</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPopup(true)}
            >
              Add New
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popup Overlay */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] !mt-0">
          {/* Overlay with blur */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />

          {/* Popup Box */}
          <div className="relative z-10 w-[90%] max-w-md rounded-2xl border bg-card text-card-foreground shadow-2xl p-6 animate-in fade-in-50 zoom-in-95">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Coming Soon 🚀
              </h2>

              {/* Message */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                The tracking code feature is currently under development and
                will be available soon.
              </p>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => setShowPopup(false)}
                  className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
