import PDFDocument from 'pdfkit';
import { ILedgerTransaction } from '../models/LedgerTransaction';
import { IFarmer } from '../models/Farmer';
import { IWebsiteSettings } from '../models/WebsiteSettings';
import { formatINR } from '../utils/helpers';

interface PDFStatementOptions {
  farmer: IFarmer;
  transactions: ILedgerTransaction[];
  settings: IWebsiteSettings;
  fromDate?: string;
  toDate?: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number; // positive = Due, negative = Advance
}

export const generateLedgerPDF = (options: PDFStatementOptions): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const { farmer, transactions, settings, totalDebit, totalCredit, netBalance, fromDate, toDate } = options;

      // 1. Header Banner
      doc
        .rect(40, 40, 515, 65)
        .fill('#1e3a8a'); // Dark Royal Blue

      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(settings.businessName || 'BANSHIDHAR POULTRY', 55, 52);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(settings.tagline || 'Quality Broiler Chicks, Feed & Complete Poultry Management', 55, 76)
        .text(`Phone: ${settings.phone || '+91 9876543210'} | Address: ${settings.address || 'Bihar, India'}`, 55, 88);

      // 2. Statement Subtitle
      doc.moveDown(2);
      doc
        .fillColor('#1e293b')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('FARMER ACCOUNT STATEMENT / खाता विवरण', 40, 120, { align: 'center' });

      // 3. Farmer & Period Info Box
      doc
        .rect(40, 142, 515, 68)
        .lineWidth(1)
        .strokeColor('#cbd5e1')
        .fillAndStroke('#f8fafc', '#cbd5e1');

      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Farmer Name: ${farmer.name}`, 50, 150)
        .text(`Farmer ID: ${farmer.farmerId}`, 340, 150)
        .font('Helvetica')
        .fontSize(9)
        .text(`Phone: ${farmer.phone}`, 50, 166)
        .text(`Farm / Village: ${farmer.farmName || ''} (${farmer.village}, ${farmer.district})`, 50, 180)
        .text(`Statement Period: ${fromDate || 'All Time'} to ${toDate || 'Present'}`, 340, 166)
        .text(`Generated On: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 340, 180);

      // 4. Financial Summary Cards
      const cardY = 222;
      const cardWidth = 160;

      // Card 1: Total Debits (Kharid)
      doc.rect(40, cardY, cardWidth, 42).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor('#1e40af').fontSize(8).font('Helvetica').text('TOTAL PURCHASES (DEBIT)', 50, cardY + 8);
      doc.fillColor('#1e3a8a').fontSize(11).font('Helvetica-Bold').text(formatINR(totalDebit), 50, cardY + 22);

      // Card 2: Total Credits (Jama)
      doc.rect(215, cardY, cardWidth, 42).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#15803d').fontSize(8).font('Helvetica').text('TOTAL PAYMENTS (CREDIT)', 225, cardY + 8);
      doc.fillColor('#14532d').fontSize(11).font('Helvetica-Bold').text(formatINR(totalCredit), 225, cardY + 22);

      // Card 3: Net Balance
      const isDue = netBalance > 0;
      const balanceBg = isDue ? '#fef2f2' : '#f0fdfa';
      const balanceBorder = isDue ? '#fecaca' : '#99f6e4';
      const balanceColor = isDue ? '#b91c1c' : '#0f766e';
      const balanceLabel = isDue ? 'OUTSTANDING DUE (बकाया)' : 'ADVANCE BALANCE (एडवांस)';

      doc.rect(390, cardY, 165, 42).fillAndStroke(balanceBg, balanceBorder);
      doc.fillColor(balanceColor).fontSize(8).font('Helvetica-Bold').text(balanceLabel, 400, cardY + 8);
      doc.fillColor(balanceColor).fontSize(11).font('Helvetica-Bold').text(formatINR(Math.abs(netBalance)), 400, cardY + 22);

      // 5. Table Header
      let tableY = 280;
      doc.rect(40, tableY, 515, 20).fill('#334155');

      doc
        .fillColor('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('DATE', 45, tableY + 6)
        .text('DESCRIPTION', 110, tableY + 6)
        .text('REF', 270, tableY + 6)
        .text('DEBIT (₹)', 335, tableY + 6, { width: 55, align: 'right' })
        .text('CREDIT (₹)', 400, tableY + 6, { width: 55, align: 'right' })
        .text('BALANCE (₹)', 465, tableY + 6, { width: 80, align: 'right' });

      tableY += 20;

      // 6. Transaction Rows
      let runningBalance = 0;
      doc.font('Helvetica').fontSize(8);

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (tx.isVoided) continue;

        runningBalance += (tx.debit || 0) - (tx.credit || 0);

        if (tableY > 730) {
          doc.addPage({ margin: 40, size: 'A4' });
          tableY = 50;

          // Repeat Header on new page
          doc.rect(40, tableY, 515, 20).fill('#334155');
          doc
            .fillColor('#ffffff')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text('DATE', 45, tableY + 6)
            .text('DESCRIPTION', 110, tableY + 6)
            .text('REF', 270, tableY + 6)
            .text('DEBIT (₹)', 335, tableY + 6, { width: 55, align: 'right' })
            .text('CREDIT (₹)', 400, tableY + 6, { width: 55, align: 'right' })
            .text('BALANCE (₹)', 465, tableY + 6, { width: 80, align: 'right' });
          tableY += 20;
          doc.font('Helvetica').fontSize(8);
        }

        // Alternating row color
        if (i % 2 === 0) {
          doc.rect(40, tableY, 515, 18).fill('#f8fafc');
        }

        const dateStr = new Date(tx.transactionDate).toLocaleDateString('en-IN');
        const descStr = tx.description.length > 32 ? tx.description.substring(0, 32) + '...' : tx.description;
        const refStr = tx.referenceId || tx.referenceType || '-';
        const debitStr = tx.debit > 0 ? tx.debit.toFixed(2) : '-';
        const creditStr = tx.credit > 0 ? tx.credit.toFixed(2) : '-';
        const balanceStr = `${runningBalance >= 0 ? 'Dr ' : 'Cr '}${Math.abs(runningBalance).toFixed(2)}`;

        doc
          .fillColor('#1e293b')
          .text(dateStr, 45, tableY + 5)
          .text(descStr, 110, tableY + 5)
          .text(refStr, 270, tableY + 5)
          .text(debitStr, 335, tableY + 5, { width: 55, align: 'right' })
          .text(creditStr, 400, tableY + 5, { width: 55, align: 'right' })
          .font('Helvetica-Bold')
          .text(balanceStr, 465, tableY + 5, { width: 80, align: 'right' })
          .font('Helvetica');

        tableY += 18;
      }

      // 7. Footer Note & Seal Space
      if (tableY > 680) {
        doc.addPage({ margin: 40, size: 'A4' });
        tableY = 50;
      }

      doc.moveDown(2);
      const signY = Math.max(tableY + 30, 720);

      doc
        .rect(40, signY - 20, 515, 1)
        .strokeColor('#e2e8f0')
        .stroke();

      doc
        .fontSize(8)
        .fillColor('#64748b')
        .text('This is a computer generated statement from Banshidhar Poultry Management System.', 40, signY - 10)
        .text('Authorized Signatory / मुहर व हस्ताक्षर', 380, signY - 10, { align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
