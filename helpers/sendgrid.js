// using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
const msg = {
    to: 'mohamedronaldohenry@gmail.com',
    from: 'mohamedronaldohenry@gmail.com',
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
sgMail.send(msg);