"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import { X, Eye, EyeOff, Check, X as Cross } from "lucide-react";
import { auth, db } from "@/services/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  collection,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSignIn: () => void;
}

export default function SignUpModal({
  isOpen,
  onClose,
  onShowSignIn,
}: SignUpModalProps) {
  const [name, setName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [clientsPreference, setClientsPreference] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  const { showToast } = useToast();

  // Capture referral code from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      setReferralCode(ref);
    }
  }, []);

  const passwordChecks = {
    length: password.length >= 8,
    maxLength: password.length <= 15,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const passedRules = Object.values(passwordChecks).filter(Boolean).length;
  const progress = (passedRules / 5) * 100;
  const progressColor =
    passedRules <= 2
      ? "bg-red-500"
      : passedRules === 3
      ? "bg-yellow-500"
      : passedRules === 4
      ? "bg-blue-500"
      : "bg-green-600";

  const clearForm = () => {
    setName("");
    setBusinessCategory("");
    setClientsPreference("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  function generateReferralCode(name: string, uid: string) {
    const shortName = name.replace(/\s+/g, "").substring(0, 3).toUpperCase();
    const shortUid = uid.slice(-4).toUpperCase();
    return `${shortName}${shortUid}`;
  }

  const getIpAddress = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch (err) {
      console.error("IP fetch failed:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name) return showToast("Display name is required.", "error");
    if (!businessCategory)
      return showToast("Please select a business category.", "error");
    if (!clientsPreference)
      return showToast("Please select a Clients Preference.", "error");
    if (!email) return showToast("The email field is required.", "error");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return showToast(
        "The email field must be a valid email address.",
        "error"
      );

    if (!password) return showToast("Password field is required.", "error");
    if (!Object.values(passwordChecks).every(Boolean))
      return showToast("Password does not meet requirements", "error");

    setIsSubmitting(true);

    try {
      //  Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Vars
      let parentUid: string | null = null;
      let grandParentUid: string | null = null;
      const childIp = await getIpAddress();

      // Fetch MembershipLevel settings from Firestore
      const membershipSettingsRef = doc(
        db,
        "settings",
        "ReferralMembershipLevel"
      );
      const membershipSnap = await getDoc(membershipSettingsRef);

      let membershipData: any = {};
      if (membershipSnap.exists()) {
        const data = membershipSnap.data();
        membershipData = {
          l2Child: data.l2Child ?? null,
          l3LeveledUps: data.l3LeveledUps ?? null,
          l4Multiplier: data.l4Multiplier ?? null,
          l5Multiplier: data.l5Multiplier ?? null,
          l6Multiplier: data.l6Multiplier ?? null,
          l3Total: data.l3Total ?? null,
          l4Total: data.l4Total ?? null,
          l5Total: data.l5Total ?? null,
          l6Total: data.l6Total ?? null,
        };
      }

      // const earningSettingsRef = doc(db, "settings", "ReferralEarningRate");
      // const earningshipSnap = await getDoc(earningSettingsRef);

      // let earningshipData: any = {};
      // if (earningshipSnap.exists()) {
      //   const data = earningshipSnap.data();
      //   earningshipData = {
      //     childEarnings1: data.childEarnings ?? null,
      //     grandchildEarnings1: data.grandchildEarnings ?? null,
      //     operatingCostRate1: data.operatingCostRate ?? null,
      //   };
      // }

      if (referralCode) {
        const refeQuery = query(
          collection(db, "referrals"),
          where("referralCode", "==", referralCode)
        );
        const refeSnap = await getDocs(refeQuery);

        if (!refeSnap.empty) {
          const parentRefDoc = refeSnap.docs[0];
          const parentRefData = parentRefDoc.data();
          parentUid = parentRefData.uid;

          let childEarnings = 0;
          let grandchildEarnings = 0;
          let operatingCostRate = 0;

          const settingsRef = doc(db, "settings", "ReferralEarningRate");
          const pricingRequirement = doc(db, "settings", "PricingRequirement");

          const snapPricingRequirement = await getDoc(pricingRequirement);
          if (snapPricingRequirement.exists()) {
            operatingCostRate = snapPricingRequirement.data().proUpgradePerYear;
          }

          const snap1 = await getDoc(settingsRef);
          if (snap1.exists()) {
            childEarnings = snap1.data().childEarnings;
            grandchildEarnings = snap1.data().grandchildEarnings;
          }
          let childBalanceEarnings = parentRefData.childBalanceEarnings || {};
          let balanceEarnings = parentRefData.balanceEarnings || {};
          let earningsCost = parentRefData.earningsCost || {};

          const earningAmount =
            (Number(operatingCostRate) * Number(childEarnings)) / 100;

          // Create a clean object to avoid prototype pollution or undefined keys
          childBalanceEarnings = {
            ...childBalanceEarnings,
            [user.uid]: (childBalanceEarnings[user.uid] || 0) + earningAmount,
          };
          balanceEarnings = {
            ...balanceEarnings,
            [user.uid]: (balanceEarnings[user.uid] || 0) + earningAmount,
          };
          earningsCost = {
            ...earningsCost,
            [user.uid]: childEarnings,
          };
          await updateDoc(parentRefDoc.ref, {
            children: arrayUnion(user.uid),
            childrenIP: [...(parentRefData.childrenIP || []), childIp],
            childBalance:
              (parentRefData.childBalance || 0) +
              operatingCostRate * (childEarnings / 100),
            //   balanceEarnings,
            childBalanceEarnings,
            earningsCost,
            balance:
              (parentRefData.balance || 0) +
              operatingCostRate * (childEarnings / 100),
          });

          if (parentRefData.parentUid) {
            grandParentUid = parentRefData.parentUid;
            const gpRef = doc(db, "referrals", grandParentUid);
            const gpSnap = await getDoc(gpRef);

            if (gpSnap.exists()) {
              const gpData = gpSnap.data();
              let balanceEarnings = gpData.balanceEarnings || {};

              let earningsCost = gpData.earningsCost || {};

              let parentBalanceEarnings = gpData.parentBalanceEarnings || {};

              const earningAmount =
                (Number(operatingCostRate) * Number(grandchildEarnings)) / 100;

              // Create a clean object to avoid prototype pollution or undefined keys
              parentBalanceEarnings = {
                ...parentBalanceEarnings,
                [user.uid]:
                  (childBalanceEarnings[user.uid] || 0) + earningAmount,
              };
              balanceEarnings = {
                ...balanceEarnings,
                [user.uid]: (balanceEarnings[user.uid] || 0) + earningAmount,
              };
              earningsCost = {
                ...earningsCost,
                [user.uid]: grandchildEarnings,
              };

              await updateDoc(gpRef, {
                grandchildren: arrayUnion(user.uid),
                grandchildrenIP: arrayUnion(childIp),
                parentBalance:
                  (gpData.parentBalance || 0) +
                  operatingCostRate * (grandchildEarnings / 100),
                parentBalanceEarnings,
                //   balanceEarnings,
                earningsCost,
                balance:
                  (gpData.balance || 0) +
                  operatingCostRate * (grandchildEarnings / 100),
              });
            }
          }
        }
      }

      const earningSettingsRef = doc(db, "settings", "ReferralEarningRate");
      const earningshipSnap = await getDoc(earningSettingsRef);

      let earningshipData: any = {};
      if (earningshipSnap.exists()) {
        const data = earningshipSnap.data();

        earningshipData = {
          childEarnings1: data.childEarnings ?? 0,
          grandchildEarnings1: data.grandchildEarnings ?? 0,
          operatingCostRate1: data.operatingCostRate ?? 0,
        };
      } else {
        earningshipData = {
          childEarnings1: 0,
          grandchildEarnings1: 0,
          operatingCostRate1: 0,
        };
      }

      const trialSettingsRef = doc(db, "settings", "PricingRequirement");
      const trialshipSnap = await getDoc(trialSettingsRef);

      let trialhipData: any = {};
      if (trialshipSnap.exists()) {
        const data = trialshipSnap.data();

        trialhipData = {
          freeTrialPeriod: data.freeTrialPeriod ?? 0,
        };
      } else {
        trialhipData = {
          freeTrialPeriod: 0,
        };
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          userChildEarning: earningshipData.childEarnings1,
          userGrandChildEarning: earningshipData.grandchildEarnings1,
          operatingCostRate: earningshipData.operatingCostRate1,

          displayName: name,
          email,
          businessCategory,
          clientsPreference,
          role: "user",
          createdAt: new Date(),
          isVerify: false,
          isLoggedIn: false,
          planType: "free",
          referralCode: generateReferralCode(name, user.uid),
          referredBy: referralCode || null,
          ipAddress: childIp,
          status: "active",

          // Membership requirements
          l2Child: membershipData.l2Child ?? null,
          l3LeveledUps: membershipData.l3LeveledUps ?? null,
          l4Multiplier: membershipData.l4Multiplier ?? null,
          l5Multiplier: membershipData.l5Multiplier ?? null,
          l6Multiplier: membershipData.l6Multiplier ?? null,

          // Totals
          l3Total: membershipData.l3Total ?? null,
          l4Total: membershipData.l4Total ?? null,
          l5Total: membershipData.l5Total ?? null,
          l6Total: membershipData.l6Total ?? null,

          freeTrialPeriod: trialhipData.freeTrialPeriod,
        },
        { merge: true }
      );

      await setDoc(doc(db, "referrals", user.uid), {
        Level: 1,
        badgeLevel: 1,
        memberLevel: "Starter",
        uid: user.uid,
        parentUid,
        parents: parentUid ? [parentUid] : [],
        ipAddress: childIp,
        referralCode: generateReferralCode(name, user.uid),
        createdAt: serverTimestamp(),
        balance: 0,
        parentBalance: 0,
        childBalance: 0,
        children: [],
        childrenIP: [],
        grandchildren: [],
        grandchildrenIP: [],
      });

      await sendEmailVerification(user);
      showToast(
        "Account created successfully! Please check your email for verification before logging in.",
        "success"
      );
      onClose();
      clearForm();
    } catch (error: any) {
      console.error("Signup error:", error);
      showToast(error.message || "Signup failed. Try again.", "error");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-lg shadow-lg p-6 py-10 mx-4">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 transition-all duration-200 ease-in-out"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-7 text-center">
          Create your account
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Category <span className="text-red-500">*</span>
          </label>
          <select
            value={businessCategory}
            onChange={(e) => {
              setBusinessCategory(e.target.value);
              setClientsPreference("");
            }}
            className="w-full p-2 border border-gray-300 rounded mb-3"
          >
            <option value="">Select Category</option>
            <option value="ARTS/MUSIC/WRITING">Arts/Music/Writing</option>
            <option value="BANKING/FINANCE">Banking/Finance</option>
            <option value="BUSINESS MGT">Business Mgt</option>
            <option value="COMMUNICATION">Communication</option>
            <option value="CONSTRUCTION">Construction</option>
            <option value="EDUCATION">Education</option>
            <option value="ENGINEERING">Engineering</option>
            <option value="ENTERTAINMENT">Entertainment</option>
            <option value="FARMING">Farming</option>
            <option value="GOV/POLITICS">Gov/Politics</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="HOSPITALITY">Hospitality</option>
            <option value="IT/SOFTWARE">IT/Software</option>
            <option value="LEGAL">Legal</option>
            <option value="MANUFACTURING">Manufacturing</option>
            <option value="MILITARY">Military</option>
            <option value="NON-PROFIT">Non-Profit</option>
            <option value="REAL ESTATE">Real Estate</option>
            <option value="RETAIL">Retail</option>
            <option value="SALES/MARKETING">Sales/Marketing</option>
            <option value="SCIENCE/RESEARCH">Science/Research</option>
            <option value="SELF-EMPLOYED">Self-Employed</option>
            <option value="STUDENT">Student</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="RETIRED">Retired</option>
            <option value="OTHER">Other</option>
          </select>

          {businessCategory && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clients/Leads Preference <span className="text-red-500">*</span>
              </label>
              <select
                value={clientsPreference}
                onChange={(e) => setClientsPreference(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select Preference</option>
                <option value="local">Local Clients</option>
                <option value="non-local">Non-Local Clients</option>
                <option value="both">Both</option>
              </select>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="you@example.com"
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full p-2 border border-gray-300 rounded pr-10 mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={15}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded h-2 mb-2">
                <div
                  className={`h-2 rounded ${progressColor} transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="text-sm space-y-1">
                {Object.entries(passwordChecks).map(([key, passed]) => (
                  <li
                    key={key}
                    className={`flex items-center ${
                      passed ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {passed ? (
                      <Check className="w-4 h-4 mr-1" />
                    ) : (
                      <Cross className="w-4 h-4 mr-1" />
                    )}
                    {key === "length" && "Minimum 8 characters"}
                    {key === "maxLength" && "Maximum 15 characters"}
                    {key === "lowercase" && "At least 1 lowercase letter"}
                    {key === "uppercase" && "At least 1 uppercase letter"}
                    {key === "number" && "At least 1 number"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <button
            onClick={() => {
              onClose();
              clearForm();
              onShowSignIn();
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
