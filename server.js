const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Universal Multi-Platform Downloader API
app.post('/api/download', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid video link.' 
        });
    }

    try {
        // ------------------------------------
        // 1. TIKTOK ENGINE
        // ------------------------------------
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

        // ------------------------------------
        // 2. INSTAGRAM ENGINE
        // ------------------------------------
        if (videoUrl.includes('instagram.com')) {
            try {
                const instaRes = await axios.get(`https://api.vkrdown.com/insta/?url=${encodeURIComponent(videoUrl)}`);
                if (instaRes.data && instaRes.data.data) {
                    return res.json({
                        success: true,
                        data: {
                            title: "Instagram Reel / Media",
                            thumbnail: instaRes.data.data.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=Instagram",
                            source: "Instagram",
                            formats: [
                                { quality: "HD Video (MP4)", type: "mp4", url: instaRes.data.data.url || instaRes.data.data.media }
                            ]
                        }
                    });
                }
            } catch(e) {}
        }

        // ------------------------------------
        // 3. YOUTUBE / SHORTS / FACEBOOK ENGINE
        // ------------------------------------
        const cobaltInstances = [
            'https://co.wuk.sh/api/json',
            'https://cobalt.api.scouts.host/api/json',
            'https://api.cobalt.tools/api/json'
        ];

        for (const instanceUrl of cobaltInstances) {
            try {
                const cobaltRes = await axios.post(instanceUrl, {
                    url: videoUrl,
                    videoQuality: "720",
                    youtubeVideoCodec: "h264"
                }, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    },
                    timeout: 8000
                });

                if (cobaltRes.data && (cobaltRes.data.url || cobaltRes.data.picker)) {
                    const data = cobaltRes.data;

                    if (data.url) {
                        return res.json({
                            success: true,
                            data: {
                                title: "GrabHD Extracted Video",
                                thumbnail: "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                                source: "Social Media",
                                formats: [
                                    { quality: "HD (MP4 Direct)", type: "mp4", url: data.url }
                                ]
                            }
                        });
                    }

                    if (data.picker && data.picker.length > 0) {
                        const formats = data.picker.map((item, idx) => ({
                            quality: `Media File #${idx + 1}`,
                            type: item.type || "mp4",
                            url: item.url
                        }));

                        return res.json({
                            success: true,
                            data: {
                                title: "GrabHD Multi-Media Extraction",
                                thumbnail: data.picker[0].thumb || "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                                source: "Social Media",
                                formats: formats
                            }
                        });
                    }
                }
            } catch (err) {
                // Next instance try කරනු ඇත
                continue;
            }
        }

        // ------------------------------------
        // 4. GENERAL FALLBACK ENGINE
        // ------------------------------------
        const fallbackRes = await axios.get(`https://api.vkrdown.com/v1/?url=${encodeURIComponent(videoUrl)}`).catch(() => null);
        if (fallbackRes && fallbackRes.data && fallbackRes.data.data) {
            const fbData = fallbackRes.data.data;
            return res.json({
                success: true,
                data: {
                    title: fbData.title || "Social Media Video",
                    thumbnail: fbData.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                    source: "Social Platform",
                    formats: [
                        { quality: "HD Video", type: "mp4", url: fbData.url || fbData.download_url }
                    ]
                }
            });
        }

        return res.status(500).json({ 
            success: false, 
            error: "Unable to parse this link. Please ensure the video is public and valid." 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Extraction failed. Please try another public video link." 
        });
    }
});

module.exports = app;
