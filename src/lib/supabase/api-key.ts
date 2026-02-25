import { createClient } from "@supabase/supabase-js";

export async function createApiKeyClient(
  apiKey: string
): Promise<{ userId: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key", apiKey)
    .eq("active", true)
    .single();

  if (error || !data) return null;

  return { userId: data.user_id };
}
