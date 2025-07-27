// server.js
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

// Payment Check Endpoint
app.post('/check_payment', (req, res) => {
  const now = Date.now();
  vehicleStatus.paid = now <= vehicleStatus.emiDue;
  res.json({ paid: vehicleStatus.paid ? 1 : 0 });
});

// Location Update Endpoint
app.post('/update_loc', (req, res) => {
  const { lat, lon } = req.body;
  if (!isNaN(lat) && !isNaN(lon)) {
    vehicleStatus.lat = parseFloat(lat);
    vehicleStatus.lon = parseFloat(lon);
    vehicleStatus.lastSeen = new Date();
  }
  res.send('OK');
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

// API Endpoint to get vehicle status for frontend
app.get('/api/vehicle_status', (req, res) => {
  res.json({
    paid: vehicleStatus.paid,
    lat: vehicleStatus.lat,
    lon: vehicleStatus.lon,
    lastSeen: vehicleStatus.lastSeen
  });
});

// Dashboard UI
app.get('/', (req, res) => {
  res.send(`
  <html>
    <head>
      <title>Vehicle EMI Tracker</title>
      <meta http-equiv="refresh" content="15">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        h1 { color: #333; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Vehicle EMI Tracker</h1>
        <p>Payment status: <b>${vehicleStatus.paid ? '✅ Paid' : '❌ Overdue'}</b></p>
        <p>Next EMI Due: ${new Date(vehicleStatus.emiDue).toLocaleString()}</p>
        <form method="POST" action="/set_timer">
          <label>Set EMI Timer:</label><br>
          Days: <input type="number" name="days" min="0" value="0" required />
          Hours: <input type="number" name="hours" min="0" max="23" value="0" required />
          Minutes: <input type="number" name="minutes" min="0" max="59" value="0" required />
          <button type="submit">Update</button>
        </form>
      </div>

      <div class="card">
        <h3>Last Known Location:</h3>
        <p>Updated: ${vehicleStatus.lastSeen ? new Date(vehicleStatus.lastSeen).toLocaleString() : 'Not available'}</p>
        <div id="map" style="width:100%;height:400px;"></div>
      </div>

      <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY"></script>
      <script>
        fetch('/api/vehicle_status')
          .then(res => res.json())
          .then(data => {
            const loc = { lat: data.lat, lng: data.lon };
            const map = new google.maps.Map(document.getElementById('map'), {
              zoom: 15,
              center: loc
            });
            new google.maps.Marker({ position: loc, map: map });
          });
      </script>
    </body>
  </html>
  `);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});
