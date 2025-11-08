"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultBrandColors } from "@/utils/businessCard";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";

export function BrandColorSection({ card, onUpdate }: FormComponentProps) {
  const { user } = useAuth();
  const [isTrialActive, setIsTrialActive] = useState<boolean>(false);
  const [isFreePlan, setIsFreePlan] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState(false);
  const handleInputChange = (field: string, value: string) => {
    const keys = field.split(".");
    const updatedCard = { ...card };

    if (keys.length === 1) {
      (updatedCard as any)[keys[0]] = value;
    } else if (keys.length === 2) {
      (updatedCard as any)[keys[0]][keys[1]] = value;
    }

    onUpdate(updatedCard);
  };

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  useEffect(() => {
    if (user) {
      const isFreePlan = user?.planType === "free";
      setIsFreePlan(isFreePlan);
      const createdAt = parseCreatedAt(user?.createdAt);
      const trialEnd = new Date(
        createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
      );
      const isTrialActive = new Date() <= trialEnd;
      setIsTrialActive(isTrialActive);
    }
  }, [user]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 text-xs sm:text-sm">
        <Label className="text-sm font-medium text-foreground">
          Brand Color
        </Label>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Color Picker + Hex Input */}
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={card.brandColor}
            onChange={(e) => handleInputChange("brandColor", e.target.value)}
            className="w-8 h-8 p-0 rounded border-none cursor-pointer"
          />
          <Input
            type="text"
            value={card.brandColor}
            onChange={(e) => handleInputChange("brandColor", e.target.value)}
            className="w-20 text-xs sm:text-sm p-1 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Color Presets */}
        <div className="flex flex-wrap gap-[8px] w-full">
          {defaultBrandColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleInputChange("brandColor", color)}
              className="w-7 h-7 rounded-full border border-gray-300 cursor-pointer hover:scale-[1.09]"
              style={
                card.brandColor.toLowerCase() === color.toLowerCase()
                  ? {
                      backgroundColor: color,
                      boxShadow: `0 0 0 1.5px white, 0 0 0 3.5px ${color}`,
                    }
                  : { backgroundColor: color }
              }
            />
          ))}
        </div>
      </div>
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
