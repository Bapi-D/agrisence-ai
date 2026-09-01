export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join(
    "\n",
  );
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Opens a print-ready report window; the browser's "Save as PDF" produces the PDF. */
export function printPdfReport(title: string, sections: Array<{ heading: string; rows: Array<Record<string, unknown>> }>) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  const table = (rows: Array<Record<string, unknown>>) => {
    if (!rows.length) return "<p>No records.</p>";
    const headers = Object.keys(rows[0]!);
    return `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr>${headers.map((h) => `<td>${r[h] ?? ""}</td>`).join("")}</tr>`)
      .join("")}</tbody></table>`;
  };
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:ui-sans-serif,system-ui;padding:32px;color:#14301f}
    h1{font-size:22px} h2{font-size:16px;margin-top:28px}
    table{border-collapse:collapse;width:100%;font-size:11px;margin-top:8px}
    th,td{border:1px solid #cfe3d5;padding:6px 8px;text-align:left}
    th{background:#eaf6ee}
  </style></head><body><h1>${title}</h1><p>Generated ${new Date().toLocaleString()}</p>
  ${sections.map((s) => `<h2>${s.heading}</h2>${table(s.rows)}`).join("")}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
