import { supabase } from "@/lib/supabase";

export async function getUserStatus() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return {
      user: null,
      status: "guest",
      member: null,
      admin: null,
      role: null,
      isApproved: false,
      isAdmin: false,
    };
  }

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!member) {
    return {
      user,
      status: "pending",
      member: null,
      admin,
      role: admin?.role || null,
      isApproved: false,
      isAdmin: !!admin,
    };
  }

  if (member.approved !== true) {
    return {
      user,
      status: "pending",
      member,
      admin,
      role: admin?.role || null,
      isApproved: false,
      isAdmin: !!admin,
    };
  }

  return {
    user,
    status: "approved",
    member,
    admin,
    role: admin?.role || null,
    isApproved: true,
    isAdmin: !!admin,
  };
}