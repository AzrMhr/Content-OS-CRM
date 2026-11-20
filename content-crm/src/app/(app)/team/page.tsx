import { redirect } from "next/navigation";
import { removeMember, setRole } from "@/app/actions/team";
import { ConfirmSubmit, SubmitButton } from "@/components/confirm-submit";
import {
  Badge,
  Card,
  CardHeader,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { isAdmin, requireProfile } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";
import { shortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Team · Content CRM" };

export default async function TeamPage() {
  const profile = await requireProfile();
  if (!isAdmin(profile)) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const members = (data ?? []) as Profile[];
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Team"
        subtitle="Who has access, and what they can do."
      />

      <Card className="mb-5">
        <CardHeader title="How access works" />
        <ul className="space-y-2 px-5 py-4 text-sm text-ink-600">
          {USER_ROLES.map((role) => (
            <li key={role.value} className="flex items-start gap-2">
              <Badge tone={role.value === "admin" ? "violet" : role.value === "editor" ? "blue" : "zinc"}>
                {role.label}
              </Badge>
              <span>{role.blurb}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-ink-100 px-5 py-3 text-xs text-ink-400">
          To add someone, send them the app URL and have them create an account. They arrive as a
          viewer, then you promote them here. Row level security in Postgres enforces this, so a
          viewer cannot write even if they call the database directly.
        </p>
      </Card>

      <Card>
        <CardHeader title={`${members.length} ${members.length === 1 ? "member" : "members"}`} />
        <Table>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Role</Th>
              <Th align="right">Joined</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.id === profile.id;
              const isLastAdmin = member.role === "admin" && adminCount <= 1;

              return (
                <tr key={member.id} className="hover:bg-ink-50">
                  <Td>
                    <span className="font-medium text-ink-900">
                      {member.full_name ?? member.email ?? "Teammate"}
                    </span>
                    {isSelf && <span className="ml-1.5 text-xs text-ink-400">you</span>}
                    <span className="block text-xs text-ink-400">{member.email}</span>
                  </Td>
                  <Td>
                    <form action={setRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={member.id} />
                      <Select
                        name="role"
                        defaultValue={member.role}
                        disabled={isLastAdmin}
                        className="h-8 w-28 py-0 text-xs"
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </Select>
                      {!isLastAdmin && (
                        <SubmitButton variant="ghost" size="sm">
                          Set
                        </SubmitButton>
                      )}
                    </form>
                    {isLastAdmin && (
                      <span className="text-xs text-ink-400">Last admin, cannot change</span>
                    )}
                  </Td>
                  <Td align="right" className="whitespace-nowrap text-ink-600">
                    {shortDate(member.created_at.slice(0, 10))}
                  </Td>
                  <Td align="right">
                    {!isSelf && (
                      <form action={removeMember}>
                        <input type="hidden" name="id" value={member.id} />
                        <ConfirmSubmit
                          message={`Revoke access for ${member.full_name ?? member.email}? Their login stays in Supabase until you delete it there.`}
                        >
                          Revoke
                        </ConfirmSubmit>
                      </form>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
