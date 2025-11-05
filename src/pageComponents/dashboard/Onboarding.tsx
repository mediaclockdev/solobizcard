"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BusinessCard, FormSection } from "@/types/businessCard";
import { BusinessCardForm } from "@/components/onboarding/BusinessCardForm";
import { BusinessCardPreview } from "@/components/onboarding/BusinessCardPreview";
import { getFullName, createInitialCard } from "@/utils/businessCard";
import { loadBusinessCards } from "@/utils/cardStorage";

export default function Onboarding() {
  const [card, setCard] = useState<BusinessCard>(createInitialCard());
  const [currentSection, setCurrentSection] = useState<FormSection>("profile");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Read query params instead of location.state
  const editMode = searchParams.get("editMode") === "true";
  const cardId = searchParams.get("cardId");

  // Initialize card state for editing
  useEffect(() => {
    if (editMode && cardId) {
      const cards = loadBusinessCards();
      const cardToEdit = cards.find(
        (c: BusinessCard) => c.metadata.id === cardId
      );

      if (cardToEdit) {
        setCard(cardToEdit);
      } else {
        // Card not found, redirect to cards page
        router.push("/dashboard/cards");
      }
    }
  }, [editMode, cardId, router]);

  const handleCardUpdate = (updatedCard: BusinessCard) => {
    setCard(updatedCard);
    setHasUnsavedChanges(true);
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: `${card.brandColor}15` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Form Section */}
          <div>
            <BusinessCardForm
              card={card}
              onUpdate={handleCardUpdate}
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
              isEditMode={editMode}
              getFullName={getFullName}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-6 mt-8 lg:mt-0">
            <BusinessCardPreview card={card} isCreateMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
