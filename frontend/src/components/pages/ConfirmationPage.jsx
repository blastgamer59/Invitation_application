import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Download, ArrowLeft, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import { useRSVP } from "../../context/RSVPContext";

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const { rsvpData, confirmationNumber, token } = useRSVP();
  const canvasRef = useRef(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  useEffect(() => {
    if (!rsvpData) {
      navigate("/");
      return;
    }

    // Only generate QR code for attending guests
    if (rsvpData.attending === "Yes") {
      generateQRCode();
    }
  }, [rsvpData, navigate]);

  const generateQRCode = async () => {
    if (!rsvpData || !canvasRef.current) return;

    const qrData = {
      fullName: rsvpData.fullName,
      phoneNumber: rsvpData.phoneNumber,
      attending: rsvpData.attending,
      confirmationNumber: confirmationNumber,
      mealPreferences: Array.isArray(rsvpData.mealPreferences)
        ? rsvpData.mealPreferences
        : [rsvpData.mealPreferences],
      familyCount: rsvpData.familyCount || 1,
      familyMembers: rsvpData.familyMembers || [],
      token: token,
      timestamp: new Date().toISOString(),
    };

    try {
      const canvas = canvasRef.current;
      await QRCodeLib.toCanvas(canvas, JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: { dark: "#1E40AF", light: "#FFFFFF" },
      });
      setQrCodeDataUrl(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error("QR generation error:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `retirement-party-rsvp-${confirmationNumber}.png`;
    link.href = qrCodeDataUrl;

    // Mobile device handling
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      const newWindow = window.open();
      newWindow.document.write(`<img src="${qrCodeDataUrl}" alt="QR Code"/>`);
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!rsvpData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen py-8 px-4 bg-gradient-to-br from-[#f0f4ff] to-[#e8f0ff]"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className={`inline-flex items-center justify-center w-20 h-20 ${
              rsvpData.attending === "Yes" ? "bg-green-500" : "bg-gray-500"
            } text-white rounded-full mb-4`}
          >
            <CheckCircle className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {rsvpData.attending === "Yes" ? "RSVP Confirmed!" : "Thank You!"}
          </h1>
          <p className="text-xl text-gray-600">
            {rsvpData.attending === "Yes"
              ? "Thank you for confirming your attendance"
              : "We appreciate you letting us know"}
          </p>
        </motion.div>

        {/* Confirmation Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Card Header */}
          <div
            className={`p-6 text-white text-center ${
              rsvpData.attending === "Yes"
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gradient-to-r from-gray-500 to-gray-600"
            }`}
          >
            <h2 className="text-2xl font-bold mb-2">
              {rsvpData.attending === "Yes"
                ? "Your Confirmation Details"
                : "Your Response"}
            </h2>
            <p className="opacity-90">
              {rsvpData.attending === "Yes"
                ? "Save this QR code for quick check-in at the event"
                : "We'll miss you at the event"}
            </p>
          </div>

          <div className="p-8">
            {/* RSVP Summary */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                RSVP Summary
              </h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{rsvpData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{rsvpData.phoneNumber}</span>
                </div>
                {rsvpData.attending === "Yes" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Meal Preference:</span>
                      <span className="font-medium">
                        {Array.isArray(rsvpData.mealPreferences)
                          ? rsvpData.mealPreferences.join(", ")
                          : rsvpData.mealPreferences}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Family Members:</span>
                      <span className="font-medium">
                        {rsvpData.familyCount}
                      </span>
                    </div>
                    {rsvpData.familyMembers &&
                      rsvpData.familyMembers.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Names:</span>
                          <span className="font-medium">
                            {rsvpData.familyMembers.join(", ")}
                          </span>
                        </div>
                      )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Attending:</span>
                  <span
                    className={`font-medium ${
                      rsvpData.attending === "Yes"
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {rsvpData.attending}
                  </span>
                </div>
              </div>
            </motion.div>

            {rsvpData.attending === "Yes" ? (
              /* QR Code Section for attending guests */
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Your QR Code
                  </h3>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
                    className="inline-block bg-white p-4 rounded-2xl shadow-lg"
                  >
                    <canvas ref={canvasRef} className="block mx-auto" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="mt-6"
                  >
                    <div className="bg-white p-4 rounded-xl shadow-md inline-block">
                      <p className="text-sm text-gray-600 mb-2">
                        Confirmation Number
                      </p>
                      <div className="text-3xl font-bold text-blue-600 tracking-wider">
                        {confirmationNumber}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadQRCode}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download QR Code
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/")}
                    className="flex-1 bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Invitation
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* Message for non-attending guests */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-center py-8"
              >
                <div className="bg-gray-50 p-6 rounded-2xl mb-6">
                  <p className="text-lg text-gray-700 mb-4">
                    Thank you for letting us know you won't be able to attend.
                  </p>
                  <p className="text-gray-600">
                    We appreciate your response and will miss you at the event.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/")}
                  className="bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Invitation
                </motion.button>
              </motion.div>
            )}

            {/* Footer Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="mt-8 text-center text-gray-600"
            >
              <p className="text-sm">
                {rsvpData.attending === "Yes"
                  ? "Please present this QR code at the event entrance for quick check-in."
                  : "If your plans change, you can update your RSVP anytime."}
                <br />
                {rsvpData.attending === "Yes"
                  ? "We look forward to celebrating with you!"
                  : "Thank you for your kind response."}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ConfirmationPage;
