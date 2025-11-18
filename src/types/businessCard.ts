"use client";
export interface BusinessCard {
  id?: string;
  uid?: string;
  qrCode?: any;
  localQRCode?: any;
  sync?: boolean;
  isActive?: boolean;
  urlName: string;
  badgeLevel?: string | number;
  profilePhoto: string;
  coverImage: string;
  companyLogo: string;
  cardImage?: string;
  brandColor: string;
  cardLayout?:
    | "standard"
    | "extended"
    | "centered"
    | "portrait"
    | "align-right"
    | "align-left"
    | "slides";
  templateType?: "classic" | "modern" | "traditional";
  profile: {
    firstName: string;
    lastName: string;
    title: string;
    businessCategory?: string;
    department: string;
    company: string;
    accreditations: string[];
    companySlogan: string;
  };
  business: {
    phone: string;
    email: string;
    website: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  social: {
    linkedin: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube?: string;
    tiktok?: string;
  };
  about: {
    bio: string;
    sectionTitle: string;
    skills: string[];
    customSectionTitle?: string;
    sectionType?: string;
  };
  appointments: {
    appointmentType:
      | "booking"
      | "call-to-action"
      | "direct-ads"
      | "lead-capture";
    calendlyUrl?: string;
    googleUrl?: string;
    ctaLabel: string;
    ctaUrl: string;
    platform?: "calendly" | "google";
    directAds?: {
      type: "Product" | "Event" | "Service" | "none";
      image: string;
      title?: string;
      description?: string;
      price?: string;
      url?: string;
    };
  };
  cardView: 0;
  cardShare: 0;
  leadsGenerated: 0;
  linkClick: 0;
  adsView: 0;
  saveContact: 0;
  metadata: {
    id: string;
    createdAt: string;
    isPublic: boolean;
    slug: string;
    favorite: boolean;
    tags: string[];
    lastInteraction?: string;
  };
}

export type FormSection = "profile" | "business" | "social" | "about" | "cta";

export interface BusinessCardFormProps {
  card: BusinessCard;
  onUpdate: (card: BusinessCard) => void;
  isEditMode: boolean;
  currentSection: FormSection;
  onSectionChange: (section: FormSection) => void;
  getFullName: (card: BusinessCard) => string;
  hasUnsavedChanges: boolean;
  selectedTab?: string;
}

export interface FormComponentProps {
  card: BusinessCard;
  onUpdate: (card: BusinessCard) => void;
  isEditMode?: boolean;
  selectedTab?: string;
}
