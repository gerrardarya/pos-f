import type { Role } from "@/types/database";

export function roleLabel(role: Role): string {
  return role === "admin" ? "Admin" : "Staf";
}
