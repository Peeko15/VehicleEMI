// server.js (No database, in-memory multi-vehicle tracker with IST time display)
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// In-memory data store
let vehicles = [
  {
    id: 'v1',
    reg: 'KA01AB1234',
    vin: 'MHX1234567ABCDEF1',
    user: 'Karan K',
    paid: true,
    emiDue: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    lat: 12.9716,
    lon: 77.5946,
    lastSeen: null,
  },
  {
    id: 'v2',
    reg: 'KA02CD5678',
    vin: 'MHX9876543ZXYTUU9',
    user: 'Bob Singh',
    paid: false,
    emiDue: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (overdue)
    lat: 13.0057,
    lon: 77.5706,
    lastSeen: null,
  },
];

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve dashboard - multi-vehicle with maps and controls displayed in IST
app.get('/', (req, res) => {
  const vehicleCards = vehicles.map((v, idx) => `
    <div class="card mb-4 shadow">
      <div class="card-header bg-${v.paid ? 'success' : 'danger'} text-white">
        <b>${v.reg}</b> (${v.user}) - VIN: ${v.vin}
      </div>
      <div class="card-body">
        <p><b>EMI Status:</b> ${v.paid ? '✅ Paid' : '❌ Overdue'}</p>
        <p><b>Next EMI Due:</b> ${new Date(v.emiDue).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        <p><b>Last Seen:</b> ${v.lastSeen ? new Date(v.lastSeen).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Not available'}</p>
        <div id="map${idx}" style="height:200px;"></div>
        <form class="mt-2" method="POST" action="/set_timer">
          <input type="hidden" name="id" value="${v.id}" />
          <label>EMI Timer: </label>
          <input type="number" name="days" min="0" max="365" value="0" style="width:60px;" required />d
          <input type="number" name="hours" min="0" max="23" value="0" style="width:60px;" required />h
          <input type="number" name="minutes" min="0" max="59" value="0" style="width:60px;" required />m
          <button class="btn btn-sm btn-outline-primary ml-2" type="submit">Update</button>
        </form>
        ${!v.paid ? `
        <form class="mt-2" method="POST" action="/mark_paid">
          <input type="hidden" name="id" value="${v.id}" />
          <button class="btn btn-sm btn-success" type="submit">Mark EMI as Paid</button>
        </form>
        ` : ''}
      </div>
    </div>
  `).join('');

  res.send(`
    <html>
      <head>
        <title>Multi-Vehicle EMI Tracker</title>
        <meta http-equiv="refresh" content="15" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <style>
          body { background-color: #f9fafd; }
          .card { margin-bottom: 2rem; }
        </style>
      </head>
      <body>
        <div class="container mt-4">
          <h1 class="mb-4">🚗 Multi-Vehicle EMI Tracker</h1>
          <div class="row">
            <div class="col">
              ${vehicleCards}
            </div>
          </div>
        </div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          ${vehicles.map((v, idx) => `
            const map${idx} = L.map("map${idx}").setView([${v.lat}, ${v.lon}], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map${idx});
            L.marker([${v.lat}, ${v.lon}])
              .addTo(map${idx})
              .bindPopup("${v.reg} location")
              .openPopup();
          `).join('')}
        </script>
      </body>
    </html>
  `);
});

// Set EMI timer for a vehicle
app.post('/set_timer', (req, res) => {
  const { id, days, hours, minutes } = req.body;
  const vehicle = vehicles.find((v) => v.id === id);
  if (vehicle) {
    const totalMillis = (parseInt(days) * 24 * 60 + parseInt(hours) * 60 + parseInt(minutes)) * 60000;
    vehicle.emiDue = new Date(Date.now() + totalMillis).toISOString();
    vehicle.paid = true;
  }
  res.redirect('/');
});

// Mark EMI as paid
app.post('/mark_paid', (req, res) => {
  const { id } = req.body;
  const vehicle = vehicles.find((v) => v.id === id);
  if (vehicle) {
    vehicle.paid = true;
  }
  res.redirect('/');
});

// ESP32 posts updated location
app.post('/update_location', (req, res) => {
  const { id, lat, lon } = req.body;
  const vehicle = vehicles.find((v) => v.id === id);
  if (vehicle) {
    vehicle.lat = parseFloat(lat);
    vehicle.lon = parseFloat(lon);
    vehicle.lastSeen = new Date().toISOString();
    res.sendStatus(200);
  } else {
    res.status(404).send('Vehicle not found');
  }
});

// ESP32 checks EMI payment status
app.post('/check_payment', (req, res) => {
  const { id } = req.body;
  const vehicle = vehicles.find((v) => v.id === id);
  if (vehicle) {
    const now = new Date();
    const due = new Date(vehicle.emiDue);
    if (now > due) {
      vehicle.paid = false;
    }
    res.json({ paid: vehicle.paid });
  } else {
    res.status(404).send('Vehicle not found');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
