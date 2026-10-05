const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve Static Frontend (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// RapidAPI Credentials
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'YOUR_RAPIDAPI_KEY_HERE'; // universal-social-media-content-downloader-api.p.rapidapi.com
const RAPIDAPI_HOST = 'universal-social-media-content-downloader-api.p.rapidapi.com';

app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ success: false, error: 'Please enter a valid video link.' });
    }

    try {
        const response = await axios.get(`https://${RAPIDAPI_HOST}/`, {
            params: { url: videoUrl },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        });

        // RapidAPI Response එක UI එකට ගැලපෙන විදිහට සකස් කිරීම
        const apiData = response.data;

        if (apiData) {
            return res.json({
                success: true,
                data: {
                    title: apiData.title || "GrabHD Extracted Media",
                    thumbnail: apiData.thumbnail || apiData.cover || "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                    source: "Social Media",
                    formats: [
                        {
                            quality: "HD Video (No Watermark)",
                            type: "mp4",
                            url: apiData.url || apiData.download_url || (apiData.medias && apiData.medias[0] ? apiData.medias[0].url : null)
                        }
                    ]
                }
            });
        } else {
            return res.status(500).json({ success: false, error: 'Failed to extract video using RapidAPI.' });
        }

    } catch (error) {
        console.error('RapidAPI Error:', error.response ? error.response.data : error.message);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to extract video. Please ensure the link is public and valid.' 
        });
    }
});

// Vercel Serverless Export
module.exports = app;
