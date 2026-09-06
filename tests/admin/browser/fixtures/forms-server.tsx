import * as React from "react";
import { renderToString } from "react-dom/server";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { PublicFormsFixture } from "./public-forms";
export const render = () => renderToString(
  <PublicFeaturesProvider publicLeadsEnabled>
    <PublicFormsFixture />
  </PublicFeaturesProvider>,
);
