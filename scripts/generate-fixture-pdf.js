const PDFDocument = require("pdfkit");
const fs = require("node:fs");
const path = require("node:path");

const text = fs.readFileSync(path.resolve(__dirname, "../fixtures/sample-lease-text.txt"), "utf8");
const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream(path.resolve(__dirname, "../fixtures/sample-lease-berlin.pdf")));
doc.font("Helvetica").fontSize(11).text(text, { align: "left" });
doc.end();
