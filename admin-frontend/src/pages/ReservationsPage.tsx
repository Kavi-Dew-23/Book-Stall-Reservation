import { useState, useEffect, useMemo } from "react";
import { Search, MoreVertical, ChevronDown, RotateCcw } from "lucide-react";
import API from "../services/api";

interface BackendReservation {
  id: string;
  stalls: string[];
  publisherName: string;
  email: string;
  createdAt: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<BackendReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
  }, []);

  // --- Filtering & Searching ---
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filter by Search Term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (res) =>
          res.publisherName.toLowerCase().includes(lowerSearch) ||
          res.email.toLowerCase().includes(lowerSearch)
      );
    }

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
      <div className="bg-white rounded-lg shadow-md overflow-visible">
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
                          ${activeActionMenu.direction === "up"
                              ? "bottom-full mb-1"
                              : "mt-1"
                            }`}
                        >
                          <div className="">
                            <button
                              onClick={() => handleCancelReservation(res.id)}
                              className="items-center block w-full px-4 py-2 text-sm 
             bg-red-50 text-red-600 
             hover:bg-red-100 hover:text-red-700
             font-medium transition rounded-md"
                            >
                              Cancel Reservation
                            </button>

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
