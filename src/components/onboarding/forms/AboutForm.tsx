"use client";
import React, { useContext, useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardDataContext } from "@/contexts/CardContext";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { differenceInDays } from "date-fns";
import UpgradeModal from "@/components/UpgradeModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

import dynamic from "next/dynamic";
import ClassicEditorBuild from "@ckeditor/ckeditor5-build-classic";

const CKEditor = dynamic<{
  data: string;
  onChange: (event: any, editor: any) => void;
}>(
  async () => {
    const { CKEditor } = await import("@ckeditor/ckeditor5-react");
    const ClassicEditor = (await import("@ckeditor/ckeditor5-build-classic"))
      .default;
    //@ts-ignore
    return (props) => <CKEditor {...props} editor={ClassicEditor} />;
  },
  { ssr: false }
);

export function AboutForm({ card, onUpdate }: FormComponentProps) {
  const { cardData, setCardData } = useContext(CardDataContext);
  const { isAuthenticated, user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [data, setData] = useState(card.about.bio || "");
  const {
    sectionType = "aboutMe",
    customSectionTitle = "",
    aboutMe = "",
  } = cardData.about || {};

  useEffect(() => {
    if (showWarning) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [showWarning]);

  const handleInputChange = (field: string, value: string) => {
    const updatedCard = {
      ...card,
      about: {
        ...card.about,
        [field]: value,
      },
    };
    onUpdate(updatedCard);
  };

  const handleSectionTypeChange = (newType) => {
    if (newType === "custom" && !isAuthenticated) {
      setShowSignIn(true);
      return;
    } else if (newType === "custom" && canShowCustomSection() == false) {
      setShowWarning(true);
      return;
    }
    console.log("newType==", newType);
    setCardData((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        sectionType: newType,
      },
    }));
    const updatedCard = {
      ...card,
      about: {
        ...cardData.about,
        bio: card.about.bio ?? "",
        sectionType: newType,
        customSectionTitle: card?.about?.customSectionTitle ?? "",
      },
    };
    onUpdate(updatedCard);
  };

  const handleCustomTitleChange = (e) => {
    setCardData((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        customSectionTitle: e.target.value,
      },
    }));
    const updatedCard = {
      ...card,
      about: {
        ...cardData.about,
        bio: card.about.bio ?? "",
        customSectionTitle: e.target.value,
      },
    };
    onUpdate(updatedCard);
  };

  const handleAboutChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 250);
    const updatedCard = {
      ...card,
      about: {
        ...card.about,
        bio: text,
        customSectionTitle: "About Me",

        sectionType: "aboutMe",
      },
    };
    onUpdate(updatedCard);
  };

  const [trialDays, setTrialDays] = useState<number | null>(null);

  const canShowCustomSection = () => {
    if (!user) return false;
    if (user.planType !== "free") return true;
    if (!user.createdAt) return false;
    if (trialDays === null) return false; // ⏳ still loading

    let createdDate: Date;
    if (typeof user.createdAt === "string") {
      createdDate = new Date(user.createdAt);
    } else if ("seconds" in user.createdAt) {
      //@ts-ignore
      createdDate = new Date(user.createdAt?.seconds * 1000);
    } else {
      return false;
    }

    const today = new Date();
    const daysSinceCreated = differenceInDays(today, createdDate);
    return daysSinceCreated <= trialDays;
  };

  const charCount = card?.about?.bio?.length ?? 0;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const fetchTrialDays = async () => {
      try {
        if (user) {
          const userRef = doc(db, "users", user?.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) throw new Error("User not found");
          const userData = userSnap.data() as any;
          if (userData) {
            const period = Number(userData.freeTrialPeriod);
            setTrialDays(!isNaN(period) ? period : 0);
          }
        } else {
          const settingsRef = doc(db, "settings", "PricingRequirement");
          const snap = await getDoc(settingsRef);
          if (snap.exists()) {
            const data = snap.data();
            const period = Number(data.freeTrialPeriod);
            setTrialDays(!isNaN(period) ? period : 0);
          } else {
            setTrialDays(0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch trial days:", err);
        setTrialDays(0);
      }
    };

    fetchTrialDays();

    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, [user]);

  function htmlToText(html: string): string {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }
  return (
    <div className="space-y-6">
      <div>
        <div className="space-y-4">
          <div className="space-y-2">
            {/* Section Type */}
            <div>
              <label className="block text-sm text-gray-700 font-medium mb-2">
                Section Type
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {/* About Me Radio */}
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sectionType"
                    className="mr-1"
                    checked={sectionType === "aboutMe"}
                    onChange={() => handleSectionTypeChange("aboutMe")}
                  />
                  <span className="text-sm text-gray-700">About Me</span>
                </label>

                {/* Custom Section Title Radio */}

                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="sectionType"
                    className="mr-1"
                    checked={sectionType === "custom"}
                    onChange={() => handleSectionTypeChange("custom")}
                  />
                  <span className="text-sm text-gray-700">
                    Custom Section Title
                  </span>
                  {trialDays !== null && canShowCustomSection() !== true && (
                    <Lock size={14} className="ml-1 text-yellow-500" />
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* If custom section title is selected, show the text input */}
          {sectionType === "custom" && (
            <div>
              <input
                type="text"
                placeholder="Enter custom section title"
                value={card.about.customSectionTitle}
                onChange={handleCustomTitleChange}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm text-gray-700 font-medium mb-3">
              Short Bio, Company Description, Education, etc.{" "}
              <span className="text-gray-600">{charCount}/250</span>
            </label>
            {sectionType !== "custom" && (
              <textarea
                rows={5}
                value={htmlToText(card.about.bio)}
                onChange={(e) => handleAboutChange(e)}
                maxLength={250}
                placeholder="Share your professional background, expertise, or company mission. What makes you or your business unique?"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
              />
            )}

            {sectionType === "custom" && isClient && (
              <CKEditor
                data={data}
                onChange={(event, editor) => {
                  const html = editor.getData();
                  const plainText = htmlToText(html);

                  setData(html);
                  onUpdate({
                    ...card,
                    about: { ...card.about, bio: html },
                  });
                }}
              />
            )}
            <p className="text-xs text-muted-foreground">
              This will appear on your business card to help people understand
              what you do.
            </p>
          </div>
        </div>
      </div>
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onShowSignUp={() => {
          setShowSignIn(false);
          setIsSignUpOpen(true);
        }}
        message="This is a premium feature. Please log in to access Custom Section Title."
      />

      {/* Sign Up Modal */}
      {isSignUpOpen && (
        <SignUpModal
          isOpen={isSignUpOpen}
          onClose={() => setIsSignUpOpen(false)}
          onShowSignIn={() => {
            setIsSignUpOpen(false);
            setShowSignIn(true);
          }}
        />
      )}
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
