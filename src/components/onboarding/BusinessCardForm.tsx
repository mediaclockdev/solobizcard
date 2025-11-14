"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import { BusinessCardFormProps, FormSection } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./forms/ProfileForm";
import { BusinessForm } from "./forms/BusinessForm";
import { SocialForm } from "./forms/SocialForm";
import { AboutForm } from "./forms/AboutForm";
import { AppointmentForm } from "./forms/AppointmentForm";
import { WelcomeModal } from "./WelcomeModal";
import { generateVCard } from "@/utils/businessCard";
import * as htmlToImage from "html-to-image";

import {
  saveBusinessCard,
  isUrlNameAvailable,
  generateUniqueUrlName,
} from "@/utils/cardStorage";
import { hasUserAccount } from "@/utils/userStorage";
import {
  Image as ImageIcon,
  Contact2,
  Save,
  LayoutGrid,
  Download,
} from "lucide-react";

import { useToast } from "@/contexts/ToastContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
// import { metadata } from "@/app/layout";

import { useAuth } from "@/contexts/AuthContext";
import {
  getBlob,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

const sections = ["profile", "business", "social", "about", "cta"] as const;

export function BusinessCardForm({
  card,
  onUpdate,
  isEditMode,
  currentSection,
  onSectionChange,
  getFullName,
  hasUnsavedChanges,
  selectedTab = "local",
}: BusinessCardFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);

  const CARD_DOC_ID = "mainCard";
  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backupCard) {
          setStoredImage(data.backupCard);
        } else {
          setStoredImage(null);
        }
      } else {
        setStoredImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

  // function getDaySuffix(day) {
  //   if (day >= 11 && day <= 13) return `${day}th`;
  //   switch (day % 10) {
  //     case 1:
  //       return `${day}st`;
  //     case 2:
  //       return `${day}nd`;
  //     case 3:
  //       return `${day}rd`;
  //     default:
  //       return `${day}th`;
  //   }
  // }

  // const now = new Date();
  // const year = now.getFullYear(); // 2025
  // const month = now.toLocaleString("en-US", { month: "long" }); // Nov
  // const day = getDaySuffix(now.getDate());

  const copyImageServerSide = async (
    sourcePath: string,
    userId: string,
    cardId: string,
    imageType: string
  ) => {
    //const destPath = `cards/${year}/${month}/${day}/${userId}/${cardId}/${imageType}_copy_${Date.now()}.jpg`;
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
    if (card.urlName === "" || !card.urlName?.trim()) {
      showToast("Card Name is required.", "error");
      onSectionChange("profile");
      return;
    }

    if (
      !isUrlNameAvailable(
        card.urlName,
        isEditMode ? card.metadata.id : undefined
      )
    ) {
      const suggestion = generateUniqueUrlName(card.urlName);
      showToast(
        `"${card.urlName}" is already taken. Try "${suggestion}" instead.`,
        "error"
      );
      onSectionChange("profile");
      return;
    }

    if (!card.profile.firstName?.trim()) {
      showToast("First name is required", "error");
      onSectionChange("business");
      return;
    }

    if (!card.profile.lastName?.trim()) {
      showToast("Last name is required", "error");
      onSectionChange("business");
      return;
    }

    // Validate Direct Ads selection
    if (
      card?.appointments?.appointmentType === "direct-ads" &&
      !card?.appointments?.directAds?.type
    ) {
      showToast("Direct ad type is required.", "error");
      onSectionChange("cta"); // or whichever section contains this field
      return;
    }

    // Apply default profile image if none selected
    const cardToSave = { ...card };
    if (!cardToSave.profilePhoto?.trim()) {
      cardToSave.profilePhoto = storedImage?.url;
    }

    if (user && selectedTab !== "local") {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const q = query(
          collection(db, "cards"),
          where("urlName", "==", card.urlName)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          showToast("Card name already exists", "error");
          return;
        }

        const planType = userData.planType || "free";

        if (planType === "free" && !isEditMode) {
          const q = query(
            collection(db, "cards"),
            where("uid", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          if (snapshot.size >= 2) {
            showToast(
              "Free plan allows only 2 cards. Upgrade to create unlimited cards.",
              "error"
            );
            return;
          }
        }
        let newURL = card.profilePhoto;
        if (!card.profilePhoto || card.profilePhoto == "") {
          newURL = await copyImageServerSide(
            storedImage.url,
            user.uid,
            card.urlName,
            "profile"
          );
        }
        await setDoc(doc(db, "cards", card.urlName), {
          profilePhoto: newURL,
          uid: user.uid,
          isActive: true,
          urlName: card.urlName,
          brandColor: card.brandColor,
          templateType: card.templateType,
          cardLayout: card.cardLayout,
          profile: {
            firstName: card.profile.firstName || "",
            lastName: card.profile.lastName || "",
            title: card.profile.title || "",
            businessCategory: card.profile.businessCategory || "",
            department: card.profile.department || "",
            company: card.profile.company || "",
            accreditations: card.profile.accreditations || [],
            companySlogan: card.profile.companySlogan || "",
          },
          business: {
            phone: card.business.phone || "",
            email: card.business.email || "",
            website: card.business.website || "",
            address: {
              street: card.business.address.street || "",
              city: card.business.address.city || "",
              state: card.business.address.state || "",
              zip: card.business.address.zip || "",
              country: card.business.address.country || "",
            },
          },
          social: {
            linkedin: card.social.linkedin || "",
            twitter: card.social.twitter || "",
            facebook: card.social.facebook || "",
            instagram: card.social.instagram || "",
            youtube: card.social.youtube || "",
            tiktok: card.social.tiktok || "",
          },
          about: {
            bio: card.about.bio ?? "",
            sectionTitle:
              card?.about?.sectionTitle ??
              card?.about?.customSectionTitle ??
              "",
            skills: card?.about?.skills ?? [],
            sectionType: card?.about?.sectionType ?? "",
          },
          appointments: {
            appointmentType: card.appointments.appointmentType || "",
            calendlyUrl: card.appointments.calendlyUrl || "",
            ctaLabel: card.appointments.ctaLabel || "",
            ctaUrl: card.appointments.ctaUrl || "",
            platform: card.appointments.platform || "calendly",
            googleUrl: card.appointments.googleUrl || "",
            directAds: {
              type: card?.appointments?.directAds?.type ?? "",
              image: card?.appointments?.directAds?.image || "",
            },
          },
          cardView: 0,
          cardShare: 0,
          leadsGenerated: 0,
          linkClick: 0,
          adsView: 0,
          saveContact: 0,
          metadata: {
            id: card.metadata.id || "",
            favorite: card.metadata.favorite || "",
            isPublic: card.metadata.isPublic || "",
            createdAt: card.metadata.createdAt || "",
            slug: card.metadata.slug || "",
            tags: card.metadata.tags || [],
            cardType: userData.planType,
          },
        });
      } catch (error) {
        console.error("Error saving card:", error);
        showToast("Failed to save card", "error");
      }
    } else {
      saveBusinessCard(cardToSave);
    }

    showToast(
      isEditMode ? "Card updated successfully" : "Card saved successfully",
      "success"
    );
    if (isEditMode) {
      navigate("/dashboard/cards");
    } else {
      const userAlreadyExists = hasUserAccount();
      if (userAlreadyExists) {
        navigate(`/dashboard/cards?selectedTab=${selectedTab}`);
      } else {
        navigate(`/dashboard/cards?selectedTab=${selectedTab}`);
        setTimeout(() => {
          window.location.href = `/dashboard/cards?selectedTab=${selectedTab}`;
        }, 300);
      }
    }
  };

  const handleDownloadImage = async () => {
    const previewElement = document.querySelector(
      ".card-preview"
    ) as HTMLElement;

    if (!previewElement) {
      showToast("Unable to find card preview", "error");
      return;
    }

    try {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => (img.onload = img.onerror = resolve))
          )
      );

      const clone = previewElement.cloneNode(true) as HTMLElement;

      // Disable transitions/animations
      clone.querySelectorAll("*").forEach((el) => {
        const elem = el as HTMLElement;
        elem.style.transition = "none";
        elem.style.animation = "none";
      });

      // Replace Firebase images with proxy URLs
      const images = clone.querySelectorAll("img");
      images.forEach((img) => {
        if (img.src.startsWith("https://firebasestorage.googleapis.com")) {
          const bust = Date.now(); // unique timestamp each call
          img.src = `/api/proxy-image?url=${encodeURIComponent(
            img.src
          )}&t=${bust}`;
        }
      });

      // Offscreen container
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "0";
      container.style.height = "0";
      container.style.overflow = "hidden";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.zIndex = "-9999";

      clone.style.position = "relative";
      clone.style.width = `${previewElement.scrollWidth}px`;
      clone.style.height = `${previewElement.scrollHeight}px`;
      clone.style.overflow = "visible";
      clone.style.background = "#ffffff";
      clone.style.transform = "none";
      clone.style.scale = "1";
      clone.style.opacity = "1";
      // clone.style.borderRadius = "20px";
      clone.style.overflow = "hidden";

      container.appendChild(clone);
      document.body.appendChild(container);
      await new Promise((r) => requestAnimationFrame(r));

      const htmlToImage = await import("html-to-image");
      const dataUrl = await htmlToImage.toPng(clone, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        quality: 1,
        style: {
          width: `${previewElement.scrollWidth}px`,
          height: `${previewElement.scrollHeight}px`,
          transform: "none",
          overflow: "visible",
          // borderRadius: "60px",
        },
      });

      container.remove();

      // Add footer
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");
      const footerHeight = 40;
      const borderRadius = 20;

      finalCanvas.width = img.width;
      finalCanvas.height = img.height + footerHeight;

      if (ctx) {
        // Create rounded path for entire card (image + footer)
        ctx.beginPath();
        ctx.moveTo(borderRadius, 0);
        ctx.lineTo(finalCanvas.width - borderRadius, 0);
        ctx.quadraticCurveTo(
          finalCanvas.width,
          0,
          finalCanvas.width,
          borderRadius
        );
        ctx.lineTo(finalCanvas.width, finalCanvas.height - borderRadius);
        ctx.quadraticCurveTo(
          finalCanvas.width,
          finalCanvas.height,
          finalCanvas.width - borderRadius,
          finalCanvas.height
        );
        ctx.lineTo(borderRadius, finalCanvas.height);
        ctx.quadraticCurveTo(
          0,
          finalCanvas.height,
          0,
          finalCanvas.height - borderRadius
        );
        ctx.lineTo(0, borderRadius);
        ctx.quadraticCurveTo(0, 0, borderRadius, 0);
        ctx.closePath();
        ctx.clip();

        // White background fills *within* rounded area only
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Draw the main image
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Footer background (still inside the same clip)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, img.height, finalCanvas.width, footerHeight);

        // Footer text
        ctx.fillStyle = "rgba(102, 102, 102, 0.7)";
        ctx.font = "italic 22px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Created free by: https://solobizcards.com",
          finalCanvas.width / 2,
          img.height + footerHeight / 2
        );
      }

      const link = document.createElement("a");
      link.download = `${card.profile.firstName || "business"}-${
        card.profile.lastName || "card"
      }.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();

      showToast("Business card image downloaded successfully", "success");
    } catch (error) {
      console.error("Error generating image:", error);
      showToast("Failed to generate image", "error");
    }
  };

  const handleDownloadVCard = () => {
    if (!card.profile.firstName?.trim()) {
      showToast("First name is required", "error");
      onSectionChange("business");
      return;
    }

    if (!card.profile.lastName?.trim()) {
      showToast("Last name is required", "error");
      onSectionChange("business");
      return;
    }

    const vCardData = generateVCard(card);
    const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.urlName || getFullName(card) || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("vCard downloaded", "success");
  };

  const { user } = useAuth();
  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">
            {isEditMode
              ? "Edit Your Business Card"
              : "Create Your Business Card"}
          </CardTitle>
          {!isEditMode && (
            <p className="text-muted-foreground text-sm">
              Free digital business card download and use
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section}
                variant={currentSection === section ? "default" : "outline"}
                size="sm"
                onClick={() => onSectionChange(section)}
                className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0"
              >
                {section === "cta"
                  ? "CTA"
                  : section.charAt(0).toUpperCase() + section.slice(1)}
              </Button>
            ))}
          </div>

          {/* Form Sections */}
          <div>
            {currentSection === "profile" && (
              <ProfileForm
                card={card}
                onUpdate={onUpdate}
                isEditMode={isEditMode}
                selectedTab={selectedTab}
              />
            )}
            {currentSection === "business" && (
              <BusinessForm card={card} onUpdate={onUpdate} />
            )}
            {currentSection === "social" && (
              <SocialForm card={card} onUpdate={onUpdate} />
            )}
            {currentSection === "about" && (
              <AboutForm card={card} onUpdate={onUpdate} />
            )}
            {currentSection === "cta" && (
              <AppointmentForm
                card={card}
                onUpdate={onUpdate}
                isEditMode={isEditMode}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleDownloadImage}
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <ImageIcon size={18} />
                Download Image
              </Button>
              <Button
                onClick={handleDownloadVCard}
                variant="secondary"
                className="flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Contact2 size={18} />
                Download vCard
              </Button>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handleSave}
                className="flex items-center gap-2 col-span-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Save size={18} />
                {isEditMode ? "Update Card" : "Save Card"}
              </Button>
              <Button
                onClick={() => navigate("/dashboard/cards")}
                variant="secondary"
                className="flex items-center gap-2 col-span-1 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <LayoutGrid size={18} />
                Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        firstName={card.profile.firstName || ""}
      />
    </>
  );
}
