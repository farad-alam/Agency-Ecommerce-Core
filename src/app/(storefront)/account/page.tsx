import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, User, LogOut } from "lucide-react";

export default async function AccountPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Account</h1>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8 border">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{session.user.name || "Customer"}</h2>
            <p className="text-gray-600">{session.user.email}</p>
            <p className="text-sm text-gray-400 mt-1 capitalize">Role: {session.user.role.toLowerCase()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/account/orders" className="group flex items-center gap-4 p-6 border rounded-lg hover:border-black transition-colors bg-white">
          <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
            <Package className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Order History</h3>
            <p className="text-sm text-gray-500">View and track your previous orders</p>
          </div>
        </Link>
        
        {/* Placeholder for Address management */}
        <div className="opacity-50 cursor-not-allowed group flex items-center gap-4 p-6 border rounded-lg bg-white">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Addresses (Coming Soon)</h3>
            <p className="text-sm text-gray-500">Manage shipping and billing addresses</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center md:text-left">
        <Link href="/api/auth/signout" className="inline-flex items-center gap-2 text-red-600 font-medium hover:underline">
          <LogOut className="w-4 h-4" /> Sign Out
        </Link>
      </div>
    </div>
  );
}
