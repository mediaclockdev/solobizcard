"use client";

import React, { useState } from "react";
import { BusinessCard, FormSection } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/onboarding/forms/ProfileForm";
import { BusinessForm } from "@/components/onboarding/forms/BusinessForm";
import { SocialForm } from "@/components/onboarding/forms/SocialForm";
import { AboutForm } from "@/components/onboarding/forms/AboutForm";
import { AppointmentForm } from "@/components/onboarding/forms/AppointmentForm";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import {
  saveBusinessCard,
  isUrlNameAvailable,
  generateUniqueUrlName,
} from "@/utils/cardStorage";
import { Save } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const sections = ["profile", "business", "social", "about", "cta"] as const;

interface CardEditFormProps {
  card: BusinessCard;
  onUpdate: (card: BusinessCard) => void;
}

export function CardEditForm({ card, onUpdate }: CardEditFormProps) {
  const [currentSection, setCurrentSection] = useState<FormSection>("profile");
  const { showToast } = useToast();
  const { user } = useAuth();

  const copyImageServerSide = async (
    sourcePath: string,
    userId: string,
    cardId: string,
    imageType: string
  ) => {
    const destPath = `cards/${userId}/${cardId}/${imageType}_copy_${Date.now()}.jpg`;
    try {
      const response = await fetch("/api/firebase-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPath: sourcePath,
          userId,
          cardId,
          imageType,
        }),
      });

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleSave = async () => {
    if (!card.urlName?.trim()) {
      showToast("Card Name is required", "error");
      setCurrentSection("profile");
      return;
    }

    // Check URL name uniqueness (excluding current card)
    if (!isUrlNameAvailable(card.urlName, card.metadata.id)) {
      const suggestion = generateUniqueUrlName(card.urlName);
      showToast(
        `"${card.urlName}" is already taken. Try "${suggestion}" instead.`,
        "error"
      );
      setCurrentSection("profile");
      return;
    }

    if (!card.profile.firstName?.trim() || !card.profile.lastName?.trim()) {
      showToast("First name and last name are required", "error");
      setCurrentSection("business");
      return;
    }

    // Validate Direct Ads selection
    if (
      card?.appointments?.appointmentType === "direct-ads" &&
      !card?.appointments?.directAds?.type
    ) {
      showToast("Direct ad type is required.", "error");
      setCurrentSection("cta");
      return;
    }

    if (user) {
      let storedImage = null;
      let oldURl = null;
      const CARD_DOC_ID = "mainCard";
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backupCard) {
          storedImage = data?.backupCard?.url;
          oldURl = data?.oldUrl?.url;
        } else {
          storedImage = null;
        }
      } else {
        storedImage = null;
      }

      let newURL = card.profilePhoto;
      if (!card.profilePhoto || card.profilePhoto == oldURl) {
        newURL = await copyImageServerSide(
          storedImage,
          user.uid,
          card.urlName,
          "profile"
        );
      }

      // QR CODE REGENERATION BLOCK
      let updatedQRCode = card.qrCode;
      try {
        const cardUrl = `${window.location.origin}/card/${card.metadata.id}?selectedTab=favorites&view=true`;

        // Use existing logo or fallback
        let logoFile: File | null = null;
        if (card.qrCode?.qrLogoUrl) {
          const res = await fetch(card.qrCode.qrLogoUrl);
          const blob = await res.blob();
          logoFile = new File([blob], "logo.png", { type: blob.type });
        } else {
          // fallback logo if none selected
          const res = await fetch(
            "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png"
          );
          const blob = await res.blob();
          logoFile = new File([blob], "default-logo.png", { type: blob.type });
        }

        // Generate QR Code with updated brand color
        const qrDataUrl = await generateQRCodeWithLogo(cardUrl, logoFile, {
          width: 200,
          margin: 2,
          color: { dark: card.brandColor, light: "#FFFFFF" },
        });

        // Convert to blob for upload
        const qrBlob = await (await fetch(qrDataUrl)).blob();

        // Upload to Firebase Storage
        const storage = getStorage();
        const qrRef = ref(
          storage,
          `cards/${user.uid}/${card.id}/QRCode/qr_${card.metadata.id}.png`
        );

        await uploadBytes(qrRef, qrBlob);
        const qrDownloadUrl = await getDownloadURL(qrRef);

        updatedQRCode = {
          colorSource: "brand",
          selectedColor: card.brandColor,
          qrCodeUrl: qrDownloadUrl,
          qrLogoUrl: card.qrCode?.qrLogoUrl || "",
        };
      } catch (qrError) {
        console.error("Failed to regenerate QR Code:", qrError);
      }

      const q = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id)
      );

      getDocs(q)
        .then((querySnapshot) => {
          if (querySnapshot.empty) {
            saveBusinessCard(card);
            showToast("Card updated successfully", "success");
            return;
          }

          querySnapshot.forEach((docSnap) => {
            updateDoc(docSnap.ref, {
              urlName: card?.urlName,
              brandColor: card?.brandColor,
              qrCode: card?.qrCode || "",
              templateType: card?.templateType,
              cardLayout: card?.cardLayout,
              profilePhoto: newURL,
              coverImage: card?.coverImage || "",
              companyLogo: card?.companyLogo || "",
              profile: {
                firstName: card?.profile?.firstName || "",
                lastName: card?.profile?.lastName || "",
                title: card?.profile?.title || "",
                businessCategory: card?.profile?.businessCategory || "",
                department: card?.profile?.department || "",
                company: card?.profile?.company || "",
                accreditations: card?.profile?.accreditations || [],
                companySlogan: card?.profile?.companySlogan || "",
              },
              business: {
                phone: card?.business?.phone || "",
                email: card?.business?.email || "",
                website: card?.business?.website || "",
                address: {
                  street: card?.business?.address?.street || "",
                  city: card?.business?.address?.city || "",
                  state: card?.business?.address?.state || "",
                  zip: card?.business?.address?.zip || "",
                  country: card?.business?.address?.country || "",
                },
              },
              social: {
                linkedin: card?.social?.linkedin || "",
                twitter: card?.social?.twitter || "",
                facebook: card?.social?.facebook || "",
                instagram: card?.social?.instagram || "",
                youtube: card?.social?.youtube || "",
                tiktok: card?.social?.tiktok || "",
              },
              about: {
                bio: card?.about?.bio || "",
                sectionTitle: card?.about?.sectionTitle || "",
                customSectionTitle: card?.about?.customSectionTitle || "",
                skills: card?.about?.skills || [],
              },
              appointments: {
                appointmentType: card?.appointments?.appointmentType || "",
                calendlyUrl: card?.appointments?.calendlyUrl || "",
                ctaLabel: card?.appointments?.ctaLabel || "",
                ctaUrl: card?.appointments?.ctaUrl || "",
                platform: card?.appointments?.platform || "",
                googleUrl: card?.appointments?.googleUrl || "",
                directAds: {
                  type: card?.appointments?.directAds?.type ?? "",
                  image: card?.appointments?.directAds?.image || "",
                },
              },
              metadata: {
                id: card?.metadata?.id || "",
                favorite: card?.metadata?.favorite || "",
                isPublic: card?.metadata?.isPublic || "",
                createdAt: card?.metadata?.createdAt || "",
                updatedAt: new Date() || "",
                slug: card?.metadata?.slug || "",
                tags: card?.metadata?.tags || [],
                cardType: user?.planType,
              },
            });
          });

          showToast("Card updated successfully!", "success");
          setTimeout(() => {
            window.location.href = window.location.href;
          }, 2000);
        })
        .catch((error) => {
          console.error("Error saving card:", error);
          showToast("Failed to save card", "error");
        });
    } else {
      saveBusinessCard(card);
      showToast("Card updated successfully", "success");
    }
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border shadow-sm">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Button
            key={section}
            variant={currentSection === section ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentSection(section)}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0"
          >
            {section === "cta"
              ? "CTA"
              : section.charAt(0).toUpperCase() + section.slice(1)}
          </Button>
        ))}
      </div>

      {/* Form Sections */}
      <div className="space-y-4">
        {currentSection === "profile" && (
          <ProfileForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "business" && (
          <BusinessForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "social" && (
          <SocialForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "about" && (
          <AboutForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
        {currentSection === "cta" && (
          <AppointmentForm card={card} onUpdate={onUpdate} isEditMode={true} />
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <Button onClick={handleSave} className="w-full flex items-center gap-2">
          <Save size={18} />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
