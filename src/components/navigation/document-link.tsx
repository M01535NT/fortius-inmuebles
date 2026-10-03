import type { AnchorHTMLAttributes } from "react";

/** Refresh the server layout and its settings when crossing public/admin shells. */
export function DocumentLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} data-document-navigation="true" />;
}
