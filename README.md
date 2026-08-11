# 🌍 Earth Explorer — Interactive 3D Globe

Earth Explorer is an interactive 3D globe application built with modern web technologies. Users can explore countries, visualize real-time day and night cycles, search geographic regions, and interact with detailed country information through an immersive interface.

---

## Features

- **Interactive 3D Earth**: Full-screen WebGL 3D Earth sphere featuring realistic surface textures, procedural cloud layers, atmospheric glow scattering, and a deep space starfield background.
- **Intuitive Orbit & Touch Controls**: Smooth mouse drag rotation, wheel zoom, and multi-finger touch gestures with momentum damping and controlled touch sensitivity.
- **Reset View**: Unobtrusive reset button to instantly center the camera and clear rotational momentum.
- **Initial Focused View**: Application defaults to a focused camera view over Pakistan (30.0° N, 69.5° E).
- **Real-Time Day & Night Lighting**: Directional solar lighting reflecting actual UTC sun positioning and day/night terminator boundaries.
- **Time Simulation Controls**: Interactive control panel allowing users to test custom simulated dates, times of day, and seasonal sun angles or run accelerated time mode.
- **Geographic Country Search**: Search input with real-time matching suggestions by country name, capital, ISO code, or subregion, with continent and region filtering.
- **Country Selection & Hover Tooltips**: TopoJSON country boundary highlights on hover and click selection with smooth camera animations.
- **Contextual Country Information Panel**: Draggable and resizable details panel displaying capital city, population, land area, continent, region, currency, official languages, and neighboring borders.
- **Geopolitical Representation**: Accurate inclusion and detailed metadata for Palestine.
- **Keyboard Shortcuts**: Quick keyboard navigation support (`R` to Reset View, `/` to focus search, `Esc` to close panels).
- **First-Time Navigation Guide**: On-screen overlay with quick interaction tips that automatically fades out after user interaction.
- **Live Lat/Long Telemetry**: HUD readout displaying real-time cursor geographic coordinates (Latitude and Longitude).
- **Responsive Design**: Designed for desktop, tablet, and mobile device screen sizes.

---

## Day / Night System

- **Current Real-World Time Mode**: Automatically calculates solar positioning based on live UTC system time.
- **Time Simulation**: User controls allow shifting dates and times to observe daily solar progression and seasonal daylight variations.
- **Dynamic Earth Lighting**: Directional sunlight creates realistic daytime, twilight, and nighttime illumination across the globe.

---

## Country Exploration

- **Search & Filtering**: Search bar allows filtering by country name, capital city, continent, or subregion.
- **Interactive Boundaries**: Clicking any country highlights its TopoJSON polygon boundaries, smoothly moves the camera, and opens the detail panel.
- **Country Details**: Displays key geographic statistics including capital city, population, land area, currency, official languages, continent, and neighboring countries.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `R` | Reset view and camera position |
| `/` | Focus country search input |
| `Esc` | Close information panel or blur search input |

---

## Technology Stack

- **Frontend Framework**: React 19 (`react`, `react-dom`)
- **3D Graphics & WebGL**: Three.js (`three`)
- **Geographic Data**: TopoJSON Client (`topojson-client`), World Atlas (`world-atlas`)
- **Styling & Animation**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`), Motion (`motion`), Lucide Icons (`lucide-react`)
- **Build Tooling & Server**: Vite 6 (`vite`), Express (`express`), TypeScript / TSX (`typescript`, `tsx`)

---

## Project Structure

```text
earth-explorer/
├── src/
│   ├── components/
│   │   ├── CountryInfoPanel.jsx       # Draggable & resizable country details panel
│   │   ├── CountrySearch.jsx          # Search bar with auto-complete & region filters
│   │   ├── CountryTooltip.jsx         # Cursor hover tooltip for country names
│   │   ├── DevTimeControls.jsx        # Advanced time manipulation overlay
│   │   ├── EarthCanvas.jsx            # Three.js WebGL 3D Earth canvas & scene loop
│   │   ├── NavControls.jsx            # Vertical zoom & reset navigation controls
│   │   └── TimeSimulationControls.jsx # User-facing time simulation panel
│   ├── data/
│   │   └── countryData.js             # Geographic metadata & country details
│   ├── utils/
│   │   ├── countryUtils.js            # TopoJSON parsing, 3D coordinate math & projections
│   │   └── textureUtils.js            # Procedural texture generators for Earth & stars
│   ├── App.jsx                        # Main application component & HUD overlay
│   ├── index.css                      # Global Tailwind CSS styles
│   └── main.jsx                       # Application entry point
├── .env.example                       # Environment variables template
├── index.html                         # HTML entry point & Open Graph metadata
├── metadata.json                      # Applet metadata configuration
├── package.json                       # Project dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
├── vite.config.ts                     # Vite bundler configuration
└── README.md                          # Project documentation
```

---

## Installation & Running Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or equivalent package manager

### Setup Instructions

1. Clone or download the repository.
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open the development server URL displayed in your terminal output (e.g., `http://localhost:3000`).

### Production Build

To test or build the application for production:

```bash
npm run build
```

---

## Environment Variables

Check `.env.example` for optional environment variables:

```env
GEMINI_API_KEY=
```

No environment variables are required to run the core 3D globe application.

---

## Deployment

The application compiles into static production assets in the `dist/` directory via `npm run build`, suitable for deployment to static hosting platforms such as Vercel, Netlify, or Cloud Run.

---

## Project Status

Phase 10 Complete — The planned development roadmap has been completed, and the project is currently in a polished state ready for deployment and further enhancements.

---

## Future Improvements

- More geographic datasets
- Additional map layers
- Accessibility improvements
- Enhanced astronomical visualization
- Additional educational tools
