# Real Tech YT Downloader

Hello everyone. This is Real Tech YT Downloader desktop app. I made this software because many people asking me simple tool to download YouTube videos in highest quality like 1080p Full HD, 4K, 8K or MP3 audio without any limit or annoying popup ads.

This app is 100 percent free and open source under MIT License.

## Direct Windows Download

If you just want to use the software on Windows computer, download direct installer file below:

[Download Real Tech YT Downloader Setup (.exe)](https://github.com/real-tech-solutions/real-tech-yt-downloader/releases/download/v1.0.0/Real-Tech-YT-Downloader-Setup-1.0.0.exe)

---

## App Features (විශේෂාංග)

### English:
- Unlimited video downloads with no daily limits or payment requirements
- High Quality downloads up to 1080p, 2K, 4K and 8K resolution
- Convert and download YouTube videos as MP3 audio files
- Sign in to YouTube directly inside app to download Private, Unlisted, and Age-restricted videos easily
- Custom folder selection for saved files
- Clean and lightweight user interface for non-technical users

### සිංහල:
- කිසිම සීමාවකින් තොරව Unlimited වීඩියෝ ඩවුන්ලෝඩ් කරගැනීමේ හැකියාව
- 1080p, 2K, 4K සහ 8K ඉහලම කොලිටියෙන් (High Quality) වීඩියෝ ඩවුන්ලෝඩ් කරගැනීම
- Private, Unlisted සහ Age-restricted (වයස් සීමා ඇති) වීඩියෝ App එක ඇතුලෙන්ම Sign in වී ඉතා ලේසියෙන් ඩවුන්ලෝඩ් කිරීමේ පහසුකම
- වීඩියෝ MP3 Audio බවට සේව් කරගැනීම
- ඉතාම සරල Light UI එක නිසා පරිගණක දැනුම නැති ඕනෑම කෙනෙකුට පාවිච්චි කල හැක

---

## For Developers: How to Clone and Run

If you want to modify code or build app from source code, follow these steps:

1. Clone repository to your local computer:
```bash
git clone https://github.com/real-tech-solutions/real-tech-yt-downloader.git
cd real-tech-yt-downloader
```

2. Install Node dependencies:
```bash
npm install
```

3. Download required binaries into `bin/` directory:
```bash
npm run setup-bin
```
Note: `npm run setup-bin` automatically fetches `yt-dlp.exe`. Make sure `ffmpeg.exe` and `ffprobe.exe` are placed inside `./bin/` directory.

4. Start application in development mode:
```bash
npm start
```

5. Build Windows executable setup installer:
```bash
npm run dist
```

---

## Third-Party Binaries & Copyright Notice

Real Tech YT Downloader is an open source graphical user interface wrapper built on top of external command-line tools:

- **yt-dlp**: Created and maintained by the yt-dlp development team under the Unlicense project license.
- **FFmpeg & FFprobe**: Created and maintained by the FFmpeg developers under LGPL / GPL licenses.

Real Tech YT Downloader does not claim any copyright ownership over yt-dlp or FFmpeg binaries. All rights, trademarks, and copyrights belong to their respective authors and project maintainers.

---

by Pasindu Sandaruwan Owner of Real Tech Solutions
