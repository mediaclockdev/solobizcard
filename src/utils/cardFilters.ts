"use client";
import { BusinessCard } from "@/types/businessCard";
import { getFullName } from "./businessCard";
import { loadBusinessCards, loadDBBusinessCards } from "./cardStorage";

export type SortOption = "newest" | "oldest" | "name" | "company";

export const searchCards = (
  cards: BusinessCard[],
  query: string
): BusinessCard[] => {
  if (!query.trim()) return cards;

  const searchTerm = query.toLowerCase();
  return cards.filter(
    (card) =>
      getFullName(card).toLowerCase().includes(searchTerm) ||
      card.profile.title.toLowerCase().includes(searchTerm) ||
      card.profile.company.toLowerCase().includes(searchTerm) ||
      card.business.email.toLowerCase().includes(searchTerm) ||
      card.metadata.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
  );
};

export const sortCards = (
  cards: BusinessCard[],
  sortBy: SortOption
): BusinessCard[] => {
  const sorted = [...cards];

  switch (sortBy) {
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.metadata.createdAt).getTime() -
          new Date(a.metadata.createdAt).getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.metadata.createdAt).getTime() -
          new Date(b.metadata.createdAt).getTime()
      );
    case "name":
      return sorted.sort((a, b) =>
        getFullName(a).localeCompare(getFullName(b))
      );
    case "company":
      return sorted.sort((a, b) =>
        a.profile.company.localeCompare(b.profile.company)
      );
    default:
      return sorted;
  }
};

export const filterFavorites = (cards: BusinessCard[]): BusinessCard[] => {
  return cards.filter((card) => card.metadata.favorite);
};

export const filterPublicCards = (cards: BusinessCard[]): BusinessCard[] => {
  return cards.filter((card) => card.metadata.isPublic);
};

export const memberDirectoryPublicCards = async (): Promise<BusinessCard[]> => {
  const localCards = await loadDBBusinessCards();
  const publicLocalCards = filterPublicCards(localCards) ?? [];

  // Merge and remove duplicates (based on metadata.id)
  const allCardsMap = new Map<string, BusinessCard>();
  publicLocalCards.forEach((card) => {
    allCardsMap.set(card.metadata?.id || card.id, card);
  });

  const allCards = Array.from(allCardsMap.values());
  return allCards;
};
