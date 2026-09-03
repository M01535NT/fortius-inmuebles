import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { PublicFormsFixture } from "./public-forms";
hydrateRoot(document.getElementById("root")!, <PublicFormsFixture />);
