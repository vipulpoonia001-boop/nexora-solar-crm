import { jsPDF } from 'jspdf';
import { formatCurrencyPDF, formatDate } from './helpers';
import { API_URL } from './api';

/**
 * Helper to convert an image URL (e.g., from public folder) to Base64
 */
const getBase64Image = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

/**
 * Generates a luxury, editorial-quality solar installation quotation PDF
 * @param {Object} project - The full project object from the database
 * @param {boolean} saveToDisk - Whether to trigger a browser download
 */
export const generateQuotationPDF = async (project, saveToDisk = true) => {
  try {
    const doc = new jsPDF();
    const COLORS = {
      navy: [11, 17, 32],
      navyLight: [15, 23, 42],
      gold: [201, 162, 39],
      ivory: [253, 252, 248],
      rowAlt: [250, 248, 243],
      textPrimary: [31, 41, 55],
      textSecondary: [100, 110, 120],
      textMuted: [150, 160, 170],
      rose: [190, 18, 60],
      white: [255, 255, 255],
      pearl: [226, 232, 240],
    };

    // Fetch settings
    let unitsPerKw = 120;
    let electricityRate = 8;
    try {
      const response = await fetch(`${API_URL}/api/settings/pricing`);
      if (response.ok) {
        const settings = await response.json();
        unitsPerKw = Number(settings.unitsPerKw) || 120;
        electricityRate = Number(settings.electricityRate) || 8;
      }
    } catch (err) {
      console.warn('Using default settings', err);
    }

    // Calculations
    const systemSize = parseFloat(project.systemSize) || 0;
    const kW = systemSize;
    const monthlyUnits = systemSize * unitsPerKw;
    const monthlySavings = monthlyUnits * electricityRate;
    const annualSavings = monthlySavings * 12;
    const twentyFiveYearSavings = annualSavings * 25;
    const subsidy = project.subsidyStatus === 'without subsidy' ? 0 : Math.min(kW * 30000, 78000);
    const totalCostValue = project.paymentInfo?.totalCost ?? project.totalCost ?? 0;
    const totalCost = parseFloat(totalCostValue) || 0;
    const finalPayable = totalCost - subsidy;
    const payback = annualSavings > 0 ? (totalCost / annualSavings).toFixed(1) : 'N/A';

    // Font setup
    doc.setFont('helvetica', 'normal');

    // 1. LUXURY HEADER
    doc.setFillColor(...COLORS.navy);
    doc.rect(0, 0, 210, 48, 'F');
    doc.setFillColor(...COLORS.navyLight);
    doc.rect(0, 48, 210, 3, 'F');
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(0, 51, 210, 51);

    // Logo
    try {
      const logoBase64 = await getBase64Image('/logo.png');
      doc.addImage(logoBase64, 'PNG', 18, 12, 18, 18);
    } catch (err) {
      // Silently continue
    }

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NEXORA POWER', 45, 25);
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('P R E M I U M   S O L A R   S O L U T I O N S', 45, 32);
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(8);
    doc.text('+91 74043 57676  \u00B7  powernexora@gmail.com', 45, 37);

    // Right block
    const dateStr = formatDate(new Date()) || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const quoteNumberValue = project.quoteNumber
      ? String(project.quoteNumber)
      : project.id
        ? String(project.id).replace(/-/g, '').slice(0, 10).toUpperCase()
        : 'N/A';
    const rightLabelX = 145;
    const rightValueX = 190;
    const rightLineHeight = 8;
    const rightStartY = 17;

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(7);
    doc.text('DATE', rightLabelX, rightStartY);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.text(dateStr, rightValueX, rightStartY, { align: 'right' });

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(7);
    doc.text('QUOTE NO.', rightLabelX, rightStartY + rightLineHeight);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.text(quoteNumberValue, rightValueX, rightStartY + rightLineHeight, { align: 'right' });

    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(7);
    doc.text('VALIDITY', rightLabelX, rightStartY + rightLineHeight * 2);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.text('7 Days', rightValueX, rightStartY + rightLineHeight * 2, { align: 'right' });

    // 2. CUSTOMER & PROJECT CARD
    let currentY = 65;
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('P R E P A R E D   E X C L U S I V E L Y   F O R', 20, currentY);
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text((project.customerName || '').toUpperCase(), 20, currentY + 8);
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(project.phone || '', 20, currentY + 15);
    const addressLines = doc.splitTextToSize(project.address || '', 80);
    doc.text(addressLines, 20, currentY + 22);

    // Project card
    const cardY = currentY - 5;
    doc.setDrawColor(...COLORS.pearl);
    doc.setLineWidth(0.5);
    doc.roundedRect(120, cardY, 75, 38, 2, 2, 'S');
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(120, cardY, 75, 38, 2, 2, 'F');
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(1.5);
    doc.line(120, cardY, 120, cardY + 38);
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT OVERVIEW', 125, cardY + 8);
    doc.setTextColor(...COLORS.textSecondary);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`System Size: ${systemSize} kW`, 125, cardY + 16);
    doc.text(`Panel Count: ${project.panelCount || 0} Nos`, 125, cardY + 23);
    doc.text(`Type: ${systemSize >= 10 ? 'Commercial' : 'Residential'} On-Grid`, 125, cardY + 30);

    // 3. ITEMIZED TABLE
    currentY += 50;
    const tableStartY = currentY;
    doc.setFillColor(...COLORS.navy);
    doc.rect(20, tableStartY, 175, 12, 'F');
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(20, tableStartY + 12, 195, tableStartY + 12);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM DESCRIPTION', 26, tableStartY + 8);
    doc.text('SPECIFICATION', 95, tableStartY + 8);
    doc.text('QTY', 193, tableStartY + 8, { align: 'right' });

    // Rows
    const rows = [];
    const getUnitLabel = (val) => parseFloat(val) === 1 ? 'Unit' : 'Units';
    if (project.dcrQty > 0) {
      rows.push({ desc: 'Solar Panels (DCR)', spec: project.dcrModel || 'DCR Mono Perc', qty: `${project.dcrQty} ${getUnitLabel(project.dcrQty)}` });
    }
    if (project.nonDcrQty > 0) {
      rows.push({ desc: 'Solar Panels (Non-DCR)', spec: project.nonDcrModel || 'Non-DCR Mono Perc', qty: `${project.nonDcrQty} ${getUnitLabel(project.nonDcrQty)}` });
    }
    if (project.inverter) {
      rows.push({ desc: 'Solar Inverter', spec: project.inverter, qty: '1 Unit' });
    }
    if (project.structure) {
      const qty = systemSize;
      rows.push({ desc: 'Mounting Structure', spec: project.structure, qty: `${qty} ${getUnitLabel(qty)}` });
    }
    if (project.acdb) {
      rows.push({ desc: 'ACDB', spec: project.acdb, qty: '1 Unit' });
    }
    if (project.dcdb) {
      rows.push({ desc: 'DCDB', spec: project.dcdb, qty: '1 Unit' });
    }
    if (project.dcCable) {
      rows.push({ desc: 'DC Cabling', spec: project.dcCable, qty: '1 Unit' });
    }
    if (project.acCable) {
      rows.push({ desc: 'AC Cabling', spec: project.acCable, qty: '1 Unit' });
    }
    if (project.copperEarthing || project.chemicalEarthing) {
      const spec = [project.copperEarthing, project.chemicalEarthing].filter(Boolean).join(' + ');
      rows.push({ desc: 'Earthing System', spec, qty: '3 Units' });
    }
    if (project.accessories) {
      rows.push({ desc: 'Accessories', spec: project.accessories, qty: '1 Unit' });
    }
    if (rows.length === 0) {
      rows.push({ desc: 'Complete Solar PV System', spec: `${systemSize}kW On-Grid Installation`, qty: '1 Unit' });
    }

    currentY += 12;
    rows.forEach((row, i) => {
      if (i % 2 === 1) {
        doc.setFillColor(...COLORS.rowAlt);
        doc.rect(20, currentY, 175, 10, 'F');
      }
      doc.setDrawColor(...COLORS.pearl);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 10, 195, currentY + 10);
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(row.desc, 26, currentY + 7);
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const specLines = doc.splitTextToSize(row.spec, 85);
      doc.text(specLines, 95, currentY + 7);
      doc.setTextColor(...COLORS.textPrimary);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(row.qty, 193, currentY + 7, { align: 'right' });
      currentY += 10;
    });

    // 4. INVESTMENT SUMMARY
    currentY += 10;
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INVESTMENT SUMMARY', 135, currentY, { align: 'left' });
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(135, currentY + 2, 195, currentY + 2);
    currentY += 10;

    const summaryLabelX = 135;
    const summaryValueX = 195;
    const summaryRowHeight = 8;
    const summarySpacing = 3;

    const summaryRows = [
      { label: 'Initial Investment Value', value: formatCurrencyPDF(totalCost), color: COLORS.textPrimary },
      { label: 'Subsidy by MNRE', value: `- ${formatCurrencyPDF(subsidy)}`, color: COLORS.rose }
    ];

    summaryRows.forEach((row) => {
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const labelLines = doc.splitTextToSize(row.label, 55);
      doc.text(labelLines, summaryLabelX, currentY);

      doc.setTextColor(...row.color);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(row.value, summaryValueX, currentY, { align: 'right' });

      currentY += summaryRowHeight * labelLines.length + summarySpacing;
    });

    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.3);
    doc.line(summaryLabelX, currentY, summaryValueX, currentY);
    currentY += 6;

    // Final Payable Card
    doc.setDrawColor(...COLORS.pearl);
    doc.setLineWidth(0.5);
    doc.roundedRect(125, currentY, 70, 22, 2, 2, 'S');
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(125, currentY, 70, 22, 2, 2, 'F');
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(2.5);
    doc.line(125, currentY, 125, currentY + 22);
    doc.setDrawColor(...COLORS.navy);
    doc.setLineWidth(1.5);
    doc.line(125, currentY + 22, 195, currentY + 22);
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('FINAL INVESTMENT', 130, currentY + 8);
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrencyPDF(finalPayable), 190, currentY + 16, { align: 'right' });
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Inclusive of all applicable taxes', 190, currentY + 20, { align: 'right' });

    // 5. TERMS & CONDITIONS + TRUST BADGES
    currentY += 35;
    if (currentY > 230) {
      doc.addPage();
      doc.setFillColor(...COLORS.navy);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.8);
      doc.line(0, 15, 210, 15);
      doc.setTextColor(...COLORS.gold);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('NEXORA POWER', 105, 10, { align: 'center' });
      currentY = 25;
    }

    // Left column
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS', 20, currentY);
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 2, 100, currentY + 2);
    currentY += 10;
    const terms = [
      { num: '01', title: 'Proposal Validity', desc: '7 days from issue.' },
      { num: '02', title: 'Payment Schedule', desc: '20% advance, 60% post-installation, 20% upon net metering.' },
      { num: '03', title: 'Warranty Coverage', desc: 'Panels 25 years, Inverter 5–10 years.' },
      { num: '04', title: 'Net Metering', desc: 'Subject to DISCOM approval.' },
      { num: '05', title: 'Subsidy Disclaimer', desc: 'Subject to MNRE policies.' }
    ];
    terms.forEach(term => {
      doc.setTextColor(...COLORS.gold);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(term.num, 20, currentY);
      doc.setTextColor(...COLORS.navy);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(term.title.toUpperCase(), 30, currentY);
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(term.desc, 75);
      doc.text(descLines, 30, currentY + 5);
      currentY += 12 * Math.max(1, descLines.length);
    });

    // Right column
    const badgeY = currentY - 60;
    doc.setFillColor(...COLORS.rowAlt);
    doc.roundedRect(120, badgeY, 75, 55, 2, 2, 'F');
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('WHY NEXORA POWER', 125, badgeY + 8);
    const badges = [
      'MNRE Channel Partner',
      '500+ Installations',
      '25-Year Performance Guarantee',
      'End-to-End Project Management',
      'DISCOM Liaison Support',
      'Premium Tier-1 Components Only'
    ];
    badges.forEach((badge, i) => {
      doc.setTextColor(...COLORS.textSecondary);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text('\u2713', 125, badgeY + 18 + i * 6);
      doc.text(badge, 132, badgeY + 18 + i * 6);
    });

    // 6. ESTIMATED RETURNS
    currentY += 10;
    if (currentY > 200) {
      doc.addPage();
      currentY = 25;
    }
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTIMATED RETURNS', 20, currentY);
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 2, 100, currentY + 2);
    currentY += 15;

    // Three cards
    const cardWidth = 55;
    const cardHeight = 38;
    const cardGap = 5;
    const cards = [
      { title: 'Monthly Savings', value: monthlySavings, color: COLORS.navy },
      { title: 'Annual Savings', value: annualSavings, color: COLORS.navy },
      { title: '25-Year Value', value: twentyFiveYearSavings, color: COLORS.gold }
    ];
    cards.forEach((card, i) => {
      const x = 20 + i * (cardWidth + cardGap);
      doc.setDrawColor(...COLORS.pearl);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');
      doc.setFillColor(...COLORS.white);
      doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
      doc.setDrawColor(...card.color);
      doc.setLineWidth(2.5);
      doc.line(x, currentY, x, currentY + cardHeight);
      doc.setTextColor(...COLORS.textMuted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.title.toUpperCase(), x + 5, currentY + 8);
      doc.setTextColor(...COLORS.navy);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrencyPDF(card.value), x + cardWidth - 5, currentY + 20, { align: 'right' });
      doc.setDrawColor(...COLORS.pearl);
      doc.setLineWidth(0.3);
      doc.line(x + 5, currentY + 25, x + cardWidth - 5, currentY + 25);
    });

    // Payback badge
    currentY += cardHeight + 10;
    doc.setFillColor(...COLORS.navy);
    doc.roundedRect(20, currentY, 85, 14, 2, 2, 'F');
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTIMATED PAYBACK PERIOD', 25, currentY + 6);
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    const paybackText = payback === 'N/A' ? 'N/A' : `${payback} Years`;
    doc.text(paybackText, 100, currentY + 10, { align: 'right' });

    // 7. CLOSING BANNER & FOOTER (End of Page 2)
    currentY += 25;
    if (currentY > 220) {
      doc.addPage();
      currentY = 25;
    }

    // Position banner at bottom of page 2
    const bannerY = 260;
    doc.setFillColor(...COLORS.rowAlt);
    doc.rect(20, bannerY, 175, 14, 'F');
    doc.setTextColor(...COLORS.navy);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Switch to Solar today and save up to 90% on your electricity bills!', 112.5, bannerY + 9, { align: 'center' });

    // Footer
    doc.setFillColor(...COLORS.navy);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(0, 275, 210, 275);
    doc.setTextColor(...COLORS.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gold);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Powering a sustainable future, one rooftop at a time.', 105, 283, { align: 'center' });
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
  

    // Save
    if (saveToDisk) {
      const safeName = (project.customerName || 'Customer').replace(/\s+/g, '_');
      doc.save(`Quote_${safeName}_${systemSize}kW.pdf`);
    }
    return doc;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert(`Failed to generate PDF: ${error.message}`);
    throw error;
  }
};