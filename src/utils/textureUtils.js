import * as THREE from 'three';

/**
 * Generates a realistic, highly detailed equirectangular Earth texture on an HTML5 canvas.
 * Uses public-domain geospatial coordinates to render recognizable continents, biomes
 * (deserts, tropical rainforests, tundra, polar ice caps), ocean bathymetry, and natural Earth colors.
 *
 * @returns {THREE.CanvasTexture}
 */
export function createProceduralEarthTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Helper converter: Longitude (-180 to 180) -> X px, Latitude (90 to -90) -> Y px
  const toCanvasX = (lon) => ((lon + 180) / 360) * width;
  const toCanvasY = (lat) => ((90 - lat) / 180) * height;

  // 1. Deep Ocean Base with Bathymetry
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0f2b48'); // Arctic blue
  oceanGrad.addColorStop(0.2, '#0c223a'); // North ocean
  oceanGrad.addColorStop(0.5, '#0a1d33'); // Equatorial deep blue
  oceanGrad.addColorStop(0.8, '#0c223a'); // South ocean
  oceanGrad.addColorStop(1, '#0e2640'); // Antarctic blue
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Continental outlines & polygon renderer
  const drawPolygon = (points, fillColor, strokeColor = 'rgba(56, 189, 248, 0.25)') => {
    if (!points || points.length < 3) return;
    ctx.beginPath();
    points.forEach(([lon, lat], index) => {
      const x = toCanvasX(lon);
      const y = toCanvasY(lat);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // Recognizable continent polygon coordinates [longitude, latitude]
  const northAmerica = [
    [-168, 65], [-140, 70], [-125, 50], [-124, 38], [-117, 32], [-105, 20],
    [-90, 16], [-80, 8], [-77, 9], [-80, 25], [-81, 25], [-80, 30], [-75, 35],
    [-65, 44], [-60, 46], [-64, 50], [-70, 60], [-80, 65], [-95, 68], [-115, 69],
    [-130, 60], [-150, 60], [-165, 60], [-168, 65]
  ];

  const southAmerica = [
    [-80, 8], [-77, 9], [-73, 11], [-60, 10], [-50, 0], [-35, -5], [-35, -10],
    [-40, -20], [-50, -30], [-65, -45], [-70, -55], [-75, -45], [-72, -30],
    [-78, -10], [-81, -4], [-80, 8]
  ];

  const africa = [
    [-17, 35], [0, 36], [10, 37], [25, 32], [33, 31], [35, 28], [43, 12],
    [51, 11], [42, -2], [40, -10], [35, -25], [20, -35], [18, -34], [12, -15],
    [9, 4], [-8, 4], [-14, 12], [-17, 20], [-17, 35]
  ];

  const europe = [
    [-10, 36], [-9, 43], [-1, 44], [3, 47], [-4, 48], [-5, 58], [5, 60],
    [10, 55], [15, 55], [20, 60], [25, 71], [30, 70], [40, 65], [45, 50],
    [35, 45], [25, 40], [22, 38], [15, 38], [12, 43], [3, 42], [-10, 36]
  ];

  const asia = [
    [40, 65], [60, 70], [80, 73], [100, 78], [140, 72], [170, 66], [175, 60],
    [140, 50], [130, 40], [120, 30], [108, 20], [105, 10], [100, 4], [98, 10],
    [90, 22], [80, 15], [70, 20], [60, 25], [50, 28], [45, 13], [43, 12],
    [35, 28], [45, 50], [40, 65]
  ];

  const australia = [
    [114, -22], [125, -15], [136, -12], [142, -10], [153, -28], [150, -37],
    [138, -35], [130, -32], [115, -35], [113, -26], [114, -22]
  ];

  const greenland = [
    [-55, 60], [-40, 65], [-20, 70], [-20, 82], [-50, 83], [-70, 76], [-55, 60]
  ];

  const antarctica = [
    [-180, -65], [-120, -72], [-60, -65], [0, -70], [60, -66], [120, -68],
    [180, -65], [180, -90], [-180, -90], [-180, -65]
  ];

  // Draw Primary Base Continents with Natural Vegetation Green
  const landGreen = '#2d5a3f';
  const desertTan = '#c2a661';
  const snowWhite = '#e2e8f0';

  drawPolygon(northAmerica, landGreen);
  drawPolygon(southAmerica, '#1e3a29');
  drawPolygon(africa, desertTan);
  drawPolygon(europe, '#344e41');
  drawPolygon(asia, '#2a4d36');
  drawPolygon(australia, '#a67c52');
  drawPolygon(greenland, snowWhite);
  drawPolygon(antarctica, snowWhite);

  // 3. Biome Overlay details (Sahara, Amazon, Arabia, Gobi, Siberia snow, Islands)
  // Amazon rainforest (South America)
  drawPolygon(
    [[-75, -5], [-50, -3], [-50, -12], [-65, -15], [-75, -5]],
    '#143823',
    null
  );

  // Sahara Desert (Africa)
  drawPolygon(
    [[-15, 30], [30, 30], [32, 18], [10, 15], [-15, 20]],
    '#d4b26f',
    null
  );

  // Arabian Peninsula
  drawPolygon(
    [[35, 28], [55, 25], [58, 16], [45, 13], [35, 28]],
    '#cc9f58'
  );

  // India
  drawPolygon(
    [[70, 22], [88, 22], [80, 8], [70, 22]],
    '#325c40'
  );

  // Southeast Asia Islands (Sumatra, Borneo, PNG)
  drawPolygon([[95, 5], [105, 5], [103, -5], [95, -5]], '#1e3a29');
  drawPolygon([[110, 4], [118, 4], [116, -4], [110, -4]], '#1e3a29');
  drawPolygon([[130, -2], [150, -2], [145, -10], [130, -8]], '#1e3a29');

  // Japan & UK Islands
  drawPolygon([[130, 32], [142, 44], [140, 35], [130, 32]], '#2d5a3f');
  drawPolygon([[-8, 50], [1, 58], [-4, 56]], '#3a5a40');

  // 4. Subtle Specular/Shallow Water Shelf Rings
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
  ctx.lineWidth = 3;
  [northAmerica, southAmerica, africa, europe, asia, australia].forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const x = toCanvasX(lon);
      const y = toCanvasY(lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a realistic procedural starfield particle geometry for a dark outer-space background.
 * Generates natural star distribution, color temperatures, and smooth soft circular star points.
 * @returns {{ geometry: THREE.BufferGeometry, material: THREE.PointsMaterial }}
 */
export function createStarfield(count = 2200) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // Distribute stars on a wide spherical shell surrounding Earth (radius 100 to 280)
    const radius = 100 + Math.random() * 180;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Natural astronomical color distribution (O, B, A, F, G, K, M star types)
    const tint = Math.random();
    if (tint > 0.88) {
      // Cool blue-white star
      colors[i3] = 0.8;
      colors[i3 + 1] = 0.9;
      colors[i3 + 2] = 1.0;
    } else if (tint > 0.72) {
      // Warm pale yellow star
      colors[i3] = 1.0;
      colors[i3 + 1] = 0.96;
      colors[i3 + 2] = 0.85;
    } else if (tint > 0.6) {
      // Soft pale orange
      colors[i3] = 1.0;
      colors[i3 + 1] = 0.88;
      colors[i3 + 2] = 0.75;
    } else {
      // Crisp neutral white star
      colors[i3] = 0.95;
      colors[i3 + 1] = 0.96;
      colors[i3 + 2] = 1.0;
    }

    // Natural logarithmic star size distribution: vast majority tiny, very few slightly larger
    const sizeFactor = Math.pow(Math.random(), 3.5);
    sizes[i] = 1.0 + sizeFactor * 3.0;

    // Natural brightness variation
    alphas[i] = 0.35 + Math.random() * 0.6;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  // Generate procedural soft round star point canvas texture
  const starCanvas = document.createElement('canvas');
  starCanvas.width = 32;
  starCanvas.height = 32;
  const ctx = starCanvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
  }
  const starTexture = new THREE.CanvasTexture(starCanvas);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: { value: starTexture },
    },
    vertexShader: `
      attribute vec3 color;
      attribute float size;
      attribute float alpha;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (260.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec4 texColor = texture2D(pointTexture, gl_PointCoord);
        gl_FragColor = vec4(vColor, vAlpha) * texColor;
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { geometry, material };
}

/**
 * Generates a realistic equirectangular cloud texture on an HTML5 canvas with
 * alpha transparency, featuring tropical cloud bands, cyclone swirls, and wispy cloud formations.
 *
 * @returns {THREE.CanvasTexture}
 */
export function createProceduralCloudTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, width, height);

  // Helper converters
  const toX = (lon) => ((lon + 180) / 360) * width;
  const toY = (lat) => ((90 - lat) / 180) * height;

  // Draw soft cloud cluster
  const drawCloudPuff = (lon, lat, radiusPx, maxOpacity = 0.6) => {
    const cx = toX(lon);
    const cy = toY(lat);

    const drawPuffAt = (x, y) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radiusPx);
      grad.addColorStop(0, `rgba(255, 255, 255, ${maxOpacity})`);
      grad.addColorStop(0.4, `rgba(240, 248, 255, ${maxOpacity * 0.6})`);
      grad.addColorStop(0.75, `rgba(220, 235, 252, ${maxOpacity * 0.25})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    };

    drawPuffAt(cx, cy);
    if (cx - radiusPx < 0) drawPuffAt(cx + width, cy);
    if (cx + radiusPx > width) drawPuffAt(cx - width, cy);
  };

  // Draw cloud wispy band
  const drawCloudBand = (startLat, endLat, density = 40) => {
    for (let i = 0; i < density; i++) {
      const lon = -180 + Math.random() * 360;
      const lat = startLat + Math.random() * (endLat - startLat);
      const radius = 30 + Math.random() * 90;
      const opacity = 0.2 + Math.random() * 0.45;
      drawCloudPuff(lon, lat, radius, opacity);
    }
  };

  // Draw organic storm cluster (soft irregular puffs rather than geometric lines)
  const drawOrganicCluster = (centerLon, centerLat, spreadPx, puffCount = 18) => {
    for (let i = 0; i < puffCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.7) * spreadPx;
      const lonOffset = (Math.cos(angle) * dist) / (width / 360);
      const latOffset = (Math.sin(angle) * dist) / (height / 180);
      const radius = 25 + Math.random() * 55;
      const opacity = 0.12 + Math.random() * 0.35;
      drawCloudPuff(centerLon + lonOffset, centerLat + latOffset, radius, opacity);
    }
  };

  // 1. Equatorial Intertropical Convergence Zone (ITCZ) cloud band
  drawCloudBand(-12, 12, 90);

  // 2. Mid-latitude storm tracks (North & South hemispheres)
  drawCloudBand(25, 55, 110);
  drawCloudBand(-55, -25, 110);

  // 3. Polar cloud wisps
  drawCloudBand(65, 82, 45);
  drawCloudBand(-82, -65, 45);

  // 4. Realistic organic storm clusters
  drawOrganicCluster(-60, 35, 110, 20); // North Atlantic storm cluster
  drawOrganicCluster(140, 20, 130, 22); // Pacific storm cluster
  drawOrganicCluster(-120, -40, 100, 18); // South Pacific cluster
  drawOrganicCluster(80, 15, 90, 16); // Indian Ocean cluster

  // 5. Fine atmospheric haze / micro wisps across globe
  for (let i = 0; i < 300; i++) {
    const lon = -180 + Math.random() * 360;
    const lat = -80 + Math.random() * 160;
    const radius = 15 + Math.random() * 40;
    const opacity = 0.08 + Math.random() * 0.25;
    drawCloudPuff(lon, lat, radius, opacity);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a photographic, highly realistic thin atmospheric scattering layer surrounding Earth.
 * Features Rayleigh blue scattering on the day side, forward sunlight scattering highlights,
 * sunset/twilight warm tone shifts near the terminator, and a subtle dark navy rim on the night side.
 *
 * @param {number} earthRadius - Radius of the Earth sphere (default 2.0)
 * @param {THREE.Vector3} sunDirection - Unit vector pointing to the subsolar point
 * @returns {{ geometry: THREE.SphereGeometry, material: THREE.ShaderMaterial, mesh: THREE.Mesh }}
 */
export function createAtmosphereGlow(earthRadius = 2.0, sunDirection = new THREE.Vector3(1, 0, 0)) {
  // Thin atmospheric gas shell (~2.5% outer radius)
  const atmosphereRadius = earthRadius * 1.025;
  const geometry = new THREE.SphereGeometry(atmosphereRadius, 64, 64);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSunDirection: { value: sunDirection },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldNormal;
      varying vec3 vViewPosition;
      uniform vec3 uSunDirection;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 norm = normalize(vNormal);
        vec3 worldNorm = normalize(vWorldNormal);
        vec3 sunDir = normalize(uSunDirection);

        // 1. Fresnel limb scattering: concentrates atmosphere tightly along Earth's horizon edge
        float dotVN = abs(dot(norm, viewDir));
        float rim = pow(max(0.0, 1.0 - dotVN), 4.2);

        // 2. Sunlight orientation factor
        float sunDot = dot(worldNorm, sunDir);

        // Smooth transition from full daylight to night terminator
        float dayFactor = smoothstep(-0.25, 0.25, sunDot);

        // 3. Sunset / Twilight glow transition near the day-night terminator (sunDot ~ 0.0)
        float twilightFactor = smoothstep(0.3, 0.0, abs(sunDot));

        // 4. Forward Mie/Rayleigh scattering: subtle bright highlight when viewing limb towards the Sun
        float forwardScatter = pow(max(0.0, dot(-viewDir, sunDir)), 3.0) * dayFactor * 0.35;

        // 5. Color Palettes:
        // Day sky blue (Rayleigh scattering)
        vec3 dayColor = vec3(0.20, 0.58, 0.95);
        // Twilight sunset warm amber-copper tone
        vec3 twilightColor = vec3(0.85, 0.45, 0.22);
        // Night side faint deep indigo/navy rim
        vec3 nightColor = vec3(0.02, 0.06, 0.16);

        // Combine colors naturally according to sun position
        vec3 atmosColor = mix(nightColor, dayColor, dayFactor);
        atmosColor = mix(atmosColor, twilightColor, twilightFactor * 0.35);
        atmosColor += vec3(0.4, 0.7, 1.0) * forwardScatter;

        // 6. Alpha density falloff: delicate and thin
        float alphaDay = rim * (0.65 + forwardScatter);
        float alphaNight = rim * 0.08; // Very subtle on night side
        float alpha = mix(alphaNight, alphaDay, dayFactor);

        gl_FragColor = vec4(atmosColor, alpha);
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'atmosphereMesh';
  mesh.raycast = () => {}; // Exclude atmosphere from raycasting
  return { geometry, material, mesh };
}

/**
 * Generates a realistic equirectangular city night-lights texture on an HTML5 canvas.
 * Renders glowing metropolitan hubs, suburban corridors, and scattered rural lights
 * with warm golden-amber color profiles.
 *
 * @returns {THREE.CanvasTexture}
 */
export function createProceduralNightLightsTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Dark background for unilluminated ocean/rural regions
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const toX = (lon) => ((lon + 180) / 360) * width;
  const toY = (lat) => ((90 - lat) / 180) * height;

  // Draws a glowing city center point
  const drawCityGlow = (lon, lat, radiusPx, intensity = 1.0) => {
    const cx = toX(lon);
    const cy = toY(lat);

    const drawGlowAt = (x, y) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radiusPx);
      grad.addColorStop(0, `rgba(255, 240, 180, ${intensity * 0.95})`);
      grad.addColorStop(0.2, `rgba(255, 210, 110, ${intensity * 0.75})`);
      grad.addColorStop(0.5, `rgba(255, 160, 50, ${intensity * 0.35})`);
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    };

    drawGlowAt(cx, cy);
    if (cx - radiusPx < 0) drawGlowAt(cx + width, cy);
    if (cx + radiusPx > width) drawGlowAt(cx - width, cy);
  };

  // Draws a clustered metropolitan area
  const drawMetroCluster = (centerLon, centerLat, radiusPx, density = 18) => {
    drawCityGlow(centerLon, centerLat, radiusPx, 1.0);
    for (let i = 0; i < density; i++) {
      const offsetX = (Math.random() - 0.5) * radiusPx * 1.6;
      const offsetY = (Math.random() - 0.5) * radiusPx * 1.6;
      const subRadius = 2 + Math.random() * (radiusPx * 0.4);
      const intensity = 0.4 + Math.random() * 0.5;

      const cx = toX(centerLon) + offsetX;
      const cy = toY(centerLat) + offsetY;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, subRadius);
      grad.addColorStop(0, `rgba(255, 225, 140, ${intensity})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, subRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Draws corridor highways (e.g., Boston to Washington DC, Nile River)
  const drawLightCorridor = (startLon, startLat, endLon, endLat, widthPx, count = 25) => {
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const lon = startLon + (endLon - startLon) * t;
      const lat = startLat + (endLat - startLat) * t;
      drawCityGlow(lon, lat, widthPx * (0.6 + Math.random() * 0.8), 0.6 + Math.random() * 0.3);
    }
  };

  // 1. Major Global Megacities & Urban Clusters
  // North America
  drawMetroCluster(-74.0, 40.7, 24, 30); // NYC BosWash corridor
  drawLightCorridor(-71.0, 42.3, -77.0, 38.9, 14, 30); // Boston to DC
  drawMetroCluster(-87.6, 41.8, 20, 20); // Chicago Great Lakes
  drawMetroCluster(-118.2, 34.0, 22, 25); // Los Angeles / SoCal
  drawMetroCluster(-122.4, 37.7, 16, 18); // San Francisco Bay
  drawMetroCluster(-95.3, 29.7, 18, 18); // Houston
  drawMetroCluster(-96.8, 32.7, 18, 18); // Dallas
  drawMetroCluster(-80.1, 25.7, 16, 15); // Miami

  // Europe
  drawMetroCluster(-0.1, 51.5, 24, 28); // London
  drawMetroCluster(2.3, 48.8, 22, 25); // Paris
  drawMetroCluster(7.0, 51.2, 26, 32); // Rhine-Ruhr megalopolis
  drawMetroCluster(9.2, 45.4, 18, 20); // Milan / Po Valley
  drawMetroCluster(-3.7, 40.4, 16, 15); // Madrid
  drawMetroCluster(37.6, 55.7, 20, 22); // Moscow

  // Asia
  drawMetroCluster(139.7, 35.6, 28, 35); // Greater Tokyo
  drawMetroCluster(127.0, 37.5, 22, 25); // Seoul
  drawMetroCluster(121.4, 31.2, 26, 30); // Shanghai Yangtze Delta
  drawMetroCluster(113.2, 23.1, 26, 30); // Pearl River Delta (Guangzhou/HK)
  drawMetroCluster(116.4, 39.9, 22, 25); // Beijing
  drawMetroCluster(72.8, 19.0, 22, 25); // Mumbai
  drawMetroCluster(77.2, 28.6, 22, 25); // Delhi
  drawMetroCluster(106.8, -6.2, 20, 22); // Jakarta

  // Middle East & Africa
  drawMetroCluster(55.2, 25.2, 18, 20); // Dubai / UAE
  drawMetroCluster(31.2, 30.0, 20, 25); // Cairo
  drawLightCorridor(31.2, 30.0, 32.8, 24.0, 10, 25); // Nile River ribbon
  drawMetroCluster(28.0, -26.2, 16, 15); // Johannesburg

  // South America & Oceania
  drawMetroCluster(-46.6, -23.5, 22, 25); // Sao Paulo
  drawMetroCluster(-58.3, -34.6, 18, 20); // Buenos Aires
  drawMetroCluster(151.2, -33.8, 16, 16); // Sydney
  drawMetroCluster(144.9, -37.8, 16, 16); // Melbourne

  // 2. Fine Scattered Rural & Suburban Lights
  for (let i = 0; i < 450; i++) {
    const lon = -180 + Math.random() * 360;
    const lat = -60 + Math.random() * 130;
    const radius = 1.5 + Math.random() * 5;
    const intensity = 0.2 + Math.random() * 0.6;
    drawCityGlow(lon, lat, radius, intensity);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
