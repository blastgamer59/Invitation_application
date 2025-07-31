import React, { createContext, useContext, useState } from "react";

const RSVPContext = createContext(undefined);

export const RSVPProvider = ({ children }) => {
  const [rsvpData, setRSVPData] = useState(null);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [token, setToken] = useState("");

  const submitRSVP = async (data) => {
    try {
      // For non-attending guests, don't include phone number and skip QR code generation
      const submissionData = data.attending === "No" 
        ? { 
            fullName: data.fullName,
            attending: "No",
            // Explicitly exclude phone number and other details
          }
        : data;

      const response = await fetch("https://invitationapplication.onrender.com/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success) {
        // Only set confirmation details for attending guests
        if (data.attending === "Yes") {
          setConfirmationNumber(result.confirmationNumber);
          setToken(result.token);
        }
        setRSVPData(data);
        return true;
      } else {
        throw new Error(result.message || "Failed to submit RSVP");
      }
    } catch (error) {
      console.error("RSVP submission error:", error);
      throw error;
    }
  };

  const verifyRSVP = async (confirmationNumber) => {
    try {
      const response = await fetch(
        `https://invitationapplication.onrender.com/api/rsvp/${confirmationNumber}`
      );
      const result = await response.json();

      if (result.success) {
        return result.rsvp;
      } else {
        throw new Error(result.message || "Failed to verify RSVP");
      }
    } catch (error) {
      console.error("RSVP verification error:", error);
      throw error;
    }
  };

  const scanQRCode = async (qrData) => {
    try {
      const response = await fetch("https://invitationapplication.onrender.com/api/rsvp/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrData }),
      });

      const result = await response.json();

      if (result.success) {
        return result.rsvp;
      } else {
        throw new Error(result.message || "Failed to scan QR code");
      }
    } catch (error) {
      console.error("QR code scanning error:", error);
      throw error;
    }
  };

  return (
    <RSVPContext.Provider
      value={{
        rsvpData,
        setRSVPData,
        confirmationNumber,
        submitRSVP,
        verifyRSVP,
        scanQRCode,
        token,
      }}
    >
      {children}
    </RSVPContext.Provider>
  );
};

export const useRSVP = () => {
  const context = useContext(RSVPContext);
  if (context === undefined) {
    throw new Error("useRSVP must be used within a RSVPProvider");
  }
  return context;
};