import { Fragment, type ReactNode } from "react";
import { BlogFigureView } from "@/components/blog/blog-figure";
import type { BlogFigure } from "@/data/blog-figures";

type Block =
  | { type: "paragraph" | "h2" | "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function blocks(content: string): Block[] {
  const result: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) result.push({ type: "paragraph", text: paragraph.join("\n").trim() });
    paragraph = [];
  };

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) {
      flush();
      // A blank line also ends a list, even if another list follows.
      result.push({ type: "paragraph", text: "" });
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    const bullet = /^-\s+(.+)$/.exec(line);
    const numbered = /^\d+\.\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      result.push({ type: heading[1].length === 2 ? "h2" : "h3", text: heading[2] });
    } else if (bullet || numbered) {
      flush();
      const type = bullet ? "ul" : "ol";
      const text = (bullet ?? numbered)![1];
      const previous = result.at(-1);
      if (previous?.type === type) previous.items.push(text);
      else result.push({ type, items: [text] });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return result.filter((block) => block.type !== "paragraph" || block.text);
}

function isSafeLink(url: string): boolean {
  // Reject browser-normalized controls and backslashes before parsing URLs.
  if ([...url].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === "\\")) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    return Boolean(new URL(url).hostname);
  } catch {
    return false;
  }
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const links = /\[([^\]\n]+)\]\(([^()\n]*)\)/g;
  let cursor = 0;
  for (const match of text.matchAll(links)) {
    nodes.push(text.slice(cursor, match.index));
    nodes.push(isSafeLink(match[2]) ? (
      <a
        key={match.index}
        href={match[2]}
        className="rounded-sm text-primary-ink underline decoration-primary/50 underline-offset-4 [overflow-wrap:anywhere] hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {match[1]}
      </a>
    ) : match[0]);
    cursor = match.index + match[0].length;
  }
  nodes.push(text.slice(cursor));
  return nodes;
}

const bodyClass = "max-w-[68ch] text-base leading-8 text-foreground/85 sm:text-lg";

/** A small text-only Markdown subset. React escapes all stored text, including HTML. */
export function BlogContent({ content, figures = [] }: { content: string; figures?: BlogFigure[] }) {
  const contentBlocks = blocks(content);
  const figuresAtEnd = new Map<number, BlogFigure[]>();
  for (const figure of figures) {
    const start = contentBlocks.findIndex((block) => block.type === "h2" && block.text === figure.afterHeading);
    if (start === -1) continue;
    const nextSection = contentBlocks.findIndex((block, index) => index > start && block.type === "h2");
    const end = nextSection === -1 ? contentBlocks.length - 1 : nextSection - 1;
    figuresAtEnd.set(end, [...(figuresAtEnd.get(end) ?? []), figure]);
  }

  function renderBlock(block: Block, index: number) {
    if (block.type === "ul" || block.type === "ol") {
      const List = block.type;
      return (
        <List key={index} className={`${bodyClass} space-y-2 pl-6 ${block.type === "ul" ? "list-disc" : "list-decimal"}`}>
          {block.items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>)}
        </List>
      );
    }
    if (block.type === "h2" || block.type === "h3") {
      const Heading = block.type;
      return (
        <Heading key={index} className={`display-soft text-foreground ${block.type === "h2" ? "pt-6 text-2xl sm:text-3xl" : "pt-3 text-xl sm:text-2xl"}`}>
          {inline(block.text)}
        </Heading>
      );
    }
    return <p key={index} className={bodyClass}>{inline(block.text)}</p>;
  }

  return (
    <div className="mt-10 space-y-6 [overflow-wrap:anywhere]">
      {contentBlocks.map((block, index) => {
        return (
          <Fragment key={`block-${index}`}>
            {renderBlock(block, index)}
            {figuresAtEnd.get(index)?.map((figure, figureIndex) => (
              <BlogFigureView key={`figure-${figure.id}-${figureIndex}`} figure={figure} />
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}
