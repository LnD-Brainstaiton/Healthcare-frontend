import React, { useEffect, useState } from "react";
import "../styles/DoctorList.css";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const DoctorsApproveList = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [searchQueryId, setSearchQueryId] = useState("");
  const [designationOptions, setDesignationOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Popup visibility state
  const [selectedDoctor, setSelectedDoctor] = useState(null); // Popup state
  const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false); // For update popup visibility
  const [updateFormData, setUpdateFormData] = useState({
    requestId: "",
    status: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    designation: "", // Added for doctor
    department: "", // Added for doctor
    specialities: "", // Added for doctor
    fee: "", // Added for doctor
  });
  const pageSize = 10;

  // Fetch doctors data from the API
  const fetchDoctors = async (page = 0) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        return;
      }

      const queryParams = new URLSearchParams({
        page,
        size: pageSize,
        requestId: searchQueryId,
        featureCode: "DOCTOR",
      }).toString();

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/v1/user/admin/tempdata?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log(data);
      const doctorsData = data.data.content.map((item) => ({
        ...JSON.parse(JSON.parse(item.data)), // Parse the data and spread it to include all the fields
        requestId: item.requestId, // Add the requestId from the original item
        status: item.status,
      }));
      console.log("Fetched doctors data:", doctorsData); // Debug API response

      if (data.responseCode === "S100000") {
        setDoctors(doctorsData);
        setTotalPages(data.data.totalPages);
      } else {
        console.error("Error fetching doctors:", data.responseMessage);
        setDoctors([]); // Clear table if an error occurs
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]); // Clear table if an error occurs
    }
  };

  // Fetch dropdown options
  const fetchDropdownOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch department options
      const departmentRes = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/v1/user/department-options`,
        { headers }
      );
      const departmentData = await departmentRes.json();
      setDepartmentOptions(departmentData.data.departments || []);

      // Fetch designation options
      const designationRes = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/v1/user/designation-options`,
        { headers }
      );
      const designationData = await designationRes.json();
      setDesignationOptions(designationData.data.designations || []);
    } catch (err) {
      setError("Failed to fetch dropdown options");
    }
  };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setUpdateFormData({
  //     ...updateFormData,
  //     [name]: value,
  //   });
  // };
  const handleChange = (event) => {
    const { name, value } = event.target;
    setUpdateFormData({
      ...updateFormData,
      [name]: value,
    });
  };

  const handleUpdate = (doctor) => {
    setSelectedDoctor(doctor); // Set the doctor for update
    setUpdateFormData({
      requestId: doctor.requestId,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      mobile: doctor.mobile,
      patientId: doctor.patientId,
      designation: doctor.designation || "",
      department: doctor.department || "",
      specialities: doctor.specialities || "",
      fee: doctor.fee || "",
      status: "Pending",
    }); // Pre-fill the update form with doctor's data
    setIsUpdatePopupOpen(true); // Open the update popup
  };

  const closeUpdatePopup = () => {
    setSelectedDoctor(null); // Clear the selected doctor
    setIsUpdatePopupOpen(false); // Close the update popup
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const requestBody = {
        featureCode: "DOCTOR",
        operationType: "update",
        message: "",
        requestUrl: "/api/v1/user/admin/temp/request",
        requestId: selectedDoctor.requestId,
        data: JSON.stringify(updateFormData),
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/v1/user/admin/temp/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      if (data.responseCode === "S100000") {
        alert("Doctor updated successfully!");
        closeUpdatePopup(); // Close popup on success
        fetchDoctors(currentPage); // Refresh the list
      } else {
        alert(`Failed to update doctor: ${data.responseMessage}`);
      }
    } catch (error) {
      console.error("Error updating doctor:", error);
      alert("An error occurred while updating the doctor.");
    }
  };

  // Fetch doctors data when filters or pagination change
  useEffect(() => {
    fetchDropdownOptions();
    fetchDoctors(currentPage); // Fetch initial data
  }, []);

  useEffect(() => {
    fetchDoctors(currentPage); // Refetch when the page changes
  }, [currentPage]);

  useEffect(() => {
    fetchDoctors(0); // Refetch when filters change
  }, [searchQueryId]);

  const handleSearch = () => {
    setCurrentPage(0); // Reset pagination
    fetchDoctors(0); // Refetch with new filters
  };

  const handleView = (appointment) => {
    setSelectedDoctor(appointment); // Set the selected appointment
    setIsPopupOpen(true); // Open the popup
  };

  const closePopup = () => {
    setSelectedDoctor(null); // Clear selected appointment
    setIsPopupOpen(false); // Close the popup
  };

  const handleCheck = async (requestId, status) => {
    let confirmation = "reject";
    if (status == "Accepted") confirmation = "accept";
    let userConfirmed = window.confirm(
      `Are you sure you want to ${confirmation} the doctor with ID: ${requestId}?`
    );

    if (userConfirmed) {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("Authentication token not found. Please log in.");
          return;
        }

        const requestBody = {
          featureCode: "DOCTOR", // Replace with your actual feature code
          status: status, // Replace with your actual operation type
          message: "", // Replace with your actual message
          requestId: requestId, // Replace with your actual request ID
        };

        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/v1/user/admin/request/check`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (data.responseCode === "S100000") {
          alert(`Doctor ${status} successfully!`);
          closePopup();
          fetchDoctors(currentPage); // Refresh the list after deletion
        } else {
          alert(`Failed to ${confirmation} doctor: ${data.responseMessage}`);
        }
      } catch (error) {
        console.error("Error processing doctor:", error);
        alert("An error occurred while trying to process the doctor.");
      }
    } else {
      alert("Process canceled.");
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return (
    <div className="doctors-list">
      <h1>Pending Doctors List</h1>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search by id..."
          value={searchQueryId}
          onChange={(e) => setSearchQueryId(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>

      <table className="doctors-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.length > 0 ? (
            doctors.map((doctor, index) => (
              <tr key={index}>
                <td>{doctor.requestId}</td>
                <td>{doctor.firstName}</td>
                <td>{doctor.lastName}</td>
                <td>{doctor.designation}</td>
                <td>{doctor.department}</td>
                <td>{doctor.status}</td>
                <td>
                  <button
                    className="view-icon-button"
                    onClick={() => handleView(doctor)}
                    title="View Details"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-eye"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  {doctor.status === "Rejected" && (
                    <button
                      className="update-submit"
                      onClick={() => handleUpdate(doctor)}
                      title="Update Details"
                    >
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No doctors found.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination-controls">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 0}
          className="pagination-button"
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="pagination-button"
        >
          Next
        </button>
      </div>
      {isUpdatePopupOpen && selectedDoctor && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button onClick={closeUpdatePopup} className="popup-close-icon">
              ×
            </button>

            <form onSubmit={handleUpdateSubmit}>
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={updateFormData.firstName || ""}
                onChange={handleChange}
              />

              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={updateFormData.lastName || ""}
                onChange={handleChange}
              />

              <label>Email</label>
              <input
                type="email"
                name="email"
                value={updateFormData.email || ""}
                onChange={handleChange}
              />

              <label>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={updateFormData.mobile || ""}
                onChange={handleChange}
              />

              <label>Designation</label>
              <select
                name="designation"
                value={updateFormData.designation}
                onChange={handleChange}
                className="update-input-field"
              >
                <option value="">Select Designation</option>
                {designationOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <label>Department</label>
              <select
                name="department"
                value={updateFormData.department}
                onChange={handleChange}
                className="update-input-field"
              >
                <option value="">Select Department</option>
                {departmentOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <label>Fee</label>
              <input
                type="number"
                name="fee"
                value={updateFormData.fee || ""}
                onChange={handleChange}
              />

              <label htmlFor="specialities">Specialities</label>
              <input
                name="specialities"
                value={updateFormData.specialities || ""}
                onChange={handleChange}
              />
              <div className="update-footer">
                <button type="submit" className="update-submit">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPopupOpen && selectedDoctor && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button onClick={closePopup} className="popup-close-icon">
              ×
            </button>
            <h2>Doctor Details</h2>
            <p>
              <strong>Request ID:</strong> {selectedDoctor.requestId}
            </p>
            <p>
              <strong>First Name:</strong> {selectedDoctor.firstName}
            </p>
            <p>
              <strong>Last Name:</strong> {selectedDoctor.lastName}
            </p>
            <p>
              <strong>Email:</strong> {selectedDoctor.email}
            </p>
            <p>
              <strong>Mobile:</strong> {selectedDoctor.mobile}
            </p>
            <p>
              <strong>Designation:</strong> {selectedDoctor.designation}
            </p>
            <p>
              <strong>Department:</strong> {selectedDoctor.department}
            </p>
            <p>
              <strong>Fee :</strong> {selectedDoctor.fee}
            </p>
            <p>
              <strong>Speacialities :</strong> {selectedDoctor.specialities}
            </p>
            <p>
              <strong>Status:</strong> {selectedDoctor.status}
            </p>
            <div>
              <strong>Time Slot:</strong>
              {selectedDoctor.timeSlots &&
              selectedDoctor.timeSlots.length > 0 ? (
                selectedDoctor.timeSlots.map((slot, index) => (
                  <div key={index} style={{ marginBottom: "10px" }}>
                    <div>
                      Start Time: {slot.startTime}, End Time: {slot.endTime},
                      Weekdays:{" "}
                      {slot.weekdays && slot.weekdays.length > 0 ? (
                        slot.weekdays.map((day, idx) => (
                          <span key={idx} style={{ marginRight: "5px" }}>
                            {day}
                          </span>
                        ))
                      ) : (
                        <span>None</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div>No time slots available.</div>
              )}
            </div>

            <div className="popup-actions">
              <button
                className="btn-approve"
                onClick={() =>
                  handleCheck(selectedDoctor.requestId, "Accepted")
                }
              >
                Approve
              </button>
              <button
                className="btn-reject"
                onClick={() =>
                  handleCheck(selectedDoctor.requestId, "Rejected")
                }
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsApproveList;
