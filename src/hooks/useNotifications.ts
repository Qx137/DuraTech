import { supabase } from "@/integrations/supabase/client";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  data?: any
) {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      data,
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}
