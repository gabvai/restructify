require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const beamRoutes = require("./routes/beamRoutes");
const constructionReviewRoutes = require("./routes/constructionReviewRoutes");
const { notFound } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { testDbConnection } = require("./db");
const aiRoutes = require("./routes/aiRoutes");

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.use("/", healthRoutes);
app.use("/auth", authRoutes);
app.use("/beams", beamRoutes);
app.use("/constructions", constructionReviewRoutes);
app.use("/ai", aiRoutes);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await testDbConnection();
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
