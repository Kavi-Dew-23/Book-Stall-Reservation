import { useState, useEffect, useMemo } from "react";
import { Search, MoreVertical, ChevronDown, RotateCcw } from "lucide-react";
import API from "../services/api"; // Import with .ts

// --- Type Definition ---
// This is the raw data from the backend's /reservations/admin/all route
interface BackendReservation {
  id: string; // This is the reservation ID (e.g., "17629...")
  stalls: string[];
  publisherName: string;
  email: string;
  createdAt: string; // ISO string
}

// -------------------------------------
// --- Main Reservations Page Component ---
// -------------------------------------
export default function ReservationsPage() {
  // --- State ---
  const [reservations, setReservations] = useState<BackendReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // Note: This filter is now local-only

  // State to manage which action menu is open
  const [activeActionMenu, setActiveActionMenu] = useState<{
    id: string;
    direction: "up" | "down";
  } | null>(null);

  // --- Data Fetching ---
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      // --- REAL API CALL ---
      const response = await API.get("/reservations/admin/all");
      setReservations(response.data);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      setError("Failed to fetch reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []); // Runs once on component mount

  // --- Filtering & Searching ---
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // 1. Filter by Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.publisherName.toLowerCase().includes(lowerSearch) ||
          res.email.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Note: Status filter is not applied as all are "Confirmed"
    // If backend adds a 'status' field, we can add:
    // if (statusFilter !== "All") { ... }

    return filtered;
  }, [reservations, searchTerm, statusFilter]);

  // --- Event Handlers ---
  const handleActionMenuToggle = (
    event: React.MouseEvent,
    reservationId: string
  ) => {
    // Check vertical position of the clicked button
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const isNearBottom = rect.top > window.innerHeight * 0.7;

    setActiveActionMenu((prev) => {
      if (prev?.id === reservationId) {
        return null; // Close if already open
      }
      return {
        id: reservationId,
        direction: isNearBottom ? "up" : "down",
      };
    });
  };

  // --- REAL ACTION: Cancel a Reservation ---
  const handleCancelReservation = async (reservationId: string) => {
    // Optimistic Update: Remove from UI immediately
    setReservations((prev) =>
      prev.filter((res) => res.id !== reservationId)
    );
    setActiveActionMenu(null); // Close the menu

    try {
      // --- REAL API CALL ---
      await API.delete(`/reservations/admin/cancel/${reservationId}`);
      // No need to refetch, our optimistic update is correct
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      // Rollback on error
      setError("Failed to cancel reservation. Please refresh.");
      // We don't add the item back, to avoid complexity.
      // A full refresh (fetchReservations()) is safer.
      fetchReservations();
    }
  };

  // --- Render ---
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Reservations</h1>

      {/* --- Controls: Search and Filter --- */}
      <div className="flex justify-between items-center mb-4">
        {/* Search Bar */}
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search by publisher or email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        <div className="flex gap-4">
          {/* Filter Dropdown (Local Only) */}
          <div className="relative">
            <select
              className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Reservations</option>
              {/* Add more statuses here if backend supports them */}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={fetchReservations}
            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Publisher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stalls
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reservation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10">
                  Loading reservations...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-red-500">
                  {error}
                </td>
              </tr>
            ) : filteredReservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No reservations found.
                </td>
              </tr>
            ) : (
              filteredReservations.map((res) => (
                <tr key={res.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {res.publisherName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {res.stalls.join(", ")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {new Date(res.createdAt).toLocaleDateString("en-LK")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{res.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}
                    >
                      Confirmed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => handleActionMenuToggle(e, res.id)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {/* Action Menu Dropdown */}
                      {activeActionMenu?.id === res.id && (
                        <div
                          className={`origin-top-right absolute right-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10
                          ${
                            activeActionMenu.direction === "up"
                              ? "bottom-full mb-2"
                              : "mt-2"
                          }`}
                        >
                          <div className="py-1">
                            <button
                              onClick={() => handleCancelReservation(res.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Cancel Reservation
                            </button>
                            {/* Add more actions here if needed */}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// // 1st version

// import { useState, useEffect, useMemo } from "react";
// import { Search, MoreVertical, ChevronDown } from "lucide-react";
// //import API from "../services/api"; // For when you're ready to connect

// // --- Type Definition ---
// // This interface should match the data structure from your backend
// interface Reservation {
//   id: string;
//   publisherName: string;
//   stalls: string[]; // e.g., ["A-01", "A-02"]
//   reservationDate: string; // ISO date string
//   contactEmail: string;
//   status: "Confirmed" | "Pending" | "Cancelled";
// }

// // --- Mock Data (for development) ---
// const mockReservations: Reservation[] = [
//   {
//     id: "res-001",
//     publisherName: "Book Co. Lanka",
//     stalls: ["A-01", "A-02"],
//     reservationDate: "2025-10-20T10:30:00Z",
//     contactEmail: "contact@bookco.lk",
//     status: "Confirmed",
//   },
//   {
//     id: "res-002",
//     publisherName: "Readers Ltd.",
//     stalls: ["B-03"],
//     reservationDate: "2025-10-19T14:15:00Z",
//     contactEmail: "info@readers.com",
//     status: "Confirmed",
//   },
//   {
//     id: "res-003",
//     publisherName: "Pages Inc.",
//     stalls: ["C-11", "C-12", "C-13"],
//     reservationDate: "2025-10-18T09:00:00Z",
//     contactEmail: "manager@pagesinc.com",
//     status: "Pending",
//   },
//   {
//     id: "res-004",
//     publisherName: "Colombo Books",
//     stalls: ["A-05"],
//     reservationDate: "2025-10-17T17:45:00Z",
//     contactEmail: "orders@colombobooks.com",
//     status: "Cancelled",
//   },
//   {
//     id: "res-005",
//     publisherName: "Galle Publishers",
//     stalls: ["D-01"],
//     reservationDate: "2025-10-16T11:00:00Z",
//     contactEmail: "gallepubs@gmail.com",
//     status: "Confirmed",
//   },
// ];
// // --- End Mock Data ---

// export default function ReservationsPage() {
//   // --- State ---
//   const [reservations, setReservations] = useState<Reservation[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("All");

//   // State to manage which action menu is open
//   // We'll change this to an object to also store the direction
//   const [activeActionMenu, setActiveActionMenu] = useState<{
//     id: string;
//     direction: "up" | "down";
//   } | null>(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchReservations = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // --- DEVELOPMENT: Using Mock Data ---
//         // Simulate network delay
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//         setReservations(mockReservations);
//         // --- END DEVELOPMENT ---

//         /* --- PRODUCTION: Real API Call (uncomment when ready) ---
//         const response = await API.get("/reservations");
//         setReservations(response.data);
//         */

//       } catch (err) {
//         console.error("Failed to fetch reservations:", err);
//         setError("Failed to fetch reservations.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReservations();
//   }, []); // Runs once on component mount

//   // --- Filtering & Searching ---
//   // useMemo ensures this only re-runs when the data or filters change
//   const filteredReservations = useMemo(() => {
//     let filtered = [...reservations];

//     // 1. Filter by Status
//     if (statusFilter !== "All") {
//       filtered = filtered.filter((res) => res.status === statusFilter);
//     }

//     // 2. Filter by Search Term
//     if (searchTerm) {
//       const lowerSearch = searchTerm.toLowerCase();
//       filtered = filtered.filter(
//         (res) =>
//           res.publisherName.toLowerCase().includes(lowerSearch) ||
//           res.contactEmail.toLowerCase().includes(lowerSearch)
//       );
//     }

//     return filtered;
//   }, [reservations, searchTerm, statusFilter]);

//   // --- Event Handlers ---
//   const handleActionMenuToggle = (
//     event: React.MouseEvent,
//     reservationId: string
//   ) => {
//     // If this menu is already open, just close it.
//     if (activeActionMenu?.id === reservationId) {
//       setActiveActionMenu(null);
//       return;
//     }

//     // Get the button's position
//     const button = event.currentTarget;
//     const rect = button.getBoundingClientRect();
    
//     // Get the viewport height
//     const viewportHeight = window.innerHeight;

//     // Decide direction: If button is in the bottom half of the screen, pop up.
//     const direction = rect.top > viewportHeight / 2 ? "up" : "down";

//     // Set the new state
//     setActiveActionMenu({ id: reservationId, direction: direction });
//   };

//   const handleAction = (
//     action: "View Details" | "Resend Email" | "Cancel",
//     reservationId: string
//   ) => {
//     console.log(`${action} reservation: ${reservationId}`);
//     setActiveActionMenu(null); // Close the menu

//     // --- DEVELOPMENT: Mock API Actions ---
//     // Simulate API call and update local state just for development
//     if (action === "Cancel") {
//       // Find the reservation and update its status
//       setReservations((prevReservations) =>
//         prevReservations.map((res) =>
//           res.id === reservationId ? { ...res, status: "Cancelled" } : res
//         )
//       );
//       console.log(
//         `--- DEV MODE: Reservation ${reservationId} status set to "Cancelled" locally. ---`
//       );
//     }

//     if (action === "Resend Email") {
//       // Just log a message
//       console.log(
//         `--- DEV MODE: Pretending to resend email for ${reservationId}... ---`
//       );
//     }

//     if (action === "View Details") {
//       // In a real app, you'd open a modal here. For now, log the data.
//       const reservation = reservations.find((res) => res.id === reservationId);
//       console.log("--- DEV MODE: Viewing details (in console): ---", reservation);
//     }
//     // --- END DEVELOPMENT ---

//     // Real API call would go here in production
//     /*
//     try {
//       if (action === "Cancel") {
//         await API.post(`/reservations/${reservationId}/cancel`);
//         // Then re-fetch or update state from response
//       }
//       // etc.
//     } catch (err) {
//       console.error(`Failed to ${action} reservation`, err);
//     }
//     */
//   };

//   // --- Helper to get status color ---
//   const getStatusBadge = (status: Reservation["status"]) => {
//     switch (status) {
//       case "Confirmed":
//         return "bg-green-100 text-green-800";
//       case "Pending":
//         return "bg-yellow-100 text-yellow-800";
//       case "Cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   // --- Render ---
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Manage Reservations</h1>

//       {/* --- Controls: Search and Filter --- */}
//       <div className="flex justify-between items-center mb-4">
//         {/* Search Bar */}
//         <div className="relative w-full max-w-xs">
//           <input
//             type="text"
//             placeholder="Search by publisher or email..."
//             className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//         </div>

//         {/* Filter Dropdown */}
//         <div className="relative">
//           <select
//             className="appearance-none w-40 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//           >
//             <option value="All">All Statuses</option>
//             <option value="Confirmed">Confirmed</option>
//             <option value="Pending">Pending</option>
//             <option value="Cancelled">Cancelled</option>
//           </select>
//           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//         </div>
//       </div>

//       {/* --- Data Table --- */}
//       <div className="bg-white rounded-lg shadow-md overflow-hidden">
//         <table className="w-full min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Publisher
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Stalls
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Reservation Date
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Contact Email
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//               <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {loading ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-10">
//                   Loading reservations...
//                 </td>
//               </tr>
//             ) : error ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-10 text-red-500">
//                   {error}
//                 </td>
//               </tr>
//             ) : filteredReservations.length === 0 ? (
//                <tr>
//                 <td colSpan={6} className="text-center py-10 text-gray-500">
//                   No reservations found.
//                 </td>
//               </tr>
//             ) : (
//               filteredReservations.map((res) => (
//                 <tr key={res.id}>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-gray-900">{res.publisherName}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-700">{res.stalls.join(", ")}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-700">
//                       {new Date(res.reservationDate).toLocaleDateString("en-LK")}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-700">{res.contactEmail}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span
//                       className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
//                         res.status
//                       )}`}
//                     >
//                       {res.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                     <div className="relative inline-block text-left">
//                       <button
//                         onClick={(e) => handleActionMenuToggle(e, res.id)}
//                         className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
//                       >
//                         <MoreVertical className="w-5 h-5" />
//                       </button>

//                       {/* Action Menu Dropdown */}
//                       {activeActionMenu?.id === res.id && (
//                         <div
//                           className={`absolute right-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10
//                             ${
//                               activeActionMenu.direction === "up"
//                                 ? "origin-bottom-right bottom-full mb-2" // Pop-up classes
//                                 : "origin-top-right mt-2" // Pop-down classes
//                             }
//                           `}
//                         >
//                           <div className="py-1">
//                             <button
//                               onClick={() => handleAction("View Details", res.id)}
//                               className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                             >
//                               View Details
//                             </button>
//                             <button
//                               onClick={() => handleAction("Resend Email", res.id)}
//                               className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                             >
//                               Resend Confirmation Email
//                             </button>
//                             {res.status !== "Cancelled" && (
//                               <button
//                                 onClick={() => handleAction("Cancel", res.id)}
//                                 className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                               >
//                                 Cancel Reservation
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }