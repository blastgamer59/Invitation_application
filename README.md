Here’s a complete and professional `README.md` file for your RSVP Party Management System project for **R. Geetavani's retirement party**:

---

````markdown
# 🎉 RSVP Party Management System - R. Geetavani's Retirement Celebration

This is a full-stack RSVP and Party Attendance Management System built using the **MERN Stack** with **Tailwind CSS** and **Vite + React**. It is developed to assist in the **retirement party of R. Geetavani**, ensuring that only invited and verified guests attend the party. The system handles RSVP registration, real-time analytics, and guest verification using QR code or manual methods.

---

## 🧠 Project Overview

This app streamlines the event process by allowing:

1. **Guests** to submit RSVP details.
2. **Admin** to track all analytics and attendee information.
3. **Staff** to verify guests at the venue using QR code, phone number, or confirmation number.

> 📌 This project ensures smooth event management and avoids uninvited guests.

---

## 🛠 Tech Stack

| Layer          | Technology                                |
|----------------|--------------------------------------------|
| **Frontend**   | React.js (with Vite) + Tailwind CSS        |
| **Backend**    | Node.js + Express.js                       |
| **Database**   | MongoDB Atlas                              |
| **Authentication** | JWT-based confirmation system (no login auth) |
| **QR Code Scanning** | [jsQR](https://github.com/cozmo/jsQR) for client-side QR scanning |
| **WebSocket**  | Socket.io (for real-time updates)          |

---

## 📦 Features

### 👤 User Panel (RSVP Form)
- Submit name, phone number, meal preference (Veg/Non-Veg), and whether they plan to attend.
- Generates a **QR code** and a **4-digit confirmation number**.
- Navigates to a confirmation page showing both.

### 📊 Admin Panel (Analytics + Database View)
- View all registered guest details in a table:
  - Name, phone, confirmation number
  - Whether they are attending
  - Meal preference (Veg/Non-Veg)
  - Attendance status (Marked by staff)
- Live analytics:
  - Total registrations
  - How many plan to attend
  - How many actually attended
  - Meal preferences
  - Attendance percentage

### ✅ Staff Panel (Verification)
- Verify guest attendance by:
  - Scanning QR code (camera-based using `jsQR`)
  - Manually entering confirmation number or phone number
- Upon verification, the guest is marked as "Attended" in the database.

---

## 🔄 Real-Time Functionality
- Admin dashboard updates in **real-time** as guests register or are marked attended via **WebSocket (Socket.io)**.

---

## 🔐 JWT Confirmation Token
- A token is generated upon form submission using Node.js `crypto` and stored with expiry in the database.
- This avoids login but ensures the submission is securely tracked.



## 📅 Purpose

This app is built for **Mrs. R. Geetavani**, who is retiring from her job and hosting a special celebration. The app ensures:

✅ Verified attendees
✅ Accurate food planning (Veg/Non-Veg)
✅ No uninvited guests
✅ Smooth experience for organizers and staff

---

## 🤝 Acknowledgements

* [jsQR](https://github.com/cozmo/jsQR)
* [Recharts](https://recharts.org/)
* [Socket.io](https://socket.io/)
* Tailwind CSS team
* MongoDB Atlas

```
