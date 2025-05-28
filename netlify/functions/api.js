// netlify/functions/api.js

const express = require("express");
const serverless = require("serverless-http");
const axios = require("axios"); // For making HTTP requests to the external API
const cors = require("cors"); // For handling Cross-Origin Resource Sharing

const app = express();

// IMPORTANT: Replace with your actual Lingapos API Key (ideally from Netlify environment variables)
const LINGAPOS_API_KEY = process.env.LINGAPOS_API_KEY || "YOUR_API_KEY_HERE";

// IMPORTANT: Replace with the actual base URL of the external Lingapos API
const LINGAPOS_BASE_URL = "https://linga-api.netlify.app"; // This is just an example. Use the correct base URL.

// Configure CORS for your Netlify Function
// This allows your Netlify-deployed frontend to talk to this function.
// For production, you should restrict origins to your specific Netlify frontend URL.
app.use(
  cors({
    origin: true, // Allows all origins for simplicity, but tighten this for production
    credentials: true, // If you're using cookies or authorization headers
  })
);

app.use(express.json()); // To parse JSON request bodies if needed

// --- Define your API routes here ---

// Route 1: getsale
app.get("/v1/lingapos/store/:storeId/getsale", async (req, res) => {
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
    console.error("Error in /getsale:", error.message);
    // Forward the original status code if available, otherwise 500
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch sales data from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 2: discountReport
app.get("/v1/lingapos/store/:storeId/discountReport", async (req, res) => {
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
    console.error("Error in /discountReport:", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch discount report from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 3: layout (Floors)
app.get("/v1/lingapos/store/:storeId/layout", async (req, res) => {
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
    console.error("Error in /layout:", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch layout data from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 4: users
app.get("/v1/lingapos/store/:storeId/users", async (req, res) => {
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
    console.error("Error in /users:", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch user data from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Route 5: saleReport (Menu Items)
app.get("/v1/lingapos/store/:storeId/saleReport", async (req, res) => {
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
    // Reconstruct query parameters for the external API call
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
    console.error("Error in /saleReport:", error.message);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch sales report (menu) from external API",
      details: error.response?.data || error.message,
    });
  }
});

// Fallback for any other /v1/ routes that are not explicitly defined
app.use("/v1/*", (req, res) => {
  res
    .status(404)
    .json({ message: "API endpoint not found in Netlify Function." });
});

// Catch-all for any other routes not handled by Express
app.use((req, res) => {
  res.status(404).json({ message: "API endpoint not found (catch-all)." });
});

// This is the essential part for Netlify Functions to work with Express
module.exports.handler = serverless(app);
