import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import io from "socket.io-client";

// Replace with your backend URL if deployed
const socket = io("https://invitationapplication.onrender.com");

const AdminPanel = () => {
  const [rsvpData, setRsvpData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  
  // State for filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ 
    key: "createdAt", 
    direction: "descending" 
  });
  const [attendingFilter, setAttendingFilter] = useState("all");
  const [foodFilter, setFoodFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rsvpResponse, statsResponse] = await Promise.all([
          fetch("https://invitationapplication.onrender.com/api/rsvps"),
          fetch("https://invitationapplication.onrender.com/api/stats"),
        ]);

        const rsvpData = await rsvpResponse.json();
        const statsData = await statsResponse.json();

        if (!rsvpResponse.ok) {
          throw new Error(rsvpData.message || "Failed to fetch RSVP data");
        }

        if (!statsResponse.ok) {
          throw new Error(statsData.message || "Failed to fetch stats");
        }

        const transformedData = rsvpData.data.map((item) => ({
          id: item._id,
          name: item.fullName,
          isAttending: item.attending,
          filledForm: true,
          attended: item.attended || false,
          attendedAt: item.attendedAt,
          foodPreference: Array.isArray(item.mealPreferences)
            ? item.mealPreferences.includes("Non-Veg")
              ? "nonveg"
              : "veg"
            : "veg",
          phoneNumber: item.phoneNumber,
          confirmationNumber: item.confirmationNumber,
          familyCount: item.familyCount || 1,
          familyMembers: item.familyMembers || [],
          createdAt: new Date(item.createdAt).toLocaleDateString(),
          timestamp: new Date(item.createdAt).getTime(),
        }));

        setRsvpData(transformedData);
        setStats(statsData.stats || {});
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Real-time listeners
  useEffect(() => {
    socket.on("new-rsvp", (newRsvp) => {
      const transformed = {
        id: Date.now().toString(),
        name: newRsvp.fullName,
        isAttending: newRsvp.attending,
        filledForm: true,
        attended: false,
        attendedAt: null,
        foodPreference: Array.isArray(newRsvp.mealPreferences)
          ? newRsvp.mealPreferences.includes("Non-Veg")
            ? "nonveg"
            : "veg"
          : "veg",
        phoneNumber: newRsvp.phoneNumber,
        confirmationNumber: newRsvp.confirmationNumber,
        familyCount: newRsvp.familyCount || 1,
        familyMembers: newRsvp.familyMembers || [],
        createdAt: new Date(newRsvp.createdAt).toLocaleDateString(),
        timestamp: new Date(newRsvp.createdAt).getTime(),
      };

      setRsvpData((prev) => [transformed, ...prev]);

      setStats((prev) => ({
        ...prev,
        totalRsvps: (prev.totalRsvps || 0) + 1,
        attending:
          newRsvp.attending === "Yes"
            ? (prev.attending || 0) + 1
            : prev.attending || 0,
        vegCount: newRsvp.mealPreferences.includes("Veg")
          ? (prev.vegCount || 0) + 1
          : prev.vegCount || 0,
        nonVegCount: newRsvp.mealPreferences.includes("Non-Veg")
          ? (prev.nonVegCount || 0) + 1
          : prev.nonVegCount || 0,
      }));
    });

    socket.on("rsvp-attended", ({ id, attendedAt }) => {
      setRsvpData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, attended: true, attendedAt } : item
        )
      );

      setStats((prev) => ({
        ...prev,
        attended: (prev.attended || 0) + 1,
      }));
    });

    return () => {
      socket.off("new-rsvp");
      socket.off("rsvp-attended");
    };
  }, []);

  // Sorting functionality
  const sortedData = useMemo(() => {
    let sortableData = [...rsvpData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        // Handle different data types for sorting
        if (sortConfig.key === 'createdAt') {
          return sortConfig.direction === 'ascending' 
            ? a.timestamp - b.timestamp 
            : b.timestamp - a.timestamp;
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [rsvpData, sortConfig]);

  // Filtering functionality
  const filteredData = useMemo(() => {
    return sortedData.filter(item => {
      const matchesAttending = attendingFilter === "all" || 
        (attendingFilter === "yes" && item.isAttending === "Yes") ||
        (attendingFilter === "no" && item.isAttending !== "Yes");
      const matchesFood = foodFilter === "all" || item.foodPreference === foodFilter;
      
      return matchesAttending && matchesFood;
    });
  }, [sortedData, attendingFilter, foodFilter]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.length > 0 
    ? filteredData.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.max(Math.ceil(filteredData.length / itemsPerPage), 1);

  // Ensure currentPage doesn't exceed totalPages when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredData, currentPage, totalPages]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const foodPreferenceData = [
    { name: "Vegetarian", value: stats.vegCount || 0 },
    { name: "Non-Vegetarian", value: stats.nonVegCount || 0 },
  ];

  const attendanceData = [
    { name: "Total RSVPs", value: stats.totalRsvps || 0 },
    { name: "Will Attend", value: stats.attending || 0 },
    { name: "Actually Attended", value: stats.attended || 0 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const toggleAttended = async (id) => {
    try {
      const person = rsvpData.find((item) => item.id === id);
      if (person.attended) {
        alert("This person is already marked as attended");
        return;
      }

      const response = await fetch(
        `https://invitationapplication.onrender.com/api/rsvp/${id}/attended`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to mark as attended");
      }

      // This is no longer needed if you're relying on socket to update UI
      // but kept here just in case socket connection fails
      setRsvpData((prevData) =>
        prevData.map((item) =>
          item.id === id
            ? { ...item, attended: true, attendedAt: new Date().toISOString() }
            : item
        )
      );

      setStats((prev) => ({
        ...prev,
        attended: (prev.attended || 0) + 1,
      }));
    } catch (err) {
      console.error("Error updating attendance:", err);
      alert("Failed to mark as attended: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Retirement Party Admin Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total RSVPs</h3>
            <p className="text-2xl font-bold text-indigo-600">
              {stats.totalRsvps || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Will Attend</h3>
            <p className="text-2xl font-bold text-blue-600">
              {stats.attending || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">
              Actually Attended
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {stats.attended || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">
              Attendance Rate
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats.attending
                ? Math.round((stats.attended / stats.attending) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Food Preference Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Food Preferences (Attending Only)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={foodPreferenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent, value }) =>
                      value > 0
                        ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        : null
                    }
                  >
                    {foodPreferenceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Bar Chart */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Attendance Overview
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attendanceData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RSVP Table Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="attending-filter" className="block text-sm font-medium text-gray-700 mb-1">Attending</label>
                <select
                  id="attending-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={attendingFilter}
                  onChange={(e) => {
                    setAttendingFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="yes">Attending</option>
                  <option value="no">Not Attending</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="food-filter" className="block text-sm font-medium text-gray-700 mb-1">Food Preference</label>
                <select
                  id="food-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={foodFilter}
                  onChange={(e) => {
                    setFoodFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="veg">Vegetarian</option>
                  <option value="nonveg">Non-Vegetarian</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RSVP Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">All RSVPs</h2>
            <div className="text-sm text-gray-500">
              Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} RSVPs
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortConfig.key === 'name' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('familyCount')}
                  >
                    <div className="flex items-center">
                      Family Size
                      {sortConfig.key === 'familyCount' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('isAttending')}
                  >
                    <div className="flex items-center">
                      Attending
                      {sortConfig.key === 'isAttending' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Pref
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('attended')}
                  >
                    <div className="flex items-center">
                      Attended
                      {sortConfig.key === 'attended' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confirmation #
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => requestSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortConfig.key === 'createdAt' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {person.name}
                          </div>
                          {person.familyMembers &&
                            person.familyMembers.length > 0 && (
                              <div className="text-xs text-gray-500">
                                +
                                {person.familyMembers
                                  .filter((name) => name)
                                  .join(", ")}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.familyCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            person.isAttending === "Yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {person.isAttending}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            person.foodPreference === "veg"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {person.foodPreference}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              person.attended
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {person.attended ? "Yes" : "No"}
                          </span>
                          {person.attended && person.attendedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(person.attendedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {person.confirmationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {person.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {!person.attended && person.isAttending === "Yes" && (
                          <button
                            onClick={() => toggleAttended(person.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold transition-colors"
                          >
                            Mark Present
                          </button>
                        )}
                        {person.attended && (
                          <span className="text-green-600 text-xs font-semibold">
                            ✓ Present
                          </span>
                        )}
                        {person.isAttending !== "Yes" && (
                          <span className="text-gray-400 text-xs">
                            Not attending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                      No matching RSVPs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredData.length > itemsPerPage && (
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span> of{' '}
                  <span className="font-medium">{filteredData.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">First</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M8.707 5.293a1 1 0 010 1.414L5.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Last</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M11.293 14.707a1 1 0 010-1.414L14.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;