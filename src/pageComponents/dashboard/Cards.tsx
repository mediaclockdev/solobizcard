"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3X3, List, User } from "lucide-react";
import { BusinessCard } from "@/types/businessCard";
import { CardGrid } from "@/components/dashboard/CardGrid";
import { CardList } from "@/components/dashboard/card-list";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  loadBusinessCards,
  deleteBusinessCard,
  toggleCardFavorite,
  deleteDatabaseBusinessCard,
  checkLocalCardExist,
  saveBusinessCard,
} from "@/utils/cardStorage";
import {
  filterFavorites,
  filterPublicCards,
  memberDirectoryPublicCards,
} from "@/utils/cardFilters";
import { hasUserAccount, loadUserData } from "@/utils/userStorage";
import { CreateCardPromptModal } from "@/components/dashboard/CreateCardPromptModal";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Margin } from "@mui/icons-material";
import { generateQRCodeWithLogo } from "@/utils/qrCodeGenerator";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

export default function Cards() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [myCards, setMyCards] = useState<BusinessCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<BusinessCard[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState(user ? "favorites" : "local");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<BusinessCard | null>(null);
  const { showToast } = useToast();
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [memberDirectoryCount, setMemberDirectoryCount] = useState(0);

  const [showAddonsPermissionModal, setShowAddonsPermissionModal] =
    useState(false);

  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeFirstName, setWelcomeFirstName] = useState("");
  const [isAccessControlChecked, setIsAccessControlChecked] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMyCardCounts, setTotalMyCardCounts] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("selectedTab") ?? activeTab;

  const getDataBaseCards = async () => {
    const directoryCount = await memberDirectoryPublicCards();
    setMemberDirectoryCount(directoryCount.length ?? 0);
    // setMyCards([]);
    const cardsRef = collection(db, "cards");
    const q = query(
      cardsRef,
      where("uid", "==", user?.uid),
      where("isActive", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const userCards: BusinessCard[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<BusinessCard, "id">),
    }));
    setMyCards(userCards);
  };

  const myCardCounts = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user?.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const planType = userData.planType || "free"; // default to free

        if (planType === "free") {
          setTotalMyCardCounts(2);
        } else if (planType === "paid") {
          const addOnPlans = userData.addons || [];
          if (addOnPlans?.length === 0) {
            setTotalMyCardCounts(2);
          } else if (
            addOnPlans.length === 1 &&
            addOnPlans[0].name === "Add 1 Pro Card"
          ) {
            setTotalMyCardCounts(3);
          } else if (
            addOnPlans.length === 1 &&
            addOnPlans[0].name === "Add 5 Pro Cards"
          ) {
            setTotalMyCardCounts(7);
          } else if (addOnPlans.length === 2) {
            setTotalMyCardCounts(8);
          }
        }
      } catch (error) {
        console.error("Error fetch card count:", error);
      }
      return;
    }
  };
  // Load cards on component mount
  useEffect(() => {
    if (user) {
      setIsLoading(false);
      getDataBaseCards();
    }
    getDataBaseCards();

    setIsLoading(false);
    const loadedCards = loadBusinessCards();
    setCards(loadedCards);
  }, [authLoading, activeTab]);
  useEffect(() => {
    if (user && totalMyCardCounts == 0) {
      myCardCounts();
    }
  }, [user, totalMyCardCounts]);

  // Access control logic
  useEffect(() => {
    const checkAccess = () => {
      const loadedCards = loadBusinessCards();
      const userHasAccount = hasUserAccount();

      console.log("Access control check:", {
        cardsCount: loadedCards.length,
        hasAccount: userHasAccount,
      });

      // Scenario A: No business cards + No user data
      if (loadedCards.length === 0 && !userHasAccount) {
        setShowCreateCardModal(false);
        //setIsAccessControlChecked(false);
        return;
      }

      // Scenario B: Business cards exist + No user data
      if (loadedCards.length > 0 && !userHasAccount) {
        // Get the first name from the first card for the welcome modal
        const firstName = loadedCards[0]?.profile?.firstName || "User";
        setWelcomeFirstName(firstName);
        //setShowWelcomeModal(true);
        //   setIsAccessControlChecked(true);
        return;
      }

      // Scenario C: Both exist - allow normal access
      // setIsAccessControlChecked(true);
    };

    checkAccess();
    if (user) {
      setActiveTab(selectedTab ?? "favorites");
    } else {
      setActiveTab(selectedTab ?? "local");
    }
  }, []);

  // Filter cards when dependencies change
  useEffect(() => {
    setIsLoading(false);
    let filtered = cards;

    // Apply tab filter
    if (activeTab === "favorites") {
      filtered = myCards;
    }

    setFilteredCards(filtered);
  }, [cards, myCards, activeTab]);

  const generatePreviewQRCode = useCallback(async (card, action) => {
    try {
      if (typeof window !== "undefined") {
        const cardUrl = `${window.location.origin}/card/${card.metadata.id}?selectedTab=favorites&view=true`;
        const logoPreviewUrl =
          "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png";
        const response = await fetch(
          "/lovable-uploads/6e79eba6-9505-44d3-9af1-e8b13b7c46d0.png"
        );
        const blob = await response.blob();
        const defaultLogo = new File([blob], "logo.png", { type: blob.type });

        const qrDataUrl = await generateQRCodeWithLogo(cardUrl, defaultLogo, {
          width: 200,
          margin: 2,
          color: { dark: card.brandColor, light: "#FFFFFF" },
        });
        const res = await fetch(qrDataUrl);
        const qrBlob = await res.blob();

        if (activeTab === "local") {
          const cards = loadBusinessCards();
          const newcard = cards.find((c) => c.metadata.id === card.metadata.id);
          if (newcard) {
            const updatedCard = {
              ...newcard,
              qrCode: {
                colorSource: "brand",
                selectedColor: card.brandColor,
                qrCodeUrl: qrDataUrl,
                qrLogoUrl: logoPreviewUrl || "",
              },
            };
            saveBusinessCard(updatedCard);
            setTimeout(() => {
              navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
            }, 200);
          }
        } else {
          const storage = getStorage();
          const qrRef = ref(
            storage,
            `cards/${user?.uid}/${card.id}/QRCode/qr_${card.metadata.id}.png`
          );

          await uploadBytes(qrRef, qrBlob);
          const qrDownloadUrl = await getDownloadURL(qrRef);
          const updatedCard = {
            ...card,
            qrCode: {
              colorSource: "brand",
              selectedColor: card.brandColor,
              qrCodeUrl: qrDownloadUrl,
              qrLogoUrl: logoPreviewUrl || "",
            },
          };
          console.log("caar", updatedCard);
          const q = query(
            collection(db, "cards"),
            where("metadata.id", "==", card.metadata.id)
          );

          let unsubscribe: (() => void) | undefined;

          getDocs(q).then(async (snapshot) => {
            if (!snapshot.empty) {
              const ref = snapshot.docs[0].ref;
              await updateDoc(ref, updatedCard);
              if (action === "details") {
                navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
              } else if (action === "preview") {
                navigate(`/card/${card.metadata.id}?selectedTab=${activeTab}`);
              } else {
                navigate(`/dashboard/cards/${card.metadata.id}`);
              }
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to generate QR preview:", error);
      showToast("Failed to generate QR preview", "error");
    } finally {
    }
  }, []);
  const handleCardAction = (
    action:
      | "edit"
      | "delete"
      | "share"
      | "view"
      | "analytics"
      | "preview"
      | "sync"
      | "details",
    card: BusinessCard
  ) => {
    switch (action) {
      case "edit":
        // Store the card data for editing and navigate to onboarding
        localStorage.setItem("edit_card_data", JSON.stringify(card));
        navigate("/onboarding");
        break;
      case "delete":
        setCardToDelete(card);
        setShowDeleteDialog(true);
        break;
      case "view":
        if (card.qrCode && card.qrCode?.qrCodeUrl) {
          if (activeTab === "local")
            navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
          else {
            navigate(`/dashboard/cards/${card.metadata.id}`);
          }
        } else {
          generatePreviewQRCode(card, action);
          console.log("View");
        }
        // Navigate to card details view

        break;
      case "details":
        if (card?.qrCode && card.qrCode?.qrCodeUrl) {
          navigate(`/dashboard/cards/${card.metadata.id}?option=edit`);
        } else {
          generatePreviewQRCode(card, action);
          console.log("details==", card);
        }
        // Navigate to card details view
        break;
      case "preview":
        if (card.qrCode && card.qrCode?.qrCodeUrl) {
          // Navigate to local card preview
          navigate(`/card/${card.metadata.id}?selectedTab=${activeTab}`);
        } else {
          generatePreviewQRCode(card, action);
          console.log("preview");
        }
        break;
      case "share":
        // Implement share functionality
        console.log("Share card:", card);
        break;
      case "analytics":
        // Handle analytics (pro feature)
        console.log("Analytics for card:", card);
        break;
      case "sync":
        getDataBaseCards();
        setCards(loadBusinessCards());
        // Handle analytics (pro feature)
        console.log("Analytics for card:", card);
        break;
    }
  };

  const handleToggleFavorite = (cardId: string) => {
    toggleCardFavorite(cardId);
    setCards(loadBusinessCards());
  };

  const handleCreateCard = () => {
    localStorage.removeItem("edit_card_data");
    navigate(`/?selectedTab=${activeTab}`);
  };

  function parseCreatedAt(input) {
    if (input instanceof Date) return input;
    if (input && input.seconds) return new Date(input.seconds * 1000);
    if (typeof input === "number") return new Date(input);
    if (typeof input === "string") return new Date(input.replace(" at", ""));
    return new Date();
  }

  const handleFavoriteCreateCard = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user?.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const planType = userData?.planType || "free"; // default to free
        const createdAt = parseCreatedAt(user?.createdAt);
        const trialEnd = new Date(
          createdAt.getTime() + user?.freeTrialPeriod * 24 * 60 * 60 * 1000
        );
        const isTrialActive = new Date() <= trialEnd;

        if (planType === "free" && !isTrialActive) {
          const q = query(
            collection(db, "cards"),
            where("uid", "==", user?.uid)
          );
          const snapshot = await getDocs(q);

          console.log("Snapshot123", snapshot);
          if (snapshot.size >= 2) {
            // showToast(
            //   "Free plan allows only 2 cards. Upgrade to create unlimited cards.",
            //   "error"
            // );
            setShowPermissionModal(true);
            return;
          } else {
            handleCreateCard();
          }
        } else if (planType === "paid") {
          const q = query(
            collection(db, "cards"),
            where("uid", "==", user?.uid)
          );
          const snapshot = await getDocs(q);
          if (snapshot.size >= 2) {
            const addOnPlans = userData.addons || [];
            if (addOnPlans?.length === 0) {
              setShowAddonsPermissionModal(true);
            } else if (
              addOnPlans.length === 1 &&
              addOnPlans[0].name === "Add 1 Pro Card"
            ) {
              const q = query(
                collection(db, "cards"),
                where("uid", "==", user?.uid)
              );
              const snapshot = await getDocs(q);
              if (snapshot.size >= 3) {
                setShowAddonsPermissionModal(true);
              } else {
                handleCreateCard();
              }
            } else if (
              addOnPlans.length === 1 &&
              addOnPlans[0].name === "Add 5 Pro Cards"
            ) {
              const q = query(
                collection(db, "cards"),
                where("uid", "==", user?.uid)
              );
              const snapshot = await getDocs(q);
              if (snapshot.size >= 7) {
                showToast(
                  "You have reached the card creation limit. Please upgrade your addons.",
                  "error"
                );
                return;
              } else {
                handleCreateCard();
              }
            } else if (addOnPlans.length === 2) {
              const q = query(
                collection(db, "cards"),
                where("uid", "==", user?.uid)
              );
              const snapshot = await getDocs(q);
              console.log("Snapshot", snapshot);
              if (snapshot.size >= 8) {
                showToast(
                  "You have reached the card creation limit. Please upgrade your addons.",
                  "error"
                );
                return;
              }
            }
          } else {
            handleCreateCard();
          }
        } else {
          handleCreateCard();
        }
      } catch (error) {
        console.error("Error saving card:", error);
        showToast("Failed to save card", "error");
      }
      return;
    }
    handleCreateCard();
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      if (user && activeTab === "favorites") {
        setIsLoading(true);
        setShowDeleteDialog(false);
        deleteDatabaseBusinessCard(cardToDelete.metadata.id).then((res) => {
          getDataBaseCards();
          setCardToDelete(null);
          setIsLoading(false);
        });
      } else {
        setIsLoading(true);
        deleteBusinessCard(cardToDelete.metadata.id);
        setCards(loadBusinessCards());
        setIsLoading(false);
      }
      setIsLoading(false);
    }
    setIsLoading(false);
    setShowDeleteDialog(false);
    setCardToDelete(null);
  };

  // Don't render main content until access control is checked
  if (!isAccessControlChecked) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>

        {/* Access Control Modals */}
        <CreateCardPromptModal
          isOpen={showCreateCardModal}
          onClose={() => setShowCreateCardModal(false)}
        />

        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          firstName={welcomeFirstName}
        />
      </>
    );
  }

  // Show EmptyState only if access control passed and no cards exist
  // if (cards.length === 0 && !showCreateCardModal && !showWelcomeModal) {
  //   return <EmptyState onCreateCard={handleCreateCard} />;
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="local">
                Local Cards ({cards.length})
              </TabsTrigger>
              <TabsTrigger value="favorites">
                My Cards ({myCards?.length ?? 0}/{totalMyCardCounts})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            onClick={() => navigate("/members")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            Members Directory ({memberDirectoryCount})
          </Button>
        </div>

        <div className="flex border border-border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="local" className="mt-6">
          {viewMode === "grid" ? (
            <CardGrid
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          ) : (
            <CardList
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {viewMode === "grid" ? (
            <CardGrid
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleFavoriteCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          ) : (
            <CardList
              cards={filteredCards}
              onAction={handleCardAction}
              onToggleFavorite={handleToggleFavorite}
              onCreateCard={handleFavoriteCreateCard}
              defaultAction="view"
              activeTab={activeTab}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {cardToDelete
                ? `${cardToDelete.profile.firstName} ${cardToDelete.profile.lastName}`
                : "this card"}
              "? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Access Control Modals */}
      <CreateCardPromptModal
        isOpen={showCreateCardModal}
        onClose={() => setShowCreateCardModal(false)}
      />

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        firstName={welcomeFirstName}
      />

      {showPermissionModal && (
        <div
          style={{ margin: 0 }}
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0"
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-96 text-center">
            <h1 className="text-xl font-bold mb-4">Pro Feature</h1>
            <p className="text-gray-600 mb-6">
              <p className="text-gray-600 mb-6">
                This feature is available only for{" "}
                <span className="font-semibold text-primary">Pro users</span>.
                Please purchase pro plan to continue.
              </p>
            </p>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setTimeout(() => router.replace("/pricing"), 100);
                }}
              >
                Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddonsPermissionModal && (
        <div
          style={{ margin: 0 }}
          className={cn(
            "fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center",
            "left-0"
          )}
        >
          {/* Dark overlay (only covers content area) */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Modal Box */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 z-50 w-96 text-center">
            <h1 className="text-xl font-bold mb-4">Add More Pro Cards</h1>
            <p className="text-gray-600 mb-6">
              <p className="text-gray-600 mb-6">
                You can add 1 or 5 additional cards. To proceed to the pricing
                page, click continue
              </p>
            </p>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setShowAddonsPermissionModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowAddonsPermissionModal(false);
                  setTimeout(() => router.replace("/pricing"), 100);
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
