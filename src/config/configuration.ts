export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
});
