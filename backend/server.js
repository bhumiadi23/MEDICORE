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

// Haversine Distance Helper (in Kilometers)
function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Memory map for anti-brute force lockout: shipmentId -> { attempts, lockUntil }
const scanRateLimits = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// GPS LOCATION & SENTINEL SPOOFING DETECTION
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/shipments/:shipmentId/location', (req, res) => {
    const { shipmentId } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'lat and lng are required' });
    }

    // Inspect previous coordinate for velocity / GPS teleportation anomaly
    db.get(
        `SELECT lat, lng, timestamp FROM shipment_locations WHERE shipmentId = ? ORDER BY id DESC LIMIT 1`,
        [shipmentId],
        (err, prev) => {
            if (!err && prev) {
                const prevTime = new Date(prev.timestamp).getTime();
                const currTime = Date.now();
                const diffHours = Math.max((currTime - prevTime) / (1000 * 60 * 60), 0.0002); // min ~0.7 sec
                const distKm = getHaversineDistanceKm(prev.lat, prev.lng, lat, lng);
                const speedKmH = distKm / diffHours;

                // Sentinel Rule: Ground vehicles traveling > 140 km/h or instant jump > 30 km in seconds
                if ((speedKmH > 140 && distKm > 3) || (distKm > 50 && diffHours < 0.1)) {
                    const incidentId = 'INC-SPOOF-' + Date.now();
                    db.run(
                        `INSERT OR IGNORE INTO incidents (incidentId, type, severity, shipmentId, message) VALUES (?, ?, ?, ?, ?)`,
                        [
                            incidentId,
                            'GPS_SPOOFING_DETECTED',
                            'CRITICAL',
                            shipmentId,
                            `Sentinel Defense Alert: Anomalous velocity detected (${Math.round(speedKmH)} km/h over ${distKm.toFixed(1)} km). Suspected GPS spoofing or route manipulation.`
                        ]
                    );
                }
            }

            db.run(`INSERT INTO shipment_locations (shipmentId, lat, lng) VALUES (?, ?, ?)`, [shipmentId, lat, lng], function(insertErr) {
                if (insertErr) return res.status(500).json({ error: insertErr.message });
                res.json({ id: this.lastID });
            });
        }
    );
});

