// Backend code: server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Kết nối tới SQLite database
const db = new sqlite3.Database("./dictionary.db", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
    db.run(
      `CREATE TABLE IF NOT EXISTS dictionary (id INTEGER PRIMARY KEY, word TEXT, meaning TEXT)`,
      (err) => {
        if (err) console.error("Error creating table", err);
      }
    );
  }
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files for frontend

// API để lấy danh sách từ điển
app.get("/api/dictionary", (req, res) => {
  db.all("SELECT word, meaning FROM dictionary", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API để thêm từ mới
app.post("/api/dictionary", (req, res) => {
  const { word, meaning } = req.body;
  db.run(
    "INSERT INTO dictionary (word, meaning) VALUES (?, ?)",
    [word, meaning],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        broadcastUpdate();
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// Phát tín hiệu cập nhật qua WebSocket
function broadcastUpdate() {
  db.all("SELECT word, meaning FROM dictionary", [], (err, rows) => {
    if (err) {
      console.error("Error broadcasting updates", err);
    } else {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "update", data: rows }));
        }
      });
    }
  });
}

// Kết nối WebSocket
wss.on("connection", (ws) => {
  console.log("Client connected");
  db.all("SELECT word, meaning FROM dictionary", [], (err, rows) => {
    if (!err) {
      ws.send(JSON.stringify({ type: "init", data: rows }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
