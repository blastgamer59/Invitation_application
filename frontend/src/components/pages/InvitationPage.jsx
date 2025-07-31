import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Users, Phone, User, Utensils } from "lucide-react";
import { useRSVP } from "../../context/RSVPContext";
import LoadingSpinner from "../Spinner/LoadingSpinner";
import InvitationImage from "../../assets/invitation.jpeg";

const InvitationPage = () => {
  const navigate = useNavigate();
  const { submitRSVP } = useRSVP();
  const [isLoading, setIsLoading] = useState(false);
  const [familyCount, setFamilyCount] = useState(1);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const attending = watch("attending");

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSubmitError("");

    try {
      // Format the data based on attendance status
      const formattedData = {
        fullName: data.fullName,
        attending: data.attending,
      };

      if (data.attending === "Yes") {
        formattedData.phoneNumber = data.phoneNumber;
        formattedData.mealPreferences = Array.isArray(data.mealPreferences)
          ? data.mealPreferences
          : [data.mealPreferences].filter(Boolean);
        formattedData.familyCount = familyCount;
        formattedData.familyMembers =
          familyCount > 1
            ? Array.from(
                { length: familyCount - 1 },
                (_, i) => data.familyMembers?.[i] || ""
              )
            : [];
      }

      const success = await submitRSVP(formattedData);
      if (success) {
        navigate("/confirmation");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit RSVP. Please try again.";
      setSubmitError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] via-[#fafbff] to-[#e8f0ff]">
      {/* Error Message for Duplicate Phone or Submission Failures */}
      {submitError && (
        <p className="text-red-600 text-sm font-semibold text-center bg-red-100 border border-red-400 rounded p-2">
          {submitError}
        </p>
      )}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-orange-300/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left - Invitation Image */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full h-auto"
            >
              <img
                src={InvitationImage}
                alt="Invitation"
                className="w-full h-auto object-contain rounded-xl shadow-xl"
              />
            </motion.div>

            {/* Right - RSVP Form */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full"
            >
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white text-center rounded-xl mb-6">
                <h3 className="text-3xl font-bold mb-2">RSVP</h3>
                <p className="text-lg opacity-90">
                  Please confirm your attendance
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-5 h-5 mr-2 text-indigo-600" />
                    Full Name *
                  </label>
                  <input
                    {...register("fullName", {
                      required: "Full name is required",
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-5 h-5 mr-2 text-indigo-600" />
                    Phone Number *
                  </label>
                  <input
                    {...register("phoneNumber", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Enter a valid 10-digit phone number",
                      },
                    })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                    placeholder="Enter your phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* Meal Preferences */}
                <div>
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <Utensils className="w-5 h-5 mr-2 text-indigo-600" />
                    Meal Preferences *
                  </label>
                  <div className="flex gap-4">
                    {["Veg", "Non-Veg"].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={option}
                          {...register("mealPreferences", {
                            required:
                              "Please select at least one meal preference",
                          })}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.mealPreferences && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.mealPreferences.message}
                    </p>
                  )}
                </div>

                {/* Attending */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Will you be attending? *
                  </label>
                  <div className="flex gap-4">
                    {["Yes", "No"].map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={option}
                          {...register("attending", {
                            required: "Please select your attendance",
                          })}
                        />
                        {option === "Yes"
                          ? "Yes, I'll be there!"
                          : "Sorry, can't make it"}
                      </label>
                    ))}
                  </div>
                  {errors.attending && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.attending.message}
                    </p>
                  )}
                </div>

                {/* Family Members */}
                {attending === "Yes" && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <Users className="w-5 h-5 mr-2 text-indigo-600" />
                        How many members will attend in your family?
                      </label>
                      <select
                        {...register("familyCount")}
                        onChange={(e) => setFamilyCount(Number(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                      >
                        {[1, 2, 3].map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? "(Just me)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {familyCount > 1 && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Family Member Names:
                        </label>
                        {Array.from({ length: familyCount - 1 }, (_, index) => (
                          <input
                            key={index}
                            {...register(`familyMembers.${index}`)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                            placeholder={`Family member ${index + 2} name`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                >
                  Submit RSVP
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default InvitationPage;
