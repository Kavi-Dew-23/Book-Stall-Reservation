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
                  <Cell fill="#F44336" /> {/* Reserved - Red */}
                  <Cell fill="#4CAF50" /> {/* Available - Green */}
                  {stats.maintenanceStalls > 0 && (
                    <Cell fill="#9E9E9E" />
                  )}{" "}
                  {/* Maintenance - Grey */}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Reservations List (REAL DATA) */}
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

// -------------------------------------
// --- Stat Card Component ---
// -------------------------------------
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


// 2nd version

// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   LayoutGrid,
//   CheckSquare,
//   ClipboardList,
//   Users,
//   Clock,
//   ArrowRight,
//   Map, // Added for the new link
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
// } from "recharts";
// import API from "../services/api"; // For when you're ready to connect

// // --- Type Definitions ---
// // Our frontend Stall object
// type StallStatus = "Available" | "Reserved" | "Maintenance";
// type StallSize = "Small" | "Medium" | "Large";

// interface Stall {
//   id: string;
//   name: string;
//   size: StallSize;
//   status: StallStatus;
//   publisherName?: string;
// }

// // The raw data structure from the backend
// interface BackendStall {
//   id: string;
//   type: "small" | "medium" | "large";
//   isReserved: boolean;
//   reservedBy?: string | null;
//   publisherName?: string | null;
// }

// // Stats for the top cards
// interface DashboardStats {
//   totalStalls: number;
//   reservedStalls: number;
//   availableStalls: number;
//   totalPublishers: number; // This will remain mock data
//   maintenanceStalls: number;
// }

// // For the pie chart
// interface ChartDataItem {
//   name: string;
//   value: number;
//   [key: string]: any; // To satisfy recharts type
// }

// // For the recent reservations list (still mock)
// interface RecentReservation {
//   id: string;
//   publisherName: string;
//   stalls: string[];
//   reservationDate: string; // ISO string
// }

// // --- Mock Data (for development) ---
// const mockRecentReservations: RecentReservation[] = [
//   {
//     id: "res-001",
//     publisherName: "Book Co. Lanka",
//     stalls: ["S2"],
//     reservationDate: "2025-10-20T10:30:00Z",
//   },
//   {
//     id: "res-002",
//     publisherName: "Readers Ltd.",
//     stalls: ["L5"],
//     reservationDate: "2025-10-19T14:15:00Z",
//   },
//   {
//     id: "res-003",
//     publisherName: "Pages Inc.",
//     stalls: ["S7"],
//     reservationDate: "2025-10-19T09:00:00Z",
//   },
// ];
// // --- End Mock Data ---

// /**
//  * Translates backend data (from Firestore) into the format our frontend UI needs
//  */
// const translateBackendStall = (beStall: BackendStall): Stall => {
//   // We explicitly type sizeMap to tell TypeScript its values are of type StallSize
//   const sizeMap: Record<"small" | "medium" | "large", StallSize> = {
//     small: "Small",
//     medium: "Medium",
//     large: "Large",
//   };
  
//   // Note: The backend doesn't have a "Maintenance" status.
//   // We'll assume if it's not reserved, it's available.
//   const status: StallStatus = beStall.isReserved ? "Reserved" : "Available";

//   return {
//     id: beStall.id,
//     name: beStall.id,
//     size: sizeMap[beStall.type],
//     status: status,
//     publisherName: beStall.publisherName || undefined,
//   };
// };

// // -------------------------------------
// // --- Main Dashboard Page Component ---
// // -------------------------------------
// export default function DashboardPage() {
//   // We will hold stats and chart data, the list will be mock
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [chartData, setChartData] = useState<ChartDataItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // --- REAL API CALL ---
//         const response = await API.get("/reservations/stalls");
        
//         // --- Start of Fix ---
//         // The duplicate 'return' block was removed from here.
        
//         // 1. Translate backend data
//         const backendStalls: BackendStall[] = response.data;
//         const frontendStalls: Stall[] = backendStalls.map(translateBackendStall);
//         const totalStalls = frontendStalls.length;
        
