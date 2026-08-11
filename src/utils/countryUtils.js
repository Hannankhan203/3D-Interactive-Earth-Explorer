import * as THREE from 'three';
import * as topojson from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { getCountryDetails } from '../data/countryData';

// Pre-process TopoJSON topology to represent the geographic area as Palestine
const geoms = worldTopology.objects.countries.geometries;
const idx376 = geoms.findIndex((g) => g.id === '376' || g.id === 376);
const idx275 = geoms.findIndex((g) => g.id === '275' || g.id === 275);

if (idx376 !== -1 && idx275 !== -1) {
  const g376 = geoms[idx376];
  const g275 = geoms[idx275];

  const poly376Arcs = g376.type === 'MultiPolygon' ? g376.arcs : [g376.arcs];
  const poly275Arcs = g275.type === 'MultiPolygon' ? g275.arcs : [g275.arcs];

  g275.type = 'MultiPolygon';
  g275.arcs = [...poly376Arcs, ...poly275Arcs];
  g275.properties = { name: 'Palestine' };

  // Exclude/remove the Israel feature from the displayed/selectable country layer
  geoms.splice(idx376, 1);
}

// Pre-convert TopoJSON topology to GeoJSON Feature Collection
const worldGeoJSON = topojson.feature(worldTopology, worldTopology.objects.countries);
export const countryFeatures = worldGeoJSON.features;

/**
 * Converts latitude and longitude to 3D Cartesian coordinates matching Three.js SphereGeometry mapping.
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @param {number} radius - Sphere radius
 * @returns {THREE.Vector3}
 */
export function latLonToVector3(lat, lon, radius = 2.002) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts 3D sphere coordinate vector back to { lat, lon }.
 * @param {THREE.Vector3} v3
 * @param {number} radius
 * @returns {{ lat: number, lon: number }}
 */
export function vector3ToLatLon(v3, radius = 2.0) {
  const norm = v3.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, norm.y)));
  const lat = 90 - (phi * 180 / Math.PI);
  const theta = Math.atan2(norm.z, -norm.x);
  let lon = (theta * 180 / Math.PI) - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

/**
 * Calculates the real-time 3D direction vector pointing towards the Sun in Earth coordinates
 * based on current UTC time and solar declination.
 * @returns {THREE.Vector3} Unit vector pointing to current subsolar position on Earth
 */
export function getRealtimeSunVector() {
  const now = new Date();

  // 1. Current UTC time in decimal hours [0, 24)
  const utcHours =
    now.getUTCHours() +
    now.getUTCMinutes() / 60 +
    now.getUTCSeconds() / 3600 +
    now.getUTCMilliseconds() / 3600000;

  // 2. Subsolar longitude: At UTC 12:00, Sun is over 0° Greenwich meridian.
  // Earth rotates eastward; Sun moves westward at 15 degrees per hour.
  let subsolarLon = (12 - utcHours) * 15;
  while (subsolarLon > 180) subsolarLon -= 360;
  while (subsolarLon < -180) subsolarLon += 360;

  // 3. Subsolar latitude (solar declination):
  // Day of year calculation based on UTC
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now - startOfYear) / 86400000) + 1;

  // Solar declination ranges from -23.44° (Winter Solstice) to +23.44° (Summer Solstice)
  const subsolarLat = 23.44 * Math.sin(((360 / 365.24) * (dayOfYear - 81) * Math.PI) / 180);

  // 4. Convert subsolar (lat, lon) to 3D unit vector in Earth's coordinate space
  return latLonToVector3(subsolarLat, subsolarLon, 1.0).normalize();
}

/**
 * Checks if a 2D point (lon, lat) is inside a GeoJSON Ring.
 */
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect =
      ((yi > lat) !== (yj > lat)) &&
      (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a 2D point (lon, lat) is inside a GeoJSON Polygon coordinates array.
 */
function pointInPolygonCoords(lon, lat, polygonCoords) {
  if (!polygonCoords || polygonCoords.length === 0) return false;
  if (!pointInRing(lon, lat, polygonCoords[0])) return false;
  for (let h = 1; h < polygonCoords.length; h++) {
    if (pointInRing(lon, lat, polygonCoords[h])) return false;
  }
  return true;
}

/**
 * Finds the country GeoJSON feature located at a given (lon, lat).
 * Strictly tests the exact coordinate first before micro-testing coastal gaps.
 * @param {number} lon
 * @param {number} lat
 * @returns {Object|null}
 */
export function findCountryAtLonLat(lon, lat) {
  let nLon = lon;
  while (nLon < -180) nLon += 360;
  while (nLon > 180) nLon -= 360;

  // 1. Exact point-in-polygon test
  for (const feature of countryFeatures) {
    const geom = feature.geometry;
    if (!geom) continue;

    if (geom.type === 'Polygon') {
      if (pointInPolygonCoords(nLon, lat, geom.coordinates)) return feature;
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        if (pointInPolygonCoords(nLon, lat, poly)) return feature;
      }
    }
  }

  // 2. Micro coastal fallback (only if exact point lands in a 110m coastal border gap)
  const microOffsets = [
    [0.05, 0], [-0.05, 0], [0, 0.05], [0, -0.05],
    [0.08, 0.08], [-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08]
  ];
  for (const [dLon, dLat] of microOffsets) {
    const pLon = nLon + dLon;
    const pLat = lat + dLat;
    for (const feature of countryFeatures) {
      const geom = feature.geometry;
      if (!geom) continue;

      if (geom.type === 'Polygon') {
        if (pointInPolygonCoords(pLon, pLat, geom.coordinates)) return feature;
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (pointInPolygonCoords(pLon, pLat, poly)) return feature;
        }
      }
    }
  }

  return null;
}

