import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createProceduralEarthTexture,
  createProceduralCloudTexture,
  createProceduralNightLightsTexture,
  createStarfield,
  createAtmosphereGlow,
} from '../utils/textureUtils';
import {
  createCountryBoundaries,
  createCountryHighlightGroup,
  createCapitalMarkersGroup,
  countryFeatures,
  findCountryAtLonLat,
  vector3ToLatLon,
  latLonToVector3,
  getFeatureCenter,
  getRealtimeSunVector,
  getNeighborFeatures,
} from '../utils/countryUtils';
import { getCountryDetails } from '../data/countryData';

function isSameFeature(f1, f2) {
  if (f1 === f2) return true;
  if (!f1 || !f2) return false;
  if (f1.id !== undefined && f1.id !== null && f2.id !== undefined && f2.id !== null) {
    return String(f1.id) === String(f2.id);
  }
  if (f1.properties?.name && f2.properties?.name) return f1.properties.name === f2.properties.name;
  return false;
}

/**
 * Dedicated Three.js / WebGL Earth Canvas component.
 * Manages full-screen 3D viewport, scene, camera, renderer, animation loop, and cleanup.
 */
export default function EarthCanvas({
  selectedCountry,
  onCountrySelect,
  onCoordinatesUpdate,
  onCountryHover,
  simulatedTime = null,
  resetTrigger = 0,
  zoomInTrigger = 0,
  zoomOutTrigger = 0,
  onReady,
  onError,
}) {
  const containerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [initError, setInitError] = useState(null);
  const [capitalLabel, setCapitalLabel] = useState({ visible: false, x: 0, y: 0, capitalName: '', countryName: '' });
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const selectCountryFeatureRef = useRef(null);
  const clearSelectionRef = useRef(null);
  const rotateToFeatureRef = useRef(null);
  const resetToInitialViewRef = useRef(null);
  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const selectedCountryRef = useRef(selectedCountry);
  const onCountryHoverRef = useRef(onCountryHover);
  const simulatedTimeRef = useRef(simulatedTime);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    simulatedTimeRef.current = simulatedTime;
  }, [simulatedTime]);

  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
  }, [selectedCountry]);

  useEffect(() => {
    onCountryHoverRef.current = onCountryHover;
  }, [onCountryHover]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      // Check WebGL availability
      if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
        throw new Error('WebGL graphics are not supported by your browser.');
      }

      // Viewport dimensions
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      // 1. Three.js Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x01040f); // Dark outer-space background

      // Earth's physical axial tilt (23.44 degrees obliquity)
      const AXIAL_TILT_RAD = THREE.MathUtils.degToRad(-23.44);
      const tiltEuler = new THREE.Euler(0, 0, AXIAL_TILT_RAD);

      // 2. Perspective Camera setup with responsive FOV adaptation
      const aspect = width / height;
      const initialFov = aspect < 1 ? Math.min(65, 45 / aspect) : 45;
      const camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 1000);
      const initialCamPos = latLonToVector3(30.0, 69.5, 6.0).applyEuler(tiltEuler);
      camera.position.copy(initialCamPos);

      // 3. WebGL Renderer setup
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch (glErr) {
        throw new Error('Unable to create WebGL renderer context.');
      }

      if (!renderer || !renderer.getContext()) {
        throw new Error('WebGL context creation failed.');
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      // Clean container and attach WebGL canvas
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

    // 4. OrbitControls for interactive 3D navigation and silky-smooth mouse-wheel zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05; // Smooth physical inertia for drag and zoom
    controls.rotateSpeed = 0.75;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.65; // Controlled, fluid zoom feel
    controls.minDistance = 2.4; // Prevents clipping into Earth sphere (radius 2.0, atmosphere 2.08)
    controls.maxDistance = 12.0; // Prevents Earth from zooming too far out
    controls.enablePan = false; // Keep Earth strictly centered in viewport
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.update();

    // Maximum texture anisotropic filtering for ultra-crisp sampling at angles
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy() || 1;

    // 5. Day/Night Lighting environment initialized from real current UTC solar position
    const initialSunDir = getRealtimeSunVector(simulatedTimeRef.current);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
    const mainSunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainSunLight.position.copy(initialSunDir).multiplyScalar(20.0);

    scene.add(ambientLight, mainSunLight);

    // 6. Starfield Background
    const { geometry: starGeom, material: starMat } = createStarfield(2000);
    const starfield = new THREE.Points(starGeom, starMat);
    starfield.name = 'starfield';
    starfield.raycast = () => {}; // Exclude starfield from raycasting interactions
    scene.add(starfield);

    // 7. Earth Sphere Geometry & Texture initialization
    const sphereGeometry = new THREE.SphereGeometry(2, 64, 64);

    // Start with procedural high-quality textures immediately
    const proceduralTexture = createProceduralEarthTexture();
    proceduralTexture.anisotropy = maxAnisotropy;

    const proceduralNightLightsTexture = createProceduralNightLightsTexture();
    proceduralNightLightsTexture.anisotropy = maxAnisotropy;

    // Shader uniforms for night-side city lights
    const sunDirectionVector = mainSunLight.position.clone().normalize();
    const nightLightsUniforms = {
      uSunDirection: { value: sunDirectionVector },
      uNightLightsMap: { value: proceduralNightLightsTexture },
    };

    const sphereMaterial = new THREE.MeshStandardMaterial({
      map: proceduralTexture,
      roughness: 0.65,
      metalness: 0.1,
    });

    // Custom shader injection for realistic night-side city light emission
    sphereMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDirection = nightLightsUniforms.uSunDirection;
      shader.uniforms.uNightLightsMap = nightLightsUniforms.uNightLightsMap;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldNormal;
        varying vec2 vUvCoord;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_vertex>',
        `
        #include <uv_vertex>
        vUvCoord = uv;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldNormal;
        varying vec2 vUvCoord;
        uniform vec3 uSunDirection;
        uniform sampler2D uNightLightsMap;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        
        // Calculate dot product between surface world normal and sun direction
        float sunDot = dot(normalize(vWorldNormal), normalize(uSunDirection));
        
        // City lights activate smoothly as the surface rotates into darkness
        float nightFactor = smoothstep(0.06, -0.14, sunDot);
        
        // Sample city lights map
        vec4 nightLightsTex = texture2D(uNightLightsMap, vUvCoord);
        
        // Warm golden-amber illumination boost for realistic urban glow
        vec3 cityLightColor = nightLightsTex.rgb * vec3(1.22, 1.0, 0.72);
        
        // Faint deep indigo night-side ambient shade so geographic detail remains faintly visible
        float nightShade = smoothstep(0.08, -0.25, sunDot);
        vec3 nightAmbientFill = vec3(0.018, 0.028, 0.052) * nightShade;
        
        totalEmissiveRadiance += cityLightColor * nightFactor * 1.5 + nightAmbientFill;
        `
      );
    };

    const earthMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    earthMesh.rotation.z = AXIAL_TILT_RAD;
    scene.add(earthMesh);

    // 7b. Capital City Markers Layer (attached directly to Earth sphere so markers rotate seamlessly with Earth)
    const capitalsGroup = createCapitalMarkersGroup(countryFeatures, 2.0);
    earthMesh.add(capitalsGroup);

    // 7c. Geographic Country Boundaries Layer (follows curvature of Earth at radius ~2.003)
    const countryBoundaries = createCountryBoundaries(2.0);
    earthMesh.add(countryBoundaries);

    // 8. Realistic Cloud Sphere Layer (radius 2.015, slightly above Earth surface)
    const cloudGeometry = new THREE.SphereGeometry(2.015, 64, 64);
    const proceduralCloudTexture = createProceduralCloudTexture();
    proceduralCloudTexture.anisotropy = maxAnisotropy;

    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: proceduralCloudTexture,
      transparent: true,
      opacity: 0.72,
      blending: THREE.NormalBlending,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0.0,
    });

    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.name = 'cloudMesh';
    cloudMesh.raycast = () => {}; // Exclude clouds from raycasting interactions
    earthMesh.add(cloudMesh);

    // 9. Subtle Atmospheric Layer (Rayleigh scattering rim glow)
    const {
      geometry: atmosGeom,
      material: atmosMat,
      mesh: atmosphereMesh,
    } = createAtmosphereGlow(2.0, sunDirectionVector);
    earthMesh.add(atmosphereMesh);

    // Attempt loading NASA public domain Earth, cloud & night-lights textures with graceful fallbacks
    const textureLoader = new THREE.TextureLoader();
    const publicDomainEarthTextureUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/land_ocean_ice_cloud_2048.jpg';
    const publicDomainCloudTextureUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_2048.png';
    const publicDomainNightLightsTextureUrl =
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_lights_2048.png';

    textureLoader.load(
      publicDomainEarthTextureUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.anisotropy = maxAnisotropy;
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedTexture.generateMipmaps = true;
        loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        sphereMaterial.map = loadedTexture;
        sphereMaterial.needsUpdate = true;
        proceduralTexture.dispose();
      },
      undefined,
      () => {
        console.log('Using procedural Earth texture.');
      }
    );

    textureLoader.load(
      publicDomainCloudTextureUrl,
      (loadedCloudTexture) => {
        loadedCloudTexture.colorSpace = THREE.SRGBColorSpace;
        loadedCloudTexture.anisotropy = maxAnisotropy;
        loadedCloudTexture.wrapS = THREE.RepeatWrapping;
        loadedCloudTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedCloudTexture.generateMipmaps = true;
        loadedCloudTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedCloudTexture.magFilter = THREE.LinearFilter;
        cloudMaterial.map = loadedCloudTexture;
        cloudMaterial.needsUpdate = true;
        proceduralCloudTexture.dispose();
      },
      undefined,
      () => {
        console.log('Using procedural Cloud texture.');
      }
    );

    textureLoader.load(
      publicDomainNightLightsTextureUrl,
      (loadedNightLightsTexture) => {
        loadedNightLightsTexture.colorSpace = THREE.SRGBColorSpace;
        loadedNightLightsTexture.anisotropy = maxAnisotropy;
        loadedNightLightsTexture.wrapS = THREE.RepeatWrapping;
        loadedNightLightsTexture.wrapT = THREE.ClampToEdgeWrapping;
        loadedNightLightsTexture.generateMipmaps = true;
        loadedNightLightsTexture.minFilter = THREE.LinearMipmapLinearFilter;
        loadedNightLightsTexture.magFilter = THREE.LinearFilter;
        nightLightsUniforms.uNightLightsMap.value = loadedNightLightsTexture;
        sphereMaterial.needsUpdate = true;
        proceduralNightLightsTexture.dispose();
      },
      undefined,
      () => {
        console.log('Using procedural Night Lights texture.');
      }
    );

    setIsLoaded(true);

    // 10. Country & Capital Click/Tap Selection Raycasting System
    const raycaster = new THREE.Raycaster();
    const _scratchRayMouse = new THREE.Vector2();
    const _scratchHitPointLocal = new THREE.Vector3();
    const _scratchWorldPos = new THREE.Vector3();
    const _scratchCamNorm = new THREE.Vector3();
    const _scratchPointNorm = new THREE.Vector3();
    const _scratchProjected = new THREE.Vector3();

    // Cache reduced motion preference to avoid calling window.matchMedia on every frame
    let prefersReducedMotion = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion = motionQuery.matches;
    }

    let currentHighlightGroup = null;
    let neighborHighlightGroups = [];
    let selectedLocationMarker = null;
    let activeHoverGroups = [];
    let currentHoveredFeature = null;

    const createSelectedLocationMarker = (feature) => {
      const center = getFeatureCenter(feature);
      if (!center) return null;

      const radius = 2.008; // Positioned slightly above surface fill and geometry
      const pos = latLonToVector3(center.lat, center.lon, radius);

      const markerGroup = new THREE.Group();
      markerGroup.name = 'SelectedLocationMarker';
      markerGroup.position.copy(pos);

      const normal = pos.clone().normalize();
      markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

      // 1. Outer subtle glowing aura ring
      const auraGeom = new THREE.RingGeometry(0.024, 0.036, 32);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8, // Refined sky-blue geographic accent
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const auraMesh = new THREE.Mesh(auraGeom, auraMat);

      // 2. Precision inner target ring
      const ringGeom = new THREE.RingGeometry(0.012, 0.020, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.80,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);

      // 3. Center bright luminous dot
      const dotGeom = new THREE.CircleGeometry(0.007, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xf8fafc, // Crisp slate-50 white dot
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });
      const dotMesh = new THREE.Mesh(dotGeom, dotMat);

      // 4. Subtle cardinal crosshair tick marks
      const crosshairGroup = new THREE.Group();
      const tickGeom = new THREE.PlaneGeometry(0.002, 0.008);
      const tickMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
      });

      const tickN = new THREE.Mesh(tickGeom, tickMat);
      tickN.position.set(0, 0.028, 0);

      const tickS = new THREE.Mesh(tickGeom, tickMat);
      tickS.position.set(0, -0.028, 0);

      const tickE = new THREE.Mesh(tickGeom, tickMat);
      tickE.rotation.z = Math.PI / 2;
      tickE.position.set(0.028, 0, 0);

      const tickW = new THREE.Mesh(tickGeom, tickMat);
      tickW.rotation.z = Math.PI / 2;
      tickW.position.set(-0.028, 0, 0);

      crosshairGroup.add(tickN, tickS, tickE, tickW);

      markerGroup.add(auraMesh);
      markerGroup.add(ringMesh);
      markerGroup.add(dotMesh);
      markerGroup.add(crosshairGroup);

      markerGroup.userData = {
        auraMesh,
        ringMesh,
        dotMesh,
      };

      return markerGroup;
    };

    const clearSelection = () => {
      if (currentHighlightGroup) {
        earthMesh.remove(currentHighlightGroup);
        currentHighlightGroup.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        currentHighlightGroup = null;
      }

      if (neighborHighlightGroups.length > 0) {
        neighborHighlightGroups.forEach((group) => {
          earthMesh.remove(group);
          group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        });
        neighborHighlightGroups = [];
      }

      if (selectedLocationMarker) {
        earthMesh.remove(selectedLocationMarker);
        selectedLocationMarker.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        selectedLocationMarker = null;
      }

      // Reset capital markers styling and hide all capital markers when unselected
      if (capitalsGroup) {
        capitalsGroup.children.forEach((marker) => {
          marker.visible = false;
          if (marker.userData?.coreMesh) {
            marker.userData.coreMesh.material.color.setHex(0x38bdf8);
            marker.scale.set(1.0, 1.0, 1.0);
          }
        });
      }
    };
    clearSelectionRef.current = clearSelection;

    const clearHoverHighlight = () => {
      activeHoverGroups.forEach((item) => {
        item.isFadingOut = true;
      });
      currentHoveredFeature = null;
    };

    const updateHoverHighlight = (feature) => {
      // If feature is null or is the currently selected country, fade out existing hover highlights
      if (!feature || isSameFeature(feature, selectedCountryRef.current)) {
        clearHoverHighlight();
        return;
      }

      // If already displaying hover highlight for this feature and it's active, keep it
      if (isSameFeature(feature, currentHoveredFeature)) {
        const activeItem = activeHoverGroups.find((i) => !i.isFadingOut && isSameFeature(i.feature, feature));
        if (activeItem) return;
      }

      // Mark previous hover highlights to fade out
      clearHoverHighlight();

      // Create new translucent hover highlight with starting opacity 0 for smooth fade-in
      const hoverGroup = createCountryHighlightGroup(feature, 2.0, {
        lineColor: 0x93c5fd,
        lineOpacity: 0.0,
        fillColor: 0x38bdf8,
        fillOpacity: 0.0,
        groupName: 'CountryHoverHighlight',
      });

      earthMesh.add(hoverGroup);

      activeHoverGroups.push({
        group: hoverGroup,
        feature: feature,
        targetLineOpacity: 0.52,
        targetFillOpacity: 0.12,
        currentLineOpacity: 0.0,
        currentFillOpacity: 0.0,
        isFadingOut: false,
      });

      currentHoveredFeature = feature;
    };

    const selectCountryFeature = (feature) => {
      clearSelection();
      if (isSameFeature(feature, currentHoveredFeature)) {
        clearHoverHighlight();
      }
      if (!feature) return;

      const highlightGroup = createCountryHighlightGroup(feature, 2.0);
      earthMesh.add(highlightGroup);
      currentHighlightGroup = highlightGroup;

      // Subtle secondary emphasis for neighboring countries
      const neighborFeatures = getNeighborFeatures(feature);
      neighborHighlightGroups = neighborFeatures.map((nFeat) => {
        const nGroup = createCountryHighlightGroup(nFeat, 2.0, {
          lineColor: 0x38bdf8,
          lineOpacity: 0.35,
          fillColor: 0x0284c7,
          fillOpacity: 0.06,
          groupName: 'NeighborHighlight',
        });
        earthMesh.add(nGroup);
        return nGroup;
      });

      const marker = createSelectedLocationMarker(feature);
      if (marker) {
        earthMesh.add(marker);
        selectedLocationMarker = marker;
      }

      // Display and emphasize ONLY the selected country's capital marker
      const details = getCountryDetails(feature);
      if (details && capitalsGroup) {
        capitalsGroup.children.forEach((marker) => {
          const isMatch =
            (marker.userData?.countryName &&
              details.name &&
              marker.userData.countryName.toLowerCase() === details.name.toLowerCase()) ||
            marker.userData?.feature === feature;

          if (
            isMatch &&
            details.capitalLat !== undefined &&
            details.capitalLon !== undefined &&
            !(details.capitalLat === 0 && details.capitalLon === 0) &&
            details.capital !== 'Capital City' &&
            details.capital !== 'No officially designated capital'
          ) {
            marker.visible = true;
            if (marker.userData?.coreMesh) {
              marker.userData.coreMesh.material.color.setHex(0x38bdf8);
            }
            marker.scale.set(1.2, 1.2, 1.2);
          } else {
            marker.visible = false;
          }
        });
      }
    };
    selectCountryFeatureRef.current = selectCountryFeature;

    let navAnimId = null;

    const cancelNavAnimation = () => {
      if (navAnimId !== null) {
        cancelAnimationFrame(navAnimId);
        navAnimId = null;
      }
      inertiaVel = { x: 0, y: 0 };
      dragSamples = [];
      isPointerDown = false;
      if (controls) {
        if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
        if (controls._panOffset) controls._panOffset.set(0, 0, 0);
      }
    };

    // Immediately interrupt automatic camera navigation if the user drags, scrolls, or zooms
    controls.addEventListener('start', cancelNavAnimation);

    const rotateToFeature = (feature) => {
      if (!feature) return;

      cancelNavAnimation();
      if (controls) {
        if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
        if (controls._panOffset) controls._panOffset.set(0, 0, 0);
      }

      const details = getCountryDetails(feature);
      let targetLat = details?.capitalLat;
      let targetLon = details?.capitalLon;

      if (targetLat === undefined || targetLon === undefined || (targetLat === 0 && targetLon === 0)) {
        const center = getFeatureCenter(feature);
        targetLat = center.lat;
        targetLon = center.lon;
      }

      const startPos = camera.position.clone();
      const startDist = startPos.length();
      const startNorm = startPos.clone().normalize();

      // Maintain comfortable viewing zoom: gently zoom in if far out, or preserve current framing
      let targetDist = startDist;
      if (startDist > 5.5) {
        targetDist = 4.8;
      } else if (startDist < 3.2) {
        targetDist = 3.5;
      }

      const targetUnitVecLocal = latLonToVector3(targetLat, targetLon, 1.0).normalize();
      const targetUnitVec = targetUnitVecLocal.clone().applyEuler(earthMesh.rotation).normalize();

      // Compute quaternions for spherical great-circle rotation arc
      const startQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), startNorm);
      const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetUnitVec);

      const duration = 650; // Controlled 650ms responsive navigation transition
      const startTime = performance.now();

      const animateCameraStep = () => {
        inertiaVel = { x: 0, y: 0 };
        if (controls) {
          if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
          if (controls._panOffset) controls._panOffset.set(0, 0, 0);
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / duration);

        // Professional smooth cubic ease-in-out curve (zero initial acceleration bump, gentle settling)
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentQ = new THREE.Quaternion().slerpQuaternions(startQ, targetQ, ease);
        const currentDir = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQ);
        const currentDist = THREE.MathUtils.lerp(startDist, targetDist, ease);

        camera.position.copy(currentDir).multiplyScalar(currentDist);
        controls.update();

        if (progress < 1.0) {
          navAnimId = requestAnimationFrame(animateCameraStep);
        } else {
          navAnimId = null;
          inertiaVel = { x: 0, y: 0 };
          if (controls) {
            if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
            if (controls._panOffset) controls._panOffset.set(0, 0, 0);
          }
          if (lastPointerPosRef.current) {
            updateHoverState(lastPointerPosRef.current.x, lastPointerPosRef.current.y);
          }
        }
      };

      navAnimId = requestAnimationFrame(animateCameraStep);
    };
    rotateToFeatureRef.current = rotateToFeature;

    const resetToInitialView = () => {
      cancelNavAnimation();
      clearSelection();
      clearHoverHighlight();
      setCapitalLabel({ visible: false, x: 0, y: 0, capitalName: '', countryName: '' });

      // Ensure active drag state and rotation velocity are completely wiped
      isPointerDown = false;
      dragSamples = [];
      inertiaVel = { x: 0, y: 0 };
      if (controls) {
        if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
        if (controls._panOffset) controls._panOffset.set(0, 0, 0);
      }

      const startPos = camera.position.clone();
      const startDist = startPos.length();
      const startNorm = startPos.clone().normalize();

      // Return to initial camera orientation centered on Pakistan (30.0° N, 69.5° E)
      const targetLat = 30.0;
      const targetLon = 69.5;
      const targetDist = 6.0;

      const targetUnitVecLocal = latLonToVector3(targetLat, targetLon, 1.0).normalize();
      const targetUnitVec = targetUnitVecLocal.clone().applyEuler(earthMesh.rotation).normalize();

      const startQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), startNorm);
      const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetUnitVec);

      const duration = 700;
      const startTime = performance.now();

      const animateCameraStep = () => {
        // Zero out rotation momentum on every step of reset transition
        inertiaVel = { x: 0, y: 0 };
        if (controls) {
          if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
          if (controls._panOffset) controls._panOffset.set(0, 0, 0);
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / duration);

        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentQ = new THREE.Quaternion().slerpQuaternions(startQ, targetQ, ease);
        const currentDir = new THREE.Vector3(0, 0, 1).applyQuaternion(currentQ);
        const currentDist = THREE.MathUtils.lerp(startDist, targetDist, ease);

        camera.position.copy(currentDir).multiplyScalar(currentDist);
        controls.update();

        if (progress < 1.0) {
          navAnimId = requestAnimationFrame(animateCameraStep);
        } else {
          navAnimId = null;
          // Final safety wipe of momentum variables upon arrival
          inertiaVel = { x: 0, y: 0 };
          if (controls) {
            if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
            if (controls._panOffset) controls._panOffset.set(0, 0, 0);
          }
          if (lastPointerPosRef.current) {
            updateHoverState(lastPointerPosRef.current.x, lastPointerPosRef.current.y);
          }
        }
      };

      navAnimId = requestAnimationFrame(animateCameraStep);
    };
    resetToInitialViewRef.current = resetToInitialView;

    const zoomIn = () => {
      cancelNavAnimation();
      const currentDist = camera.position.length();
      const targetDist = Math.max(2.4, currentDist * 0.75);
      const startDist = currentDist;
      const duration = 200;
      const startTime = performance.now();

      const animateZoom = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const d = THREE.MathUtils.lerp(startDist, targetDist, ease);
        camera.position.setLength(d);
        controls.update();
        if (progress < 1.0) {
          navAnimId = requestAnimationFrame(animateZoom);
        } else {
          navAnimId = null;
        }
      };
      navAnimId = requestAnimationFrame(animateZoom);
    };
    zoomInRef.current = zoomIn;

    const zoomOut = () => {
      cancelNavAnimation();
      const currentDist = camera.position.length();
      const targetDist = Math.min(12.0, currentDist * 1.35);
      const startDist = currentDist;
      const duration = 200;
      const startTime = performance.now();

      const animateZoom = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const d = THREE.MathUtils.lerp(startDist, targetDist, ease);
        camera.position.setLength(d);
        controls.update();
        if (progress < 1.0) {
          navAnimId = requestAnimationFrame(animateZoom);
        } else {
          navAnimId = null;
        }
      };
      navAnimId = requestAnimationFrame(animateZoom);
    };
    zoomOutRef.current = zoomOut;

    const lastPointerPosRef = { current: null };

    /**
     * Single source of truth for country detection at a screen pointer coordinate (clientX, clientY).
     * Reused for BOTH click selection and hover detection.
     */
    const getCountryAtPointer = (clientX, clientY) => {
      const domEl = renderer.domElement;
      if (!domEl) return null;

      // Ignore if pointer is over an overlay UI element (Info Panel, Search Bar, Navigation, etc.)
      if (typeof document !== 'undefined' && document.elementFromPoint) {
        const topEl = document.elementFromPoint(clientX, clientY);
        if (topEl && topEl !== domEl && topEl !== container && !container.contains(topEl)) {
          return null;
        }
      }

      const rect = domEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;

      _scratchRayMouse.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      camera.updateMatrixWorld(true);
      earthMesh.updateMatrixWorld(true);

      raycaster.setFromCamera(_scratchRayMouse, camera);

      // 1. Priority 1: Check 3D capital city markers
      if (capitalsGroup) {
        const capitalIntersects = raycaster.intersectObjects(capitalsGroup.children, true);
        if (capitalIntersects.length > 0) {
          const hitObj = capitalIntersects[0].object;
          const hitFeature = hitObj.userData?.feature || hitObj.parent?.userData?.feature;
          if (hitFeature) {
            return hitFeature;
          }
        }
      }

      // 2. Priority 2: Raycast against Earth sphere surface
      const intersects = raycaster.intersectObject(earthMesh, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        _scratchHitPointLocal.copy(hit.point);
        earthMesh.worldToLocal(_scratchHitPointLocal);
        const coords = vector3ToLatLon(_scratchHitPointLocal, 2.0);
        return findCountryAtLonLat(coords.lon, coords.lat) || null;
      }

      return null;
    };

    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;
    let isPointerDown = false;
    let dragSamples = [];
    let inertiaVel = { x: 0, y: 0 };
    let lastHoveredFeature = null;
    let hoverFrameId = null;

    const updateHoverState = (clientX, clientY) => {
      if (clientX === undefined || clientY === undefined) return;
      const feature = getCountryAtPointer(clientX, clientY);
      updateHoverHighlight(feature);
      if (renderer && renderer.domElement) {
        renderer.domElement.style.cursor = feature ? 'pointer' : 'default';
      }
      if (!isSameFeature(feature, lastHoveredFeature)) {
        lastHoveredFeature = feature;
        setHoveredCountry(feature);
        if (onCountryHoverRef.current) {
          onCountryHoverRef.current(feature);
        }
      }
    };

    const onPointerDown = (e) => {
      cancelNavAnimation();
      isPointerDown = true;
      inertiaVel = { x: 0, y: 0 };
      dragSamples = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
      // Dynamically adjust OrbitControls rotateSpeed: reduced for controlled, precise touch dragging, standard for desktop mouse
      if (e.pointerType === 'touch') {
        controls.rotateSpeed = 0.28;
      } else {
        controls.rotateSpeed = 0.75;
      }
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownTime = Date.now();
    };

    const onTouchStart = () => {
      cancelNavAnimation();
      controls.rotateSpeed = 0.28;
      inertiaVel = { x: 0, y: 0 };
    };

    const onPointerUp = (e) => {
      isPointerDown = false;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const duration = Date.now() - pointerDownTime;

      // Concise tap/click (not a drag rotation)
      const maxTapDist = e.pointerType === 'touch' ? 16 : 8;
      if (dist < maxTapDist && duration < 500) {
        inertiaVel = { x: 0, y: 0 };
        dragSamples = [];
        const feature = getCountryAtPointer(e.clientX, e.clientY);

        if (feature) {
          selectCountryFeature(feature);
          if (onCountrySelect) onCountrySelect(feature);
        } else {
          clearSelection();
          if (onCountrySelect) onCountrySelect(null);
        }
      } else {
        // Drag rotation ended; compute smooth inertial momentum from recent drag trajectory
        const now = Date.now();
        const recentSamples = dragSamples.filter((s) => now - s.time <= 100);

        if (recentSamples.length >= 2) {
          const first = recentSamples[0];
          const last = recentSamples[recentSamples.length - 1];
          const dt = last.time - first.time;

          if (dt > 12) {
            const vx = (last.x - first.x) / dt; // px/ms
            const vy = (last.y - first.y) / dt; // px/ms
            const rawSpeed = Math.hypot(vx, vy);

            // Deadzone threshold: ignore tiny twitches or static releases
            const minSpeed = 0.08; // px/ms
            // Max speed cap: prevent crazy spinning
            const maxSpeed = 1.5; // px/ms

            if (rawSpeed >= minSpeed) {
              const speed = Math.min(rawSpeed, maxSpeed);
              const speedFactor = speed / rawSpeed;
              const clampedVx = vx * speedFactor;
              const clampedVy = vy * speedFactor;

              // Convert pixel velocity (px/ms) to radians per frame (~16.67ms)
              const frameMs = 16.67;
              const domHeight = renderer?.domElement?.clientHeight || 600;
              const currentRotateSpeed = controls.rotateSpeed;

              // Subtle factor for natural momentum feel
              const momentumFactor = 0.22;

              const radX = (2 * Math.PI * (clampedVx * frameMs) / domHeight) * currentRotateSpeed * momentumFactor;
              const radY = (2 * Math.PI * (clampedVy * frameMs) / domHeight) * currentRotateSpeed * momentumFactor;

              inertiaVel = { x: radX, y: radY };
            }
          }
        }
        dragSamples = [];
        updateHoverState(e.clientX, e.clientY);
      }
    };

    const onPointerMove = (e) => {
      // Record drag samples for recent velocity calculation when pointer is pressed down
      if (isPointerDown && e.clientX !== undefined && e.clientY !== undefined) {
        const now = Date.now();
        dragSamples.push({ x: e.clientX, y: e.clientY, time: now });
        while (dragSamples.length > 0 && now - dragSamples[0].time > 120) {
          dragSamples.shift();
        }
      }

      if (e.pointerType === 'touch') return;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      // Suppress hover updates during active dragging (mouse button pressed down)
      if (e.buttons !== 0) return;

      if (hoverFrameId) return;

      hoverFrameId = requestAnimationFrame(() => {
        hoverFrameId = null;
        if (lastPointerPosRef.current) {
          updateHoverState(lastPointerPosRef.current.x, lastPointerPosRef.current.y);
        }
      });
    };

    const onPointerLeave = () => {
      isPointerDown = false;
      dragSamples = [];
      if (hoverFrameId) {
        cancelAnimationFrame(hoverFrameId);
        hoverFrameId = null;
      }
      lastPointerPosRef.current = null;
      clearHoverHighlight();
      if (renderer && renderer.domElement) {
        renderer.domElement.style.cursor = 'default';
      }
      if (lastHoveredFeature !== null) {
        lastHoveredFeature = null;
        setHoveredCountry(null);
        if (onCountryHoverRef.current) {
          onCountryHoverRef.current(null);
        }
      }
    };

    const onControlsChange = () => {
      if (lastPointerPosRef.current) {
        updateHoverState(lastPointerPosRef.current.x, lastPointerPosRef.current.y);
      }
    };
    controls.addEventListener('change', onControlsChange);

    const onWheel = () => {
      cancelNavAnimation();
    };

    const onTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const domElement = renderer.domElement;
    domElement.style.touchAction = 'none';
    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerleave', onPointerLeave);
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    domElement.addEventListener('wheel', onWheel, { passive: true });

    // 11. requestAnimationFrame Render Loop
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Extremely slow, subtle cloud movement independent of Earth surface
      cloudMesh.rotation.y += 0.00015;

      // Real-time astronomical subsolar direction calculated from current UTC date and time
      const currentSunDir = getRealtimeSunVector(simulatedTimeRef.current);
      mainSunLight.position.copy(currentSunDir).multiplyScalar(20.0);
      nightLightsUniforms.uSunDirection.value.copy(currentSunDir);
      if (atmosMat.uniforms.uSunDirection) {
        atmosMat.uniforms.uSunDirection.value.copy(currentSunDir);
      }

      // Apply subtle inertial rotation velocity from recent drag and decelerate smoothly
      if (Math.abs(inertiaVel.x) > 0.00001 || Math.abs(inertiaVel.y) > 0.00001) {
        if (typeof controls.rotateLeft === 'function' && typeof controls.rotateUp === 'function') {
          controls.rotateLeft(inertiaVel.x);
          controls.rotateUp(inertiaVel.y);
        }
        inertiaVel.x *= 0.88;
        inertiaVel.y *= 0.88;
        if (Math.hypot(inertiaVel.x, inertiaVel.y) < 0.00001) {
          inertiaVel.x = 0;
          inertiaVel.y = 0;
        }
      }

      // Smooth interaction update with inertia damping
      controls.update();

      // Smooth hover highlight opacity fading
      const lerpSpeed = 0.2;
      for (let i = activeHoverGroups.length - 1; i >= 0; i--) {
        const item = activeHoverGroups[i];
        const targetLine = item.isFadingOut ? 0 : item.targetLineOpacity;
        const targetFill = item.isFadingOut ? 0 : item.targetFillOpacity;

        item.currentLineOpacity += (targetLine - item.currentLineOpacity) * lerpSpeed;
        item.currentFillOpacity += (targetFill - item.currentFillOpacity) * lerpSpeed;

        item.group.traverse((child) => {
          if (child.material) {
            if (child.isMesh) {
              child.material.opacity = item.currentFillOpacity;
            } else {
              child.material.opacity = item.currentLineOpacity;
            }
          }
        });

        if (item.isFadingOut && item.currentLineOpacity < 0.005 && item.currentFillOpacity < 0.005) {
          earthMesh.remove(item.group);
          item.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
          activeHoverGroups.splice(i, 1);
        }
      }

      // Subtle breathing animation for selected country location marker aura ring
      const animTime = Date.now() * 0.001;
      if (selectedLocationMarker) {
        const auraScale = prefersReducedMotion ? 1.0 : 1 + Math.sin(animTime * 2.0) * 0.08;
        const targetMesh = selectedLocationMarker.userData?.auraMesh || selectedLocationMarker.children[0];
        if (targetMesh) {
          targetMesh.scale.set(auraScale, auraScale, 1);
        }
      }

      // Subtle breathing pulse for active capital city marker ring
      if (capitalsGroup) {
        capitalsGroup.children.forEach((capMarker) => {
          if (capMarker.visible && capMarker.userData?.ringMesh) {
            const capitalPulse = prefersReducedMotion ? 1.0 : 1 + Math.sin(animTime * 2.2) * 0.06;
            capMarker.userData.ringMesh.scale.set(capitalPulse, capitalPulse, 1);
          }
        });
      }

      // Screen space projection for active capital city label overlay
      if (selectedCountryRef.current && capitalsGroup) {
        const details = getCountryDetails(selectedCountryRef.current);
        if (details) {
          const selectedMarker = capitalsGroup.children.find(
            (m) =>
              (m.userData?.countryName &&
                details.name &&
                m.userData.countryName.toLowerCase() === details.name.toLowerCase()) ||
              m.userData?.feature === selectedCountryRef.current
          );

          if (selectedMarker) {
            selectedMarker.getWorldPosition(_scratchWorldPos);

            _scratchCamNorm.copy(camera.position).normalize();
            _scratchPointNorm.copy(_scratchWorldPos).normalize();
            const dot = _scratchPointNorm.dot(_scratchCamNorm);

            if (dot > 0.08) {
              _scratchProjected.copy(_scratchWorldPos).project(camera);
              const rect = renderer.domElement.getBoundingClientRect();
              const x = (_scratchProjected.x * 0.5 + 0.5) * rect.width;
              const y = (-_scratchProjected.y * 0.5 + 0.5) * rect.height;

              setCapitalLabel({
                visible: true,
                x,
                y,
                capitalName: details.capital,
                countryName: details.name,
              });
            } else {
              setCapitalLabel((prev) => (prev.visible ? { ...prev, visible: false } : prev));
            }
          } else {
            setCapitalLabel((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          }
        }
      } else {
        setCapitalLabel((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }

      if (onCoordinatesUpdate) {
        const centerCoords = vector3ToLatLon(camera.position, 2.0);
        onCoordinatesUpdate(centerCoords);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Signal Earth canvas ready after initial frame render
    requestAnimationFrame(() => {
      setIsLoaded(true);
      if (onReadyRef.current) onReadyRef.current();
    });

    // 9. Resize Handling via ResizeObserver with RAF throttling
    let resizeFrameId = null;
    const handleResize = () => {
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const newWidth = containerRef.current.clientWidth || window.innerWidth;
        const newHeight = containerRef.current.clientHeight || window.innerHeight;

        const currentAspect = newWidth / newHeight;
        camera.aspect = currentAspect;
        // On narrow/portrait screens (aspect < 1), adjust FOV so Earth stays perfectly centered and fitted
        camera.fov = currentAspect < 1 ? Math.min(65, 45 / currentAspect) : 45;
        camera.updateProjectionMatrix();

        renderer.setSize(newWidth, newHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // 10. Proper Cleanup
    return () => {
      cancelNavAnimation();
      controls.removeEventListener('start', cancelNavAnimation);
      controls.removeEventListener('change', onControlsChange);
      cancelAnimationFrame(animationFrameId);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeObserver.disconnect();

      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerleave', onPointerLeave);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('wheel', onWheel);
      if (hoverFrameId) cancelAnimationFrame(hoverFrameId);
      clearSelection();
      activeHoverGroups.forEach((item) => {
        earthMesh.remove(item.group);
        item.group.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
      });
      activeHoverGroups = [];

      controls.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      if (sphereMaterial.map) sphereMaterial.map.dispose();
      proceduralNightLightsTexture.dispose();
      if (nightLightsUniforms.uNightLightsMap.value) {
        nightLightsUniforms.uNightLightsMap.value.dispose();
      }

      cloudGeometry.dispose();
      cloudMaterial.dispose();
      if (cloudMaterial.map) cloudMaterial.map.dispose();

      atmosGeom.dispose();
      atmosMat.dispose();

      starGeom.dispose();
      starMat.dispose();
      if (starMat.map) starMat.map.dispose();
      if (starMat.uniforms?.pointTexture?.value) starMat.uniforms.pointTexture.value.dispose();

      renderer.dispose();

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
    } catch (err) {
      console.error('EarthCanvas initialization error:', err);
      const friendlyMsg = 'Unable to initialize 3D WebGL graphics. Please verify WebGL is enabled in your browser settings.';
      setInitError(friendlyMsg);
      if (onErrorRef.current) onErrorRef.current(friendlyMsg);
    }
  }, []);

  // Sync selectedCountry from external props (e.g., search bar or panel close button)
  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
    if (!selectedCountry) {
      if (clearSelectionRef.current) clearSelectionRef.current();
    } else {
      if (selectCountryFeatureRef.current) {
        selectCountryFeatureRef.current(selectedCountry);
      }
      if (rotateToFeatureRef.current) {
        rotateToFeatureRef.current(selectedCountry);
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    onCountryHoverRef.current = onCountryHover;
  }, [onCountryHover]);

  useEffect(() => {
    simulatedTimeRef.current = simulatedTime;
  }, [simulatedTime]);

  // Handle explicit reset trigger to return to initial Pakistan orientation
  useEffect(() => {
    if (resetTrigger > 0 && resetToInitialViewRef.current) {
      resetToInitialViewRef.current();
    }
  }, [resetTrigger]);

  // Handle explicit zoom in trigger
  useEffect(() => {
    if (zoomInTrigger > 0 && zoomInRef.current) {
      zoomInRef.current();
    }
  }, [zoomInTrigger]);

  // Handle explicit zoom out trigger
  useEffect(() => {
    if (zoomOutTrigger > 0 && zoomOutRef.current) {
      zoomOutRef.current();
    }
  }, [zoomOutTrigger]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Three.js WebGL Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Error Fallback */}
      {initError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 p-6 text-center text-slate-300">
          <div className="max-w-sm flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">3D Graphics Initialization Failed</h3>
            <p className="text-xs text-slate-400">{initError}</p>
          </div>
        </div>
      )}

      {/* Floating Capital City HUD Label Overlay */}
      {capitalLabel.visible && (
        <div
          className="absolute pointer-events-none z-20 transform -translate-x-1/2 -translate-y-full -mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-950/90 border border-cyan-400/60 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.35)] backdrop-blur-md text-cyan-200 text-xs font-semibold tracking-wide transition-all duration-75"
          style={{
            left: `${capitalLabel.x}px`,
            top: `${capitalLabel.y}px`,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="text-white font-bold">🏛️ {capitalLabel.capitalName}</span>
          <span className="text-[10px] text-cyan-300/80 font-mono">({capitalLabel.countryName})</span>
        </div>
      )}
    </div>
  );
}
