"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const PROD_CONVEX_URL = "https://mellow-wildcat-858.eu-west-1.convex.cloud";
const envUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const url =
  envUrl && !envUrl.includes("happy-otter-123") ? envUrl : PROD_CONVEX_URL;

const convex = new ConvexReactClient(url);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
