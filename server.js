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

// Universal Download Router with Separate Dedicated Engines
app.post('/api/download', async (req, res) => {
    const videoUrl = req.body.videoUrl || req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ 
            success: false, 
            error: 'Please enter a valid video URL.' 
        });
    }

    try {
        // ==========================================
        // 1. TIKTOK DEDICATED ENGINE
        // ==========================================
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
                            { quality: "HD Video (No Watermark)", type: "mp4", url: videoData.play },
                            { quality: "Watermarked HD", type: "mp4", url: videoData.wmplay }
                        ]
                    }
                });
            }
        }

        // ==========================================
        // 2. INSTAGRAM DEDICATED ENGINE
        // ==========================================
        if (videoUrl.includes('instagram.com')) {
            const instaRes = await axios.get(`https://api.vkrdown.com/insta/?url=${encodeURIComponent(videoUrl)}`, { timeout: 8000 }).catch(() => null);
            if (instaRes && instaRes.data && instaRes.data.data) {
                const media = instaRes.data.data;
                const downloadUrl = media.url || media.media || media.download_url;
                if (downloadUrl) {
                    return res.json({
                        success: true,
                        data: {
                            title: "Instagram Reel / Video",
                            thumbnail: media.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=Instagram",
                            source: "Instagram",
                            formats: [
                                { quality: "HD Quality (MP4)", type: "mp4", url: downloadUrl }
                            ]
                        }
                    });
                }
            }
        }

        // ==========================================
        // 3. YOUTUBE / SHORTS DEDICATED ENGINE
        // ==========================================
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            const ytRes = await axios.get(`https://api.vkrdown.com/v1/?url=${encodeURIComponent(videoUrl)}`, { timeout: 8000 }).catch(() => null);
            if (ytRes && ytRes.data && ytRes.data.data) {
                const ytData = ytRes.data.data;
                const ytUrl = ytData.url || ytData.download_url || (ytData.downloads && ytData.downloads[0] ? ytData.downloads[0].url : null);
                if (ytUrl) {
                    return res.json({
                        success: true,
                        data: {
                            title: ytData.title || "YouTube Video",
                            thumbnail: ytData.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=YouTube",
                            source: "YouTube",
                            formats: [
                                { quality: "HD Video (MP4)", type: "mp4", url: ytUrl }
                            ]
                        }
                    });
                }
            }
        }

        // ==========================================
        // 4. FACEBOOK DEDICATED ENGINE
        // ==========================================
        if (videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch')) {
            const fbRes = await axios.get(`https://api.vkrdown.com/v1/?url=${encodeURIComponent(videoUrl)}`, { timeout: 8000 }).catch(() => null);
            if (fbRes && fbRes.data && fbRes.data.data) {
                const fbData = fbRes.data.data;
                const fbUrl = fbData.url || fbData.download_url;
                if (fbUrl) {
                    return res.json({
                        success: true,
                        data: {
                            title: fbData.title || "Facebook Video",
                            thumbnail: fbData.thumbnail || "https://via.placeholder.com/160x90/b8ef5e/111310?text=Facebook",
                            source: "Facebook",
                            formats: [
                                { quality: "HD Quality Video", type: "mp4", url: fbUrl }
                            ]
                        }
                    });
                }
            }
        }

        // ==========================================
        // 5. GLOBAL FALLBACK ENGINE (For Twitter & Others)
        // ==========================================
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
                        { quality: "HD Direct Video", type: "mp4", url: cobaltRes.data.url }
                    ]
                }
            });
        }

        return res.status(500).json({ 
            success: false, 
            error: "Unable to extract video. Please ensure the post is public." 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: "Extraction failed. Please check the link and try again." 
        });
    }
});

module.exports = app;
