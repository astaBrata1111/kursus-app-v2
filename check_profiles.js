import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yaxrbkxnczoqnmpegzgw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheHJia3huY3pvcW5tcGVnemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzY5MTcsImV4cCI6MjA4NDE1MjkxN30.FXsPVakqOKLvMPwbNIpwcW7jkY_OLNj5k1OyaHP0ts8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching profiles...");
  const { data, error } = await supabase.from('user_profiles').select('*');
  console.log('Profiles data:', JSON.stringify(data, null, 2));
  if (error) console.error('Profiles error:', error);
}

check();
