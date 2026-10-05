const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve Static Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Video Downloader API Route
app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid video link.' 
        });
    }

    try {
        // Backup API Method (AIO Extractor)
        const response = await axios.get(`https://api.cobalt.tools/api/json`, {
            method: 'POST',
            data: {
                url: videoUrl,
                videoQuality: "1080",
                filenamePattern: "basic"
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 12000
        }).catch(() => null);

        if (response && response.data && response.data.url) {
            return res.json({
                success: true,
                data: {
                    title: "GrabHD Extracted Video",
                    thumbnail: "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                    source: "Social Media",
                    formats: [
                        { quality: "HD Video (No Watermark)", type: "mp4", url: response.data.url }
                    ]
                }
            });
        }

        // Secondary Public API Fallback (Tikwm for TikTok / Fast Endpoint)
        if (videoUrl.includes('tiktok.com')) {
            const tikRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`);
            if (tikRes.data && tikRes.data.data) {
                const videoData = tikRes.data.data;
                return res.json({
                    success: true,
                    data: {
                        title: videoData.title || "TikTok Video (HD)",
                        thumbnail: videoData.cover,
                        source: "TikTok",
                        formats: [
                            { quality: "HD (No Watermark)", type: "mp4", url: videoData.play },
                            { quality: "Original HD", type: "mp4", url: videoData.wmplay }
                        ]
                    }
                });
            }
        }

        return res.status(500).json({ 
            success: false, 
            error: "Unable to parse video. Please verify the link is public and try again." 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Extraction failed. Please try another link or platform." 
        });
    }
});

module.exports = app;
