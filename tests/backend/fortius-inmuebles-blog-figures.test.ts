// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { BlogFigureView } from "@/components/blog/blog-figure";
import { calculateFigureChart, getBlogFigures } from "@/data/blog-figures";

function article(number: string): { slug: string; contenido: string } {
  return JSON.parse(readFileSync(`content/blog/2026-09/${number}.json`, "utf8"));
}

describe("editorial blog figures", () => {
  test.each(["04", "08"])("chart %s clips its text alternative in a block while preserving table semantics", (number) => {
    const figure = getBlogFigures(article(number).slug)[0];
    const html = renderToStaticMarkup(createElement(BlogFigureView, { figure }));
    const container = document.createElement("div");
    container.innerHTML = html;
    const table = container.querySelector("table")!;
    // A table's intrinsic width can defeat sr-only's one-pixel width in browsers.
    // The clipping utility belongs on a surrounding block, not the table itself.
    expect(table.parentElement?.matches("div.sr-only")).toBe(true);
    expect(table.closest('[aria-hidden="true"], [hidden]')).toBeNull();
    expect(table.caption?.textContent).toContain(figure.title);
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(3);
    expect(table.querySelectorAll('tbody th[scope="row"]')).toHaveLength(number === "04" ? 3 : 2);
  });

  test("every figure attaches to an existing section and has an accessible caption", () => {
    const figures = ["01", "02", "04", "06", "08", "09", "10", "12"].flatMap((number) => {
      const post = article(number);
      const selected = getBlogFigures(post.slug);
      expect(selected).toHaveLength(1);
      for (const figure of selected) {
        expect(post.contenido.split("\n")).toContain(`## ${figure.afterHeading}`);
        const html = renderToStaticMarkup(createElement(BlogFigureView, { figure }));
        expect(html).toContain(`<figcaption id="${figure.id}-caption"`);
        expect(html).toContain(`aria-labelledby="${figure.id}-title"`);
        expect(html).toContain(`aria-describedby="${figure.id}-caption"`);
        expect(html).toContain(figure.title);
      }
      return selected;
    });
    expect(new Set(figures.map(({ id }) => id)).size).toBe(8);
    expect(figures.filter(({ data }) => data.type === "infographic")).toHaveLength(6);
    expect(getBlogFigures("unknown-article")).toEqual([]);
  });

  test("monthly bars reproduce the article's cash outflow, without implying a wealth result", () => {
    const post = article("08");
    const figure = getBlogFigures(post.slug)[0];
    if (figure.data.type !== "monthly-comparison") throw new Error("Expected monthly comparison");
    const result = calculateFigureChart(figure.data);
    expect(result.rows.map(({ value }) => value)).toEqual([28000, 18000]);
    expect(result.rows[0].value - result.rows[1].value).toBe(10000);
    expect(result.max).toBe(28000);
    for (const row of figure.data.rows) {
      for (const part of row.parts) {
        expect(post.contenido).toContain(new Intl.NumberFormat("en-US").format(part.amount));
      }
    }
    const html = renderToStaticMarkup(createElement(BlogFigureView, { figure }));
    expect(html).toContain("28,000 MXN");
    expect(html).toContain("18,000 MXN");
    expect(html).toContain("10,000 MXN");
    expect(html).toContain("EJEMPLO FICTICIO");
    expect(html).toContain("no mide patrimonio");
    expect(html).toContain("width:100%");
    expect(html).toContain("width:64.28571428571429%");
    expect(html).toContain("Escala común desde 0");
    expect(html).toContain("<table");
    expect(html).toContain('<th scope="col">Salida mensual (MXN)</th>');
  });

  test("a fixed peso payment requires more dollars as pesos per dollar fall", () => {
    const figure = getBlogFigures(article("04").slug)[0];
    if (figure.data.type !== "currency-sensitivity") throw new Error("Expected currency sensitivity");
    const result = calculateFigureChart(figure.data);
    expect(result.rows.map(({ value }) => value)).toEqual([1000, 1111.11, 1250]);
    expect(result.max).toBe(1250);
    expect(result.rows.map(({ label }) => label)).toEqual(["20 MXN por USD", "18 MXN por USD", "16 MXN por USD"]);
    const html = renderToStaticMarkup(createElement(BlogFigureView, { figure }));
    expect(html).toContain("EJEMPLO ILUSTRATIVO");
    expect(html).toContain("20,000 MXN");
    expect(html).toContain("1,111.11 USD");
    expect(html).toContain("no son cotizaciones vigentes");
    expect(html).toContain("no es una oferta bancaria");
    expect(html).toContain("width:80%");
    expect(html).toContain("width:100%");
    expect(html).toContain('<th scope="col">Pago equivalente (USD)</th>');
  });
});
