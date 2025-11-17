// import React, { useState, useEffect } from "react";
// import toast from "react-hot-toast";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";

// interface STALL {
//   id: string;
//   type: "small" | "medium" | "large";
//   isReserved: boolean;
//   reservedBy?: string | null;
//   publisherName?: string | null;
// }

// interface DecodedToken {
//   email: string;
//   name?: string;
//   role?: string;
//   exp: number;
// }

// const StallMap: React.FC = () => {
//   const token = localStorage.getItem("token");

//   let publisherEmail = "";
//   let publisherName = "";

//   if (token) {
//     try {
//       const decoded: DecodedToken = jwtDecode(token);
//       publisherEmail = decoded.email;
//       publisherName = decoded.name || "Unknown Publisher";
//     } catch (err) {
//       console.error("Token decode error:", err);
//     }
//   }

//   const initialStalls: STALL[] = [
//     ...Array.from({ length: 10 }, (_, i) => ({
//       id: `S${i + 1}`,
//       type: "small" as const,
//       isReserved: false,
//     })),
//     ...Array.from({ length: 8 }, (_, i) => ({
//       id: `M${i + 1}`,
//       type: "medium" as const,
//       isReserved: false,
//     })),
//     ...Array.from({ length: 6 }, (_, i) => ({
//       id: `L${i + 1}`,
//       type: "large" as const,
//       isReserved: false,
//     })),
//   ];

//   const [stalls, setStalls] = useState<STALL[]>(() => {
//     const saved = sessionStorage.getItem("stalls");
//     return saved ? JSON.parse(saved) : initialStalls;
//   });
//   const [selected, setSelected] = useState<string[]>([]);
//   const [qrUrl, setQrUrl] = useState<string | null>(() => {
//     return sessionStorage.getItem("qrUrl") || null;
//   });
//   const [showConfirmModal, setShowConfirmModal] = useState(false);

//   useEffect(() => {
//     sessionStorage.setItem("stalls", JSON.stringify(stalls));
//   }, [stalls]);

//   useEffect(() => {
//     if (qrUrl) {
//       sessionStorage.setItem("qrUrl", qrUrl);
//     }
//   }, [qrUrl]);

//   const handleSelect = (id: string, isReserved: boolean) => {
//     if (isReserved) return toast.error("This stall is already reserved");

//     if (selected.includes(id)) {
//       setSelected(selected.filter((s) => s !== id));
//     } else if (selected.length < 3) {
//       setSelected([...selected, id]);
//     } else {
//       toast.error("You can select a maximum of 3 stalls");
//     }
//   };

//   const handleReserve = () => {
//     if (selected.length === 0)
//       return toast.error("Select at least one stall");

//     setShowConfirmModal(true);
//   };

//   const handleConfirmReservation = async () => {
//     try {
//       const updatedStalls = stalls.map((stall) =>
//         selected.includes(stall.id)
//           ? {
//               ...stall,
//               isReserved: true,
//               reservedBy: publisherEmail,
//               publisherName,
//             }
//           : stall
//       );
//       setStalls(updatedStalls);

//       const res = await axios.post(
//         "http://localhost:5000/api/reservations/reserve",
//         {
//           reservationId: Date.now().toString(),
//           email: publisherEmail,
//           stalls: selected,
//           publisherName,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       toast.success(res.data.message || "Reservation successful");
//       setQrUrl(res.data.qrUrl || null);
//       setSelected([]);
//       setShowConfirmModal(false);
//     } catch (err: any) {
//       console.error(err);
//       toast.error(err.response?.data?.message || "Reservation failed");
//       setShowConfirmModal(false);
//     }
//   };

//   const getStallSize = (type: string) => {
//     switch (type) {
//       case "small":
//         return { width: "6.67%", height: "8.53%" };
//       case "medium":
//         return { width: "9.33%", height: "10.67%" };
//       case "large":
//         return { width: "12%", height: "12.8%" };
//       default:
//         return { width: "8%", height: "10.67%" };
//     }
//   };

