import express, { json, urlencoded } from "express";
import { config } from "dotenv";
import helmet from "helmet";
import cors from "cors";
import HttpStatusCodes from "./constants/httpCodes.js";
import AppError from "./utils/errorHandler.js";
import globalErrorHandler from "./utils/globalErrorHandler.js";
import TinyLinkRouter from "./routes/index.js";

/**
 * Express application configuration and initialization.
 */
const app = express();
config();

/**
 * Helmet middleware for security headers.
 */

app.use(
  helmet({
    hidePoweredBy: true,
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.disable("x-powered-by");

const PORT = process.env.PORT || 5000;

// Use CORS middleware
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

/**
 * CORS headers setup for specific origins and allowed methods.
 */

app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:5173", ""];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // Allow preflight requests to cache
  res.header("Access-Control-Max-Age", "86400");

  // Define allowed methods
  const allowedMethods = ["DELETE", "GET", "PATCH", "POST"];

  // Handle unsupported methods
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Set allowed methods
  res.header("Access-Control-Allow-Methods", allowedMethods.join(", "));
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  if (process.env.NODE_ENV == "development")
    console.log(`➡️  Incoming ${req.method} request: ${req.originalUrl}`);
  next();
});

app.use("/api", TinyLinkRouter);

/**
 * Catch-all route for undefined routes.
 *
 * @route *
 * @param {express.Request} req - The Express request object.
 * @param {express.Response} res - The Express response object.
 * @param {Function} next - The next middleware function.
 */
app.use((req, _res, next) => {
  const errorMessage = `Cannot ${req.method}: ${req.originalUrl} on this server!`;
  const error = new AppError(HttpStatusCodes.METHOD_NOT_ALLOWED, errorMessage);

  next(error);
});

/**
 * Global error handling middleware.
 */
app.use(globalErrorHandler);

/**
 * Connect to Neon-Postgres.
 */

app.listen(PORT, () => {
  if (process.env.NODE_ENV == "development")
    console.log(`⚡️⚡️ TinyLink Server is running on port ${PORT} ⚡️⚡️`);
});

export default app;
