"use client";

import { useState, useEffect, useContext, MouseEvent } from "react";
import { Menu, MenuItem, Typography } from "@mui/material";
import { LogOut, User, Home, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { CardDataContext } from "@/contexts/CardContext";

type HeaderProps = {
  onShowSignIn?: () => void;
};

const clearedCardData = {
  visibility: "private",
  theme: "#4299E1",
  profile: { cardName: "", profilePic: null },
  business: {
    first: "",
    last: "",
    accreditations: "",
    name: "",
    jobTitle: "",
    department: "",
    slogan: "",
    phone: "",
    email: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  },
  social: {
    linkedin: "",
    twitter: "",
    facebook: "",
    youtube: "",
    instagram: "",
    tiktok: "",
  },
  about: { aboutMe: "" },
  cta: {
    type: "booking",
    link: "",
    label: "",
    adsType: "product",
    adsImg: null,
  },
};

export default function Header({ onShowSignIn }: HeaderProps) {
  const { showToast } = useToast();
  const { user, logout, isLoading, isLoggedIn } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { setCardData } = useContext(CardDataContext);
  const router = useRouter();

  // useEffect(() => {
  //   setAnchorEl(null);
  // }, [user]);
  const handleMenuOpen = (event: MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    const { success, error } = await logout();
    if (success) {
      showToast("Logged out successfully!", "success");
      setCardData(clearedCardData);
    } else {
      showToast(error, "error");
    }
  };

  // if (isLoading) {
  //   return <div className="fixed top-4 right-4 z-50" />;
  // }
  if (user && isLoggedIn) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleMenuOpen}
          aria-controls="user-menu"
          aria-haspopup="true"
          aria-expanded={open ? "true" : "false"}
          aria-label="User menu"
          className="flex items-center gap-2 rounded-lg border border-gray-200/50 bg-white/30 px-3 py-2 text-black shadow-sm backdrop-blur-sm transition-colors hover:bg-white/40"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
            <User className="h-3 w-3" />
          </div>
          <span className="hidden text-sm font-medium text-gray-700 sm:block">
            {user.displayName}
          </span>
        </button>

        {/* Dropdown Menu */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            style: {
              backdropFilter: "blur(4px)",
              backgroundColor: "rgba(255,255,255,0.9)",
              border: "0.8px solid rgba(229,231,235,0.5)",
              borderRadius: "8px",
              width: "14rem",
              marginTop: "8px",
            },
          }}
        >
          <div className="border-b border-gray-200/50 px-4 py-2">
            <Typography className="truncate text-sm font-medium text-gray-900">
              {user.name}
            </Typography>
            <Typography className="truncate text-xs text-gray-500">
              {user.email}
            </Typography>
          </div>

          <MenuItem
            onClick={() => {
              router.push("/dashboard/settings");
              handleMenuClose();
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            <User size={16} /> Profile
          </MenuItem>

          <MenuItem
            onClick={() => {
              router.push("/dashboard");
              handleMenuClose();
            }}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
          >
            <Home size={16} /> Home Page
          </MenuItem>

          <div className="my-1 border-t border-gray-200" />

          <MenuItem
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} /> Sign Out
          </MenuItem>
        </Menu>
      </div>
    );
  }

  // ✅ When no user is logged in
  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={onShowSignIn}
        aria-label="Sign in"
        className="rounded-lg bg-blue-500/30 p-2 text-blue-700 backdrop-blur-sm transition hover:bg-blue-500/40"
      >
        <LogIn className="h-4 w-4" />
      </button>
    </div>
  );
}
