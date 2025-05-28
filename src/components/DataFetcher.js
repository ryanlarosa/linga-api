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
    "64a7fd77e6251d77d453b0f5"
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
    onLogout(null); // Update user state to null on logout
    navigate("/login");
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const formattedFromDate = formatDate(fromDate);
      const formattedToDate = formatDate(toDate);

      const promise1 = axios.get(
        `/v1/lingapos/store/${selectedStore}/getsale?fromDate=${formattedFromDate}&toDate=${formattedToDate}`,
        {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }
      );
      const promise2 = axios.get(
        `/v1/lingapos/store/${selectedStore}/discountReport?dateOption=DR&fromDate=${formattedFromDate}&toDate=${formattedToDate}&selectedReportType=By Discount Type`,
        {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }
      );
      const promiseFloor = axios.get(
        `/v1/lingapos/store/${selectedStore}/layout`,
        {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }
      );
      const promiseUsers = axios.get(
        `/v1/lingapos/store/${selectedStore}/users`,
        {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }
      );
      const promiseMenu = axios.get(
        `/v1/lingapos/store/${selectedStore}/saleReport?dateOption=DR&employeeGroup=N&${formattedFromDate}&toDate=${formattedToDate}&isDetailedView=false&numberOfDay=&page=1&reportType=&selectedEmployee=&selectedItemId=&specificDate=&type=MENUITEM`,
        {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }
      );
      const promiseSaleSummary = axios.get(
        `v1/lingapos/store/${selectedStore}/saleSummaryReport?dateOption=DR&fromDate=${formattedFromDate}&toDate=${formattedToDate}`,
        {
          headers: { apikey: "UiSg7JagVOd42IEwAnctfWS6qSTaKxxr" },
        }
      );

      const [
        response1,
        response2,
        responseFloor,
        responseUsers,
        responseMenu,
        responseSaleSummary,
      ] = await Promise.all([
        promise1,
        promise2,
        promiseFloor,
        promiseUsers,
        promiseMenu,
        promiseSaleSummary,
      ]);

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

      if (responseSaleSummary.status !== 200)
        throw new Error(
          `Failed to fetch menu data: ${responseMenu.responseSaleSummary}`
        );

      // Extract all orders into a single array, including saleId
      const allOrders = [];
      let totalGross = 0; // Initialize total gross amount

      response1.data.sales.forEach((sale) => {
        if (sale.orders) {
          sale.orders.forEach((order) => {
            allOrders.push({
              ...order,
              saleId: sale.ticketNo,
              saleDate: sale.startDate,
            });
            totalGross += parseFloat(order.grossAmountStr || "0");
          });
        }
      });

      setData({
        sales: response1.data.sales,
        saleDetails: response2.data,
        floors: responseFloor.data.floors,
        users: responseUsers.data,
        menus: responseMenu.data.data,
        detailedMenu: allOrders,
        totalGrossAmount: totalGross.toFixed(2),
        saleSummary: responseSaleSummary.data,
      });

      console.log(response1.data);
      console.log(response2.data);
      console.log(responseFloor.data);
      console.log(responseUsers.data);
      console.log(responseMenu.data);
      console.log(responseSaleSummary.data);
      console.log(allOrders);
    } catch (err) {
      setError(err.message || "An error occurred.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (
      !data ||
      !data.sales ||
      data.sales.length === 0 ||
      !data.floors ||
      data.floors.length === 0 ||
      !data.users ||
      data.users.length === 0
    ) {
      setError("No Data to Export");
      return;
    }

    const extractedData1 = data.sales.map((item) => {
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
        data.users.find((user) => user.id === item.employee)?.name || "Unknown";

      const closedBy =
        data.users.find((user) => user.id === item.saleCloseEmployee)?.name ||
        "Unknown";

      const netSales =
        data.saleSummary.find((sales) => sales.ticketNo === item.ticketNo)
          ?.netSales || "0.00";
      const discounts =
        data.saleSummary.find((sales) => sales.ticketNo === item.ticketNo)
          ?.discounts || "0.00";
      const totalTax =
        data.saleSummary.find((sales) => sales.ticketNo === item.ticketNo)
          ?.totalTaxAmount || "0.00";

      return {
        Store: selectedStoreName,
        Ticket_No: item.ticketNo,
        Customer_Name: item.customerName,
        Sale_Open_Time: item.saleOpenTime,
        Floor: floorName,
        Table_No: item.tableNo,
        //Net_Sales: item.netSalesStr,
        Net_Sales: netSales,
        //Total_Tax: item.totalTaxAmountStr,
        Total_Tax: totalTax,
        //Discount: item.discountsStr,
        Discount: discounts,
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
    const extractedData2 = filteredDiscountData.map((item) => {
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

    const extractedData3 = data.detailedMenu.map((item) => {
      const saleDate = new Date(item.saleDate);
      const day = String(saleDate.getDate()).padStart(2, "0");
      const month = String(saleDate.getMonth() + 1).padStart(2, "0");
      const year = saleDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      const orderMin = String(item.orderMin).padStart(2, 0);

      const voidBy =
        data.users.find((user) => user.id === item.voidByEmployee)?.name ||
        "Unknown";

      return {
        Order_Date: formattedDate,
        Order_Hour: `${item.orderHour}:${orderMin}`,
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

    const worksheet1 = XLSX.utils.json_to_sheet(extractedData1);
    const worksheet2 = XLSX.utils.json_to_sheet(extractedData2);
    const worksheet3 = XLSX.utils.json_to_sheet(extractedData3);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet1, "SalesData");
    XLSX.utils.book_append_sheet(workbook, worksheet2, "DiscountData");
    XLSX.utils.book_append_sheet(workbook, worksheet3, "MenuItemDetailed");
    XLSX.writeFile(workbook, `SalesData.xlsx`);
  };

  return (
    <div className="data-fetcher-container">
      <div className="data-fetcher">
        <h2>Data Fetcher</h2>
        <div>
          {user.role === "admin" && (
            <div>
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
          )}
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
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loader"></div>
          </div>
        )}

        {error && <p>{error}</p>}
        {!loading && data && (
          <div>
            <button onClick={exportToExcel}>Export to Excel</button>
          </div>
        )}
        <button onClick={handleLogoutClick}>Logout</button>
      </div>
    </div>
  );
};

export default DataFetcher;
