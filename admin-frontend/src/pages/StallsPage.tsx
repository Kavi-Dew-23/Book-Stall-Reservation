import { useState, useEffect, useMemo, type FormEvent } from "react";
import {
  Plus,
  X,
  ChevronDown,
  Wrench,
  LayoutGrid,
  Map as MapIcon,
  // RotateCcw, // Removed as per user request
} from "lucide-react";
import API from "../services/api.ts"; // Import your configured API

// --- Type Definitions ---
type StallStatus = "Available" | "Reserved" | "Maintenance";
type StallSize = "Small" | "Medium" | "Large";

interface Stall {
  id: string;
  name: string; // The "display name" like S1, M1, L1
  size: StallSize;
  status: StallStatus;
  publisherName?: string; // Optional: Who reserved it
}

// This is the raw data from the backend's /stalls route
interface BackendStall {
  id: string;
  type: "small" | "medium" | "large";
  isReserved: boolean;
  reservedBy?: string | null;
  publisherName?: string | null;
  reservationId?: string | null; // ✅ Add new field
}

// -------------------------------------
// --- SOURCE OF TRUTH (Publisher's Map) ---
// This is the complete list of 24 stalls
// -------------------------------------
const initialStalls: Stall[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `s-s${i + 1}`, // Unique ID for React
    name: `S${i + 1}`, // Display Name
    size: "Small" as const,
    status: "Available" as const,
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `s-m${i + 1}`,
    name: `M${i + 1}`,
    size: "Medium" as const,
    status: "Available" as const,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `s-l${i + 1}`,
    name: `L${i + 1}`,
    size: "Large" as const,
    status: "Available" as const,
  })),
];

// This is the exact layout from StallMap.tsx
const stallPositions: Record<string, { top: string; left: string }> = {
  // Small stalls
  S1: { top: "5.33%", left: "28.33%" },
  S2: { top: "5.33%", left: "37.5%" },
  S3: { top: "5.33%", left: "46.67%" },
  S4: { top: "5.33%", left: "55.83%" },
  S5: { top: "5.33%", left: "65%" },
  S6: { top: "21.87%", left: "28.33%" },
  S7: { top: "21.87%", left: "37.5%" },
  S8: { top: "21.87%", left: "46.67%" },
  S9: { top: "21.87%", left: "55.83%" },
  S10: { top: "21.87%", left: "65%" },
  // Medium stalls
  M1: { top: "41.07%", left: "27.58%" },
  M2: { top: "41.07%", left: "39.42%" },
  M3: { top: "41.07%", left: "51.25%" },
  M4: { top: "41.07%", left: "63.08%" },
  M5: { top: "59.73%", left: "27.58%" },
  M6: { top: "59.73%", left: "39.42%" },
  M7: { top: "59.73%", left: "51.25%" },
  M8: { top: "59.73%", left: "63.08%" },
  // Large stalls
  L1: { top: "81.07%", left: "7.75%" },
  L2: { top: "81.07%", left: "22.25%" },
  L3: { top: "81.07%", left: "36.75%" },
  L4: { top: "81.07%", left: "51.25%" },
  L5: { top: "81.07%", left: "65.75%" },
  L6: { top: "81.07%", left: "80.25%" },
};

// Adapted from the publisher's getStallSize function
const getStallSize = (size: StallSize): { width: string; height: string } => {
  switch (size) {
    case "Small":
      return { width: "6.67%", height: "8.53%" };
    case "Medium":
      return { width: "9.33%", height: "10.67%" };
    case "Large":
      return { width: "12%", height: "12.8%" };
    default:
      return { width: "8%", height: "10.67%" };
  }
};

// -------------------------------------
// --- Main Stalls Page Component ---
// -------------------------------------
export default function StallsPage() {
  // --- State ---
  const [stalls, setStalls] = useState<Stall[]>(initialStalls); // Start with all stalls available
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode State
  const [viewMode, setViewMode] = useState<"Grid" | "Map">("Map");

  // Filter State
  const [statusFilter, setStatusFilter] = useState("All");
  const [sizeFilter, setSizeFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);

  // --- Data Fetching ---
  const fetchStalls = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get the list of *reserved* stalls from the backend
      const res = await API.get("/reservations/stalls");
      const reservedStalls: BackendStall[] = res.data || [];

      // 2. Translate backend data
      // We use a Map for O(1) lookups
      const reservedMap = new Map<string, BackendStall>();
      for (const beStall of reservedStalls) {
        reservedMap.set(beStall.id, beStall);
      }

      // 3. Merge with the "source of truth"
      const mergedStalls = initialStalls.map((localStall) => {
        const reservedMatch = reservedMap.get(localStall.name); // Match by name (S1, L1, etc)
        
        // --- FIX: Check if the stall is *actually* reserved ---
        if (reservedMatch && reservedMatch.isReserved) {
          return {
            ...localStall,
            status: "Reserved" as StallStatus,
            publisherName: reservedMatch.publisherName || undefined,
          };
        }
        // If not in the reserved map OR if isReserved is false, it's Available
        // We reset it to "Available" in case it was locally "Maintenance"
        return { ...localStall, status: "Available" as StallStatus, publisherName: undefined };
      });

      setStalls(mergedStalls);
    } catch (err: any) {
      console.error("Failed to fetch stalls:", err);
      setError("Failed to fetch stalls. " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStalls();
  }, []); // Runs once on component mount

  // --- Filtering ---
  const filteredStalls = useMemo(() => {
    return stalls
      .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
      .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
  }, [stalls, statusFilter, sizeFilter]);

  // --- Event Handlers ---
  const handleOpenAddModal = () => {
    setEditingStall(null); // Clear any editing stall
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stall: Stall) => {
    setEditingStall(stall);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStall(null);
  };

  // --- Save Stall (Add or Edit) ---
  const handleSaveStall = async (savedStall: Stall, newStatus: StallStatus) => {
    // We only care about the status change
    if (stallPositions[savedStall.name] && savedStall.status !== newStatus) {
      console.log(`Status change for ${savedStall.name}: ${savedStall.status} -> ${newStatus}`);
      
      try {
        if (newStatus === "Available" && savedStall.status === "Reserved") {
          // Admin is un-reserving a stall
          // This now calls our new, smart backend function
          await API.delete(`/reservations/admin/unreserve/${savedStall.name}`);
          
          // --- ✅ NEW: Refresh data after API call ---
          await fetchStalls(); 
          
        } else if (newStatus === "Maintenance") {
          // Admin is marking as maintenance (not implemented in backend, so this is local-only)
           // --- FIX: Update state locally for Maintenance ---
          setStalls(prevStalls => prevStalls.map(s => 
            s.id === savedStall.id ? { ...s, status: "Maintenance" } : s
          ));
        } else if (newStatus === "Reserved" && savedStall.status !== "Reserved") {
          // Admin is manually marking as reserved (not fully supported, local-only)
          console.warn("Manual reservation is local-only for now.");
          setStalls(prevStalls => prevStalls.map(s => 
            s.id === savedStall.id ? { ...s, status: "Reserved", publisherName: "Admin Reserved" } : s
          ));
        }
        
      } catch (err: any) {
        console.error("Failed to update stall:", err);
        setError("Failed to update stall. " + (err.response?.data?.message || err.message));
      }
    }
    
    // If it's a new, non-map stall (not fully supported by this logic, but here)
    if (!stallPositions[savedStall.name]) {
      console.log("Adding new stall (local only):", savedStall.name);
      setStalls(prev => [...prev, {...savedStall, status: newStatus, id: `stall-${Date.now()}`}])
    }
    
    handleCloseModal();
  };

  // --- Render ---
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Stalls</h1>

      {/* --- Controls: Filters, Add Button, View Toggle --- */}
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "All", label: "All Statuses" },
              { value: "Available", label: "Available" },
              { value: "Reserved", label: "Reserved" },
              { value: "Maintenance", label: "Maintenance" },
            ]}
          />
          <FilterDropdown
            label="Size"
            value={sizeFilter}
            onChange={setSizeFilter}
            options={[
              { value: "All", label: "All Sizes" },
              { value: "Small", label: "Small" },
              { value: "Medium", label: "Medium" },
              { value: "Large", label: "Large" },
            ]}
          />
          {/* --- FIX: Refresh Button Removed --- */}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
            <button
              onClick={() => setViewMode("Grid")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
                viewMode === "Grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("Map")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
                viewMode === "Map"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add New Stall
          </button>
        </div>
      </div>

      {/* --- Stalls Grid or Map --- */}
      {loading ? (
        <p className="text-center py-10">Loading stalls...</p>
      ) : error ? (
        <p className="text-center py-10 text-red-500">{error}</p>
      ) : (
        <>
          {viewMode === "Grid" && (
            <StallGrid
              stalls={filteredStalls}
              onManageClick={handleOpenEditModal}
            />
          )}
          {viewMode === "Map" && (
            <StallMap
              stalls={filteredStalls} // Pass filtered stalls to map
              onStallClick={handleOpenEditModal}
            />
          )}
        </>
      )}

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <ManageStallModal
          stall={editingStall}
          onClose={handleCloseModal}
          onSave={handleSaveStall}
        />
      )}
    </div>
  );
}

// -------------------------------------
// --- Filter Dropdown Component ---
// -------------------------------------
function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={`filter-${label}`}
        className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
}

// -------------------------------------
// --- Stall Grid Component ---
// -------------------------------------
function StallGrid({
  stalls,
  onManageClick,
}: {
  stalls: Stall[];
  onManageClick: (stall: Stall) => void;
}) {
  if (stalls.length === 0) {
    return <p className="text-center py-10 text-gray-500">No stalls found.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stalls.map((stall) => (
        <StallCard
          key={stall.id}
          stall={stall}
          onManageClick={() => onManageClick(stall)}
        />
      ))}
    </div>
  );
}

// -------------------------------------
// --- Stall Card Component ---
// (NOW USES SIZE-BASED COLORS)
// -------------------------------------
function StallCard({
  stall,
  onManageClick,
}: {
  stall: Stall;
  onManageClick: () => void;
}) {
  // --- FIX: Split color logic ---
  // 1. For the BORDER of the card
  const sizeBorderColor = {
    Small: "border-yellow-300",
    Medium: "border-blue-300",
    Large: "border-red-300",
  }[stall.size];
  
  // 2. For the BADGE
  const sizeBadgeColor = {
    Small: "bg-yellow-100 text-yellow-800",
    Medium: "bg-blue-100 text-blue-800",
    Large: "bg-red-100 text-red-800",
  }[stall.size];
  // --- END FIX ---

  const statusInfo = {
    Available: { color: "text-green-600", Icon: MapIcon },
    Reserved: { color: "text-red-600", Icon: X },
    Maintenance: { color: "text-yellow-600", Icon: Wrench },
  }[stall.status];

  return (
    <div
      // --- FIX: Use sizeBorderColor, keep bg-white ---
      className={`flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden border-2 ${sizeBorderColor}`}
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
          <span
            // --- FIX: Use sizeBadgeColor ---
            className={`px-3 py-1 text-xs font-semibold rounded-full ${sizeBadgeColor} border border-current`}
          >
            {stall.size}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <statusInfo.Icon className={`w-5 h-5 ${statusInfo.color}`} />
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {stall.status}
          </span>
        </div>
        {stall.status === "Reserved" && stall.publisherName && (
          <p className="text-sm text-gray-600 mt-2 truncate">
            Booked by: <span className="font-medium">{stall.publisherName}</span>
          </p>
        )}
      </div>
      <div className="px-5 py-3 bg-white border-t">
        <button
          onClick={onManageClick}
          className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Manage Stall
        </button>
      </div>
    </div>
  );
}

