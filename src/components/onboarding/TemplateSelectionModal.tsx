"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

interface TemplateSelectionModalProps extends FormComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

type TemplateType = "classic" | "modern" | "traditional";

export function TemplateSelectionModal({
  card,
  onUpdate,
  isOpen,
  onClose,
}: TemplateSelectionModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    card.templateType || "classic"
  );
  const [storedClassicTemplateImage, setStoredclassicTemplateImage] =
    useState<string>();

  const [storedTraditionalTemplateImage, setStoredTraditionalTemplateImage] =
    useState<string | null>(null);

  const templates = [
    {
      id: "traditional" as TemplateType,
      name: "Traditional",
      description: "Clean and professional design",
    },
    {
      id: "classic" as TemplateType,
      name: "Classic",
      description: "Timeless and elegant layout",
    },
  ];

  const handleApply = () => {
    // Reset card layout to default when template changes
    const defaultLayout =
      selectedTemplate === "classic" ? "standard" : "portrait";
    onUpdate({
      ...card,
      templateType: selectedTemplate,
      cardLayout: defaultLayout,
    });
    onClose();
  };

  const CARD_DOC_ID = "mainCard";

  const fetchImage = async () => {
    try {
      const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Fetch classic template URL
        if (data.classicTemplate) {
          setStoredclassicTemplateImage(data?.classicTemplate?.url);
        }

        // Fetch traditional template URL
        if (data.traditionalTemplate) {
          setStoredTraditionalTemplateImage(data?.traditionalTemplate?.url);
        }
      } else {
        setStoredclassicTemplateImage(null);
        setStoredTraditionalTemplateImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
    }
  };

  useEffect(() => {
    fetchImage();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-4">
        <DialogHeader>
          <DialogTitle>Choose Template</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 items-start">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`rounded-lg border-2 transition-all text-center flex flex-col items-start h-full ${
                selectedTemplate === template.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <img
                src={
                  template.id === "classic"
                    ? storedClassicTemplateImage ||
                      "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png"
                    : storedTraditionalTemplateImage ||
                      "/lovable-uploads/4d306865-6c0d-4bd6-a6a0-042a7bdae383.png"
                }
                alt={`${template.name} template preview`}
                className="w-full h-auto rounded-t-lg"
              />

              <div className="p-2">
                <h3 className="font-semibold text-sm">{template.name}</h3>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
