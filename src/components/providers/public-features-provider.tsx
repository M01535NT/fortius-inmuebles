"use client";

import * as React from "react";
import type { SiteSettings } from "@/lib/admin/store";

const PublicFeaturesContext = React.createContext<{ publicLeadsEnabled: boolean; settings: SiteSettings | null }>({ publicLeadsEnabled: false, settings: null });

export function PublicFeaturesProvider({
  children,
  publicLeadsEnabled,
  settings = null,
}: React.PropsWithChildren<{ publicLeadsEnabled: boolean; settings?: SiteSettings | null }>) {
  return (
    <PublicFeaturesContext.Provider value={{ publicLeadsEnabled, settings }}>
      {children}
    </PublicFeaturesContext.Provider>
  );
}

export function usePublicFeatures() {
  return React.useContext(PublicFeaturesContext);
}
