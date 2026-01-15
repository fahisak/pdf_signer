import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import {PDFDocument, rgb, StandardFonts} from "pdf-lib";
import path from "path";

const app = express();
app.use(cors());

// Multer setup to store uploaded files temporarily
const upload = multer({dest: "uploads/"});

app.post("/sign", upload.single("pdf"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  try {
    // Read uploaded PDF
    const existingPdfBytes = fs.readFileSync(req.file.path);

    // Load PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Embed standard Helvetica font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get last page
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const {width, height} = lastPage.getSize();

    // Text to draw
    const text = "SIGNED";
    const fontSize = 24;

    // Get exact text width for precise right-alignment
    const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);

    // Draw text at bottom-right corner (10px margin)
    lastPage.drawText(text, {
      x: width - textWidth - 10, // 10px from right
      y: 15, // 15px from bottom
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.9, 0.1, 0.1), // red color
    });

    // Save signed PDF
    const signedPdfBytes = await pdfDoc.save();

    // Set headers to return PDF inline
    const originalName = req.file.originalname || "document.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="signed-${path.basename(originalName)}"`
    );

    // Send PDF as buffer
    res.send(Buffer.from(signedPdfBytes));

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error("PDF signing error:", err);
    res.status(500).send("Failed to sign PDF");
  }
});

app.listen(4000, () => {
  console.log("Mock server running at http://localhost:4000");
});
