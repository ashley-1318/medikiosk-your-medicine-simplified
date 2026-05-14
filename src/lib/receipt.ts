import jsPDF from "jspdf";

export type ReceiptData = {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  kioskId: string;
  meds: { name: string; dosage: string; frequency: string; duration: string }[];
};

export function downloadReceipt(data: ReceiptData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 48;
  const now = new Date();
  const dateStr = now.toLocaleString();
  const receiptId = `RCP-${now.getTime().toString().slice(-8)}`;

  // Brand colors
  const green: [number, number, number] = [26, 58, 42]; // #1a3a2a
  const amber: [number, number, number] = [212, 168, 83]; // #d4a853
  const muted: [number, number, number] = [110, 122, 115];
  const ink: [number, number, number] = [31, 41, 36];

  // Header bar
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 110, "F");
  doc.setFillColor(...amber);
  doc.circle(margin + 14, 55, 14, "F");
  doc.setTextColor(...green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Rx", margin + 14, 60, { align: "center" });

  doc.setTextColor(245, 240, 232);
  doc.setFontSize(20);
  doc.text("MEDIKIOSK", margin + 40, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(245, 240, 232, 0.8 as unknown as number);
  doc.text("AI-powered medicine dispensing", margin + 40, 70);

  doc.setFontSize(9);
  doc.text(`Receipt ${receiptId}`, W - margin, 52, { align: "right" });
  doc.text(dateStr, W - margin, 68, { align: "right" });

  // Body title
  let y = 150;
  doc.setTextColor(...ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Dispense Receipt", margin, y);

  // Status pill
  doc.setFillColor(34, 139, 90);
  doc.roundedRect(W - margin - 110, y - 16, 110, 22, 11, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("DISPENSED", W - margin - 55, y - 1, { align: "center" });

  // Patient info block
  y += 30;
  doc.setDrawColor(232, 244, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, W - margin, y);

  y += 24;
  const labelColor = muted;
  const valueColor = ink;
  const col2 = W / 2 + 10;

  function kv(label: string, value: string, x: number, yy: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...labelColor);
    doc.text(label.toUpperCase(), x, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...valueColor);
    doc.text(value, x, yy + 14);
  }

  kv("Patient", data.patientName, margin, y);
  kv("Phone", data.patientPhone, col2, y);
  y += 40;
  kv("Approving Doctor", `Dr. ${data.doctorName}`, margin, y);
  kv("Machine ID", data.kioskId, col2, y);
  y += 40;
  kv("Date & Time", dateStr, margin, y);
  kv("Receipt #", receiptId, col2, y);

  // Medicines table
  y += 50;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);
  doc.text("Medicines Dispensed", margin, y);

  y += 14;
  // Table header
  doc.setFillColor(232, 244, 240);
  doc.rect(margin, y, W - margin * 2, 26, "F");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("MEDICINE", margin + 12, y + 17);
  doc.text("DOSAGE", margin + 200, y + 17);
  doc.text("FREQUENCY", margin + 290, y + 17);
  doc.text("DURATION", margin + 400, y + 17);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  data.meds.forEach((m, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(250, 248, 242);
      doc.rect(margin, y, W - margin * 2, 28, "F");
    }
    doc.text(m.name, margin + 12, y + 18);
    doc.text(m.dosage, margin + 200, y + 18);
    doc.text(m.frequency, margin + 290, y + 18);
    doc.text(m.duration, margin + 400, y + 18);
    y += 28;
  });

  // Border
  doc.setDrawColor(...amber);
  doc.setLineWidth(0.8);
  doc.rect(margin, y - data.meds.length * 28 - 26, W - margin * 2, data.meds.length * 28 + 26);

  // Footer note
  y += 30;
  doc.setDrawColor(232, 244, 240);
  doc.line(margin, y, W - margin, y);
  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(
    "Take medication exactly as prescribed. For questions, consult your doctor.",
    margin,
    y,
  );
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for choosing MEDIKIOSK — your prescription, verified & dispensed.", margin, y);

  // Bottom brand bar
  doc.setFillColor(...green);
  doc.rect(0, doc.internal.pageSize.getHeight() - 28, W, 28, "F");
  doc.setTextColor(245, 240, 232);
  doc.setFontSize(9);
  doc.text("medikiosk.app", margin, doc.internal.pageSize.getHeight() - 10);
  doc.text(receiptId, W - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });

  doc.save(`MEDIKIOSK-Receipt-${receiptId}.pdf`);
}