//         // 2. Calculate Stats from real data
//         const reservedStalls = frontendStalls.filter(
//           (s) => s.status === "Reserved"
//         ).length;
//         // --- End of Fix ---

//         const availableStalls = frontendStalls.filter(
//           (s) => s.status === "Available"
//         ).length;
//         // Backend doesn't support this, so it's 0
//         const maintenanceStalls = frontendStalls.filter(
//           (s) => s.status === "Maintenance"
//         ).length; 

//         const calculatedStats: DashboardStats = {
//           totalStalls,
//           reservedStalls,
//           availableStalls,
//           maintenanceStalls,
//           totalPublishers: 112, // This is still mock data
//         };
//         setStats(calculatedStats);

//         // 3. Create Chart Data from real data
//         const calculatedChartData: ChartDataItem[] = [
//           { name: "Reserved", value: reservedStalls },
//           { name: "Available", value: availableStalls },
//           // We only add maintenance if it's greater than 0
//         ];
//         if (maintenanceStalls > 0) {
//           calculatedChartData.push({ name: "Maintenance", value: maintenanceStalls });
//         }
//         setChartData(calculatedChartData);
        
//         // --- END REAL API CALL ---

//       } catch (err) {
//         console.error("Failed to fetch dashboard data:", err);
//         setError("Failed to fetch dashboard data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, []); // Runs once on component mount

//   if (loading) {
//     return <p className="text-center py-10">Loading dashboard...</p>;
//   }

//   if (error || !stats) {
//     return <p className="text-center py-10 text-red-500">{error}</p>;
//   }

//   return (
//     <div>
//       <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
//       {/* --- Stat Cards --- */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//         <StatCard
//           title="Total Stalls"
//           value={stats.totalStalls}
//           Icon={LayoutGrid}
//           color="text-blue-500"
//           bgColor="bg-blue-50"
//         />
//         <StatCard
//           title="Reserved Stalls"
//           value={stats.reservedStalls}
//           Icon={CheckSquare}
//           color="text-red-500"
//           bgColor="bg-red-50"
//         />
//         <StatCard
//           title="Available Stalls"
//           value={stats.availableStalls}
//           Icon={ClipboardList}
//           color="text-green-500"
//           bgColor="bg-green-50"
//         />
//         <StatCard
//           title="Total Publishers"
//           value={stats.totalPublishers}
//           Icon={Users}
//           color="text-yellow-500"
//           bgColor="bg-yellow-50"
//         />
//       </div>

//       {/* --- Main Content Area (Chart & Recent List) --- */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
//         {/* Stall Status Chart */}
//         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-xl font-bold">Stall Status</h2>
//             <Link
//               to="/stalls"
//               state={{ defaultView: "Map" }} // Optional: to open map view
//               className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
//             >
//               View Map
//               <Map className="w-4 h-4" />
//             </Link>
//           </div>
//           <div style={{ width: "100%", height: 300 }}>
//             <ResponsiveContainer>
//               <PieChart>
//                 <Pie
//                   data={chartData}
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={100}
//                   fill="#8884d8"
//                   dataKey="value"
//                   label={(entry) => `${entry.name} (${entry.value})`}
//                 >
//                   <Cell fill="#F44336" /> {/* Reserved - Red */}
//                   <Cell fill="#4CAF50" /> {/* Available - Green */}
//                   {stats.maintenanceStalls > 0 && <Cell fill="#9E9E9E" />} {/* Maintenance - Grey */}
//                 </Pie>
//                 <Tooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Recent Reservations List (STILL MOCK DATA) */}
//         <div className="bg-white p-6 rounded-xl shadow-md">
//           <h2 className="text-xl font-bold mb-4">Recent Reservations</h2>
//           <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md mb-4">
//             Note: This list is using mock data. A backend endpoint is required to show real data.
//           </p>
//           <div className="space-y-4">
//             {mockRecentReservations.length === 0 ? (
//               <p className="text-gray-500">No recent reservations.</p>
//             ) : (
//               mockRecentReservations.map((res) => (
//                 <div key={res.id} className="flex items-center gap-3">
//                   <div className="p-2 bg-gray-100 rounded-full">
//                     <Clock className="w-5 h-5 text-gray-500" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-800">
//                       {res.publisherName}
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       Booked {res.stalls.join(", ")}
//                     </p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//           <Link
//             to="/reservations"
//             className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-6"
//           >
//             View All Reservations
//             <ArrowRight className="w-4 h-4" />
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stat Card Component ---
// // -------------------------------------
// function StatCard({
//   title,
//   value,
//   Icon,
//   color,
//   bgColor,
// }: {
//   title: string;
//   value: number | string;
//   Icon: React.ElementType;
//   color: string;
//   bgColor: string;
// }) {
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
//       <div className={`p-3 rounded-full ${bgColor}`}>
//         <Icon className={`w-6 h-6 ${color}`} />
//       </div>
//       <div>
//         <p className="text-sm font-medium text-gray-500">{title}</p>
//         <p className="text-2xl font-bold text-gray-900">{value}</p>
//       </div>
//     </div>
//   );
// }



