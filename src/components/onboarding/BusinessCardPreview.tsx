"use client";
import { cn } from "@/lib/utils";
import calender from "../../assets/calendar.png";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { BusinessCard } from "@/types/businessCard";
import { hasUserInput, getFullName } from "@/utils/businessCard";
import {
  Calendar,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  Eye,
} from "lucide-react";
import { Lightbox } from "@/components/ui/lightbox";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import { Button } from "../ui/button";
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

interface BusinessCardPreviewProps {
  card: BusinessCard;
  className?: string;
  isEditMode?: boolean;
  isLocal?: boolean;
  isCreateMode?: boolean;
}

export function BusinessCardPreview({
  card,
  className = "",
  isEditMode = false,
  isLocal = false,
  isCreateMode = false,
}: BusinessCardPreviewProps) {
  const [showTemplate, setShowTemplate] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const fullName = getFullName(card);
  const qrCode = card?.qrCode?.qrCodeUrl ?? "";
  const router = useRouter();
  const hasProfileInfo = fullName || card.profile.title || card.profile.company;
  const hasContactInfo =
    card.business.phone || card.business.email || card.business.website;
  const hasAddress =
    card.business.address.street ||
    card.business.address.city ||
    card.business.address.state;
  const hasSocialLinks =
    card.social.linkedin ||
    card.social.twitter ||
    card.social.facebook ||
    card.social.youtube ||
    card.social.instagram ||
    card.social.tiktok;
  const cardSectionType = card.about.sectionType;
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [sanitizedBio, setSanitizedBio] = useState("");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const CARD_DOC_ID = "mainCard";
  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [storedOldImage, setStoredOldImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [storedBackupCardImage, setStoredBackupCardImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  // console.log("carddd==",card.appointments);
  const [key, setKey] = useState(0);

const formatPhone = (phone: string) => {
  if (!phone) return "";

  // If already formatted like phone intent → return as-is
  const pattern = /^\+\d{1,3}\s?\(\d{3}\)\s?\d{3}-\d{4}$/;
  if (pattern.test(phone)) return phone;

  // Clean digits but keep leading +
  const cleaned = phone.replace(/(?!^\+)\D/g, "");

  // Extract country code (1–3 digits)
  const match = cleaned.match(/^\+(\d{1,3})/);

  if (!match) return phone;

  const countryCode = match[0];       // "+1"
  const codeDigits = match[1];        // "1"
  const number = cleaned.slice(countryCode.length); // remaining digits

  // USA / Canada
  if (codeDigits === "1" && number.length === 10) {
    return `${countryCode} (${number.slice(0, 3)}) ${number.slice(
      3,
      6
    )}-${number.slice(6)}`;
  }

  // Default fallback → group 3-3-3-...
  return `${countryCode} ${number.replace(/(\d{3})(?=\d)/g, "$1 ")}`;
};



  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.image) {
          setIsLoading(true);
          setStoredImage(data.image);
          setIsLoading(false);
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

  const fetchBackupCardImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backupCard) {
          setIsLoading(true);
          setStoredBackupCardImage(data.backupCard);
          if (data.oldUrl) {
            setStoredOldImage(data.oldUrl);
          }
          setIsLoading(false);
        } else {
          setStoredBackupCardImage(null);
        }
      } else {
        setStoredBackupCardImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
  };

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [card]);
  useEffect(() => {
    fetchImage();
    fetchBackupCardImage();
  }, []);

  const DefaultView = () => (
    <div className="business-card-display">
      {isLoading ? (
        <div className="w-full h-24 flex items-center justify-center bg-muted rounded-lg animate-pulse">
          Loading...
        </div>
      ) : (
        <img
          src={
            storedImage?.url ||
            "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png"
          }
          alt="Example business card - Jane Doeington"
          className="w-full rounded-lg shadow-xl border"
        />
      )}
    </div>
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSanitizedBio(DOMPurify.sanitize(card.about.bio ?? ""));
    }
  }, [card.about.bio]);
  // console.log("about==>",cardSectionType);

  const showCardPreview = hasUserInput(card);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTemplate(!showCardPreview);
    }, 150);
    return () => clearTimeout(timer);
  }, [showCardPreview]);

  if (!showCardPreview) {
    return <DefaultView />;
  }

  return (
    <div
      key={key}
      className={`business-card-display bg-card rounded-lg shadow-lg overflow-hidden card-preview transition-opacity duration-200 ${
        showTemplate ? "opacity-0" : "opacity-100"
      } ${className}`}
    >
      {/* Header Section - Always show with brand color background */}
      <div
        className={
          card.cardLayout.toLowerCase() === "portrait"
            ? "relative h-[30rem] sm:h-[30rem]"
            : "relative sm:h-[270px] h-auto"
        }
        key={key}
        style={{ backgroundColor: `${card.brandColor}80` || "#4299e1" }}
      >
        {card.cardLayout.toLowerCase() === "portrait" ? (
          card.profilePhoto == storedOldImage?.url ? (
            <img
              src={storedBackupCardImage.url}
              alt="Card Preview"
              className="w-full h-full rounded-md object-contain"
            />
          ) : card.profilePhoto && card.profilePhoto != storedOldImage?.url ? (
            <img
              loading="lazy"
              src={card.profilePhoto}
              alt={fullName}
              className="w-full h-full object-center NR1"
              key={card.profilePhoto}
            />
          ) : storedBackupCardImage?.url ? (
            <img
              src={storedBackupCardImage.url}
              alt="Card Preview"
              className="w-full h-full rounded-md object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
                {fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          )
        ) : card.coverImage ? (
          <img
            loading="lazy"
            src={card.coverImage}
            alt={fullName}
            className="w-full h-full object-center NR"
          />
        ) : storedBackupCardImage?.url ? (
          <img
            src={storedBackupCardImage.url}
            alt="Card Preview"
            className="w-full h-full rounded-md object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
              {fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          </div>
        )}
        {[
          "extended",
          "standard",
          "centered",
          "align-right",
          "align-left",
          "slides",
        ].includes(card.cardLayout.toLowerCase()) && (
          <div
            className={`absolute rounded-full
       ${
         card.cardLayout.toLowerCase() === "extended"
           ? "bottom-0 right-6 translate-y-1/2"
           : ""
       }
        ${
          card.cardLayout.toLowerCase() === "standard"
            ? "bottom-0 left-6 translate-y-1/2"
            : ""
        }
        ${
          card.cardLayout.toLowerCase() === "centered"
            ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            : ""
        }
         ${
           card.cardLayout.toLowerCase() === "align-right"
             ? "bottom-0 right-6 translate-y-1/2"
             : ""
         }
        ${
          card.cardLayout.toLowerCase() === "align-left"
            ? "bottom-0 left-6 translate-y-1/2"
            : ""
        }
               ${
                 card.cardLayout.toLowerCase() === "slides"
                   ? "bottom-0 right-6 translate-y-1/2"
                   : ""
               }
     `}
            style={{ backgroundColor: "transparent" }}
          >
            {card.profilePhoto && (
              <div
                className={`
                w-32 h-32 rounded-full object-cover
                ${
                  card.templateType !== "traditional"
                    ? "relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"
                    : ""
                }
              `}
              >
                <div
                  className={`
                w-32 h-32 rounded-full object-cover
                ${"relative before:content-[''] before:absolute before:w-full before:h-full before:left-0 before:right-0 before:bg-white before:rounded-[100px] before:-z-10"}
              `}
                >
                  <img
                    src={
                      card.profilePhoto &&
                      card.profilePhoto != storedOldImage?.url
                        ? card.profilePhoto
                        : storedBackupCardImage.url
                    }
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover"
                    style={
                      card.templateType == "traditional"
                        ? {
                            boxShadow:
                              "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                            border: `6px solid ${card.brandColor}`,
                            backgroundColor: `${card.brandColor}80`,
                          }
                        : {
                            boxShadow:
                              "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                            border: `6px solid #FFF`,
                            backgroundColor: `${card.brandColor}80`,
                          }
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {card.companyLogo &&
          [
            "extended",
            "standard",
            "centered",
            "align-right",
            "align-left",
          ].includes(card.cardLayout.toLowerCase()) && (
            <div
              className={`absolute
      ${
        card.cardLayout.toLowerCase() === "extended"
          ? "object-cover top-6 left-6 w-20 h-[60px] rounded-xl"
          : ""
      }
      ${
        card.cardLayout.toLowerCase() === "standard"
          ? "object-cover bottom-0 right-6 translate-y-1/2 w-20 h-[60px] rounded-xl NR"
          : ""
      }
       ${card.cardLayout.toLowerCase() === "centered" ? "left-1/2" : ""}
  
      ${card.cardLayout.toLowerCase() === "align-right" ? "top-4 left-4" : ""}
      ${card.cardLayout.toLowerCase() === "align-left" ? "top-4 right-4" : ""}
    `}
              style={
                card.cardLayout.toLowerCase() === "centered"
                  ? { transform: "translate(30%, 30%)" } // X=right, Y=down
                  : {}
              }
            >
              <img
                src={card.companyLogo}
                alt="Logo"
                className={`${
                  card.cardLayout.toLowerCase() === "centered"
                    ? "object-cover -bottom-16 left-1/2 translate-x-[0%] w-20 h-[60px] rounded-xl"
                    : "w-20 h-[60px] rounded-lg NR123"
                }`}
                style={{ aspectRatio: "4 / 3" }}
              />
            </div>
          )}
      </div>

      {/* Brand Color Banner */}
      {card.templateType == "traditional" ? (
        <div
          className="h-5"
          style={{ backgroundColor: card.brandColor || "#4299e1" }}
        />
      ) : (
        <div className="h-0" />
      )}

      {/* Profile Section */}
      <div
        className={`px-5 sm:px-8 py-5 ${
          card.templateType == "classic" && card.cardLayout === "portrait"
            ? "mt-0"
            : card.cardLayout === "align-left" ||
              card.cardLayout === "align-right" ||
              card.cardLayout === "slides"
            ? "mt-8"
            : card.templateType == "classic"
            ? "mt-16"
            : "mt-0"
        }`}
        style={isEditMode || isCreateMode ? { pointerEvents: "none" } : {}}
      >
        {hasProfileInfo && (
          <div
            className={`${
              card.templateType == "classic" ? "text-left" : "text-center"
            }`}
          >
            <div
              className={`${
                card.templateType == "classic"
                  ? "flex items-baseline justify-left gap-2 flex-nowrap"
                  : "flex items-baseline justify-center gap-2 flex-nowrap"
              }`}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground whitespace-nowrap">
                {fullName ?? ""}
              </h2>
              {card.profile.accreditations.length > 0 && (
                <span className="text-muted-foreground text-base sm:text-lg font-normal whitespace-nowrap leading-none">
                  {card.profile.accreditations.join(", ")}
                </span>
              )}
            </div>
            <div className="text-lg sm:text-xl text-muted-foreground mt-0.5 break-words whitespace-pre-wrap">
              <p className="mb-1" style={{ color: card.brandColor }}>
                {card.profile.title}
                {card.profile.department && (
                  <span className="ml-2 text-muted-foreground break-words whitespace-pre-wrap">
                    • {card.profile.department}
                  </span>
                )}
              </p>
              <p className="font-bold text-card-foreground">
                {card.profile.company}
              </p>
            </div>
            {card.profile.companySlogan && (
              <p className="text-muted-foreground italic mt-3 break-words">
                "{card.profile.companySlogan}"
              </p>
            )}
          </div>
        )}

        {/* Unified CTA Button */}
        {card.appointments?.appointmentType && (
          <div
            className={`${
              card.templateType == "classic"
                ? "justify-center mt-5"
                : "flex justify-center mt-5"
            }`}
          >
            {card.appointments.appointmentType === "booking"
              ? (card.appointments.calendlyUrl ||
                  card.appointments.googleUrl) && (
                  <a
                    href={
                      card.appointments.platform == "calendly"
                        ? card.appointments.calendlyUrl
                        : card.appointments.googleUrl
                    }
                    onClick={async () => {
                      try {
                        const cardsQuery = query(
                          collection(db, "cards"),
                          where("metadata.id", "==", card.metadata.id)
                        );
                        const cardsSnapshot = await getDocs(cardsQuery);

                        for (const cardDoc of cardsSnapshot.docs) {
                          const cardData = cardDoc.data();

                          const now = new Date();
                          const monthKey = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                          ).padStart(2, "0")}`;
                          const dayKey = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                          ).padStart(2, "0")}-${String(now.getDate()).padStart(
                            2,
                            "0"
                          )}`;

                          // === Existing monthly ad views ===
                          const currentAdsView = cardData.adsView || 0;
                          const adsViewsByMonth =
                            cardData.cardAdsViewByMonth || {};
                          const updatedMonthAdsView =
                            (adsViewsByMonth[monthKey] || 0) + 1;

                          // === New daily ad views ===
                          const adsViewsByDay = cardData.cardAdsViewByDay || {};
                          const updatedDayAdsView =
                            (adsViewsByDay[dayKey] || 0) + 1;

                          // === Update Firestore only if viewer != owner ===
                          if (user?.uid !== cardData?.uid) {
                            await updateDoc(cardDoc.ref, {
                              adsView: currentAdsView + 1,
                              [`cardAdsViewByMonth.${monthKey}`]:
                                updatedMonthAdsView,
                              [`cardAdsViewByDay.${dayKey}`]: updatedDayAdsView,
                            });
                          }
                        }
                      } catch (error) {
                        console.error("Error updating ad view:", error);
                      }
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-white rounded-lg transition-colors text-base sm:text-lg font-medium hover:opacity-90 mb-2"
                    style={{
                      backgroundColor: card.brandColor,
                      lineHeight: "1",
                      alignItems: "center",
                    }}
                  >
                    {/* Icon wrapper ensures stable alignment in html2canvas */}

                    <span
                      className="flex items-center justify-center"
                      style={{
                        width: "20px",
                        height: "28px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={20} />
                      {/* <img
                        src={calender.src || calender}
                        width={20}
                        height={20}
                        alt="calendar"
                        className="block"
                        style={{
                          display: "block",
                          verticalAlign: "middle",
                          // transform: "translateY(0.5px)", // subpixel fix for html2canvas baseline shift
                        }}
                      /> */}
                    </span>

                    {/* Text wrapper with independent vertical centering */}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: "1",
                      }}
                    >
                      {"Schedule Meeting"}
                    </span>
                  </a>
                )
              : card.appointments.appointmentType === "call-to-action"
              ? card.appointments.ctaLabel &&
                card.appointments.ctaUrl &&
                /^https?:\/\//i.test(card.appointments.ctaUrl) && (
                  <a
                    onClick={async () => {
                      try {
                        const cardsQuery = query(
                          collection(db, "cards"),
                          where("metadata.id", "==", card.metadata.id)
                        );
                        const cardsSnapshot = await getDocs(cardsQuery);

                        for (const cardDoc of cardsSnapshot.docs) {
                          const cardData = cardDoc.data();

                          const now = new Date();
                          const monthKey = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                          ).padStart(2, "0")}`;
                          const dayKey = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                          ).padStart(2, "0")}-${String(now.getDate()).padStart(
                            2,
                            "0"
                          )}`;

                          // === Existing monthly ad views ===
                          const currentAdsView = cardData.adsView || 0;
                          const adsViewsByMonth =
                            cardData.cardAdsViewByMonth || {};
                          const updatedMonthAdsView =
                            (adsViewsByMonth[monthKey] || 0) + 1;

                          // === New daily ad views ===
                          const adsViewsByDay = cardData.cardAdsViewByDay || {};
                          const updatedDayAdsView =
                            (adsViewsByDay[dayKey] || 0) + 1;

                          // === Update Firestore only if viewer != owner ===
                          if (user?.uid !== cardData?.uid) {
                            await updateDoc(cardDoc.ref, {
                              adsView: currentAdsView + 1,
                              [`cardAdsViewByMonth.${monthKey}`]:
                                updatedMonthAdsView,
                              [`cardAdsViewByDay.${dayKey}`]: updatedDayAdsView,
                            });
                          }
                        }
                      } catch (error) {
                        console.error("Error updating ad view:", error);
                      }
                    }}
                    href={card.appointments.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-white rounded-lg transition-colors text-base sm:text-lg font-medium hover:opacity-90 mb-2"
                    style={{ backgroundColor: card.brandColor }}
                  >
                    <Calendar size={20} />
                    {/* <img
                      src={calender}
                      width={20}
                      height={20}
                      alt="Picture of the author"
                      style={{ display: "block", verticalAlign: "middle" }}
                    /> */}
                    {card.appointments.ctaLabel}
                  </a>
                )
              : card?.appointments?.appointmentType === "direct-ads" &&
                card?.appointments?.directAds?.type !== "none"
              ? card?.appointments?.directAds?.image && (
                  <button
                    onClick={async () => {
                      setShowLightbox(true);
                      try {
                        const cardsQuery = query(
                          collection(db, "cards"),
                          where("metadata.id", "==", card.metadata.id)
                        );
                        const cardsSnapshot = await getDocs(cardsQuery);

                        for (const cardDoc of cardsSnapshot.docs) {
                          const cardData = cardDoc.data();

                          const now = new Date();
                          const monthKey = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                          ).padStart(2, "0")}`;
                          const dayKey = `${now.getFullYear()}-${String(
                            now.getMonth() + 1
                          ).padStart(2, "0")}-${String(now.getDate()).padStart(
                            2,
                            "0"
                          )}`;

                          // === Existing monthly ad views ===
                          const currentAdsView = cardData.adsView || 0;
                          const adsViewsByMonth =
                            cardData.cardAdsViewByMonth || {};
                          const updatedMonthAdsView =
                            (adsViewsByMonth[monthKey] || 0) + 1;

                          // === New daily ad views ===
                          const adsViewsByDay = cardData.cardAdsViewByDay || {};
                          const updatedDayAdsView =
                            (adsViewsByDay[dayKey] || 0) + 1;

                          // === Update Firestore only if viewer != owner ===
                          if (user?.uid !== cardData?.uid) {
                            await updateDoc(cardDoc.ref, {
                              adsView: currentAdsView + 1,
                              [`cardAdsViewByMonth.${monthKey}`]:
                                updatedMonthAdsView,
                              [`cardAdsViewByDay.${dayKey}`]: updatedDayAdsView,
                            });
                          }
                        }
                      } catch (error) {
                        console.error("Error updating ad view:", error);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-white rounded-lg transition-colors text-base sm:text-lg font-medium hover:opacity-90 mb-2"
                    style={{ backgroundColor: card.brandColor }}
                  >
                    <Eye size={20} />
                    {card?.appointments?.directAds?.title ||
                      (card?.appointments?.directAds?.type === "Product"
                        ? "View Our Product"
                        : card?.appointments?.directAds?.type === "Event"
                        ? "View Our Event"
                        : card?.appointments?.directAds?.type === "Service"
                        ? "View Our Service"
                        : `View Our ${card?.appointments?.directAds?.type}`)}
                  </button>
                )
              : null}
          </div>
        )}

        {/* Contact Information */}
        {hasContactInfo && (
          <div className="mt-3 space-y-3">
            {card.business.phone && (
              <>
                <a
                  href={
                    isEditMode
                      ? "javascript:void(0)"
                      : `tel:${card.business.phone}`
                  }
                  className={`relative flex items-center gap-4 text-card-foreground group ${
                    isEditMode ? "cursor-auto" : ""
                  }`}
                  style={
                    isEditMode
                      ? {}
                      : {
                          ["--hover-color" as string]: card.brandColor,
                          ["--hover-bg" as string]: `${card.brandColor}26`,
                        }
                  }
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // disable in edit mode
                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error updating LinkedIn share count:",
                        error
                      );
                    }
                  }}
                >
                  <div
                    className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                    style={
                      isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                    }
                  />
                  <div
                    className="text-white p-3 rounded-full"
                    style={{ backgroundColor: card.brandColor }}
                  >
                    <Phone size={24} />
                  </div>
                  <div className="flex flex-col relative">
                    {/* <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                      {card.business.phone}
                    </span> */}
                    <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                      {formatPhone(card.business.phone)}
                    </span>
                    <span className="text-sm text-muted-foreground">Phone</span>
                  </div>
                </a>
              </>
            )}

            {card.business.email && (
              <a
                href="javascript:void(0)"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open the mail client after counting
                    window.location.href = `mailto:${card.business.email}`;
                  } catch (error) {
                    console.error("Error updating email click count:", error);
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Mail size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.business.email}
                  </span>
                  <span className="text-sm text-muted-foreground">Email</span>
                </div>
              </a>
            )}

            {card.business.website && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open website after counter updates
                    window.open(
                      card.business.website,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error("Error updating website click count:", error);
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Globe size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.business.website}
                  </span>
                  <span className="text-sm text-muted-foreground">Website</span>
                </div>
              </a>
            )}

            {hasAddress && (
              <div
                className="relative flex items-center gap-4 text-card-foreground group cursor-pointer"
                onClick={async (e) => {
                  if (isEditMode) return;

                  const fullAddress = [
                    card.business.address.street,
                    card.business.address.city,
                    card.business.address.state,
                    card.business.address.zip,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  const encodedAddress = encodeURIComponent(fullAddress);

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open Google Maps after counting
                    window.open(
                      `https://www.google.com/maps?q=${encodedAddress}`,
                      "_blank"
                    );
                  } catch (error) {
                    console.error("Error updating address click count:", error);
                  }
                }}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <MapPin size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {[
                      card.business.address.street,
                      card.business.address.city,
                      card.business.address.state,
                      card.business.address.zip,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                  <span className="text-sm text-muted-foreground">Address</span>
                </div>
              </div>
            )}

            {card.templateType !== "traditional" && card.social.linkedin && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open LinkedIn after updating click count
                    window.open(
                      card.social.linkedin,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error(
                      "Error updating LinkedIn click count:",
                      error
                    );
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Linkedin size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.social.linkedin}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    LinkedIn
                  </span>
                </div>
              </a>
            )}

            {card.templateType !== "traditional" && card.social.twitter && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open Twitter after updating Firestore
                    window.open(
                      card.social.twitter,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error("Error updating Twitter click count:", error);
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Twitter size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.social.twitter}
                  </span>
                  <span className="text-sm text-muted-foreground">Twitter</span>
                </div>
              </a>
            )}

            {card.templateType !== "traditional" && card.social.facebook && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open Facebook link after Firestore update
                    window.open(
                      card.social.facebook,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error(
                      "Error updating Facebook click count:",
                      error
                    );
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Facebook size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.social.facebook}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Facebook
                  </span>
                </div>
              </a>
            )}

            {card.templateType !== "traditional" && card.social.youtube && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open YouTube link after Firestore update
                    window.open(
                      card.social.youtube,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error("Error updating YouTube click count:", error);
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Youtube size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.social.youtube}
                  </span>
                  <span className="text-sm text-muted-foreground">YouTube</span>
                </div>
              </a>
            )}

            {card.templateType !== "traditional" && card.social.instagram && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open Instagram after Firestore update
                    window.open(
                      card.social.instagram,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error(
                      "Error updating Instagram click count:",
                      error
                    );
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <Instagram size={24} />
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.social.instagram}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Instagram
                  </span>
                </div>
              </a>
            )}

            {card.templateType !== "traditional" && card.social.tiktok && (
              <a
                href="javascript:void(0)"
                target="_blank"
                rel="noopener noreferrer"
                className={`relative flex items-center gap-4 text-card-foreground group ${
                  isEditMode ? "cursor-auto" : ""
                }`}
                style={
                  isEditMode
                    ? {}
                    : {
                        ["--hover-color" as string]: card.brandColor,
                        ["--hover-bg" as string]: `${card.brandColor}26`,
                      }
                }
                onClick={async (e) => {
                  e.preventDefault();

                  if (isEditMode) return;

                  try {
                    const cardsQuery = query(
                      collection(db, "cards"),
                      where("metadata.id", "==", card.metadata.id)
                    );
                    const cardsSnapshot = await getDocs(cardsQuery);

                    for (const cardDoc of cardsSnapshot.docs) {
                      const cardData = cardDoc.data();

                      const now = new Date();

                      // === KEYS ===
                      const monthKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const dayKey = `${now.getFullYear()}-${String(
                        now.getMonth() + 1
                      ).padStart(2, "0")}-${String(now.getDate()).padStart(
                        2,
                        "0"
                      )}`;

                      // === EXISTING COUNTERS ===
                      const currentClicks = cardData.linkClick || 0;
                      const linkClicksByMonth =
                        cardData.linkClicksByMonth || {};
                      const linkClicksByDay = cardData.linkClicksByDay || {};

                      // === UPDATED COUNTERS ===
                      const updatedMonthClick =
                        (linkClicksByMonth[monthKey] || 0) + 1;
                      const updatedDayClick =
                        (linkClicksByDay[dayKey] || 0) + 1;

                      // === UPDATE ONLY IF USER IS NOT OWNER ===
                      if (user?.uid !== cardData?.uid) {
                        await updateDoc(cardDoc.ref, {
                          linkClick: currentClicks + 1,
                          [`linkClicksByMonth.${monthKey}`]: updatedMonthClick,
                          [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                        });
                      }
                    }

                    // ✅ Open TikTok link after Firestore update
                    window.open(
                      card.social.tiktok,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  } catch (error) {
                    console.error("Error updating TikTok click count:", error);
                  }
                }}
              >
                <div
                  className="absolute -inset-y-2 w-[200%] -left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  style={
                    isEditMode ? {} : { backgroundColor: "var(--hover-bg)" }
                  }
                />
                <div
                  className="text-white p-3 rounded-full"
                  style={{ backgroundColor: card.brandColor }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </div>
                <div className="flex flex-col relative">
                  <span className="text-card-foreground font-bold group-hover:text-[var(--hover-color)] transition-colors break-all">
                    {card.social.tiktok}
                  </span>
                  <span className="text-sm text-muted-foreground">TikTok</span>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Divider */}
        {(card.about.bio || hasSocialLinks) && (
          <div className="mt-4 border-t border-border" />
        )}

        {/* About Section */}
        {(!cardSectionType || cardSectionType === "") && card.about.bio && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-card-foreground mb-1.5">
              {card.about.customSectionTitle || "About Me"}
            </h3>
            <p
              className="text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: sanitizedBio }}
            ></p>
          </div>
        )}

        {cardSectionType && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-card-foreground mb-1.5">
              {cardSectionType === "custom"
                ? card.about.customSectionTitle
                  ? card.about.customSectionTitle
                  : "About Me"
                : cardSectionType === "aboutMe"
                ? "About Me"
                : ""}
            </h3>
            <p
              className="text-muted-foreground leading-relaxed break-words whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: sanitizedBio }}
            ></p>
          </div>
        )}

        {/* Social Links */}
        {card.templateType !== "classic" && hasSocialLinks && (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-5">
            {card.social.linkedin && (
              <>
                <a
                  href={
                    isEditMode ? "javascript:void(0)" : card.social.linkedin
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: card.brandColor,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor = `${card.brandColor}26`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor =
                        "hsl(var(--muted))";
                  }}
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // Disable in edit mode

                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error updating LinkedIn share count:",
                        error
                      );
                    }
                  }}
                >
                  <Linkedin size={24} />
                </a>
              </>
            )}

            {card.social.twitter && (
              <>
                <a
                  href={isEditMode ? "javascript:void(0)" : card.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: card.brandColor,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor = `${card.brandColor}26`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor =
                        "hsl(var(--muted))";
                  }}
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // Disable in edit mode

                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error updating Twitter link click:",
                        error
                      );
                    }
                  }}
                >
                  <Twitter size={24} />
                </a>
              </>
            )}

            {card.social.facebook && (
              <>
                <a
                  href={
                    isEditMode ? "javascript:void(0)" : card.social.facebook
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: card.brandColor,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor = `${card.brandColor}26`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor =
                        "hsl(var(--muted))";
                  }}
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // Disable in edit mode

                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error updating Facebook link click:",
                        error
                      );
                    }
                  }}
                >
                  <Facebook size={24} />
                </a>
              </>
            )}

            {card.social.youtube && (
              <>
                <a
                  href={isEditMode ? "javascript:void(0)" : card.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: card.brandColor,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor = `${card.brandColor}26`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor =
                        "hsl(var(--muted))";
                  }}
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // Disable click in edit mode

                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error updating YouTube link click:",
                        error
                      );
                    }
                  }}
                >
                  <Youtube size={24} />
                </a>
              </>
            )}

            {card.social.instagram && (
              <>
                <a
                  href={
                    isEditMode ? "javascript:void(0)" : card.social.instagram
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: card.brandColor,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor = `${card.brandColor}26`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor =
                        "hsl(var(--muted))";
                  }}
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // Disable in edit mode

                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        "Error updating Instagram link click:",
                        error
                      );
                    }
                  }}
                >
                  <Instagram size={24} />
                </a>
              </>
            )}

            {card.social.tiktok && (
              <>
                <a
                  href={isEditMode ? "javascript:void(0)" : card.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200"
                  style={{
                    color: card.brandColor,
                    backgroundColor: "hsl(var(--muted))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor = `${card.brandColor}26`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditMode)
                      e.currentTarget.style.backgroundColor =
                        "hsl(var(--muted))";
                  }}
                  onClick={async (e) => {
                    if (isEditMode) return e.preventDefault(); // Disable in edit mode

                    try {
                      const cardsQuery = query(
                        collection(db, "cards"),
                        where("metadata.id", "==", card.metadata.id)
                      );
                      const cardsSnapshot = await getDocs(cardsQuery);

                      for (const cardDoc of cardsSnapshot.docs) {
                        const cardData = cardDoc.data();

                        const now = new Date();

                        // === KEYS ===
                        const monthKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}`;
                        const dayKey = `${now.getFullYear()}-${String(
                          now.getMonth() + 1
                        ).padStart(2, "0")}-${String(now.getDate()).padStart(
                          2,
                          "0"
                        )}`;

                        // === EXISTING COUNTERS ===
                        const currentClicks = cardData.linkClick || 0;
                        const linkClicksByMonth =
                          cardData.linkClicksByMonth || {};
                        const linkClicksByDay = cardData.linkClicksByDay || {};

                        // === UPDATED COUNTERS ===
                        const updatedMonthClick =
                          (linkClicksByMonth[monthKey] || 0) + 1;
                        const updatedDayClick =
                          (linkClicksByDay[dayKey] || 0) + 1;

                        // === UPDATE ONLY IF USER IS NOT OWNER ===
                        if (user?.uid !== cardData?.uid) {
                          await updateDoc(cardDoc.ref, {
                            linkClick: currentClicks + 1,
                            [`linkClicksByMonth.${monthKey}`]:
                              updatedMonthClick,
                            [`linkClicksByDay.${dayKey}`]: updatedDayClick,
                          });
                        }
                      }
                    } catch (error) {
                      console.error("Error updating TikTok link click:", error);
                    }
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for Direct Ads */}
      {card.appointments?.directAds?.image && (
        <Lightbox
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          imageSrc={card.appointments.directAds.image}
          title={card.appointments.directAds.title}
          description={card.appointments.directAds.description}
          price={card.appointments.directAds.price}
          url={card.appointments.directAds.url}
          theme={card.brandColor}
        />
      )}
      {showPermissionModal && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center px-4"
          )}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 z-50 w-full max-w-md text-center">
            {/* Icon / Visual cue */}
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

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowPermissionModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 200);
                }}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
