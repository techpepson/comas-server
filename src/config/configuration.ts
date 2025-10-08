export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  supabaseUrl: process.env.SUPABASE_PROJECT_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
});
