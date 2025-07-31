const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const QRCode = require("qrcode");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app); 

// ✅ Replace these with your actual frontend deployment URLs
const allowedOrigins = [
  "https://invitationapplication.vercel.app",
  "https://invitationapplicationstaff.vercel.app",
  "https://invitationapplicationadmin.vercel.app"
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PATCH"],
  credentials: true // only needed if you use cookies or Authorization headers
}));
app.use(express.json()); // Ensures req.body is populated



const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // ✅ Deployed frontend URL
    methods: ["GET", "POST", "PATCH"],
  },
});
const port = 5000;



io.on("connection", (socket) => {
  console.log("Admin connected via socket:", socket.id);
});

const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Generate JWT token
function generateToken(payload, expiresIn = "1h") {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64");
  const encodedPayload = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })
  ).toString("base64");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
function verifyToken(token) {
  const [encodedHeader, encodedPayload, signature] = token.split(".");

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64");

  if (signature !== expectedSignature) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64").toString());

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const database = client.db("retirementParty");
    const rsvpCollection = database.collection("rsvps");

    // At the top of your index.js file, add this import:
    const QRCode = require("qrcode");

    // Then modify your RSVP submission endpoint to use the correct QR code generation:
    app.post("/api/rsvp", async (req, res) => {
      try {
        if (!req.body || typeof req.body !== "object") {
          return res.status(400).json({
            success: false,
            message: "Invalid or missing request body",
          });
        }

        const {
          fullName,
          phoneNumber,
          mealPreferences,
          attending,
          familyCount,
          familyMembers,
        } = req.body;

        // Basic validation for all RSVPs
        if (!fullName || !attending) {
          return res.status(400).json({
            success: false,
            message: "Full name and attendance status are required",
          });
        }

        // Additional validation for attending guests
        if (attending === "Yes") {
          if (!phoneNumber || !mealPreferences) {
            return res.status(400).json({
              success: false,
              message:
                "Phone number and meal preferences are required when attending",
            });
          }

          // Check for duplicate phone numbers only for attending guests
          const existing = await rsvpCollection.findOne({ phoneNumber });
          if (existing) {
            return res.status(400).json({
              success: false,
              message:
                "Phone number already registered. Please use a different one.",
            });
          }

          const confirmationNumber = Math.floor(
            1000 + Math.random() * 9000
          ).toString();

          // Generate QR code only for attending guests
          const qrData = {
            fullName,
            phoneNumber,
            mealPreferences: Array.isArray(mealPreferences)
              ? mealPreferences
              : [mealPreferences],
            attending,
            familyCount,
            familyMembers: familyMembers || [],
            confirmationNumber,
            timestamp: new Date().toISOString(),
          };

          const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,
            margin: 2,
            color: { dark: "#1E40AF", light: "#FFFFFF" },
          });

          const rsvpDoc = {
            fullName,
            phoneNumber,
            mealPreferences,
            attending,
            familyCount,
            familyMembers: familyMembers || [],
            confirmationNumber,
            qrCodeDataUrl,
            attended: false,
            attendedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Emit to admin before inserting
          io.emit("new-rsvp", rsvpDoc);

          const result = await rsvpCollection.insertOne(rsvpDoc);

          const token = generateToken({
            id: result.insertedId,
            confirmationNumber,
          });

          return res.status(201).json({
            success: true,
            confirmationNumber,
            token,
            qrCodeDataUrl,
          });
        } else {
          // For non-attending guests, just acknowledge the response
          const rsvpDoc = {
            fullName,
            attending: "No",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Emit to admin (optional)
          io.emit("new-rsvp", rsvpDoc);

          await rsvpCollection.insertOne(rsvpDoc);

          return res.status(200).json({
            success: true,
            message: "Thank you for your response",
          });
        }
      } catch (error) {
        console.error("Error submitting RSVP:", error);
        res.status(500).json({
          success: false,
          message: "Failed to submit RSVP",
        });
      }
    });
    // --- GET: Get RSVP by QR code data ---
    app.post("/api/rsvp/scan", async (req, res) => {
      try {
        const { qrData } = req.body;

        if (!qrData || !qrData.confirmationNumber) {
          return res.status(400).json({
            success: false,
            message: "Invalid QR code data",
          });
        }

        const rsvp = await rsvpCollection.findOne({
          confirmationNumber: qrData.confirmationNumber,
        });

        if (!rsvp) {
          return res.status(404).json({
            success: false,
            message: "RSVP not found",
          });
        }

        res.status(200).json({
          success: true,
          rsvp,
        });
      } catch (error) {
        console.error("Error scanning QR code:", error);
        res.status(500).json({
          success: false,
          message: "Failed to scan QR code",
        });
      }
    });

    // --- GET: Verify RSVP by confirmation number ---
    app.get("/api/rsvp/:confirmationNumber", async (req, res) => {
      try {
        const { confirmationNumber } = req.params;
        const rsvp = await rsvpCollection.findOne({ confirmationNumber });

        if (!rsvp) {
          return res.status(404).json({
            success: false,
            message: "RSVP not found",
          });
        }

        res.status(200).json({
          success: true,
          rsvp,
        });
      } catch (error) {
        console.error("Error fetching RSVP:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch RSVP",
        });
      }
    });

    // --- GET: Search RSVP by phone number ---
    app.get("/api/rsvp", async (req, res) => {
      try {
        const { phoneNumber } = req.query;

        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: "Phone number is required",
          });
        }

        const rsvp = await rsvpCollection.findOne({ phoneNumber });

        if (!rsvp) {
          return res.status(404).json({
            success: false,
            message: "Phone number is not registered",
          });
        }

        res.status(200).json({
          success: true,
          rsvp,
        });
      } catch (error) {
        console.error("Error fetching RSVP by phone:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch RSVP",
        });
      }
    });

    // --- GET: Get all RSVPs (for admin panel) ---
    app.get("/api/rsvps", async (req, res) => {
      try {
        const rsvps = await rsvpCollection.find({}).toArray();

        res.status(200).json({
          success: true,
          data: rsvps,
        });
      } catch (error) {
        console.error("Error fetching RSVPs:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch RSVPs",
        });
      }
    });

    app.patch("/api/rsvp/:id/attended", async (req, res) => {
      try {
        const { id } = req.params;

        // Check if the ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid ID format",
          });
        }

        // Check if RSVP exists
        const existingRsvp = await rsvpCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!existingRsvp) {
          return res.status(404).json({
            success: false,
            message: "RSVP not found",
          });
        }

        // Check if already marked as attended
        if (existingRsvp.attended) {
          return res.status(400).json({
            success: false,
            message: "Already marked as attended",
          });
        }

        // Check if the person is actually attending
        if (existingRsvp.attending !== "Yes") {
          return res.status(400).json({
            success: false,
            message:
              "Cannot mark as attended - person is not attending the event",
          });
        }

        const attendedAt = new Date();

        const result = await rsvpCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              attended: true,
              attendedAt,
              updatedAt: new Date(),
            },
          }
        );

        if (result.modifiedCount === 0) {
          return res.status(500).json({
            success: false,
            message: "Failed to update attendance status",
          });
        }

        // ✅ Emit real-time update to Admin Panel
        io.emit("rsvp-attended", {
          id,
          attendedAt,
        });

        res.status(200).json({
          success: true,
          message: "Successfully marked as attended",
        });
      } catch (error) {
        console.error("Error marking as attended:", error);
        res.status(500).json({
          success: false,
          message: "Failed to mark as attended",
        });
      }
    });

    // --- GET: Get attendance statistics ---
    app.get("/api/stats", async (req, res) => {
      try {
        const totalRsvps = await rsvpCollection.countDocuments({});
        const attending = await rsvpCollection.countDocuments({
          attending: "Yes",
        });
        const attended = await rsvpCollection.countDocuments({
          attended: true,
        });
        const vegCount = await rsvpCollection.countDocuments({
          mealPreferences: { $in: ["Veg"] },
          attending: "Yes",
        });
        const nonVegCount = await rsvpCollection.countDocuments({
          mealPreferences: { $in: ["Non-Veg"] },
          attending: "Yes",
        });

        res.status(200).json({
          success: true,
          stats: {
            totalRsvps,
            attending,
            attended,
            vegCount,
            nonVegCount,
          },
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch statistics",
        });
      }
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Invitation app is working");
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
