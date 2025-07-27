const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

let vehicleStatus = {
  paid: true,
  lat: 0,
  lon: 0,
  lastSeen: null,
  emiDue: Date.now() + 7 * 24 * 60 * 60 * 1000 // Default 7 days
};

// Endpoint: Check Payment
app.post('/check_payment', (req, res) => {
  const now = Date.now();
  vehicleStatus.paid = now <= vehicleStatus.emiDue;
  res.json({ paid: vehicleStatus.paid ? 1 : 0 });
});

// Endpoint: Update GPS location
app.post('/update_loc', (req, res) => {
  const { lat, lon } = req.body;
  vehicleStatus.lat = parseFloat(lat);
  vehicleStatus.lon = parseFloat(lon);
  vehicleStatus.lastSeen = new Date();
  res.send('OK');
});

// Update EMI timer
app.post('/set_timer', (req, res) => {
  const days = parseInt(req.body.days);
  const hours = parseInt(req.body.hours);
  const minutes = parseInt(req.body.minutes);
  if (!isNaN(days) && !isNaN(hours) && !isNaN(minutes)) {
    const totalMillis = (days * 24 * 60 + hours * 60 + minutes) * 60 * 1000;
    vehicleStatus.emiDue = Date.now() + totalMillis;
  }
  res.redirect('/');
});

// Mark EMI as paid manually
app.post('/mark_paid', (req, res) => {
  vehicleStatus.paid = true;
  res.redirect('/');
});

// Dashboard UI
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Vehicle EMI Tracker</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>
        <meta http-equiv="refresh" content="30">
        <style>
          body { font-family: Arial; padding: 20px; }
          #map { width: 100%; height: 400px; margin-top: 20px; }
          .paid { color: green; font-weight: bold; }
          .overdue { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>🚗 Vehicle EMI Tracker</h1>
        <p>Status: 
          <span class="${vehicleStatus.paid ? 'paid' : 'overdue'}">
            ${vehicleStatus.paid ? '✅ Paid' : '❌ Overdue'}
          </span>
        </p>
        <p><b>Next EMI Due:</b> ${new Date(vehicleStatus.emiDue).toLocaleString()}</p>
        <form method="POST" action="/set_timer">
          <h3>⏱️ Set EMI Timer:</h3>
          Days: <input type="number" name="days" min="0" value="0" required />
          Hours: <input type="number" name="hours" min="0" max="23" value="0" required />
          Minutes: <input type="number" name="minutes" min="0" max="59" value="0" required />
          <button type="submit">Update Timer</button>
        </form>
        <br>
        <form method="POST" action="/mark_paid">
          <button type="submit" style="color: white; background-color: green;">Mark as Paid ✅</button>
        </form>

        <h3>📍 Last Known Location:</h3>
        <p>Last Seen: ${vehicleStatus.lastSeen ? vehicleStatus.lastSeen.toLocaleString() : 'Never'}</p>
        <div id="map"></div>

        <script>
          const map = L.map('map').setView([${vehicleStatus.lat}, ${vehicleStatus.lon}], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          L.marker([${vehicleStatus.lat}, ${vehicleStatus.lon}])
            .addTo(map)
            .bindPopup('Vehicle Location')
            .openPopup();
        </script>
      </body>
    </html>
  `);
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
