const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send summary email to service dept and customer
 */
exports.sendSummaryEmails = async ({ toService, toCustomer, summary, imagePaths }) => {
  try {
    // Build image URLs for the service department email
    const imageLinks = imagePaths && imagePaths.length > 0
      ? imagePaths.map(name => `${process.env.SERVER_BASE_URL}/uploads/${name}`).join('\n')
      : 'No images uploaded.';

    // ---------- SERVICE DEPARTMENT EMAIL ----------
    const serviceMailOptions = {
      from: `"Allan’s Virtual Tech" <${process.env.EMAIL_USER}>`,
      to: toService,
      subject: `Customer Enquiry: ${toCustomer.name || 'Unknown'}`,
      text: `
New chat enquiry received:

Name: ${toCustomer.name || 'N/A'}
Email: ${toCustomer.email || 'N/A'}
Phone: ${toCustomer.phone || 'N/A'}
Address: ${toCustomer.address || 'N/A'}
Access Info: ${toCustomer.accessInfo || 'N/A'}

Summary:
${summary || 'No summary provided.'}

Uploaded Images:
${imageLinks}
      `.trim()
    };

    // ---------- CUSTOMER EMAIL ----------
    const customerMailOptions = {
      from: `"Allan’s Virtual Tech" <${process.env.EMAIL_USER}>`,
      to: toCustomer.email,
      subject: `Thanks for your enquiry with Allan’s Pool Shop`,
      text: `
Hi ${toCustomer.name || 'there'},

Thanks for your message. One of our technicians will be in touch shortly to confirm your booking or assist with your enquiry.

Here’s a summary of what you sent:

${summary || 'No summary provided.'}

If you have any questions in the meantime, feel free to call us.

Best regards,  
Allan’s Pool Shop
      `.trim()
    };

    // Send both emails in parallel
    await Promise.all([
      transporter.sendMail(serviceMailOptions),
      transporter.sendMail(customerMailOptions)
    ]);

    console.log('✅ Emails sent to both service and customer');
  } catch (err) {
    console.error('❌ Error sending emails:', err);
  }
};
