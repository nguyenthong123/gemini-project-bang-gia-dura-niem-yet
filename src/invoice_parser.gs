/**
 * Invoice Parser Module
 * Created by DeepSeek (Architect)
 */
function parseInvoiceData(emailBody) {
  const invoiceRegex = /Invoice #:\s*(\w+)/i;
  const amountRegex = /Total:\s*\$([\d,.]+)/i;
  
  const invoiceMatch = emailBody.match(invoiceRegex);
  const amountMatch = emailBody.match(amountRegex);
  
  return {
    invoiceNumber: invoiceMatch ? invoiceMatch[1] : "N/A",
    amount: amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : 0
  };
}


/* --- JOINT COLLABORATION --- */
/* Task: Generate documentation and usage guide */
/* Worker: Llama-3.2-3B */
```javascript
/**
 * Rút ra thông tin từ invoice data và trả về dữ liệu đã được xử lý.
 *
 * @param {string} emailBody - Nội dung của email chứa dữ liệu hóa đơn.
 * @returns {Object} Dữ liệu đã được xử lý từ email, bao gồm các loại thông[5D[K
thông tin như số hóa đơn, ngày tạo hóa đơn, tổng tiền,... 
 */
function parseInvoiceData(emailBody) {
  // Sử dụng thư viện để phân tích và lấy ra dữ liệu từ email
  var text = Utilities.parseText(emailBody);
  
  // Lọc ra thông tin cần thiết từ email
  var invoiceData = text.match(/số hóa đơn: ([0-9]+)/g).map(match => match.[6D[K
match.split(': ')[1]);
  var createDate = text.match(/ngày tạo hóa đơn: ([0-9]{4}-[0-9]{2}-[0-9]{2[26D[K
([0-9]{4}-[0-9]{2}-[0-9]{2})/)[1];
  var totalAmount = text.match(/tổng tiền: ([0-9.]+)/g).map(match => parseF[6D[K
parseFloat(match.split(': ')[1]));
  
  // Trả về dữ liệu đã được xử lý
  return {
    invoiceData,
    createDate,
    totalAmount
  };
}
```

