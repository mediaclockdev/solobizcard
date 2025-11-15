"use client";
import { db } from "@/services/firebase";
import { BusinessCard } from "@/types/businessCard";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const STORAGE_KEY = "business_cards";
const OLD_STORAGE_KEY = "savedCards";

// Migration function to move cards from old storage to new storage
const migrateOldCards = (): void => {
  try {
    if (typeof window === "undefined") return;

    const oldCards = localStorage.getItem(OLD_STORAGE_KEY);
    const newCards = localStorage.getItem(STORAGE_KEY);

    if (oldCards && !newCards) {
      console.log("Migrating cards from old storage key to new storage key");
      localStorage.setItem(STORAGE_KEY, oldCards);
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Error during card migration:", error);
  }
};

export const loadBusinessCards = (): BusinessCard[] => {
  try {
    if (typeof window === "undefined") return [];

    // Run migration on first load
    migrateOldCards();

    // Try new storage key first
    let saved = localStorage.getItem(STORAGE_KEY);

    // If no cards in new storage, check old storage as fallback
    if (!saved) {
      saved = localStorage.getItem(OLD_STORAGE_KEY);
    }

    const cards = saved ? JSON.parse(saved) : [];

    return cards;
  } catch (error) {
    console.error("Error loading business cards:", error);
    return [];
  }
};

export const loadDBBusinessCards = async (): Promise<BusinessCard[]> => {
  try {
    if (typeof window === "undefined") return [];

    const cardsRef = collection(db, "cards");
    const snapshot = await getDocs(cardsRef);
    const cards: BusinessCard[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BusinessCard[];
    return cards;
  } catch (error) {
    console.error("Error loading business cards:", error);
    return [];
  }
};

export const saveBusinessCard = (card: BusinessCard): void => {
  try {
    const cards = loadBusinessCards();
    const existingIndex = cards.findIndex(
      (c) => c.metadata.id === card.metadata.id
    );

    if (existingIndex >= 0) {
      cards[existingIndex] = card;
    } else {
      cards.push(card);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error("Error saving business card:", error);
  }
};

export const deleteBusinessCard = (cardId: string): void => {
  try {
    const cards = loadBusinessCards();
    const filtered = cards.filter((c) => c.metadata.id !== cardId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting business card:", error);
  }
};

export const checkLocalCardExist = (cardId: string): boolean => {
  try {
    const cards = loadBusinessCards();
    const filtered = cards.filter((c) => c.metadata.id !== cardId);
    if (filtered?.length) return true;
    return false;
  } catch (error) {
    console.error("Error deleting business card:", error);
  }
};

// export const deleteDatabaseBusinessCard = async (
//   cardId: string
// ): Promise<void> => {
//   try {
//     const cardsRef = collection(db, "cards");
//     const q = query(cardsRef, where("metadata.id", "==", cardId));
//     const querySnapshot = await getDocs(q);

//     const updatePromises = querySnapshot.docs.map((document) =>
//       updateDoc(doc(db, "cards", document.id), { isActive: false })
//     );

//     await Promise.all(updatePromises);

//     console.log(
//       `Deactivated ${updatePromises.length} card(s) with metadata.id=${cardId}`
//     );
//   } catch (error) {
//     console.error("Error deactivating business card:", error);
//   }
// };

export const deleteDatabaseBusinessCard = async (
  cardId: string
): Promise<void> => {
  try {
    const cardsRef = collection(db, "cards");
    const q = query(cardsRef, where("metadata.id", "==", cardId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((document) =>
      deleteDoc(doc(db, "cards", document.id))
    );
    await Promise.all(deletePromises);
    console.log(
      `Deleted ${deletePromises.length} card(s) with metadata.id=${cardId}`
    );
  } catch (error) {
    console.error("Error deleting business card:", error);
  }
};

export const toggleCardFavorite = (cardId: string): void => {
  try {
    const cards = loadBusinessCards();
    const card = cards.find((c) => c.metadata.id === cardId);
    if (card) {
      card.metadata.favorite = !card.metadata.favorite;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

export const isUrlNameAvailable = async (
  urlName: string,
  excludeCardId?: string,
  dBCards?: boolean
): Promise<boolean> => {
  try {
    let cards = loadBusinessCards();

    if (dBCards) {
      cards = await loadDBBusinessCards();
    }

    return !cards.some(
      (card) => card.urlName === urlName && card.metadata.id !== excludeCardId
    );
  } catch (error) {
    console.error("Error checking URL name availability:", error);
    return true;
  }
};

export const generateUniqueUrlName = async (
  baseName: string,
  excludeCardId?: string,
  dBCards?: boolean
): Promise<string> => {
  try {
    let counter = 1;
    let uniqueName = baseName;

    while (!(await isUrlNameAvailable(uniqueName, excludeCardId, dBCards))) {
      counter++;
      uniqueName = `${baseName}-${counter}`;
    }

    return uniqueName;
  } catch (error) {
    console.error("Error generating unique URL name:", error);
    return baseName;
  }
};