// //1st version 

// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   LayoutGrid,
//   CheckSquare,
//   ClipboardList,
//   Users,
//   Clock,
//   ArrowRight,
//   Map, // Import the Map icon
// } from "lucide-react";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
// } from "recharts";
// //import API from "../services/api"; // For when you're ready to connect

// // --- Type Definitions ---
// interface DashboardStats {
//   totalStalls: number;
//   reservedStalls: number;
//   availableStalls: number;
//   totalPublishers: number;
// }

// interface ChartDataItem {
//   name: string;
//   value: number;
//   [key: string]: any; // Add index signature for recharts compatibility
// }

// interface RecentReservation {
//   id: string;
//   publisherName: string;
//   stalls: string[];
//   reservationDate: string; // ISO string
// }

// // --- Mock Data (for development) ---
// const mockStats: DashboardStats = {
//   totalStalls: 150,
//   reservedStalls: 95,
//   availableStalls: 52, // 150 - 95 - 3
//   totalPublishers: 112,
// };

// const mockChartData: ChartDataItem[] = [
//   { name: "Reserved", value: 95 },
//   { name: "Available", value: 52 },
//   { name: "Maintenance", value: 3 },
// ];

// const mockRecentReservations: RecentReservation[] = [
//   {
//     id: "res-001",
//     publisherName: "Book Co. Lanka",
//     stalls: ["A-01", "A-02"],
//     reservationDate: "2025-10-20T10:30:00Z",
//   },
//   {
//     id: "res-002",
//     publisherName: "Readers Ltd.",
//     stalls: ["B-03"],
//     reservationDate: "2025-10-19T14:15:00Z",
//   },
//   {
//     id: "res-003",
//     publisherName: "Pages Inc.",
//     stalls: ["C-11"],
//     reservationDate: "2025-10-19T09:00:00Z",
//   },
//   {
//     id: "res-004",
//     publisherName: "Colombo Books",
//     stalls: ["A-05"],
//     reservationDate: "2025-10-18T17:45:00Z",
//   },
//   {
//     id: "res-005",
//     publisherName: "Galle Publishers",
//     stalls: ["D-01"],
//     reservationDate: "2025-10-18T11:00:00Z",
//   },
// ];
// // --- End Mock Data ---

// // -------------------------------------
// // --- Main Dashboard Page Component ---
// // -------------------------------------
// export default function DashboardPage() {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [chartData, setChartData] = useState<ChartDataItem[]>([]);
//   const [recentReservations, setRecentReservations] = useState<
//     RecentReservation[]
//   >([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // --- DEVELOPMENT: Using Mock Data ---
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
//         setStats(mockStats);
//         setChartData(mockChartData);
//         setRecentReservations(mockRecentReservations);
//         // --- END DEVELOPMENT ---

//         /* --- PRODUCTION: Real API Call (uncomment when ready) ---
//         // You'd likely need to fetch from multiple endpoints
//         const statsRes = await API.get("/dashboard/stats");
//         const chartRes = await API.get("/dashboard/chart-data");
//         const recentRes = await API.get("/reservations?limit=5");
        