//   // Responsive positions using percentages (based on 1200px width / 750px height container)
//   const stallPositions: Record<string, { top: string; left: string }> = {
//     // Small stalls: Two rows of 5, centered with ~2.5% gaps
//     S1: { top: "5.33%", left: "28.33%" },
//     S2: { top: "5.33%", left: "37.5%" },
//     S3: { top: "5.33%", left: "46.67%" },
//     S4: { top: "5.33%", left: "55.83%" },
//     S5: { top: "5.33%", left: "65%" },
//     S6: { top: "21.87%", left: "28.33%" },
//     S7: { top: "21.87%", left: "37.5%" },
//     S8: { top: "21.87%", left: "46.67%" },
//     S9: { top: "21.87%", left: "55.83%" },
//     S10: { top: "21.87%", left: "65%" },

//     // Medium stalls: Two rows of 4, centered with ~2.5% gaps
//     M1: { top: "41.07%", left: "27.58%" },
//     M2: { top: "41.07%", left: "39.42%" },
//     M3: { top: "41.07%", left: "51.25%" },
//     M4: { top: "41.07%", left: "63.08%" },
//     M5: { top: "59.73%", left: "27.58%" },
//     M6: { top: "59.73%", left: "39.42%" },
//     M7: { top: "59.73%", left: "51.25%" },
//     M8: { top: "59.73%", left: "63.08%" },

//     // Large stalls: One row of 6, centered with ~2.5% gaps
//     L1: { top: "81.07%", left: "7.75%" },
//     L2: { top: "81.07%", left: "22.25%" },
//     L3: { top: "81.07%", left: "36.75%" },
//     L4: { top: "81.07%", left: "51.25%" },
//     L5: { top: "81.07%", left: "65.75%" },
//     L6: { top: "81.07%", left: "80.25%" },
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 sm:p-6">
//       <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black-700">
//         STALL Floor Plan
//       </h1>

//       {/* Legend - responsive flex wrap */}
//       <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm justify-center">
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 border border-gray-400 rounded"></div>
//           <span>Available</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 border border-gray-400 rounded"></div>
//           <span>Selected</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400 border border-gray-400 rounded"></div>
//           <span>Reserved</span>
//         </div>
//       </div>

//       {/* Floor plan - responsive with aspect ratio */}
//       <div className="relative w-full max-w-[1200px] min-w-[700px] aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden mx-auto">
//         {/* Side walls for realism - responsive width */}
//         <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>

//         {/* Entrance - responsive positioning */}
//         <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 bg-blue-400 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Entrance
//         </div>

//         {/* Exit */}
//         <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm z-10 whitespace-nowrap">
//           Exit
//         </div>

//         {/* Section labels - responsive */}
//         <div className="absolute top-[16%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Small Stalls Area
//         </div>
//         <div className="absolute top-[53%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Medium Stalls Area
//         </div>
//         <div className="absolute top-[76%] left-1/2 -translate-x-1/2 bg-white px-2 sm:px-4 py-0.5 sm:py-1 rounded shadow text-xs sm:text-sm font-bold text-gray-700 z-10 whitespace-nowrap">
//           Large Stalls Area
//         </div>

//         {/* Building Features: responsive sizes and positions */}
//         {/* Restrooms beside small stalls (left side, top area) */}
//         <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
//           <span className="font-bold text-xs sm:text-sm">Restrooms</span>
//         </div>

//         {/* Cafeteria beside medium stalls (right side, middle area) */}
//         <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
//           <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
//         </div>

//         {/* Walkways (horizontal aisles) - responsive heights */}
//         <div className="absolute top-[13.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[29.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[50.5%] left-0 w-full h-[7.5%] sm:h-[8%] bg-green-200 opacity-75"></div>
//         <div className="absolute top-[69.5%] left-0 w-full h-[9.5%] sm:h-[10.67%] bg-green-200 opacity-75"></div>

//         {/* Render stalls */}
//         {stalls.map((stall) => {
//           const size = getStallSize(stall.type);
//           return (
//             <div
//               key={stall.id}
//               onClick={() => handleSelect(stall.id, stall.isReserved)}
//               title={
//                 stall.isReserved && stall.publisherName
//                   ? `Reserved by ${stall.publisherName}`
//                   : `${stall.type.toUpperCase()} STALL`
//               }
//               className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer min-w-10 min-h-8
//                 ${
//                   stall.isReserved
//                     ? "bg-gray-400 text-white cursor-not-allowed"
//                     : selected.includes(stall.id)
//                     ? "bg-yellow-500 text-white scale-105"
//                     : "bg-amber-200 hover:bg-amber-300"
//                 }`}
//               style={{
//                 ...stallPositions[stall.id],
//                 ...size,
//                 fontSize: "clamp(0.625rem, 0.75rem, 0.875rem)",
//               }}
//             >
//               <span className="font-bold">{stall.id}</span>
//               {/* <span className="text-[0.625rem] sm:text-xs">{stall.type.toUpperCase()}</span> */}
//             </div>
//           );
//         })}
//       </div>

