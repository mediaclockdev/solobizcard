"use client";
import React, { useEffect, useState } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Upload, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays } from "date-fns";
import UpgradeModal from "@/components/UpgradeModal";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";

export function AppointmentForm({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [modelMsg, setModelMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const storage = getStorage();

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
      appointments: {
        ...card.appointments,
        [field]: value,
      },
    };
    onUpdate(updatedCard);
  };

  const handleDirectAdsChange = (field: string, value: string) => {
    const updatedCard = {
      ...card,
      appointments: {
        ...card.appointments,
        directAds: {
          ...card.appointments.directAds,
          [field]: value,
        },
      },
    };
    onUpdate(updatedCard);
  };

  const handleAppointmentTypeChange = (
    value: "booking" | "call-to-action" | "direct-ads" | "lead-capture"
  ) => {
    if (
      (value === "call-to-action" ||
        value === "direct-ads" ||
        value === "lead-capture") &&
      !isAuthenticated
    ) {
      const message =
        value === "call-to-action"
          ? "This is a premium feature. Please log in to access Call-to-Action."
          : "This is a premium feature. Please log in to access Direct Ads.";

      setModelMsg(message);
      setShowSignIn(true);
      return;
    } else if (
      (value === "call-to-action" ||
        value === "direct-ads" ||
        value === "lead-capture") &&
      canShowCustomSection() === false
    ) {
      setShowWarning(true);
      return;
    }

    const updatedCard = {
      ...card,
      appointments: {
        ...card.appointments,
        appointmentType: value,
      },
    };
    onUpdate(updatedCard);
  };

  /**
   * ✅ Upload Direct Ads image to Firebase Storage
   */
  const uploadDirectAdsImage = async (
    file: File,
    oldUrl?: string | null
  ): Promise<string> => {
    const filePath = `/cards/${user?.uid}/${card.id}/directAds/${Date.now()}-${
      file.name
    }`;
    const storageRef = ref(storage, filePath);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    if (oldUrl) {
      try {
        const oldRef = ref(storage, oldUrl);
        await deleteObject(oldRef);
      } catch (err) {
        console.warn("Old Direct Ads image could not be deleted:", err);
      }
    }

    return downloadURL;
  };

  /**
   * ✅ Handle Direct Ads Upload
   */
  // const handleImageUpload = async (file: File) => {
  //   if (!user?.uid) {
  //     setModelMsg("You must be logged in to upload Direct Ads images.");
  //     setShowSignIn(true);
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     alert("File must be under 5MB.");
  //     return;
  //   }

  //   try {
  //     setIsUploading(true);

  //     const oldUrl = card.appointments.directAds?.image || null;
  //     const downloadURL = await uploadDirectAdsImage(file, oldUrl);

  //     const updatedCard = {
  //       ...card,
  //       appointments: {
  //         ...card.appointments,
  //         directAds: {
  //           ...card.appointments.directAds,
  //           image: downloadURL,
  //         },
  //       },
  //     };

  //     if (card.id) {
  //       await updateDoc(doc(db, "cards", card.id), updatedCard);
  //     }

  //     onUpdate(updatedCard);
  //   } catch (err) {
  //     console.error("Failed to upload Direct Ads image:", err);
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const handleImageUpload = async (file: File) => {
    if (!user?.uid) {
      setModelMsg("You must be logged in to upload Direct Ads images.");
      setShowSignIn(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB.");
      return;
    }

    try {
      setIsUploading(true);

      // ✅ Compress image to around 25 KB
      const options = {
        maxSizeMB: 0.025, // 25 KB
        maxWidthOrHeight: 800, // adjust as needed (800px width or height)
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // ✅ Upload compressed file
      const oldUrl = card.appointments.directAds?.image || null;
      const downloadURL = await uploadDirectAdsImage(compressedFile, oldUrl);

      // ✅ Update Firestore
      const updatedCard = {
        ...card,
        appointments: {
          ...card.appointments,
          directAds: {
            ...card.appointments.directAds,
            image: downloadURL,
          },
        },
      };

      if (card.id) {
        await updateDoc(doc(db, "cards", card.id), updatedCard);
      }

      onUpdate(updatedCard);
    } catch (err) {
      console.error("Failed to upload Direct Ads image:", err);
    } finally {
      setIsUploading(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
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
            setTrialDays(0); // no trial if missing
          }
        }
      } catch (err) {
        console.error("Failed to fetch trial days:", err);
        setTrialDays(0);
      }
    };

    fetchTrialDays();
  }, [user]);

  const appointmentType = card.appointments?.appointmentType || "booking";

  return (
    <div className="space-y-4">
      {/* Appointment Type Selection */}
      <div>
        <Label className="text-base font-medium mb-4 block">
          Appointment Type
        </Label>
        <p className="text-gray-500 mb-2 text-sm">
          You must log in to use Pro Features. Sign-up is Free!
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-4 mt-4">
          {/* Booking */}
          <label
            htmlFor="booking"
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <input
              type="radio"
              id="booking"
              name="appointmentType"
              value="booking"
              checked={appointmentType === "booking"}
              onChange={(e) =>
                handleAppointmentTypeChange(e.target.value as "booking")
              }
            />
            <span>Booking Link</span>
          </label>

          {/* CTA */}
          <label
            htmlFor="call-to-action"
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <input
              type="radio"
              id="call-to-action"
              name="appointmentType"
              value="call-to-action"
              checked={appointmentType === "call-to-action"}
              onChange={(e) =>
                handleAppointmentTypeChange(e.target.value as "call-to-action")
              }
              className="w-4 h-4 text-blue-600"
            />
            Call-to-Action
            {trialDays !== null && canShowCustomSection() !== true && (
              <Lock size={14} className="ml-1 text-yellow-500" />
            )}
          </label>

          {/* Direct Ads */}
          <label
            htmlFor="direct-ads"
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            <input
              type="radio"
              id="direct-ads"
              name="appointmentType"
              value="direct-ads"
              checked={appointmentType === "direct-ads"}
              onChange={(e) =>
                handleAppointmentTypeChange(e.target.value as "direct-ads")
              }
              className="w-4 h-4 text-blue-600"
            />
            Direct Ads
            {trialDays !== null && canShowCustomSection() !== true && (
              <Lock size={14} className="ml-1 text-yellow-500" />
            )}
          </label>

          {/* Lead Capture */}
          {!isEditMode && (
            <label
              htmlFor="lead-capture"
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <input
                type="radio"
                id="lead-capture"
                name="appointmentType"
                value="lead-capture"
                checked={appointmentType === "lead-capture"}
                onChange={(e) =>
                  handleAppointmentTypeChange(e.target.value as "lead-capture")
                }
                className="w-4 h-4 text-blue-600"
              />
              Lead Capture
              {trialDays !== null && canShowCustomSection() !== true && (
                <Lock size={14} className="ml-1 text-yellow-500" />
              )}
            </label>
          )}
        </div>
      </div>

      {/* Booking Section */}
      {appointmentType === "booking" && (
        <div className="space-y-4">
          {/* Scheduler */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Scheduler</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="bookingPlatform"
                  value="calendly"
                  checked={
                    !card.appointments.platform ||
                    card.appointments.platform === "calendly"
                  }
                  onChange={(e) =>
                    handleInputChange("platform", e.target.value)
                  }
                />
                Calendly
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="bookingPlatform"
                  value="google"
                  checked={card.appointments.platform === "google"}
                  onChange={(e) =>
                    handleInputChange("platform", e.target.value)
                  }
                />
                Google Calendar
              </label>
            </div>
          </div>

          {/* Calendly URL */}
          {(!card.appointments.platform ||
            card.appointments.platform === "calendly") && (
            <div className="space-y-2">
              <Label htmlFor="calendlyUrl" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendly URL
              </Label>
              <Input
                id="calendlyUrl"
                type="url"
                value={card.appointments.calendlyUrl || "https://calendly.com/"}
                onChange={(e) =>
                  handleInputChange("calendlyUrl", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Example: <code>https://calendly.com/john-doe</code>
              </p>
            </div>
          )}

          {/* Google URL */}
          {card.appointments.platform === "google" && (
            <div className="space-y-2">
              <Label htmlFor="googleUrl" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Google Calendar URL
              </Label>
              <Input
                id="googleUrl"
                type="url"
                value={
                  card.appointments.googleUrl ||
                  "https://calendar.google.com/calendar/u/0/r/eventedit"
                }
                onChange={(e) => handleInputChange("googleUrl", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Example:{" "}
                <code>
                  https://calendar.google.com/calendar/u/0/r/eventedit?someparams
                </code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* CTA Section */}
      {appointmentType === "call-to-action" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ctaLabel">Custom Button Text</Label>
            <Input
              id="ctaLabel"
              placeholder="Schedule Meeting, Get Quote, Contact Me"
              value={card.appointments.ctaLabel || ""}
              onChange={(e) => handleInputChange("ctaLabel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctaUrl">Custom Button URL</Label>
            <Input
              id="ctaUrl"
              type="url"
              placeholder="https://example.com/contact"
              value={card.appointments.ctaUrl || "https://"}
              onChange={(e) => handleInputChange("ctaUrl", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Direct Ads Section */}
      {appointmentType === "direct-ads" && (
        <div className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Direct Ads Type</Label>
            <Select
              value={card.appointments.directAds?.type || ""}
              onValueChange={(value) => handleDirectAdsChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select One" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="Event">Event</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>
              {card.appointments.directAds?.type || "Product"} Image
            </Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {card.appointments.directAds?.image ? (
                <div className="space-y-2">
                  <img
                    src={card.appointments.directAds.image}
                    alt="Uploaded"
                    className="max-w-full h-32 object-contain mx-auto rounded"
                  />
                  <p className="text-sm text-gray-600">
                    {isUploading
                      ? "Uploading..."
                      : "Image uploaded successfully"}
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm">
                      Change image
                    </span>
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    {isUploading
                      ? "Uploading..."
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG or GIF (max. 5MB)
                  </p>
                  <p className="text-xs text-gray-500">
                    For optimal results, please use dimensions up to 8.5" x 11".
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      Browse files
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onShowSignUp={() => {
          setShowSignIn(false);
          setIsSignUpOpen(true);
        }}
        message={modelMsg}
      />
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
