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

// Universal Video Extraction Route
app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid video link.' 
        });
    }

    try {
        // 1. TikTok Specific Fast Engine
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

        // 2. Multi-Platform Cobalt Main API Engine (YouTube, Instagram, Facebook, Twitter)
        const cobaltResponse = await axios.post('https://api.cobalt.tools/', {
            url: videoUrl,
            videoQuality: "720",
            youtubeVideoCodec: "h264",
            filenamePattern: "basic"
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        }).catch(err => err.response);

        if (cobaltResponse && cobaltResponse.data) {
            const resData = cobaltResponse.data;

            // Direct URL Response
            if (resData.url) {
                return res.json({
                    success: true,
                    data: {
                        title: "GrabHD Extracted Video",
                        thumbnail: "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                        source: "Social Media",
                        formats: [
                            { quality: "HD Quality (No Watermark)", type: "mp4", url: resData.url }
                        ]
                    }
                });
            }

            // Picker / Multi-media response (Instagram Carousel / YouTube formats)
            if (resData.picker && resData.picker.length > 0) {
                const formats = resData.picker.map((item, index) => ({
                    quality: `Media File #${index + 1}`,
                    type: item.type || "mp4",
                    url: item.url
                }));

                return res.json({
                    success: true,
                    data: {
                        title: "GrabHD Multi-Media Extraction",
                        thumbnail: resData.picker[0].thumb || "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                        source: "Social Media",
                        formats: formats
                    }
                });
            }
        }

        // 3. Fallback General Extractor
        return res.status(500).json({ 
            success: false, 
            error: "Unable to extract video. Please ensure the post/video is public." 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Extraction process failed. Please check the link and try again." 
        });
    }
});

module.exports = app;