// -------------------------------------
// --- Stall Map Component ---
// (USES STATUS-BASED COLORS & NO GREEN LINES)
// -------------------------------------
function StallMap({
  stalls,
  onStallClick,
}: {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
}) {
  
  // --- Helper functions for admin styling ---
  // const getSizeColor = (size: StallSize) => {
  //   switch (size) {
  //     case "Small": return "bg-yellow-400 border-yellow-600";
  //     case "Medium": return "bg-yellow-400 border-blue-600";
  //     case "Large": return "bg-yellow-400 border-red-600";
  //   }
  // };
  // const getStatusOpacity = (status: StallStatus) => {
  //   // Maintenance and Reserved stalls are faded
  //   return status === "Available" ? "opacity-100" : "grayscale opacity-60";
  // };
  
  return (
    <div className="w-full max-w-[1200px] mx-auto">
      
      {/* Legend (using new colors) */}
      <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 border border-gray-400 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400 border border-gray-400 rounded"></div>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-400 border border-gray-400 rounded"></div>
          <span>Maintenance</span>
        </div>
      </div>

      {/* Floor plan container --- FIX: REMOVED GREEN LINES --- */}
      <div className="relative aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden">
        {/* --- Static elements from publisher map --- */}
        <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
        <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
        <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 text-green-500 font-bold text-xs sm:text-sm z-10 whitespace-nowrap">
          Entrance
        </div>
        <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 text-red-500 font-bold text-xs sm:text-sm z-10 whitespace-nowrap">
          Exit
        </div>
        <div className="absolute top-[16%] left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-gray-400 z-10 whitespace-nowrap">
          Small Stalls Area
        </div>
        <div className="absolute top-[53%] left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-gray-400 z-10 whitespace-nowrap">
          Medium Stalls Area
        </div>
        <div className="absolute top-[76%] left-1/2 -translate-x-1/2 text-xs sm:text-sm font-bold text-gray-400 z-10 whitespace-nowrap">
          Large Stalls Area
        </div>
        <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
          <span className="font-bold text-xs sm:text-sm">Restrooms</span>
        </div>
        <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
          <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
        </div>
        {/* --- Green lines are removed --- */}

        {/* --- Render stalls (with ADMIN logic) --- */}
        {stalls.map((stall) => {
          const size = getStallSize(stall.size);
          const position = stallPositions[stall.name];

          // Don't render if stall has no position
          if (!position) {
             console.warn(`No map position for stall: ${stall.name}`);
             return null;
          }

          // Determine color based on status
          const colorClass = 
            stall.status === "Reserved"
              ? "bg-gray-400 text-white cursor-not-allowed"
              : stall.status === "Maintenance"
              ? "bg-blue-400 text-white"
              : "bg-amber-200 text-gray-800 hover:bg-amber-300";

          return (
            <button
              key={stall.id}
              onClick={() => onStallClick(stall)} // Admin "manage" click
              title={
                stall.status === "Reserved" && stall.publisherName
                  ? `Reserved by ${stall.publisherName}`
                  : `Stall ${stall.name} (${stall.status})`
              }
              className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer min-w-10 min-h-8
                ${colorClass}
                hover:scale-105
              `}
              style={{
                ...position,
                ...size,
                fontSize: "clamp(0.625rem, 0.75rem, 0.875rem)",
              }}
            >
              <span className="font-bold text-black shadow-sm">{stall.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


// -------------------------------------
// --- Manage Stall Modal Component ---
// -------------------------------------
function ManageStallModal({
  stall,
  onClose,
  onSave,
}: {
  stall: Stall | null;
  onClose: () => void;
  onSave: (stall: Stall, newStatus: StallStatus) => void;
}) {
  // 'stall' is the data for the stall when the modal was OPENED
  const [name] = useState(stall?.name || "");
  const [size] = useState<StallSize>(stall?.size || "Small");
  // This is the *new* status the admin selects in the dropdown
  const [newStatus, setNewStatus] = useState<StallStatus>(stall?.status || "Available");
  // We don't need setPublisherName, so we just read the value
  const [publisherName] = useState(stall?.publisherName || "");

  const isNew = stall === null;
  const isMapStall = stall ? stallPositions.hasOwnProperty(stall.name) : false;
  const title = isNew ? "Add New Stall" : `Manage Stall: ${name}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Pass the original stall data AND the new status to the save handler
    onSave(stall!, newStatus);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="flex justify-between items-center p-5 border-b">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            {/* Stall Name */}
            <div>
              <label
                htmlFor="stall-name"
                className="block text-sm font-medium text-gray-700"
              >
                Stall Name
              </label>
              <input
                type="text"
                id="stall-name"
                value={name}
                readOnly
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
              />
              {isMapStall && (
                <p className="text-xs text-gray-500 mt-1">Stall name cannot be changed for map stalls.</p>
              )}
            </div>
            {/* Stall Size */}
            <div>
              <label
                htmlFor="stall-size"
                className="block text-sm font-medium text-gray-700"
              >
                Size
              </label>
              <select
                id="stall-size"
                value={size}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
            {/* Stall Status (This is what the admin can change) */}
            <div>
              <label
                htmlFor="stall-status"
                className="block text-sm font-medium text-gray-700"
              >
                Set New Status
              </label>
              <select
                id="stall-status"
                value={newStatus} // Controlled by the new status
                onChange={(e) => setNewStatus(e.target.value as StallStatus)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Maintenance">Maintenance</option>
              </select>
              {stall?.status === "Reserved" && newStatus === "Available" && (
                <p className="text-xs text-yellow-700 mt-1">
                  Saving as "Available" will un-reserve this stall.
                </p>
              )}
            </div>
            
            {/* Publisher Name (Read-only, only shows if reserved) */}
            {stall?.status === "Reserved" && publisherName && (
              <div>
                <label
                  htmlFor="publisher-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Publisher
                </label>
                <input
                  type="text"
                  id="publisher-name"
                  value={publisherName}
                  readOnly
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




// //5t version

// import { useState, useEffect, useMemo, type FormEvent } from "react";
// import {
//   Plus,
//   X,
//   ChevronDown,
//   Wrench,
//   LayoutGrid,
//   Map as MapIcon,
//   // RotateCcw, // Removed as per user request
// } from "lucide-react";
// import API from "../services/api.ts"; // Import your configured API

// // --- Type Definitions ---
// type StallStatus = "Available" | "Reserved" | "Maintenance";
// type StallSize = "Small" | "Medium" | "Large";

// interface Stall {
//   id: string;
//   name: string; // The "display name" like S1, M1, L1
//   size: StallSize;
//   status: StallStatus;
//   publisherName?: string; // Optional: Who reserved it
// }

// // This is the raw data from the backend's /stalls route
// interface BackendStall {
//   id: string;
//   type: "small" | "medium" | "large";
//   isReserved: boolean;
//   reservedBy?: string | null;
//   publisherName?: string | null;
// }

// // -------------------------------------
// // --- SOURCE OF TRUTH (Publisher's Map) ---
// // This is the complete list of 24 stalls
// // -------------------------------------
// const initialStalls: Stall[] = [
//   ...Array.from({ length: 10 }, (_, i) => ({
//     id: `s-s${i + 1}`, // Unique ID for React
//     name: `S${i + 1}`, // Display Name
//     size: "Small" as const,
//     status: "Available" as const,
//   })),
//   ...Array.from({ length: 8 }, (_, i) => ({
//     id: `s-m${i + 1}`,
//     name: `M${i + 1}`,
//     size: "Medium" as const,
//     status: "Available" as const,
//   })),
//   ...Array.from({ length: 6 }, (_, i) => ({
//     id: `s-l${i + 1}`,
//     name: `L${i + 1}`,
//     size: "Large" as const,
//     status: "Available" as const,
//   })),
// ];

// // This is the exact layout from StallMap.tsx
// const stallPositions: Record<string, { top: string; left: string }> = {
//   // Small stalls
//   S1: { top: "5.33%", left: "28.33%" },
//   S2: { top: "5.33%", left: "37.5%" },
//   S3: { top: "5.33%", left: "46.67%" },
//   S4: { top: "5.33%", left: "55.83%" },
//   S5: { top: "5.33%", left: "65%" },
//   S6: { top: "21.87%", left: "28.33%" },
//   S7: { top: "21.87%", left: "37.5%" },
//   S8: { top: "21.87%", left: "46.67%" },
//   S9: { top: "21.87%", left: "55.83%" },
//   S10: { top: "21.87%", left: "65%" },
//   // Medium stalls
//   M1: { top: "41.07%", left: "27.58%" },
//   M2: { top: "41.07%", left: "39.42%" },
//   M3: { top: "41.07%", left: "51.25%" },
//   M4: { top: "41.07%", left: "63.08%" },
//   M5: { top: "59.73%", left: "27.58%" },
//   M6: { top: "59.73%", left: "39.42%" },
//   M7: { top: "59.73%", left: "51.25%" },
//   M8: { top: "59.73%", left: "63.08%" },
//   // Large stalls
//   L1: { top: "81.07%", left: "7.75%" },
//   L2: { top: "81.07%", left: "22.25%" },
//   L3: { top: "81.07%", left: "36.75%" },
//   L4: { top: "81.07%", left: "51.25%" },
//   L5: { top: "81.07%", left: "65.75%" },
//   L6: { top: "81.07%", left: "80.25%" },
// };

// // Adapted from the publisher's getStallSize function
// const getStallSize = (size: StallSize): { width: string; height: string } => {
//   switch (size) {
//     case "Small":
//       return { width: "6.67%", height: "8.53%" };
//     case "Medium":
//       return { width: "9.33%", height: "10.67%" };
//     case "Large":
//       return { width: "12%", height: "12.8%" };
//     default:
//       return { width: "8%", height: "10.67%" };
//   }
// };

// // -------------------------------------
// // --- Main Stalls Page Component ---
// // -------------------------------------
// export default function StallsPage() {
//   // --- State ---
//   const [stalls, setStalls] = useState<Stall[]>(initialStalls); // Start with all stalls available
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // View Mode State
//   const [viewMode, setViewMode] = useState<"Grid" | "Map">("Map");

//   // Filter State
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [sizeFilter, setSizeFilter] = useState("All");

//   // Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingStall, setEditingStall] = useState<Stall | null>(null);

//   // --- Data Fetching ---
//   const fetchStalls = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // 1. Get the list of *reserved* stalls from the backend
//       const res = await API.get("/reservations/stalls");
//       const reservedStalls: BackendStall[] = res.data || [];

//       // 2. Translate backend data
//       // We use a Map for O(1) lookups
//       const reservedMap = new Map<string, BackendStall>();
//       for (const beStall of reservedStalls) {
//         reservedMap.set(beStall.id, beStall);
//       }

//       // 3. Merge with the "source of truth"
//       const mergedStalls = initialStalls.map((localStall) => {
//         const reservedMatch = reservedMap.get(localStall.name); // Match by name (S1, L1, etc)
        
//         // --- FIX: Check if the stall is *actually* reserved ---
//         if (reservedMatch && reservedMatch.isReserved) {
//           return {
//             ...localStall,
//             status: "Reserved" as StallStatus,
//             publisherName: reservedMatch.publisherName || undefined,
//           };
//         }
//         // If not in the reserved map OR if isReserved is false, it's Available
//         // We reset it to "Available" in case it was locally "Maintenance"
//         return { ...localStall, status: "Available" as StallStatus, publisherName: undefined };
//       });

//       setStalls(mergedStalls);
//     } catch (err: any) {
//       console.error("Failed to fetch stalls:", err);
//       setError("Failed to fetch stalls. " + (err.response?.data?.message || err.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStalls();
//   }, []); // Runs once on component mount

//   // --- Filtering ---
//   const filteredStalls = useMemo(() => {
//     return stalls
//       .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
//       .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
//   }, [stalls, statusFilter, sizeFilter]);

//   // --- Event Handlers ---
//   const handleOpenAddModal = () => {
//     setEditingStall(null); // Clear any editing stall
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (stall: Stall) => {
//     setEditingStall(stall);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setEditingStall(null);
//   };

//   // --- Save Stall (Add or Edit) ---
//   const handleSaveStall = async (savedStall: Stall, newStatus: StallStatus) => {
//     // We only care about the status change
//     if (stallPositions[savedStall.name] && savedStall.status !== newStatus) {
//       console.log(`Status change for ${savedStall.name}: ${savedStall.status} -> ${newStatus}`);
      
//       try {
//         if (newStatus === "Available" && savedStall.status === "Reserved") {
//           // Admin is un-reserving a stall
//           await API.delete(`/reservations/admin/unreserve/${savedStall.name}`);
//         } else if (newStatus === "Maintenance") {
//           // Admin is marking as maintenance (not implemented in backend, so this is local-only)
//           console.warn("Maintenance status is local-only for now.");
//            // --- FIX: Update state locally for Maintenance ---
//           setStalls(prevStalls => prevStalls.map(s => 
//             s.id === savedStall.id ? { ...s, status: "Maintenance" } : s
//           ));
//         } else if (newStatus === "Reserved" && savedStall.status !== "Reserved") {
//           // Admin is manually marking as reserved (not fully supported, local-only)
//           console.warn("Manual reservation is local-only for now.");
//           setStalls(prevStalls => prevStalls.map(s => 
//             s.id === savedStall.id ? { ...s, status: "Reserved", publisherName: "Admin Reserved" } : s
//           ));
//         }
        
//         // Refresh the stalls list from backend *only if* we un-reserved
//         if (newStatus === "Available" && savedStall.status === "Reserved") {
//           await fetchStalls();
//         }
//       } catch (err: any) {
//         console.error("Failed to update stall:", err);
//         setError("Failed to update stall. " + (err.response?.data?.message || err.message));
//       }
//     }
    
//     // If it's a new, non-map stall (not fully supported by this logic, but here)
//     if (!stallPositions[savedStall.name]) {
//       console.log("Adding new stall (local only):", savedStall.name);
//       setStalls(prev => [...prev, {...savedStall, status: newStatus, id: `stall-${Date.now()}`}])
//     }
    
//     handleCloseModal();
//   };

//   // --- Render ---
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Manage Stalls</h1>

//       {/* --- Controls: Filters, Add Button, View Toggle --- */}
//       <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
//         {/* Filters */}
//         <div className="flex flex-wrap gap-4">
//           <FilterDropdown
//             label="Status"
//             value={statusFilter}
//             onChange={setStatusFilter}
//             options={[
//               { value: "All", label: "All Statuses" },
//               { value: "Available", label: "Available" },
//               { value: "Reserved", label: "Reserved" },
//               { value: "Maintenance", label: "Maintenance" },
//             ]}
//           />
//           <FilterDropdown
//             label="Size"
//             value={sizeFilter}
//             onChange={setSizeFilter}
//             options={[
//               { value: "All", label: "All Sizes" },
//               { value: "Small", label: "Small" },
//               { value: "Medium", label: "Medium" },
//               { value: "Large", label: "Large" },
//             ]}
//           />
//           {/* --- FIX: Refresh Button Removed --- */}
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-4">
//           {/* View Toggle */}
//           <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
//             <button
//               onClick={() => setViewMode("Grid")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Grid"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <LayoutGrid className="w-4 h-4" />
//               Grid
//             </button>
//             <button
//               onClick={() => setViewMode("Map")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Map"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <MapIcon className="w-4 h-4" />
//               Map
//             </button>
//           </div>

//           <button
//             onClick={handleOpenAddModal}
//             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
//           >
//             <Plus className="w-5 h-5" />
//             Add New Stall
//           </button>
//         </div>
//       </div>

//       {/* --- Stalls Grid or Map --- */}
//       {loading ? (
//         <p className="text-center py-10">Loading stalls...</p>
//       ) : error ? (
//         <p className="text-center py-10 text-red-500">{error}</p>
//       ) : (
//         <>
//           {viewMode === "Grid" && (
//             <StallGrid
//               stalls={filteredStalls}
//               onManageClick={handleOpenEditModal}
//             />
//           )}
//           {viewMode === "Map" && (
//             <StallMap
//               stalls={filteredStalls} // Pass filtered stalls to map
//               onStallClick={handleOpenEditModal}
//             />
//           )}
//         </>
//       )}

//       {/* --- Add/Edit Modal --- */}
//       {isModalOpen && (
//         <ManageStallModal
//           stall={editingStall}
//           onClose={handleCloseModal}
//           onSave={handleSaveStall}
//         />
//       )}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Filter Dropdown Component ---
// // -------------------------------------
// function FilterDropdown({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: { value: string; label: string }[];
// }) {
//   return (
//     <div className="relative">
//       <select
//         id={`filter-${label}`}
//         className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Grid Component ---
// // -------------------------------------
// function StallGrid({
//   stalls,
//   onManageClick,
// }: {
//   stalls: Stall[];
//   onManageClick: (stall: Stall) => void;
// }) {
//   if (stalls.length === 0) {
//     return <p className="text-center py-10 text-gray-500">No stalls found.</p>;
//   }
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//       {stalls.map((stall) => (
//         <StallCard
//           key={stall.id}
//           stall={stall}
//           onManageClick={() => onManageClick(stall)}
//         />
//       ))}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Card Component ---
// // (FIXED COLOR LOGIC)
// // -------------------------------------
// function StallCard({
//   stall,
//   onManageClick,
// }: {
//   stall: Stall;
//   onManageClick: () => void;
// }) {
//   // --- FIX: Split color logic ---
//   // 1. For the BORDER of the card
//   const sizeBorderColor = {
//     Small: "border-yellow-300",
//     Medium: "border-blue-300",
//     Large: "border-red-300",
//   }[stall.size];
  
//   // 2. For the BADGE
//   const sizeBadgeColor = {
//     Small: "bg-yellow-100 text-yellow-800",
//     Medium: "bg-blue-100 text-blue-800",
//     Large: "bg-red-100 text-red-800",
//   }[stall.size];
//   // --- END FIX ---

//   const statusInfo = {
//     Available: { color: "text-green-600", Icon: MapIcon },
//     Reserved: { color: "text-red-600", Icon: X },
//     Maintenance: { color: "text-yellow-600", Icon: Wrench },
//   }[stall.status];

//   return (
//     <div
//       // --- FIX: Use sizeBorderColor, keep bg-white ---
//       className={`flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden border-2 ${sizeBorderColor}`}
//     >
//       <div className="p-5 flex-1">
//         <div className="flex justify-between items-start">
//           <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
//           <span
//             // --- FIX: Use sizeBadgeColor ---
//             className={`px-3 py-1 text-xs font-semibold rounded-full ${sizeBadgeColor} border border-current`}
//           >
//             {stall.size}
//           </span>
//         </div>
//         <div className="flex items-center gap-2 mt-3">
//           <statusInfo.Icon className={`w-5 h-5 ${statusInfo.color}`} />
//           <span className={`text-sm font-medium ${statusInfo.color}`}>
//             {stall.status}
//           </span>
//         </div>
//         {stall.status === "Reserved" && stall.publisherName && (
//           <p className="text-sm text-gray-600 mt-2 truncate">
//             Booked by: <span className="font-medium">{stall.publisherName}</span>
//           </p>
//         )}
//       </div>
//       <div className="px-5 py-3 bg-white border-t">
//         <button
//           onClick={onManageClick}
//           className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
//         >
//           Manage Stall
//         </button>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Map Component ---
// // (USES STATUS-BASED COLORS & NO GREEN LINES)
// // -------------------------------------
// function StallMap({
//   stalls,
//   onStallClick,
// }: {
//   stalls: Stall[];
//   onStallClick: (stall: Stall) => void;
// }) {
//   return (
//     <div className="w-full max-w-[1200px] mx-auto">
      
//       {/* Legend (using new colors) */}
//       <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm justify-center">
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 border border-gray-400 rounded"></div>
//           <span>Available</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400 border border-gray-400 rounded"></div>
//           <span>Reserved</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-400 border border-gray-400 rounded"></div>
//           <span>Maintenance</span>
//         </div>
//       </div>

//       {/* Floor plan container --- FIX: REMOVED GREEN LINES --- */}
//       <div className="relative aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden">
//         {/* --- Static elements from publisher map --- */}
//         <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 bg-blue-400 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Entrance
//         </div>
//         <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Exit
//         </div>
//         <div className="absolute top-[16%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Small Stalls Area
//         </div>
//         <div className="absolute top-[53%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Medium Stalls Area
//         </div>
//         <div className="absolute top-[76%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Large Stalls Area
//         </div>
//         <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
//           <span className="font-bold text-xs sm:text-sm">Restrooms</span>
//         </div>
//         <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
//           <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
//         </div>
//         {/* --- Green lines are removed --- */}

//         {/* --- Render stalls (with ADMIN logic) --- */}
//         {stalls.map((stall) => {
//           const size = getStallSize(stall.size);
//           const position = stallPositions[stall.name];

//           // Don't render if stall has no position
//           if (!position) {
//              console.warn(`No map position for stall: ${stall.name}`);
//              return null;
//           }

//           // Determine color based on status
//           const colorClass = 
//             stall.status === "Reserved"
//               ? "bg-gray-400 text-white cursor-not-allowed"
//               : stall.status === "Maintenance"
//               ? "bg-blue-400 text-white"
//               : "bg-amber-200 text-gray-800 hover:bg-amber-300";

//           return (
//             <button
//               key={stall.id}
//               onClick={() => onStallClick(stall)} // Admin "manage" click
//               title={
//                 stall.status === "Reserved" && stall.publisherName
//                   ? `Reserved by ${stall.publisherName}`
//                   : `Stall ${stall.name} (${stall.status})`
//               }
//               className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer min-w-10 min-h-8
//                 ${colorClass}
//                 hover:scale-105
//               `}
//               style={{
//                 ...position,
//                 ...size,
//                 fontSize: "clamp(0.625rem, 0.75rem, 0.875rem)",
//               }}
//             >
//               <span className="font-bold">{stall.name}</span>
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


// // -------------------------------------
// // --- Manage Stall Modal Component ---
// // -------------------------------------
// function ManageStallModal({
//   stall,
//   onClose,
//   onSave,
// }: {
//   stall: Stall | null;
//   onClose: () => void;
//   onSave: (stall: Stall, newStatus: StallStatus) => void;
// }) {
//   // 'stall' is the data for the stall when the modal was OPENED
//   const [name] = useState(stall?.name || "");
//   const [size] = useState<StallSize>(stall?.size || "Small");
//   // This is the *new* status the admin selects in the dropdown
//   const [newStatus, setNewStatus] = useState<StallStatus>(stall?.status || "Available");
//   // We don't need setPublisherName, so we just read the value
//   const [publisherName] = useState(stall?.publisherName || "");

//   const isNew = stall === null;
//   const isMapStall = stall ? stallPositions.hasOwnProperty(stall.name) : false;
//   const title = isNew ? "Add New Stall" : `Manage Stall: ${name}`;

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     // Pass the original stall data AND the new status to the save handler
//     onSave(stall!, newStatus);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         <form onSubmit={handleSubmit}>
//           {/* Modal Header */}
//           <div className="flex justify-between items-center p-5 border-b">
//             <h2 className="text-xl font-bold">{title}</h2>
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Modal Body */}
//           <div className="p-6 space-y-4">
//             {/* Stall Name */}
//             <div>
//               <label
//                 htmlFor="stall-name"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Stall Name
//               </label>
//               <input
//                 type="text"
//                 id="stall-name"
//                 value={name}
//                 readOnly
//                 disabled
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
//               />
//               {isMapStall && (
//                 <p className="text-xs text-gray-500 mt-1">Stall name cannot be changed for map stalls.</p>
//               )}
//             </div>
//             {/* Stall Size */}
//             <div>
//               <label
//                 htmlFor="stall-size"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Size
//               </label>
//               <select
//                 id="stall-size"
//                 value={size}
//                 disabled
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
//               >
//                 <option value="Small">Small</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Large">Large</option>
//               </select>
//             </div>
//             {/* Stall Status (This is what the admin can change) */}
//             <div>
//               <label
//                 htmlFor="stall-status"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Set New Status
//               </label>
//               <select
//                 id="stall-status"
//                 value={newStatus} // Controlled by the new status
//                 onChange={(e) => setNewStatus(e.target.value as StallStatus)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="Available">Available</option>
//                 <option value="Reserved">Reserved</option>
//                 <option value="Maintenance">Maintenance</option>
//               </select>
//               {stall?.status === "Reserved" && newStatus === "Available" && (
//                 <p className="text-xs text-yellow-700 mt-1">
//                   Saving as "Available" will un-reserve this stall.
//                 </p>
//               )}
//             </div>
            
//             {/* Publisher Name (Read-only, only shows if reserved) */}
//             {stall?.status === "Reserved" && publisherName && (
//               <div>
//                 <label
//                   htmlFor="publisher-name"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Current Publisher
//                 </label>
//                 <input
//                   type="text"
//                   id="publisher-name"
//                   value={publisherName}
//                   readOnly
//                   disabled
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Modal Footer */}
//           <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


//------------------------------------------------------------------------------------------------------------------------------------------------

//4th version

// import { useState, useEffect, useMemo, type FormEvent } from "react";
// import {
//   Plus,
//   X,
//   ChevronDown,
//   Wrench,
//   LayoutGrid,
//   Map as MapIcon, // Renamed 'Map' to 'MapIcon' to avoid name collision
//   RotateCcw, // Import refresh icon
// } from "lucide-react";
// import API from "../services/api"; // Import your configured API

// // --- Type Definitions ---
// type StallStatus = "Available" | "Reserved" | "Maintenance";
// type StallSize = "Small" | "Medium" | "Large";

// interface Stall {
//   id: string; // This is the unique ID from the database (e.g., "s-s1")
//   name: string; // This is the display name (e.g., "S1")
//   size: StallSize;
//   status: StallStatus;
//   publisherName?: string; // Optional: Who reserved it
// }

// // This is the raw data from the backend's /stalls route
// interface BackendStall {
//   id: string; // The doc ID, which is the stall name ("S1", "M1", etc.)
//   type: "small" | "medium" | "large";
//   isReserved: boolean;
//   reservedBy?: string | null; // email
//   publisherName?: string | null;
// }

// // -------------------------------------
// // --- SOURCE OF TRUTH (Publisher's Map) ---
// // This is the full list of all 24 stalls that *should* exist.
// // We use this to show "Available" stalls that aren't in the database yet.
// // -------------------------------------
// const initialStalls: Stall[] = [
//   // Small Stalls (10)
//   { id: "S1", name: "S1", size: "Small", status: "Available" },
//   { id: "S2", name: "S2", size: "Small", status: "Available" },
//   { id: "S3", name: "S3", size: "Small", status: "Available" },
//   { id: "S4", name: "S4", size: "Small", status: "Available" },
//   { id: "S5", name: "S5", size: "Small", status: "Available" },
//   { id: "S6", name: "S6", size: "Small", status: "Available" },
//   { id: "S7", name: "S7", size: "Small", status: "Available" },
//   { id: "S8", name: "S8", size: "Small", status: "Available" },
//   { id: "S9", name: "S9", size: "Small", status: "Available" },
//   { id: "S10", name: "S10", size: "Small", status: "Available" },
//   // Medium Stalls (8)
//   { id: "M1", name: "M1", size: "Medium", status: "Available" },
//   { id: "M2", name: "M2", size: "Medium", status: "Available" },
//   { id: "M3", name: "M3", size: "Medium", status: "Available" },
//   { id: "M4", name: "M4", size: "Medium", status: "Available" },
//   { id: "M5", name: "M5", size: "Medium", status: "Available" },
//   { id: "M6", name: "M6", size: "Medium", status: "Available" },
//   { id: "M7", name: "M7", size: "Medium", status: "Available" },
//   { id: "M8", name: "M8", size: "Medium", status: "Available" },
//   // Large Stalls (6)
//   { id: "L1", name: "L1", size: "Large", status: "Available" },
//   { id: "L2", name: "L2", size: "Large", status: "Available" },
//   { id: "L3", name: "L3", size: "Large", status: "Available" },
//   { id: "L4", name: "L4", size: "Large", status: "Available" },
//   { id: "L5", name: "L5", size: "Large", status: "Available" },
//   { id: "L6", name: "L6", size: "Large", status: "Available" },
// ];

// // This is the exact layout from StallMap.tsx
// const stallPositions: Record<string, { top: string; left: string }> = {
//   // Small stalls
//   S1: { top: "5.33%", left: "28.33%" },
//   S2: { top: "5.33%", left: "37.5%" },
//   S3: { top: "5.33%", left: "46.67%" },
//   S4: { top: "5.33%", left: "55.83%" },
//   S5: { top: "5.33%", left: "65%" },
//   S6: { top: "21.87%", left: "28.33%" },
//   S7: { top: "21.87%", left: "37.5%" },
//   S8: { top: "21.87%", left: "46.67%" },
//   S9: { top: "21.87%", left: "55.83%" },
//   S10: { top: "21.87%", left: "65%" },
//   // Medium stalls
//   M1: { top: "41.07%", left: "27.58%" },
//   M2: { top: "41.07%", left: "39.42%" },
//   M3: { top: "41.07%", left: "51.25%" },
//   M4: { top: "41.07%", left: "63.08%" },
//   M5: { top: "59.73%", left: "27.58%" },
//   M6: { top: "59.73%", left: "39.42%" },
//   M7: { top: "59.73%", left: "51.25%" },
//   M8: { top: "59.73%", left: "63.08%" },
//   // Large stalls
//   L1: { top: "81.07%", left: "7.75%" },
//   L2: { top: "81.07%", left: "22.25%" },
//   L3: { top: "81.07%", left: "36.75%" },
//   L4: { top: "81.07%", left: "51.25%" },
//   L5: { top: "81.07%", left: "65.75%" },
//   L6: { top: "81.07%", left: "80.25%" },
// };

// // Adapted from the publisher's getStallSize function
// const getStallSize = (size: StallSize): { width: string; height: string } => {
//   switch (size) {
//     case "Small":
//       return { width: "6.67%", height: "8.53%" };
//     case "Medium":
//       return { width: "9.33%", height: "10.67%" };
//     case "Large":
//       return { width: "12%", height: "12.8%" };
//     default:
//       return { width: "8%", height: "10.67%" };
//   }
// };

// // -------------------------------------
// // --- Main Stalls Page Component ---
// // -------------------------------------
// export default function StallsPage() {
//   // --- State ---
//   const [stalls, setStalls] = useState<Stall[]>(initialStalls); // Start with the full list
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // View Mode State
//   const [viewMode, setViewMode] = useState<"Grid" | "Map">("Map");

//   // Filter State
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [sizeFilter, setSizeFilter] = useState("All");

//   // Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingStall, setEditingStall] = useState<Stall | null>(null);

//   // --- Helper: Translate backend data to frontend format ---
//   const translateBackendStall = (beStall: BackendStall): Stall => {
//     // Explicitly type the map to satisfy TypeScript
//     const sizeMap: { [key: string]: StallSize } = {
//       small: "Small",
//       medium: "Medium",
//       large: "Large",
//     };
    
//     // Note: The backend doesn't have a "Maintenance" status, so we don't handle it
//     const status: StallStatus = beStall.isReserved ? "Reserved" : "Available";

//     return {
//       id: beStall.id,
//       name: beStall.id, // The ID is the name (e.g., "S1")
//       size: sizeMap[beStall.type] || "Small", // Default to Small if type is weird
//       status: status,
//       publisherName: beStall.publisherName || undefined,
//     };
//   };

//   // --- Data Fetching ---
//   const fetchStalls = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await API.get("/reservations/stalls");
//       const backendStalls: BackendStall[] = response.data;

//       // Create a Map of the *real* reserved stalls from the backend
//       const reservedStallsMap = new Map<string, Stall>();
//       backendStalls.forEach((beStall) => {
//         // Only map reserved stalls, as that's all the API returns
//         if (beStall.isReserved) {
//           const feStall = translateBackendStall(beStall);
//           reservedStallsMap.set(feStall.name, feStall);
//         }
//       });

//       // Merge the full list with the real data
//       const mergedStalls = initialStalls.map((initialStall) => {
//         // If the stall is in our reserved map, use that.
//         // Otherwise, use the "Available" default from the initial list.
//         return reservedStallsMap.get(initialStall.name) || initialStall;
//       });

//       setStalls(mergedStalls);
//     } catch (err) {
//       console.error("Failed to fetch stalls:", err);
//       setError("Failed to fetch stalls. (Are you logged in?)");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStalls();
//   }, []); // Runs once on component mount

//   // --- Filtering ---
//   const filteredStalls = useMemo(() => {
//     return stalls
//       .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
//       .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
//   }, [stalls, statusFilter, sizeFilter]);

//   // --- Event Handlers ---
//   const handleOpenAddModal = () => {
//     setEditingStall(null); // Clear any editing stall
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (stall: Stall) => {
//     setEditingStall(stall);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setEditingStall(null);
//   };

//   // --- Save Stall (Add or Edit) ---
//   const handleSaveStall = async (stallToSave: Stall, newStatus: StallStatus) => {
//     // If the status hasn't changed, do nothing
//     if (stallToSave.status === newStatus) {
//       handleCloseModal();
//       return;
//     }

//     setLoading(true);

//     try {
//       if (newStatus === "Available") {
//         // Admin is making a stall "Available" (Un-reserving it)
//         await API.delete(`/reservations/admin/unreserve/${stallToSave.name}`);
//       }
//       // Note: Your backend doesn't have an endpoint for "Maintenance" yet
//       // So we will just fake it on the frontend for now.
      
//       // Optimistic UI Update (or re-fetch)
//       // We will re-fetch to get the 100% correct state from the server
//       await fetchStalls(); 
      
//       if (newStatus === "Maintenance") {
//         // This is a "fake" update since the backend doesn't support it
//         // We find the stall in our *current* state and update it
//         setStalls(prevStalls => prevStalls.map(s => 
//           s.id === stallToSave.id ? { ...s, status: "Maintenance" } : s
//         ));
//       }
      
//     } catch (err) {
//       console.error("Failed to update stall status", err);
//       setError("Failed to update stall.");
//     } finally {
//       setLoading(false);
//       handleCloseModal();
//     }
//   };

//   // --- Render ---
//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">Manage Stalls</h1>
//         <button
//           onClick={fetchStalls}
//           disabled={loading}
//           className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
//         >
//           <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//           Refresh Data
//         </button>
//       </div>

//       {/* --- Controls: Filters, Add Button, View Toggle --- */}
//       <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
//         {/* Filters */}
//         <div className="flex flex-wrap gap-4">
//           <FilterDropdown
//             label="Status"
//             value={statusFilter}
//             onChange={setStatusFilter}
//             options={[
//               { value: "All", label: "All Statuses" },
//               { value: "Available", label: "Available" },
//               { value: "Reserved", label: "Reserved" },
//               { value: "Maintenance", label: "Maintenance" },
//             ]}
//           />
//           <FilterDropdown
//             label="Size"
//             value={sizeFilter}
//             onChange={setSizeFilter}
//             options={[
//               { value: "All", label: "All Sizes" },
//               { value: "Small", label: "Small" },
//               { value: "Medium", label: "Medium" },
//               { value: "Large", label: "Large" },
//             ]}
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-4">
//           {/* View Toggle */}
//           <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
//             <button
//               onClick={() => setViewMode("Grid")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Grid"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <LayoutGrid className="w-4 h-4" />
//               Grid
//             </button>
//             <button
//               onClick={() => setViewMode("Map")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Map"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <MapIcon className="w-4 h-4" />
//               Map
//             </button>
//           </div>

//           <button
//             onClick={handleOpenAddModal}
//             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
//           >
//             <Plus className="w-5 h-5" />
//             Add New Stall
//           </button>
//         </div>
//       </div>

//       {/* --- Stalls Grid or Map --- */}
//       {loading ? (
//         <p className="text-center py-10">Loading stalls...</p>
//       ) : error ? (
//         <p className="text-center py-10 text-red-500">{error}</p>
//       ) : (
//         <>
//           {viewMode === "Grid" && (
//             <StallGrid
//               stalls={filteredStalls}
//               onManageClick={handleOpenEditModal}
//             />
//           )}
//           {viewMode === "Map" && (
//             <StallMap
//               stalls={filteredStalls} // Pass filtered stalls to map
//               onStallClick={handleOpenEditModal}
//             />
//           )}
//         </>
//       )}

//       {/* --- Add/Edit Modal --- */}
//       {isModalOpen && (
//         <ManageStallModal
//           stall={editingStall}
//           onClose={handleCloseModal}
//           onSave={handleSaveStall}
//         />
//       )}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Filter Dropdown Component ---
// // -------------------------------------
// function FilterDropdown({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: { value: string; label: string }[];
// }) {
//   return (
//     <div className="relative">
//       <select
//         id={`filter-${label}`}
//         className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Grid Component ---
// // (This is the card view)
// // -------------------------------------
// function StallGrid({
//   stalls,
//   onManageClick,
// }: {
//   stalls: Stall[];
//   onManageClick: (stall: Stall) => void;
// }) {
//   if (stalls.length === 0) {
//     return <p className="text-center py-10 text-gray-500">No stalls found.</p>;
//   }
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//       {stalls.map((stall) => (
//         <StallCard
//           key={stall.id}
//           stall={stall}
//           onManageClick={() => onManageClick(stall)}
//         />
//       ))}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Card Component ---
// // -------------------------------------
// function StallCard({
//   stall,
//   onManageClick,
// }: {
//   stall: Stall;
//   onManageClick: () => void;
// }) {
//   const statusInfo = {
//     Available: { color: "text-green-600", borderColor: "border-green-200", bgColor: "bg-green-50", Icon: MapIcon },
//     Reserved: { color: "text-red-600", borderColor: "border-red-200", bgColor: "bg-red-50", Icon: X },
//     Maintenance: { color: "text-yellow-600", borderColor: "border-yellow-200", bgColor: "bg-yellow-50", Icon: Wrench },
//   }[stall.status];

//   return (
//     <div
//       className={`flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
//     >
//       <div className="p-5 flex-1">
//         <div className="flex justify-between items-start">
//           <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
//           <span
//             className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color} border border-current`}
//           >
//             {stall.size}
//           </span>
//         </div>
//         <div className="flex items-center gap-2 mt-3">
//           <statusInfo.Icon className={`w-5 h-5 ${statusInfo.color}`} />
//           <span className={`text-sm font-medium ${statusInfo.color}`}>
//             {stall.status}
//           </span>
//         </div>
//         {stall.status === "Reserved" && stall.publisherName && (
//           <p className="text-sm text-gray-600 mt-2 truncate">
//             Booked by: <span className="font-medium">{stall.publisherName}</span>
//           </p>
//         )}
//       </div>
//       <div className="px-5 py-3 bg-white border-t">
//         <button
//           onClick={onManageClick}
//           className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
//         >
//           Manage Stall
//         </button>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- NEW Stall Map Component ---
// // (Based on publisher's StallMap.tsx)
// // -------------------------------------
// function StallMap({
//   stalls,
//   onStallClick,
// }: {
//   stalls: Stall[];
//   onStallClick: (stall: Stall) => void;
// }) {
  
//   // --- Helper functions for admin styling ---
//   const getSizeColor = (size: StallSize) => {
//     switch (size) {
//       case "Small": return "bg-yellow-400 border-yellow-600";
//       case "Medium": return "bg-blue-400 border-blue-600";
//       case "Large": return "bg-red-400 border-red-600";
//     }
//   };
//   const getStatusOpacity = (status: StallStatus) => {
//     // Maintenance and Reserved stalls are faded
//     return status === "Available" ? "opacity-100" : "opacity-40";
//   };
  
//   return (
//     <div className="w-full max-w-[1200px] mx-auto">
//       {/* Floor plan container */}
//       <div className="relative aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden">
//         {/* --- Static elements from publisher map --- */}
//         <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 bg-blue-400 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Entrance
//         </div>
//         <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Exit
//         </div>
//         <div className="absolute top-[16%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Small Stalls Area
//         </div>
//         <div className="absolute top-[53%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Medium Stalls Area
//         </div>
//         <div className="absolute top-[76%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Large Stalls Area
//         </div>
//         <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
//           <span className="font-bold text-xs sm:text-sm">Restrooms</span>
//         </div>
//         <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
//           <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
//         </div>
//         <div className="absolute top-[13.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[29.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[50.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[69.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>

//         {/* --- Render stalls (with ADMIN logic) --- */}
//         {stalls.map((stall) => {
//           const size = getStallSize(stall.size);
//           const position = stallPositions[stall.name];

//           // Don't render if stall has no position
//           if (!position) {
//              console.warn(`No map position for stall: ${stall.name}`);
//              return null;
//           }

//           return (
//             <button
//               key={stall.id}
//               onClick={() => onStallClick(stall)} // Admin "manage" click
//               title={
//                 stall.status === "Reserved" && stall.publisherName
//                   ? `Reserved by ${stall.publisherName}`
//                   : `${stall.name} (${stall.status})`
//               }
//               className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer min-w-10 min-h-8
//                 ${getSizeColor(stall.size)}
//                 ${getStatusOpacity(stall.status)}
//                 hover:opacity-100 hover:scale-105
//               `}
//               style={{
//                 ...position,
//                 ...size,
//                 fontSize: "clamp(0.625rem, 0.75rem, 0.875rem)",
//               }}
//             >
//               <span className="font-bold text-white shadow-sm">{stall.name}</span>
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


// // -------------------------------------
// // --- Manage Stall Modal Component ---
// // -------------------------------------
// function ManageStallModal({
//   stall,
//   onClose,
//   onSave,
// }: {
//   stall: Stall | null;
//   onClose: () => void;
//   onSave: (stall: Stall, newStatus: StallStatus) => void;
// }) {
//   // 'stall' is the data for the stall when the modal was OPENED
//   const [name, setName] = useState(stall?.name || "");
//   const [size, setSize] = useState<StallSize>(stall?.size || "Small");
//   // The 'newStatus' is what the admin wants to change it TO
//   const [newStatus, setNewStatus] = useState<StallStatus>(stall?.status || "Available");
//   // We use useState for publisherName but don't provide a setter, making it read-only
//   const [publisherName] = useState(stall?.publisherName || "");

//   const isNew = stall === null;
//   // A stall is on the map if it's not new AND its name is in the position list
//   const isMapStall = !isNew && stallPositions.hasOwnProperty(name);
//   const title = isNew ? "Add New Stall" : `Manage Stall: ${name}`;

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     if (isNew) {
//       // Logic for *creating* a new stall
//       const newStall: Stall = {
//         id: `new-${Date.now()}`,
//         name,
//         size,
//         status: newStatus,
//         publisherName: newStatus === "Reserved" ? "N/A" : undefined, // Can't assign publisher
//       };
//       // Note: This 'save' will only add to the grid, not the map
//       onSave(newStall, newStatus);
//     } else {
//       // Logic for *editing* an existing stall
//       onSave(stall!, newStatus); // Pass the original stall and the new status
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         <form onSubmit={handleSubmit}>
//           {/* Modal Header */}
//           <div className="flex justify-between items-center p-5 border-b">
//             <h2 className="text-xl font-bold">{title}</h2>
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Modal Body */}
//           <div className="p-6 space-y-4">
//             {/* Stall Name */}
//             <div>
//               <label
//                 htmlFor="stall-name"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Stall Name
//               </label>
//               <input
//                 type="text"
//                 id="stall-name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${isMapStall ? "bg-gray-100" : ""}`}
//                 required
//                 // If it's an existing stall on the map, make name read-only
//                 readOnly={isMapStall}
//                 disabled={isMapStall}
//                 placeholder="e.g., D-01 (if not on map)"
//               />
//               {isMapStall && (
//                 <p className="text-xs text-gray-500 mt-1">Stall name cannot be changed for map stalls.</p>
//               )}
//             </div>
//             {/* Stall Size */}
//             <div>
//               <label
//                 htmlFor="stall-size"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Size
//               </label>
//               <select
//                 id="stall-size"
//                 value={size}
//                 onChange={(e) => setSize(e.target.value as StallSize)}
//                 className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${isMapStall ? "bg-gray-100" : ""}`}
//                 disabled={isMapStall}
//               >
//                 <option value="Small">Small</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Large">Large</option>
//               </select>
//             </div>
//             {/* Stall Status (This is what the admin can change) */}
//             <div>
//               <label
//                 htmlFor="stall-status"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Set New Status
//               </label>
//               <select
//                 id="stall-status"
//                 value={newStatus}
//                 onChange={(e) => setNewStatus(e.target.value as StallStatus)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="Available">Available</option>
//                 <option value="Reserved">Reserved</option>
//                 <option value="Maintenance">Maintenance</option>
//               </select>
              
//               {/* Show a warning if they are un-reserving a stall */}
//               {stall?.status === "Reserved" && newStatus === "Available" && (
//                 <p className="text-xs text-yellow-700 mt-1">
//                   Saving as "Available" will remove the publisher from this stall.
//                 </p>
//               )}
//             </div>
            
//             {/* Publisher Name (Read-only, only shows if reserved) */}
//             {stall?.status === "Reserved" && (
//               <div>
//                 <label
//                   htmlFor="publisher-name"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Current Publisher
//                 </label>
//                 <input
//                   type="text"
//                   id="publisher-name"
//                   value={publisherName}
//                   readOnly
//                   className="mt-1 block w-full border border-gray-30AN0 rounded-md shadow-sm p-2 bg-gray-100"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Modal Footer */}
//           <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

//----------------------------------------------------------------------------------------------------------------------------------------------------------------

// //3rd version of stalls page

// import { useState, useEffect, useMemo, type FormEvent } from "react";
// import {
//   Plus,
//   X,
//   ChevronDown,
//   Wrench,
//   LayoutGrid,
//   Map,
// } from "lucide-react";
// import API from "../services/api"; // Import your configured API

// // --- Type Definitions ---
// // Our frontend Stall object
// type StallStatus = "Available" | "Reserved" | "Maintenance";
// type StallSize = "Small" | "Medium" | "Large";

// interface Stall {
//   id: string; // The Firestore document ID (e.g., "S1", "M1")
//   name: string; // The "display name" (e.g., "S1", "M1")
//   size: StallSize;
//   status: StallStatus;
//   publisherName?: string; // Optional: Who reserved it
// }

// // The raw data structure from the backend
// interface BackendStall {
//   id: string;
//   type: "small" | "medium" | "large"; // Backend uses 'type'
//   isReserved: boolean;
//   reservedBy?: string | null;
//   publisherName?: string | null;
//   reservedAt?: string | null;
//   // Note: Your backend doesn't seem to have a 'Maintenance' status
// }

// // -------------------------------------
// // --- LAYOUT DATA From Publisher Map ---
// // -------------------------------------
// // This is the exact layout from StallMap.tsx
// const stallPositions: Record<string, { top: string; left: string }> = {
//   // Small stalls
//   S1: { top: "5.33%", left: "28.33%" },
//   S2: { top: "5.33%", left: "37.5%" },
//   S3: { top: "5.33%", left: "46.67%" },
//   S4: { top: "5.33%", left: "55.83%" },
//   S5: { top: "5.33%", left: "65%" },
//   S6: { top: "21.87%", left: "28.33%" },
//   S7: { top: "21.87%", left: "37.5%" },
//   S8: { top: "21.87%", left: "46.67%" },
//   S9: { top: "21.87%", left: "55.83%" },
//   S10: { top: "21.87%", left: "65%" },
//   // Medium stalls
//   M1: { top: "41.07%", left: "27.58%" },
//   M2: { top: "41.07%", left: "39.42%" },
//   M3: { top: "41.07%", left: "51.25%" },
//   M4: { top: "41.07%", left: "63.08%" },
//   M5: { top: "59.73%", left: "27.58%" },
//   M6: { top: "59.73%", left: "39.42%" },
//   M7: { top: "59.73%", left: "51.25%" },
//   M8: { top: "59.73%", left: "63.08%" },
//   // Large stalls
//   L1: { top: "81.07%", left: "7.75%" },
//   L2: { top: "81.07%", left: "22.25%" },
//   L3: { top: "81.07%", left: "36.75%" },
//   L4: { top: "81.07%", left: "51.25%" },
//   L5: { top: "81.07%", left: "65.75%" },
//   L6: { top: "81.07%", left: "80.25%" },
// };

// // Adapted from the publisher's getStallSize function
// const getStallSize = (size: StallSize): { width: string; height: string } => {
//   switch (size) {
//     case "Small":
//       return { width: "6.67%", height: "8.53%" };
//     case "Medium":
//       return { width: "9.33%", height: "10.67%" };
//     case "Large":
//       return { width: "12%", height: "12.8%" };
//     default:
//       return { width: "8%", height: "10.67%" };
//   }
// };

// // -------------------------------------
// // --- Main Stalls Page Component ---
// // -------------------------------------
// export default function StallsPage() {
//   // --- State ---
//   const [stalls, setStalls] = useState<Stall[]>([]); // Our frontend stall list
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // View Mode State
//   const [viewMode, setViewMode] = useState<"Grid" | "Map">("Map");

//   // Filter State
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [sizeFilter, setSizeFilter] = useState("All");

//   // Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingStall, setEditingStall] = useState<Stall | null>(null);

//   /**
//    * Translates backend data (from Firestore) into the format our frontend UI needs
//    */
//   const translateBackendStall = (beStall: BackendStall): Stall => {
//     // --- UPDATED ---
//     // We explicitly type sizeMap to tell TypeScript its values are of type StallSize
//     const sizeMap: Record<"small" | "medium" | "large", StallSize> = {
//       small: "Small",
//       medium: "Medium",
//       large: "Large",
//     };
//     // --- END UPDATE ---
    
//     // Note: The backend doesn't have a "Maintenance" status, so we don't handle it
//     const status: StallStatus = beStall.isReserved ? "Reserved" : "Available";

//     return {
//       id: beStall.id,
//       name: beStall.id, // The ID is the name (e.g., "S1")
//       size: sizeMap[beStall.type], // This is now correctly typed
//       status: status,
//       publisherName: beStall.publisherName || undefined,
//     };
//   };

//   // --- Data Fetching ---
//   useEffect(() => {
//     fetchStalls(); // Fetch on component mount
//   }, []); // Empty array means this runs once

//   const fetchStalls = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       // --- THIS IS NOW A REAL API CALL ---
//       const response = await API.get("/reservations/stalls");
      
//       // Translate the backend data to our frontend format
//       const backendStalls: BackendStall[] = response.data;
//       const frontendStalls = backendStalls.map(translateBackendStall);
      
//       setStalls(frontendStalls);
//       // --- END REAL API CALL ---

//     } catch (err) {
//       console.error("Failed to fetch stalls:", err);
//       setError("Failed to fetch stalls.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --- Filtering ---
//   const filteredStalls = useMemo(() => {
//     return stalls
//       .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
//       .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
//   }, [stalls, statusFilter, sizeFilter]);

//   // --- Event Handlers ---
//   const handleOpenAddModal = () => {
//     // Note: The backend doesn't seem to have an endpoint for admins to create stalls.
//     // This will only add it locally for now.
//     setEditingStall(null); // Clear any editing stall
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (stall: Stall) => {
//     setEditingStall(stall);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setEditingStall(null);
//   };

//   // --- Save Stall (Add or Edit) ---
//   const handleSaveStall = async (savedStall: Stall) => {
//     if (!editingStall) {
//       // This is a NEW stall.
//       // Your backend doesn't have an admin endpoint to create stalls.
//       // For now, we just add it to the local list.
//       const newStall = { ...savedStall, id: `stall-${Date.now()}` };
//       setStalls((prev) => [newStall, ...prev]);
//       console.log("--- DEV MODE: Added new stall locally ---", newStall);
//       handleCloseModal();
//       return;
//     }
    
//     // This is an EXISTING stall.
//     // We are only handling status changes.
//     const originalStall = editingStall;
//     const newStatus = savedStall.status;
//     // const newPublisherName = savedStall.publisherName; // <-- This line is removed

//     if (originalStall.status === "Reserved" && newStatus === "Available") {
//       // --- API CALL: Un-reserve a stall ---
//       try {
//         await API.delete(`/reservations/admin/unreserve/${originalStall.id}`);
//         // Success! Refresh all stalls from the server to be safe.
//         fetchStalls();
//       } catch (err) {
//         console.error("Failed to unreserve stall:", err);
//         // Don't close modal, show error
//       }
//     } else if (originalStall.status === "Available" && newStatus === "Reserved") {
//       // --- API CALL: Manually reserve a stall ---
//       // Your backend doesn't have this endpoint (only publisher can reserve).
//       // We will just update it locally.
//       console.log("--- DEV MODE: Manually reserving stall (local only) ---");
//       setStalls((prev) =>
//         prev.map((s) => (s.id === savedStall.id ? savedStall : s))
//       );
//     } else {
//       // No API call needed, just update publisher name
//       setStalls((prev) =>
//         prev.map((s) => (s.id === savedStall.id ? savedStall : s))
//       );
//     }

//     handleCloseModal();
//   };

//   // --- Render ---
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Manage Stalls</h1>

//       {/* --- Controls: Filters, Add Button, View Toggle --- */}
//       <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
//         {/* Filters */}
//         <div className="flex flex-wrap gap-4">
//           <FilterDropdown
//             label="Status"
//             value={statusFilter}
//             onChange={setStatusFilter}
//             options={[
//               { value: "All", label: "All Statuses" },
//               { value: "Available", label: "Available" },
//               { value: "Reserved", label: "Reserved" },
//               // { value: "Maintenance", label: "Maintenance" }, // Backend doesn't support this
//             ]}
//           />
//           <FilterDropdown
//             label="Size"
//             value={sizeFilter}
//             onChange={setSizeFilter}
//             options={[
//               { value: "All", label: "All Sizes" },
//               { value: "Small", label: "Small" },
//               { value: "Medium", label: "Medium" },
//               { value: "Large", label: "Large" },
//             ]}
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-4">
//           {/* View Toggle */}
//           <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
//             <button
//               onClick={() => setViewMode("Grid")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Grid"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <LayoutGrid className="w-4 h-4" />
//               Grid
//             </button>
//             <button
//               onClick={() => setViewMode("Map")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Map"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <Map className="w-4 h-4" />
//               Map
//             </button>
//           </div>

//           <button
//             onClick={handleOpenAddModal}
//             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
//           >
//             <Plus className="w-5 h-5" />
//             Add New Stall
//           </button>
//         </div>
//       </div>

//       {/* --- Stalls Grid or Map --- */}
//       {loading ? (
//         <p className="text-center py-10">Loading stalls...</p>
//       ) : error ? (
//         <p className="text-center py-10 text-red-500">{error}</p>
//       ) : (
//         <>
//           {viewMode === "Grid" && (
//             <StallGrid
//               stalls={filteredStalls}
//               onManageClick={handleOpenEditModal}
//             />
//           )}
//           {viewMode === "Map" && (
//             <StallMap
//               stalls={stalls} // Pass ALL stalls to map
//               onStallClick={handleOpenEditModal}
//             />
//           )}
//         </>
//       )}

//       {/* --- Add/Edit Modal --- */}
//       {isModalOpen && (
//         <ManageStallModal
//           stall={editingStall}
//           onClose={handleCloseModal}
//           onSave={handleSaveStall}
//         />
//       )}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Filter Dropdown Component ---
// // -------------------------------------
// function FilterDropdown({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: { value: string; label: string }[];
// }) {
//   return (
//     <div className="relative">
//       <select
//         id={`filter-${label}`}
//         className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Grid Component ---
// // (This is the card view)
// // -------------------------------------
// function StallGrid({
//   stalls,
//   onManageClick,
// }: {
//   stalls: Stall[];
//   onManageClick: (stall: Stall) => void;
// }) {
//   if (stalls.length === 0) {
//     return <p className="text-center py-10 text-gray-500">No stalls found.</p>;
//   }
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//       {stalls.map((stall) => (
//         <StallCard
//           key={stall.id}
//           stall={stall}
//           onManageClick={() => onManageClick(stall)}
//         />
//       ))}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Card Component ---
// // -------------------------------------
// function StallCard({
//   stall,
//   onManageClick,
// }: {
//   stall: Stall;
//   onManageClick: () => void;
// }) {
//   const statusInfo = {
//     Available: { color: "text-green-600", borderColor: "border-green-200", bgColor: "bg-green-50" },
//     Reserved: { color: "text-red-600", borderColor: "border-red-200", bgColor: "bg-red-50" },
//     Maintenance: { color: "text-yellow-600", borderColor: "border-yellow-200", bgColor: "bg-yellow-50" },
//   }[stall.status];

//   return (
//     <div
//       className={`flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
//     >
//       <div className="p-5 flex-1">
//         <div className="flex justify-between items-start">
//           <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
//           <span
//             className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color} border border-current`}
//           >
//             {stall.size}
//           </span>
//         </div>
//         <div className="flex items-center gap-2 mt-3">
//           {stall.status === "Available" && <Map className={`w-5 h-5 ${statusInfo.color}`} />}
//           {stall.status === "Reserved" && <X className={`w-5 h-5 ${statusInfo.color}`} />}
//           {stall.status === "Maintenance" && <Wrench className={`w-5 h-5 ${statusInfo.color}`} />}
//           <span className={`text-sm font-medium ${statusInfo.color}`}>
//             {stall.status}
//           </span>
//         </div>
//         {stall.status === "Reserved" && stall.publisherName && (
//           <p className="text-sm text-gray-600 mt-2 truncate">
//             Booked by: <span className="font-medium">{stall.publisherName}</span>
//           </p>
//         )}
//       </div>
//       <div className="px-5 py-3 bg-white border-t">
//         <button
//           onClick={onManageClick}
//           className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
//         >
//           Manage Stall
//         </button>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- NEW Stall Map Component ---
// // (Based on publisher's StallMap.tsx)
// // -------------------------------------
// function StallMap({
//   stalls,
//   onStallClick,
// }: {
//   stalls: Stall[];
//   onStallClick: (stall: Stall) => void;
// }) {
  
//   // --- Helper functions for admin styling ---
//   const getSizeColor = (size: StallSize) => {
//     switch (size) {
//       case "Small": return "bg-yellow-400 border-yellow-600";
//       case "Medium": return "bg-blue-400 border-blue-600";
//       case "Large": return "bg-red-400 border-red-600";
//     }
//   };
//   const getStatusOpacity = (status: StallStatus) => {
//     // Maintenance and Reserved are faded
//     return status === "Available" ? "opacity-100" : "opacity-40";
//   };
  
//   return (
//     <div className="w-full max-w-[1200px] mx-auto">
//       {/* Floor plan container */}
//       <div className="relative aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden">
//         {/* --- Static elements from publisher map --- */}
//         <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 bg-blue-400 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowLrap">
//           Entrance
//         </div>
//         <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Exit
//         </div>
//         <div className="absolute top-[16%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Small Stalls Area
//         </div>
//         <div className="absolute top-[53%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Medium Stalls Area
//         </div>
//         <div className="absolute top-[76%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Large Stalls Area
//         </div>
//         <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
//           <span className="font-bold text-xs sm:text-sm">Restrooms</span>
//         </div>
//         <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
//           <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
//         </div>
//         <div className="absolute top-[13.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[29.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[50.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[69.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>

//         {/* --- Render stalls (with ADMIN logic) --- */}
//         {stalls.map((stall) => {
//           const size = getStallSize(stall.size);
//           const position = stallPositions[stall.name];

//           // Don't render if stall has no position
//           if (!position) {
//              console.warn(`No map position for stall: ${stall.name}`);
//              return null;
//           }

//           return (
//             <button
//               key={stall.id}
//               onClick={() => onStallClick(stall)} // Admin "manage" click
//               title={
//                 stall.status === "Reserved" && stall.publisherName
//                   ? `Reserved by ${stall.publisherName}`
//                   : `${stall.name} (${stall.status})`
//               }
//               className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer min-w-10 min-h-8
//                 ${getSizeColor(stall.size)}
//                 ${getStatusOpacity(stall.status)}
//                 hover:opacity-100 hover:scale-105
//               `}
//               style={{
//                 ...position,
//                 ...size,
//                 fontSize: "clamp(0.625rem, 0.75rem, 0.875rem)",
//               }}
//             >
//               <span className="font-bold text-white shadow-sm">{stall.name}</span>
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


// // -------------------------------------
// // --- Manage Stall Modal Component ---
// // -------------------------------------
// function ManageStallModal({
//   stall,
//   onClose,
//   onSave,
// }: {
//   stall: Stall | null;
//   onClose: () => void;
//   onSave: (stall: Stall) => void;
// }) {
//   const [name, setName] = useState(stall?.name || "");
//   const [size, setSize] = useState<StallSize>(stall?.size || "Small");
//   const [status, setStatus] = useState<StallStatus>(stall?.status || "Available");
//   const [publisherName, setPublisherName] = useState(stall?.publisherName || "");

//   const isNew = stall === null;
//   const title = isNew ? "Add New Stall" : "Manage Stall";

//   // Check if the stall is a map-based stall
//   const isMapStall = !isNew && stallPositions.hasOwnProperty(stall.name);

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     onSave({
//       id: stall?.id || "",
//       name,
//       size,
//       status,
//       publisherName: status === "Reserved" ? publisherName : undefined,
//     });
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         <form onSubmit={handleSubmit}>
//           {/* Modal Header */}
//           <div className="flex justify-between items-center p-5 border-b">
//             <h2 className="text-xl font-bold">{title}</h2>
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Modal Body */}
//           <div className="p-6 space-y-4">
//             {/* Stall Name */}
//             <div>
//               <label
//                 htmlFor="stall-name"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Stall Name
//               </label>
//               <input
//                 type="text"
//                 id="stall-name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${
//                   isMapStall ? "bg-gray-100" : ""
//                 }`}
//                 required
//                 readOnly={isMapStall}
//                 disabled={isMapStall}
//                 placeholder="e.g., D-01 (if not on map)"
//               />
//               {isMapStall && (
//                 <p className="text-xs text-gray-500 mt-1">Stall name cannot be changed for map stalls.</p>
//               )}
//             </div>
//             {/* Stall Size */}
//             <div>
//               <label
//                 htmlFor="stall-size"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Size
//               </label>
//               <select
//                 id="stall-size"
//                 value={size}
//                 onChange={(e) => setSize(e.target.value as StallSize)}
//                 className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 ${
//                   isMapStall ? "bg-gray-100" : ""
//                 }`}
//                 disabled={isMapStall}
//               >
//                 <option value="Small">Small</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Large">Large</option>
//               </select>
//             </div>
//             {/* Stall Status */}
//             <div>
//               <label
//                 htmlFor="stall-status"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Status
//               </label>
//               <select
//                 id="stall-status"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value as StallStatus)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="Available">Available</option>
//                 <option value="Reserved">Reserved</option>
//                 {/* Your backend doesn't support this, but we leave it in the UI.
//                     Setting it won't make an API call. */}
//                 <option value="Maintenance">Maintenance</option>
//               </select>
//             </div>
//             {/* Publisher Name (Conditional) */}
//             {status === "Reserved" && (
//               <div>
//                 <label
//                   htmlFor="publisher-name"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Publisher Name (if Reserved)
//                 </label>
//                 <input
//                   type="text"
//                   id="publisher-name"
//                   value={publisherName}
//                   onChange={(e) => setPublisherName(e.target.value)}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="e.g., Book Co. Lanka"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Modal Footer */}
//           <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------

// //2nd version of stalls page - new map-based admin page

// import { useState, useEffect, useMemo, type FormEvent } from "react";
// import {
//   Plus,
//   X,
//   ChevronDown,
//   Wrench,
//   LayoutGrid,
//   Map,
// } from "lucide-react";
// // Note: CheckSquare and XSquare are no longer used by the new map
// // and have been removed from imports.

// // --- Type Definitions ---
// type StallStatus = "Available" | "Reserved" | "Maintenance";
// type StallSize = "Small" | "Medium" | "Large";

// interface Stall {
//   id: string;
//   name: string; // The "display name" like S1, M1, L1
//   size: StallSize;
//   status: StallStatus;
//   publisherName?: string; // Optional: Who reserved it
// }

// // -------------------------------------
// // --- NEW MOCK DATA ---
// // This list is now based on the publisher's StallMap.tsx
// // (10 Small, 8 Medium, 6 Large)
// // -------------------------------------
// const mockStalls: Stall[] = [
//   // Small Stalls (10)
//   { id: "s-s1", name: "S1", size: "Small", status: "Available" },
//   { id: "s-s2", name: "S2", size: "Small", status: "Reserved", publisherName: "Book Co. Lanka" },
//   { id: "s-s3", name: "S3", size: "Small", status: "Available" },
//   { id: "s-s4", name: "S4", size: "Small", status: "Available" },
//   { id: "s-s5", name: "S5", size: "Small", status: "Maintenance" },
//   { id: "s-s6", name: "S6", size: "Small", status: "Available" },
//   { id: "s-s7", name: "S7", size: "Small", status: "Reserved", publisherName: "Pages Inc." },
//   { id: "s-s8", name: "S8", size: "Small", status: "Available" },
//   { id: "s-s9", name: "S9", size: "Small", status: "Available" },
//   { id: "s-s10", name: "S10", size: "Small", status: "Available" },
//   // Medium Stalls (8)
//   { id: "s-m1", name: "M1", size: "Medium", status: "Available" },
//   { id: "s-m2", name: "M2", size: "Medium", status: "Available" },
//   { id: "s-m3", name: "M3", size: "Medium", status: "Reserved", publisherName: "Kandy Books" },
//   { id: "s-m4", name: "M4", size: "Medium", status: "Available" },
//   { id: "s-m5", name: "M5", size: "Medium", status: "Available" },
//   { id: "s-m6", name: "M6", size: "Medium", status: "Available" },
//   { id: "s-m7", name: "M7", size: "Medium", status: "Maintenance" },
//   { id: "s-m8", name: "M8", size: "Medium", status: "Reserved", publisherName: "Galle Pubs" },
//   // Large Stalls (6)
//   { id: "s-l1", name: "L1", size: "Large", status: "Available" },
//   { id: "s-l2", name: "L2", size: "Large", status: "Reserved", publisherName: "Colombo Books" },
//   { id: "s-l3", name: "L3", size: "Large", status: "Available" },
//   { id: "s-l4", name: "L4", size: "Large", status: "Available" },
//   { id: "s-l5", name: "L5", size: "Large", status: "Reserved", publisherName: "Readers Ltd." },
//   { id: "s-l6", name: "L6", size: "Large", status: "Available" },
// ];

// // -------------------------------------
// // --- LAYOUT DATA From Publisher Map ---
// // -------------------------------------
// // This is the exact layout from StallMap.tsx
// const stallPositions: Record<string, { top: string; left: string }> = {
//   // Small stalls
//   S1: { top: "5.33%", left: "28.33%" },
//   S2: { top: "5.33%", left: "37.5%" },
//   S3: { top: "5.33%", left: "46.67%" },
//   S4: { top: "5.33%", left: "55.83%" },
//   S5: { top: "5.33%", left: "65%" },
//   S6: { top: "21.87%", left: "28.33%" },
//   S7: { top: "21.87%", left: "37.5%" },
//   S8: { top: "21.87%", left: "46.67%" },
//   S9: { top: "21.87%", left: "55.83%" },
//   S10: { top: "21.87%", left: "65%" },
//   // Medium stalls
//   M1: { top: "41.07%", left: "27.58%" },
//   M2: { top: "41.07%", left: "39.42%" },
//   M3: { top: "41.07%", left: "51.25%" },
//   M4: { top: "41.07%", left: "63.08%" },
//   M5: { top: "59.73%", left: "27.58%" },
//   M6: { top: "59.73%", left: "39.42%" },
//   M7: { top: "59.73%", left: "51.25%" },
//   M8: { top: "59.73%", left: "63.08%" },
//   // Large stalls
//   L1: { top: "81.07%", left: "7.75%" },
//   L2: { top: "81.07%", left: "22.25%" },
//   L3: { top: "81.07%", left: "36.75%" },
//   L4: { top: "81.07%", left: "51.25%" },
//   L5: { top: "81.07%", left: "65.75%" },
//   L6: { top: "81.07%", left: "80.25%" },
// };

// // Adapted from the publisher's getStallSize function
// const getStallSize = (size: StallSize): { width: string; height: string } => {
//   switch (size) {
//     case "Small":
//       return { width: "6.67%", height: "8.53%" };
//     case "Medium":
//       return { width: "9.33%", height: "10.67%" };
//     case "Large":
//       return { width: "12%", height: "12.8%" };
//     default:
//       return { width: "8%", height: "10.67%" };
//   }
// };

// // -------------------------------------
// // --- Main Stalls Page Component ---
// // -------------------------------------
// export default function StallsPage() {
//   // --- State ---
//   const [stalls, setStalls] = useState<Stall[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // View Mode State
//   const [viewMode, setViewMode] = useState<"Grid" | "Map">("Map");

//   // Filter State
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [sizeFilter, setSizeFilter] = useState("All");

//   // Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingStall, setEditingStall] = useState<Stall | null>(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchStalls = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // --- DEVELOPMENT: Using Mock Data ---
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
//         setStalls(mockStalls); // Using the new mockStalls list
//         // --- END DEVELOPMENT ---
//       } catch (err) {
//         console.error("Failed to fetch stalls:", err);
//         setError("Failed to fetch stalls.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStalls();
//   }, []); // Runs once on component mount

//   // --- Filtering ---
//   const filteredStalls = useMemo(() => {
//     return stalls
//       .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
//       .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
//   }, [stalls, statusFilter, sizeFilter]);

//   // --- Event Handlers ---
//   const handleOpenAddModal = () => {
//     setEditingStall(null); // Clear any editing stall
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (stall: Stall) => {
//     setEditingStall(stall);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setEditingStall(null);
//   };

//   // --- DEV MODE: Save Stall (Add or Edit) ---
//   const handleSaveStall = (savedStall: Stall) => {
//     if (editingStall) {
//       // Edit existing stall
//       setStalls((prev) =>
//         prev.map((s) => (s.id === savedStall.id ? savedStall : s))
//       );
//       console.log("--- DEV MODE: Edited stall ---", savedStall);
//     } else {
//       // Add new stall
//       // NOTE: New stalls added this way won't appear on the map
//       // unless you add them to the `stallPositions` object.
//       const newStall = { ...savedStall, id: `stall-${Date.now()}` };
//       setStalls((prev) => [newStall, ...prev]);
//       console.log("--- DEV MODE: Added new stall ---", newStall);
//     }
//     handleCloseModal();
//   };

//   // --- Render ---
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Manage Stalls</h1>

//       {/* --- Controls: Filters, Add Button, View Toggle --- */}
//       <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
//         {/* Filters */}
//         <div className="flex flex-wrap gap-4">
//           <FilterDropdown
//             label="Status"
//             value={statusFilter}
//             onChange={setStatusFilter}
//             options={[
//               { value: "All", label: "All Statuses" },
//               { value: "Available", label: "Available" },
//               { value: "Reserved", label: "Reserved" },
//               { value: "Maintenance", label: "Maintenance" },
//             ]}
//           />
//           <FilterDropdown
//             label="Size"
//             value={sizeFilter}
//             onChange={setSizeFilter}
//             options={[
//               { value: "All", label: "All Sizes" },
//               { value: "Small", label: "Small" },
//               { value: "Medium", label: "Medium" },
//               { value: "Large", label: "Large" },
//             ]}
//           />
//         </div>

//         {/* Buttons */}
//         <div className="flex gap-4">
//           {/* View Toggle */}
//           <div className="flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
//             <button
//               onClick={() => setViewMode("Grid")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Grid"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <LayoutGrid className="w-4 h-4" />
//               Grid
//             </button>
//             <button
//               onClick={() => setViewMode("Map")}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${
//                 viewMode === "Map"
//                   ? "bg-white text-blue-600 shadow-sm"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               <Map className="w-4 h-4" />
//               Map
//             </button>
//           </div>

//           <button
//             onClick={handleOpenAddModal}
//             className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
//           >
//             <Plus className="w-5 h-5" />
//             Add New Stall
//           </button>
//         </div>
//       </div>

//       {/* --- Stalls Grid or Map --- */}
//       {loading ? (
//         <p className="text-center py-10">Loading stalls...</p>
//       ) : error ? (
//         <p className="text-center py-10 text-red-500">{error}</p>
//       ) : (
//         <>
//           {viewMode === "Grid" && (
//             <StallGrid
//               stalls={filteredStalls}
//               onManageClick={handleOpenEditModal}
//             />
//           )}
//           {viewMode === "Map" && (
//             <StallMap
//               stalls={filteredStalls} // Pass filtered stalls to map
//               onStallClick={handleOpenEditModal}
//             />
//           )}
//         </>
//       )}

//       {/* --- Add/Edit Modal --- */}
//       {isModalOpen && (
//         <ManageStallModal
//           stall={editingStall}
//           onClose={handleCloseModal}
//           onSave={handleSaveStall}
//         />
//       )}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Filter Dropdown Component ---
// // -------------------------------------
// function FilterDropdown({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: { value: string; label: string }[];
// }) {
//   return (
//     <div className="relative">
//       <select
//         id={`filter-${label}`}
//         className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Grid Component ---
// // (This is the card view)
// // -------------------------------------
// function StallGrid({
//   stalls,
//   onManageClick,
// }: {
//   stalls: Stall[];
//   onManageClick: (stall: Stall) => void;
// }) {
//   if (stalls.length === 0) {
//     return <p className="text-center py-10 text-gray-500">No stalls found.</p>;
//   }
//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//       {stalls.map((stall) => (
//         <StallCard
//           key={stall.id}
//           stall={stall}
//           onManageClick={() => onManageClick(stall)}
//         />
//       ))}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Card Component ---
// // -------------------------------------
// function StallCard({
//   stall,
//   onManageClick,
// }: {
//   stall: Stall;
//   onManageClick: () => void;
// }) {
//   const statusInfo = {
//     Available: { color: "text-green-600", borderColor: "border-green-200", bgColor: "bg-green-50" },
//     Reserved: { color: "text-red-600", borderColor: "border-red-200", bgColor: "bg-red-50" },
//     Maintenance: { color: "text-yellow-600", borderColor: "border-yellow-200", bgColor: "bg-yellow-50" },
//   }[stall.status];

//   return (
//     <div
//       className={`flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden border-2 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
//     >
//       <div className="p-5 flex-1">
//         <div className="flex justify-between items-start">
//           <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
//           <span
//             className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color} border border-current`}
//           >
//             {stall.size}
//           </span>
//         </div>
//         <div className="flex items-center gap-2 mt-3">
//           {stall.status === "Available" && <Map className={`w-5 h-5 ${statusInfo.color}`} />}
//           {stall.status === "Reserved" && <X className={`w-5 h-5 ${statusInfo.color}`} />}
//           {stall.status === "Maintenance" && <Wrench className={`w-5 h-5 ${statusInfo.color}`} />}
//           <span className={`text-sm font-medium ${statusInfo.color}`}>
//             {stall.status}
//           </span>
//         </div>
//         {stall.status === "Reserved" && stall.publisherName && (
//           <p className="text-sm text-gray-600 mt-2 truncate">
//             Booked by: <span className="font-medium">{stall.publisherName}</span>
//           </p>
//         )}
//       </div>
//       <div className="px-5 py-3 bg-white border-t">
//         <button
//           onClick={onManageClick}
//           className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
//         >
//           Manage Stall
//         </button>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- NEW Stall Map Component ---
// // (Based on publisher's StallMap.tsx)
// // -------------------------------------
// function StallMap({
//   stalls,
//   onStallClick,
// }: {
//   stalls: Stall[];
//   onStallClick: (stall: Stall) => void;
// }) {
  
//   // --- Helper functions for admin styling ---
//   const getSizeColor = (size: StallSize) => {
//     switch (size) {
//       case "Small": return "bg-yellow-400 border-yellow-600";
//       case "Medium": return "bg-blue-400 border-blue-600";
//       case "Large": return "bg-red-400 border-red-600";
//     }
//   };
//   const getStatusOpacity = (status: StallStatus) => {
//     return status === "Available" ? "opacity-100" : "opacity-40";
//   };
  
//   return (
//     <div className="w-full max-w-[1200px] mx-auto">
//       {/* Floor plan container */}
//       <div className="relative aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden">
//         {/* --- Static elements from publisher map --- */}
//         <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 bg-blue-400 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Entrance
//         </div>
//         <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Exit
//         </div>
//         <div className="absolute top-[16%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Small Stalls Area
//         </div>
//         <div className="absolute top-[53%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Medium Stalls Area
//         </div>
//         <div className="absolute top-[76%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Large Stalls Area
//         </div>
//         <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
//           <span className="font-bold text-xs sm:text-sm">Restrooms</span>
//         </div>
//         <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
//           <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
//         </div>
//         <div className="absolute top-[13.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[29.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[50.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[69.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>

//         {/* --- Render stalls (with ADMIN logic) --- */}
//         {stalls.map((stall) => {
//           const size = getStallSize(stall.size);
//           const position = stallPositions[stall.name];

//           // Don't render if stall has no position
//           if (!position) {
//              console.warn(`No map position for stall: ${stall.name}`);
//              return null;
//           }

//           return (
//             <button
//               key={stall.id}
//               onClick={() => onStallClick(stall)} // Admin "manage" click
//               title={
//                 stall.status === "Reserved" && stall.publisherName
//                   ? `Reserved by ${stall.publisherName}`
//                   : `${stall.name} (${stall.status})`
//               }
//               className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer min-w-10 min-h-8
//                 ${getSizeColor(stall.size)}
//                 ${getStatusOpacity(stall.status)}
//                 hover:opacity-100 hover:scale-105
//               `}
//               style={{
//                 ...position,
//                 ...size,
//                 fontSize: "clamp(0.625rem, 0.75rem, 0.875rem)",
//               }}
//             >
//               <span className="font-bold text-white shadow-sm">{stall.name}</span>
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


// // -------------------------------------
// // --- Manage Stall Modal Component ---
// // (This is unchanged and will work with the new map)
// // -------------------------------------
// function ManageStallModal({
//   stall,
//   onClose,
//   onSave,
// }: {
//   stall: Stall | null;
//   onClose: () => void;
//   onSave: (stall: Stall) => void;
// }) {
//   const [name, setName] = useState(stall?.name || "");
//   const [size, setSize] = useState<StallSize>(stall?.size || "Small");
//   const [status, setStatus] = useState<StallStatus>(stall?.status || "Available");
//   const [publisherName, setPublisherName] = useState(stall?.publisherName || "");

//   const isNew = stall === null;
//   const title = isNew ? "Add New Stall" : "Manage Stall";

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     onSave({
//       id: stall?.id || "", // ID will be handled by onSave
//       name,
//       size,
//       status,
//       publisherName: status === "Reserved" ? publisherName : undefined,
//     });
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         <form onSubmit={handleSubmit}>
//           {/* Modal Header */}
//           <div className="flex justify-between items-center p-5 border-b">
//             <h2 className="text-xl font-bold">{title}</h2>
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Modal Body */}
//           <div className="p-6 space-y-4">
//             {/* Stall Name */}
//             <div>
//               <label
//                 htmlFor="stall-name"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Stall Name
//               </label>
//               <input
//                 type="text"
//                 id="stall-name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                 required
//                 // If it's an existing stall on the map, make name read-only
//                 readOnly={!isNew && stallPositions.hasOwnProperty(name)}
//                 disabled={!isNew && stallPositions.hasOwnProperty(name)}
//                 placeholder="e.g., D-01 (if not on map)"
//               />
//               {!isNew && stallPositions.hasOwnProperty(name) && (
//                 <p className="text-xs text-gray-500 mt-1">Stall name cannot be changed for map stalls.</p>
//               )}
//             </div>
//             {/* Stall Size */}
//             <div>
//               <label
//                 htmlFor="stall-size"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Size
//               </label>
//               <select
//                 id="stall-size"
//                 value={size}
//                 onChange={(e) => setSize(e.target.value as StallSize)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                 disabled={!isNew && stallPositions.hasOwnProperty(name)}
//               >
//                 <option value="Small">Small</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Large">Large</option>
//               </select>
//             </div>
//             {/* Stall Status */}
//             <div>
//               <label
//                 htmlFor="stall-status"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Status
//               </label>
//               <select
//                 id="stall-status"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value as StallStatus)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="Available">Available</option>
//                 <option value="Reserved">Reserved</option>
//                 <option value="Maintenance">Maintenance</option>
//               </select>
//             </div>
//             {/* Publisher Name (Conditional) */}
//             {status === "Reserved" && (
//               <div>
//                 <label
//                   htmlFor="publisher-name"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Publisher Name (if Reserved)
//                 </label>
//                 <input
//                   type="text"
//                   id="publisher-name"
//                   value={publisherName}
//                   onChange={(e) => setPublisherName(e.target.value)}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="e.g., Book Co. Lanka"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Modal Footer */}
//           <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }


// //1st version of stalls page - to be replaced with the new version

// import { useState, useEffect, useMemo, type FormEvent } from "react";
// import {
//   Plus,
//   X,
//   ChevronDown,
//   CheckSquare,
//   XSquare,
//   Wrench,
// } from "lucide-react";
// //import API from "../services/api"; // For when you're ready to connect

// // --- Type Definitions ---
// type StallStatus = "Available" | "Reserved" | "Maintenance";
// type StallSize = "Small" | "Medium" | "Large";

// interface Stall {
//   id: string;
//   name: string;
//   size: StallSize;
//   status: StallStatus;
//   publisherName?: string; // Optional: Who reserved it
// }

// // --- Mock Data (for development) ---
// const mockStalls: Stall[] = [
//   {
//     id: "stall-001",
//     name: "A-01",
//     size: "Medium",
//     status: "Reserved",
//     publisherName: "Book Co. Lanka",
//   },
//   {
//     id: "stall-002",
//     name: "A-02",
//     size: "Medium",
//     status: "Available",
//   },
//   {
//     id: "stall-003",
//     name: "A-03",
//     size: "Small",
//     status: "Maintenance",
//   },
//   {
//     id: "stall-004",
//     name: "B-01",
//     size: "Large",
//     status: "Available",
//   },
//   {
//     id: "stall-005",
//     name: "B-02",
//     size: "Large",
//     status: "Reserved",
//     publisherName: "Readers Ltd.",
//   },
//   {
//     id: "stall-006",
//     name: "C-01",
//     size: "Small",
//     status: "Available",
//   },
//   {
//     id: "stall-007",
//     name: "C-02",
//     size: "Small",
//     status: "Reserved",
//     publisherName: "Pages Inc.",
//   },
// ];
// // --- End Mock Data ---

// // -------------------------------------
// // --- Main Stalls Page Component ---
// // -------------------------------------
// export default function StallsPage() {
//   // --- State ---
//   const [stalls, setStalls] = useState<Stall[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Filter State
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [sizeFilter, setSizeFilter] = useState("All");

//   // Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingStall, setEditingStall] = useState<Stall | null>(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchStalls = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // --- DEVELOPMENT: Using Mock Data ---
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
//         setStalls(mockStalls);
//         // --- END DEVELOPMENT ---

//         /* --- PRODUCTION: Real API Call (uncomment when ready) ---
//         const response = await API.get("/stalls");
//         setStalls(response.data);
//         */
//       } catch (err) {
//         console.error("Failed to fetch stalls:", err);
//         setError("Failed to fetch stalls.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStalls();
//   }, []); // Runs once on component mount

//   // --- Filtering ---
//   const filteredStalls = useMemo(() => {
//     return stalls
//       .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
//       .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
//   }, [stalls, statusFilter, sizeFilter]);

//   // --- Event Handlers ---
//   const handleOpenAddModal = () => {
//     setEditingStall(null); // Clear any editing stall
//     setIsModalOpen(true);
//   };

//   const handleOpenEditModal = (stall: Stall) => {
//     setEditingStall(stall);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setEditingStall(null);
//   };

//   // --- DEV MODE: Save Stall (Add or Edit) ---
//   const handleSaveStall = (savedStall: Stall) => {
//     if (editingStall) {
//       // Edit existing stall
//       setStalls((prev) =>
//         prev.map((s) => (s.id === savedStall.id ? savedStall : s))
//       );
//       console.log("--- DEV MODE: Edited stall ---", savedStall);
//     } else {
//       // Add new stall
//       const newStall = { ...savedStall, id: `stall-${Date.now()}` }; // Create a temp ID
//       setStalls((prev) => [newStall, ...prev]);
//       console.log("--- DEV MODE: Added new stall ---", newStall);
//     }
//     handleCloseModal();
//   };

//   // --- Render ---
//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Manage Stalls</h1>

//       {/* --- Controls: Filters and Add Button --- */}
//       <div className="flex justify-between items-center mb-6">
//         <div className="flex gap-4">
//           {/* Status Filter */}
//           <FilterDropdown
//             label="Status"
//             value={statusFilter}
//             onChange={setStatusFilter}
//             options={[
//               { value: "All", label: "All Statuses" },
//               { value: "Available", label: "Available" },
//               { value: "Reserved", label: "Reserved" },
//               { value: "Maintenance", label: "Maintenance" },
//             ]}
//           />
//           {/* Size Filter */}
//           <FilterDropdown
//             label="Size"
//             value={sizeFilter}
//             onChange={setSizeFilter}
//             options={[
//               { value: "All", label: "All Sizes" },
//               { value: "Small", label: "Small" },
//               { value: "Medium", label: "Medium" },
//               { value: "Large", label: "Large" },
//             ]}
//           />
//         </div>
//         <button
//           onClick={handleOpenAddModal}
//           className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition"
//         >
//           <Plus className="w-5 h-5" />
//           Add New Stall
//         </button>
//       </div>

//       {/* --- Stalls Grid --- */}
//       {loading ? (
//         <p className="text-center py-10">Loading stalls...</p>
//       ) : error ? (
//         <p className="text-center py-10 text-red-500">{error}</p>
//       ) : filteredStalls.length === 0 ? (
//         <p className="text-center py-10 text-gray-500">No stalls found.</p>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {filteredStalls.map((stall) => (
//             <StallCard
//               key={stall.id}
//               stall={stall}
//               onManageClick={() => handleOpenEditModal(stall)}
//             />
//           ))}
//         </div>
//       )}

//       {/* --- Add/Edit Modal --- */}
//       {isModalOpen && (
//         <ManageStallModal
//           stall={editingStall}
//           onClose={handleCloseModal}
//           onSave={handleSaveStall}
//         />
//       )}
//     </div>
//   );
// }

// // -------------------------------------
// // --- Filter Dropdown Component ---
// // -------------------------------------
// function FilterDropdown({
//   label,
//   value,
//   onChange,
//   options,
// }: {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   options: { value: string; label: string }[];
// }) {
//   return (
//     <div className="relative">
//       <select
//         id={`filter-${label}`}
//         className="appearance-none w-48 bg-white border rounded-lg shadow-sm px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//       >
//         {options.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
//     </div>
//   );
// }

// // -------------------------------------
// // --- Stall Card Component ---
// // -------------------------------------
// function StallCard({
//   stall,
//   onManageClick,
// }: {
//   stall: Stall;
//   onManageClick: () => void;
// }) {
//   const statusInfo = {
//     Available: {
//       Icon: CheckSquare,
//       color: "text-green-600",
//       borderColor: "border-green-200",
//       bgColor: "bg-green-50",
//     },
//     Reserved: {
//       Icon: XSquare,
//       color: "text-red-600",
//       borderColor: "border-red-200",
//       bgColor: "bg-red-50",
//     },
//     Maintenance: {
//       Icon: Wrench,
//       color: "text-yellow-600",
//       borderColor: "border-yellow-200",
//       bgColor: "bg-yellow-50",
//     },
//   }[stall.status];

//   return (
//     <div
//       className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} flex flex-col justify-between`}
//     >
//       <div className="p-5 flex-1">
//         <div className="flex justify-between items-start">
//           <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
//           <span
//             className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color} border border-current`}
//           >
//             {stall.size}
//           </span>
//         </div>
//         <div className="flex items-center gap-2 mt-3">
//           <statusInfo.Icon className={`w-5 h-5 ${statusInfo.color}`} />
//           <span className={`text-sm font-medium ${statusInfo.color}`}>
//             {stall.status}
//           </span>
//         </div>
//         {stall.status === "Reserved" && stall.publisherName && (
//           <p className="text-sm text-gray-600 mt-2 truncate">
//             Booked by: <span className="font-medium">{stall.publisherName}</span>
//           </p>
//         )}
//       </div>
//       <div className="px-5 py-3 bg-white border-t">
//         <button
//           onClick={onManageClick}
//           className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800"
//         >
//           Manage Stall
//         </button>
//       </div>
//     </div>
//   );
// }

// // -------------------------------------
// // --- Manage Stall Modal Component ---
// // -------------------------------------
// function ManageStallModal({
//   stall,
//   onClose,
//   onSave,
// }: {
//   stall: Stall | null;
//   onClose: () => void;
//   onSave: (stall: Stall) => void;
// }) {
//   const [name, setName] = useState(stall?.name || "");
//   const [size, setSize] = useState<StallSize>(stall?.size || "Medium");
//   const [status, setStatus] = useState<StallStatus>(stall?.status || "Available");
//   const [publisherName, setPublisherName] = useState(stall?.publisherName || "");

//   const isNew = stall === null;
//   const title = isNew ? "Add New Stall" : "Manage Stall";

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();
//     onSave({
//       id: stall?.id || "", // ID will be handled by onSave
//       name,
//       size,
//       status,
//       publisherName: status === "Reserved" ? publisherName : undefined,
//     });
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
//         <form onSubmit={handleSubmit}>
//           {/* Modal Header */}
//           <div className="flex justify-between items-center p-5 border-b">
//             <h2 className="text-xl font-bold">{title}</h2>
//             <button
//               type="button"
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>

//           {/* Modal Body */}
//           <div className="p-6 space-y-4">
//             {/* Stall Name */}
//             <div>
//               <label
//                 htmlFor="stall-name"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Stall Name
//               </label>
//               <input
//                 type="text"
//                 id="stall-name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                 required
//               />
//             </div>
//             {/* Stall Size */}
//             <div>
//               <label
//                 htmlFor="stall-size"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Size
//               </label>
//               <select
//                 id="stall-size"
//                 value={size}
//                 onChange={(e) => setSize(e.target.value as StallSize)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="Small">Small</option>
//                 <option value="Medium">Medium</option>
//                 <option value="Large">Large</option>
//               </select>
//             </div>
//             {/* Stall Status */}
//             <div>
//               <label
//                 htmlFor="stall-status"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Status
//               </label>
//               <select
//                 id="stall-status"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value as StallStatus)}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="Available">Available</option>
//                 <option value="Reserved">Reserved</option>
//                 <option value="Maintenance">Maintenance</option>
//               </select>
//             </div>
//             {/* Publisher Name (Conditional) */}
//             {status === "Reserved" && (
//               <div>
//                 <label
//                   htmlFor="publisher-name"
//                   className="block text-sm font-medium text-gray-700"
//                 >
//                   Publisher Name (if Reserved)
//                 </label>
//                 <input
//                   type="text"
//                   id="publisher-name"
//                   value={publisherName}
//                   onChange={(e) => setPublisherName(e.target.value)}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="e.g., Book Co. Lanka"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Modal Footer */}
//           <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }