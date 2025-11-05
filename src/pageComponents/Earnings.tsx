"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IncomeFromReferrals } from "@/components/dashboard/IncomeFromReferrals";
import { useAuth } from "@/contexts/AuthContext";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Earnings = () => {
  const paymentSchedule = [
    {
      month: "May 2025",
      label: "[current]",
      amount: "$1,230.00",
      dueDate: "30th",
      status: "current",
    },
    { month: "Jun. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Jul. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Aug. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Sept. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Oct. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Nov. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Dec. 2025", amount: "$1,230.00", dueDate: "30th" },
    { month: "Jan. 2026", amount: "$1,230.00", dueDate: "30th" },
    { month: "Feb. 2026", amount: "$350.00", dueDate: "28th" },
    { month: "Mar. 2026", amount: "$100.00", dueDate: "30th" },
    { month: "Apr. 2026", amount: "$0.00", dueDate: "30th" },
  ];

  // const recentActivities = [
  //   { amount: "$23.40", description: "for 50% yearly service pmt." },
  //   { amount: "$4.68", description: "for 10% yearly service pmt." },
  //   { amount: "$2.47", description: "for 50% monthly service pmt." },
  //   { amount: "$0.49", description: "for 10% monthly service pmt." },
  // ];

  // const payoutHistory = [
  //   { amount: "$1,230.00", date: "Apr. 2025" },
  //   { amount: "$850.00", date: "Mar. 2025" },
  //   { amount: "$1,130.00", date: "Feb. 2025" },
  //   { amount: "$1,130.00", date: "Jan. 2025" },
  // ];
  const [open, setOpen] = useState(false);

  // Show only the last 5

  const { user } = useAuth();
  const [childPaidReferals, setChilPaidReferals] = useState(0);
  const [grandChildPaidReferals, setGrandChilPaidReferals] = useState(0);
  const [childPaid, setChilPaid] = useState(0);
  const [childEarnings, setChildEarnings] = useState(0);
  const [grandchildEarnings, setGrandchildEarnings] = useState(0);
  const [grandChildPaid, setGrandChilPaid] = useState(0);
  const [operatingCostRate, setOperatingCostRate] = useState(0);
  const [pricing, setPricing] = useState(0);
  const [scheduleCurrentMonth, setScheduleCurrentMonth] = useState(new Date());
  const [scheduleAmount, setScheduleAmount] = useState(0);
  const [paymentScheduled, setPaymentScheduled] = useState([]);
  const [level3FormattedDate, setLevel3FormattedDate] = useState("");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const createdAt = user?.metadata?.creationTime ?? new Date();
  const [formattedHistory, setFormattedHistory] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const lastFive = recentActivities.slice(0, 5);

  const [valueSet, resetValueSet] = useState(0);

  const date = new Date(createdAt);
  const day = date.getDate();
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
  async function getRelations(userId: string) {
    const userRef = doc(db, "referrals", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const children = userData.children || [];
      const grandchildren = userData.grandchildren || [];

      return {
        childrenCount: children.length,
        grandchildrenCount: grandchildren.length,
        total: children.length + grandchildren.length,
      };
    }

    return { childrenCount: 0, grandchildrenCount: 0, total: 0 };
  }

  const [counts, setCounts] = useState({
    childrenCount: 0,
    grandchildrenCount: 0,
    total: 0,
  });

  const fetchPaidCounts = async () => {
    setIsLoading(true);
    const userRef = doc(db, "referrals", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();

    const currentLevel = userData.Level;
    const levelDateISO = userData.LevelsUpdate[currentLevel];
    const balanceEarnings = userData.balanceEarnings || {};
    const earningsCost = userData.earningsCost || {};
    // Convert to array of [uid, amount]
    if (balanceEarnings) {
      const reversedEntries = Object.entries(balanceEarnings).reverse();
      const reversedCostEntries = Object.entries(earningsCost).reverse();
      const result = [];
      for (const [uid, amount] of reversedEntries) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const earningsCost =
            reversedCostEntries.find(([id, cost]) => id === uid)?.[1] ?? 0;
          const userData = userSnap.data();
          result.push({
            uid,
            amount,
            earcningsCost: earningsCost,
            name: userData.displayName || "Unknown",
            email: userData.email || "No Email",
          });
        } else {
          result.push({
            uid,
            amount,
            earcningsCost: 0,
            name: "Unknown",
            email: "Not found",
          });
        }
      }
      setRecentActivities(result);
    }

    if (levelDateISO) {
      const date = new Date(levelDateISO);
      const day = date.getDate();
      const daySuffix = (d) => {
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

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      const level3FormattedDateNew = `${day}${daySuffix(day)} ${month} ${year}`;
      setLevel3FormattedDate(level3FormattedDateNew);
      setCurrentLevel(currentLevel);
    }

    if (currentLevel >= 3) {
      if (!user?.uid) {
        console.error("User UID not found");
        return;
      }

      const olduserRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(olduserRef);

      if (userSnap.exists()) {
        const userInfo = userSnap.data() as any;
        const userRef = doc(db, "users", user?.uid);
        if (!userInfo.userChildEarning) {
          const userChildEarning = childEarnings;
          await updateDoc(userRef, {
            userChildEarning: userChildEarning,
          });
        } else {
          setChildEarnings(userInfo.userChildEarning);
        }

        if (!userInfo.userGrandChildEarning) {
          const userGrandChildEarning = grandchildEarnings;
          await updateDoc(userRef, {
            userGrandChildEarning: userGrandChildEarning,
          });
        } else {
          setGrandchildEarnings(userInfo.userGrandChildEarning);
        }
      }
    }

    const children = userData.children || [];
    const noOfChild = children.length;
    let noOfGC = 0;
    let paidChild = 0;
    let firstPaidInitial = new Date();
    let paidGC = 0;
    // --- Check children ---
    for (const childId of children) {
      const childRef = doc(db, "referrals", childId);
      const childSnap = await getDoc(childRef);

      const userchildRef = doc(db, "users", childId);
      const userchildSnap = await getDoc(userchildRef);
      if (userchildSnap.exists()) {
        const userchildData = userchildSnap.data();
        if (userchildData.planType === "paid") {
          paidChild = paidChild + 1;
          const startDate = new Date(userchildData.subscriptionStartDate);

          // Initialize or update the earliest paid subscription date
          if (!firstPaidInitial || startDate < firstPaidInitial) {
            firstPaidInitial = startDate;
          }
        }
      }

      if (!childSnap.exists()) {
        console.log(`Child ID ${childId} not found`);
        continue;
      }

      const childData = childSnap.data();
      const childChildren = childData.children || [];
      noOfGC = noOfGC + childChildren.length;
      for (const grandchildId of childChildren) {
        const userchildRef = doc(db, "users", grandchildId);
        const userchildSnap = await getDoc(userchildRef);
        if (userchildSnap.exists()) {
          const userchildData = userchildSnap.data();
          if (userchildData.planType === "paid") {
            paidGC = paidGC + 1;
            const startDate = new Date(userchildData.subscriptionStartDate);

            // Initialize or update the earliest paid subscription date
            if (!firstPaidInitial || startDate < firstPaidInitial) {
              firstPaidInitial = startDate;
            }
          }
        }
      }
    }
    setScheduleCurrentMonth(firstPaidInitial);
    setChilPaidReferals(paidChild > 0 ? (paidChild * 100) / noOfChild : 0);
    setGrandChilPaidReferals(paidGC > 0 ? (paidGC * 100) / noOfGC : 0);
    setChilPaid(paidChild);
    setGrandChilPaid(paidGC);
    const grossChildEarning = Number(
      (childPaid * childEarnings * pricing) / 100
    );
    const grossGChildEarning = Number(
      (grandChildPaid * grandchildEarnings * pricing) / 100
    );

    const netChildEarning =
      grossChildEarning - (grossChildEarning * operatingCostRate) / 100;
    const netGChildEarning =
      grossGChildEarning - (grossGChildEarning * operatingCostRate) / 100;
    const sechduleAmount = Number(netChildEarning + netGChildEarning);
    setScheduleAmount(sechduleAmount);
    const schedule = await generateSchedule(
      scheduleCurrentMonth.getMonth(),
      scheduleCurrentMonth.getFullYear(),
      12,
      4,
      Number(sechduleAmount / 12),
      scheduleAmount
    );
    setPaymentScheduled(schedule);
    setIsLoading(false);
    resetValueSet(1);
  };

  const fetchSettings = async () => {
    try {
      const settingsRef = doc(db, "settings", "ReferralEarningRate");
      const snap = await getDoc(settingsRef);
      const userRef = doc(db, "users", user?.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.userChildEarning) {
          setChildEarnings(userData.userChildEarning);
        } else {
          if (snap.exists()) {
            const data = snap.data();
            setChildEarnings(data.childEarnings || 0);
          }
        }
        if (userData.userGrandChildEarning) {
          setGrandchildEarnings(userData.userGrandChildEarning);
        } else {
          if (snap.exists()) {
            const data = snap.data();
            setGrandchildEarnings(data.grandchildEarnings || 0);
          }
        }

        if (userData.operatingCostRate) {
          setOperatingCostRate(userData.operatingCostRate);
        } else {
          if (snap.exists()) {
            const data = snap.data();
            setOperatingCostRate(data.operatingCostRate || 0);
          }
        }
      } else {
        if (snap.exists()) {
          const data = snap.data();
          setChildEarnings(data.childEarnings || 0);
          setGrandchildEarnings(data.grandchildEarnings || 0);
          setOperatingCostRate(data.operatingCostRate || 0);
        }
      }

      // if (snap.exists()) {
      //   const data = snap.data();
      //   setOperatingCostRate(data.operatingCostRate || 0);
      // }

      const settingsPricingRef = doc(db, "settings", "PricingRequirement");
      const pricingSnap = await getDoc(settingsPricingRef);

      if (pricingSnap.exists()) {
        const data = pricingSnap.data();
        setPricing(data.proUpgradeYearlyWithDiscount || 0);
      }
    } catch (err) {
      console.error("Error fetching referral settings:", err);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      const res = await getRelations(user.uid);
      setCounts(res);
    };

    if (user) {
      setIsLoading(true);
      fetchSettings();
      fetchCounts();
      fetchPaidCounts();
      setIsLoading(false);
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!user?.subscriptionHistory || user.subscriptionHistory.length === 0)
      return;

    // Sort by startDate descending
    const sortedHistory = [...user.subscriptionHistory].sort((a, b) => {
      const getTime = (date: any) => {
        if (!date) return 0;
        // Firestore Timestamp
        if (date.toDate) return date.toDate().getTime();
        // Number
        if (typeof date === "number") return date;
        // String
        const parsed = new Date(date).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getTime(b.startDate) - getTime(a.startDate);
    });

    // Map into desired format
    const formatted = sortedHistory
      .map((sub) => {
        let dateObj: Date | null = null;

        if (!sub.startDate) return null;

        // Firestore Timestamp
        if (sub.startDate.toDate) dateObj = sub.startDate.toDate();
        // Number
        else if (typeof sub.startDate === "number")
          dateObj = new Date(sub.startDate);
        // String
        else if (typeof sub.startDate === "string") {
          const parsed = new Date(sub.startDate);
          if (!isNaN(parsed.getTime())) dateObj = parsed;
        }

        if (!dateObj) return null;

        const month = dateObj.toLocaleString("default", { month: "short" });
        const year = dateObj.getFullYear();

        const amount = `$${Number(sub.price).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

        return {
          amount,
          date: `${month}. ${year}`,
        };
      })
      .filter(Boolean); // remove nulls

    setFormattedHistory(formatted);
  }, [user?.subscriptionHistory]);

  // function generateSchedule(
  //   scheduleStartMonth,
  //   currentYear,
  //   totalMonths = 12,
  //   zeroMonths = 4,
  //   finalAmount = 10
  // ) {
  //   const schedule = [];
  //   const today = new Date();
  //   const currentMonthIndex = today.getMonth(); // 0-based (0 = Jan)

  //   // Precompute zero-value months
  //   const zeroMonthIndices = [];
  //   for (let i = 0; i < zeroMonths; i++) {
  //     zeroMonthIndices.push((scheduleStartMonth + i) % 12);
  //   }

  //   for (let i = 0; i < totalMonths; i++) {
  //     const date = new Date(currentYear, currentMonthIndex + i, 1);
  //     const monthIndex = date.getMonth();
  //     const monthName = date.toLocaleString("default", { month: "short" });
  //     const year = date.getFullYear();

  //     // Determine amount
  //     // If monthIndex is in zeroMonthIndices → 0, else finalAmount
  //     const amount = zeroMonthIndices.includes(monthIndex) ? 0 : finalAmount;

  //     // Determine last day of month
  //     const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  //     const dueDate = `${lastDay}th`; // simple th suffix

  //     schedule.push({
  //       month: `${monthName} ${year}`,
  //       amount: `$${amount.toFixed(2)}`,
  //       label: i === 0 ? "[current]" : "",
  //       status: i === 0 ? "current" : "",
  //       dueDate: dueDate,
  //     });
  //   }

  //   return schedule;
  // }

  async function generateSchedule(
    scheduleStartMonth,
    currentYear,
    totalMonths = 12,
    zeroMonths = 4,
    finalAmount = 10,
    totalEarningAmount
  ) {
    if (!user?.uid) return [];

    const schedule = [];
    const today = new Date();
    const currentMonthIndex = today.getMonth(); // 0-based (0 = Jan)

    // Precompute zero-value months
    const zeroMonthIndices = [];
    for (let i = 0; i < zeroMonths; i++) {
      zeroMonthIndices.push((scheduleStartMonth + i) % 12);
    }

    // --- 🗓️ Build Schedule ---
    for (let i = 0; i < totalMonths; i++) {
      const date = new Date(currentYear, currentMonthIndex + i, 1);
      const monthIndex = date.getMonth();
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();

      // Determine amount
      const amount = zeroMonthIndices.includes(monthIndex) ? 0 : finalAmount;

      // Determine last day of month
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const dueDate = `${lastDay}th`;

      schedule.push({
        month: `${monthName} ${year}`,
        year,
        monthName,
        amount: Number(amount.toFixed(2)),
        label: i === 0 ? "[current]" : "",
        status: i === 0 ? "current" : "",
        dueDate,
      });
    }

    // --- 💰 Compute totals ---
    const totalEarningBalance = schedule.reduce((sum, s) => sum + s.amount, 0);

    // --- 🗂️ Convert to year-wise object ---
    const yearWiseEarnings = {};
    schedule.forEach((item) => {
      if (!yearWiseEarnings[item.year]) {
        yearWiseEarnings[item.year] = {};
      }
      yearWiseEarnings[item.year][item.monthName] = item.amount;
    });

    // --- 💾 Save to Firestore ---
    try {
      const earningRef = doc(db, "earnings", user.uid);
      const earningSnap = await getDoc(earningRef);

      if (earningSnap.exists()) {
        await updateDoc(earningRef, {
          totalEarningBalance: Number(totalEarningAmount.toFixed(2)),
          yearWiseEarnings,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(earningRef, {
          userId: user.uid,
          totalEarningBalance: Number(totalEarningAmount.toFixed(2)),
          yearWiseEarnings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("❌ Error saving earnings:", error);
    }

    return schedule;
  }

  // Example usage
  // scheduleStartMonth = October (9), current month = Nov 2025

  // Example usage:
  // scheduleCurrentMonth = September (8, 0-indexed), current month = October (9)
  // const schedule = generateDynamicPaymentSchedule(scheduleCurrentMonth.getMonth(), scheduleCurrentMonth.getFullYear(), Number(sechduleAmount/12));
  // console.log("schedule",schedule);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Monetization Status */}
        <Alert className="border-green-200 bg-green-50">
          <AlertTitle className="text-base font-semibold">
            Monetization Status
          </AlertTitle>
          <AlertDescription className="text-base mt-2">
            {currentLevel >= 3 ? (
              <>
                <span className="font-medium text-green-600">
                  [Monetzed - Active]
                </span>{" "}
                - Since {level3FormattedDate}
              </>
            ) : (
              <span className="font-medium text-red-600">
                [Not Monetzed - Inactive]
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Income From Referrals */}
        <IncomeFromReferrals
          countRef={counts.total}
          countChild={counts.childrenCount}
          countGrandChild={counts.grandchildrenCount}
          paidChildReferals={childPaidReferals}
          grandChildPaidReferals={grandChildPaidReferals}
          paidChild={childPaid}
          grandChildPaid={grandChildPaid}
        />

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <div className="lg:col-span-3">
            <h2 className="text-base font-semibold mb-4">Earnings Summary</h2>
            <p className="text-sm text-muted-foreground">
              Track your pending and completed earnings from referrals.
            </p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg lg:col-span-1 lg:col-start-6 border border-blue-300 hover:border-blue-500 card-hover cursor-pointer">
            <div className="text-sm text-muted-foreground mb-1">
              12-Month Total
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${Number(scheduleAmount).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div>
          <h2 className="text-base font-semibold mb-4">Payment Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {paymentScheduled.map((payment, index) => (
              <Card
                key={index}
                className={`card-hover cursor-pointer ${
                  payment.status === "current"
                    ? "bg-blue-50 border-blue-200 hover:border-blue-400"
                    : "hover:border-gray-400"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 pb-2 border-b border-gray-200">
                    {payment.month}
                    {payment.label && (
                      <Badge variant="secondary" className="text-xs">
                        {payment.label}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 py-3">
                  <div className="text-xs text-muted-foreground">
                    {payment.amount === "$0.00"
                      ? "Total Amount Due"
                      : "Total Due"}
                  </div>
                  <div className="text-lg font-bold">
                    $
                    {Number(payment.amount) == 0
                      ? 0.0
                      : Number(payment.amount.toFixed(2))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Due Date: {payment.dueDate}.
                  </div>
                  <button className="text-xs text-blue-600 hover:underline pt-1">
                    Details here &gt;
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activities and Payout History */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {/* Recent Activities */}
          <Card className="lg:col-span-2 hover:border-gray-400 card-hover cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Recent Activities
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p>NOTE: Any income earned in this month</p>
                      <p>will be paid after the following 3-months,</p>
                      <p>and at the end of the 4th. month.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Trigger link */}
              <div
                className="text-sm text-blue-600 hover:underline cursor-pointer mb-4"
                onClick={() => setOpen(true)}
              >
                Last 30 days payments &gt;
              </div>

              {/* Display last 5 payments */}
              {lastFive.map((activity, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-600">
                    ${activity.amount}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    for {activity.earcningsCost}% service pmt.
                  </span>
                </div>
              ))}

              {/* Popup (Modal) */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Recent Activities Listing</DialogTitle>
                  </DialogHeader>

                  <div className="mt-4 space-y-3 max-h-80 overflow-y-auto">
                    {recentActivities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <span className="text-sm font-medium text-blue-600">
                          ${activity.amount}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          for {activity.earcningsCost}% service pmt.
                        </span>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card className="lg:col-span-2 hover:border-gray-400 card-hover cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Payout History
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="text-sm text-blue-600 hover:underline cursor-pointer mb-4">
                {/* Last 30 days payments &gt; */}
                No data found
              </div>

              {/* {formattedHistory && formattedHistory.length > 0 ? (
                formattedHistory.map((payout, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-blue-600">
                      {payout.amount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {payout.date}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No data found
                </div>
              )} */}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Earnings;
