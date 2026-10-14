"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateStaffRole } from "../actions";
import type { Role } from "@/types/database";

export function RoleSelectCell({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      const result = await updateStaffRole(userId, value as Role);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Select value={role} onValueChange={handleChange} disabled={disabled || isPending}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="staff">Staf</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
