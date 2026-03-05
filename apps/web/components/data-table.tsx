import { Card } from "./ui/card";

export function DataTable({
  title,
  columns,
  rows
}: {
  title: string;
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <Card className="rounded-[24px]">
      <div className="chrome-line mb-4 flex items-center justify-between pb-4">
        <div>
          <p className="eyebrow text-ink/45">Realtime table</p>
          <h3 className="mt-2 text-[1.3rem] font-semibold tracking-[-0.03em]">{title}</h3>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[18px] border border-ink/8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[rgba(255,255,255,0.88)] to-transparent dark:from-[rgba(15,23,42,0.92)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[rgba(255,255,255,0.88)] to-transparent dark:from-[rgba(15,23,42,0.92)]" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[0.99rem]">
            <thead className="border-b border-ink/10 text-ink/46">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] first:pl-4 last:pr-4">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-ink/5 transition hover:bg-slate-50/80 dark:hover:bg-white/5">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-4 text-ink/76 first:pl-4 last:pr-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
