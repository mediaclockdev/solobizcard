"use client";

import { deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import imageCompression from "browser-image-compression";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check,
  CreditCard,
  Mail,
  User,
  Camera,
  Building2,
  Calendar,
  Crown,
  Shield,
  Clock,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  ref as storageRef,
} from "firebase/storage";
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { Eye, EyeOff, X as Cross } from "lucide-react";
import Link from "next/link";
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

export default function Settings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  //const [searchParams, setSearchParams] = useSearchParams();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { user, isLoading: authLoading } = useAuth();
  const tabFromParams = searchParams.get("tab");
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  // Set default tab based on URL parameter if present
  const currentTab =
    tabFromParams === "subscriptions" ||
    tabFromParams === "appearance" ||
    tabFromParams === "notifications"
      ? tabFromParams
      : "account";
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value === "account") {
      newParams.delete("tab");
    } else {
      newParams.set("tab", value);
    }

    router.push(`?${newParams.toString()}`);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setIsLoading(true);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();

      // Delete previous avatar if exists
      if (data?.avatarUrl) {
        const oldRef = ref(getStorage(), data.avatarUrl);
        await deleteObject(oldRef).catch((err) => {
          console.warn("Old avatar not found or already deleted", err);
        });
      }

      // Compress to target <= 25KB
      let compressedFile = file;
      let options = {
        maxSizeMB: 0.025, // target ~25KB
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };

      compressedFile = await imageCompression(file, options);

      // If still above 25KB, recompress
      let iteration = 0;
      while (compressedFile.size > 25 * 1024 && iteration < 3) {
        options.maxSizeMB *= 0.8; // slightly reduce quality
        compressedFile = await imageCompression(compressedFile, options);
        iteration++;
      }

      // Upload to Firebase Storage
      const storage = getStorage();
      const fileRef = ref(
        storage,
        `avatars/${user.uid}/${compressedFile.name}`
      );
      await uploadBytes(fileRef, compressedFile);

      const downloadURL = await getDownloadURL(fileRef);
      setAvatarUrl(downloadURL);

      // Update Firestore
      await updateDoc(userRef, { avatarUrl: downloadURL });

      showToast("Avatar updated successfully", "success");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast("Failed to upload avatar", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleAvatarUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file || !user?.uid) return;

  //   try {
  //     setIsLoading(true);
  //     const userRef = doc(db, "users", user.uid);
  //     const userSnap = await getDoc(userRef);
  //     const data = userSnap.data();

  //     // Delete previous avatar if exists
  //     if (data?.avatarUrl) {
  //       const oldRef = ref(getStorage(), data.avatarUrl);
  //       await deleteObject(oldRef).catch((err) => {
  //         console.warn("Old avatar not found or already deleted", err);
  //       });
  //     }

  //     // Compress new avatar (~50KB)
  //     const options = {
  //       maxSizeMB: 0.05,
  //       maxWidthOrHeight: 500,
  //       useWebWorker: true,
  //     };
  //     const compressedFile = await imageCompression(file, options);

  //     const storage = getStorage();
  //     const fileRef = ref(
  //       storage,
  //       `avatars/${user.uid}/${compressedFile.name}`
  //     );
  //     await uploadBytes(fileRef, compressedFile);

  //     const downloadURL = await getDownloadURL(fileRef);
  //     setAvatarUrl(downloadURL);

  //     // Update Firestore
  //     await updateDoc(userRef, { avatarUrl: downloadURL });

  //     showToast("Avatar updated successfully", "success");
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error("Error uploading avatar:", error);
  //     showToast("Failed to upload avatar", "error");
  //   }
  // };

  const handleAvatarDelete = async () => {
    if (!user?.uid || !avatarUrl) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const storageReference = ref(getStorage(), avatarUrl);

      // Delete from Storage
      await deleteObject(storageReference);

      // Remove from Firestore
      await updateDoc(userRef, { avatarUrl: "" });
      setAvatarUrl("");

      showToast("Avatar deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting avatar:", error);
      showToast("Failed to delete avatar", "error");
    }
  };

  const createdAt = user?.metadata?.creationTime ?? new Date();
  const date = new Date(createdAt);

  const options = { day: "2-digit", month: "short", year: "numeric" };
  //@ts-ignore
  let formatted = date.toLocaleDateString("en-GB", options);

  // Add suffix for day (st, nd, rd, th)
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  formatted = formatted.replace(/^\d+/, `${day}${suffix}`);

  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [clientsPreference, setClientsPreference] = useState(
    user?.clientsPreference ?? ""
  );
  const [businessCategory, setBusinessCategory] = useState(
    user?.businessCategory ?? ""
  );

  const [planDuration, setPlanDuration] = useState(null);
  const [planName, setPlanName] = useState(null);
  const [planPrice, setPlanPrice] = useState(null);
  const [planStartDate, setPlanStartDate] = useState(null);
  const [planEndDate, setPlanEndDate] = useState(null);
  const [isPast, setIsPast] = useState(false);
  const [addons, setAddons] = useState([]);
  const [initials, setInitials] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide password
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const passwordChecks = {
    length: newPassword.length >= 8,
    maxLength: newPassword.length <= 15,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const [plan, setPlan] = useState<any>(null);
  const [subscriptionData, setsubscriptionData] = useState<any>(null);

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

  const { showToast } = useToast();

  const handleSavePersonalInfo = async () => {
    if (!user?.uid) return;
    try {
      if (!displayName || displayName.trim() === "") {
        showToast("First Name is required", "error");
        return;
      }

      if (!lastName || lastName.trim() === "") {
        showToast("Last Name is required", "error");
        return;
      }
      setIsLoading(true);
      let avatarDownloadURL = avatarUrl;

      const fileInput = document.getElementById(
        "avatar-upload"
      ) as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        avatarDownloadURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "users", user.uid), {
        lastName,
        displayName,
        bio,
        email: user.email,
        companyName,
        clientsPreference,
        businessCategory,
        avatarUrl: avatarDownloadURL,
      });

      setAvatarUrl(avatarDownloadURL);
      showToast("Info saved successfully", "success");
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving personal info:", error);
      showToast("Error saving personal info", "error");
    }
  };

  const handleChangePassword = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const passwordChecks = {
      length: newPassword.length >= 8,
      maxLength: newPassword.length <= 15,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    };

    const allRulesPassed = Object.values(passwordChecks).every(Boolean);

    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match", "error");
      return;
    }

    if (!allRulesPassed) {
      showToast(
        "Password must have: 1 uppercase, 1 lowercase, 1 number, 8-15 characters",
        "error"
      );
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      await updatePassword(currentUser, newPassword);
      const { success, error } = await logout();
      if (success) {
        const userRef = doc(db, "users", currentUser.uid);
        updateDoc(userRef, { isLoggedIn: false });
        showToast("Password updated successfully", "success");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.replace("/");
      }
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === "auth/wrong-password") {
        showToast("Current password is incorrect", "error");
      } else if (error.code === "auth/requires-recent-login") {
        showToast("Please logout and login again to update password", "error");
      } else {
        showToast("Failed to update password", "error");
      }
    }
  };

  const [freeTrialPeriod, setFreeTrialPeriod] = useState<number>(0);
  const [remainingDays, setRemainingDays] = useState<number>(0);

  useEffect(() => {
    const pricingRequirementSettings = async () => {
      try {
        const settingsRef = doc(db, "users", user?.uid);
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) return;

        const settingsData = settingsSnap.data();
        const trialDays = settingsData.freeTrialPeriod ?? 0;
        setFreeTrialPeriod(trialDays);

        // Get user's account creation date
        const createdAt = user?.metadata?.creationTime
          ? new Date(user.metadata.creationTime)
          : new Date();

        // Calculate days since account creation
        const now = new Date();
        const diffTime = now.getTime() - createdAt.getTime();
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Calculate remaining trial days
        const remaining = Math.max(trialDays - daysPassed, 0);
        setRemainingDays(remaining);
      } catch (error) {
        console.error("Error fetching pricing settings:", error);
      }
    };

    if (user) pricingRequirementSettings();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        console.log("data", data);
        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
        setPaymentId(data.paymentId);
        setLastName(data.lastName || "");
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setCompanyName(data.companyName || "");
        setClientsPreference(data.clientsPreference || "");
        setBusinessCategory(data.businessCategory || "");
        setAddons(data.addons);
        setIsLoading(false);

        // ✅ Create initials from displayName + lastName
        const firstName = data.displayName || "";
        const lastName = data.lastName || "";
        const initials =
          (firstName.charAt(0) || "").toUpperCase() +
          (lastName.charAt(0) || "").toUpperCase();
        setInitials(initials);
      }
    };

    fetchUserData();
  }, [authLoading]);

  useEffect(() => {
    async function fetchPlan() {
      setLoading(true); // start loader
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        body: JSON.stringify({ userId: user?.uid, action: "get" }),
      });
      const data = await res.json();

      setPaymentMethod(data.paymentMethod);
      setPlan(data);
      setLoading(false); // start loader
    }

    async function getUserSubscriptions() {
      try {
        const subsRef = collection(db, "subscriptions");
        const q = query(subsRef, where("userId", "==", user?.uid));
        const querySnapshot = await getDocs(q);
        const subscriptions = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setsubscriptionData(subscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return [];
      }
    }
    if (user && !plan) {
      fetchPlan();
    }
    if (user && !subscriptionData) {
      getUserSubscriptions();
    }
  }, [user]);

  const formatDateWithOrdinal = (dateString) => {
    const date = new Date(dateString);

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    const getOrdinal = (n) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
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

    return `${day}${getOrdinal(day)} ${month} ${year}`;
  };

  const startDate = formatDateWithOrdinal(plan?.startDate);
  const endDate = formatDateWithOrdinal(plan?.endDate);

  // const subscriptionStartDate = user?.subscriptionStartDate
  //   ? new Date(user.subscriptionStartDate)
  //   : null;

  // const isWithin30Days = subscriptionStartDate
  //   ? (new Date().getTime() - subscriptionStartDate.getTime()) /
  //       (1000 * 60 * 60 * 24) <=
  //     30
  //   : false;

  const subscriptionStartDate = user?.subscriptionStartDate
    ? new Date(user.subscriptionStartDate)
    : null;

  const isWithin30Days = subscriptionStartDate
    ? (new Date().getTime() - subscriptionStartDate.getTime()) /
        (1000 * 60 * 60 * 24) <=
      30
    : false;

  console.log("isWithin30Days", isWithin30Days);

  useEffect(() => {
    if (!planEndDate) return;
    const endDate = planEndDate.toDate
      ? planEndDate.toDate()
      : new Date(planEndDate);
    if (endDate < new Date()) {
      setIsPast(true);
    }
  }, [planEndDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[400px]">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="account" className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Profile
                </CardTitle>
                <CardDescription>
                  Manage your profile information and account settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      {/* Upload Icon */}
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-3 w-3" />
                      </label>

                      {/* Delete Icon */}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                        >
                          <Cross className="h-3 w-3" />
                        </button>
                      )}

                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                    >
                      Change Photo
                    </Button>
                  </div>

                  {/* Account Info */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Member Since
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatted}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Account Status
                      </Label>
                      <Badge variant="secondary" className="w-fit">
                        <Shield className="h-3 w-3 mr-1" />
                        {user
                          ? user.status.charAt(0).toUpperCase() +
                            user.status.slice(1)
                          : null}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Account Type:
                        </Label>

                        <Badge
                          variant="outline"
                          className="w-fit text-green-600 border-green-200"
                        >
                          {user ? (
                            user?.planType === "free" ? (
                              <>Free plan</>
                            ) : user.planType === "paid" ? (
                              <>Paid plan</>
                            ) : (
                              <>Local</>
                            )
                          ) : null}
                        </Badge>
                        {user && user?.planType === "free" && (
                          <Badge
                            variant="outline"
                            className="w-fit text-green-600 border-green-200"
                          >
                            {freeTrialPeriod} day PRO Trial
                          </Badge>
                        )}

                        {user?.planType === "free" && (
                          <Badge
                            variant="outline"
                            className="w-fit text-green-600 border-green-200"
                          >
                            {remainingDays > 0 ? (
                              <>{remainingDays} days left</>
                            ) : (
                              <>Trial expired</>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* <Label className="text-sm font-medium text-muted-foreground">
                        Billing Status
                      </Label>
                      <Badge
                        variant="outline"
                        className="w-fit text-green-600 border-green-200"
                      >
                        Active
                      </Badge> */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="display-name"
                      defaultValue={user?.displayName ?? ""}
                      placeholder="Enter your display name"
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last-name">
                      Last name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last-name"
                      placeholder="Enter your last name"
                      defaultValue={user?.lastName ?? ""}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user?.email || ""} readOnly />
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Write a short bio about yourself"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div> */}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                {/* <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button> */}
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSavePersonalInfo}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Manage your business details and preferences.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    placeholder="Enter your company name"
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-category">Business Category</Label>
                  <Select
                    value={businessCategory}
                    onValueChange={setBusinessCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARTS/MUSIC/WRITING">
                        ARTS/MUSIC/WRITING
                      </SelectItem>
                      <SelectItem value="BANKING/FINANCE">
                        BANKING/FINANCE
                      </SelectItem>
                      <SelectItem value="BUSINESS MGT">BUSINESS MGT</SelectItem>
                      <SelectItem value="COMMUNICATION">
                        COMMUNICATION
                      </SelectItem>
                      <SelectItem value="CONSTRUCTION">CONSTRUCTION</SelectItem>
                      <SelectItem value="EDUCATION">EDUCATION</SelectItem>
                      <SelectItem value="ENGINEERING">Engineering</SelectItem>
                      <SelectItem value="ENTERTAINMENT">
                        ENTERTAINMENT
                      </SelectItem>
                      <SelectItem value="FARMING">FARMING</SelectItem>
                      <SelectItem value="GOV/POLITICS">GOV/POLITICS</SelectItem>
                      <SelectItem value="HEALTHCARE">HEALTHCARE</SelectItem>
                      <SelectItem value="HOSPITALITY">HOSPITALITY</SelectItem>
                      <SelectItem value="IT/SOFTWARE">IT/SOFTWARE</SelectItem>
                      <SelectItem value="LEGAL">LEGAL</SelectItem>
                      <SelectItem value="MANUFACTURING">
                        MANUFACTURING
                      </SelectItem>
                      <SelectItem value="MILITARY">MILITARY</SelectItem>
                      <SelectItem value="NON-PROFIT">NON-PROFIT</SelectItem>
                      <SelectItem value="REAL ESTATE">REAL ESTATE</SelectItem>
                      <SelectItem value="RETAIL">RETAIL</SelectItem>
                      <SelectItem value="SALES/MARKETING">
                        SALES/MARKETING
                      </SelectItem>
                      <SelectItem value="SCIENCE/RESEARCH">
                        SCIENCE/RESEARCH
                      </SelectItem>
                      <SelectItem value="SELF-EMPLOYED">
                        SELF-EMPLOYED
                      </SelectItem>
                      <SelectItem value="STUDENT">STUDENT</SelectItem>
                      <SelectItem value="TRANSPORTATION">
                        TRANSPORTATION
                      </SelectItem>
                      <SelectItem value="RETIRED">RETIRED</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leads-preference">Leads Preference</Label>
                  {user && (
                    <RadioGroup
                      value={clientsPreference}
                      onValueChange={setClientsPreference}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="all-leads" />
                        <Label htmlFor="all-leads">Accept all leads</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local" id="filtered-leads" />
                        <Label htmlFor="filtered-leads">Local leads</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non-local" id="no-leads" />
                        <Label htmlFor="no-leads">Non-Local leads</Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                {/* <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button> */}
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSavePersonalInfo}
                >
                  Save changes
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password associated with your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2 relative">
                  <Label htmlFor="current">Current password</Label>
                  <Input
                    id="current"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    placeholder="Enter your current password"
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-9 text-gray-500"
                    onClick={() => setShowCurrent((prev) => !prev)}
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* New Password */}
                <div className="space-y-2 relative">
                  <Label htmlFor="new">New password</Label>
                  <Input
                    id="new"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    placeholder="Enter your new password"
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-9 text-gray-500"
                    onClick={() => setShowNew((prev) => !prev)}
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2 relative">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    placeholder="Enter your confirm password"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-9 text-gray-500"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div>
                    <div className="w-full bg-gray-200 rounded h-2 mb-2">
                      <div
                        className={`h-2 rounded ${progressColor} transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <ul className="text-sm space-y-1">
                      <li
                        className={`flex items-center ${
                          passwordChecks.length
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.length ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        Minimum 8 characters
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.maxLength
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.maxLength ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        Maximum 15 characters
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.lowercase
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.lowercase ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        At least 1 lowercase
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.uppercase
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.uppercase ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        At least 1 uppercase
                      </li>
                      <li
                        className={`flex items-center ${
                          passwordChecks.number
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {passwordChecks.number ? (
                          <Check className="w-4 h-4 mr-1" />
                        ) : (
                          <Cross className="w-4 h-4 mr-1" />
                        )}
                        At least 1 number
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {/* <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button> */}
                <Button onClick={handleChangePassword}>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Subscription Plans */}
              <div className="lg:col-span-2 space-y-4">
                {/* FREE Plan */}
                {user?.planType === "free" ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <h3 className="font-semibold">
                              FREE!! - SoloBizCards Membership
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              No Billing
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link href="/pricing" passHref>
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              Upgrade
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : user?.planType === "paid" && !isPast ? (
                  // Current active paid plan
                  <Card>
                    <CardContent className="p-6">
                      {loading ? (
                        <div className="flex justify-center items-center py-6">
                          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-6 w-6 text-muted-foreground" />
                              <div>
                                <h3 className="font-semibold">
                                  PAID!! - SoloBizCards PRO Membership
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Pro Upgrade + Lead Billing History
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {plan?.status === "trialing" ? (
                                    <p>
                                      Trial Period: {startDate} - {endDate}
                                      <br />
                                      <b>
                                        Note: The subscription will start once
                                        the trial period is completed.
                                      </b>
                                    </p>
                                  ) : (
                                    <p>
                                      Subscription Period: {startDate} -{" "}
                                      {endDate}
                                    </p>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 border-green-200"
                              >
                                Current
                              </Badge>

                              {plan?.subscription
                                ?.canceledAtPeriodEnd ? null : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {!isWithin30Days
                                          ? "Cancel Subscription?"
                                          : "Cannot Cancel Subscription"}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {!isWithin30Days
                                          ? "Are you sure you want to cancel this subscription? You’ll still have access until the end of the billing period."
                                          : "You cannot cancel the subscription because 30 days have passed since your plan started."}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Close
                                      </AlertDialogCancel>
                                      {!isWithin30Days && (
                                        <AlertDialogAction
                                          onClick={async () => {
                                            try {
                                              const res = await fetch(
                                                "/api/create-subscription",
                                                {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type":
                                                      "application/json",
                                                  },
                                                  body: JSON.stringify({
                                                    userId: user.uid,
                                                    action: "cancel",
                                                  }),
                                                }
                                              );
                                              const data = await res.json();
                                              if (data.error)
                                                throw new Error(data.error);
                                              showToast(
                                                data.message ||
                                                  "Subscription canceled successfully!",
                                                "success"
                                              );
                                            } catch (err: any) {
                                              alert(
                                                err.message ||
                                                  "Failed to cancel subscription"
                                              );
                                            }
                                          }}
                                        >
                                          Yes, Cancel
                                        </AlertDialogAction>
                                      )}
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  // Past/expired subscription
                  isPast && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-6 w-6 text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold">
                                PAID!! - SoloBizCards PRO Membership
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Pro Upgrade, No Billing
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="destructive"
                              className="bg-red-100 text-red-700 border-red-200"
                            >
                              Past Due
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    "/api/create-subscription",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        userId: user.uid,
                                        action: "renew",
                                      }),
                                    }
                                  );
                                  const data = await res.json();
                                  if (data.error) throw new Error(data.error);
                                  alert(
                                    data.message ||
                                      "Subscription renewed successfully!"
                                  );
                                  window.location.reload();
                                } catch (err: any) {
                                  alert(
                                    err.message ||
                                      "Failed to renew subscription"
                                  );
                                }
                              }}
                            >
                              Renew
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>

              {/* Right Column - Account Details */}
              <div className="space-y-4">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="pb-3">
                          <h3 className="font-semibold">
                            {plan?.planName ? plan.planName : "Free Plan"}
                          </h3>

                          <p className="text-sm text-muted-foreground">
                            {plan?.billing === "year" ? (
                              <>${plan?.price} / Yearly</>
                            ) : plan?.billing === "month" ? (
                              <>${plan?.price} / Monthly</>
                            ) : (
                              <></>
                            )}
                          </p>

                          {/* Show addons only if plan is not free */}
                          {plan?.planName?.toLowerCase() !== "free plan" &&
                            Array.isArray(addons) &&
                            addons.length > 0 && (
                              <>
                                {addons.map((addon, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2"
                                  >
                                    <div>
                                      <h3 className="font-semibold">
                                        {addon.name}
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        {addon.price
                                          ? `$${addon.price} / ${
                                              addon.billing === "annual"
                                                ? "Yearly"
                                                : "Monthly"
                                            }`
                                          : ""}
                                      </p>
                                    </div>

                                    {/* Cancel Addon Button with AlertDialog */}
                                    {/* Cancel Addon Button with AlertDialog */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          Cancel
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            {!isWithin30Days
                                              ? `Cancel Addon?`
                                              : `Cannot Cancel Addon`}
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {!isWithin30Days
                                              ? `Are you sure you want to cancel the addon "${addon.name}"? You’ll still have access until the end of the billing period.`
                                              : `You cannot cancel the addon "${addon.name}" because 30 days have passed since it was added.`}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Close
                                          </AlertDialogCancel>
                                          {!isWithin30Days && (
                                            <AlertDialogAction
                                              onClick={async () => {
                                                if (!addon.subscriptionId)
                                                  return;
                                                setIsLoading(true);
                                                try {
                                                  const res = await fetch(
                                                    "/api/create-subscription",
                                                    {
                                                      method: "POST",
                                                      headers: {
                                                        "Content-Type":
                                                          "application/json",
                                                      },
                                                      body: JSON.stringify({
                                                        userId: user.uid,
                                                        action: "cancel-addon",
                                                        addonSubscriptionId:
                                                          addon.subscriptionId,
                                                      }),
                                                    }
                                                  );
                                                  const data = await res.json();
                                                  if (data.error)
                                                    throw new Error(data.error);
                                                  setIsLoading(false);
                                                  showToast(
                                                    data.message ||
                                                      "Addon canceled successfully!",
                                                    "success"
                                                  );
                                                  window.location.reload();
                                                } catch (err: any) {
                                                  setIsLoading(false);
                                                  alert(
                                                    err.message ||
                                                      "Failed to cancel addon"
                                                  );
                                                }
                                              }}
                                            >
                                              Yes, Cancel
                                            </AlertDialogAction>
                                          )}
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                ))}
                              </>
                            )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className={`w-full ${
                            user?.planType !== "free" &&
                            user?.subscriptionEndDate?.toDate() > new Date()
                              ? "cursor-not-allowed"
                              : ""
                          }`}
                          onClick={async () => {
                            if (user?.planType === "free") {
                              window.location.href = "/pricing";
                              return;
                            }
                          }}
                        >
                          Change Plan
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                    <CardDescription>
                      Manage your payment details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {paymentMethod?.card?.brand} ending in{" "}
                              {paymentMethod?.card?.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {paymentMethod?.card?.exp_month}/
                              {paymentMethod?.card?.exp_year}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 h-auto text-primary"
                        >
                          Manage
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Billing History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Billing History</CardTitle>
                    <CardDescription>Recent payments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loading ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        {plan?.status === "trialing" ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {startDate}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  $0.00
                                </p>
                              </div>
                            </div>
                            <a href={plan?.invoicePdf} download>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        ) : subscriptionData && subscriptionData.length > 0 ? (
                          subscriptionData.map((sub) => {
                            const startDate = sub.startDate?.seconds
                              ? new Date(sub.startDate.seconds * 1000)
                              : null;

                            const formatDate = (date) => {
                              if (!date) return "N/A";
                              const day = date.getDate();
                              const month = date.toLocaleString("default", {
                                month: "long",
                              });
                              const year = date.getFullYear();

                              const ordinal = (n) => {
                                if (n > 3 && n < 21) return "th";
                                switch (n % 10) {
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

                              return `${day}${ordinal(day)} ${month} ${year}`;
                            };

                            return (
                              <div
                                key={sub.subscriptionId}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">
                                      {formatDate(startDate)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      ${sub.planPrice}
                                    </p>
                                  </div>
                                </div>
                                <a href={sub.invoicePdf} download>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </a>
                              </div>
                            );
                          })
                        ) : (
                          <p>No billing history.</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the appearance of the app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme">Dark Mode</Label>
                    <Switch id="theme" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Turn on dark mode to reduce eye strain and save battery.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="density">Compact Mode</Label>
                    <Switch id="density" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Make the UI more compact to fit more content on the screen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you want to be notified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="email-notifs">Email Notifications</Label>
                    </div>
                    <Switch id="email-notifs" defaultChecked />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <Label htmlFor="order-updates">Order Updates</Label>
                    </div>
                    <Switch id="order-updates" defaultChecked />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your orders.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Label htmlFor="marketing">Marketing emails</Label>
                    </div>
                    <Switch id="marketing" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about new products and features.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Save preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
