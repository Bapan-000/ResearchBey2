const express = require('express');
const cors = require('cors');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

const csvPath = path.join(__dirname, 'submissions.csv');
const fileExists = fs.existsSync(csvPath);

const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
        {id: 'businessName', title: 'Business Name'},
        {id: 'audienceType', title: 'Audience Type'},
        {id: 'domain', title: 'Domain'},
        {id: 'niche', title: 'Niche'},
        {id: 'locality', title: 'Locality'},
        {id: 'priceMin', title: 'Price Min'},
        {id: 'priceMax', title: 'Price Max'},
        {id: 'quality', title: 'Quality'}
    ],
    append: fileExists
});

// Write header explicitly if creating file for the first time
if (!fileExists) {
    csvWriter.writeRecords([]); // Triggers immediate header write
}

app.post('/api/submit', async (req, res) => {
    try {
        const payload = req.body;
        console.log('Received payload:', payload);
        
        await csvWriter.writeRecords([payload]);
        res.status(200).json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`CSV entries will be appended to: ${csvPath}`);
});
