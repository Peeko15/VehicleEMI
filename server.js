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

app.post('/check_payment', (req, res) => {
  const now = Date.now();
  vehicleStatus.paid = now <= vehicleStatus.emiDue;
  res.json({ paid: vehicleStatus.paid ? 1 : 0 });
});

app.post('/update_loc', (req, res) => {
  const { lat, lon } = req.body;
  vehicleStatus.lat = parseFloat(lat);
  vehicleStatus.lon = parseFloat(lon);
  vehicleStatus.lastSeen = new Date();
  res.send('OK');
});

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

app.get('/', (req, res) => {
  const emiDueFormatted = new Date(vehicleStatus.emiDue).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const lastSeenFormatted = vehicleStatus.lastSeen
    ? new Date(vehicleStatus.lastSeen).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Not available';

  res.send(`
  <html>
    <head>
      <meta http-equiv="refresh" content="15" />
      <title>Vehicle EMI Tracker</title>
      <style>
        body { font-family: sans-serif; margin: 20px; background: #f7f7f7; color: #333; }
        h1 { color: #2c3e50; }
        label, input { margin: 5px 0; }
        form { margin-top: 15px; padding: 10px; background: #fff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        #map { margin-top: 15px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>🚗 Vehicle EMI Tracker</h1>
      <p><strong>Payment Status:</strong> ${vehicleStatus.paid ? '✅ Paid' : '❌ Overdue'}</p>
      <p><strong>Next EMI Due:</strong> ${emiDueFormatted}</p>
      <p><strong>Last GPS Update:</strong> ${lastSeenFormatted}</p>
      <form method="POST" action="/set_timer">
        <label>Set New EMI Timer:</label><br>
        Days: <input type="number" name="days" min="0" value="0" required />
        Hours: <input type="number" name="hours" min="0" max="23" value="0" required />
        Minutes: <input type="number" name="minutes" min="0" max="59" value="0" required />
        <button type="submit">Update</button>
      </form>
      <h3>🗺️ Live Location</h3>
      <div id="map" style="width:600px;height:400px;"></div>
      <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
      <script>
        const loc = { lat: ${vehicleStatus.lat}, lng: ${vehicleStatus.lon} };
        const map = new google.maps.Map(document.getElementById('map'), { zoom: 14, center: loc });
        new google.maps.Marker({ position: loc, map: map });
      </script>
    </body>
  </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
