"use client";
import React, { useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { TemplateSelectionModal } from "../../TemplateSelectionModal";

export function TemplateSelectionSection({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const isDisabled = !isEditMode;

  return (
    <TooltipProvider>
      {/* Change Template Button */}
      <div className="flex items-center justify-between">
        {isDisabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="px-8 border-primary text-primary opacity-50 cursor-not-allowed"
                onClick={() => !isDisabled && setIsTemplateModalOpen(true)}
              >
                Change Template
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Available when editing a card only.</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            className="px-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setIsTemplateModalOpen(true)}
          >
            Change Template
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {card.templateType
            ? `${card.templateType.charAt(0).toUpperCase() + card.templateType.slice(1)}`
            : "Template"}{" "}
          |{" "}
          {card.cardLayout
            ? `${card.cardLayout
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}`
            : "Portrait"}
        </span>
      </div>

      <TemplateSelectionModal
        card={card}
        onUpdate={onUpdate}
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </TooltipProvider>
  );
}
