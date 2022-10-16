module.exports = ({ env }) => ({
  email: {
    provider: "smtp",
    providerOptions: {
      host: process.env.ADMIN_EMAIL_HOST,
      port: "465",
      secure: true,
      username: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_EMAIL_PASSWORD,
      rejectUnauthorized: false,
      rejectTLS: false,
      requireTLS: false,
      connectionTimeout: 1,
    },
    settings: {
      defaultFrom: process.env.ADMIN_EMAIL,
      defaultReplyTo: process.env.ADMIN_EMAIL,
      testAddress: process.env.ADMIN_EMAIL,
    },
  },
});
