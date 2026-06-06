const express = require("express");

const {
  getPendingConstructions,
  reviewConstructionById
} = require("../controllers/constructionReviewController");
const { authenticate } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(allowRoles(["specialist", "admin"]));

router.get("/pending-review", getPendingConstructions);
router.put("/:id/review", reviewConstructionById);

module.exports = router;
