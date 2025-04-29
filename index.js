require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { Telegraf } = require('telegraf');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

mongoose.connect(process.env.MONGODB_URI);

const videoSchema = new mongoose.Schema({
  fileId: String,
  thumbnailUrl: String,
  createdAt: { type: Date, default: Date.now }
});
const Video = mongoose.model('Video', videoSchema);

bot.on('video', async (ctx) => {
  if (String(ctx.from.id) !== process.env.ADMIN_ID) return;
  try {
    const fileId = ctx.message.video.file_id;
    await ctx.telegram.sendVideo(process.env.CHANNEL_ID, fileId);

    const link = await ctx.telegram.getFileLink(fileId);
    const videoPath = path.join(__dirname, 'thumbnails', `${fileId}.mp4`);
    const thumbDir = path.join(__dirname, 'thumbnails');
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir);

    // download video
    const writer = fs.createWriteStream(videoPath);
    const resp = await axios({ url: link.href, responseType: 'stream' });
    resp.data.pipe(writer);
    await new Promise(res => writer.on('finish', res));

    // extract thumbnail
    await new Promise((res, rej) => {
      ffmpeg(videoPath)
        .screenshots({ timestamps: ['50%'], filename: `${fileId}.jpg`, folder: thumbDir })
        .on('end', res)
        .on('error', rej);
    });

    const thumbnailUrl = `${process.env.PUBLIC_URL}/thumbnails/${fileId}.jpg`;
    await Video.create({ fileId, thumbnailUrl });
    await ctx.reply('✅ Uploaded and processed!');
  } catch (e) {
    console.error(e);
    await ctx.reply('❌ Processing failed.');
  }
});

bot.launch();

// Serve thumbnails & API
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));
app.get('/api/videos', async (_, res) => {
  const list = await Video.find().sort('-createdAt');
  res.json(list);
});

app.listen(process.env.PORT || 3000, () => console.log('Server running on port', process.env.PORT||3000));
