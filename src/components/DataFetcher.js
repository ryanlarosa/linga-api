// DataFetcher.js
import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "./DataFetcher.css";
import storelist from "../data/storelist.json";
import { useNavigate } from "react-router-dom";

const DataFetcher = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState(
    "64a7fd77e6251d77d453b0f5" // Default store ID
  );

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  function formatDateForInput(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.valueAsDate;
    setFromDate(newFromDate);
  };

  const handleToDateChange = (e) => {
    const newToDate = e.target.valueAsDate;
    setToDate(newToDate);
  };

  const handleLogoutClick = () => {
    onLogout(null); // Clear user state in App.js
    navigate("/login"); // Redirect to login screen
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);

      // Array of promises for all API calls
      const apiPromises = [
        axios.get(
          `/v1/lingapos/store/${selectedStore}/getsale?fromDate=${formattedFromDate}&toDate=${formattedToDate}`,
          {
            headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
          }
        ),
        axios.get(
          `/v1/lingapos/store/${selectedStore}/discountReport?dateOption=DR&fromDate=${formattedFromDate}&toDate=${formattedToDate}&selectedReportType=By Discount Type`,
          {
            headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
          }
        ),
        axios.get(`/v1/lingapos/store/${selectedStore}/layout`, {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }),
        axios.get(`/v1/lingapos/store/${selectedStore}/users`, {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }),
        axios.get(
          `/v1/lingapos/store/${selectedStore}/saleReport?dateOption=DR&employeeGroup=N&fromDate=${formattedFromDate}&toDate=${formattedToDate}&isDetailedView=false&numberOfDay=&page=1&reportType=&selectedEmployee=&selectedItemId=&specificDate=&type=MENUITEM`,
          {
            headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
          }
        ),
        axios.get(
          `/v1/lingapos/store/${selectedStore}/saleSummaryReport?dateOption=DR&fromDate=${formattedFromDate}&toDate=${formattedToDate}`,
          {
            headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
          }
        ),
      ];

      const [
        response1,
        response2,
        responseFloor,
        responseUsers,
        responseMenu,
        responseSaleSummary,
      ] = await Promise.all(apiPromises);

      // Check responses for success status (200)
      if (response1.status !== 200)
        throw new Error(`Failed to fetch sales data: ${response1.statusText}`);
      if (response2.status !== 200)
        throw new Error(
          `Failed to fetch discount report: ${response2.statusText}`
        );
      if (responseFloor.status !== 200)
        throw new Error(
          `Failed to fetch floor data: ${responseFloor.statusText}`
        );
      if (responseUsers.status !== 200)
        throw new Error(
          `Failed to fetch user data: ${responseUsers.statusText}`
        );
      if (responseMenu.status !== 200)
        throw new Error(
          `Failed to fetch menu data: ${responseMenu.statusText}`
        );
      // Corrected error message reference
      if (responseSaleSummary.status !== 200)
        throw new Error(
          `Failed to fetch sale summary data: ${responseSaleSummary.statusText}`
        );

      // CONSOLIDATE ALL ITEMS IN THE ORDERS
      const allOrders = [];
      // totalGross will be handled by saleSummary, no need to sum here unless for specific purpose
      // let totalGross = 0; // Initialize total gross amount (removed as totalGrossAmount comes from saleSummary)

      response1.data.sales.forEach((sale) => {
        if (sale.orders) {
          sale.orders.forEach((order) => {
            allOrders.push({
              ...order,
              saleId: sale.ticketNo,
              saleDate: sale.startDate,
              saleDiscount: sale.discountsStr, // Attach the sale's overall discount to the order
            });
          });
        }
      });

      setData({
        sales: response1.data.sales,
        saleDetails: response2.data,
        floors: responseFloor.data.floors,
        users: responseUsers.data,
        menus: responseMenu.data.data, // This is the aggregated menu report
        detailedMenu: allOrders, // This is the detailed breakdown of orders
        saleSummary: responseSaleSummary.data, // The new sale summary data
        // totalGrossAmount: totalGross.toFixed(2), // Removed as this comes from saleSummary
      });

      console.log("Sales Data:", response1.data);
      console.log("Discount Data:", response2.data);
      console.log("Floor Data:", responseFloor.data);
      console.log("Users Data:", responseUsers.data);
      console.log("Menu Data:", responseMenu.data);
      console.log("Sale Summary Data:", responseSaleSummary.data);
      console.log("All Consolidated Orders (Detailed Menu):", allOrders);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "An error occurred fetching data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Check if data is available and necessary arrays are not empty
    if (
      !data ||
      !data.sales ||
      data.sales.length === 0 ||
      !data.floors ||
      data.floors.length === 0 ||
      !data.users ||
      data.users.length === 0 ||
      !data.saleDetails ||
      data.saleDetails.length === 0 || // Added check for saleDetails
      !data.menus ||
      data.menus.length === 0 || // Added check for menus
      !data.detailedMenu ||
      data.detailedMenu.length === 0 || // Added check for detailedMenu
      !data.saleSummary ||
      data.saleSummary.length === 0 // Added check for saleSummary data
    ) {
      setError("No Data to Export. Please fetch data first.");
      return;
    }

    const formattedFromDate = formatDate(fromDate);
    const formattedToDate = formatDate(toDate);
    const filename = `SalesData_${formattedFromDate}_to_${formattedToDate}.xlsx`; // Define filename here

    const extractedData1_Sales = data.sales.map((item) => {
      const saleDate = new Date(item.startDate);
      const day = String(saleDate.getDate()).padStart(2, "0");
      const month = String(saleDate.getMonth() + 1).padStart(2, "0");
      const year = saleDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const floorName =
        data.floors.find((floor) => floor.id === item.floorId)?.floorName ||
        "Unknown";
      const selectedStoreName =
        storelist.find((store) => store.id === selectedStore)?.name ||
        "Unknown Store";

      const createdBy =
        data.users.find((u) => u.id === item.employee)?.name || "Unknown"; // Use 'u' to avoid conflict

      const closedBy =
        data.users.find((u) => u.id === item.saleCloseEmployee)?.name || // Use 'u' to avoid conflict
        "Unknown";

      // Find corresponding summary data for netSales, discounts, totalTax
      const summaryForTicket = data.saleSummary.find(
        (summaryItem) =>
          summaryItem.ticketNo === item.ticketNo &&
          summaryItem.saleNo === item.saleNo
      );

      return {
        Store: selectedStoreName,
        Ticket_No: item.ticketNo,
        Customer_Name: item.customerName,
        Sale_Open_Time: item.saleOpenTime,
        Floor: floorName,
        Table_No: item.tableNo,
        Net_Sales: summaryForTicket?.netSales || "0.00", // Use from saleSummary
        Total_Tax: summaryForTicket?.totalTaxAmount || "0.00", // Use from saleSummary
        Discount: summaryForTicket?.discounts || "0.00", // Use from saleSummary
        Gross_Receipt: item.grossReceiptStr,
        Closed_By: closedBy,
        Server_Name: createdBy,
        Guest_Count: item.guestCount,
        Final_SaleDate: formattedDate,
      };
    });

    const filteredDiscountData = data.saleDetails.filter(
      (item) => item.check !== "Total"
    );
    const extractedData2_Discounts = filteredDiscountData.map((item) => {
      return {
        Approved_By: item.approvedBy,
        Check: item.check,
        Date: item.date,
        Discount_Amount: item.discountAmtStr,
        Discount_Applied_By: item.discountAppliedBy,
        Discount_Coupon: item.discountCoupon,
        Discount_Name: item.discountName,
        Discount_Type: item.discountType,
        Gross_Sales: item.grossSalesStr,
        Is_Total: item.isTotal,
        Menu_Items: item.menuItems,
        Percent: item.percent,
        Quantity: item.quantity,
        Reason: item.reason,
        Total_Discounts: item.totalDiscounts,
      };
    });

    // New extraction for aggregated menu summary
    const extractedData3_MenuSummary = data.menus.map((item) => ({
      BusinessDate: item.businessDate,
      Quantity: item.quantity,
      Item_Id: item.itemId,
      Menu_Item: item.name,
      // Add other relevant fields from data.menus if needed
    }));

    const extractedData4_MenuItemDetailed = data.detailedMenu.map((item) => {
      const saleDate = new Date(item.saleDate);
      const day = String(saleDate.getDate()).padStart(2, "0");
      const month = String(saleDate.getMonth() + 1).padStart(2, "0");
      const year = saleDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      const orderMin = String(item.orderMin || 0).padStart(2, "0"); // Ensure orderMin exists, default to 0
      const voidBy =
        data.users.find((u) => u.id === item.voidByEmployee)?.name || "Unknown";

      return {
        Order_Date: formattedDate,
        Order_Hour: `${item.orderHour || "00"}:${orderMin}`, // Default hour if missing
        Ticket_No: item.saleId,
        Department: item.departmentName,
        CategoryName: item.categoryName,
        Quantity: item.quantity,
        Menu_Item: item.menuName,
        Gross_Amount: item.grossAmountStr,
        Total_Amount: item.totalGrossAmountStr,
        Discount: item.totalDiscountAmountStr,
        Is_Void: item.isVoid,
        Void_Reason: item.voidError,
        VoidedBy: voidBy,
      };
    });

    const worksheet1 = XLSX.utils.json_to_sheet(extractedData1_Sales);
    const worksheet2 = XLSX.utils.json_to_sheet(extractedData2_Discounts);
    const worksheet3 = XLSX.utils.json_to_sheet(extractedData3_MenuSummary);
    const worksheet4 = XLSX.utils.json_to_sheet(
      extractedData4_MenuItemDetailed
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet1, "SalesData");
    XLSX.utils.book_append_sheet(workbook, worksheet2, "DiscountData");
    XLSX.utils.book_append_sheet(workbook, worksheet3, "MenuItemSummary");
    XLSX.utils.book_append_sheet(workbook, worksheet4, "MenuItemDetailed");

    XLSX.writeFile(workbook, filename); // Use the dynamically generated filename
  };

  return (
    <div className="data-fetcher-container">
      <div className="data-fetcher">
        <h2>Data Fetcher</h2>
        {/* Always show the logout button */}
        <button onClick={handleLogoutClick}>Logout</button>
        {/* Conditional rendering for admin-specific controls */}
        {user && user.role === "admin" ? (
          // This entire block is rendered only for admin
          <>
            <div>
              {" "}
              {/* This div wraps the store dropdown */}
              <label htmlFor="store">Store:</label>
              <select
                id="store"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                {storelist.map((store) => (
                  <option id="storename" key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Date pickers and Fetch Data button */}
            <label>From Date:</label>
            <input
              type="date"
              value={formatDateForInput(fromDate)}
              onChange={handleFromDateChange}
            />

            <label>To Date:</label>
            <input
              type="date"
              value={formatDateForInput(toDate)}
              onChange={handleToDateChange}
            />
            <button onClick={fetchData}>Fetch Data</button>
          </>
        ) : (
          // Message for non-admin users
          user &&
          user.role === "user" && (
            <p className="user-message">
              You are logged in as a regular user. Please contact an
              administrator for full access to data fetching controls.
            </p>
          )
        )}
        {loading && (
          <div className="loading-container">
            <div className="loader"></div>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}{" "}
        {/* Added class for error message */}
        {/* Export button should be available if data is loaded, regardless of role */}
        {!loading && data && (
          <div>
            <button onClick={exportToExcel}>Export to Excel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFetcher;
