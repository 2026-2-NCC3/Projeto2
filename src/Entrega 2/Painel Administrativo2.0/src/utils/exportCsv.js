// CSV UTF-8 compatível com Excel; evita injeção de fórmulas em campos do banco.
export function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function csvText(headers, rows) {
  return '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n';
}
export function baixarCsv(filename, headers, rows) {
  const blob = new Blob([csvText(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
