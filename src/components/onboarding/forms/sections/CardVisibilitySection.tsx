"use client";
import React from 'react';
import { FormComponentProps } from '@/types/businessCard';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function CardVisibilitySection({ card, onUpdate }: FormComponentProps) {
  const handleVisibilityChange = (isPublic: boolean) => {
    const updatedCard = { ...card };
    updatedCard.metadata.isPublic = isPublic;
    onUpdate(updatedCard);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Card Visibility</Label>
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
    </div>
  );
}