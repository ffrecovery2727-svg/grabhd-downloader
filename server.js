const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve Static Frontend (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Download Extraction API Route
app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid social media video link.' 
        });
    }

    try {
        // Cobalt API Integration for Multi-platform Extraction
        const response = await axios.post('https://co.wuk.sh/api/json', {
            url: videoUrl,
            vQuality: "1080",
            isAudioOnly: false,
            isNoTTWatermark: true
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10s timeout
        });

        if (response.data && response.data.url) {
            return res.json({
                success: true,
                data: {
                    title: "GrabHD Extracted Media",
                    thumbnail: "https://via.placeholder.com/120x80/b8ef5e/111310?text=Video+Ready",
                    source: "Social Media",
                    formats: [
                        { 
                            quality: "HD Video (No Watermark)", 
                            type: "mp4", 
                            url: response.data.url 
                        }
                    ]
                }
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                error: "Failed to generate download link. Please try another link." 
            });
        }
    } catch (error) {
        console.error("Extraction Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Failed to extract video. Please ensure the link is public and valid." 
        });
    }
});

// Export app for Vercel Serverless Platform
module.exports = app;
