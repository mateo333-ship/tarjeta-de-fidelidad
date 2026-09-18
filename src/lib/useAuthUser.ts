"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";

export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = still checking
  useEffect(() => onAuthStateChanged(getAuthClient(), setUser), []);
  return { user, loading: user === undefined };
}
