"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbox } from "@/components/ui/lightbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Eye,
  Info,
  Copy,
  Users,
  TrendingUp,
  Target,
  Star,
  ChevronRight,
  ChevronLeft,
  Gift,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
//import { WorldMap } from "@/components/ui/WorldMap";
import dynamic from "next/dynamic";
import { useToast } from "@/contexts/ToastContext";
const WorldMap = dynamic(() => import("@/components/ui/WorldMap"), {
  ssr: false,
});
import { useNavigate } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  average,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { BusinessCard } from "@/types/businessCard";

export default function Referrals() {
  const [showLightbox, setShowLightbox] = useState(false);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { user } = useAuth();
  const createdAt = user?.metadata?.creationTime ?? new Date();
  let referralLink = "";
  if (typeof window !== "undefined" && user?.referralCode) {
    referralLink = `${window.location.origin}?ref=${user.referralCode}`;
  }
  const date = new Date(createdAt);
  const day = date.getDate();
  const [parentCount, setParentCount] = useState(0);
  const [childCount, setChildCount] = useState(0);

  const getDaySuffix = (d: number) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
  };

  const formattedDate = date.toLocaleDateString("en-GB", options);
  const formatted = `${day}${getDaySuffix(day)} ${formattedDate}`;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referalMap, setReferalMap] = useState([]);
  const [showRemaining, setShowRemaining] = useState(false);

  const sortedReferrals = useMemo(() => {
    return [...(referalMap || [])].reverse(); // latest first
  }, [referalMap]);

  // const firstRow = sortedReferrals.slice(0, 10);
  // const remaining = sortedReferrals.slice(10);

  const [level, setLevel] = useState(0);
  const [memberLevel, setMemberLevel] = useState("");
  const [nextLevelNeed, setNextLevelNeed] = useState(0);

  const [requiredChildren, setRequiredChildren] = useState(0);
  const [requiredGrandChildren, setRequiredGrandChildren] = useState(0);

  const [currentChildren, setCurrentChildren] = useState(0);
  const [currentGrandChildren, setCurrentGrandChildren] = useState(0);

  const [averageForChild, setAverageForChild] = useState(0);
  const [averageForLevelUp, setAverageForLevelUp] = useState(0);

  const [remainingChildren, setRemainingChildren] = useState(0);
  const [remainingGrandChildren, setRemainingGrandChildren] = useState(0);

  const [childEarnings, setchildEarnings] = useState(0);
  const [grandchildEarnings, setRgrandchildEarnings] = useState(0);
  const [parentInfo, setParentInfo] = useState(null);
  const [defaultCard, setDefaultCard] = useState<string>(null);

  const [cardDetails, setCardDetails] = useState<BusinessCard>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [MNR, setMNR] = useState(0);
  const [refBadgesLevel, setRefBadgesLevel] = useState(0);
  const [l4Multiplier, setL4Multiplie] = useState(0);
  const [l5Multiplier, setL5Multiplier] = useState(0);
  const [l6Multiplier, setL6Multiplier] = useState(0);
  const [hasFetchedSettings, setHasFetchedSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  async function countParents(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const grandchildren = userData.grandchildren || [];
      const parent = userData.parentUid || null;
      setRefBadgesLevel(userData.badgeLevel);
      console.log("refBadgesLevel", refBadgesLevel);
      if (parent) {
        const parentRef = doc(db, "users", parent);
        const parentSnap = await getDoc(parentRef);
        if (parentSnap.exists()) {
          const parentData = parentSnap.data();
          setParentInfo(parentData);
          const q = query(
            collection(db, "cards"),
            where("uid", "==", parent),
            limit(1)
          );

          const querySnapshot = await getDocs(q);
          const latestCard = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          //    console.log("latestCard", latestCard);
          if (latestCard) {
            //@ts-ignore
            setCardDetails(latestCard);
            console.log("Created latestCard", latestCard);
            //@ts-ignore
            setDefaultCard(latestCard?.metadata?.id);
          }
        }
      } else {
        const q = query(
          collection(db, "users"),
          where("email", "==", "rob@solobizcards.com")
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          // const userData = querySnapshot.docs[0].data() as any;
          setParentInfo(userData);
          setDefaultCard("3b97e644-08a5-40af-bb51-57f7b0f226db");
          // console.log("userData", userData);
          const q = query(
            collection(db, "cards"),
            where("uid", "==", userData?.id),
            limit(1)
          );

          const userQuerySnapshot = await getDocs(q);
          const latestCard = userQuerySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))[0];
          if (latestCard) {
            console.log("Default latestCard", latestCard);
            //@ts-ignore
            setCardDetails(latestCard);
          }
        }
      }
      return grandchildren.length;
    }
    return 0;
  }

  const getLocationFromIP = async (ip: string) => {
    const accessToken = "9f9a0a0c6d2d36";
    try {
      const res = await fetch(
        `https://ipinfo.io/${ip}/json?token=${accessToken}`
      );
      const data = await res.json();
      return {
        ip: data.ip,
        latitude: Number(data.loc.split(",")[0]),
        longitude: Number(data.loc.split(",")[1]),
        state: data.region,
        country: data.country,
        ...data,
      };
    } catch (err) {
      console.error("Error fetching IP location:", err);
      return null;
    }
  };

  const buildReferralArray = async () => {
    const userRef = doc(db, "referrals", user.uid);
    const userSnap = await getDoc(userRef);
    const referralArray: any[] = [];

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const childrenIP = userData?.childrenIP;
      const grandchildrenIP = userData?.grandchildrenIP;
      const children = userData.children || [];
      const grandchildren = userData.grandchildren || [];

      if (childrenIP) {
        let ch = 0;
        for (const ip of childrenIP) {
          const loc = await getLocationFromIP(ip);
          if (loc) {
            const usersGpQuery = doc(db, "users", children[ch]);
            const UserGpSnap = await getDoc(usersGpQuery);

            if (UserGpSnap.exists()) {
              const userData1 = UserGpSnap.data();
              referralArray.push({
                type: "child",
                userId: children[ch],
                name: userData1?.displayName ?? "",
                location: { ...loc },
                avatar:
                  userData1?.avatarUrl ??
                  "/lovable-uploads/logo_color_correct.png",
              });
            }
          }
          ch++;
        }
      }

      // if (grandchildrenIP) {
      //   let ph = 0;
      //   for (const ip of grandchildrenIP) {
      //     const loc = await getLocationFromIP(ip);
      //     if (loc) {
      //       const usersGpQuery = doc(db, "users", grandchildren[ph]);
      //       const UserGpSnap = await getDoc(usersGpQuery);

      //       if (UserGpSnap.exists()) {
      //         const userData1 = UserGpSnap.data();
      //         referralArray.push({
      //           type: "grandchild",
      //           userId: grandchildren[ph],
      //           name: userData1?.displayName ?? "",
      //           location: { ...loc },
      //           avatar:
      //             userData1?.avatarUrl ??
      //             "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop&crop=face",
      //         });
      //       }
      //     }
      //     ph++;
      //   }
      // }
    }
    return referralArray;
  };

  async function countChildren(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const children = userData.children || [];
      return children.length;
    }
    return 0;
  }

  const fetchSettings = async () => {
    try {
      setLoading(true); // start loader
      const userId = user?.uid;
      if (!userId) return;

      // --- Settings: MNR ---
      const settingsRef = doc(db, "users", userId);
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) return;
      const settings = settingsSnap.data();

      // --- Earnings ---
      const earningRef = doc(db, "users", userId);
      const earningSnap = await getDoc(earningRef);
      if (!earningSnap.exists()) return;
      const earningData = earningSnap.data();

      setchildEarnings(earningData.userChildEarning);
      setRgrandchildEarnings(earningData.userGrandChildEarning);

      const MNR = settings.l2Child;
      console.log("MNR from USER settings:", MNR);
      setMNR?.(MNR);

      const l4Multiplier = settings.l4Multiplier;
      const l5Multiplier = settings.l5Multiplier;
      const l6Multiplier = settings.l6Multiplier;

      setL4Multiplie(l4Multiplier);
      setL5Multiplier(l5Multiplier);
      setL6Multiplier(l6Multiplier);

      // --- User data ---
      const userRef = doc(db, "referrals", userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      const children = userData.children || [];
      const RCA = children.length;
      //  console.log("Direct children (RCA):", RCA);

      let childrenReachedLevel2 = 0;
      let totalGrandChildrenFromLevel2 = 0;
      let totalGrandChildrenAll = 0;
      let level3Count = 0;

      const nonLevel2Deficits: number[] = [];

      // --- Check children ---
      for (const childId of children) {
        const childRef = doc(db, "referrals", childId);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          //console.log(`Child ID ${childId} not found`);
          continue;
        }

        const childData = childSnap.data();
        const childChildren = childData.children || [];
        const childRCA = childChildren.length;
        const childLevel = Number(childData.children.length) || 0;
        const grandChildLevel = Number(childData.grandchildren.length) || 0;

        totalGrandChildrenAll += childRCA;

        if (childRCA >= MNR || childLevel >= 2) {
          childrenReachedLevel2++;
          totalGrandChildrenFromLevel2 += childRCA;
        } else {
          const deficit = Math.max(0, MNR - childRCA);
          nonLevel2Deficits.push(deficit);
        }

        if (childLevel >= MNR) level3Count++;
        //  console.log("childData==>", childData.Level);
      }

      // --- Correct remaining grandchildren calculation ---
      let remainingGrandChildrenCorrect = 0;
      for (const childId of children) {
        const childRef = doc(db, "referrals", childId);
        const childSnap = await getDoc(childRef);
        if (!childSnap.exists()) {
          remainingGrandChildrenCorrect += MNR; // treat missing as 0 children
          continue;
        }

        const childData = childSnap.data();
        const childChildrenCount = (childData.children || []).length;

        // Deficit per child = required - actual (min 0)
        const deficit = Math.max(0, MNR - childChildrenCount);
        remainingGrandChildrenCorrect += deficit;
      }

      // console.log("Total actual grandchildren:", totalGrandChildrenAll);
      // console.log(
      //   "Remaining grandchildren required:",
      //   remainingGrandChildrenCorrect
      // );

      const missingLevel2Children = Math.max(0, MNR - childrenReachedLevel2);
      nonLevel2Deficits.sort((a, b) => a - b);

      let remainingPoints = missingLevel2Children;

      let userLevelStr = 1;
      let memberLevel = "Starter";
      let requiredChildrenToNext = 0;
      let requiredGrandChildrenToNext = 0;
      let nextLevelName = "";

      // Get current date
      const today = new Date().toISOString();
      if (!userData.LevelsUpdate) {
        userData.LevelsUpdate = {};
      }

      // Level 1 → Starter
      if (RCA < MNR) {
        userLevelStr = 1;
        memberLevel = "Starter";
        requiredChildrenToNext = MNR - RCA;
        requiredGrandChildrenToNext = 0;
        nextLevelName = "Level-Up";
        remainingPoints = 0;
        await updateDoc(userRef, { Level: 1 });

        // Only set date if not already exists
        if (!userData.LevelsUpdate[1]) {
          await updateDoc(userRef, { [`LevelsUpdate.1`]: today });
        }
      }
      // Level 2 → Level-Up
      // else if (childrenReachedLevel2 < MNR) {
      else if (RCA >= MNR && level3Count < settings.l3LeveledUps) {
        userLevelStr = 2;
        memberLevel = "Level-Up";
        requiredChildrenToNext = Math.max(0, MNR - RCA);
        requiredGrandChildrenToNext = remainingGrandChildrenCorrect;
        nextLevelName = "Bronze";
        await updateDoc(userRef, { Level: 2 });
        if (!userData.LevelsUpdate[2]) {
          await updateDoc(userRef, { [`LevelsUpdate.2`]: today });
        }
      }
      // Level 3 → Bronze
      // else if (
      //   childrenReachedLevel2 >= MNR &&
      //   totalGrandChildrenFromLevel2 >= MNR * MNR &&
      //   level3Count <= MNR * MNR
      // ) {
      else if (
        level3Count >= MNR &&
        level3Count < settings.l4Multiplier * settings.l3LeveledUps
      ) {
        userLevelStr = 3;
        memberLevel = "Bronze";
        requiredChildrenToNext = Math.max(0, 2 * MNR - RCA);
        requiredGrandChildrenToNext =
          settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
        nextLevelName = "Silver";
        await updateDoc(userRef, { Level: 3 });
        if (!userData.LevelsUpdate[3]) {
          await updateDoc(userRef, { [`LevelsUpdate.3`]: today });
        }
      }
      // Level 4 → Silver Earner
      // else if (RCA <= settings.l4Multiplier * MNR) {
      //   userLevelStr = 3;
      //   memberLevel = "Bronze";
      //   requiredChildrenToNext = Math.max(0, settings.l4Multiplier * MNR - RCA);
      //   requiredGrandChildrenToNext =
      //     settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
      //   nextLevelName = "Silver";
      //   await updateDoc(userRef, { Level: 3 });

      //   if (!userData.LevelsUpdate[4]) {
      //     await updateDoc(userRef, { [`LevelsUpdate.3`]: today });
      //   }
      // }
      // Level 5 → Gold Earner
      // else if (
      //   childrenReachedLevel2 >= settings.l4Multiplier &&
      //   totalGrandChildrenFromLevel2 >=
      //     settings.l3Total * settings.l4Multiplier &&
      //   level3Count <= settings.l3LeveledUps * MNR
      // ) {
      else if (
        level3Count >= settings.l4Multiplier * settings.l3LeveledUps &&
        level3Count < settings.l5Multiplier * settings.l3LeveledUps
      ) {
        userLevelStr = 4;
        memberLevel = "Silver";
        requiredChildrenToNext = Math.max(0, settings.l5Multiplier * MNR - RCA);
        requiredGrandChildrenToNext =
          settings.l5Multiplier * RCA - totalGrandChildrenFromLevel2;
        nextLevelName = "Gold";
        await updateDoc(userRef, { Level: 4 });
        if (!userData.LevelsUpdate[5]) {
          await updateDoc(userRef, { [`LevelsUpdate.4`]: today });
        }
      }
      // else if (RCA <= settings.l5Multiplier * MNR) {
      //   userLevelStr = 4;
      //   memberLevel = "Silver";
      //   requiredChildrenToNext = Math.max(0, settings.l4Multiplier * MNR - RCA);
      //   requiredGrandChildrenToNext =
      //     settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
      //   nextLevelName = "Gold";
      //   await updateDoc(userRef, { Level: 3 });

      //   if (!userData.LevelsUpdate[4]) {
      //     await updateDoc(userRef, { [`LevelsUpdate.4`]: today });
      //   }
      // }
      // Level 6 → Platinum Earner
      // else if (
      //   childrenReachedLevel2 >= settings.l5Multiplier &&
      //   totalGrandChildrenFromLevel2 >=
      //     settings.l3Total * settings.l5Multiplier &&
      //   level3Count <= settings.l3LeveledUps * settings.l5Multiplier
      // ) {
      else if (
        level3Count >= settings.l5Multiplier * settings.l3LeveledUps &&
        level3Count < settings.l6Multiplier * settings.l3LeveledUps
      ) {
        userLevelStr = 5;
        memberLevel = "Gold";
        // memberLevel = memberLevel + level3Count;
        requiredChildrenToNext = Math.max(0, settings.l6Multiplier * MNR - RCA);
        requiredGrandChildrenToNext =
          settings.l6Multiplier * RCA - totalGrandChildrenFromLevel2;
        nextLevelName = "Platinum";
        await updateDoc(userRef, { Level: 5 });
        if (!userData.LevelsUpdate[6]) {
          await updateDoc(userRef, { [`LevelsUpdate.5`]: today });
        }
      }
      // else if (RCA <= settings.l6Multiplier * MNR) {
      //   userLevelStr = 5;
      //   memberLevel = "Gold";
      //   requiredChildrenToNext = Math.max(0, settings.l4Multiplier * MNR - RCA);
      //   requiredGrandChildrenToNext =
      //     settings.l4Multiplier * RCA - totalGrandChildrenFromLevel2;
      //   nextLevelName = "Platinum";
      //   await updateDoc(userRef, { Level: 3 });

      //   if (!userData.LevelsUpdate[4]) {
      //     await updateDoc(userRef, { [`LevelsUpdate.5`]: today });
      //   }
      // }
      // Max Level
      // else if (
      //   childrenReachedLevel2 >= settings.l6Multiplier &&
      //   totalGrandChildrenFromLevel2 >=
      //     settings.l3Total * settings.l6Multiplier &&
      //   level3Count <= settings.l5Total
      // ) {
      else if (level3Count >= settings.l6Multiplier * settings.l3LeveledUps) {
        userLevelStr = 6;
        memberLevel = "Platinum";
        // memberLevel = memberLevel + Number(Number(settings.l3LeveledUps) * MNR);
        requiredChildrenToNext = 0;
        requiredGrandChildrenToNext = 0;
        nextLevelName = "Max Level";
        await updateDoc(userRef, { Level: 6 });
        if (!userData.LevelsUpdate[6]) {
          await updateDoc(userRef, { [`LevelsUpdate.6`]: today });
        }
      } else {
        userLevelStr = 6;
        memberLevel = "Platinum";
        // memberLevel = memberLevel + Number(Number(settings.l3LeveledUps) * MNR);
        requiredChildrenToNext = 0;
        requiredGrandChildrenToNext = 0;
        nextLevelName = "Max Level";
        await updateDoc(userRef, { Level: 6 });
        if (!userData.LevelsUpdate[6]) {
          await updateDoc(userRef, { [`LevelsUpdate.6`]: today });
        }
      }

      //store level name and level number to firebase
      await updateDoc(userRef, {
        memberLevel: memberLevel,
        badgeLevel: userLevelStr,
      });

      // --- Logs ---
      // console.log("=== LEVEL RESULT ===");
      // console.log("User Level:", userLevelStr);
      // console.log("Member Level:", memberLevel);
      // console.log("Next Level:", nextLevelName);
      // console.log("Direct Children (RCA):", RCA);
      // console.log("Level-2 Children:", childrenReachedLevel2);
      // console.log("Total Grandchildren:", totalGrandChildrenAll);
      // console.log(
      //   "Grandchildren from Level-2:",
      //   totalGrandChildrenFromLevel2
      // );
      // console.log("Remaining Children:", requiredChildrenToNext);
      // console.log("Remaining Grandchildren:", requiredGrandChildrenToNext);

      // --- Set state ---
      setLevel?.(level3Count);
      const averageForLevelUp =
        level3Count > 0 ? Number(parentCount / level3Count) : 0;
      setAverageForLevelUp(averageForLevelUp);
      setMemberLevel?.(memberLevel);
      setCurrentChildren?.(RCA);
      setCurrentGrandChildren?.(totalGrandChildrenAll);
      setRemainingChildren?.(requiredChildrenToNext);
      // setRemainingGrandChildren?.(remainingGrandChildrenCorrect);
      setNextLevelNeed?.(remainingPoints);

      const settingRef = doc(db, "users", userId);
      const settingSnap = await getDoc(settingRef);
      if (!settingSnap.exists()) return;
      const setting = settingSnap.data();
      setRemainingGrandChildren?.(setting.l3Total);
      // if (userLevelStr <= 2) {
      //   setRemainingGrandChildren?.(0);
      // } else if (userLevelStr === 3) {
      //   setRemainingGrandChildren?.(setting.l3Total);
      // }
      // else if (userLevelStr == 4) {
      //   setRemainingGrandChildren?.(setting.l4Total);
      // } else if (userLevelStr === 5) {
      //   setRemainingGrandChildren?.(setting.l5Total);
      // } else if (userLevelStr === 6) {
      //   setRemainingGrandChildren?.(setting.l6Total);
      // }
      setLoading(false); // stop loader after success or error
    } catch (err) {
      console.error("Error fetching referral settings:", err);
    }
  };

  useEffect(() => {
    async function fetchCounts() {
      const userId = user?.uid;
      //  console.log("userId", userId);
      const parents = await countParents(userId);
      const children = await countChildren(userId);
      setParentCount(parents);
      setChildCount(children);
    }

    if (user && !hasFetchedSettings) {
      setIsLoading(true);
      fetchCounts();

      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchIp = async () => {
      const mapData = await buildReferralArray();
      setReferalMap(mapData);
      const averageForChild = Number(parentCount / childCount) ?? 0;
      setAverageForChild(averageForChild);
    };
    if (user) fetchSettings().then(() => setHasFetchedSettings(true));
    fetchIp();
    // if (user) {
    //   setIsLoading(true);
    //   fetchIp();
    //   setIsLoading(false);
    // }
  }, [parentCount, childCount]);

  const referrals = [
    {
      name: "Sarah Johnson",
      email: "sarah@example.com",
      level: "Level-2",
      referrals: 125,
      dateJoined: "May 15, 2025",
      avatar: "/lovable-uploads/logo_color_correct.png",
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        city: "New York",
        country: "USA",
      },
    },
    {
      name: "Michael Chen",
      email: "michael@example.com",
      level: "Level-1",
      referrals: 45,
      dateJoined: "June 2, 2025",
      avatar: "/lovable-uploads/logo_color_correct.png",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        city: "San Francisco",
        country: "USA",
      },
    },
    {
      name: "Emma Wilson",
      email: "emma@example.com",
      level: "Level-2",
      referrals: 156,
      dateJoined: "April 20, 2025",
      avatar:
        "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=150&h=150&fit=crop&crop=face",
      location: {
        latitude: 51.5074,
        longitude: -0.1278,
        city: "London",
        country: "UK",
      },
    },
  ];

  const stepCards = [
    {
      step: 1,
      title: "Share our cards",
      description: `1st, give-a-way referrer ${
        MNR * 1.5
      } + free business cards`,
    },
    {
      step: 2,
      title: "Tell others to share our cards too",
      description: `2nd, get ${MNR} of your recruits to referrer ${MNR}+ cards`,
    },
    {
      step: 3,
      title: "Level-up your account",
      description: `You = Level-2 when you recruit referrer ${MNR}+ users`,
    },
    {
      step: 4,
      title: "Your recruits level-up their account",
      description: `You = Level-3 when ${MNR} of your recruits = Level-2`,
    },
    {
      step: 5,
      title: "Earner status",
      description: "Level-3 = Earner, you can earn $2k-$10k/mo",
    },
  ];

  const metrics = [
    {
      title: "Child Referrals",
      value: childCount,
      required: MNR,
      average: `Avg. ${averageForChild.toFixed(2)} GC per Child`,
    },

    //required: nextLevelNeed
    {
      title: "Level-Up Referrals",
      value: level,
      required: MNR,
      average: `Avg. ${averageForLevelUp.toFixed(2)} GC per Level-Up`,
    },
    {
      title: "Grand-children Referrals",
      value: parentCount,
      required: remainingGrandChildren,
    },
  ];

  const targetLevels = [
    {
      level: "Level-1:",
      description: `< [${MNR}] referrals`,
      status: "Starter",
      progress: childEarnings,
      monetized: "Not Monetized",
      color: "bg-gray-400",
    },
    {
      level: "Level-2:",
      description: `≥ [${MNR}] Child referrals`,
      status: "Level-Up",
      progress: childEarnings,
      monetized: "Not Monetized",
      color: "bg-blue-400",
    },
    {
      level: "Level-3:",
      description: `≥ [${MNR}] of your Child referrals are Level 2`,
      status: "Bronze Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-yellow-400",
    },
    {
      level: "Level-4:",
      description: `≥ L3 x [${l4Multiplier}]`,
      status: "Silver Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-green-400",
    },
    {
      level: "Level-5:",
      description: `≥ L3 x [${l5Multiplier}]`,
      status: "Gold Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-purple-400",
    },
    {
      level: "Level-6:",
      description: `≥ L3 x [${l6Multiplier}]`,
      status: "Platinum Earner",
      progress: grandchildEarnings,
      monetized: "Monetized",
      color: "bg-pink-400",
    },
  ];

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast("Referral link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const [enrichedReferrals, setEnrichedReferrals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;
  const totalPages = Math.ceil(enrichedReferrals.length / itemsPerPage);

  // Pagination logic
  const paginatedData = enrichedReferrals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const firstTen = enrichedReferrals.slice(0, 10);

  useEffect(() => {
    const fetchLatestCards = async () => {
      const results = await Promise.all(
        sortedReferrals?.map(async (referral) => {
          const q = query(
            collection(db, "cards"),
            where("uid", "==", referral.userId),
            limit(1)
          );
          const referalRef = doc(db, "referrals", referral.userId);
          const refSnap = await getDoc(referalRef);

          let badgeLevel = 1;
          if (refSnap.exists()) {
            const refData = refSnap.data();
            if (refData.badgeLevel) {
              badgeLevel = refData.badgeLevel ?? 1;
            }
          }
          const snapshot = await getDocs(q);
          if (snapshot.empty) return { ...referral, badgeLevel };
          const cardData = snapshot.docs[0].data();
          const latestCardId = cardData?.metadata?.id || null;
          const profilePhoto = cardData?.profilePhoto || null;
          const firstName = cardData?.profile?.firstName || null;
          const lastName = cardData?.profile?.lastName || null;
          const cardName = cardData?.id || null;

          return {
            ...referral,
            latestCardId,
            profilePhoto,
            firstName,
            lastName,
            cardName,
            badgeLevel,
          };
        })
      );
      console.log("sorted", results);
      setEnrichedReferrals(results);
    };

    if (sortedReferrals.length > 0) fetchLatestCards();
  }, [sortedReferrals]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading....</div>
      </div>
    );
  }

  const levelImages = {
    Starter: "/badges/1-Starter.png",
    "Level-Up": "/badges/2-LevelUp.png",
    Bronze: "/badges/3-BronzeEarner.png",
    Silver: "/badges/4-SilverEarner.png",
    Gold: "/badges/5-GoldEarner.png",
    Platinum: "/badges/6-PlatinumEarner.png",
  };

  const imageSrc = levelImages[memberLevel] || null;

  return (
    <div className="space-y-4">
      {/* Alert Card */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-lg font-semibold">
          Earn Passive Income with SoloBizCards
        </AlertTitle>
        <AlertDescription className="text-base mt-2">
          Earning is easy! Get to Level-3. Refer 100+ = Level-2. When your
          referrals also refer 100+ = Level-3 for you. Start earning at Level-3.
        </AlertDescription>
      </Alert>

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {refBadgesLevel < 3 &&
          stepCards.map((step) => (
            <Card
              key={step.step}
              className="relative card-hover cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <span className="text-blue-600 font-semibold">
                    {step.step}
                  </span>
                </div>
                <CardTitle className="text-sm font-medium">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Member Level & Metrics - 4 Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="text-sm font-medium border-b pb-2">
              Your Member Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{memberLevel}</div>
                  <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors">
                    {imageSrc && (
                      <img
                        src={imageSrc}
                        alt={`${memberLevel} Earner`}
                        className="w-10 h-10 mx-auto rounded-lg"
                      />
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="secondary">{formatted}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="card-hover cursor-pointer relative overflow-hidden"
          >
            <CardHeader>
              <CardTitle className="text-sm font-medium border-b pb-2">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                // Loader section
                <div className="flex justify-center items-center py-6">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                // Actual metric data
                <div>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.required} {metric.required >= 0 ? "Required" : ""}
                      <br></br>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-end">
                    {metric.average} {Number(metric.average) >= 0 ? "" : ""}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="text-sm font-medium border-b pb-2">
              Your Parent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      if (defaultCard) navigate(`/card/${defaultCard}`);
                    }}
                    disabled={!defaultCard}
                    className={`group ${
                      !defaultCard
                        ? "pointer-events-none cursor-default opacity-50"
                        : ""
                    }`}
                  >
                    <span className="relative flex shrink-0 overflow-hidden rounded-full w-12 h-12 cursor-pointer transition-transform duration-200 group-hover:scale-110">
                      <img
                        style={{ backgroundColor: "#8080805e" }}
                        className="aspect-square h-full w-full"
                        alt="John Anderson"
                        src={
                          cardDetails?.profilePhoto
                            ? cardDetails?.profilePhoto
                            : "/lovable-uploads/logo_color_correct.png"
                        }
                      />
                    </span>
                  </button>

                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {cardDetails
                        ? cardDetails?.profile?.firstName ?? ""
                        : parentInfo?.displayName ?? ""}{" "}
                      {cardDetails
                        ? cardDetails?.profile?.lastName ?? ""
                        : parentInfo?.lastName ?? ""}
                    </div>
                  </div>

                  {cardDetails?.appointments?.appointmentType == "booking" &&
                    cardDetails?.appointments?.platform == "calendly" &&
                    cardDetails?.appointments?.calendlyUrl && (
                      <button
                        onClick={() => {
                          navigate(cardDetails?.appointments?.calendlyUrl);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        Schedule Meeting
                      </button>
                    )}

                  {cardDetails?.appointments?.appointmentType == "booking" &&
                    cardDetails?.appointments?.platform == "google" &&
                    cardDetails?.appointments?.googleUrl && (
                      <button
                        onClick={() => {
                          navigate(cardDetails?.appointments?.googleUrl);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        <Calendar size={20} /> Schedule Meeting
                      </button>
                    )}

                  {cardDetails?.appointments?.appointmentType ==
                    "call-to-action" &&
                    cardDetails?.appointments?.ctaUrl && (
                      <button
                        onClick={() => {
                          navigate(cardDetails?.appointments?.ctaUrl);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        <Calendar size={20} />{" "}
                        {cardDetails?.appointments?.ctaLabel}
                      </button>
                    )}

                  {cardDetails?.appointments?.directAds?.image &&
                    cardDetails?.appointments?.appointmentType ==
                      "direct-ads" &&
                    cardDetails?.appointments?.directAds.type != "none" && (
                      <button
                        onClick={() => {
                          cardDetails && setShowLightbox(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 w-full"
                      >
                        <Eye size={20} /> View Our{" "}
                        {cardDetails?.appointments?.directAds.type}
                      </button>
                    )}
                </div>

                {cardDetails?.appointments?.directAds?.image &&
                  cardDetails?.appointments?.appointmentType == "direct-ads" &&
                  cardDetails?.appointments?.directAds.type != "none" && (
                    <Lightbox
                      isOpen={showLightbox}
                      onClose={() => setShowLightbox(false)}
                      imageSrc={cardDetails.appointments.directAds.image}
                      title={cardDetails.appointments.directAds.title}
                      description={
                        cardDetails.appointments.directAds.description
                      }
                      price={cardDetails.appointments.directAds.price}
                      url={cardDetails.appointments.directAds.url}
                      theme={cardDetails.brandColor}
                    />
                  )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two Column Grid: Referrals List & Referral Link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Your List of Referrals */}
        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg font-semibold">
              <span>Your List of Referrals</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMapOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Show Map
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-6 px-4">
              <div className="flex -space-x-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : enrichedReferrals.length > 0 ? (
                  <>
                    {/* First row (10 avatars + More button) */}
                    <div className="flex -space-x-6 mb-4 items-center">
                      {firstTen.map((referral, index) => (
                        <Avatar
                          key={index}
                          className="w-16 h-16 border-4 border-background cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
                          style={{
                            zIndex: 10 - index,
                            backgroundColor: "#808080db",
                            boxShadow:
                              "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                          }}
                          onClick={() => {
                            referral?.latestCardId &&
                              navigate("/card/" + referral?.latestCardId);
                          }}
                        >
                          <AvatarImage
                            src={
                              referral?.profilePhoto ||
                              "/lovable-uploads/logo_color_correct.png"
                            }
                            alt={referral?.name}
                          />
                          <AvatarFallback>
                            {referral?.name
                              ?.split(" ")
                              ?.map((n) => n[0])
                              ?.join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>

                    {/* Modal for all referrals with pagination */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                      <DialogPortal>
                        {/* Overlay */}
                        <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

                        {/* Modal */}
                        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-5xl w-full h-[65vh]">
                          {/* Close Icon */}
                          <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
                          >
                            {/* <X className="h-5 w-5" /> */}
                          </button>

                          {/* Header */}
                          <DialogHeader className="flex flex-col space-y-1.5 text-center sm:text-left">
                            <DialogTitle className="font-semibold tracking-tight text-xl">
                              Your Complete List of Referrals
                            </DialogTitle>
                            <p className="text-muted-foreground text-base mt-2">
                              Total Referrals:{" "}
                              <span className="font-semibold text-foreground">
                                {enrichedReferrals.length}
                              </span>
                            </p>
                          </DialogHeader>

                          {/* Body (Scrollable) */}
                          {/* <div className="overflow-auto px-6 py-4">
                            <table className="min-w-full border border-gray-200 rounded-lg">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="text-left py-2 px-4 border-b">
                                    Profile Photo
                                  </th>
                                  <th className="text-left py-2 px-4 border-b">
                                    Card Name
                                  </th>
                                  <th className="text-left py-2 px-4 border-b">
                                    First Name
                                  </th>
                                  <th className="text-left py-2 px-4 border-b">
                                    Last Name
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedData.length > 0 ? (
                                  paginatedData.map((referral, index) => (
                                    <tr
                                      key={index}
                                      className="hover:bg-gray-50 transition cursor-pointer"
                                      onClick={() =>
                                        referral?.latestCardId &&
                                        navigate(
                                          "/card/" + referral?.latestCardId
                                        )
                                      }
                                    >
                                      <td className="py-2 px-4 border-b">
                                        <Avatar
                                          className="w-10 h-10 border-2 border-background"
                                          style={{
                                            backgroundColor: "#808080db",
                                            boxShadow:
                                              "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                                          }}
                                        >
                                          <AvatarImage
                                            src={
                                              referral?.profilePhoto ||
                                              "/lovable-uploads/logo_color_correct.png"
                                            }
                                          />
                                          <AvatarFallback>
                                            {referral?.name
                                              ?.split(" ")
                                              ?.map((n) => n[0])
                                              ?.join("")}
                                          </AvatarFallback>
                                        </Avatar>
                                      </td>
                                      <td className="py-2 px-4 border-b text-blue-600 font-medium">
                                        {referral?.cardName || "—"}
                                      </td>
                                      <td className="py-2 px-4 border-b">
                                        {referral?.firstName || "—"}
                                      </td>
                                      <td className="py-2 px-4 border-b">
                                        {referral?.lastName || "—"}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td className="text-center py-4 text-muted-foreground">
                                      No referrals found
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div> */}

                          <div className="space-y-4">
                            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4 py-4 max-h-[50vh] overflow-y-auto">
                              {paginatedData.length > 0 ? (
                                paginatedData.map((referral, index) => (
                                  <div
                                    key={index}
                                    className="flex flex-col items-center gap-2 group cursor-pointer"
                                    onClick={() =>
                                      referral?.latestCardId &&
                                      navigate(
                                        "/card/" + referral?.latestCardId
                                      )
                                    }
                                  >
                                    <span className="relative flex shrink-0 overflow-hidden rounded-full w-12 h-12 hover:scale-110 transition-transform duration-200 border-2 border-muted hover:border-primary">
                                      <img
                                        className="aspect-square h-full w-full object-cover"
                                        alt={referral?.firstName || "User"}
                                        onClick={() => {
                                          referral?.latestCardId &&
                                            navigate(
                                              "/card/" + referral?.latestCardId
                                            );
                                        }}
                                        style={{
                                          zIndex: 10 - index,
                                          backgroundColor: "#808080db",
                                          boxShadow:
                                            "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                                        }}
                                        src={
                                          referral?.profilePhoto ||
                                          "/lovable-uploads/logo_color_correct.png"
                                        }
                                      />
                                    </span>
                                    <div className="text-center">
                                      <p className="text-xs font-medium truncate max-w-[60px] group-hover:text-primary transition-colors">
                                        {referral?.firstName || "—"}
                                      </p>
                                      <div className="inline-flex items-center rounded-full border font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 text-[10px] px-1 py-0">
                                        Level- {referral?.badgeLevel}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-4 text-muted-foreground">
                                  No referrals found
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <DialogFooter className="border-t px-6 py-4 flex items-center justify-between">
                            {/* Left Side Info */}
                            <div className="text-sm text-muted-foreground">
                              Page {currentPage} of {totalPages}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-2">
                              {/* Previous Button */}
                              <button
                                disabled={currentPage === 1}
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(prev - 1, 1)
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:pointer-events-none disabled:opacity-50 border border-input bg-background 
      hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />{" "}
                                Previous
                              </button>

                              {/* Current Page Indicator */}
                              <span className="text-sm font-medium px-2">
                                {currentPage}
                              </span>

                              {/* Next Button */}
                              <button
                                disabled={currentPage === totalPages}
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                  )
                                }
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:pointer-events-none disabled:opacity-50 border border-input bg-background 
      hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                              >
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                              </button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </DialogPortal>
                    </Dialog>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data found</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">
                  [ {enrichedReferrals.length} ]
                </span>
                {/* "More >" button */}
                {enrichedReferrals.length > 10 && (
                  <span
                    className="!ml-[15px] text-sm font-medium text-blue-600 cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    ... more &gt;&gt;
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Referral Link */}
        <Card className="card-hover cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Copy and share this URL. Anyone who signs up via it becomes your
              recruit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="flex-1" />
              <Button size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Suggested Target Levels - Full Width */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Your Suggested Target Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <p className="text-sm mb-1">
              Everyone starts a "Level-1", the goal is to become monetized if
              earning passive income is your desire.
              <Accordion type="single" collapsible className="mt-2">
                <AccordionItem value="learn-more" className="border-none">
                  <AccordionTrigger className="text-primary p-0 text-sm font-normal hover:no-underline">
                    Learn more...
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pt-2">
                    The first task is to meet and exceed the L2 minimum
                    requirement [100-referrals] by at least 50%. Next, encourage
                    at least [100] of your referrals to "Level-Up"; they may
                    just do it without your encouragement because the offer is
                    so good. Your ultimate target is "Level-3", at L3, you are
                    monetized and can start earning 10% and 50% on your
                    Child-referrals and your Grandchild-referrals, respectively.
                    When your Child refers someone, that member becomes your
                    Grandchild, you make 50% of anything your grandchild
                    purchases on the site. Choose your track and start earning
                    passive income now.{" "}
                    <a
                      href="/opportunities"
                      className="text-primary hover:underline"
                    >
                      Learn more...
                    </a>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </p>
          </div>
          {targetLevels.map((level, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${level.color}`} />
                  <div className="text-sm">
                    <span className="font-semibold">{level.level}</span>{" "}
                    {level.description} |{" "}
                    <span
                      className={
                        level.status === "Top Earner" ? "text-blue-600" : ""
                      }
                    >
                      {level.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="font-semibold">{level.progress}%</span> |{" "}
                    <span
                      className={
                        level.monetized === "Monetized"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {level.monetized}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referrals Map Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>Referral Locations Map</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <WorldMap contacts={referalMap} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
