"use client";

import React, { useState, useEffect } from "react";
import { BusinessCard } from "@/types/businessCard";
import { BusinessCardPreview } from "@/components/onboarding/BusinessCardPreview";
import { ShareModal } from "@/components/ShareModal";
import { ContactModal } from "@/components/ContactModal";
import { ThankYouPopup } from "@/components/ThankYouPopup";
import { Lightbox } from "@/components/ui/lightbox";
import { getFullName, generateVCard } from "@/utils/businessCard";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share2, Download, Eye } from "lucide-react";
import { useAuth, UserData } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useRouter, useSearchParams, useParams } from "next/navigation";
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
import { User } from "firebase/auth";

interface MobileCardLayoutProps {
  cardId: string;
  card: BusinessCard;
  cardType: string;
  onNavigateBack: () => void;
  option?: string;
  showBackbtn?: boolean;
}

export function MobileCardLayout({
  cardId,
  card,
  cardType,
  onNavigateBack,
  showBackbtn,
  option = "",
}: MobileCardLayoutProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);

  // Animation states
  const [shareModalAnimateClass, setShareModalAnimateClass] =
    useState("translate-y-full");
  const [contactModalAnimateClass, setContactModalAnimateClass] =
    useState("translate-y-full");
  const [thankYouAnimateClass, setThankYouAnimateClass] =
    useState("translate-y-full");

  // Custom message states for thank you popup
  const [customMessage, setCustomMessage] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customButtonText, setCustomButtonText] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const [showBackButton, setShowBackButton] = useState(true);
  const [userName, setUserName] = useState("");
  const [refLink, setRefLink] = useState("");
  const [cardUser, setCardUser] = useState<UserData>(null);
  const router = useRouter();

  const { toast } = useToast();
  const { user } = useAuth();
  useEffect(() => {
    console.log("Length", showBackbtn);
    if (window.history.length > 3) {
      setShowBackButton(!showBackbtn || true);
    } else {
      setShowBackButton(!showBackbtn || false);
    }
  }, [window, showBackbtn]);
  // Animation effects
  useEffect(() => {
    if (showShareModal) {
      setShareModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setShareModalAnimateClass("translate-y-0");
      }, 50);
    }
  }, [showShareModal]);

  useEffect(() => {
    if (showContactModal) {
      setContactModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setContactModalAnimateClass("translate-y-0");
      }, 50);
    }
  }, [showContactModal]);

  useEffect(() => {
    if (showThankYouModal) {
      setThankYouAnimateClass("translate-y-full");
      setTimeout(() => {
        setThankYouAnimateClass("translate-y-0");
      }, 50);
    }

    async function fetchCardDetails() {
      try {
        const cardsQuery = query(
          collection(db, "cards"),
          where("metadata.id", "==", cardId)
        );
        const cardsSnapshot = await getDocs(cardsQuery);

        for (const cardDoc of cardsSnapshot.docs) {
          const cardData = cardDoc.data();
          const userID = cardDoc.data().uid;

          // Fetch user data for referral link
          const userQuery = doc(db, "users", userID);
          const userSnapshot = await getDoc(userQuery);
          const user_data = userSnapshot.data();
          //@ts-ignore
          setCardUser(user_data);
          const referalCode = user_data.referralCode;
          const link = `${window.location.origin}/?ref=${referalCode}`;
          setRefLink(link);

          // === DATE KEYS ===
          const now = new Date();
          const monthKey = `${now.getFullYear()}-${String(
            now.getMonth() + 1
          ).padStart(2, "0")}`;
          const dayKey = `${now.getFullYear()}-${String(
            now.getMonth() + 1
          ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

          // === EXISTING COUNTERS ===
          const currentViews = cardData.cardView || 0;
          const cardViewsByMonth = cardData.cardViewsByMonth || {};
          const updatedMonthViews = (cardViewsByMonth[monthKey] || 0) + 1;

          // === NEW DAILY COUNTER ===
          const cardViewsByDay = cardData.cardViewsByDay || {};
          const updatedDayViews = (cardViewsByDay[dayKey] || 0) + 1;

          // === UPDATE ONLY IF VIEWER != OWNER ===
          if (user?.uid !== cardData?.uid) {
            await updateDoc(cardDoc.ref, {
              cardView: currentViews + 1,
              [`cardViewsByMonth.${monthKey}`]: updatedMonthViews,
              [`cardViewsByDay.${dayKey}`]: updatedDayViews,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching card details:", error);
      }
    }

    fetchCardDetails();
  }, [showThankYouModal]);

  // Modal sequence handlers
  const handleCloseShareModal = () => {
    if (user?.planType === "free" && !isTrialActive) {
      setShareModalAnimateClass("translate-y-full");
      setTimeout(() => {
        setShowShareModal(false);
        setTimeout(() => {
          handleCloseContactModal();
          setTimeout(() => {
            setContactModalAnimateClass("translate-y-0");
          }, 500);
        }, 200);
      }, 700);

      return;
    } else if (!user) {
      const createdAt = parseCreatedAt(cardUser?.createdAt);
      const trialEnd = new Date(
        createdAt.getTime() + cardUser?.freeTrialPeriod * 24 * 60 * 60 * 1000
      );
      const isTrialActive = new Date() <= trialEnd;
      if (cardUser?.planType === "free" && !isTrialActive) {
        setShareModalAnimateClass("translate-y-full");
        setTimeout(() => {
          setShowShareModal(false);
          setTimeout(() => {
            handleCloseContactModal();
            setTimeout(() => {
              setContactModalAnimateClass("translate-y-0");
            }, 500);
          }, 200);
        }, 700);
      } else {
        setShareModalAnimateClass("translate-y-full");
        setTimeout(() => {
          setShowShareModal(false);
          setTimeout(() => {
            setShowContactModal(true);
            setTimeout(() => {
              setContactModalAnimateClass("translate-y-0");
            }, 500);
          }, 200);
        }, 700);
      }
      return;
    }

    setShareModalAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowShareModal(false);
      setTimeout(() => {
        setShowContactModal(true);
        setTimeout(() => {
          setContactModalAnimateClass("translate-y-0");
        }, 500);
      }, 200);
    }, 700);
  };

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const createdAt = parseCreatedAt(user?.createdAt);
  const trialEnd = new Date(
    createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
  );
  const isTrialActive = new Date() <= trialEnd;

  const handleCloseContactModal = () => {
    setContactModalAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowContactModal(false);
      setUserName("");
      setCustomMessage(
        "Hey, want your own digital biz card like this? Grab one now, it just takes 2 minutes."
      );
      setCustomTitle("Free BizCard Offer!!!");
      setCustomButtonText("Get Your Free! BizCard Today");
      setShowThankYouModal(true);
    }, 700);
  };

  const handleDownloadVCard = async () => {
    if (user && cardType === "local") {
      //local cards can't be shared
      setLocalMessage(
        "Local cards can't saved your contacts. Please sync them."
      );
      setShowLocalModal(true);
      return;
    }
    // else if (!user) {
    //   setShowPermissionModal(true);
    //   return;
    // }

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
    console.log("card", card);

    try {
      const cardsQuery = query(
        collection(db, "cards"),
        where("metadata.id", "==", card.metadata.id)
      );
      const cardsSnapshot = await getDocs(cardsQuery);

      for (const cardDoc of cardsSnapshot.docs) {
        const cardData = cardDoc.data();

        const now = new Date();

        // === MONTHLY AND DAILY KEYS ===
        const monthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;
        const dayKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // === EXISTING COUNTERS ===
        const currentSaveContacts = cardData.saveContact || 0;
        const saveContactsByMonth = cardData.saveContactsByMonth || {};
        const saveContactsByDay = cardData.saveContactsByDay || {};

        // === UPDATED COUNTERS ===
        const updatedMonthSave = (saveContactsByMonth[monthKey] || 0) + 1;
        const updatedDaySave = (saveContactsByDay[dayKey] || 0) + 1;
        // === UPDATE ONLY IF USER IS NOT THE OWNER ===
        if (user?.uid !== cardData?.uid) {
          await updateDoc(cardDoc.ref, {
            saveContact: currentSaveContacts + 1,
            [`saveContactsByMonth.${monthKey}`]: updatedMonthSave,
            [`saveContactsByDay.${dayKey}`]: updatedDaySave,
          });
        }
      }
    } catch (error) {
      console.error("Error updating save contacts:", error);
    }

    // Show thank you popup after download
    setTimeout(() => {
      setUserName(card.profile?.firstName);
      setCustomMessage(
        `${
          card.profile?.firstName || "Contact"
        }'s contact details were downloaded to your phone.`
      );
      setCustomTitle("Great Job!!!");
      setCustomButtonText("Get a BizCard Free!");
      setShowThankYouModal(true);
    }, 1000);
  };

  const handleContactSubmit = (contactData: any) => {
    setIsSubmitting(true);

    // Simulate API call - replace with actual API endpoint
    const submitData = {
      ...contactData,
      cardName: getFullName(card),
      cardLink: window.location.href,
    };

    // Mock API call - replace with actual implementation
    setTimeout(() => {
      // toast({
      //   title: "Contact information sent!",
      //   description: "Your contact details have been shared successfully.",
      // });
      setIsSubmitting(false);
      setShowContactModal(false);
      setCustomMessage(
        " Hey, want your own digital biz card like this? Grab one now, it just takes 2 minutes."
      );
      setCustomTitle("Free BizCard Offer!!!");
      setCustomButtonText("Get Your Free! BizCard Today");
      setShowThankYouModal(true);
    }, 2000);
  };

  const handleCloseThankYou = () => {
    setThankYouAnimateClass("translate-y-full");
    setTimeout(() => {
      setShowThankYouModal(false);
      setCustomMessage("");
      setUserName("");
      setCustomTitle("");
      setCustomButtonText("");
      setThankYouAnimateClass("translate-y-0");
    }, 500);
  };

  const handleSharedCard = () => {
    if (user && cardType === "local") {
      //local cards can't be shared
      setLocalMessage("Local cards can't be shared. Please sync them.");
      setShowLocalModal(true);
      return;
    }
    setShowShareModal(true);
    setUserName("");
  };

  const navigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
      return;
    }
    router.back();
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-6 flex flex-col relative"
      style={{ backgroundColor: `${card.brandColor}20` }}
    >
      <div
        className={cn(
          showLocalModal || showPermissionModal
            ? "blur-sm pointer-events-none"
            : "",
          "business-card-display"
        )}
      >
        {showBackButton && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={navigateBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
        )}
        <BusinessCardPreview
          card={card}
          isEditMode={option === "edit" && cardType === "local"}
        />
      </div>

      {/* Footer */}
      <div
        className={cn(
          showLocalModal || showPermissionModal
            ? "blur-sm pointer-events-none"
            : "",
          "fixed bottom-0 left-0 right-0"
        )}
      >
        {/* max-w-md */}
        <div className="max-w-md mx-auto w-full px-4 sm:px-0">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <>
              <button
                onClick={() => handleSharedCard()}
                className="px-4 h-[40px] text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: card.brandColor }}
              >
                <Share2 size={20} />
                Share Card
              </button>

              <button
                onClick={handleDownloadVCard}
                className="px-4 h-[40px] text-white rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: card.brandColor }}
              >
                <Download size={20} />
                Save Contact
              </button>
            </>
          </div>

          {/* Footer Text */}
          <div
            className="text-center text-white text-xs h-[20px] flex items-center justify-center px-1 rounded-t-lg"
            style={{ backgroundColor: card.brandColor, lineHeight: "30px" }}
          >
            <span className="italic">
              Created by:{" "}
              <a
                href={refLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
              >
                {process.env.NEXT_PUBLIC_API_LIVE_URL}
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed footer */}
      <div className="h-20" />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        url={`${window.location.href}?selectedTab=favorites&view=true`}
        refLink={refLink}
        title={`${getFullName(card)}'s Digital Business Card`}
        cardProfile={card.profile}
        cardBusiness={card.profile}
        cardBrandColor={card.brandColor}
        animateClass={shareModalAnimateClass}
        cardData={card}
        isLocal={cardType === "local"}
        qrCodeUrl={`${card.qrCode?.qrCodeUrl}?selectedTab=favorites&view=true`}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={handleCloseContactModal}
        animateClass={contactModalAnimateClass}
        username={card.profile?.firstName || "user"}
        isSubmitting={isSubmitting}
        cardData={card}
        theme={card.brandColor}
        onSubmitContact={handleContactSubmit}
        isLocal={cardType === "local"}
      />

      {/* Thank You Popup */}
      <ThankYouPopup
        isOpen={showThankYouModal}
        onClose={handleCloseThankYou}
        animateClass={thankYouAnimateClass}
        customTitle={customTitle}
        customMessage={customMessage}
        customButtonText={customButtonText}
        theme={card.brandColor}
        username={userName}
        profilePhoto={card.profilePhoto}
        Link={refLink}
      />

      {showPermissionModal && (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0" // matches sidebar width
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-96 text-center">
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

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/?signIn=true"), 100);
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}

      {showLocalModal && (
        <div
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0" // matches sidebar width
          )}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-96 text-center">
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
            <p className="text-gray-600 mb-8 leading-relaxed">{localMessage}</p>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowLocalModal(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
