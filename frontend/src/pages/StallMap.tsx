import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import API from "../api";
import { IoCheckmarkCircleSharp } from "react-icons/io5";

interface STALL {
  id: string;
  type: "small" | "medium" | "large";
  isReserved: boolean;
  reservedBy?: string | null;
  publisherName?: string | null;
}

interface DecodedToken {
  email: string;
  name?: string;
  role?: string;
  exp: number;
}

const StallMap: React.FC = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentReservedCount, setCurrentReservedCount] = useState(0);

  let publisherEmail = "";
  let publisherName = "Unknown Publisher";

  if (token) {
    try {
      const decoded: DecodedToken = jwtDecode(token);
      publisherEmail = decoded.email;
      publisherName = decoded.name || "Unknown Publisher";
    } catch (err) {
      console.error("Token decode error:", err);
    }
  }

  // ------ INITIAL LOCAL STALLS ------
  const initialStalls: STALL[] = [
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `S${i + 1}`,
      type: "small" as const,
      isReserved: false,
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `M${i + 1}`,
      type: "medium" as const,
      isReserved: false,
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `L${i + 1}`,
      type: "large" as const,
      isReserved: false,
    })),
  ];

  const [stalls, setStalls] = useState<STALL[]>(initialStalls);
  const [selected, setSelected] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // -------- FETCH RESERVED STALLS --------
  const fetchReservedStalls = async () => {
    try {
      const res = await API.get("/reservations/stalls", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const reservedData = res.data || [];

      const merged = initialStalls.map((stall) => {
        const match = reservedData.find((r: any) => r.id === stall.id);
        return match
          ? {
            ...stall,
            isReserved: match.isReserved,
            reservedBy: match.reservedBy,
            publisherName: match.publisherName,
          }
          : stall;
      });

      setStalls(merged);

      // Count how many THIS publisher already reserved
      const count = reservedData.filter(
        (s: any) => s.reservedBy === publisherEmail
      ).length;

      setCurrentReservedCount(count);

    } catch (err) {
      console.error("Error fetching stalls:", err);
      toast.error("Failed to load stall data.");
    }
  };

  useEffect(() => {
    fetchReservedStalls();
  }, []);

  // -------- SELECT STALL --------
  const handleSelect = (id: string, isReserved: boolean) => {
    if (isReserved) return toast.error("This stall is already reserved");

    // BLOCK selecting more if total would exceed 3
    if (!selected.includes(id) && currentReservedCount + selected.length >= 3) {
      return toast.error(
        `You already reserved ${currentReservedCount}. Max allowed is 3.`
      );
    }

    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  // -------- SHOW CONFIRM MODAL --------
  const handleReserve = () => {
    if (selected.length === 0) {
      return toast.error("Select at least one stall");
    }

    if (currentReservedCount + selected.length > 3) {
      return toast.error(
        `You already reserved ${currentReservedCount}. Max allowed is 3.`
      );
    }

    setShowConfirmModal(true);
  };

  // -------- CONFIRM RESERVATION --------
  const handleConfirmReservation = async () => {
    if (currentReservedCount + selected.length > 3) {
      setShowConfirmModal(false);
      return toast.error("You cannot exceed 3 total reserved stalls.");
    }

    try {
      setIsLoading(true);

      await API.post(
        "/reservations/reserve",
        {
          reservationId: Date.now().toString(),
          email: publisherEmail,
          stalls: selected,
          publisherName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Reservation successful!");

      setIsLoading(false);
      setShowConfirmModal(false);
      setSelected([]);

      await fetchReservedStalls();

      setIsRedirecting(true);
      setTimeout(() => {
        setIsRedirecting(false);
        navigate("/publisher/home");
      }, 3000);

    } catch (err: any) {
      setIsLoading(false);
      toast.error(err.response?.data?.message || "Reservation failed");
      setShowConfirmModal(false);
    }
  };

  // -------- LOGOUT --------
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    toast.success("Logged out successfully!");
  };

  // -------- STALL SIZE RULES --------
  const getStallSize = (type: string) => {
    switch (type) {
      case "small":
        return { width: "6.67%", height: "8.53%" };
      case "medium":
        return { width: "9.33%", height: "10.67%" };
      case "large":
        return { width: "12%", height: "12.8%" };
      default:
        return { width: "8%", height: "10.67%" };
    }
  };

  // -------- STALL POSITIONS --------
  const stallPositions: Record<string, { top: string; left: string }> = {
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
    M1: { top: "41.07%", left: "27.58%" },
    M2: { top: "41.07%", left: "39.42%" },
    M3: { top: "41.07%", left: "51.25%" },
    M4: { top: "41.07%", left: "63.08%" },
    M5: { top: "59.73%", left: "27.58%" },
    M6: { top: "59.73%", left: "39.42%" },
    M7: { top: "59.73%", left: "51.25%" },
    M8: { top: "59.73%", left: "63.08%" },
    L1: { top: "81.07%", left: "7.75%" },
    L2: { top: "81.07%", left: "22.25%" },
    L3: { top: "81.07%", left: "36.75%" },
    L4: { top: "81.07%", left: "51.25%" },
    L5: { top: "81.07%", left: "65.75%" },
    L6: { top: "81.07%", left: "80.25%" },
  };

  // -------- REDIRECT SCREEN --------
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center border border-yellow-500">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Reservation Confirmed!</h2>
          <IoCheckmarkCircleSharp className="text-green-600 text-4xl mx-auto mb-4" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 sm:p-6">

      {/* BACK + LOGOUT */}
      <div className="w-full max-w-[1200px] flex justify-between mb-4">
        <button
          onClick={() => navigate("/publisher/home")}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-xl flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back
        </button>


        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md flex items-center gap-2"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black">
        STALL Floor Plan
      </h1>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-200 border border-gray-400 rounded"></div>
          <span>Available</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 border border-gray-400 rounded"></div>
          <span>Selected</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 border border-gray-400 rounded"></div>
          <span>Reserved</span>
        </div>
      </div>

      {/* MAP AREA */}
      <div className="relative w-full max-w-[1200px] min-w-[700px] aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden mx-auto">

        {/* SIDE WALLS */}
        <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600"></div>
        <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600"></div>

        {/* ENTRANCE / EXIT */}
        <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 text-green-600 font-bold text-xs">
          Entrance
        </div>
        <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 text-red-500 font-bold text-xs">
          Exit
        </div>

        {/* SECTION LABELS */}
        <div className="absolute top-[16%] left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">
          Small Stalls Area
        </div>
        <div className="absolute top-[53%] left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">
          Medium Stalls Area
        </div>
        <div className="absolute top-[76%] left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">
          Large Stalls Area
        </div>

        {/* FACILITIES */}
        <div className="absolute top-[8%] left-[3%] w-[18%] h-[30%] bg-green-400 border-2 border-gray-500 rounded-lg text-center flex justify-center items-center text-xs font-bold">
          Restrooms
        </div>
        <div className="absolute top-[45%] right-[8%] w-[12%] h-[18%] bg-green-400 border-2 border-gray-500 rounded-lg text-center flex justify-center items-center text-xs font-bold">
          Cafeteria
        </div>

        {/* RENDER STALLS */}
        {stalls.map((stall) => {
          const size = getStallSize(stall.type);
          return (
            <div
              key={stall.id}
              className="absolute"
              style={{ ...stallPositions[stall.id], ...size }}
            >

              {/*  Tooltip (appears only when user cannot select the stall) */}
              {(stall.isReserved || currentReservedCount >= 3) && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-yellow-600">
                    {stall.isReserved
                      ? "This stall is already reserved"
                      : "You have reached your 3-stall limit"}
                  </div>
                </div>
              )}

              {/* Actual Stall Box */}
              <div
                onClick={() => handleSelect(stall.id, stall.isReserved)}
                className={`
      text-xs flex items-center justify-center rounded-lg shadow-md cursor-pointer h-full w-full
      ${stall.isReserved
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : currentReservedCount >= 3
                      ? "bg-amber-200 text-black opacity-60 cursor-not-allowed"
                      : selected.includes(stall.id)
                        ? "bg-yellow-500 text-white scale-105"
                        : "bg-amber-200 hover:bg-amber-300"
                  }
    `}
              >
                <span className="font-bold">{stall.id}</span>
              </div>

            </div>

          );
        })}
      </div>

      {/* CONFIRM BUTTON */}
      <button
        onClick={handleReserve}
        disabled={selected.length === 0}
        className="mt-6 sm:mt-8 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50"
      >
        Confirm Reservation ({selected.length}/3)
      </button>

      {/*  LIMIT REACHED MESSAGE ⭐ */}
      {currentReservedCount >= 3 && (
        <p className="text-red-600 text-sm mt-2 font-semibold">
          You have reached the maximum limit of 3 stalls.
        </p>
      )}


      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-3">Confirm Reservation</h2>
            <ul className="mb-4 list-disc pl-5">
              {selected.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReservation}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-red-400">
            <h2 className="text-xl font-bold text-red-600 mb-3 flex items-center justify-center gap-2">
              <ArrowRightOnRectangleIcon className="h-6 w-6 text-red-500" />
              Confirm Logout
            </h2>

            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={confirmLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StallMap;

