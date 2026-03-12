import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  productName: string;
  variantName?: string;
  quantity: number;
  productPrice: string;
  subtotal: string;
}

interface Order {
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: string;
  deliveryFee?: string;
  total: string;
  fulfillmentType: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  deliverySlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  paymentMethod: string;
  status: string;
}

export function generateReceipt(order: Order) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('OMEGA Afro Caribbean Superstore', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Your one-stop shop for authentic African and Caribbean groceries', 105, 27, { align: 'center' });
  
  // Receipt title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', 105, 40, { align: 'center' });
  
  // Order details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 55;
  
  doc.text(`Order Number: ${order.orderNumber}`, 20, yPos);
  yPos += 6;
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString('en-GB')}`, 20, yPos);
  yPos += 6;
  doc.text(`Status: ${order.status}`, 20, yPos);
  yPos += 10;
  
  // Customer details
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(`Name: ${order.customerName}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${order.customerEmail}`, 20, yPos);
  if (order.customerPhone) {
    yPos += 6;
    doc.text(`Phone: ${order.customerPhone}`, 20, yPos);
  }
  yPos += 10;
  
  // Delivery/Collection details
  doc.setFont('helvetica', 'bold');
  doc.text(order.fulfillmentType === 'DELIVERY' ? 'Delivery Information:' : 'Collection Information:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  
  if (order.fulfillmentType === 'DELIVERY' && order.address) {
    doc.text(`Address: ${order.address.line1}`, 20, yPos);
    yPos += 6;
    if (order.address.line2) {
      doc.text(`         ${order.address.line2}`, 20, yPos);
      yPos += 6;
    }
    doc.text(`         ${order.address.city}, ${order.address.postcode}`, 20, yPos);
    yPos += 6;
    
    if (order.deliverySlot) {
      doc.text(`Delivery Time: ${new Date(order.deliverySlot.date).toLocaleDateString('en-GB')}`, 20, yPos);
      yPos += 6;
      doc.text(`               ${order.deliverySlot.startTime} - ${order.deliverySlot.endTime}`, 20, yPos);
      yPos += 6;
    }
  } else {
    doc.text('Pick up in store', 20, yPos);
    yPos += 6;
  }
  
  yPos += 5;
  
  // Items table
  const items = order.items.map((item) => [
    item.productName + (item.variantName ? ` (${item.variantName})` : ''),
    item.quantity.toString(),
    `£${parseFloat(item.productPrice).toFixed(2)}`,
    `£${parseFloat(item.subtotal).toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Qty', 'Price', 'Subtotal']],
    body: items,
    theme: 'striped',
    headStyles: { fillColor: [22, 163, 74] }, // Primary green color
    styles: { fontSize: 9 },
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal:`, 140, finalY);
  doc.text(`£${parseFloat(order.subtotal).toFixed(2)}`, 180, finalY, { align: 'right' });
  
  if (order.deliveryFee && parseFloat(order.deliveryFee) > 0) {
    doc.text(`Delivery Fee:`, 140, finalY + 7);
    doc.text(`£${parseFloat(order.deliveryFee).toFixed(2)}`, 180, finalY + 7, { align: 'right' });
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total:`, 140, finalY + (order.deliveryFee && parseFloat(order.deliveryFee) > 0 ? 14 : 7));
  doc.text(`£${parseFloat(order.total).toFixed(2)}`, 180, finalY + (order.deliveryFee && parseFloat(order.deliveryFee) > 0 ? 14 : 7), { align: 'right' });
  
  // Payment method
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const paymentY = finalY + (order.deliveryFee && parseFloat(order.deliveryFee) > 0 ? 24 : 17);
  doc.text(`Payment Method: ${order.paymentMethod}`, 20, paymentY);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100);
  const footerY = 280;
  doc.text('Thank you for shopping with us!', 105, footerY, { align: 'center' });
  doc.text('For support, contact us at support@omegaafro.com', 105, footerY + 5, { align: 'center' });
  
  // Download
  doc.save(`receipt-${order.orderNumber}.pdf`);
}
