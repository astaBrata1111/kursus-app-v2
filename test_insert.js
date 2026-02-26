import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yaxrbkxnczoqnmpegzgw.supabase.co'\;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlheHJia3huY3pvcW5tcGVnemd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzY5MTcsImV4cCI6MjA4NDE1MjkxN30.FXsPVakqOKLvMPwbNIpwcW7jkY_OLNj5k1OyaHP0ts8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const payload = [{
    nama_kelas: 'Test Insert Error',
    jenis_kelas: 'General',
    hari: 'Senin',
    jam_mulai: '10:00',
    jam_selesai: '11:00'
  }];
  
  console.log("Triggering Insert...");
  const { data, error } = await supabase.from('sessions').insert(payload);
  
  console.log("Insert response Data:", data);
  console.log("Insert response Error:", error);
}

check();
