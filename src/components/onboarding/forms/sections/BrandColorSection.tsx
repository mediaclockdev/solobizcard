"use client";
import React from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultBrandColors } from "@/utils/businessCard";

export function BrandColorSection({ card, onUpdate }: FormComponentProps) {
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

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Brand Color</Label>

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
    </div>
  );
}
