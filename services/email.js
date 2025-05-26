const nodemailer = require('nodemailer');

exports.sendLeadEmail = async ({ name, email, phone, address, accessInfo, summary }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS
    }
  });

  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECIPIENT_EMAIL,
    subject: `Customer Enquiry: ${name || 'Unknown'}`,
    text: `
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
    `
  };

  await transporter.sendMail(mailOptions);
};
