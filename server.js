// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
process.env.TZ = "Asia/Kolkata";

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

let vehicleStatus = {
  paid: true,
  lat: 0,
  lon: 0,
  lastSeen: null,
  emiDue: Date.now() + 7 * 24 * 60 * 60 * 1000 // Default 7 days
};

// Endpoint: Payment Check
app.post('/check_payment', (req, res) => {
  const now = Date.now();
  vehicleStatus.paid = now <= vehicleStatus.emiDue;
  res.json({ paid: vehicleStatus.paid ? 1 : 0 });
});

// Endpoint: Location Update
app.post('/update_loc', (req, res) => {
  const { lat, lon } = req.body;
  vehicleStatus.lat = parseFloat(lat);
  vehicleStatus.lon = parseFloat(lon);
  vehicleStatus.lastSeen = new Date();
  res.send('OK');
});

// Dashboard UI
app.get('/', (req, res) => {
  res.send(`
  <html>
    <head>
      <title>Vehicle EMI Tracker</title>
      <meta http-equiv="refresh" content="5">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f0f4f8; padding: 20px; color: #333; }
        h1 { color: #2a7ae2; }
        label, input, button { margin: 5px 0; }
        input { padding: 5px; }
        button { padding: 6px 12px; background-color: #2a7ae2; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #1c5bbf; }
        .section { margin-bottom: 20px; }
        #map { width: 100%; height: 400px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>Vehicle EMI Tracker</h1>
      <div class="section">
        <p><strong>Payment status:</strong> ${vehicleStatus.paid ? '✅ Paid' : '❌ Overdue'}</p>
        <p><strong>Next EMI Due:</strong> ${new Date(vehicleStatus.emiDue).toLocaleString()}</p>
      </div>

      <div class="section">
        <form method="POST" action="/set_timer">
          <h3>Set EMI Timer:</h3>
          Days: <input type="number" name="days" min="0" value="0" required /><br>
          Hours: <input type="number" name="hours" min="0" max="23" value="0" required /><br>
          Minutes: <input type="number" name="minutes" min="0" max="59" value="0" required /><br>
          <button type="submit">Update Timer</button>
        </form>
        ${!vehicleStatus.paid ? `<form method="POST" action="/mark_paid" style="margin-top:10px;"><button type="submit">Mark EMI as Paid ✅</button></form>` : ''}
      </div>

      <div class="section">
        <h3>GPS Location (NEO-7M):</h3>
        <p><strong>Latitude:</strong> ${vehicleStatus.lat}</p>
        <p><strong>Longitude:</strong> ${vehicleStatus.lon}</p>
        <p><strong>Last Seen:</strong> ${vehicleStatus.lastSeen ? new Date(vehicleStatus.lastSeen).toLocaleString() : 'N/A'}</p>
        <div id="map"></div>
      </div>

      <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY"></script>
      <script>
        const loc = { lat: ${vehicleStatus.lat}, lng: ${vehicleStatus.lon} };
        const map = new google.maps.Map(document.getElementById('map'), { zoom: 14, center: loc });
        new google.maps.Marker({ position: loc, map: map });
      </script>
    </body>
  </html>
  `);
});

// Timer Update Endpoint
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

// EMI Manual Marking Endpoint
app.post('/mark_paid', (req, res) => {
  vehicleStatus.paid = true;
  vehicleStatus.emiDue = Date.now() + 7 * 24 * 60 * 60 * 1000; // reset another 7 days
  res.redirect('/');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});
