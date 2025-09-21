import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const { name = "", email = "", message = "" } = data;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "email required" }),
      };
    }

    // --- PDF bauen ---
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(`Name: ${name}`, { x: 50, y: 780, size: 14, font, color: rgb(0,0,0) });
    page.drawText(`E-Mail: ${email}`, { x: 50, y: 760, size: 14, font });
    page.drawText(`Nachricht: ${message}`, { x: 50, y: 740, size: 14, font });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    // --- Brevo Mail senden ---
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: process.env.FROM_EMAIL, name: process.env.FROM_NAME || "Shopify App" },
        to: [{ email }],
        subject: "Dein PDF aus Shopify",
        htmlContent: `<p>Hallo ${name || ""}, anbei dein PDF.</p>`,
        attachment: [{ name: "formular.pdf", content: pdfBase64 }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Brevo API Error ${resp.status}: ${text}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e.message }),
    };
  }
};
npm -v
