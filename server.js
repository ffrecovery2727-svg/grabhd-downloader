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

// Universal Download Extraction Route
app.post('/api/download', async (req, res) => {
    // Both body keys handled (videoUrl & url)
    const videoUrl = req.body.videoUrl || req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid video link.' 
        });
    }

    try {
        // 1. TIKTOK ENGINE (TikWM API)
        if (videoUrl.includes('tiktok.com')) {
            const tikRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`);
            if (tikRes.data && tikRes.data.data) {
                const videoData = tikRes.data.data;
                return res.json({
                    success: true,
                    data: {
                        title: videoData.title || "TikTok Video",
                        thumbnail: videoData.cover,
                        source: "TikTok",
                        formats: [
                            { quality: "HD (No Watermark)", type: "mp4", url: videoData.play },
                            { quality: "Watermarked HD", type: "mp4", url: videoData.wmplay }
                        ]
                    }
                });
            }
        }

        // 2. INSTAGRAM / FACEBOOK / YOUTUBE (Direct Multi-Engine Fallback)
        const apiEndpoints = [
            `https://api.vkrdown.com/v1/?url=${encodeURIComponent(videoUrl)}`,
            `https://api.vkrdown.com/insta/?url=${encodeURIComponent(videoUrl)}`
        ];

        for (const endpoint of apiEndpoints) {
            try {
                const response = await axios.get(endpoint, { timeout: 8000 });
                if (response.data && response.data.data) {
                    const media = response.data.data;
                    const downloadUrl = media.url || media.download_url || media.media;

                    if (downloadUrl) {
                        return res.json({
                            success: true,
                            data: {
                                title: media.title || "GrabHD Extracted Video",
                                thumbnail: media.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                                source: "Social Media",
                                formats: [
                                    { quality: "HD Video (MP4)", type: "mp4", url: downloadUrl }
                                ]
                            }
                        });
                    }
                }
            } catch (e) {
                continue;
            }
        }

        // 3. COBALT ENGINE BACKUP
        const cobaltRes = await axios.post('https://co.wuk.sh/api/json', {
            url: videoUrl,
            vQuality: "720"
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 8000
        }).catch(() => null);

        if (cobaltRes && cobaltRes.data && cobaltRes.data.url) {
            return res.json({
                success: true,
                data: {
                    title: "GrabHD Extracted Video",
                    thumbnail: "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                    source: "Social Media",
                    formats: [
                        { quality: "HD Video (Direct)", type: "mp4", url: cobaltRes.data.url }
                    ]
                }
            });
        }

        return res.status(500).json({ 
            success: false, 
            error: "Unable to parse video. Please verify the link is public." 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Extraction failed. Please try again with a public link." 
        });
    }
});

module.exports = app;
