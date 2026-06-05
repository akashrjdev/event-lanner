const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// ✅ Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/eventDB");

// ✅ Define Event Schema
const eventSchema = new mongoose.Schema({
  title: String,
  date: Date, // MongoDB stores as ISODate
});

const Event = mongoose.model("Event", eventSchema);

// ✅ Serve HTML frontend directly
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Event Planner</title>
</head>
<body>
  <h2>📅 Event Planner</h2>

  <form id="eventForm">
    <input type="text" id="title" placeholder="Event Title" required>
    <input type="date" id="date" required>
    <input type="time" id="time" required>
    <button type="submit">Add Event</button>
  </form>

  <h3>Events</h3>
  <ul id="eventList"></ul>

  <script>
    const API_URL = "/events";

    async function loadEvents() {
      const res = await fetch(API_URL);
      const events = await res.json();
      const list = document.getElementById("eventList");
      list.innerHTML = "";
      events.forEach(ev => {
        const li = document.createElement("li");
        const eventDate = new Date(ev.date);
        li.textContent = \`\${ev.title} - \${eventDate.toLocaleString()}\`;
        
        // Delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.onclick = async () => {
          await fetch(\`\${API_URL}/\${ev._id}\`, { method: "DELETE" });
          loadEvents();
        };

        li.appendChild(delBtn);
        list.appendChild(li);
      });
    }

    document.getElementById("eventForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value;
      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;

      // Combine date + time into ISO format
      const isoDate = new Date(\`\${date}T\${time}:00\`);

      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date: isoDate })
      });

      e.target.reset();
      loadEvents();
    });

    loadEvents();
  </script>
</body>
</html>
  `);
});

// ✅ CRUD Routes

// Create Event
app.post("/events", async (req, res) => {
  const { title, date } = req.body;
  const event = new Event({ title, date });
  await event.save();
  res.json(event);
});

// Read Events
app.get("/events", async (req, res) => {
  const events = await Event.find().sort({ date: 1 });
  res.json(events);
});

// Update Event
app.put("/events/:id", async (req, res) => {
  const { title, date } = req.body;
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { title, date },
    { new: true }
  );
  res.json(event);
});

// Delete Event
app.delete("/events/:id", async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: "Event deleted" });
});

// ✅ Start Server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
