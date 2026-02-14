const express = require("express");
const Board = require("../models/Board");
const { verifyJWT } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyJWT);

router.get("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    let board = await Board.findOne({ roomId });

    if (!board) {
      board = await Board.create({
        roomId,
        elements: [],
        createdBy: req.user.userId,
      });
    }

    return res.status(200).json({
      roomId: board.roomId,
      elements: board.elements,
      createdBy: board.createdBy,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch board", error: error.message });
  }
});

router.post("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { elements } = req.body;

    if (!Array.isArray(elements)) {
      return res.status(400).json({ message: "elements must be an array" });
    }

    const board = await Board.findOneAndUpdate(
      { roomId },
      {
        $set: {
          elements,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdBy: req.user.userId,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      roomId: board.roomId,
      elements: board.elements,
      updatedAt: board.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save board", error: error.message });
  }
});

module.exports = router;
