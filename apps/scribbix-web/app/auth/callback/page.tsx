"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreativeLoader } from "@/components/CreativeLoader";
import { saveAuthSession } from "@/lib/auth-session";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const userId = params.get("userId");
    const userName = params.get("name");

    window.history.replaceState(null, "", window.location.pathname);

    if (!token || !userId) {
      router.replace(
        "/signin?oauth_error=Social%20login%20could%20not%20be%20completed",
      );
      return;
    }

    saveAuthSession({ token, userId, userName: userName || "" });
    router.replace("/dashboard");
  }, [router]);

  return (
    <CreativeLoader
      title="Opening your workspace..."
      description="Finishing secure sign in."
    />
  );
}
