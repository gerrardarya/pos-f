import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffFormDialog } from "./_components/staff-form-dialog";
import { RoleSelectCell } from "./_components/role-select-cell";
import { DeleteStaffButton } from "./_components/delete-staff-button";
import { formatDate } from "@/lib/format";

export default async function StaffPage() {
  const currentUser = await requireRole("admin");
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  const admin = createAdminClient();
  const { data: usersResult } = await admin.auth.admin.listUsers();
  const emailById = new Map(
    (usersResult?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Staf</h1>
        <StaffFormDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(profiles ?? []).map((profile) => {
              const isSelf = profile.id === currentUser.id;
              return (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    {profile.name}
                    {isSelf && (
                      <Badge variant="secondary" className="ml-2">
                        Anda
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {emailById.get(profile.id) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RoleSelectCell
                      userId={profile.id}
                      role={profile.role}
                      disabled={isSelf}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(profile.created_at)}
                  </TableCell>
                  <TableCell>
                    <DeleteStaffButton
                      userId={profile.id}
                      name={profile.name}
                      disabled={isSelf}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
