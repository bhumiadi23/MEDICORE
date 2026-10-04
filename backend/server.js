const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'shipments.db'), (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS shipment_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipmentId TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incidentId TEXT UNIQUE,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        shipmentId TEXT,
        batchId TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS qr_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipmentId TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.post('/api/shipments/:shipmentId/location', (req, res) => {
    const { shipmentId } = req.params;
    const { lat, lng } = req.body;
    db.run(`INSERT INTO shipment_locations (shipmentId, lat, lng) VALUES (?, ?, ?)`, [shipmentId, lat, lng], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
    });
});

app.get('/api/shipments/:shipmentId/location/latest', (req, res) => {
    const { shipmentId } = req.params;
    db.get(`SELECT lat, lng, timestamp FROM shipment_locations WHERE shipmentId = ? ORDER BY timestamp DESC LIMIT 1`, [shipmentId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

// Incidents API
app.get('/api/incidents', (req, res) => {
    db.all(`SELECT * FROM incidents ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/incidents', (req, res) => {
    const { type, severity, shipmentId, batchId, message } = req.body;
    const incidentId = 'INC-' + Date.now();
    db.run(
        `INSERT INTO incidents (incidentId, type, severity, shipmentId, batchId, message) VALUES (?, ?, ?, ?, ?, ?)`,
        [incidentId, type, severity, shipmentId, batchId, message],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, incidentId });
        }
    );
});

// QR Scans API
app.post('/api/shipments/:shipmentId/scan', (req, res) => {
    const { shipmentId } = req.params;
    const { success, reason } = req.body;
    
    db.run(`INSERT INTO qr_scans (shipmentId, success, reason) VALUES (?, ?, ?)`, [shipmentId, success ? 1 : 0, reason], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Anti-Diversion Check: Repeated failed scans
        if (!success) {
            db.get(`SELECT COUNT(*) as count FROM qr_scans WHERE shipmentId = ? AND success = 0`, [shipmentId], (err, row) => {
                if (!err && row && row.count >= 3) {
                    // Generate an anomaly incident
                    const incidentId = 'INC-' + Date.now();
                    db.run(
                        `INSERT INTO incidents (incidentId, type, severity, shipmentId, message) VALUES (?, ?, ?, ?, ?)`,
                        [incidentId, 'SUSPICIOUS_QR', 'HIGH', shipmentId, 'Repeated failed verification attempts detected']
                    );
                }
            });
        }
        res.json({ id: this.lastID });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
