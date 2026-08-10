# 3D Interactive Earth Explorer

A realistic, highly responsive 3D Earth visualization application built with React, Three.js, and WebGL. Explore the world interactively through fluid rotation, pinch and wheel zooming, geographic country selection, real-time country search, and draggable country information panels.

---

## Features

- **Photorealistic 3D Earth**: High-definition surface textures combined with procedural cloud layers, atmospheric glow scattering, and realistic directional sunlight lighting.
- **Deep Space Environment**: Immersive procedural starfield backdrop.
- **Interactive Orbit Controls**: Smooth rotation and zooming with natural damping momentum (mouse drag, wheel zoom, single-finger touch rotation, and two-finger pinch zoom).
- **Geographic Boundaries & Hovering**: Accurate country polygon highlights based on GeoJSON/TopoJSON boundary data with smooth fade-in/fade-out hover transitions.
- **Country Search**: Search bar with real-time auto-complete suggestions that smoothly animates the 3D camera to center on searched countries.
- **Draggable & Resizable Information Panel**: Detailed demographic and geographic panel displaying capital city, population, land area, continent, region, currency, official languages, calling codes, and neighboring borders with full touch/mouse dragging and edge/corner resizing.
- **Precision Markers**: Visual aura selection pins and pulsing capital city markers anchored to exact 3D lat/long coordinates.
- **Continent & Region Filtering**: Filter countries by continent or sub-region directly within the search interface.
- **Live Lat/Long Coordinates**: Real-time HUD displaying cursor geographic coordinates, camera zoom distance, and globe orientation metrics.
- **Palestine Geopolitical Representation**: Accurate naming and detailed geopolitical metadata for Palestine.
- **Accessibility & Motion Design**: Respects user `prefers-reduced-motion` settings and optimizes animation frame loops.
- **Mobile & Touch Friendly**: Fully responsive UI designed for desktop, tablet, and mobile devices in both portrait and landscape orientations.

---

## Technology Stack

- **Frontend Framework**: React 19 (JavaScript JSX)
- **3D Graphics & WebGL**: Three.js (`three`)
- **Geographic Data**: TopoJSON Client (`topojson-client`), World Atlas (`world-atlas`)
- **Styling & UI**: Tailwind CSS v4, Lucide React Icons (`lucide-react`)
- **Build Tooling**: Vite 6

---

## How It Works

1. **3D Scene Architecture**: Three.js manages a perspective camera, WebGL renderer, direction-based lighting simulating the Sun, and custom materials for the Earth sphere, cloud layer, atmospheric glow, and outer starfield.
2. **Geographic Projections**: Latitudes and longitudes are projected into 3D Cartesian coordinates (`latLonToVector3`) on a 3D sphere, powering the boundary polygons, lines, and city marker pins.
3. **Interactive Raycasting**: WebGL raycasting determines exact country polygon hits upon mouse/touch interactions for seamless hover and selection state management.
4. **Smooth Camera Navigation**: Search selections trigger camera animations that interpolate spherical coordinates to gently rotate and position the target country at the center of the viewport.
5. **State & HUD Management**: React context and local state coordinate selection highlights, search queries, HUD readouts, and window resizing events.

---

## Project Structure

```text
3d-interactive-earth-explorer/
├── src/
│   ├── components/
│   │   ├── CountryInfoPanel.jsx   # Draggable & resizable country details panel
│   │   ├── CountrySearch.jsx      # Search input with auto-complete & region filters
│   │   ├── CountryTooltip.jsx     # Smooth cursor hover tooltip for country names
│   │   └── EarthCanvas.jsx        # Primary Three.js 3D Earth canvas & WebGL render loop
│   ├── data/
│   │   └── countryData.js         # GeoJSON boundary data, country metadata, and capital coordinates
│   ├── utils/
│   │   ├── countryUtils.js        # Coordinate projections, math helpers, and geometry builders
│   │   └── textureUtils.js        # Procedural texture generators for Earth, clouds, and starfields
│   ├── App.jsx                    # Core application layout, HUD overlay, and state orchestration
│   ├── index.css                  # Global Tailwind CSS and animation styles
│   └── main.jsx                   # React application entry point
├── package.json                   # Dependencies and npm scripts
├── vite.config.js                 # Vite bundler configuration
└── README.md                      # Project documentation
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repository-url>
   cd 3d-interactive-earth-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser to view the application.

### Building for Production

To create an optimized production build:

```bash
npm run build
```

---

## License

This project is open source and available under the MIT License.
