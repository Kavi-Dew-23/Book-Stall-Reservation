import { useState, useEffect, useMemo, type FormEvent } from "react";
import {
  Plus,
  X,
  ChevronDown,
  Wrench,
  LayoutGrid,
  Map as MapIcon,
} from "lucide-react";
import API from "../services/api.ts";


type StallStatus = "Available" | "Reserved" | "Maintenance";
type StallSize = "Small" | "Medium" | "Large";

interface Stall {
  id: string;
  name: string;
  size: StallSize;
  status: StallStatus;
  publisherName?: string;
}

interface BackendStall {
  id: string;
  type: "small" | "medium" | "large";
  isReserved: boolean;
  reservedBy?: string | null;
  publisherName?: string | null;
  reservationId?: string | null;
}

const initialStalls: Stall[] = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `s-s${i + 1}`,
    name: `S${i + 1}`,
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

export default function StallsPage() {
  // --- State ---
  const [stalls, setStalls] = useState<Stall[]>(initialStalls);
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
      const reservedMap = new Map<string, BackendStall>();
      for (const beStall of reservedStalls) {
        reservedMap.set(beStall.id, beStall);
      }

      // 3. Merge with the "source of truth"
      const mergedStalls = initialStalls.map((localStall) => {
        const reservedMatch = reservedMap.get(localStall.name);
        
        // --- FIX: Check if the stall is *actually* reserved ---
        if (reservedMatch && reservedMatch.isReserved) {
          return {
            ...localStall,
            status: "Reserved" as StallStatus,
            publisherName: reservedMatch.publisherName || undefined,
          };
        }
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
  }, []);

  // --- Filtering ---
  const filteredStalls = useMemo(() => {
    return stalls
      .filter((stall) => statusFilter === "All" || stall.status === statusFilter)
      .filter((stall) => sizeFilter === "All" || stall.size === sizeFilter);
  }, [stalls, statusFilter, sizeFilter]);

  // --- Event Handlers ---
  const handleOpenAddModal = () => {
    setEditingStall(null);
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
          await API.delete(`/reservations/admin/unreserve/${savedStall.name}`);
          await fetchStalls(); 
          
        } else if (newStatus === "Maintenance") {
          setStalls(prevStalls => prevStalls.map(s => 
            s.id === savedStall.id ? { ...s, status: "Maintenance" } : s
          ));
        } else if (newStatus === "Reserved" && savedStall.status !== "Reserved") {
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
    if (!stallPositions[savedStall.name]) {
      console.log("Adding new stall (local only):", savedStall.name);
      setStalls(prev => [...prev, {...savedStall, status: newStatus, id: `stall-${Date.now()}`}])
    }
    
    handleCloseModal();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Stalls</h1>
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
              stalls={filteredStalls}
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

function StallCard({
  stall,
  onManageClick,
}: {
  stall: Stall;
  onManageClick: () => void;
}) {      
  const sizeBorderColor = {
    Small: "border-yellow-300",
    Medium: "border-blue-300",
    Large: "border-red-300",
  }[stall.size];
  
  const sizeBadgeColor = {
    Small: "bg-yellow-100 text-yellow-800",
    Medium: "bg-blue-100 text-blue-800",
    Large: "bg-red-100 text-red-800",
  }[stall.size];

  const statusInfo = {
    Available: { color: "text-green-600", Icon: MapIcon },
    Reserved: { color: "text-red-600", Icon: X },
    Maintenance: { color: "text-yellow-600", Icon: Wrench },
  }[stall.status];

  return (
    <div
      className={`flex flex-col justify-between bg-white rounded-xl shadow-md overflow-hidden border-2 ${sizeBorderColor}`}
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800">{stall.name}</h3>
          <span
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
function StallMap({
  stalls,
  onStallClick,
}: {
  stalls: Stall[];
  onStallClick: (stall: Stall) => void;
}) {
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
              onClick={() => onStallClick(stall)}
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

function ManageStallModal({
  stall,
  onClose,
  onSave,
}: {
  stall: Stall | null;
  onClose: () => void;
  onSave: (stall: Stall, newStatus: StallStatus) => void;
}) {
  const [name] = useState(stall?.name || "");
  const [size] = useState<StallSize>(stall?.size || "Small");
  const [newStatus, setNewStatus] = useState<StallStatus>(stall?.status || "Available");
  const [publisherName] = useState(stall?.publisherName || "");

  const isNew = stall === null;
  const isMapStall = stall ? stallPositions.hasOwnProperty(stall.name) : false;
  const title = isNew ? "Add New Stall" : `Manage Stall: ${name}`;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
            <div>
              <label
                htmlFor="stall-status"
                className="block text-sm font-medium text-gray-700"
              >
                Set New Status
              </label>
              <select
                id="stall-status"
                value={newStatus}
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