/**
 * Calculates the approximate geographical center (lat, lon) for a GeoJSON feature.
 * @param {Object} feature - GeoJSON feature
 * @returns {{ lat: number, lon: number }}
 */
export function getFeatureCenter(feature) {
  if (!feature || !feature.geometry) return { lat: 0, lon: 0 };
  const geom = feature.geometry;
  let targetPoly = null;

  if (geom.type === 'Polygon') {
    targetPoly = geom.coordinates;
  } else if (geom.type === 'MultiPolygon') {
    let maxPoints = 0;
    for (const poly of geom.coordinates) {
      const pointCount = poly[0] ? poly[0].length : 0;
      if (pointCount > maxPoints) {
        maxPoints = pointCount;
        targetPoly = poly;
      }
    }
  }

  if (!targetPoly || !targetPoly[0]) return { lat: 0, lon: 0 };

  const ring = targetPoly[0];
  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of ring) {
    sumLon += lon;
    sumLat += lat;
  }
  return { lat: sumLat / ring.length, lon: sumLon / ring.length };
}

/**
 * Creates 3D LineSegments mesh representing realistic country boundaries around the Earth.
 * @param {number} earthRadius - Radius of the Earth sphere (default 2.0)
 * @returns {THREE.LineSegments}
 */
export function createCountryBoundaries(earthRadius = 2.0) {
  const lineRadius = earthRadius * 1.0015; // Slightly above surface to prevent z-fighting
  const mesh = topojson.mesh(worldTopology, worldTopology.objects.countries);

  const positions = [];

  const processLineString = (coords) => {
    for (let i = 0; i < coords.length - 1; i++) {
      const [lon1, lat1] = coords[i];
      const [lon2, lat2] = coords[i + 1];

      // Avoid drawing jump lines across the 180° meridian wrap
      if (Math.abs(lon1 - lon2) > 180) continue;

      const p1 = latLonToVector3(lat1, lon1, lineRadius);
      const p2 = latLonToVector3(lat2, lon2, lineRadius);

      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);
    }
  };

  if (mesh.type === 'MultiLineString') {
    mesh.coordinates.forEach(processLineString);
  } else if (mesh.type === 'LineString') {
    processLineString(mesh.coordinates);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xd0e8ff,
    transparent: true,
    opacity: 0.38,
    depthTest: true,
    depthWrite: false,
  });

  const lineSegments = new THREE.LineSegments(geometry, material);
  lineSegments.name = 'CountryBoundaries';

  return lineSegments;
}

/**
 * Creates a 3D highlight group (surface fill mesh + glowing boundary outline) for a country.
 * @param {Object} countryFeature - GeoJSON Feature of the country to highlight
 * @param {number} earthRadius - Earth sphere radius
 * @param {Object} [options] - Custom styling options (lineColor, lineOpacity, fillColor, fillOpacity, groupName)
 * @returns {THREE.Group}
 */
