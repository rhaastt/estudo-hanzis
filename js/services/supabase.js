import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://qtlxhlswfahdqtadbssc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k0bhnVWbVbWd0KF_n18BDA_9xA2C1Xb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
