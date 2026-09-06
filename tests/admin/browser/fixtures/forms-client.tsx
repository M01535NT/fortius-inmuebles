import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { PublicFormsFixture } from "./public-forms";
hydrateRoot(
  document.getElementById("root")!,
  <PublicFeaturesProvider publicLeadsEnabled>
    <PublicFormsFixture />
  </PublicFeaturesProvider>,
);
