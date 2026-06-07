import express from "express";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import { exec } from "child_process";
import fs from "fs";
import { writeFileSync } from "fs";
import path from "path";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();

// Async function to start server
async function startServer() {
  try {
    // Connect to database first
    await connectDB();
    console.log("MongoDB connected successfully");

    const PORT = process.env.PORT || 5000;

    // to parse req body
    app.use(express.json());
    app.use(
      cors({
        origin: [
          "https://ai-proctored-system.vercel.app",
          "http://localhost:3000",
          "http://localhost:3001",
          `http://localhost:${PORT}`,
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.post("/run-python", (req, res) => {
      const { code } = req.body; // Get Python code from request body
      
      if (!code) {
        return res.status(400).send("Error: No code provided");
      }
      
      const fileName = `script_${uuidv4()}.py`;
      writeFileSync(fileName, code); // Write code to unique file

      exec(`python ${fileName}`, { timeout: 10000 }, (error, stdout, stderr) => {
        // Delete file after execution
        fs.unlink(fileName, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });

        if (error) {
          res.send(`Error is: ${stderr || error.message}`); // Send error message if any
        } else {
          res.send(stdout); // Send output of the Python script
        }
      });
    });

    app.post("/run-javascript", (req, res) => {
      const { code } = req.body; // Get JavaScript code from request body
      
      if (!code) {
        return res.status(400).send("Error: No code provided");
      }
      
      const fileName = `script_${uuidv4()}.js`;
      writeFileSync(fileName, code); // Write code to unique file

      exec(`node ${fileName}`, { timeout: 10000 }, (error, stdout, stderr) => {
        // Delete file after execution
        fs.unlink(fileName, (err) => {
          if (err) console.error("Error deleting temp file:", err);
        });

        if (error) {
          res.send(`Error: ${stderr || error.message}`); // Send error message if any
        } else {
          res.send(stdout); // Send output of the JavaScript code
        }
      });
    });

    app.post("/run-java", (req, res) => {
      const { code } = req.body; // Get Java code from request body
      
      if (!code) {
        return res.status(400).send("Error: No code provided");
      }
      
      const className = `Main_${uuidv4().replace(/-/g, '_')}`;
      const fileName = `${className}.java`;
      // Replace Main class name in code with unique name
      const modifiedCode = code.replace(/class\s+Main\b/g, `class ${className}`);
      writeFileSync(fileName, modifiedCode); 

      const command = `javac ${fileName} && java ${className}`;
      
      exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
        // Delete files after execution
        fs.unlink(fileName, () => {});
        fs.unlink(`${className}.class`, () => {});

        if (error) {
          res.send(`Error: ${stderr || error.message}`); // Send error message if any
        } else {
          res.send(stdout); // Send output of the Java program
        }
      });
    });

    // Routes
    app.use("/api/users", userRoutes);
    app.use("/api/users", examRoutes);
    app.use("/api/users", resultRoutes);
    app.use("/api/coding", codingRoutes);

    // we we are deploying this in production
    // make frontend build then
    if (process.env.NODE_ENV === "production") {
      const __dirname = path.resolve();
      // we making front build folder static to serve from this app
      app.use(express.static(path.join(__dirname, "/frontend/build")));

      // if we get an routes that are not define by us we show then index html file
      // every enpoint that is not api/users go to this index file
      app.get("*", (req, res) =>
        res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"))
      );
    } else {
      app.get("/", (req, res) => {
        res.send("<h1>server is running </h1>");
      });
    }

    // Error handling middleware - must be after all routes
    app.use(notFound);
    app.use(errorHandler);

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is already in use. Stop the existing process or set the PORT environment variable to a free port.`,
        );
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
