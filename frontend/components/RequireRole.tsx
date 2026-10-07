"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui";
import type { Role } from "@/lib/types";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !roles.includes(user.role)) router.replace("/");
  }, [loading, user, roles, router]);

  if (loading) return <Spinner label="Checking your session..." />;
  if (!user || !roles.includes(user.role)) return <Spinner label="Redirecting..." />;
  return <>{children}</>;
}
