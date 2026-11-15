import type { AppResult } from "@/lib/apps/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import styles from "./apps.module.css";

/* Resultado de una herramienta: cifras arriba y, debajo, sus tablas completas con encabezados (RP-104 los permite en Herramientas). */
export function AppResultView({ result }: { result: AppResult }) {
  return <section className={styles.result} aria-label="Resultado">
    <h2 className="text-xl font-semibold">{result.title}</h2>
    <dl className={styles.metrics}>{result.summary.map((m, i) => <div key={i} className={styles.metric}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>
    {result.sections?.map((s, i) => <section key={i}>
      <h3>{s.title}</h3>
      {s.text && <p>{s.text}</p>}
      {s.rows && <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={s.title}>
        <Table>
          {s.columns && <TableHeader><TableRow className="hover:bg-transparent">{s.columns.map((c, j) => <TableHead key={j} scope="col">{c}</TableHead>)}</TableRow></TableHeader>}
          <TableBody>{s.rows.map((row, j) => <TableRow key={j}>{row.map((cell, k) => <TableCell key={k}>{cell}</TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </div>}
    </section>)}
    {result.warnings?.map((w, i) => <p className={styles.notice} key={i}>{w}</p>)}
  </section>;
}
