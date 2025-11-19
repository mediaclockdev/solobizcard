"use client";
import React from "react";
import { FormComponentProps } from "@/types/businessCard";
import {
  CardNameSection,
  ImageUploadSection,
  CardVisibilitySection,
  BrandColorSection,
} from "./sections";

export function ProfileForm({
  card,
  onUpdate,
  isEditMode,
  selectedTab,
}: FormComponentProps) {
  return (
    <div className="space-y-8">
      <CardNameSection
        card={card}
        onUpdate={onUpdate}
        selectedTab={selectedTab}
        isEditMode={isEditMode}
      />
      <ImageUploadSection
        card={card}
        onUpdate={onUpdate}
        isEditMode={isEditMode}
      />
      <CardVisibilitySection
        card={card}
        onUpdate={onUpdate}
        selectedTab={selectedTab}
      />
      <BrandColorSection card={card} onUpdate={onUpdate} />
    </div>
  );
}
