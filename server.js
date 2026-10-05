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

// Universal Download Router
app.post('/api/download', async (req, res) => {
    const videoUrl = req.body.videoUrl || req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid video URL.' 
        });
    }

    try {
        // ------------------------------------
        // 1. TIKTOK ENGINE (TikWM)
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
        // 2. YOUTUBE / INSTAGRAM / FACEBOOK ENGINE (Primary VKR Engine)
        // ------------------------------------
        try {
            const vkrRes = await axios.get(`https://api.vkrdown.com/v1/?url=${encodeURIComponent(videoUrl)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 9000
            });

            if (vkrRes.data && vkrRes.data.data) {
                const mediaData = vkrRes.data.data;
                const downloadLink = mediaData.url || mediaData.download_url || (mediaData.downloads && mediaData.downloads[0] ? mediaData.downloads[0].url : null);

                if (downloadLink) {
                    return res.json({
                        success: true,
                        data: {
                            title: mediaData.title || "GrabHD Extracted Media",
                            thumbnail: mediaData.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                            source: "Social Media",
                            formats: [
                                { quality: "HD Video (MP4)", type: "mp4", url: downloadLink }
                            ]
                        }
                    });
                }
            }
        } catch (e) {
            // VKR Failed - Continue to Fallback
        }

        // ------------------------------------
        // 3. SECONDARY COBALT ENGINE (Multiple Mirrors)
        // ------------------------------------
        const cobaltMirrors = [
            'https://co.wuk.sh/api/json',
            'https://cobalt.api.scouts.host/api/json'
        ];

        for (const mirror of cobaltMirrors) {
            try {
                const cobaltRes = await axios.post(mirror, {
                    url: videoUrl,
                    videoQuality: "720"
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 7000
                });

                if (cobaltRes.data && cobaltRes.data.url) {
                    return res.json({
                        success: true,
                        data: {
                            title: "GrabHD Extracted Video",
                            thumbnail: "https://via.placeholder.com/160x90/b8ef5e/111310?text=GrabHD+Media",
                            source: "Social Media",
                            formats: [
                                { quality: "HD Direct Video", type: "mp4", url: cobaltRes.data.url }
                            ]
                        }
                    });
                }
            } catch (err) {
                continue;
            }
        }

        return res.status(500).json({ 
            success: false, 
            error: "Unable to parse video. Please verify the post is public." 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Extraction failed. Please try another link." 
        });
    }
});

module.exports = app;