//       {/* Reserve button - responsive padding */}
//       <button
//         onClick={handleReserve}
//         disabled={selected.length === 0}
//         className="mt-6 sm:mt-8 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg disabled:opacity-50 text-sm sm:text-base"
//       >
//         Confirm Reservation ({selected.length}/3)
//       </button>

//       {/* Confirmation Modal */}
//       {showConfirmModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
//             <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Reservation</h2>
//             <p className="mb-4 text-gray-700">You are about to reserve the following stalls:</p>
//             <ul className="mb-4 list-disc pl-5 space-y-1">
//               {selected.map((id) => {
//                 const stall = stalls.find((s) => s.id === id);
//                 return (
//                   <li key={id} className="text-gray-700">
//                     {stall?.id} ({stall?.type})
//                   </li>
//                 );
//               })}
//             </ul>
//             <p className="mb-4 text-sm text-gray-600">
//               Reserved by: {publisherName} ({publisherEmail})
//             </p>
//             <div className="flex justify-end gap-3 pt-4 border-t">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmReservation}
//                 className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* QR download - responsive */}
//       {qrUrl && (
//         <div className="mt-8 sm:mt-10 text-center flex flex-col items-center">
//           <h2 className="text-xl sm:text-2xl font-semibold text-yellow-700 mb-3 sm:mb-4">
//             Reservation Confirmed 🎉
//           </h2>
//           <p className="text-gray-600 mb-2 text-sm sm:text-base">
//             Scan or download your reservation QR code below:
//           </p>
//           <img
//             src={qrUrl}
//             alt="Reservation QR"
//             className="w-32 sm:w-40 h-32 sm:h-40 mb-3 sm:mb-4 border-4 border-yellow-500 rounded-lg shadow-md"
//           />
//           <a
//             href={qrUrl}
//             download="Reservation_QR.png"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg transition text-sm sm:text-base"
//           >
//             ⬇️ Download QR Code
//           </a>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StallMap;

// import React, { useState, useEffect } from "react";
// import toast from "react-hot-toast";
// import { jwtDecode } from "jwt-decode";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// interface STALL {
//   id: string;
//   type: "small" | "medium" | "large";
//   isReserved: boolean;
//   reservedBy?: string | null;
//   publisherName?: string | null;
// }

// interface DecodedToken {
//   email: string;
//   name?: string;
//   role?: string;
//   exp: number;
// }

// const StallMap: React.FC = () => {
//   const token = localStorage.getItem("token");
//   const navigate = useNavigate();

//   let publisherEmail = "";
//   let publisherName = "Unknown Publisher";

//   if (token) {
//     try {
//       const decoded: DecodedToken = jwtDecode(token);
//       publisherEmail = decoded.email;
//       publisherName = decoded.name || "Unknown Publisher";
//     } catch (err) {
//       console.error("Token decode error:", err);
//     }
//   }

//   // ✅ Local layout – always show all stalls
//   const initialStalls: STALL[] = [
//     ...Array.from({ length: 10 }, (_, i) => ({
//       id: `S${i + 1}`,
//       type: "small" as const,
//       isReserved: false,
//     })),
//     ...Array.from({ length: 8 }, (_, i) => ({
//       id: `M${i + 1}`,
//       type: "medium" as const,
//       isReserved: false,
//     })),
//     ...Array.from({ length: 6 }, (_, i) => ({
//       id: `L${i + 1}`,
//       type: "large" as const,
//       isReserved: false,
//     })),
//   ];

//   const [stalls, setStalls] = useState<STALL[]>(initialStalls);
//   const [selected, setSelected] = useState<string[]>([]);
//   const [qrUrl, setQrUrl] = useState<string | null>(null);
//   const [showConfirmModal, setShowConfirmModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isRedirecting, setIsRedirecting] = useState(false);

//   // ✅ Fetch reserved stalls from Firestore via backend
//   const fetchReservedStalls = async () => {
//     try {
//       const res = await axios.get("http://localhost:5000/api/reservations/stalls", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const reservedData = res.data || [];