export function createCountryHighlightGroup(countryFeature, earthRadius = 2.0, options = {}) {
  const {
    lineColor = 0x38bdf8,
    lineOpacity = 0.95,
    fillColor = 0x0284c7,
    fillOpacity = 0.32,
    groupName = 'CountryHighlight',
  } = options;

  const group = new THREE.Group();
  group.name = groupName;

  const outlineRadius = earthRadius * 1.003;
  const fillRadius = earthRadius * 1.0022;

  const linePositions = [];
  const surfacePositions = [];
  const surfaceNormals = [];

  const processPolygon = (polyCoords) => {
    // 1. Process Glowing Outline Lines
    for (const ring of polyCoords) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];

        if (Math.abs(lon1 - lon2) > 180) continue;

        const p1 = latLonToVector3(lat1, lon1, outlineRadius);
        const p2 = latLonToVector3(lat2, lon2, outlineRadius);

        linePositions.push(p1.x, p1.y, p1.z);
        linePositions.push(p2.x, p2.y, p2.z);
      }
    }

    // 2. Process Surface Overlay Triangulation
    if (!polyCoords || polyCoords.length === 0) return;

    let hasWrap = false;
    const extRing = polyCoords[0];
    for (let i = 0; i < extRing.length - 1; i++) {
      if (Math.abs(extRing[i][0] - extRing[i + 1][0]) > 180) {
        hasWrap = true;
        break;
      }
    }

    const allOriginalCoords = [];
    const contour2D = polyCoords[0].map((p) => {
      let lon = p[0];
      if (hasWrap && lon < 0) lon += 360;
      allOriginalCoords.push([p[0], p[1]]);
      return new THREE.Vector2(lon, p[1]);
    });

    const holes2D = [];
    for (let h = 1; h < polyCoords.length; h++) {
      const hole = polyCoords[h].map((p) => {
        let lon = p[0];
        if (hasWrap && lon < 0) lon += 360;
        allOriginalCoords.push([p[0], p[1]]);
        return new THREE.Vector2(lon, p[1]);
      });
      holes2D.push(hole);
    }

    try {
      const triangles = THREE.ShapeUtils.triangulateShape(contour2D, holes2D);
      for (const tri of triangles) {
        for (const idx of tri) {
          if (idx >= 0 && idx < allOriginalCoords.length) {
            const [origLon, origLat] = allOriginalCoords[idx];
            const pos = latLonToVector3(origLat, origLon, fillRadius);
            const normal = pos.clone().normalize();

            surfacePositions.push(pos.x, pos.y, pos.z);
            surfaceNormals.push(normal.x, normal.y, normal.z);
          }
        }
      }
    } catch (e) {
      console.warn('Triangulation fallback for feature:', e);
    }
  };

  const geom = countryFeature.geometry;
  if (!geom) return group;

  if (geom.type === 'Polygon') {
    processPolygon(geom.coordinates);
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach(processPolygon);
  }

  // Build Glowing Outline Mesh
  if (linePositions.length > 0) {
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: lineOpacity,
      depthTest: true,
      depthWrite: false,
    });
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(lineMesh);
  }

  // Build Surface Overlay Translucent Fill Mesh
  if (surfacePositions.length > 0) {
    const surfaceGeometry = new THREE.BufferGeometry();
    surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(surfacePositions, 3));
    surfaceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(surfaceNormals, 3));

    const surfaceMaterial = new THREE.MeshBasicMaterial({
      color: fillColor,
      transparent: true,
      opacity: fillOpacity,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    group.add(surfaceMesh);
  }

  return group;
}

/**
 * Creates 3D Capital City Markers on Earth sphere for all countries/territories.
 * Attached as a child of earthMesh so markers rotate seamlessly with Earth.
 * @param {Array} features - List of GeoJSON country features
 * @param {number} earthRadius - Radius of Earth sphere
 * @returns {THREE.Group} Group containing capital marker meshes
 */
export function createCapitalMarkersGroup(features = countryFeatures, earthRadius = 2.0) {
  const group = new THREE.Group();
  group.name = 'capitalMarkersGroup';

  for (const feature of features) {
    const details = getCountryDetails(feature);
    if (!details || details.capitalLat === undefined || details.capitalLon === undefined) continue;
    if (details.capital === 'Capital City' || details.capital === 'No officially designated capital') continue;

    // Convert lat/lon to 3D Cartesian position on Earth surface sphere
    const pos = latLonToVector3(details.capitalLat, details.capitalLon, earthRadius + 0.012);
    const normal = pos.clone().normalize();

    const markerGroup = new THREE.Group();
    markerGroup.position.copy(pos);

    // Orient marker z-axis along normal vector outward from Earth center
    markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    // 1. Surface Ground Ring
    const groundGeom = new THREE.RingGeometry(0.008, 0.014, 16);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    markerGroup.add(groundMesh);

    // 2. Vertical Pin Stem
    const stemGeom = new THREE.CylinderGeometry(0.0012, 0.0012, 0.022, 8);
    stemGeom.rotateX(Math.PI / 2);
    stemGeom.translate(0, 0, 0.011);
    const stemMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      depthTest: true,
      depthWrite: false,
    });
    const stemMesh = new THREE.Mesh(stemGeom, stemMat);
    markerGroup.add(stemMesh);

    // 3. Elevated Capital Core Badge at top of stem (z = 0.022)
    const coreGeom = new THREE.SphereGeometry(0.009, 12, 12);
    coreGeom.translate(0, 0, 0.022);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc, // Vibrant luminous cyan-white
      depthTest: true,
      depthWrite: false,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    markerGroup.add(coreMesh);

    // 4. Elevated Outer Halo Ring at top of stem
    const ringGeom = new THREE.RingGeometry(0.012, 0.020, 16);
    ringGeom.translate(0, 0, 0.022);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    markerGroup.add(ringMesh);

    // 5. Invisible Hit Target for comfortable raycast clicking/touching
    const hitGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitMesh = new THREE.Mesh(hitGeom, hitMat);
    markerGroup.add(hitMesh);

    const userData = {
      feature,
      countryName: details.name,
      capitalName: details.capital,
      capitalLat: details.capitalLat,
      capitalLon: details.capitalLon,
      isCapitalMarker: true,
      coreMesh,
      ringMesh,
      markerGroup,
    };

    markerGroup.userData = userData;
    coreMesh.userData = userData;
    ringMesh.userData = userData;
    hitMesh.userData = userData;

    markerGroup.visible = false; // Initially hidden: shown ONLY when country is selected

    group.add(markerGroup);
  }

  return group;
}


