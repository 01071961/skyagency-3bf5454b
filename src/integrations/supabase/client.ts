import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pfqhspnyejzohxwaqnyb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcWhzcG55ZWp6b2h4d2FxbnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQ2NjksImV4cCI6MjA4NDUzMDY2OX0.yuFMCxVKrD4we1LlPXWBx3vETi2OIcurG7DjtLSTXB4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
