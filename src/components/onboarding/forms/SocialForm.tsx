"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UpgradeModal from "@/components/UpgradeModal";
export function SocialForm({ card, onUpdate }: FormComponentProps) {
  const [warning, setWarning] = useState("");
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { user } = useAuth();
  const baseUrls: Record<string, string> = {
    linkedin: "https://linkedin.com/in/",
    twitter: "https://twitter.com/",
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/channel/",
    tiktok: "https://tiktok.com/",
  };

  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const countActive = () =>
    Object.keys(baseUrls).reduce((count, key) => {
      const value = card.social[key as keyof typeof card.social];
      const prefix = baseUrls[key];
      return value && value.trim() !== "" && value !== prefix
        ? count + 1
        : count;
    }, 0);

  const isLocked = (platform: string) => {
    const activeCount = countActive();
    const value = card.social[platform as keyof typeof card.social] || "";
    const prefix = baseUrls[platform];
    const isFieldActive = value && value !== prefix;
    return activeCount >= 4 && !isFieldActive;
  };

  const handleInputChange = (field: string, value: string) => {
    if (isLocked(field)) {
      setWarning("Maximum of 4 social media links allowed");
      return;
    }
    setWarning("");
    const prefix = baseUrls[field];
    let fullUrl = prefix ?? "";
    // return;
    const defaultValue = value + "/";
    if (value.length > 0) {
      if (defaultValue !== prefix) {
        // if(value.includes(prefix))
        let cleanValue = value.replace(prefix, "");
        console.log("ccc", cleanValue);
        if (cleanValue?.includes(field)) {
          fullUrl = cleanValue ? cleanValue : "";
          console.log("fff=", fullUrl);
        } else {
          fullUrl = cleanValue ? prefix + cleanValue : "";
        }
      }
    }

    const updatedCard = {
      ...card,
      social: {
        ...card.social,
        [field]: fullUrl,
      },
    };
    onUpdate(updatedCard);
  };

  const handleFocus = (field: string) => {
    const prefix = baseUrls[field];
    const currentValue = card.social[field as keyof typeof card.social] || "";

    if (isLocked(field)) {
      setWarning("Maximum of 4 social media links allowed");
      return;
    } else {
      setWarning("");
    }

    if (!currentValue) {
      onUpdate({
        ...card,
        social: {
          ...card.social,
          [field]: prefix,
        },
      });
    }
  };

  const handleBlur = (field: string) => {
    const prefix = baseUrls[field];
    const currentValue = card.social[field as keyof typeof card.social] || "";
    if (currentValue === prefix) {
      onUpdate({
        ...card,
        social: {
          ...card.social,
          [field]: "",
        },
      });
    }
  };

  const socialPlatforms = [
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      placeholder: "https://linkedin.com/in/your-profile",
    },
    {
      key: "twitter",
      label: "Twitter/X",
      icon: Twitter,
      placeholder: "https://twitter.com/your-profile",
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: Facebook,
      placeholder: "https://facebook.com/your-profile",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: Instagram,
      placeholder: "https://instagram.com/your-profile",
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: Youtube,
      placeholder: "https://youtube.com/channel/your-channel-id",
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: () => (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
        </svg>
      ),
      placeholder: "https://tiktok.com/@your-username",
    },
  ];

  useEffect(() => {
    if (!user) return;

    const isFree = user?.planType === "free";
    setIsFreePlan(isFree);

    const createdAt = parseCreatedAt(user?.createdAt);
    const trialEnd = new Date(
      createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
    );
    const trialActive = new Date() <= trialEnd;
    setIsTrialActive(trialActive);
  }, [user]);
  const isProLocked = isFreePlan && !isTrialActive;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground mb-6">
        Add your social media profiles to help people connect with you. (Max 4)
      </p>

      <div className="space-y-4">
        {warning && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{warning}</div>
        )}

        {socialPlatforms.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>

              {isProLocked && (
                <Lock
                  size={14}
                  className="ml-1 text-yellow-500"
                  onClick={() => setShowWarning(true)}
                />
              )}
            </Label>

            <Input
              id={key}
              type="text"
              placeholder={placeholder}
              value={card.social[key as keyof typeof card.social] || ""}
              onFocus={() => handleFocus(key)}
              onBlur={() => handleBlur(key)}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className={isLocked(key) ? "bg-gray-100 cursor-not-allowed" : ""}
              disabled={isProLocked}
            />
          </div>
        ))}
      </div>
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
