import * as React from "react";
import { renderToString } from "react-dom/server";
import { PublicFormsFixture } from "./public-forms";
export const render = () => renderToString(<PublicFormsFixture />);
