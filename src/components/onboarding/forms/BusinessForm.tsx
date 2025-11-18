"use client";
import React from "react";
import Tesseract from "tesseract.js"; // ✅ OCR
import { FormComponentProps } from "@/types/businessCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export function BusinessForm({ card, onUpdate }: FormComponentProps) {
  const [activeTab, setActiveTab] = React.useState<"manual" | "upload">(
    "manual"
  );
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [extractedText, setExtractedText] = React.useState<string>(""); // ✅ OCR result
  const [loading, setLoading] = React.useState(false); // ✅ OCR loading
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    const keys = field.split(".");
    const updatedCard = { ...card };

    let current: any = updatedCard;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    onUpdate(updatedCard);
  };

  const handlePhoneChange = (value: string) => {
    const updatedCard = { ...card };
    updatedCard.business.phone = "+" + value; // ensures +XX format
    onUpdate(updatedCard);
  };

  const handleAccreditationsChange = (value: string) => {
    const accreditations = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item);
    const updatedCard = { ...card };
    updatedCard.profile.accreditations = accreditations;
    onUpdate(updatedCard);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleExtractText = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setExtractedText("");

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);

    reader.onload = async () => {
      if (!reader.result) return;

      try {
        // Create an image
        const img = new Image();
        img.src = reader.result as string;

        img.onload = async () => {
          // Create canvas for preprocessing
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Focus only on the bottom 60% of the image (where text usually appears)
          const cropY = img.height * 0.4;
          const cropHeight = img.height * 0.6;

          canvas.width = img.width;
          canvas.height = cropHeight;

          // Draw cropped area
          ctx!.drawImage(
            img,
            0,
            cropY,
            img.width,
            cropHeight,
            0,
            0,
            img.width,
            cropHeight
          );

          // Convert to grayscale & increase contrast
          const imageData = ctx!.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const contrast = avg > 128 ? 255 : 0; // simple thresholding
            data[i] = data[i + 1] = data[i + 2] = contrast;
          }

          ctx!.putImageData(imageData, 0, 0);

          const processedDataUrl = canvas.toDataURL("image/png");

          // Run Tesseract on processed image
          const { data: ocrData } = await Tesseract.recognize(
            processedDataUrl,
            "eng",
            { logger: (m) => console.log(m) }
          );

          const lines = ocrData.text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);

          setExtractedText(ocrData.text);

          const updatedCard = { ...card };

          // --- Parse text ---
          const firstLineWords = lines[0]?.split(/\s+/) || [];
          updatedCard.profile.firstName = firstLineWords[0] || "";
          updatedCard.profile.lastName = firstLineWords[1] || "";

          updatedCard.profile.department = lines[1] || "";
          updatedCard.profile.company = lines[2] || "";
          updatedCard.profile.companySlogan = lines[3] || "";
          updatedCard.business.phone = lines[4] || "";
          updatedCard.business.email = lines[6] || "";
          updatedCard.business.website = lines[8] || "";

          updatedCard.business.address.street = lines[10] || "";

          const addressLine = lines[11] || "";
          let city = "",
            state = "",
            zip = "";

          if (addressLine.includes(",")) {
            const parts = addressLine.split(",").map((p) => p.trim());
            city = parts[0] || "";
            state = parts[1] || "";
            zip = parts[2] || "";
          } else {
            const parts = addressLine.split(/\s+/).filter(Boolean);
            zip = parts.pop() || "";
            state = parts.pop() || "";
            city = parts.join(" ") || "";
          }

          updatedCard.business.address.city = city;
          updatedCard.business.address.state = state;
          updatedCard.business.address.zip = zip;

          console.log("✅ Parsed Card:", updatedCard);
          onUpdate(updatedCard);
        };
      } catch (err) {
        console.error("❌ OCR Error:", err);
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Manual Entry / Upload Card Tabs */}
        <div className="mb-6">
          <div className="flex gap-8 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`relative pb-2 text-sm font-medium transition-colors ${
                activeTab === "manual"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Manual Entry
              {activeTab === "manual" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`relative pb-2 text-sm font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Card
              {activeTab === "upload" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Manual Entry Form */}
        {activeTab === "manual" && (
          <>
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium">
                  First Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="First Name"
                  value={card.profile.firstName}
                  onChange={(e) =>
                    handleInputChange("profile.firstName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium">
                  Last Name<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  value={card.profile.lastName}
                  onChange={(e) =>
                    handleInputChange("profile.lastName", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Accreditations */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="accreditations" className="text-sm font-medium">
                Accreditations
              </Label>
              <Input
                id="accreditations"
                placeholder="e.g. MBA, PhD, CPA (separate with commas)"
                defaultValue={card.profile.accreditations.join(", ")}
                onChange={(e) => handleAccreditationsChange(e.target.value)}
              />
            </div>

            {/* Company Name */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="company" className="text-sm font-medium">
                Company Name
              </Label>
              <Input
                id="company"
                placeholder="Enter your company name"
                value={card.profile.company}
                onChange={(e) =>
                  handleInputChange("profile.company", e.target.value)
                }
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="title" className="text-sm font-medium">
                Job Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Senior Software Engineer"
                value={card.profile.title}
                onChange={(e) =>
                  handleInputChange("profile.title", e.target.value)
                }
              />
            </div>

            {/* Department */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="department" className="text-sm font-medium">
                Department
              </Label>
              <Input
                id="department"
                placeholder="e.g. Engineering, Sales, Marketing"
                value={card.profile.department}
                onChange={(e) =>
                  handleInputChange("profile.department", e.target.value)
                }
              />
            </div>

            {/* Company Slogan */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="companySlogan" className="text-sm font-medium">
                Company Slogan
              </Label>
              <Input
                id="companySlogan"
                placeholder="Enter your slogan or tagline"
                value={card.profile.companySlogan}
                onChange={(e) =>
                  handleInputChange("profile.companySlogan", e.target.value)
                }
              />
            </div>

            {/* Phone Number */}
            {/* <div className="space-y-2 mb-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number{" "}
                <span className="text-muted-foreground">Optional</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                pattern="[0-9+\-]*"
                maxLength={15}
                placeholder="e.g. +1 234 567 8901"
                value={card.business.phone}
                onChange={(e) =>
                  handleInputChange("business.phone", e.target.value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Format: (XXX) XXX-XXXX or +X (XXX) XXX-XXXX
            </p> */}
            <div className="space-y-2 mb-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number{" "}
                <span className="text-muted-foreground">
                  (with country code)
                </span>
              </Label>

              <PhoneInput
                country={"us"} // default country
                value={card.business.phone}
                onChange={handlePhoneChange}
                inputStyle={{
                  width: "100%",
                  height: "42px",
                  fontSize: "14px",
                  backgroundColor: "#f5f7f9",
                  borderWidth: "1px",
                  borderColor: "#e2e8f0",
                }}
                containerStyle={{
                  width: "100%",
                }}
                countryCodeEditable={false}
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address{" "}
                <span className="text-muted-foreground">Optional</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={card.business.email}
                onChange={(e) =>
                  handleInputChange("business.email", e.target.value)
                }
              />
            </div>

            {/* Website URL */}
            <div className="space-y-2 mb-2">
              <Label htmlFor="website" className="text-sm font-medium">
                Website URL{" "}
                <span className="text-muted-foreground">Optional</span>
              </Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.yourwebsite.com"
                value={card.business.website}
                onChange={(e) =>
                  handleInputChange("business.website", e.target.value)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Example: https://www.example.com or www.example.com
            </p>

            {/* Company Address */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Company Address</Label>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-medium">
                  Street Address
                </Label>
                <Input
                  id="street"
                  placeholder="123 business street"
                  value={card.business.address.street}
                  onChange={(e) =>
                    handleInputChange("business.address.street", e.target.value)
                  }
                />
              </div>

              {/* City and State/Province */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={card.business.address.city}
                    onChange={(e) =>
                      handleInputChange("business.address.city", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State/Province
                  </Label>
                  <Input
                    id="state"
                    placeholder="State/Province"
                    value={card.business.address.state}
                    onChange={(e) =>
                      handleInputChange(
                        "business.address.state",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>

              {/* ZIP/Postal Code and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-medium">
                    ZIP/Postal Code
                  </Label>
                  <Input
                    id="zip"
                    placeholder="ZIP/Postal Code"
                    value={card.business.address.zip}
                    onChange={(e) =>
                      handleInputChange("business.address.zip", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Input
                    id="country"
                    placeholder="Country"
                    value={card.business.address.country}
                    onChange={(e) =>
                      handleInputChange(
                        "business.address.country",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Upload Card Interface */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            {/* File Upload Area */}
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) setSelectedFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Drop your business card image here or click to upload
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, PDF (max 5MB)
                </p>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Click here to select a file
                </button>
              </div>

              {selectedFile && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-foreground">
                    Selected: {selectedFile.name}
                  </p>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* OCR Button + Extracted Text */}
            {selectedFile && (
              <div className="space-y-4">
                <Button onClick={handleExtractText} disabled={loading}>
                  {loading ? "Extracting..." : "Extract Text"}
                </Button>

                {/* {extractedText && (
                  <div className="p-3 border rounded-md bg-muted text-sm whitespace-pre-wrap">
                    <strong>Extracted Text:</strong>
                    <p>{extractedText}</p>
                  </div>
                )} */}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