//       // Merge Firestore reservations into local layout
//       const merged = initialStalls.map((stall) => {
//         const reservedMatch = reservedData.find((r: any) => r.id === stall.id);
//         return reservedMatch
//           ? {
//             ...stall,
//             isReserved: reservedMatch.isReserved || false,
//             reservedBy: reservedMatch.reservedBy || null,
//             publisherName: reservedMatch.publisherName || null,
//           }
//           : stall;
//       });

//       setStalls(merged);
//     } catch (err) {
//       console.error("Error fetching stalls:", err);
//       toast.error("Failed to load stall data");
//     }
//   };

//   useEffect(() => {
//     fetchReservedStalls();
//   }, []);

//   // ✅ Handle selection
//   const handleSelect = (id: string, isReserved: boolean) => {
//     if (isReserved) return toast.error("This stall is already reserved");
//     if (selected.includes(id)) {
//       setSelected(selected.filter((s) => s !== id));
//     } else if (selected.length < 3) {
//       setSelected([...selected, id]);
//     } else {
//       toast.error("You can select a maximum of 3 stalls");
//     }
//   };

//   // ✅ Confirm reservation
//   const handleConfirmReservation = async () => {
//     try {
//       setIsLoading(true);
//       const res = await axios.post(
//         "http://localhost:5000/api/reservations/reserve",
//         {
//           reservationId: Date.now().toString(),
//           email: publisherEmail,
//           stalls: selected,
//           publisherName,
//         },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setIsLoading(false);
//       toast.success(res.data.message || "Reservation successful");
//       setQrUrl(res.data.qrUrl || null);
//       setSelected([]);
//       setShowConfirmModal(false);
//       await fetchReservedStalls(); // refresh after booking
//       setIsRedirecting(true);
//       setTimeout(() => {
//         setIsRedirecting(false);
//         navigate("/publisher/home");
//       }, 3000);

//     } catch (err: any) {
//       setIsLoading(false);
//       console.error(err);
//       toast.error(err.response?.data?.message || "Reservation failed");
//       setShowConfirmModal(false);
//     }
//   };

//   const handleReserve = () => {
//     if (selected.length === 0) return toast.error("Select at least one stall");
//     setShowConfirmModal(true);
//   };

//   // ✅ Stall sizes
//   const getStallSize = (type: string) => {
//     switch (type) {
//       case "small":
//         return { width: "6.67%", height: "8.53%" };
//       case "medium":
//         return { width: "9.33%", height: "10.67%" };
//       case "large":
//         return { width: "12%", height: "12.8%" };
//       default:
//         return { width: "8%", height: "10.67%" };
//     }
//   };

//   // ✅ Layout positions
//   const stallPositions: Record<string, { top: string; left: string }> = {
//     S1: { top: "5.33%", left: "28.33%" },
//     S2: { top: "5.33%", left: "37.5%" },
//     S3: { top: "5.33%", left: "46.67%" },
//     S4: { top: "5.33%", left: "55.83%" },
//     S5: { top: "5.33%", left: "65%" },
//     S6: { top: "21.87%", left: "28.33%" },
//     S7: { top: "21.87%", left: "37.5%" },
//     S8: { top: "21.87%", left: "46.67%" },
//     S9: { top: "21.87%", left: "55.83%" },
//     S10: { top: "21.87%", left: "65%" },
//     M1: { top: "41.07%", left: "27.58%" },
//     M2: { top: "41.07%", left: "39.42%" },
//     M3: { top: "41.07%", left: "51.25%" },
//     M4: { top: "41.07%", left: "63.08%" },
//     M5: { top: "59.73%", left: "27.58%" },
//     M6: { top: "59.73%", left: "39.42%" },
//     M7: { top: "59.73%", left: "51.25%" },
//     M8: { top: "59.73%", left: "63.08%" },
//     L1: { top: "81.07%", left: "7.75%" },
//     L2: { top: "81.07%", left: "22.25%" },
//     L3: { top: "81.07%", left: "36.75%" },
//     L4: { top: "81.07%", left: "51.25%" },
//     L5: { top: "81.07%", left: "65.75%" },
//     L6: { top: "81.07%", left: "80.25%" },
//   };

