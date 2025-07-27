const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

let vehicleStatus = {
  paid: true,
  emiDue: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  lat: 12.9716,
  lon: 77.5946,
  lastSeen: null
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send(`
  <html>
    <head>
      <title>Vehicle EMI Tracker</title>
      <meta http-equiv="refresh" content="15">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    </head>
    <body>
      <h1>Vehicle EMI Tracker</h1>
      <p>Payment status: <b>${vehicleStatus.paid ? '✅ Paid' : '❌ Overdue'}</b></p>
      <p>Next EMI Due: ${new Date(vehicleStatus.emiDue).toLocaleString()}</p>
      <p>Last GPS Update: ${vehicleStatus.lastSeen ? new Date(vehicleStatus.lastSeen).toLocaleString() : 'Not available'}</p>

      <form method="POST" action="/set_timer">
        <h3>Set EMI Timer:</h3>
        Days: <input type="number" name="days" min="0" value="0" required /><br>
        Hours: <input type="number" name="hours" min="0" max="23" value="0" required /><br>
        Minutes: <input type="number" name="minutes" min="0" max="59" value="0" required /><br>
        <button type="submit">Update</button>
      </form>

      <form method="POST" action="/mark_paid">
        <button type="submit">Mark EMI as Paid</button>
      </form>

      <h3>Last Known Location:</h3>
      <div id="map" style="width:600px;height:400px;"></div>

      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const lat = ${vehicleStatus.lat};
        const lon = ${vehicleStatus.lon};
        const map = L.map('map').setView([lat, lon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        L.marker([lat, lon]).addTo(map)
          .bindPopup('Vehicle Location')
          .openPopup();
      </script>
    </body>
  </html>
  `);
});

app.post('/set_timer', (req, res) => {
  const { days, hours, minutes } = req.body;
  const totalMillis = (parseInt(days) * 24 * 60 + parseInt(hours) * 60 + parseInt(minutes)) * 60000;
  vehicleStatus.emiDue = new Date(Date.now() + totalMillis).toISOString();
  vehicleStatus.paid = true;
  res.redirect('/');
});

app.post('/mark_paid', (req, res) => {
  vehicleStatus.paid = true;
  res.redirect('/');
});

app.post('/update_location', (req, res) => {
  const { lat, lon } = req.body;
  vehicleStatus.lat = parseFloat(lat);
  vehicleStatus.lon = parseFloat(lon);
  vehicleStatus.lastSeen = new Date().toISOString();
  res.sendStatus(200);
});

app.post('/check_payment', (req, res) => {
  const now = new Date();
  const due = new Date(vehicleStatus.emiDue);
  if (now > due) {
    vehicleStatus.paid = false;
  }
  res.json({ paid: vehicleStatus.paid });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
