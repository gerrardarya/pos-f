"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/types/database";

export type StaffFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function createStaffAccount(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  await requireRole("admin");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "staff") as Role;

  if (!name) return { status: "error", message: "Nama wajib diisi." };
  if (!email) return { status: "error", message: "Email wajib diisi." };
  if (password.length < 8) {
    return { status: "error", message: "Kata sandi minimal 8 karakter." };
  }
  if (role !== "admin" && role !== "staff") {
    return { status: "error", message: "Peran tidak valid." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    if (error?.message.toLowerCase().includes("already been registered")) {
      return { status: "error", message: "Email tersebut sudah digunakan." };
    }
    return { status: "error", message: "Tidak dapat membuat akun." };
  }

  // handle_new_user (DB trigger) already inserted a default profile row for
  // this new auth user (role 'staff'); fill in the real name/role now.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ name, role })
    .eq("id", data.user.id);

  if (profileError) {
    return {
      status: "error",
      message: "Akun dibuat, tetapi nama/peran gagal diatur. Ubah di bawah.",
    };
  }

  revalidatePath("/staff");
  return { status: "success" };
}

export async function updateStaffRole(
  userId: string,
  role: Role
): Promise<{ error: string } | null> {
  const currentUser = await requireRole("admin");
  if (userId === currentUser.id) {
    return { error: "Anda tidak dapat mengubah peran Anda sendiri." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: "Tidak dapat mengubah peran." };

  revalidatePath("/staff");
  return null;
}

export async function deleteStaffAccount(
  userId: string
): Promise<{ error: string } | null> {
  const currentUser = await requireRole("admin");
  if (userId === currentUser.id) {
    return { error: "Anda tidak dapat menghapus akun Anda sendiri." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: "Tidak dapat menghapus akun." };

  revalidatePath("/staff");
  return null;
}