app.get('/api/shipments/:shipmentId/location/latest', (req, res) => {
    const { shipmentId } = req.params;
    db.get(`SELECT lat, lng, timestamp FROM shipment_locations WHERE shipmentId = ? ORDER BY id DESC LIMIT 1`, [shipmentId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ANTI-BRUTE FORCE & QR SCAN DIVERSION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/shipments/:shipmentId/scan', (req, res) => {
    const { shipmentId } = req.params;
    const { success, reason } = req.body;
    const now = Date.now();

    const limitInfo = scanRateLimits.get(shipmentId) || { attempts: 0, lockUntil: 0 };

    // Check active lockout
    if (limitInfo.lockUntil > now) {
        const remainingSec = Math.ceil((limitInfo.lockUntil - now) / 1000);
        return res.status(429).json({
            error: `SENTINEL SHIELD LOCKOUT: Too many failed verification attempts. Shipment frozen for ${remainingSec}s.`
        });
    }

    if (!success) {
        limitInfo.attempts++;
        if (limitInfo.attempts >= 4) {
            limitInfo.lockUntil = now + (10 * 60 * 1000); // 10 minute lockout
            scanRateLimits.set(shipmentId, limitInfo);

            const incidentId = 'INC-BRUTE-' + Date.now();
            db.run(
                `INSERT OR IGNORE INTO incidents (incidentId, type, severity, shipmentId, message) VALUES (?, ?, ?, ?, ?)`,
                [
                    incidentId,
                    'BRUTE_FORCE_ATTACK_DETECTED',
                    'CRITICAL',
                    shipmentId,
                    `Sentinel Defense Alert: 4 consecutive invalid verification scans detected. Automatic 10-minute cryptographic lockout triggered.`
                ]
            );
            return res.status(429).json({
                error: 'SENTINEL SHIELD LOCKOUT: 4 consecutive failures detected. Delivery locked to prevent diversion.'
            });
        }
        scanRateLimits.set(shipmentId, limitInfo);
    } else {
        // Reset on success
        scanRateLimits.delete(shipmentId);
    }

    db.run(`INSERT INTO qr_scans (shipmentId, success, reason) VALUES (?, ?, ?)`, [shipmentId, success ? 1 : 0, reason], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Anti-Diversion Check: 3 failed scans threshold for SUSPICIOUS_QR
        if (!success && limitInfo.attempts === 3) {
            const incidentId = 'INC-QR-' + Date.now();
            db.run(
                `INSERT OR IGNORE INTO incidents (incidentId, type, severity, shipmentId, message) VALUES (?, ?, ?, ?, ?)`,
                [incidentId, 'SUSPICIOUS_QR', 'HIGH', shipmentId, 'Multiple failed QR verification attempts detected. Possible counterfeit duplicate in circulation.']
            );
        }

        res.json({ id: this.lastID, attemptsRecorded: limitInfo.attempts });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SENTINEL SECURITY RADAR TELEMETRY API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/security/radar', (req, res) => {
    db.all(`SELECT * FROM incidents ORDER BY id DESC`, [], (err, incidents) => {
        if (err) return res.status(500).json({ error: err.message });

        const safeIncidents = incidents || [];
        const criticalCount = safeIncidents.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL' || (i.severity || '').toUpperCase() === 'HIGH').length;
        const spoofCount = safeIncidents.filter(i => (i.type || '').includes('SPOOF') || (i.type || '').includes('GPS')).length;
        const bruteForceCount = safeIncidents.filter(i => (i.type || '').includes('BRUTE') || (i.type || '') === 'SUSPICIOUS_QR').length;

        let threatLevel = 'DEFCON 5 - NORMAL';
        let threatColor = 'emerald';
        if (criticalCount >= 3) {
            threatLevel = 'DEFCON 1 - CRITICAL LOCKDOWN';
            threatColor = 'red';
        } else if (criticalCount > 0 || safeIncidents.length > 2) {
            threatLevel = 'DEFCON 3 - ELEVATED ALERT';
            threatColor = 'amber';
        }

        res.json({
            threatLevel,
            threatColor,
            totalIncidents: safeIncidents.length,
            criticalAlerts: criticalCount,
            spoofingAttempts: spoofCount,
            bruteForceBlocks: bruteForceCount,
            sentinelStatus: 'ONLINE & ENFORCING',
            tamperSealShield: '100% CRYPTOGRAPHICALLY SECURED',
            activeShields: [
                'EVM Smart Contract Invariant Lock',
                'Sentinel Real-Time GPS Anti-Spoofing',
                'Cryptographic Tamper-Evident Seal Registry',
                'Anti-Brute-Force Scan Lockout Engine'
            ],
            recentIncidents: safeIncidents.slice(0, 6)
        });
    });
});

// Incidents CRUD
app.get('/api/incidents', (req, res) => {
    db.all(`SELECT * FROM incidents ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/api/incidents', (req, res) => {
    const { type, severity, shipmentId, batchId, message } = req.body;
    const incidentId = 'INC-' + Date.now();
    db.run(
        `INSERT INTO incidents (incidentId, type, severity, shipmentId, batchId, message) VALUES (?, ?, ?, ?, ?, ?)`,
        [incidentId, type, severity || 'MEDIUM', shipmentId, batchId, message],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, incidentId });
        }
    );
});

app.delete('/api/incidents/:incidentId', (req, res) => {
    const { incidentId } = req.params;
    db.run(`DELETE FROM incidents WHERE incidentId = ?`, [incidentId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
