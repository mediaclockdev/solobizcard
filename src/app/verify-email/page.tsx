"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your email...");
  const { showToast } = useToast();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      verifyEmail(oobCode).then((res) => {
        if (res.success) {
          setStatus("✅ Email verified successfully! Redirecting to login...");
          setTimeout(() => router.replace("/"), 1000);

          
        } else {
          setStatus("❌ Verification failed: " + res.error);
        }
      });
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>{status}</p>
    </div>
  );
}
