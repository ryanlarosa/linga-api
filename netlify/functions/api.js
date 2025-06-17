// netlify/functions/api.js

const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios");
const cors = require("cors");

const app = express();

const LINGAPOS_API_KEY =
  process.env.LINGAPOS_API_KEY || "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr";
const LINGAPOS_BASE_URL = "https://api.lingaros.com";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// --- GLOBAL DEBUGGING LOG ---
// This will log the path that Express *receives* within the Netlify Function
app.use((req, res, next) => {
  console.log(`[Function Debug] Incoming request path: ${req.path}`);
  console.log(`[Function Debug] Original URL: ${req.originalUrl}`);
  next();
});

// --- Define your API routes here (WITHOUT THE LEADING /v1) ---
// Frontend calls: /v1/lingapos/store/:storeId/getsale
// Netlify redirect: /v1/* -> /.netlify/functions/api/:splat
// Express route should match :splat -> /lingapos/store/:storeId/getsale

// Route 1: getsale
app.get("/lingapos/store/:storeId/getsale", async (req, res) => {
  console.log("[Function Debug] Matched /getsale route");
  const { storeId } = req.params;
  const { fromDate, toDate } = req.query;

  try {
    const externalApiUrl = `${LINGAPOS_BASE_URL}/v1/lingapos/store/${storeId}/getsale?fromDate=${fromDate}&toDate=${toDate}`;
    const response = await axios.get(externalApiUrl, {
      headers: {
        apikey: LINGAPOS_API_KEY,
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error in /getsale (function):", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch sales data from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 2: discountReport
app.get("/lingapos/store/:storeId/discountReport", async (req, res) => {
  console.log("[Function Debug] Matched /discountReport route");
  const { storeId } = req.params;
  const { dateOption, fromDate, toDate, selectedReportType } = req.query;

  try {
    const externalApiUrl = `${LINGAPOS_BASE_URL}/v1/lingapos/store/${storeId}/discountReport?dateOption=${dateOption}&fromDate=${fromDate}&toDate=${toDate}&selectedReportType=${selectedReportType}`;
    const response = await axios.get(externalApiUrl, {
      headers: {
        apikey: LINGAPOS_API_KEY,
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error in /discountReport (function):", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch discount report from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 3: layout (Floors)
app.get("/lingapos/store/:storeId/layout", async (req, res) => {
  console.log("[Function Debug] Matched /layout route");
  const { storeId } = req.params;

  try {
    const externalApiUrl = `${LINGAPOS_BASE_URL}/v1/lingapos/store/${storeId}/layout`;
    const response = await axios.get(externalApiUrl, {
      headers: {
        apikey: LINGAPOS_API_KEY,
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error in /layout (function):", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch layout data from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 4: users
app.get("/lingapos/store/:storeId/users", async (req, res) => {
  console.log("[Function Debug] Matched /users route");
  const { storeId } = req.params;

  try {
    const externalApiUrl = `${LINGAPOS_BASE_URL}/v1/lingapos/store/${storeId}/users`;
    const response = await axios.get(externalApiUrl, {
      headers: {
        apikey: LINGAPOS_API_KEY,
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error in /users (function):", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch user data from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 5: saleReport (Menu Items)
app.get("/lingapos/store/:storeId/saleReport", async (req, res) => {
  console.log("[Function Debug] Matched /saleReport route");
  const { storeId } = req.params;
  const {
    dateOption,
    employeeGroup,
    fromDate,
    toDate,
    isDetailedView,
    numberOfDay,
    page,
    reportType,
    selectedEmployee,
    selectedItemId,
    specificDate,
    type,
  } = req.query;

  try {
    const queryParams = new URLSearchParams({
      dateOption,
      employeeGroup,
      fromDate,
      toDate,
      isDetailedView,
      numberOfDay,
      page,
      reportType,
      selectedEmployee,
      selectedItemId,
      specificDate,
      type,
    }).toString();

    const externalApiUrl = `${LINGAPOS_BASE_URL}/v1/lingapos/store/${storeId}/saleReport?${queryParams}`;
    const response = await axios.get(externalApiUrl, {
      headers: {
        apikey: LINGAPOS_API_KEY,
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error in /saleReport (function):", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch sales report (menu) from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 6: saleSummaryReport
app.get("/lingapos/store/:storeId/saleSummaryReport", async (req, res) => {
  console.log("[Function Debug] Matched /saleSummaryReport route");
  const { storeId } = req.params;
  const { dateOption, fromDate, toDate } = req.query;

  try {
    const externalApiUrl = `${LINGAPOS_BASE_URL}/v1/lingapos/store/${storeId}/saleSummaryReport?dateOption=${dateOption}&fromDate=${fromDate}&toDate=${toDate}`;
    const response = await axios.get(externalApiUrl, {
      headers: {
        apikey: LINGAPOS_API_KEY,
      },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Error in /saleSummaryReport (function):", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch sale summary report from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Catch-all for any other routes that are not explicitly defined within this function
app.use("*", (req, res) => {
  console.log(`[Function Debug] No route matched for path: ${req.path}`);
  res
    .status(404)
    .json({
      message: `API endpoint ${req.path} not found in Netlify Function.`,
    }); // Changed message to show req.path
});

// This is the essential part for Netlify Functions to work with Express
module.exports.handler = serverless(app);
