import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nwbcsnlulsajvbumqzen.supabase.co";
const supabaseAnonKey = "sb_publishable_yo9S8eRQUk1yShXmoc_ngQ_3h9HR1CX";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);