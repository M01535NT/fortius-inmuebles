"use client";

import * as React from "react";
import type { SiteSettings } from "@/lib/admin/store";
import { LazyMotion, MotionConfig } from "motion/react";

const loadMotion = () => import("motion/react").then((module) => module.domAnimation);

const PublicFeaturesContext = React.createContext<{ publicLeadsEnabled: boolean; settings: SiteSettings | null }>({ publicLeadsEnabled: false, settings: null });

export function PublicFeaturesProvider({
  children,
  publicLeadsEnabled,
  settings = null,
}: React.PropsWithChildren<{ publicLeadsEnabled: boolean; settings?: SiteSettings | null }>) {
  return (
    <PublicFeaturesContext.Provider value={{ publicLeadsEnabled, settings }}>
      <LazyMotion features={loadMotion}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
    </PublicFeaturesContext.Provider>
  );
}

export function usePublicFeatures() {
  return React.useContext(PublicFeaturesContext);
}
