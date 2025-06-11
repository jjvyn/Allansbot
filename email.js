const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.sendLeadEmail = async ({
  name,
  email,
  phone,
  address,
  accessInfo,
  summary,
  imageUrls = [],
  isCustomerCopy = false
}) => {
  const to = isCustomerCopy ? email : process.env.SERVICE_EMAIL;
  const subject = isCustomerCopy
    ? 'Thanks for your enquiry with Allan’s Pool Shop'
    : `Customer Enquiry: ${name || 'Unknown'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px;">
      ${isCustomerCopy ? `
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for chatting with Allan’s Virtual Tech. Your request has been received and one of our team will be in touch shortly.</p>
      ` : `
        <p><strong>New lead received</strong></p>
        <p><strong>Name:</strong> ${name || 'N/A'}<br>
        <strong>Email:</strong> ${email || 'N/A'}<br>
        <strong>Phone:</strong> ${phone || 'N/A'}<br>
        <strong>Address:</strong> ${address || 'N/A'}<br>
        <strong>Access Info:</strong> ${accessInfo || 'N/A'}</p>
        <p><strong>Summary:</strong><br>${summary || 'N/A'}</p>
        ${imageUrls.length > 0
          ? `<p><strong>Image(s):</strong><br>${imageUrls.map(url => `<a href="${url}">${url}</a>`).join('<br>')}</p>`
          : `<p><em>No images submitted.</em></p>`}
      `}
      <p style="margin-top: 20px;">– Allan's Pool Shop</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Allan’s Pool Shop" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html
  });

  console.log(`📧 Email sent to ${to}`);
};