//   if (isRedirecting) {
//     return (
//       <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50 p-4">
//         <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-yellow-500 text-center">
//           <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <h2 className="text-xl font-bold mb-2 text-gray-800">Reservation Confirmed! 🎉</h2>
//           <p className="text-gray-600 mb-6">Redirecting to your publisher home...</p>
//           <div className="flex justify-center">
//             <div className="w-8 h-8 bg-yellow-500 rounded-full animate-bounce"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 sm:p-6">
//       <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-black">
//         STALL Floor Plan
//       </h1>

//       {/* Legend */}
//       <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-xs sm:text-sm justify-center">
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-200 border border-gray-400 rounded"></div>
//           <span>Available</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 border border-gray-400 rounded"></div>
//           <span>Selected</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-400 border border-gray-400 rounded"></div>
//           <span>Reserved</span>
//         </div>
//       </div>

//       <div className="relative w-full max-w-[1200px] min-w-[700px] aspect-8/5 bg-green-50 border-4 border-green-400 rounded-lg overflow-hidden mx-auto">
//         {/* Side walls for realism - responsive width */}
//         <div className="absolute left-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>
//         <div className="absolute right-0 top-0 w-[0.67%] sm:w-2 h-full bg-gray-600 min-w-2"></div>

//         {/* Entrance - responsive positioning */}
//         <div className="absolute top-[0.5%] left-1/2 -translate-x-1/2 text-green-600 font-bold text-xs sm:text-sm z-10 whitespace-nowrap">
//           Entrance
//         </div>

//         {/* Exit */}
//         <div className="absolute bottom-[0.5%] left-1/2 -translate-x-1/2 text-red-500 font-bold text-xs sm:text-sm z-10 whitespace-nowrap">
//           Exit
//         </div>

//         {/* Section labels - responsive */}
//         <div className="absolute top-[16%] left-1/2 -translate-x-1/2  text-xs sm:text-sm font-bold text-gray-400 z-10 whitespace-nowrap">
//           Small Stalls Area
//         </div>
//         <div className="absolute top-[53%] left-1/2 -translate-x-1/2  text-xs sm:text-sm font-bold text-gray-400 z-10 whitespace-nowrap">
//           Medium Stalls Area
//         </div>
//         <div className="absolute top-[76%] left-1/2 -translate-x-1/2  text-xs sm:text-sm font-bold text-gray-400 z-10 whitespace-nowrap">
//           Large Stalls Area
//         </div>

//         {/* Restrooms, Cafeteria, Walkways */}
//         <div className="absolute top-[8%] left-[3%] w-[18%] sm:w-[22.67%] h-[30%] sm:h-[38.4%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[150px] min-h-[150px]">
//           <span className="font-bold text-xs sm:text-sm">Restrooms</span>
//         </div>
//         <div className="absolute top-[45%] right-[8%] w-[12%] sm:w-[13.33%] h-[18%] sm:h-[21.33%] bg-green-400 border-2 border-gray-500 rounded-lg shadow-md flex flex-col items-center justify-center text-center z-10 min-w-[100px] min-h-[100px]">
//           <span className="font-bold text-xs sm:text-sm">Cafeteria</span>
//         </div>
//         {stalls.map((stall) => {
//           const size = getStallSize(stall.type);
//           return (
//             <div
//               key={stall.id}
//               onClick={() => handleSelect(stall.id, stall.isReserved)}
//               title={
//                 stall.isReserved
//                   ? "This stall is reserved"
//                   : `${stall.type.toUpperCase()} STALL`
//               }
//               className={`text-xs absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer
//         ${stall.isReserved
//                   ? "bg-gray-200 text-white cursor-not-allowed"
//                   : selected.includes(stall.id)
//                     ? "bg-blue-500 text-black scale-105"
//                     : "bg-yellow-400 hover:bg-yellow-500"
//                 }`}
//               style={{ ...stallPositions[stall.id], ...size }}
//             >
//               <span className="font-bold">{stall.id}</span>
//             </div>
//           );
//         })}

