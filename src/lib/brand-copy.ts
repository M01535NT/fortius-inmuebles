/** Refresh prose without modifying Markdown destinations, URLs, email or record IDs. */
export function brandCopy(value: string): string {
  // Match a complete destination before a brand name within it. This mirrors the
  // link subset accepted by BlogContent, including relative Markdown destinations.
  const tokens = /(\[([^\]\n]+)\]\(([^()\n]*)\))|(?:https?:\/\/|mailto:|www\.)[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}|(?:\.{0,2}\/)[^\s<>]+|\b(?:MNT|Mint)\b(?![-_])/g;
  return value.replace(tokens, (token, link: string | undefined, label: string, destination: string) => {
    if (link) return `[${brandCopy(label)}](${destination})`;
    return token === "MNT" || token === "Mint" ? "Fortius" : token;
  });
}
