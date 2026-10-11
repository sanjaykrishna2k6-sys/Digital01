import PDFDocument from 'pdfkit'

/**
 * Generate a professional GST Invoice PDF stream/buffer
 * @param {Object} invoice - Full invoice populated with client and organization details
 * @returns {Promise<Buffer>} PDF Buffer
 */
export function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const buffers = []

      doc.on('data', (chunk) => buffers.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(buffers)))
      doc.on('error', (err) => reject(err))

      const primaryColor = '#4f46e5'
      const darkColor = '#1f2937'
      const lightBg = '#f9fafb'
      const borderColor = '#e5e7eb'

      const orgName = invoice.organizationSnapshot?.legalName || invoice.organizationId?.name || 'Krishpo Marketing Agency'
      const orgAddress = invoice.organizationSnapshot?.billingAddress || '100 Digital Boulevard, Suite 500, Tech Park'
      const orgGstin = invoice.organizationSnapshot?.gstin || '33AABCK1234F1Z5'
      const orgEmail = invoice.organizationSnapshot?.email || 'billing@krishpo.com'
      const orgPhone = invoice.organizationSnapshot?.phone || '+91 98765 43210'

      const clientName = invoice.clientSnapshot?.companyName || invoice.clientId?.companyName || 'Valued Client'
      const clientContact = invoice.clientSnapshot?.contactName || invoice.clientId?.contactName || ''
      const clientAddress = invoice.clientSnapshot?.billingAddress || 'Client Billing Address'
      const clientGstin = invoice.clientSnapshot?.gstin || 'Unregistered'
      const clientEmail = invoice.clientSnapshot?.email || invoice.clientId?.email || ''

      // Header Section
      doc.rect(40, 40, 515, 60).fill('#1e1b4b')
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('KRISHPO', 55, 55)
      doc.fontSize(10).font('Helvetica').text('Digital Marketing Platform & Services', 55, 80)

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(invoice.invoiceType || 'TAX INVOICE', 380, 55, { align: 'right' })
      doc.fontSize(10).font('Helvetica').text(`# ${invoice.invoiceNumber}`, 380, 78, { align: 'right' })

      let y = 115

      // Agency vs Client details (2 Columns)
      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text('ISSUED BY:', 40, y)
      doc.font('Helvetica-Bold').text('BILLED TO:', 310, y)

      y += 15
      doc.font('Helvetica-Bold').fontSize(11).text(orgName, 40, y)
      doc.text(clientName, 310, y)

      y += 14
      doc.font('Helvetica').fontSize(9).fillColor('#4b5563')
      doc.text(orgAddress, 40, y, { width: 240 })
      doc.text(clientAddress, 310, y, { width: 240 })

      y += 28
      doc.text(`GSTIN: ${orgGstin}`, 40, y)
      doc.text(`GSTIN: ${clientGstin}`, 310, y)

      y += 14
      doc.text(`Email: ${orgEmail} | Phone: ${orgPhone}`, 40, y)
      if (clientEmail) doc.text(`Contact: ${clientContact} (${clientEmail})`, 310, y)

      y += 25
      doc.rect(40, y, 515, 1).fill(borderColor)

      y += 12
      // Meta Information Grid
      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold')
      doc.text('Invoice Date:', 40, y)
      doc.font('Helvetica').text(new Date(invoice.invoiceDate || Date.now()).toLocaleDateString('en-IN'), 105, y)

      doc.font('Helvetica-Bold').text('Due Date:', 180, y)
      doc.font('Helvetica').text(new Date(invoice.dueDate).toLocaleDateString('en-IN'), 235, y)

      doc.font('Helvetica-Bold').text('Place of Supply:', 330, y)
      doc.font('Helvetica').text(invoice.placeOfSupply || 'Intra-State', 415, y)

      y += 16
      doc.font('Helvetica-Bold').text('Payment Terms:', 40, y)
      doc.font('Helvetica').text(invoice.paymentTerms || '15 Days', 115, y)

      doc.font('Helvetica-Bold').text('Status:', 180, y)
      const statusColor = invoice.status === 'Paid' ? '#16a34a' : invoice.status === 'Overdue' ? '#dc2626' : '#d97706'
      doc.fillColor(statusColor).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 220, y)

      y += 25

      // Line Items Table Header
      doc.rect(40, y, 515, 22).fill(primaryColor)
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
      doc.text('Item / Service Description', 45, y + 6)
      doc.text('SAC/HSN', 210, y + 6)
      doc.text('Qty', 270, y + 6, { align: 'right' })
      doc.text('Rate (₹)', 330, y + 6, { align: 'right' })
      doc.text('GST %', 400, y + 6, { align: 'right' })
      doc.text('Total (₹)', 480, y + 6, { align: 'right' })

      y += 22

      // Line Items Rows
      const items = invoice.items || []
      items.forEach((item, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : lightBg
        doc.rect(40, y, 515, 22).fill(bg)

        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold')
        doc.text(item.name || item.description || 'Service', 45, y + 6, { width: 160, ellipsis: true })
        doc.font('Helvetica').fillColor('#4b5563')
        doc.text(item.sacHsn || '998311', 210, y + 6)
        doc.text(String(item.quantity || 1), 250, y + 6, { width: 40, align: 'right' })
        doc.text((item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 300, y + 6, { width: 60, align: 'right' })
        doc.text(`${item.gstRate || 18}%`, 380, y + 6, { width: 40, align: 'right' })

        const lineTot = item.lineTotal || item.amount || ((item.quantity || 1) * (item.unitPrice || 0))
        doc.fillColor(darkColor).font('Helvetica-Bold')
        doc.text(lineTot.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 440, y + 6, { width: 105, align: 'right' })

        y += 22
      })

      y += 10
      doc.rect(40, y, 515, 1).fill(borderColor)
      y += 10

      // Totals Box (Right Side)
      const subtotal = invoice.subtotal || 0
      const cgst = invoice.cgstTotal || 0
      const sgst = invoice.sgstTotal || 0
      const igst = invoice.igstTotal || 0
      const taxSum = invoice.tax || (cgst + sgst + igst)
      const total = invoice.total || (subtotal + taxSum)
      const amountPaid = invoice.amountPaid || 0
      const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : (total - amountPaid)

      const totalsX = 330
      doc.fontSize(9).font('Helvetica').fillColor(darkColor)

      doc.text('Taxable Subtotal:', totalsX, y)
      doc.text(`₹ ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })
      y += 16

      if (igst > 0) {
        doc.text('IGST Total:', totalsX, y)
        doc.text(`₹ ${igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })
        y += 16
      } else {
        doc.text('CGST Total:', totalsX, y)
        doc.text(`₹ ${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })
        y += 16
        doc.text('SGST Total:', totalsX, y)
        doc.text(`₹ ${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })
        y += 16
      }

      doc.rect(totalsX, y, 225, 1).fill(borderColor)
      y += 6

      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor)
      doc.text('Grand Total:', totalsX, y)
      doc.text(`₹ ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })
      y += 18

      doc.fontSize(9).font('Helvetica').fillColor('#16a34a')
      doc.text('Amount Paid:', totalsX, y)
      doc.text(`₹ ${amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })
      y += 16

      doc.fontSize(10).font('Helvetica-Bold').fillColor(balanceDue > 0 ? '#dc2626' : '#16a34a')
      doc.text('Balance Due:', totalsX, y)
      doc.text(`₹ ${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, y, { align: 'right' })

      // Left side: Bank Details & Notes
      let leftY = y - 80
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkColor).text('PAYMENT INSTRUCTIONS:', 40, leftY)
      leftY += 14
      doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563')
      const bank = invoice.organizationSnapshot?.bankDetails || {}
      doc.text(`Bank Name: ${bank.bankName || 'HDFC Bank Ltd'}`, 40, leftY)
      leftY += 12
      doc.text(`A/C Number: ${bank.accountNumber || '50200012345678'}`, 40, leftY)
      leftY += 12
      doc.text(`IFSC Code: ${bank.ifscCode || 'HDFC0001234'}`, 40, leftY)

      y += 35
      doc.rect(40, y, 515, 1).fill(borderColor)
      y += 10

      if (invoice.notes) {
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(darkColor).text('Notes:', 40, y)
        doc.font('Helvetica').fillColor('#4b5563').text(invoice.notes, 40, y + 12, { width: 515 })
        y += 30
      }

      // Footer
      doc.fontSize(8).fillColor('#9ca3af').text('This is a computer-generated tax invoice issued by Krishpo Digital Marketing Management Platform.', 40, 780, { align: 'center' })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
