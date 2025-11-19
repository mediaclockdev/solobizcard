"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

export function CardVisibilitySection({
  card,
  onUpdate,
  selectedTab = "local",
}: FormComponentProps) {
  const { user } = useAuth();
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  function parseCreatedAt(input: any) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

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

  const isProLocked = selectedTab != "local" && isFreePlan && !isTrialActive;

  const handleVisibilityChange = (isPublic: boolean) => {
    if (isProLocked) {
      setShowWarning(true);
      return;
    }

    const updatedCard = { ...card };
    updatedCard.metadata.isPublic = isPublic;
    onUpdate(updatedCard);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground flex">
        Card Visibility
        {isProLocked && <Lock size={14} className="ml-1 text-yellow-500" />}
      </Label>
      <div className="flex space-x-2">
        <Button
          type="button"
          variant={card.metadata.isPublic ? "outline" : "default"}
          size="sm"
          onClick={() => handleVisibilityChange(false)}
          className="px-6"
        >
          Private
        </Button>
        <Button
          type="button"
          variant={card.metadata.isPublic ? "default" : "outline"}
          size="sm"
          onClick={() => handleVisibilityChange(true)}
          className="px-6"
        >
          Public
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Only people with the direct link can view your card
      </p>
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
