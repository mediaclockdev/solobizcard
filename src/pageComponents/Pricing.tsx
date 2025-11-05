"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Palette,
  Share2,
  Radio,
  Smartphone,
  QrCode,
  UserPlus,
  Globe,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Make sure you have Dialog component
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  // For AlertDialog
  const [showAddonDialog, setShowAddonDialog] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [freeTrialPeriod, setFreeTrialPeriod] = useState(0);

  const [proUpgradeMonthly, setProUpgradeMonthly] = useState(0);
  const [proUpgradeMonthlyEquivalent, setProUpgradeMonthlyEquivalent] =
    useState(0);

  const [addOneCardMonthlyEquivalent, setAddOneCardMonthlyEquivalent] =
    useState(0);
  const [addOneCardMonthly, setAddOneCardMonthly] = useState(0);

  const [addFiveCardsMonthlyEquivalent, setAddFiveCardsMonthlyEquivalent] =
    useState(0);
  const [addFiveCardsMonthly, setAddFiveCardsMonthly] = useState(0);

  const { user, isLoading: authLoading } = useAuth();
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // === NEW: Dialog state ===
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const pricingRequirementSettings = async () => {
      try {
        const userRef = doc(db, "settings", "PricingRequirement");
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        setDiscount(userData.discount);

        if (user) {
          const userRef = doc(db, "users", user?.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) throw new Error("User not found");
          const userData = userSnap.data() as any;
          if (userData) {
            const period = Number(userData.freeTrialPeriod);
            setFreeTrialPeriod(!isNaN(period) ? period : 0);
          } else {
            setFreeTrialPeriod(userData.freeTrialPeriod);
          }
        } else {
          setFreeTrialPeriod(userData.freeTrialPeriod);
        }
        setProUpgradeMonthlyEquivalent(userData.proUpgradeMonthlyEquivalent);
        setProUpgradeMonthly(userData.proUpgradeMonthly);

        setAddOneCardMonthlyEquivalent(userData.addOneCardMonthlyEquivalent);
        setAddOneCardMonthly(userData.addOneCardMonthly);

        setAddFiveCardsMonthlyEquivalent(
          userData.addFiveCardsMonthlyEquivalent
        );
        setAddFiveCardsMonthly(userData.addFiveCardsMonthly);
      } catch (err) {
        console.error("Error fetching referral settings:", err);
      }
    };

    async function fetchPlan() {
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        body: JSON.stringify({ userId: user?.uid, action: "get" }),
      });
      const data = await res.json();
      console.log("Data", data);
      setPlan(data);
    }

    if (user) {
      setIsLoading(true);
      pricingRequirementSettings();
      setIsLoading(false);
    } else {
      setIsLoading(true);
      pricingRequirementSettings();
      setIsLoading(false);
    }
  }, [user]);

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for getting started",
      features: [
        "Professional digital business card",
        "Basic contact sharing",
        "QR code generation",
        "Mobile responsive design",
        "Email support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: {
        monthly: proUpgradeMonthly,
        annual: proUpgradeMonthlyEquivalent,
      },
      description: `Everything you need to grow. \n Everyone gets ${freeTrialPeriod}-days Free! Pro Trial`,
      features: [
        "Everything in Free",
        "Custom branding & colors",
        "Advanced analytics",
        "Lead capture forms",
        "Social media integration",
        "Custom domains",
        "Priority support",
        "Unlimited sharing",
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Add 1 Pro Card",
      price: {
        monthly: addOneCardMonthly,
        annual: addOneCardMonthlyEquivalent,
      },
      description: "Additional professional card",
      features: [
        "All Pro features",
        "Additional team member",
        "Shared team analytics",
        "Team management tools",
        "Bulk contact export",
      ],
      cta: "Add Card",
      popular: false,
    },
    {
      name: "Add 5 Pro Cards",
      price: {
        monthly: addFiveCardsMonthly,
        annual: addFiveCardsMonthlyEquivalent,
      },
      description: "Best for growing teams",
      features: [
        "All Pro features",
        "5 additional team members",
        "Advanced team analytics",
        "Team collaboration tools",
        "Bulk operations",
        "Custom integrations",
        "Dedicated account manager",
      ],
      cta: "Scale Team",
      popular: false,
    },
  ];

  const benefits = [
    {
      title: "You control the design",
      description:
        "A user-friendly editing panel is provided for personalizing and branding a digital business card.",
      icon: "Palette",
    },
    {
      title: "Unlimited sharing",
      description:
        "There is no limit to how many times a digital business card can be shared.",
      icon: "Share2",
    },
    {
      title: "Up to date",
      description:
        "Any changes made to a digital business card will be updated in real time to all shared links.",
      icon: "Radio",
    },
    {
      title: "Completely app free",
      description:
        "No app is required to create, send or to receive a digital business card.",
      icon: "Smartphone",
    },
    {
      title: "Quick scanning",
      description: "Receive a QR Code for scanning with a smartphone's camera.",
      icon: "QrCode",
    },
    {
      title: "Save to contacts",
      description: "Your information can be directly 'saved to contacts.'",
      icon: "UserPlus",
    },
    {
      title: "Dedicated link",
      description: "Receive a dedicated sharable link to your business card.",
      icon: "Globe",
    },
    {
      title: "Personal support",
      description: "We are always here to help you, whenever you need us.",
      icon: "Users",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the best plan for your business
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Everyone gets{" "}
            <span className="text-primary font-semibold">
              {freeTrialPeriod}-days Free! Pro Trial
            </span>
            . Start free and upgrade as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${
                !isAnnual ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span
              className={`text-sm ${
                isAnnual ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Annual
            </span>
            {isAnnual && (
              <Badge
                variant="secondary"
                className="ml-2 bg-green-100 text-green-800"
              >
                Save {discount}%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((planItem) => {
            const isProActive =
              user?.planName === "Pro" && user?.canceledAtPeriodEnd === false;

            const isAddon = planItem.name.startsWith("Add");

            const isAddonPurchased =
              Array.isArray(user?.addons) &&
              user?.addons.some(
                (addon) =>
                  addon.name?.trim().toLowerCase() ===
                    planItem.name.trim().toLowerCase() && addon.subscriptionId
              );

            const noProYet = isAddon && plan?.planName !== "Pro";

            let isDisabled = false;
            let tooltipText = "";

            if (isProActive && planItem.name === "Pro") {
              isDisabled = true;
              tooltipText = "Pro Plan is already activated.";
            }
            if (isAddonPurchased) {
              isDisabled = true;
              tooltipText = "You’ve already purchased this add-on.";
            }

            return (
              <Card
                key={planItem.name}
                className={`relative hover:shadow-lg transition-shadow ${
                  planItem.popular ? "border-primary shadow-lg scale-105" : ""
                }`}
              >
                {planItem.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{planItem.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {planItem.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">
                      $
                      {isAnnual
                        ? Number(planItem?.price?.annual).toFixed(2)
                        : Number(planItem?.price?.monthly).toFixed(2)}
                    </span>

                    <span className="text-muted-foreground">/month</span>
                    {planItem.price.monthly === 0 ? (
                      <div className="text-sm text-muted-foreground mt-1">
                        No credit card required
                        <div>No bill</div>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-muted-foreground mt-1">
                          ($
                          {isAnnual
                            ? (planItem.price.annual * 12).toFixed(2)
                            : (planItem.price.monthly * 12).toFixed(2)}
                          /year)
                          {isAnnual && (
                            <span className="text-green-600 ml-1">
                              [Save $
                              {(
                                planItem.price.monthly * 12 -
                                planItem.price.annual * 12
                              ).toFixed(2)}
                              ]
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isAnnual ? "Billed annually" : "Billed monthly"}
                        </div>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            className={`w-full mb-6 ${
                              planItem.popular
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-primary hover:bg-primary/90"
                            }`}
                            onClick={() => {
                              if (!user) {
                                window.location.href = "/"; // or open a login modal if you prefer
                                return;
                              }
                              // === ONLY SHOW ALERT IF user does NOT have Pro and clicks an Add-on ===
                              const isAddon = planItem.name.startsWith("Add");
                              const userHasPro = plan?.planName === "Pro";

                              if (isAddon && !userHasPro) {
                                setShowAddonDialog(true); // show alert dialog
                                return;
                              }

                              // Free plan handling
                              if (planItem.name === "Free" && !user) {
                                window.location.href = "/";
                                return;
                              }

                              // Redirect to checkout for paid plans/add-ons
                              window.location.href = `/checkout?plan=${encodeURIComponent(
                                planItem.name
                              )}&price=${
                                isAnnual
                                  ? planItem.price.annual
                                  : planItem.price.monthly
                              }&billing=${isAnnual ? "annual" : "monthly"}`;
                            }}
                            // Disable only if add-on already purchased OR Free plan is already active
                            disabled={
                              isAddonPurchased ||
                              (planItem.name === "Free" && !!user)
                            }
                          >
                            {planItem.cta}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {tooltipText && (
                        <TooltipContent>
                          <p>{tooltipText}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <ul className="space-y-3">
                    {planItem.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* === NEW: Dialog === */}
        <AlertDialog open={showAddonDialog} onOpenChange={setShowAddonDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pro Plan Required</AlertDialogTitle>
              <AlertDialogDescription>
                Activate the Pro plan first before purchasing add-ons.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="bg-primary hover:bg-primary/90 text-primary-foreground ring-offset-background"
                onClick={() => setShowAddonDialog(false)}
              >
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Benefits Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Why choose our digital business cards?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Modern networking made simple and professional
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const IconComponent = {
                Palette,
                Share2,
                Radio,
                Smartphone,
                QrCode,
                UserPlus,
                Globe,
                Users,
              }[benefit.icon];

              return (
                <Card
                  key={index}
                  className="text-center p-6 bg-card hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            Ready to make your business card earn income?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of professionals already using digital business cards
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={() => (window.location.href = "/opportunities")}
          >
            Earnings Opportunities
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
