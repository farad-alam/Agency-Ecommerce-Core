import { Metadata } from "next";
import { requireAdmin } from "@/core/auth/helpers";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Team Settings",
};

export default async function TeamSettingsPage() {
  await requireAdmin();

  // Fetch current staff
  const staff = await db.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { createdAt: "desc" },
  });

  // Fetch pending invites
  const invites = await db.staffInvite.findMany({
    where: { acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Team & Permissions</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage staff access to the dashboard.</p>
        </div>
        {/* In a real app, this button opens a modal to POST /api/auth/invite */}
        <button className="px-4 py-2 bg-white text-black font-medium text-sm rounded-md hover:bg-zinc-200 transition-colors">
          Invite Member
        </button>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl">
          <div className="p-4 border-b border-white/[0.08] bg-white/[0.02]">
            <h2 className="text-sm font-medium text-white">Active Members</h2>
          </div>
          <div className="divide-y divide-white/[0.08]">
            {staff.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="font-medium text-zinc-200">{user.name || "Unknown"} {user.id === staff[0].id ? "(You)" : ""}</p>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                </div>
                <div>
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"} className={user.role === "ADMIN" ? "bg-indigo-500 hover:bg-indigo-600" : ""}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {invites.length > 0 && (
          <Card className="border-white/[0.08] bg-black/40 backdrop-blur-xl">
            <div className="p-4 border-b border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-sm font-medium text-white">Pending Invites</h2>
            </div>
            <div className="divide-y divide-white/[0.08]">
              {invites.map((invite) => (
                <div key={invite.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="font-medium text-zinc-200">{invite.email}</p>
                    <p className="text-sm text-zinc-400">
                      Sent {format(new Date(invite.createdAt), "MMM d, yyyy")} • Expires {format(new Date(invite.expiresAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <Badge variant="outline">{invite.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
