const express = require("express");

const {
  createBeamListing,
  getBeams,
  getBeam,
  updateBeamListing,
  deleteBeamListing
} = require("../controllers/beamController");
const { authenticate } = require("../middleware/authMiddleware");
const { forbidRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate);

router.post("/", forbidRoles(["specialist"]), createBeamListing);
router.get("/", getBeams);
router.get("/:id", getBeam);
router.put("/:id", forbidRoles(["specialist"]), updateBeamListing);
router.delete("/:id", forbidRoles(["specialist"]), deleteBeamListing);

module.exports = router;
