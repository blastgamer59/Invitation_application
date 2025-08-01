````markdown
# 🎉 Retirement Party Guest Management System

A web-based guest management and verification platform built to organize and manage attendance for **R. Geetavani’s Retirement Party**. This MERN stack application allows users to register for the event, lets administrators monitor analytics, and enables staff to verify attendees through QR code scanning, phone numbers, or confirmation numbers.


## 🧩 Introduction

This system was created to streamline the guest verification and tracking process during the retirement party of **R. Geetavani**. It helps prevent uninvited guests, keeps a real-time record of attendance, and collects key statistics such as meal preferences and attendance percentages.

---

## 🛠 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **QR Code Scanning**: [`jsQR`](https://github.com/cozmo/jsQR)
- **Authentication**: JWT-based (No full authentication layer implemented)
- **Web Sockets**: Socket.io Used for real time updates

---

## ✨ Features

### 👤 User Panel
- Submit party registration form
- Provide name, phone number, meal preference (Veg/Non-Veg)
- Get a confirmation number and QR code

### 🛡️ Admin Panel
- View analytics:
  - Total forms filled
  - Expected attendees
  - Total attended
  - Meal preference breakdown
  - Attendance percentage
- View list of registered users with:
  - Name
  - Phone number
  - Confirmation number
  - Attendance status

### 👨‍🍳 Staff Panel
- Verify user check-in by:
  - Scanning QR code (via jsQR)
  - Entering phone number or confirmation number
- Mark user as “attended” upon verification



## 📸 Examples

* ✅ A user registers and receives a QR code and confirmation number
* 📲 Staff scans the QR or enters a phone/confirmation number
* 🗃️ Admin dashboard updates real-time stats on attendance and preferences


## 👥 Contributors

* **Project Author**: Pavan Kumar Talluri
* **Event Honoree**: R. Geetavani 🎉


