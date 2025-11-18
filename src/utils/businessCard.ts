"use client";
import { BusinessCard } from "@/types/businessCard";

export const getFullName = (card: BusinessCard): string => {
  const { firstName, lastName } = card.profile;
  return [firstName, lastName].filter(Boolean).join(" ");
};

export const generateSlug = async (card: BusinessCard): Promise<string> => {
  const baseName = card.urlName || getFullName(card) || "card";
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const hasUserInput = (card: BusinessCard): boolean => {
  return !!(
    card.profile.firstName ||
    card.profile.lastName ||
    card.profile.title ||
    card.profile.company ||
    card.business.email ||
    card.business.phone ||
    card.business.website ||
    card.about.bio ||
    card.about?.customSectionTitle ||
    card.profilePhoto ||
    Object.values(card.social).some((value) => value?.trim())
  );
};

export const generateVCard = (card: BusinessCard): string => {
  const vCardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${getFullName(card)}`,
    `N:${card.profile.lastName};${card.profile.firstName};;;`,
  ];

  if (card.profile.title) {
    vCardLines.push(`TITLE:${card.profile.title}`);
  }

  if (card.profile.company) {
    vCardLines.push(`ORG:${card.profile.company}`);
  }

  if (card.business.phone) {
    vCardLines.push(`TEL:${card.business.phone}`);
  }

  if (card.business.email) {
    vCardLines.push(`EMAIL:${card.business.email}`);
  }

  if (card.business.website) {
    vCardLines.push(`URL:${card.business.website}`);
  }

  const address = card.business.address;
  if (address.street || address.city || address.state || address.zip) {
    const adr = `;;${address.street || ""};${address.city || ""};${
      address.state || ""
    };${address.zip || ""};${address.country || ""}`;
    vCardLines.push(`ADR:${adr}`);
  }

  if (card.about.bio) {
    vCardLines.push(`NOTE:${card.about.bio}`);
  }

  vCardLines.push("END:VCARD");

  return vCardLines.join("\r\n");
};

export const defaultBrandColors = [
  // '#4299e1', // Blue
  // '#48bb78', // Green
  // '#ed8936', // Orange
  // '#9f7aea', // Purple
  // '#38b2ac', // Teal
  // '#ec4899', // Pink
  // '#ecc94b', // Yellow
  // '#f56565', // Red

  "#F95F5F",
  "#FF8A4C",
  "#FFD93D",
  "#B87D4B",
  "#4CD964",
  "#4ECDC4",
  "#4299E1",
  "#5856D6",
  "#AF52DE",
  "#FF2D55",
  "#2C3E50",
  "#8E8E93",
];

export const createInitialCard = (): BusinessCard => ({
  urlName: "",
  profilePhoto: "",
  coverImage: "",
  companyLogo: "",
  cardImage: undefined,
  brandColor: "#4299E1",
  templateType: "traditional",
  cardLayout: "portrait",
  profile: {
    firstName: "",
    lastName: "",
    title: "",
    businessCategory: "",
    department: "",
    company: "",
    accreditations: [],
    companySlogan: "",
  },
  business: {
    phone: "",
    email: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  },
  social: {
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },
  about: {
    bio: "",
    sectionTitle: "About Me",
    skills: [],
    customSectionTitle: "",
    sectionType: "",
  },
  appointments: {
    appointmentType: "booking",
    calendlyUrl: "",
    ctaLabel: "",
    ctaUrl: "",
  },
  cardView: 0,
  cardShare: 0,
  leadsGenerated: 0,
  linkClick: 0,
  adsView: 0,
  saveContact: 0,
  metadata: {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    isPublic: false,
    slug: "",
    favorite: false,
    tags: [],
  },
});
