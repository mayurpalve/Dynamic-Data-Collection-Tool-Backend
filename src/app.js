/*
to globally apply the rate limit 

import { authRateLimit } from "./middlewares/rateLimit.middleware.js";
app.use("/api", authRateLimit);
*/

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middlewares/error.middleware.js";
import { authRateLimit } from "./middlewares/rateLimit.middleware.js";


// Auth & User
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";

// Masters
import departmentRoutes from "./modules/master/department/department.routes.js";
import divisionRoutes from "./modules/master/division/division.routes.js";
import districtRoutes from "./modules/master/district/district.routes.js";
import talukaRoutes from "./modules/master/taluka/taluka.routes.js";
import regionRoutes from "./modules/master/region/region.routes.js";

// Scheme
import schemeRoutes from "./modules/scheme/scheme.routes.js";
import schemeDefinitionRoutes from "./modules/schemeDefinition/schemeDefinition.routes.js";
import schemeAnswerRoutes from "./modules/schemeAnswer/schemeAnswer.routes.js";
import publicSchemeDefinitionRoutes from "./modules/schemeDefinition/publicSchemeDefinition.routes.js";
import schemeAssignmentRoutes from "./modules/schemeAccess/schemeAssignment.routes.js"

// Excel
import excelRoutes from "./modules/excel/excel.routes.js";
import excelUploadRoutes from "./modules/excel/excelUpload.routes.js";

// Public
import publicSchemeRoutes from "./modules/scheme/public.scheme.routes.js";
import publicSchemeAnswerRoutes from "./modules/schemeAnswer/publicSchemeAnswer.routes.js";

// Role
import roleRoutes from "./modules/role/role.routes.js";

const app = express();

/* ================= CORS (MUST BE FIRST) ================= */
app.use(
  cors({
    origin: ["http://localhost:5173","http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);


/* ================= SECURITY ================= */
app.use(helmet());

/* ================= BODY PARSING ================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= LOGGING ================= */
app.use(morgan("dev"));

/* ================= CACHE CONTROL ================= */
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/* ================= RATE LIMIT (EXCLUDE PUBLIC) ================= */
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/public")) {
    return next(); // ✅ public routes are not auth-rate-limited
  }
  return authRateLimit(req, res, next);
});

/* ================= HEALTH CHECK ================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime()
  });
});

/* ================= ROUTES ================= */

// Auth & User
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);

// Masters
app.use("/api/masters/departments", departmentRoutes);
app.use("/api/masters/divisions", divisionRoutes);
app.use("/api/masters/districts", districtRoutes);
app.use("/api/masters/talukas", talukaRoutes);
app.use("/api/masters/regions", regionRoutes);

// ===== PUBLIC (NO AUTH) — MUST COME FIRST =====
app.use("/api/public/scheme", publicSchemeDefinitionRoutes);
app.use("/api/public/schemes", publicSchemeRoutes);
app.use("/api/public/scheme-answers", publicSchemeAnswerRoutes);

// Scheme
app.use("/api/schemes", schemeRoutes);
app.use("/api/scheme-definitions", schemeDefinitionRoutes);
app.use("/api/scheme-answers", schemeAnswerRoutes);


/* ================= Scheme Assignment ================= */
app.use("/api/scheme-assignments", schemeAssignmentRoutes);


// Excel
app.use("/api/excel", excelRoutes);
app.use("/api/excel", excelUploadRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================= ERROR HANDLER ================= */
app.use(errorHandler);




export default app;
