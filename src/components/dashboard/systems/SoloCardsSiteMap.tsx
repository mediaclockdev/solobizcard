"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function SoloCardsSiteMap() {
  // State for video settings
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const { showToast } = useToast();

  // Firestore document reference
  const settingsRef = doc(db, "settings", "SoloCardsVideo");

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title || "");
          setSubtitle(data.subtitle || "");
          setVideoLink(data.videoLink || "");
        }
      } catch (error) {
        console.error("Error fetching video settings:", error);
        showToast("Failed to fetch video settings.", "error");
      }
    };

    fetchSettings();
  }, []);

  // Save settings to Firestore
  const handleSave = async () => {
    try {
      await setDoc(settingsRef, {
        title,
        subtitle,
        videoLink,
      });

      showToast("SoloCards Action Settings Saved", "success");
    } catch (error) {
      console.error("Error saving video settings:", error);
      showToast("Failed to save video settings", "error");
    }
  };

  return (
    <Card className="lg:col-span-3 card-hover">
      <CardHeader>
        <CardTitle className="text-lg">See SoloCards Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            List of all pages links
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Pricing: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}pricing`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}pricing`}
              </a>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Members: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}members`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}members`}
              </a>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Slides: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}slides`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}slides`}
              </a>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Opportunities: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}opportunities`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}opportunities`}
              </a>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Landing: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}landing`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}landing`}
              </a>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Solo Cards Links: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}benefits`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}benefits`}
              </a>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm">Contact Us: </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_LIVE_URL}contact`}
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {`${process.env.NEXT_PUBLIC_API_LIVE_URL}contact`}
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
