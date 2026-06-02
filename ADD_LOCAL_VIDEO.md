# Guide: Adding a Local Video to Your FitCheck AI Workspace

To serve a custom video file locally from your own computer rather than using a remote CDN link (like Mixkit or Pexels), you can easily place the video in your Vite project workspace. Here are the two best ways to do this:

---

## Method A: The `public/` Folder (Recommended & Easiest)

Vite serves anything inside the `public/` folder directly from the root URL. This is ideal for large media assets like video loops.

### 1. Save your video file
Save your `.mp4` video inside your project's public folder at:
`fitcheck-ai/public/fashion-loop.mp4`

*(Or create a subfolder: `fitcheck-ai/public/videos/fashion-loop.mp4`)*

### 2. Update the video reference in `src/App.jsx`
Open `src/App.jsx` and change the video `src` attribute to reference the local root-level public path:

```jsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="w-full h-full object-cover opacity-30 scale-105 pointer-events-none filter grayscale contrast-125"
  src="/fashion-loop.mp4" /* Path relative to your public/ directory */
/>
```

---

## Method B: The `src/assets/` Folder (Vite Import Pipeline)

If you want Vite to optimize, hash, and bundle your video through the production build pipeline, you can import it as a standard module.

### 1. Save your video file
Save your `.mp4` video inside your assets folder:
`fitcheck-ai/src/assets/fashion-loop.mp4`

### 2. Import and reference in `src/App.jsx`
Open `src/App.jsx`, import the video file at the top of the file, and pass it to the `src` attribute:

```javascript
// 1. Add import at the top of src/App.jsx:
import localFashionVideo from "./assets/fashion-loop.mp4";

// ... inside App component under step === "welcome":
<video
  autoPlay
  loop
  muted
  playsInline
  className="w-full h-full object-cover opacity-30 scale-105 pointer-events-none filter grayscale contrast-125"
  src={localFashionVideo} /* Reference imported asset variable */
/>
```
