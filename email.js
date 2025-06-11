const nodemailer = require('nodemailer');

exports.sendLeadEmail = async ({ name, email, phone, address, accessInfo, summary, imageUrls = [], isCustomerCopy = false }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS
    }
  });

  const isValidEmail = (value) => typeof value === 'string' && value.includes('@');

  const recipient = isCustomerCopy && isValidEmail(email)
    ? email
    : process.env.RECIPIENT_EMAIL;

  const subject = isCustomerCopy
    ? 'We’ve received your service request'
    : `Customer Enquiry: ${name || 'Unknown'}`;

  const textBody = isCustomerCopy
    ? `Hi ${name || 'there'},\n\nThanks for contacting us! We’ve received your request and a technician will be in touch shortly.\n\n- The Allan’s Pool Shop Team`
    : `
CUSTOMER CONTACT DETAILS
------------------------
Name: ${name || 'Unknown'}
Email: ${email || 'Unknown'}
Phone: ${phone || 'Unknown'}
Address: ${address || 'Unknown'}
Access Info: ${accessInfo || 'None provided'}

CHAT SUMMARY
------------
${summary || 'No summary provided.'}

${imageUrls.length ? '\nIMAGES:\n' + imageUrls.join('\n') : ''}
  `;

  const htmlBody = isCustomerCopy
    ? `
      <p>Hi ${name || 'there'},</p>
      <p>Thanks for contacting us! We’ve received your request and a technician will be in touch shortly.</p>
      <p>- The Allan’s Pool Shop Team</p>
    `
    : `
      <h3>CUSTOMER CONTACT DETAILS</h3>
      <p><strong>Name:</strong> ${name || 'Unknown'}<br>
      <strong>Email:</strong> ${email || 'Unknown'}<br>
      <strong>Phone:</strong> ${phone || 'Unknown'}<br>
      <strong>Address:</strong> ${address || 'Unknown'}<br>
      <strong>Access Info:</strong> ${accessInfo || 'None provided'}</p>

      <h3>CHAT SUMMARY</h3>
      <p>${summary || 'No summary provided.'}</p>

      ${
        imageUrls.length
          ? `<h3>UPLOADED IMAGE${imageUrls.length > 1 ? 'S' : ''}</h3>` +
            imageUrls.map(url =>
              `<a href="${url}" target="_blank"><img src="${url}" style="max-width: 200px; margin: 8px; border-radius: 6px;" /></a>`
            ).join('')
          : ''
      }
    `;

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: recipient,
    subject,
    text: textBody,
    html: htmlBody
  };

  await transporter.sendMail(mailOptions);
};
