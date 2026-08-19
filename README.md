# UI Product Studio

A browser-based virtual product photography studio for software UI screenshots.

## Features
- Screenshot upload mapped to a physical 3D screen with depth, perspective, studio lighting, and shadows
- PHOTO / VIDEO modes
- X/Y/Z analog-style rotation knobs
- Mouse gestures: drag rotate, Space+drag pan, Shift+drag roll, wheel zoom
- Aspect presets, scale, grid overlay, light intensity and direction
- 4K-class still export from an offscreen high-resolution render
- 6-second WebM capture using MediaRecorder with orbit, tilt, or manual motion
- Built-in demo screenshots, no upload required

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

Designed for deployment to Vercel as a Vite React app.
