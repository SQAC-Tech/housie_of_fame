const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createTemplate() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape

    // Draw some placeholder graphics
    page.drawRectangle({
        x: 0,
        y: 0,
        width: 842,
        height: 595,
        color: rgb(0.95, 0.95, 0.98),
    });

    page.drawRectangle({
        x: 20,
        y: 20,
        width: 802,
        height: 555,
        borderColor: rgb(0.8, 0.6, 0.2),
        borderWidth: 10,
    });

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('Certificate of Achievement', {
        x: 180,
        y: 480,
        size: 40,
        font,
        color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('This is to certify that', { x: 330, y: 360, size: 20, font: normalFont });
    page.drawText('has participated in', { x: 340, y: 220, size: 20, font: normalFont });

    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, '../public/certificate_template.pdf');
    fs.writeFileSync(outPath, pdfBytes);
    console.log('Clean template created at', outPath);
}

createTemplate().catch(console.error);
