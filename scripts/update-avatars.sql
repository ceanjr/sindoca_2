-- Update avatars for Célio Júnior and Sindy
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Update Célio Júnior's avatar
UPDATE profiles
SET avatar_url = '/images/eu.png'
WHERE email = 'celiojunior0110@gmail.com';

-- Update Sindy's avatar
UPDATE profiles
SET avatar_url = '/images/sindy.png'
WHERE email = 'sindyguimaraes.a@gmail.com';

-- Verify the updates
SELECT full_name, email, avatar_url 
FROM profiles
ORDER BY created_at;
