-- Seed default support contact settings
INSERT INTO site_settings (key, value) VALUES
  ('support_phone', '+9118001234567'),
  ('support_phone_label', '1800-123-4567 (Toll free)'),
  ('support_email', 'support@miiam.in'),
  ('support_whatsapp', '+9118001234567'),
  ('support_twitter', 'https://twitter.com/miiam_in'),
  ('support_instagram', 'https://instagram.com/miiam_in'),
  ('support_facebook', 'https://facebook.com/miiam.in'),
  ('support_response_time', '2 mins'),
  ('support_email_response_time', '24 hours')
ON CONFLICT (key) DO NOTHING;
