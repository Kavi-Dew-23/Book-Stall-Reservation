// // backend/controllers/stallController.js

// // 🧠 Temporary in-memory data (replace with DB later)
// let stalls = [
//   { id: "A1", isReserved: false },
//   { id: "A2", isReserved: true },
//   { id: "A3", isReserved: false },
//   { id: "A4", isReserved: false },
//   { id: "A5", isReserved: true },
//   { id: "A6", isReserved: false },
//   { id: "A7", isReserved: false },
//   { id: "A8", isReserved: false },
//   { id: "A9", isReserved: false },
//   { id: "A10", isReserved: false },
// ];

// // ✅ GET all stalls
// export const getAllStalls = (req, res) => {
//   res.status(200).json(stalls);
// };

// // ✅ POST reserve stalls
// export const reserveStalls = (req, res) => {
//   const { stalls: selectedStalls } = req.body;

//   if (!selectedStalls || !Array.isArray(selectedStalls)) {
//     return res.status(400).json({ message: "Invalid stalls data" });
//   }

//   // Update reservation status
//   stalls = stalls.map((stall) =>
//     selectedStalls.includes(stall.id)
//       ? { ...stall, isReserved: true }
//       : stall
//   );

//   res.status(200).json({
//     message: "Stalls reserved successfully",
//     updatedStalls: stalls,
//   });
// };

// backend/controllers/stallController.js
let stalls = [
  { id: "A1", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A2", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A3", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A4", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A5", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A6", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A7", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A8", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A9", isReserved: false, reservedBy: null, publisherName: null },
  { id: "A10", isReserved: false, reservedBy: null, publisherName: null },
];

// ✅ GET all stalls
export const getAllStalls = (req, res) => {
  res.status(200).json(stalls);
};

// ✅ Reserve stalls & mark them as reserved
export const reserveStalls = (req, res) => {
  const { stalls: selectedStalls, email, publisherName } = req.body;

  if (!selectedStalls || !email) {
    return res.status(400).json({ message: "Missing data" });
  }

  stalls = stalls.map((stall) =>
    selectedStalls.includes(stall.id)
      ? {
          ...stall,
          isReserved: true,
          reservedBy: email,
          publisherName,
        }
      : stall
  );

  res.status(200).json({
    message: "Stalls reserved successfully",
    updatedStalls: stalls,
  });
};
