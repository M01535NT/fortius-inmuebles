import * as React from "react";

// This Vite harness isolates form hydration; actual Next navigation is covered
// by the compiled-site suite in playwright.public.config.ts.
export default function FormFixtureLink(props: React.ComponentProps<"a">) {
  return <a {...props} />;
}
