import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  CheckSquare,
  ClipboardList,
  Users,
  Clock,
  ArrowRight,
  Map,
  RotateCcw, // Import refresh icon
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import API from "../services/api"; // Import with .ts

// --- Type Definitions ---
// This is our frontend stall object
type StallStatus = "Available" | "Reserved" | "Maintenance";
type StallSize = "Small" | "Medium" | "Large";

interface Stall {
  id: string;
  name: string;
  size: StallSize;
  status: StallStatus;
  publisherName?: string;
}

// This is the raw data from the backend's /stalls route
interface BackendStall {
  id: string; // This is the stall name (e.g., "S1")
  type: "small" | "medium" | "large";
  isReserved: boolean;
  reservedBy?: string | null;
  publisherName?: string | null;
  reservedAt?: string | null;
}

// This is the raw data from the backend's /reservations route
interface BackendReservation {
  id: string; // This is the reservation ID (e.g., "17629...")
  stalls: string[];
  publisherName: string;
  email: string;
  createdAt: string; // ISO string
}

// Stats for the top cards
interface DashboardStats {
  totalStalls: number;
  reservedStalls: number;
  availableStalls: number;
  maintenanceStalls: number;
  totalReservations: number; // New stat
}

// For the pie chart
interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: any; // To satisfy recharts type
}

// --- SOURCE OF TRUTH (Publisher's Map) ---
// This is the full list of all 24 stalls
const initialStalls: Stall[] = [
  // Small Stalls (10)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `S${i + 1}`,
    name: `S${i + 1}`,
    size: "Small" as StallSize,
    status: "Available" as StallStatus,
    publisherName: undefined,
  })),
  // Medium Stalls (8)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `M${i + 1}`,
    name: `M${i + 1}`,
    size: "Medium" as StallSize,
    status: "Available" as StallStatus,
    publisherName: undefined,
  })),
  // Large Stalls (6)
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `L${i + 1}`,
    name: `L${i + 1}`,
    size: "Large" as StallSize,
    status: "Available" as StallStatus,
    publisherName: undefined,
  })),
];
const TOTAL_STALL_COUNT = initialStalls.length; // 24

// -------------------------------------
// --- Main Dashboard Page Component ---
// -------------------------------------
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [recentReservations, setRecentReservations] = useState<
    BackendReservation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- Run API calls in parallel ---
      const [stallsResponse, reservationsResponse] = await Promise.all([
        API.get("/reservations/stalls"), // Gets all *reserved* stalls
        API.get("/reservations/admin/all"), // Gets all reservations
      ]);

      // --- 1. Process Stall Data ---
      const backendStalls: BackendStall[] = stallsResponse.data;
      const reservedStallsCount = backendStalls.filter(
        (s) => s.isReserved
      ).length;
      // Note: We can't count "Maintenance" from this endpoint yet
      const maintenanceStallsCount = 0;
      const availableStallsCount =
        TOTAL_STALL_COUNT - reservedStallsCount - maintenanceStallsCount;

      // --- 2. Process Reservation Data ---
      const allReservations: BackendReservation[] = reservationsResponse.data;
      const recentReservations = allReservations.slice(0, 5); // Get the 5 most recent
      setRecentReservations(recentReservations);

      // --- 3. Set Stats ---
      setStats({
        totalStalls: TOTAL_STALL_COUNT,
        reservedStalls: reservedStallsCount,
        availableStalls: availableStallsCount,
        maintenanceStalls: maintenanceStallsCount,
        totalReservations: allReservations.length, // New stat
      });

      // --- 4. Set Chart Data ---
      const calculatedChartData: ChartDataItem[] = [
        { name: "Reserved", value: reservedStallsCount },
        { name: "Available", value: availableStallsCount },
      ];
      if (maintenanceStallsCount > 0) {
        calculatedChartData.push({
          name: "Maintenance",
          value: maintenanceStallsCount,
        });
      }
      setChartData(calculatedChartData);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // Runs once on component mount

  if (loading) {
    return <p className="text-center py-10">Loading dashboard...</p>;
  }

  if (error || !stats) {
    return <p className="text-center py-10 text-red-500">{error}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 border transition"
        >
          <RotateCcw className="w-4 h-4" />
          Refresh Stats
        </button>
      </div>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Stalls"
          value={stats.totalStalls}
          Icon={LayoutGrid}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Reserved Stalls"
          value={stats.reservedStalls}
          Icon={CheckSquare}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Available Stalls"
          value={stats.availableStalls}
          Icon={ClipboardList}
          color="text-green-500"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Total Reservations"
          value={stats.totalReservations}
          Icon={Users}
          color="text-yellow-500"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* --- Main Content Area (Chart & Recent List) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stall Status Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Stall Status</h2>
            <Link
              to="/stalls" // Link to stalls page
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              View Map
              <Map className="w-4 h-4" />
            </Link>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={(entry) => `${entry.name} (${entry.value})`}
                >
                  <Cell fill="#F44336" />
                  <Cell fill="#4CAF50" /> 
                  {stats.maintenanceStalls > 0 && (
                    <Cell fill="#9E9E9E" />
                  )}{" "}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Recent Reservations</h2>
          <div className="space-y-4">
            {recentReservations.length === 0 ? (
              <p className="text-gray-500">No recent reservations.</p>
            ) : (
              recentReservations.map((res) => (
                <div key={res.id} className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {res.publisherName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Booked {res.stalls.join(", ")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/reservations"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-6"
          >
            View All Reservations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
// --- Stat Card Component ---
function StatCard({
  title,
  value,
  Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number | string;
  Icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
      <div className={`p-3 rounded-full ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}