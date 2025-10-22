'use strict';

const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { compute } = require('./calc.cjs');

async function buildReportPdf(calc = {}, customer = {}, options = {}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let y = height - margin;

  // Header
  page.drawText('Wattstone – Berechnungsbericht', { x: margin, y, size: 18, font: fontBold });
  y -= 24;
  page.drawText(options.logoUrl ? `Logo: ${options.logoUrl}` : 'Logo: (kein Logo gesetzt)', { x: margin, y, size: 10, font });
  y -= 16;

  // Meta
  page.drawText(`Erstellt: ${new Date().toISOString()}`, { x: margin, y, size: 10, font });
  y -= 14;
  page.drawText(`Kunde: ${customer.email || '-'}`, { x: margin, y, size: 10, font });
  y -= 20;

  // Trennlinie
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8,0.8,0.8) });
  y -= 18;

  // Eingaben
  page.drawText('Eingaben', { x: margin, y, size: 12, font: fontBold }); y -= 14;
  for (const [k, v] of Object.entries(calc || {})) {
    page.drawText(`${k}: ${String(v)}`, { x: margin, y, size: 11, font }); y -= 13;
    if (y < 120) break;
  }

  // Berechnung ausführen
  const result = compute(calc);

  y -= 8;
  page.drawText('Ergebnisse', { x: margin, y, size: 12, font: fontBold }); y -= 14;
  for (const [k, v] of Object.entries(result || {})) {
    page.drawText(`${k}: ${formatValue(v)}`, { x: margin, y, size: 11, font }); y -= 13;
    if (y < 120) break;
  }

  // Optional: Info
  y -= 8;
  page.drawText('Info', { x: margin, y, size: 12, font: fontBold }); y -= 14;
  const infoLines = [
    `STAGE: ${process.env.STAGE || 'dev'}`,
    `Brevo: ${process.env.BREVO_DISABLED === 'true' ? 'disabled' : 'enabled'}`,
  ];
  for (const line of infoLines) {
    page.drawText(line, { x: margin, y, size: 10, font }); y -= 12;
  }

  const bytes = await pdf.save();
  const filename = `Wattstone-Report-${Date.now()}.pdf`;
  return { bytes, filename, mime: 'application/pdf' };
}

function formatValue(v) {
  if (typeof v === 'number') {
    return Number.isInteger(v) ? `${v}` : `${v.toFixed(2)}`;
  }
  if (v == null) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

module.exports = { buildReportPdf };