//         {/* {stalls.map((stall) => {
//           const size = getStallSize(stall.type);
//           return (
//             <div
//               key={stall.id}
//               onClick={() => handleSelect(stall.id, stall.isReserved)}
//               title={
//                 stall.isReserved && stall.publisherName
//                   ? `Reserved by ${stall.publisherName}`
//                   : `${stall.type.toUpperCase()} STALL`
//               }
//               className={`absolute flex flex-col items-center justify-center rounded-lg shadow-md text-center transition-all duration-200 cursor-pointer
//                 ${
//                   stall.isReserved
//                     ? "bg-gray-400 text-white cursor-not-allowed"
//                     : selected.includes(stall.id)
//                     ? "bg-yellow-500 text-white scale-105"
//                     : "bg-amber-200 hover:bg-amber-300"
//                 }`}
//               style={{ ...stallPositions[stall.id], ...size }}
//             >
//               <span className="font-bold">{stall.id}</span>
//               {stall.isReserved && (
//                 <span className="text-xs mt-1 text-gray-100">
//                   {stall.reservedBy?.split("@")[0]}
//                 </span>
//               )}
//             </div>
//           );
//         })} */}
//       </div>

//       {/* Confirm button */}
//       <button
//         onClick={handleReserve}
//         disabled={selected.length === 0}
//         className="mt-6 sm:mt-8 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-lg disabled:opacity-50"
//       >
//         Confirm Reservation ({selected.length}/3)
//       </button>

//       {/* Confirmation Modal */}
//       {/* {showConfirmModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
//             <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Reservation</h2>
//             <ul className="mb-4 list-disc pl-5">
//               {selected.map((id) => (
//                 <li key={id}>{id}</li>
//               ))}
//             </ul>
//             <p className="text-sm text-gray-600 mb-4">
//               Reserved by: {publisherName} ({publisherEmail})
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmReservation}
//                 className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
//               >
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )} */}
//       {showConfirmModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-yellow-500">
//             <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Reservation</h2>
//             <p className="mb-3 text-gray-700">You are about to reserve the following stalls:</p>
//             <ul className="mb-4 list-disc pl-5 space-y-1">
//               {selected.map((id) => (
//                 <li key={id} className="text-gray-700">{id}</li>
//               ))}
//             </ul>
//             <p className="text-sm text-gray-100 mb-4">
//               Reserved by: {publisherName} ({publisherEmail})
//             </p>
//             <div className="flex justify-end gap-3 border-t pt-4">
//               <button
//                 onClick={() => setShowConfirmModal(false)}
//                 className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
//                 disabled={isLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleConfirmReservation}
//                 disabled={isLoading} // ✅ Disable button when loading
//                 className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center" // ✅ Add disabled styles and flex for spinner
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> {/* ✅ Simple spinner */}
//                     Processing...
//                   </>
//                 ) : (
//                   "Confirm"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}


//       {/* QR Download */}
//       {/* {qrUrl && (
//         <div className="mt-10 text-center flex flex-col items-center">
//           <h2 className="text-2xl font-semibold text-yellow-700 mb-4">
//             Reservation Confirmed 🎉
//           </h2>
//           <img
//             src={qrUrl}
//             alt="QR"
//             className="w-40 h-40 border-4 border-yellow-500 rounded-lg shadow-md mb-4"
//           />
//           <a
//             href={qrUrl}
//             download="Reservation_QR.png"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
//           >
//             ⬇️ Download QR Code
//           </a>
//         </div>
//       )} */}
//     </div>
//   );
// };

// export default StallMap;

// --- FULL UPDATED StallMap.tsx (with limit block inside handleSelect) ---

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
// import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import API from "../api";

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
  const [currentReservedCount, setCurrentReservedCount] = useState(0); // ⭐ NEW

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

      // ⭐ Count how many THIS publisher already reserved
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

    // ⭐ BLOCK selecting more if total would exceed 3
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
          <h2 className="text-xl font-bold mb-2">Reservation Confirmed! 🎉</h2>
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

              {/* ⭐ Tooltip (appears only when user cannot select the stall) */}
              {(stall.isReserved || currentReservedCount >= 3) && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap border border-yellow-600">
                    {stall.isReserved
                      ? "This stall is already reserved"
                      : "You have reached your 3-stall limit"}
                  </div>
                </div>
              )}

              {/* ⭐ Actual Stall Box */}
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
      {/* CONFIRM BUTTON */}
      <button
        onClick={handleReserve}
        disabled={selected.length === 0}
        className="mt-6 sm:mt-8 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50"
      >
        Confirm Reservation ({selected.length}/3)
      </button>

      {/* ⭐ LIMIT REACHED MESSAGE ⭐ */}
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

