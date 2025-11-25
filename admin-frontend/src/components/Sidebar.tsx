import { NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, CheckSquare } from "lucide-react";

export default function Sidebar() {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b">
        <span className="text-2xl font-bold text-blue-600">Admin Portal</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/dashboard" className={navLinkClasses}>
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/reservations" className={navLinkClasses}>
          <CalendarCheck className="h-5 w-5" />
          <span>Reservations</span>
        </NavLink>
        <NavLink to="/stalls" className={navLinkClasses}>
          <CheckSquare className="h-5 w-5" />
          <span>Stall Management</span>
        </NavLink>
      </nav>
    </aside>
  );
}