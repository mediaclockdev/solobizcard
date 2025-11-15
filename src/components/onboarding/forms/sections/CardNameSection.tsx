"use client";
import React, { useState, useEffect } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isUrlNameAvailable, generateUniqueUrlName } from "@/utils/cardStorage";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";

export function CardNameSection({
  card,
  onUpdate,
  selectedTab,
  isEditMode,
}: FormComponentProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<string>("");
  const [inputValue, setInputValue] = useState(card.urlName || "");
  const handleInputChange = (field: string, value: string) => {
    const formattedValue = value.replace(/[^a-zA-Z\s-]/g, "");

    // 2. Split keys for nested object
    const keys = field.split(".");
    const updatedCard: any = { ...card };
    let temp = updatedCard;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        temp[key] = formattedValue; // set final value
      } else {
        temp[key] = { ...temp[key] };
        temp = temp[key];
      }
    });

    onUpdate(updatedCard);
  };

  const handleInputBlur = (field: string) => {
    let formattedValue = card.urlName
      .toLowerCase()
      .replace(/\s+/g, "-") // convert spaces to hyphens
      .replace(/-+/g, "-") // merge consecutive hyphens
      .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens

    setInputValue(formattedValue);

    const keys = field.split(".");
    const updatedCard = { ...card };

    if (keys.length === 1) {
      (updatedCard as any)[keys[0]] = formattedValue;
    } else if (keys.length === 2) {
      (updatedCard as any)[keys[0]][keys[1]] = formattedValue;
    }
    onUpdate(updatedCard);
  };

  // Check availability when urlName changes
  useEffect(() => {
    const checkUrlName = async () => {
      if (card.urlName?.trim()) {
        const available = await isUrlNameAvailable(
          card.urlName,
          card.metadata?.id,
          selectedTab == "favorites" ? true : false
        );

        setIsAvailable(available);

        if (!available) {
          setSuggestion(await generateUniqueUrlName(card.urlName, card.metadata?.id,selectedTab == "favorites" ? true : false));
        } else {
          setSuggestion("");
        }
      } else {
        setIsAvailable(null);
        setSuggestion("");
      }
    };

    checkUrlName();
  }, [card.urlName, card.metadata?.id]);

  const handleSuggestionClick = () => {
    if (suggestion) {
      handleInputChange("urlName", suggestion);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="urlName" className="text-sm font-medium text-foreground">
        Card Name <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id="urlName"
          placeholder="e.g., john-smith-business-card"
          value={card.urlName}
          onChange={(e) => handleInputChange("urlName", e.target.value)}
          readOnly={isEditMode}
          onBlur={(e) => handleInputBlur("urlName")}
          className={`w-full pr-10 ${
            isAvailable === false && !isEditMode
              ? "border-destructive"
              : isAvailable === true && !isEditMode
              ? "border-green-500"
              : ""
          }`}
        />
        {isAvailable !== null && card.urlName?.trim() && !isEditMode && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isAvailable ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>

      {/* Status messages */}
      {isAvailable === true && card.urlName?.trim() && !isEditMode && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          This name is available!
        </p>
      )}

      {isAvailable === false && suggestion && !isEditMode && (
        <div className="space-y-2">
          <p className="text-sm text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            This name is already taken
          </p>
          <button
            type="button"
            onClick={handleSuggestionClick}
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 underline"
          >
            <Lightbulb className="h-3 w-3" />
            Try "{suggestion}" instead
          </button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        A unique identifier for your card's URL
      </p>
    </div>
  );
}
