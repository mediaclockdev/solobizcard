"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@/lib/navigation";
import { BusinessCard, FormSection } from "@/types/businessCard";
import { BusinessCardForm } from "@/components/onboarding/BusinessCardForm";
import { BusinessCardPreview } from "@/components/onboarding/BusinessCardPreview";
import { getFullName, createInitialCard } from "@/utils/businessCard";
import { loadBusinessCards } from "@/utils/cardStorage";

// ✅ import Header, Footer, and Modals like in BusinessCardCreator

import Header from "@/components/Header";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";
import { Logo } from "@/components/ui/Logo";
import { useSearchParams } from "next/navigation";

export default function Onboarding() {
  const [card, setCard] = useState<BusinessCard>(createInitialCard());
  const [currentSection, setCurrentSection] = useState<FormSection>("profile");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ✅ Modal states
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isForgotOpen, setForgotOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useSearchParams();

  const [isResetOpen, setResetOpen] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);

  const isEditMode = Boolean(
    location.state?.editMode && location.state?.cardId
  );
  const selectedTab = searchParams.get("selectedTab") ?? "local";
  // Initialize card state for editing
  const referal = searchParams.get("ref");
  const signIn = searchParams.get("signIn");
  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    if (mode === "resetPassword" && oobCode) {
      setResetCode(oobCode);
      setResetOpen(true);
    } else if (mode === "verifyEmail" && oobCode) {
      navigate(`/verify-email?${searchParams}`);
    } else {
      setResetOpen(false);
    }

    if (isEditMode && location.state?.cardId) {
      const cards = loadBusinessCards();
      const cardToEdit = cards.find(
        (c: BusinessCard) => c.metadata.id === location.state.cardId
      );

      if (cardToEdit) {
        setCard(cardToEdit);
      } else {
        navigate(`/dashboard/cards`);
      }
    }
  }, [isEditMode, location.state?.cardId, navigate]);
  useEffect(() => {
    if (signIn) {
      if (!isSignInOpen) {
        setIsSignInOpen(true);
      }
    } else {
      setIsSignInOpen(false);
    }
    if (referal) {
      if (!isSignInOpen) {
        setIsSignUpOpen(true);
      }
    } else {
      setIsSignUpOpen(false);
    }
  }, []);
  const handleCardUpdate = (updatedCard: BusinessCard) => {
    setCard(updatedCard);
    setHasUnsavedChanges(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: `${card.brandColor}15` }}
    >
      <Header onShowSignIn={() => setIsSignInOpen(true)} />
      {/* ✅ Added Header with sign in trigger */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute top-0 right-0 z-10">
            <Logo size="sm" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Form Section */}
            <div>
              <BusinessCardForm
                card={card}
                onUpdate={handleCardUpdate}
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                isEditMode={isEditMode}
                getFullName={getFullName}
                hasUnsavedChanges={hasUnsavedChanges}
                selectedTab={selectedTab ?? "local"}
              />
            </div>

            {/* Preview Section */}
            <div className="lg:sticky lg:top-6 mt-8 lg:mt-0">
              <BusinessCardPreview card={card} isCreateMode={true} />
            </div>
          </div>
        </div>
      </main>

      {/* ✅ Footer */}

      {/* ✅ Sign In Modal */}

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => {
          if (referal) {
            setIsSignInOpen(false);
            navigate("/");
            return;
          }
          setIsSignInOpen(false);
        }}
        onShowSignUp={() => {
          setIsSignInOpen(false);
          setIsSignUpOpen(true);
        }}
        onShowForgotPassword={() => {
          setIsSignInOpen(false);
          setForgotOpen(true);
        }}
      />

      {/* ✅ Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen} // ✅ Correct state
        onClose={() => setForgotOpen(false)}
      />

      {/* ✅ Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => {
          setIsSignUpOpen(false);
          if (referal) {
            navigate("/");
            return;
          }
          setIsSignUpOpen(false);
        }}
        onShowSignIn={() => {
          setIsSignUpOpen(false);
          setIsSignInOpen(true);
        }}
      />

      {/* ✅ Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setResetOpen(false)}
        oobCode={resetCode}
      />
    </div>
  );
}
