"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/lib/api/types";

const UserContext = createContext<User | null>(null);

/** The logged-in user, known server-side by the app layout and handed to the client once. */
export function UserProvider({ user, children }: { user: User; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useOptionalUser(): User | null {
  return useContext(UserContext);
}

export function useUser(): User {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser() needs a UserProvider above it");
  return user;
}
