"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Trash, Eye, Download, Search } from "lucide-react";
import { db } from "@/services/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";
import { useToast } from "@/contexts/ToastContext";
import { Select } from "@/components/ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ref, listAll, deleteObject, getStorage } from "firebase/storage";

export default function UsersListing() {
  const [freeTrialPeriod, setFreeTrialPeriod] = useState(0);
  const storage = getStorage();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [parentData, setParentData] = useState(null);
  const [grandParentData, setGrandParentData] = useState(null);
  const [editUserData, setEditUserData] = useState({
    displayName: "",
    lastName: "",
    businessCategory: "",
    clientsPreference: "",
    l2Child: "",
    l3LeveledUps: "",
    l3Total: "",
    l4Multiplier: "",
    l4Total: "",
    l5Multiplier: "",
    l5Total: "",
    l6Multiplier: "",
    l6Total: "",
    freeTrialPeriod: "",
    companyName: "",
    childEarnings: "",
    grandchildEarnings: "",
    operatingCostRate: "",
    userChildEarning: "",
    userGrandChildEarning: "",
    status: "",
    role: "user", // default value
  });
  const { user } = useAuth();
  const usersPerPage = 10;
  const { showToast } = useToast();
  // New: Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const fetchDefaultUser = async () => {
    const q = query(
      collection(db, "users"),
      where("email", "==", "rob@solobizcards.com")
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() as any;
      return userData;
    }
    return null;
  };
  // Fetch users
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const d = docSnap.data() as any;
          const userId = docSnap.id;
          const referalRef = doc(db, "referrals", userId);
          const refSnap = await getDoc(referalRef);
          let childrenCount = 0;
          let grandchildrenCount = 0;
          let parentUser = { email: "", firstName: "", referralCode: "" };
          let grandParent = { email: "", firstName: "", referralCode: "" };
          if (refSnap.exists()) {
            const refData = refSnap.data();
            const children = refData.children || [];
            if (refData.parentUid) {
              const userRef = doc(db, "users", refData.parentUid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userInfo = userSnap.data() as any;
                setParentData({
                  email: userInfo.email,
                  referralCode: userInfo.referralCode,
                  firstName: userInfo.displayName,
                });
                parentUser.email = userInfo?.email ?? "";
                parentUser.referralCode = userInfo?.referralCode ?? "";
                parentUser.firstName = userInfo?.displayName ?? "";
                const grandParentRef = query(
                  collection(db, "referrals"),
                  where("referralCode", "==", userInfo.referralCode)
                );
                const grandRefSnap = await getDocs(grandParentRef);
                if (!grandRefSnap.empty) {
                  const granduserData = grandRefSnap.docs[0].data() as any;
                  if (granduserData.parentUid) {
                    const grandUserRef = doc(
                      db,
                      "users",
                      granduserData.parentUid
                    );
                    const grandUserSnap = await getDoc(grandUserRef);
                    if (grandUserSnap.exists()) {
                      const grandUserInfo = grandUserSnap.data() as any;
                      setGrandParentData({
                        email: grandUserInfo.email,
                        firstName: grandUserInfo.displayName,
                        referralCode: grandUserInfo.referralCode,
                      });
                      grandParent.email = grandUserInfo?.email ?? "";
                      grandParent.referralCode =
                        grandUserInfo?.referralCode ?? "";
                      grandParent.firstName = grandUserInfo?.displayName ?? "";
                    }
                  } else {
                    const defaultUser = await fetchDefaultUser();

                    if (defaultUser) {
                      setGrandParentData({
                        email: defaultUser.email,
                        referralCode: defaultUser.referralCode,
                        firstName: defaultUser.displayName,
                      });
                      grandParent.email = defaultUser?.email ?? "";
                      grandParent.firstName = defaultUser?.displayName ?? "";
                      grandParent.referralCode =
                        defaultUser?.referralCode ?? "";
                    }
                  }
                } else {
                  const defaultUser = await fetchDefaultUser();

                  if (defaultUser) {
                    setGrandParentData({
                      email: defaultUser.email,
                      firstName: defaultUser.displayName,
                      referralCode: defaultUser.referralCode,
                    });
                    grandParent.email = defaultUser?.email ?? "";
                    grandParent.firstName = defaultUser?.displayName ?? "";
                    grandParent.referralCode = defaultUser?.referralCode ?? "";
                  }
                }
              } else {
                const defaultUser = await fetchDefaultUser();

                if (defaultUser) {
                  setParentData({
                    email: defaultUser.email,
                    firstName: defaultUser.displayName,
                    referralCode: defaultUser.referralCode,
                  });
                  parentUser.email = defaultUser?.email ?? "";
                  parentUser.firstName = defaultUser?.displayName ?? "";
                  parentUser.referralCode = defaultUser?.referralCode ?? "";
                  setGrandParentData({
                    email: defaultUser.email,
                    firstName: defaultUser.displayName,
                    referralCode: defaultUser.referralCode,
                  });
                  grandParent.email = defaultUser?.email ?? "";
                  grandParent.firstName = defaultUser?.displayName ?? "";
                  grandParent.referralCode = defaultUser?.referralCode ?? "";
                }
              }

              const grandchildren = refData.grandchildren || [];

              childrenCount = children.length;
              grandchildrenCount = grandchildren.length;
            } else {
              const defaultUser = await fetchDefaultUser();

              if (defaultUser) {
                setParentData({
                  email: defaultUser.email,
                  firstName: defaultUser.displayName,
                  referralCode: defaultUser.referralCode,
                });
                parentUser.email = defaultUser?.email ?? "";
                parentUser.firstName = defaultUser?.displayName ?? "";
                parentUser.referralCode = defaultUser?.referralCode ?? "";
                setGrandParentData({
                  email: defaultUser.email,
                  firstName: defaultUser.displayName,
                  referralCode: defaultUser.referralCode,
                });
                grandParent.email = defaultUser?.email ?? "";
                grandParent.firstName = defaultUser?.displayName ?? "";
                grandParent.referralCode = defaultUser?.referralCode ?? "";
              }
            }
          }
          let childEarnings = d?.userChildEarning || 0;

          let grandchildEarnings = d?.userGrandChildEarning || 0;

          const settingsRef = doc(db, "settings", "ReferralEarningRate");
          const snap1 = await getDoc(settingsRef);
          if (snap1.exists()) {
            if (childEarnings === 0) {
              childEarnings = snap1.data().childEarnings;
            }
            if (grandchildEarnings === 0) {
              grandchildEarnings = snap1.data().grandchildEarnings;
            }
          }
          // Fetch latest card for this user
          const cardsRef = collection(db, "cards");
          const q = query(cardsRef, where("uid", "==", userId), limit(1));
          const cardSnap = await getDocs(q);
          let latestCard = null;
          cardSnap.forEach((cardDoc) => {
            const cd = cardDoc.data() as any;
            latestCard = { id: cd.metadata.id, name: cd.urlName };
          });
          return {
            id: userId,
            displayName: d.displayName || "",
            lastLogin: d.lastLogin || null,
            lastName: d.lastName || "",
            email: d.email || "",
            businessCategory: d.businessCategory || "",

            l2Child: Number(d.l2Child) || 0,
            l3LeveledUps: Number(d.l3LeveledUps) || 0,
            l4Multiplier: Number(d.l4Multiplier) || 0,
            l5Multiplier: Number(d.l5Multiplier) || 0,
            l6Multiplier: Number(d.l6Multiplier) || 0,

            // childEarnings: Number(d.childEarnings) || 0,
            // grandchildEarnings: Number(d.grandchildEarnings) || 0,
            operatingCostRate: Number(d.operatingCostRate) || 0,

            clientsPreference: d.clientsPreference || "",
            planType: d.planType || "",
            planName: d.planName || "",
            subscriptionStartDate: d.subscriptionStartDate || null,
            subscriptionEndDate: d.subscriptionEndDate || null,
            referralCode: d.referralCode || "",
            userChildEarning: childEarnings || 0,
            userGrandChildEarning: grandchildEarnings || 0,
            freeTrialPeriod: d?.freeTrialPeriod || 0,
            role: d.role || "User",
            companyName: d.companyName || "",
            status: d.status || "active",
            addons: d.addons || "",
            paymentId: d.paymentId || "",
            stripeCustomerId: d.stripeCustomerId || "",
            subscriptionId: d.subscriptionId || "",
            latestCardId: latestCard?.id ?? null,
            latestCardName: latestCard?.name ?? null,
            createdAt: d.createdAt || null, // add createdAt
            ipAddress: d.ipAddress,
            childrenCount: childrenCount,
            grandChildCount: grandchildrenCount,
            parentUser: parentUser,
            grandParent: grandParent,
          };
        })
      );
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  const settingsRef = doc(db, "settings", "PricingRequirement");

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setFreeTrialPeriod(data.freeTrialPeriod || 0);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user && users.length <= 0) {
      fetchUsers();
    }
  }, [user]);

  // Filter users by search
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // Sorting users
  const sortedUsers = React.useMemo(() => {
    if (!sortConfig) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // Convert Firestore Timestamp or string to Date
      const aDate = aValue?.toDate ? aValue.toDate() : new Date(aValue);
      const bDate = bValue?.toDate ? bValue.toDate() : new Date(bValue);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    });
  }, [filteredUsers, sortConfig]);

  // Sorting handler
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);

  // Edit user
  const handleEditUser = (user: any) => {
    console.log("dsvdsvdsvds");
    setSelectedUser(user);
    setEditUserData({
      displayName: user.displayName,
      lastName: user.lastName,
      businessCategory: user.businessCategory,
      clientsPreference: user.clientsPreference,
      companyName: user.companyName,
      status: user.status,
      userChildEarning: user.userChildEarning,
      userGrandChildEarning: user.userGrandChildEarning,
      freeTrialPeriod: user.freeTrialPeriod,
      role: user.role,
      l2Child: user.l2Child,
      l3LeveledUps: user.l3LeveledUps,
      l3Total: user.l3Total,
      l4Multiplier: user.l4Multiplier,
      l4Total: user.l4Total,
      l5Multiplier: user.l5Multiplier,
      l5Total: user.l5Total,
      l6Multiplier: user.l6Multiplier,
      l6Total: user.l6Total,
      childEarnings: user.childEarnings,
      grandchildEarnings: user.grandchildEarnings,
      operatingCostRate: user.operatingCostRate,
    });
    setIsEditDialogOpen(true);
  };

  const getLocationFromIP = async (ip: string) => {
    const accessToken = "9f9a0a0c6d2d36";
    try {
      const res = await fetch(
        `https://ipinfo.io/${ip}/json?token=${accessToken}`
      );
      const data = await res.json();
      if (data)
        return {
          ip: data.ip,
          latitude: data.loc ? Number(data.loc.split(",")[0]) : 0,
          longitude: data.loc ? Number(data.loc.split(",")[1]) : 0,
          state: data.region ?? null,
          country: data.country ?? null,
          city: data.city ?? null,
          ...data,
        };
      else {
        return {
          ip: 0,
          latitude: 0,
          longitude: 0,
          state: null,
          country: null,
          city: null,
          ...data,
        };
      }
    } catch (err) {
      console.error("Error fetching IP location:", err);
      return null;
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        ...editUserData,
        l2Child: Number(editUserData.l2Child),
        l3LeveledUps: Number(editUserData.l3LeveledUps),
        l4Multiplier: Number(editUserData.l4Multiplier),
        l5Multiplier: Number(editUserData.l5Multiplier),
        l6Multiplier: Number(editUserData.l6Multiplier),

        l3Total:
          Number(editUserData?.l3LeveledUps) * Number(editUserData?.l2Child),

        l4Total:
          Number(editUserData?.l3LeveledUps) *
          Number(editUserData?.l2Child) *
          Number(editUserData.l4Multiplier),

        l5Total:
          Number(editUserData?.l3LeveledUps) *
          Number(editUserData?.l2Child) *
          Number(editUserData.l5Multiplier),

        l6Total:
          Number(editUserData?.l3LeveledUps) *
          Number(editUserData?.l2Child) *
          Number(editUserData.l6Multiplier),

        childEarnings: Number(editUserData.childEarnings),
        grandchildEarnings: Number(editUserData.grandchildEarnings),
        operatingCostRate: Number(editUserData.operatingCostRate),
      });
      showToast("User details updated successfully.", "success");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  // Delete user
  // const handleDeleteUser = async (userId: string) => {
  //   if (!confirm("Are you sure you want to delete this user?")) return;
  //   try {
  //     await deleteDoc(doc(db, "users", userId));
  //     showToast("User deleted successfully.", "success");
  //     fetchUsers();
  //   } catch (err) {
  //     console.error("Error deleting user:", err);
  //   }
  // };

  async function deleteFolderRecursive(...folderRefs: any[]) {
    for (const folderRef of folderRefs) {
      const list = await listAll(folderRef);

      // Delete all files in this folder
      await Promise.all(list.items.map((fileRef) => deleteObject(fileRef)));

      // Recursively delete subfolders
      await Promise.all(
        list.prefixes.map((subFolderRef) => deleteFolderRecursive(subFolderRef))
      );
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      // 1️ Mark user as inactive
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        avatarUrl:"",
        status: "inactive",
        deletedAt: serverTimestamp(),
      });

      // 2Delete all cards in Firestore where uid = userId
      const cardsQuery = query(
        collection(db, "cards"),
        where("uid", "==", userId)
      );
      const querySnapshot = await getDocs(cardsQuery);
      const deleteCardPromises = querySnapshot.docs.map((cardDoc) =>
        deleteDoc(doc(db, "cards", cardDoc.id))
      );
      await Promise.all(deleteCardPromises);

      // 3️Delete all files in storage under cards/{userId}/ recursively
      const folderRef = ref(storage, `cards/${userId}/`);
      const userFolderRef = ref(storage, `avatars/${userId}/`);

      await deleteFolderRecursive(folderRef, userFolderRef);

      showToast(
        "User deactivated, cards deleted, and storage cleaned successfully.",
        "success"
      );
      fetchUsers(); // refresh list
    } catch (err) {
      console.error("Error deactivating user or deleting cards/storage:", err);
      showToast("Failed to deactivate user or delete cards/storage.", "error");
    }
  };

  // Toggle status
  const toggleStatus = async (user: any) => {
    try {
      const userRef = doc(db, "users", user.id);
      const newStatus = user.status === "active" ? "inactive" : "active";
      await updateDoc(userRef, { status: newStatus });
      showToast(`User status updated to ${newStatus}`, "success");
      fetchUsers();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // View user
  const handleViewUser = async (user: any) => {
    const userAddress = await getLocationFromIP(user.ipAddress);
    user.userAddress = userAddress;
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  // Export CSV
  const exportToCSV = (usersData: any[]) => {
    if (!usersData.length) return;

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Business Category",
      "Clients Preference",
      "Company",
      "Plan Type",
      "Plan Name",
      "Subscription Start Date",
      "Subscription End Date",
      "Referral Code",
      "Role",
      "Status",
      "stripeCustomerId",
      "paymentId",
      "subscriptionId",
    ];

    // Helper: format Firestore or normal date
    const formatDate = (value: any) => {
      if (!value) return "";
      let dateObj;

      // Firestore Timestamp (has seconds field)
      if (value.seconds) {
        dateObj = new Date(value.seconds * 1000);
      }
      // Firestore Timestamp object (has toDate method)
      else if (typeof value.toDate === "function") {
        dateObj = value.toDate();
      }
      // ISO string or date string
      else if (typeof value === "string" || value instanceof Date) {
        dateObj = new Date(value);
      } else {
        return "";
      }

      if (isNaN(dateObj.getTime())) return "";

      // Format date nicely e.g., 7th October 2025
      const day = dateObj.getDate();
      const month = dateObj.toLocaleString("default", { month: "long" });
      const year = dateObj.getFullYear();

      const suffix =
        day % 10 === 1 && day !== 11
          ? "st"
          : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

      return `${day}${suffix} ${month} ${year}`;
    };

    const csvRows = [
      headers.join(","),
      ...usersData.map((user) =>
        [
          user.displayName,
          user.lastName,
          user.email,
          user.businessCategory,
          user.clientsPreference,
          user.companyName,
          user.planType,
          user.planName,
          formatDate(user.subscriptionStartDate),
          formatDate(user.subscriptionEndDate),
          user.referralCode,
          user.role,
          user.status,
          user.stripeCustomerId,
          user.paymentId,
          user.subscriptionId,
        ]
          .map((v) => `"${v ?? ""}"`)
          .join(",")
      ),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function formatDate(dateValue) {
    if (!dateValue) return "-";

    let dateObj;

    // Handle Firestore Timestamp or ISO string
    if (dateValue?.toDate) {
      dateObj = dateValue.toDate(); // Firestore Timestamp
    } else if (typeof dateValue === "string" || typeof dateValue === "number") {
      dateObj = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      dateObj = dateValue;
    } else {
      return "-";
    }

    if (isNaN(dateObj.getTime())) return "-";

    // Format date: MM/DD/YYYY
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();

    // Format time: hh:mm AM/PM
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 to 12-hour format
    const formattedTime = `${String(hours).padStart(
      2,
      "0"
    )}:${minutes} ${ampm}`;

    return `${month}/${day}/${year} ${formattedTime}`;
  }

  // console.log("selectedUser", selectedUser);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight text-lg">
          Users Listing [{users.length}]
        </h2>

        <div className="flex gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Export CSV Button */}
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => exportToCSV(filteredUsers)}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table View */}
      <Card className="p-4 overflow-x-auto">
        {currentUsers.length === 0 ? (
          <div className="flex justify-center py-4">
            {" "}
            <div className="flex justify-center items-center py-6">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "displayName", label: "First Name" },
                  { key: "lastName", label: "Last Name" },
                  { key: "email", label: "Email" },
                  { key: "planType", label: "Plan Type" },
                  { key: "Cards", label: "Cards" },
                  { key: "referralCode", label: "Referral Code" },
                  { key: "role", label: "Role" },
                  { key: "status", label: "Status" },
                  { key: "createdAt", label: "createdAt" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="border p-2 text-left cursor-pointer"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1 select-none">
                      {col.label}
                      <span className="flex flex-col text-xs">
                        <span
                          className={
                            sortConfig?.key === col.key &&
                            sortConfig.direction === "asc"
                              ? "text-black"
                              : "text-gray-400"
                          }
                        >
                          ▲
                        </span>
                        <span
                          className={
                            sortConfig?.key === col.key &&
                            sortConfig.direction === "desc"
                              ? "text-black"
                              : "text-gray-400"
                          }
                        >
                          ▼
                        </span>
                      </span>
                    </div>
                  </th>
                ))}
                {/* <th className="border p-2 text-left">Created Date</th> */}
                {/* <th className="border p-2 text-center">Status</th> */}
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border p-2">{user.displayName}</td>
                  <td className="border p-2">{user.lastName}</td>
                  <td className="border p-2">{user.email}</td>

                  <td
                    className="border p-2"
                    style={{ textTransform: "capitalize" }}
                  >
                    {user.planType}
                  </td>
                  <td className="border p-2 text-primary underline">
                    {user.latestCardName ? (
                      <a
                        href={
                          process.env.NEXT_PUBLIC_API_LIVE_URL +
                          "card/" +
                          user.latestCardId +
                          "?selectedTab=favorites"
                        }
                      >
                        {user.latestCardName}
                      </a>
                    ) : (
                      "No Card"
                    )}
                  </td>
                  <td className="border p-2">{user.referralCode}</td>

                  <td
                    className="border p-2"
                    style={{ textTransform: "capitalize" }}
                  >
                    {user.role}
                  </td>
                  <td
                    className="border p-2 text-center"
                    style={{ textTransform: "capitalize" }}
                  >
                    <Badge
                      variant={
                        user.status === "active" ? "secondary" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="border p-2">
                    {" "}
                    {user.createdAt ? formatDate(user.createdAt) : "-"}
                  </td>
                  <td className="border p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {filteredUsers.length > usersPerPage && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {/* Page Numbers with Ellipsis */}
              {(() => {
                const pagesToShow = [];
                const maxVisible = 5; // max numbers to show (excluding first & last)
                const start = Math.max(2, currentPage - 1);
                const end = Math.min(totalPages - 1, currentPage + 1);

                pagesToShow.push(1); // Always show first page

                if (start > 2) {
                  pagesToShow.push("..."); // Left ellipsis
                }

                for (let i = start; i <= end; i++) {
                  pagesToShow.push(i);
                }

                if (end < totalPages - 1) {
                  pagesToShow.push("..."); // Right ellipsis
                }

                if (totalPages > 1) {
                  pagesToShow.push(totalPages); // Always show last page
                }

                return pagesToShow.map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <span className="px-3 py-1 text-gray-500">...</span>
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ));
              })()}

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <Label htmlFor="First-Name">First Name</Label>
              <Input
                className="mt-3"
                placeholder="First Name"
                value={editUserData.displayName}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    displayName: e.target.value,
                  })
                }
              />
            </div>

            {/* Last Name */}
            {/* <div>
              <Label htmlFor="Last-Name">Last Name</Label>
              <Input
                className="mt-3"
                placeholder="Last Name"
                value={editUserData.lastName}
                onChange={(e) =>
                  setEditUserData({ ...editUserData, lastName: e.target.value })
                }
              />
            </div> */}

            {/* Business Category */}
            {/* <div>
              <Label htmlFor="business-category">Business Category</Label>
              <Select
                value={editUserData.businessCategory}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, businessCategory: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Business Category" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "ARTS/MUSIC/WRITING",
                    "BANKING/FINANCE",
                    "BUSINESS MGT",
                    "COMMUNICATION",
                    "CONSTRUCTION",
                    "EDUCATION",
                    "ENGINEERING",
                    "ENTERTAINMENT",
                    "FARMING",
                    "GOV/POLITICS",
                    "HEALTHCARE",
                    "HOSPITALITY",
                    "IT/SOFTWARE",
                    "LEGAL",
                    "MANUFACTURING",
                    "MILITARY",
                    "NON-PROFIT",
                    "REAL ESTATE",
                    "RETAIL",
                    "SALES/MARKETING",
                    "SCIENCE/RESEARCH",
                    "SELF-EMPLOYED",
                    "STUDENT",
                    "TRANSPORTATION",
                    "RETIRED",
                    "OTHER",
                  ].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Clients Preference */}
            {/* <div>
              <Label htmlFor="Clients-Preference">Clients Preference</Label>
              <Select
                value={editUserData.clientsPreference}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, clientsPreference: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Clients Preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Clients</SelectItem>
                  <SelectItem value="non-local">Non-Local Clients</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Company Name */}
            {/* <div>
              <Label htmlFor="Company-Name">Company Name</Label>
              <Input
                className="mt-3"
                placeholder="Company Name"
                value={editUserData.companyName}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    companyName: e.target.value,
                  })
                }
              />
            </div> */}

            <div>
              <Label htmlFor="Company-Name">
                Child affiliate earnings after monetization
              </Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="Child Earning"
                value={editUserData.userChildEarning}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    userChildEarning: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">
                Grandchild affiliate earnings after monetization
              </Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="Grand-Child Earning"
                value={editUserData.userGrandChildEarning}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    userGrandChildEarning: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">
                Member's operating cost deduction rate
              </Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="operatingCostRate"
                value={editUserData.operatingCostRate}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    operatingCostRate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">L2 - # needed to Level-Up</Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="L2 - # needed to Level-Up"
                value={editUserData.l2Child}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    l2Child: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">
                L3 - # of L2s needed, Level-Ups
              </Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="L3 - # of L2s needed, Level-Ups"
                value={editUserData.l3LeveledUps}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    l3LeveledUps: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">L4 - L3 times</Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="L4 - L3 times"
                value={editUserData.l4Multiplier}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    l4Multiplier: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">L5 - L3 times</Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="L5 - L3 times "
                value={editUserData.l5Multiplier}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    l5Multiplier: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">L6 - L3 times</Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="L6 - L3 times"
                value={editUserData.l6Multiplier}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    l6Multiplier: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">Trial Periods</Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="L6 - L3 times"
                value={editUserData.freeTrialPeriod}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    freeTrialPeriod: e.target.value,
                  })
                }
              />
            </div>

            {/* <div>
              <Label htmlFor="Company-Name">
                Child affiliate earnings after monetization
              </Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="childEarnings"
                value={editUserData.childEarnings}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    childEarnings: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="Company-Name">
                Grandchild affiliate earnings after monetization
              </Label>
              <Input
                type="number"
                className="mt-3"
                placeholder="grandchildEarnings"
                value={editUserData.grandchildEarnings}
                onChange={(e) =>
                  setEditUserData({
                    ...editUserData,
                    grandchildEarnings: e.target.value,
                  })
                }
              />
            </div> */}

            {/* Status */}
            <div>
              <Label htmlFor="Status">Status</Label>
              <Select
                value={editUserData.status}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, status: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="Role">Role</Label>
              <Select
                value={editUserData.role}
                onValueChange={(value) =>
                  setEditUserData({ ...editUserData, role: value })
                }
              >
                <SelectTrigger className="mt-3">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            {selectedUser && selectedUser.lastLogin && (
              <h6>Last Login Date : {formatDate(selectedUser.lastLogin)}</h6>
            )}
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2 mt-2">
              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Personal Information:
                </h1>
                <p>
                  <strong>First Name :</strong> {selectedUser.displayName}
                </p>
                <p>
                  <strong>Last Name :</strong> {selectedUser.lastName}
                </p>
                <p>
                  <strong>Email :</strong> {selectedUser.email}
                </p>
              </div>

              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Business Information :
                </h1>
                <p>
                  <strong>Business Category :</strong>{" "}
                  {selectedUser.businessCategory}
                </p>
                <p>
                  <strong>Clients Preference :</strong>{" "}
                  {selectedUser.clientsPreference}
                </p>
                <p>
                  <strong>Company :</strong> {selectedUser.companyName}
                </p>
              </div>

              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Referrals Requirements:
                </h1>
                <p>
                  <strong>L2 - # needed to Level-Up :</strong>{" "}
                  {selectedUser.l2Child}
                </p>
                <p>
                  <strong>L3 - # of L2s needed, Level-Ups :</strong>{" "}
                  {selectedUser.l3LeveledUps}
                </p>
                <p>
                  <strong>L4 - L3 times :</strong> {selectedUser.l4Multiplier}
                </p>
                <p>
                  <strong>L5 - L3 times :</strong> {selectedUser.l5Multiplier}
                </p>
                <p>
                  <strong>L6 - L3 times :</strong> {selectedUser.l6Multiplier}
                </p>
              </div>

              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Referral Earning Rate:
                </h1>
                <p>
                  <strong>Child :</strong> {selectedUser.userChildEarning}%
                </p>
                <p>
                  <strong>Grandchild :</strong>{" "}
                  {selectedUser.userGrandChildEarning}%
                </p>
                <p>
                  <strong>Operating cost :</strong>{" "}
                  {selectedUser.operatingCostRate}%
                </p>
              </div>

              {selectedUser.planType === "free" && (
                <>
                  <div>
                    <h1 className="font-bold underline mt-5 mb-2">
                      Plans Information :
                    </h1>
                    <p>
                      <strong>Plan Type :</strong> {selectedUser.planType}
                    </p>
                    <p>
                      <strong>Trial Periods :</strong>{" "}
                      {selectedUser.freeTrialPeriod} days
                    </p>
                  </div>
                </>
              )}

              {selectedUser.planType === "paid" && (
                <>
                  <div>
                    <h1 className="font-bold underline mt-5 mb-2">
                      Subscription Information :
                    </h1>
                    <p>
                      <strong>Payment Id:</strong> {selectedUser.paymentId}
                    </p>
                    <p>
                      <strong>Subscription Id :</strong>{" "}
                      {selectedUser.subscriptionId}
                    </p>
                    <p>
                      <strong>Stripe Customer Id :</strong>{" "}
                      {selectedUser.stripeCustomerId}
                    </p>
                    <p>
                      <strong>Plan Type :</strong> {selectedUser.planType}
                    </p>
                    <p>
                      <strong>Plan Name :</strong> {selectedUser.planName}
                    </p>
                    <p>
                      <strong>Trial Periods :</strong> {freeTrialPeriod} days
                    </p>
                    <p>
                      <strong>Subscription Start Date :</strong>{" "}
                      {formatDate(selectedUser.subscriptionStartDate)}
                    </p>
                    <p>
                      <strong>Subscription End Date :</strong>{" "}
                      {formatDate(selectedUser.subscriptionEndDate)}
                    </p>

                    {selectedUser?.planName?.toLowerCase() !== "free plan" &&
                      Array.isArray(selectedUser.addons) &&
                      selectedUser.addons.length > 0 && (
                        <>
                          {selectedUser.addons.map((addon, index) => (
                            <div key={index}>
                              <p>
                                <strong>Addons :</strong> {addon.name}
                                {"("}
                                {addon.price
                                  ? `$${addon.price} / ${
                                      addon.billing === "annual"
                                        ? "Yearly"
                                        : "Monthly"
                                    }`
                                  : ""}
                                {")"}
                              </p>
                            </div>
                          ))}
                        </>
                      )}
                  </div>
                </>
              )}

              <div>
                <h1 className="font-bold underline mt-5 mb-2">
                  Others Information :
                </h1>
                {/* {selectedUser.userChildEarning && (
                  <p>
                    <strong>Child Earning :</strong>{" "}
                    {selectedUser.userChildEarning}%
                  </p>
                )}
                {selectedUser.userGrandChildEarning && (
                  <p>
                    <strong>Grand-Child Earning :</strong>{" "}
                    {selectedUser.userGrandChildEarning}%
                  </p>
                )} */}
                <p>
                  <strong>Referral Code :</strong> {selectedUser.referralCode}
                </p>
                <p>
                  <strong>Parent :</strong>{" "}
                  {selectedUser?.parentUser.email ?? "-"} {"("}
                  {selectedUser?.parentUser.referralCode ?? "-"}
                  {")"}
                </p>
                <p>
                  <strong>Grand Parent :</strong>{" "}
                  {selectedUser?.grandParent.email ?? "-"} {"("}
                  {selectedUser?.grandParent.referralCode ?? "-"}
                  {")"}
                </p>

                <p>
                  <strong>Role :</strong> {selectedUser.role}
                </p>
                <p>
                  <strong>Status :</strong> {selectedUser.status}
                </p>
                <p>
                  <strong>Created Date:</strong>{" "}
                  {selectedUser.createdAt
                    ? new Date(
                        selectedUser.createdAt.seconds * 1000
                      ).toLocaleString()
                    : "N/A"}
                </p>
                <p>
                  <strong>Location :</strong> {selectedUser?.userAddress?.state}{" "}
                  {selectedUser?.userAddress?.city}{" "}
                  {selectedUser?.userAddress?.country} (
                  {selectedUser?.ipAddress})
                  <p>
                    <strong>Created Date :</strong>{" "}
                    {selectedUser?.createdAt
                      ? formatDate(selectedUser?.createdAt)
                      : "-"}
                  </p>
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
