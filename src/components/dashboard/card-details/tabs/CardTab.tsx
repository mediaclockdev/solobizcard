"use client";
import { BusinessCard } from "@/types/businessCard";
import { CardAnalytics } from "@/components/dashboard/CardAnalytics";
import { CardShare } from "@/components/dashboard/CardShare";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface CardTabProps {
  card: BusinessCard;
  cardId: string;
  qrCodeUrl: string;
  onUpgrade: () => void;
}

export function CardTab({ card, cardId, qrCodeUrl, onUpgrade }: CardTabProps) {
  const { user } = useAuth();
  const [showProPopup, setShowProPopup] = useState(!user);
  const router = useRouter();

  return (
    <div className="space-y-4 relative">
      {/* Background content always visible */}
      <CardAnalytics onUpgrade={onUpgrade} />
      <CardShare card={card} cardId={cardId} qrCodeUrl={qrCodeUrl} />

      {/* Pro Feature Overlay */}
      {!user && showProPopup && (
        <div className="absolute top-[-15px] left-0 right-0 bottom-0 flex items-center justify-center">
          {/* Overlay with blur */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Popup */}
          <div className="relative z-10 w-[90%] max-w-md rounded-2xl border bg-card text-card-foreground shadow-lg p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 text-red-600">
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
                      d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Permission Required
              </h2>

              {/* Message */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                You need to{" "}
                <span className="font-medium text-gray-800">sign in</span>
                to access this page. Please log in with your account.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowProPopup(false);
                    setTimeout(() => router.replace("/?signIn=true"), 100);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-white"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
