import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yaxrbkxnczoqnmpegzgw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheHJia3huY3pvcW5tcGVnemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzY5MTcsImV4cCI6MjA4NDE1MjkxN30.FXsPVakqOKLvMPwbNIpwcW7jkY_OLNj5k1OyaHP0ts8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Signing in...");
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email: 'admin@test.com', password: '123456' });

  if (signInError) {
    console.error('Sign in error:', signInError.message);
    return;
  }

  const user = authData.user;
  console.log("Logged in user ID:", user.id);

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles').select('role, is_active').eq('id', user.id).single();

  console.log('Profile fetch result:', profile);
  console.log('Profile fetch error:', profileError);
}

check();
