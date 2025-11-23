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

//  GET all stalls
export const getAllStalls = (req, res) => {
  res.status(200).json(stalls);
};

//  Reserve stalls & mark them as reserved
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
