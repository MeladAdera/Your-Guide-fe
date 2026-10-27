"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api";

export function LogoutButton(props: Omit<ComponentProps<typeof Button>, "onClick">) {
  const t = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: authApi.logout,
    // 204 always, even with a stale cookie: whatever happened, the person is out.
    onSettled: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });
  return (
    <Button type="button" variant="ghost" {...props} onClick={() => logout.mutate()} disabled={logout.isPending}>
      <LogOut aria-hidden />
      {t("logout")}
    </Button>
  );
}
