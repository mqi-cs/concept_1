"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const CONVEX_URL = "https://mellow-wildcat-858.eu-west-1.convex.cloud";

const convex = new ConvexReactClient(CONVEX_URL);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
