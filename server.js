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

// Endpoint: Payment Check
app.post('/check_payment', (req, res) => {
  const now = Date.now();
  if (now > vehicleStatus.emiDue) vehicleStatus.paid = false;
  else vehicleStatus.paid = true;
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
    <body>
      <h1>Vehicle EMI Tracker</h1>
      <p>Payment status: <b>${vehicleStatus.paid ? '✅ Paid' : '❌ Overdue'}</b></p>
      <p>Next EMI Due: ${new Date(vehicleStatus.emiDue).toLocaleString()}</p>
      <form method="POST" action="/set_timer">
        <label>Set EMI Timer:</label><br>
        Days: <input type="number" name="days" min="0" value="0" required /><br>
        Hours: <input type="number" name="hours" min="0" max="23" value="0" required /><br>
        Minutes: <input type="number" name="minutes" min="0" max="59" value="0" required /><br>
        <button type="submit">Update</button>
      </form>
      <h3>Last Known Location:</h3>
      <div id="map" style="width:600px;height:400px;"></div>
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

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});
