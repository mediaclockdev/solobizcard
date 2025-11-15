"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FormComponentProps } from "@/types/businessCard";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Camera, Edit, Trash2 } from "lucide-react";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ReactCrop, { Crop, convertToPixelCrop } from "react-image-crop";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";
import { checkLocalCardExist } from "@/utils/cardStorage";
import { Plus, Minus, X } from "lucide-react";
import Cropper from "react-easy-crop";

// ---------- Compression Helper (Updated for ~100KB output) ----------
async function compressImage(
  file: File,
  maxWidth: number,
  targetKB: number
): Promise<File> {
  const targetMB = targetKB / 1024;

  const options = {
    maxSizeMB: targetMB,
    maxWidthOrHeight: maxWidth,
    useWebWorker: true,
    initialQuality: 0.95,
    alwaysKeepResolution: true,
  };

  try {
    let compressedFile = await imageCompression(file, options);

    // If still > target, try further manual compression
    while (compressedFile.size > targetKB * 1024) {
      const quality = Math.max(
        0.75,
        0.92 - compressedFile.size / (targetKB * 2048)
      );
      compressedFile = await imageCompression(compressedFile, {
        ...options,
        maxSizeMB: undefined,
        initialQuality: quality,
      });
      if (quality <= 0.5) break; // avoid over-degrading
    }

    return compressedFile;
  } catch (err) {
    console.error("Compression failed:", err);
    return file;
  }
}

// ---------- Crop Helper ----------
async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width!;
  canvas.height = crop.height!;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(
    image,
    crop.x! * scaleX,
    crop.y! * scaleY,
    crop.width! * scaleX,
    crop.height! * scaleY,
    0,
    0,
    crop.width!,
    crop.height!
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject("Canvas is empty");
      resolve(new File([blob], fileName, { type: "image/jpeg" }));
    }, "image/png");
  });
}

