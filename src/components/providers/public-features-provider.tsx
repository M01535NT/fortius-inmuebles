"use client";

import * as React from "react";

const PublicFeaturesContext = React.createContext({ publicLeadsEnabled: false });

export function PublicFeaturesProvider({
  children,
  publicLeadsEnabled,
}: React.PropsWithChildren<{ publicLeadsEnabled: boolean }>) {
  return (
    <PublicFeaturesContext.Provider value={{ publicLeadsEnabled }}>
      {children}
    </PublicFeaturesContext.Provider>
  );
}

export function usePublicFeatures() {
  return React.useContext(PublicFeaturesContext);
}