//         setStats(statsRes.data);
//         setChartData(chartRes.data);
//         setRecentReservations(recentRes.data);
//         */
//       } catch (err) {
//         console.error("Failed to fetch dashboard data:", err);
//         setError("Failed to fetch dashboard data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDashboardData();
//   }, []); // Runs once on component mount

//   if (loading) {
//     return <p className="text-center py-10">Loading dashboard...</p>;
//   }

//   if (error || !stats) {
//     return <p className="text-center py-10 text-red-500">{error}</p>;
//   }

//   return (
//     <div>
//       <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
//       {/* --- Stat Cards --- */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//         <StatCard
//           title="Total Stalls"
//           value={stats.totalStalls}
//           Icon={LayoutGrid}
//           color="text-blue-500"
//           bgColor="bg-blue-50"
//         />
//         <StatCard
//           title="Reserved Stalls"
//           value={stats.reservedStalls}
//           Icon={CheckSquare}
//           color="text-red-500"
//           bgColor="bg-red-50"
//         />
//         <StatCard
//           title="Available Stalls"
//           value={stats.availableStalls}
//           Icon={ClipboardList}
//           color="text-green-500"
//           bgColor="bg-green-5a0"
//         />
//         <StatCard
//           title="Total Publishers"
//           value={stats.totalPublishers}
//           Icon={Users}
//           color="text-yellow-500"
//           bgColor="bg-yellow-50"
//         />
//       </div>

//       {/* --- Main Content Area (Chart & Recent List) --- */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
//         {/* Stall Status Chart */}
//         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
//           <div>
//             <h2 className="text-xl font-bold mb-4">Stall Status</h2>
//             <div style={{ width: "100%", height: 300 }}>
//               <ResponsiveContainer>
//                 <PieChart>
//                   <Pie
//                     data={chartData}
//                     cx="50%"
//                     cy="50%"
//                     outerRadius={100}
//                     fill="#8884d8"
//                     dataKey="value"
//                     //label={(entry) => `${entry.name} (${entry.value})`}
//                   >
//                     <Cell fill="#F44336" /> {/* Reserved - Red */}
//                     <Cell fill="#4CAF50" /> {/* Available - Green */}
//                     <Cell fill="#9E9E9E" /> {/* Maintenance - Grey */}
//                   </Pie>
//                   <Tooltip />
//                   <Legend />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//           {/* --- NEWLY ADDED LINK --- */}
//           <Link
//             to="/stalls"
//             className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-4"
//           >
//             <Map className="w-4 h-4" />
//             View Stall Map & Manage
//           </Link>
//         </div>

//         {/* Recent Reservations List */}
//         <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
//           <div>
//             <h2 className="text-xl font-bold mb-4">Recent Reservations</h2>
//             <div className="space-y-4">
//               {recentReservations.length === 0 ? (
//                 <p className="text-gray-500">No recent reservations.</p>
//               ) : (
//                 recentReservations.map((res) => (
//                   <div key={res.id} className="flex items-center gap-3">
//                     <div className="p-2 bg-gray-100 rounded-full">
//                       <Clock className="w-5 h-5 text-gray-500" />
//                     </div>
//                     <div>
//                       <p className="font-medium text-gray-800">
//                         {res.publisherName}
//                       </p>
//                       <p className="text-sm text-gray-500">
//                         Booked {res.stalls.join(", ")}
//                       </p>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//           <Link
//             to="/reservations"
//             className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-6"
//           >
//             View All Reservations
//             <ArrowRight className="w-4 h-4" />
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stat Card Component ---
// // -------------------------------------
// function StatCard({
//   title,
//   value,
//   Icon,
//   color,
//   bgColor,
// }: {
//   title: string;
//   value: number | string;
//   Icon: React.ElementType;
//   color: string;
//   bgColor: string;
// }) {
//   return (
//     <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
//       <div className={`p-3 rounded-full ${bgColor}`}>
//         <Icon className={`w-6 h-6 ${color}`} />
//       </div>
//       <div>
//         <p className="text-sm font-medium text-gray-500">{title}</p>
//         <p className="text-2xl font-bold text-gray-900">{value}</p>
//       </div>
//     </div>
//   );
// }