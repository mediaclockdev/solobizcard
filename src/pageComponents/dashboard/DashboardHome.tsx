"use client";
import { Stats } from "@/components/dashboard/Stats";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { PopularProducts } from "@/components/dashboard/PopularProducts";
import { MemberStatus } from "@/components/dashboard/MemberStatus";
import { ReferralsLevels } from "@/components/dashboard/ReferralsLevels";
import { YourAccessories } from "@/components/dashboard/YourAccessories";
import { YourEarnings } from "@/components/dashboard/YourEarnings";
import { LeadsGenerated } from "@/components/dashboard/LeadsGenerated";
import UpgradeModal from "@/components/UpgradeModal";
import { useState, useEffect } from "react";

import { ActivityHeatmap } from "@/components/dashboard/systems/ActivityHeatmap";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

export default function DashboardHome() {
  const [showWarning, setShowWarning] = useState(false);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const onLockClick = () => {
    setShowWarning(true);
  };

  // Fetch cards from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const fetchCards = async () => {
      try {
        const cardsRef = collection(db, "cards");
        const q = query(cardsRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const userCards = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCards(userCards);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [user]);
  return (
    <div className="space-y-4">
      <Stats />
      <ActivityHeatmap cardCount={cards?.length} user={user} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <RevenueChart onLockClick={onLockClick} />
        </div>
        <div className="sm:col-span-1 lg:col-span-1">
          <MemberStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
        <div className="sm:col-span-1 lg:col-span-2">
          <ReferralsLevels />
        </div>
        <div className="sm:col-span-1 lg:col-span-1 space-y-4">
          <YourAccessories />
          <YourEarnings />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <LeadsGenerated onLockClick={onLockClick} />
        </div>
      </div>
      <UpgradeModal
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
      />
    </div>
  );
}
