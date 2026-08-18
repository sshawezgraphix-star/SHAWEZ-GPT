import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface VisualPdfOptions {
  elementId: string;
  filename?: string;
  quality?: number;
}

/**
 * Captures a styled DOM element and exports it as a pixel-perfect, magazine-grade A4 PDF.
 */
export async function exportElementToVisualPDF({
  elementId,
  filename = "ShawezGPT_Designer_Document.pdf",
  quality = 2,
}: VisualPdfOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id '${elementId}' not found.`);
  }

  // Render element to high-res canvas (scale: 2 for 300 DPI crispness)
  const canvas = await html2canvas(element, {
    scale: quality,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= pageHeight;

  // Add extra pages if content spans across multiple pages
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;
  }

  const cleanName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  pdf.save(cleanName);
}