// ---------- Upload Helper ----------
async function uploadImage(
  userId: string,
  imageType: "cover" | "profile" | "logo",
  file: File,
  existingUrl?: string,
  cardId?: string
): Promise<string> {
  const storage = getStorage();

  if (existingUrl) {
    try {
      const pathStart = existingUrl.indexOf("/o/") + 3;
      const pathEnd = existingUrl.indexOf("?");
      const fullPath = decodeURIComponent(
        existingUrl.substring(pathStart, pathEnd)
      );
      const oldRef = ref(storage, fullPath);
      await deleteObject(oldRef);
    } catch (err) {
      console.warn("Failed to delete old image:", err);
    }
  }

  function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString("en-US", { month: "long" });
  const day = getDaySuffix(now.getDate());

  const storageRef = ref(
    storage,
    `cards/${year}/${month}/${day}/${userId}/${cardId}/${imageType}_${Date.now()}.jpg`
  );

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ---------- Remove Helper ----------
async function removeImage(
  userId: string | null,
  imageUrl: string,
  fieldName: "coverImage" | "profilePhoto" | "companyLogo",
  card: any,
  onUpdate: (updated: any) => void,
  resetInput: () => void,
  defaultProfile?: string
) {
  try {
    const storage = getStorage();

    // Only delete from storage if it's not the default profile image
    const isDefaultProfile =
      fieldName === "profilePhoto" &&
      imageUrl === "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png";
    if (!isDefaultProfile && imageUrl && userId) {
      const pathStart = imageUrl.indexOf("/o/") + 3;
      const pathEnd = imageUrl.indexOf("?");
      const fullPath = decodeURIComponent(
        imageUrl.substring(pathStart, pathEnd)
      );
      const oldRef = ref(storage, fullPath);
      await deleteObject(oldRef);
    }

    let updatedCard = { ...card };
    if (fieldName === "profilePhoto") {
      updatedCard[fieldName] = defaultProfile || "";
    } else {
      updatedCard[fieldName] = "";
    }

    if (userId) {
      if (card.id) {
        await updateDoc(doc(db, "cards", card.id), updatedCard);
      }
    } else {
      // offline: save to localStorage
      localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
    }

    resetInput();
    onUpdate(updatedCard);
  } catch (err) {
    console.error("Failed to remove image:", err);
  }
}

function CropModal({
  file,
  imageType,
  onClose,
  onComplete,
}: {
  file: File;
  imageType: "cover" | "profile" | "logo";
  onClose: () => void;
  onComplete: (croppedFile: File) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const { ASPECT_RATIO, FIXED_SIZE } = (() => {
    if (imageType === "cover")
      return { ASPECT_RATIO: 448 / 270, FIXED_SIZE: { w: 448, h: 270 } };
    if (imageType === "profile")
      return { ASPECT_RATIO: 450 / 600, FIXED_SIZE: { w: 450, h: 600 } };
    if (imageType === "logo")
      return { ASPECT_RATIO: 80 / 60, FIXED_SIZE: { w: 80, h: 60 } };
    return { ASPECT_RATIO: 1 / 1, FIXED_SIZE: null };
  })();

  // ✅ Make sure imageSrc is loaded *before* rendering Cropper
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createCroppedImage = async (): Promise<File> => {
    if (!croppedAreaPixels || !imageSrc) throw new Error("No crop area");

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No 2D context");

    const { x, y, width, height } = croppedAreaPixels;

    // If cover, force exact 448x270
    if (FIXED_SIZE) {
      canvas.width = FIXED_SIZE.w;
      canvas.height = FIXED_SIZE.h;
      ctx.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        FIXED_SIZE.w,
        FIXED_SIZE.h
      );
    } else {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    }

    return new Promise((resolve) => {
      const isPng = file.type === "image/png"; // detect transparency support
      const mimeType = isPng ? "image/png" : "image/jpeg";
      const fileExt = isPng ? ".png" : ".jpg";

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(
              new File([blob], file.name.replace(/\.\w+$/, fileExt), {
                type: mimeType,
              })
            );
          }
        },
        mimeType,
        1
      );
    });
  };

  const handleDone = async () => {
    try {
      const cropped = await createCroppedImage();
      onComplete(cropped);
      onClose();
    } catch (err) {
      console.error("Cropping failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[850px] max-w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800"></h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative flex-1 bg-gray-900">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop} // { x, y } for pan
              zoom={zoom} // Zoom level
              aspect={ASPECT_RATIO} // Keep your aspect ratio
              onCropChange={setCrop} // Update crop position
              onZoomChange={setZoom} // Update zoom
              onCropComplete={onCropComplete}
              cropShape="rect" // rectangle crop
              showGrid
              objectFit="contain" // important for zooming correctly
            />
          ) : (
            <div className="flex items-center justify-center text-white h-full">
              Loading image...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button onClick={() => setZoom((z) => Math.max(1, z - 0.2))}>
                <Minus />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />

              <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>
                <Plus />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
              >
                Crop & Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Component ----------
export function ImageUploadGrid({
  card,
  onUpdate,
  isEditMode,
}: FormComponentProps) {
  const { user } = useAuth();
  const isDisabled = !isEditMode;
  const { showToast } = useToast();

  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<"cover" | "profile" | "logo" | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCoverLoading, setIsCoverLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const fileInputRefs = {
    cover: useRef<HTMLInputElement | null>(null),
    profile: useRef<HTMLInputElement | null>(null),
    logo: useRef<HTMLInputElement | null>(null),
  };

  const fieldMap = {
    cover: "coverImage",
    profile: "profilePhoto",
    logo: "companyLogo",
  } as const;

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "profile" | "logo"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024)
        return showToast("File must be under 5MB.", "error");
      setCropFile(file);
      setCropType(type);
      e.target.value = "";
    }
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ---------------------------------------------------------------------
  // ✅ EXISTING handleCropComplete (KEEP ALL OTHER CODE SAME)
  // ---------------------------------------------------------------------
  const handleCropComplete = async (croppedFile: File) => {
    if (!cropType) return;
    const fieldName = fieldMap[cropType];
    const oldUrl = card[fieldName] as string | undefined;

    let maxWidth = 1280;
    let quality = 0.95;

    if (cropType === "profile") {
      setIsLoading(true);
      maxWidth = 600;
      quality = 0.95; // ~100KB
    } else if (cropType === "logo") {
      setIsLogoLoading(true);
      maxWidth = 300;
      quality = 0.95; // ~25KB
    } else if (cropType === "cover") {
      setIsCoverLoading(true);
      maxWidth = 1280;
      quality = 0.95; // ~100KB
    }

    let compressedFile: File;

    if (cropType === "profile") {
      compressedFile = await compressImage(croppedFile, 600, 200); // 100KB target
    } else if (cropType === "cover") {
      compressedFile = await compressImage(croppedFile, 1280, 200); // 100KB target
    } else if (cropType === "logo") {
      compressedFile = await compressImage(croppedFile, 300, 80); // ~40KB target
    } else {
      compressedFile = croppedFile;
    }

    let url = "";

    if (user?.uid) {
      url = await uploadImage(
        user.uid,
        cropType,
        compressedFile,
        oldUrl === storedImage?.url ? null : oldUrl,
        card.urlName
      );
      const updatedCard = { ...card, [fieldName]: url };
      if (card.id) await updateDoc(doc(db, "cards", card.id), updatedCard);
      onUpdate(updatedCard);
    } else {
      url = await fileToDataURL(compressedFile);
      const updatedCard = { ...card, [fieldName]: url };
      onUpdate(updatedCard);
      localStorage.setItem(`card_${card.id}`, JSON.stringify(updatedCard));
    }

    setIsLoading(false);
    setIsLogoLoading(false);
    setIsCoverLoading(false);
  };

  const resetInput = (type: "cover" | "profile" | "logo") => {
    const ref = fileInputRefs[type].current;
    if (ref) ref.value = "";
  };

  const [storedImage, setStoredImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [storedOldImage, setStoredOldImage] = useState<{
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);

  const CARD_DOC_ID = "mainCard";

  const fetchImage = async () => {
    try {
      const localCard = localStorage.getItem(`card_${CARD_DOC_ID}`);
      if (localCard) {
        onUpdate(JSON.parse(localCard));
        setStoredImage(JSON.parse(localCard));
      } else {
        const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.backupCard) {
            setStoredImage(data.backupCard);
            if (data.oldUrl) {
              setStoredOldImage(data.oldUrl);
            }
          } else {
            setStoredImage(null);
          }
        } else {
          setStoredImage(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch image:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchImage();
  }, []);

  return (
    <TooltipProvider>
      {cropFile && cropType && (
        <CropModal
          file={cropFile}
          imageType={cropType}
          onClose={() => {
            setCropFile(null);
            setCropType(null);
          }}
          onComplete={handleCropComplete}
        />
      )}

      <div className="mt-6">
        <Label className="text-sm font-medium text-foreground">
          Add Images{" "}
          {!isEditMode && (
            <span className="italic font-normal">
              [Profile Image upload only]
            </span>
          )}
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cover */}
        <div className="space-y-2 relative">
          <Label className="text-sm text-muted-foreground">Upload Cover</Label>
          <div
            className={`w-full h-24 bg-muted border border-border rounded-lg flex items-center justify-center relative ${
              isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/80"
            }`}
          >
            {isCoverLoading ? (
              <div className="animate-pulse">Loading...</div>
            ) : (
              card.coverImage && (
                <img
                  src={card.coverImage}
                  alt="Cover"
                  className="w-full h-full rounded-lg object-cover"
                />
              )
            )}
            <label
              className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer ${
                isDisabled ? "pointer-events-none" : ""
              }`}
            >
              {!card.coverImage && (
                <>
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Add Cover
                  </span>
                </>
              )}
              <input
                ref={fileInputRefs.cover}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isDisabled}
                onChange={(e) => handleFileSelect(e, "cover")}
              />
            </label>

            {!isDisabled && card.coverImage && (
              <div className="absolute top-2 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRefs.cover.current?.click()}
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    removeImage(
                      user?.uid ?? null,
                      card.coverImage,
                      "coverImage",
                      card,
                      onUpdate,
                      () => resetInput("cover"),
                      storedImage?.url
                    )
                  }
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Upload Profile
          </Label>
          <label className="cursor-pointer block">
            <div className="w-full h-24 flex justify-center relative">
              <div className="w-24 h-24 rounded-full bg-muted border border-border flex flex-col items-center justify-center hover:bg-muted/80 transition-colors overflow-hidden relative">
                {isLoading ? (
                  <div className="animate-pulse object-cover">Loading...</div>
                ) : (
                  <img
                    src={
                      card.profilePhoto == storedOldImage?.url
                        ? storedImage?.url
                        : card.profilePhoto &&
                          card.profilePhoto != storedOldImage?.url
                        ? card.profilePhoto
                        : storedImage?.url
                    }
                    className="w-full h-full rounded-full object-cover"
                  />
                )}
                {card.profilePhoto &&
                  card.profilePhoto !==
                    "/lovable-uploads/74b13cbe-0d2e-4997-8470-12fb69697b68.png" && (
                    <div className="absolute top-2 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.profile.current?.click()}
                        className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <Edit size={14} />
                      </button>
                      {card?.profilePhoto !== storedImage?.url && (
                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              user?.uid ?? null,
                              card.profilePhoto,
                              "profilePhoto",
                              card,
                              onUpdate,
                              () => resetInput("profile"),
                              storedImage?.url
                            )
                          }
                          className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}

                {!card.profilePhoto && !isLoading && (
                  <div className="flex flex-col items-center justify-center absolute inset-0">
                    <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Add Photo
                    </span>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRefs.profile}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, "profile")}
            />
          </label>
        </div>

        {/* Logo */}
        <div className="space-y-2 relative">
          <Label className="text-sm text-muted-foreground">Upload Logo</Label>
          <div
            className={`w-full h-24 bg-muted border border-border rounded-lg flex items-center justify-center relative ${
              isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/80"
            }`}
          >
            {isLogoLoading ? (
              <div className="animate-pulse">Loading...</div>
            ) : (
              card.companyLogo && (
                <img
                  src={card.companyLogo}
                  alt="Logo"
                  className="w-full h-full rounded-lg object-cover"
                />
              )
            )}

            <label
              className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer ${
                isDisabled ? "pointer-events-none" : ""
              }`}
            >
              {!card.companyLogo && (
                <>
                  <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-medium">
                    Add Logo
                  </span>
                </>
              )}
              <input
                ref={fileInputRefs.logo}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isDisabled}
                onChange={(e) => handleFileSelect(e, "logo")}
              />
            </label>

            {!isDisabled && card.companyLogo && (
              <div className="absolute top-2 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRefs.logo.current?.click()}
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    removeImage(
                      user?.uid ?? null,
                      card.companyLogo,
                      "companyLogo",
                      card,
                      onUpdate,
                      () => resetInput("logo"),
                      storedImage?.url
                    )
                  }
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Click to add/change images (JPG, PNG, WEBP, max. 5MB)
      </p>
    </TooltipProvider>
  );
}
