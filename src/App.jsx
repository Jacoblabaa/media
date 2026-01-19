import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Vec3, Matrix4, PerspectiveSystem, Primitive3D, MathUtils } from './utils/math3d.js';
import { Gizmo3D } from './utils/gizmo3d.js';
import { IntersectionDetector, DepthSorter } from './utils/intersections.js';
import { FoundPerspective, ColorExtractor, PoseTemplates } from './systems/imageAnalysis.js';
import {
  HumanLandmarks,
  HumanLimbSegments,
  QuadrupedLandmarks,
  QuadrupedLimbSegments,
  QuadrupedTypes,
  AnatomyUtils
} from './systems/anatomy.js';
// New professional systems
import { PerspectiveEngine, HorizonLine, VanishingPoint } from './systems/perspective.js';
import { Mannequin, BodyPartForms } from './systems/mannequin.js';
import { FormRenderer, renderPerspectiveGrid } from './systems/renderer.js';
import './App.css';

export default function App() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  // Canvas state
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [useBlankCanvas, setUseBlankCanvas] = useState(true);
  const [canvasColor, setCanvasColor] = useState('#2a2a2a');

  // Main mode
  const [activeTab, setActiveTab] = useState('3d-forms');

  // 3D Forms
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formType, setFormType] = useState('cube');
  const [placingForm, setPlacingForm] = useState(false);
  const [formPreviewPos, setFormPreviewPos] = useState(null);
  const [manipulationMode, setManipulationMode] = useState('move'); // 'move', 'rotate', 'scale'
  const [show3DAxes, setShow3DAxes] = useState(true);
  const [showConstruction, setShowConstruction] = useState(true);
  const [showGroundPlane, setShowGroundPlane] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [lightDirection, setLightDirection] = useState({ x: -0.5, y: -1, z: -0.5 }); // Directional light
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showIntersections, setShowIntersections] = useState(true);
  const [useDepthSorting, setUseDepthSorting] = useState(true);
  const [booleanMode, setBooleanMode] = useState(false);
  const [booleanSelection, setBooleanSelection] = useState([]); // Array of form indices
  const [booleanOperation, setBooleanOperation] = useState(null); // 'union', 'subtract', 'intersect'

  // Gizmo
  const gizmoRef = useRef(new Gizmo3D());
  const [draggedGizmoAxis, setDraggedGizmoAxis] = useState(null);
  const [gizmoDragStart, setGizmoDragStart] = useState(null);

  // Camera controls
  const [cameraDistance, setCameraDistance] = useState(500);
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 });
  const [cameraPan, setCameraPan] = useState({ x: 0, y: 0 });

  // Perspective
  const [perspectiveType, setPerspectiveType] = useState('2pt');
  const [perspectiveSystem, setPerspectiveSystem] = useState(null);
  const [vanishingPoints, setVanishingPoints] = useState([]);
  const [editingVP, setEditingVP] = useState(false);
  const [draggedVP, setDraggedVP] = useState(null);
  const [showPerspectiveGrid, setShowPerspectiveGrid] = useState(true);
  const [gridDensity, setGridDensity] = useState(16);
  const [horizonY, setHorizonY] = useState(400);
  const [perspectiveLines, setPerspectiveLines] = useState([]);
  const [drawingPerspLine, setDrawingPerspLine] = useState(null);
  const [fisheyeStrength, setFisheyeStrength] = useState(3.0);

  // Found Perspective
  const foundPerspectiveRef = useRef(new FoundPerspective());
  const [foundPerspectiveMode, setFoundPerspectiveMode] = useState(false);
  const [foundPerspectiveDrawing, setFoundPerspectiveDrawing] = useState(null);

  // Image Analysis
  const [colorPalette, setColorPalette] = useState([]);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [showImageAnalysis, setShowImageAnalysis] = useState(false);

  // Anatomy
  const [anatomyMode, setAnatomyMode] = useState('human'); // 'human', 'quadruped'
  const [quadrupedType, setQuadrupedType] = useState(QuadrupedTypes.HORSE);
  const [landmarks, setLandmarks] = useState({});
  const [editingLandmark, setEditingLandmark] = useState(null);
  const [landmarkDepth, setLandmarkDepth] = useState(300); // Z-depth for 3D placement
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showMasses, setShowMasses] = useState(true);
  const [showProportions, setShowProportions] = useState(true);
  const [showCrossSections, setShowCrossSections] = useState(false);
  const [foreshortening, setForeshortening] = useState({});
  const [gestureLine, setGestureLine] = useState([]);
  const [isDrawingGesture, setIsDrawingGesture] = useState(false);
  const [showGesture, setShowGesture] = useState(true);
  const [proportionSystem, setProportionSystem] = useState('8-head-heroic');
  const [autoGenerateForms, setAutoGenerateForms] = useState(true); // Auto-build forms from landmarks
  const [landmarkForms, setLandmarkForms] = useState([]); // Forms generated from landmarks
  const [anatomyFormStyle, setAnatomyFormStyle] = useState('bridgman'); // 'basic', 'bridgman' (Bridgman/Loomis style)
  const [showCrossContours, setShowCrossContours] = useState(false); // Show cross-contour lines on forms

  // Composition
  const [compOverlay, setCompOverlay] = useState('none');
  const [showGoldenSpiral, setShowGoldenSpiral] = useState(false);
  const [spiralFlip, setSpiralFlip] = useState({ h: false, v: false });
  const [focalPoints, setFocalPoints] = useState([]);
  const [placingFocal, setPlacingFocal] = useState(false);
  const [showDynamicSymmetry, setShowDynamicSymmetry] = useState(false);
  const [showArmature, setShowArmature] = useState(false);

  // Educational - REMOVED

  // Measurements
  const [measurements, setMeasurements] = useState([]);
  const [measuring, setMeasuring] = useState(false);
  const [currentMeasure, setCurrentMeasure] = useState(null);

  // Interaction
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [analysisNotes, setAnalysisNotes] = useState([]);

  // Initialize perspective system
  useEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const ps = new PerspectiveSystem(perspectiveType, canvasSize.width, canvasSize.height);
    ps.setHorizon(horizonY);

    // Sync VPs: if React state is empty, use defaults from PerspectiveSystem
    // If React state has VPs, use those
    if (vanishingPoints.length === 0) {
      // Initialize React state with default VPs from the perspective system
      const defaultVPs = ps.vanishingPoints.map((vp, i) => ({
        ...vp,
        id: Date.now() + i
      }));
      setVanishingPoints(defaultVPs);
    } else {
      ps.setVanishingPoints(vanishingPoints);
    }

    ps.fisheyeStrength = fisheyeStrength;
    ps.distanceToCanvas = cameraDistance;
    setPerspectiveSystem(ps);
  }, [perspectiveType, canvasSize, horizonY, fisheyeStrength, cameraDistance]);

  // Keep PerspectiveSystem synced when VPs change (separate effect to avoid infinite loop)
  useEffect(() => {
    if (perspectiveSystem && vanishingPoints.length > 0) {
      perspectiveSystem.setVanishingPoints(vanishingPoints);
    }
  }, [vanishingPoints, perspectiveSystem]);

  // Create form renderer (memoized to avoid recreation)
  // IMPORTANT: Must be defined BEFORE the render useEffect that references it
  const formRenderer = useMemo(() => {
    if (!perspectiveSystem) return null;
    const renderer = new FormRenderer(perspectiveSystem);
    renderer.showEdges = true;
    renderer.showFaces = true;
    renderer.showCrossContours = showCrossContours;
    return renderer;
  }, [perspectiveSystem, showCrossContours]);

  // Create Mannequin instance (memoized) for Bridgman-style rendering
  // IMPORTANT: Must be defined BEFORE the render useEffect that references it
  const mannequinRef = useRef(null);
  const mannequin = useMemo(() => {
    if (!Object.keys(landmarks).length) return null;

    // Calculate head size from landmarks if available
    let headSize = 50;
    if (landmarks.crown && landmarks.chin) {
      const dx = landmarks.chin.x - landmarks.crown.x;
      const dy = landmarks.chin.y - landmarks.crown.y;
      const dz = (landmarks.chin.z || 300) - (landmarks.crown.z || 300);
      headSize = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const m = new Mannequin(8, { headSize: Math.max(30, headSize) });
    m.updateFromLandmarks(landmarks);
    mannequinRef.current = m;
    return m;
  }, [landmarks]);

  // Test cube removed - canvas starts blank as expected

  // Sync gizmo mode with manipulation mode
  useEffect(() => {
    if (gizmoRef.current) {
      gizmoRef.current.mode = manipulationMode;
    }
  }, [manipulationMode]);

  // Educational tip effects removed

  // Handle image upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          const scale = max / Math.max(w, h);
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
        }
        setCanvasSize({ width: w, height: h });
        setImage(img);
        setUseBlankCanvas(false);

        // Create image data for color analysis
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        setImageData(imgData);

        // Analyze image
        const palette = ColorExtractor.extractPalette(imgData, 6);
        setColorPalette(palette.map(c => ColorExtractor.rgbToHex(c.r, c.g, c.b)));

        const values = ColorExtractor.analyzeValues(imgData);
        const lightSource = ColorExtractor.detectLightSource(imgData, w, h);

        setImageAnalysis({
          values,
          lightSource,
          width: w,
          height: h
        });

        setShowColorPalette(true);

        // Reset everything
        setForms([]);
        setLandmarks({});
        setForeshortening({});
        setGestureLine([]);
        setVanishingPoints([]);
        setFocalPoints([]);
        setMeasurements([]);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // Get point from mouse/touch event
  const getPoint = useCallback((e) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * canvas.width / rect.width,
      y: (cy - rect.top) * canvas.height / rect.height
    };
  }, []);

  // Handle clicks
  const handleClick = useCallback((e) => {
    const pt = getPoint(e);

    // Placing 3D form
    if (placingForm && perspectiveSystem) {
      // Place form at clicked position in 3D space with constraints
      const x = Math.max(-canvasSize.width / 2 + 50, Math.min(canvasSize.width / 2 - 50, pt.x - canvasSize.width / 2));
      const y = Math.max(-canvasSize.height / 2 + 50, Math.min(canvasSize.height / 2 - 50, -(pt.y - canvasSize.height / 2)));

      const newForm = new Primitive3D(
        formType,
        new Vec3(x, y, 200),
        new Vec3(0, 0, 0),
        new Vec3(1, 1, 1)
      );
      newForm.id = Date.now(); // Add ID without spreading (preserves methods)
      setForms(prev => [...prev, newForm]);
      setPlacingForm(false);
      setSelectedForm(forms.length);
      setFormPreviewPos(null);
      return;
    }

    // Placing landmark
    if (editingLandmark) {
      // Convert screen coordinates to world coordinates for proper 3D placement
      const worldX = pt.x - canvasSize.width / 2;
      const worldY = -(pt.y - canvasSize.height / 2); // Flip Y for 3D space

      setLandmarks(prev => ({
        ...prev,
        [editingLandmark]: { x: worldX, y: worldY, z: landmarkDepth }
      }));
      setEditingLandmark(null);
      return;
    }

    // Placing vanishing point
    if (editingVP) {
      const colors = ['#ff5555', '#55ff55', '#5555ff', '#ffff55', '#ff55ff'];
      setVanishingPoints(prev => [...prev, {
        id: Date.now(),
        ...pt,
        color: colors[prev.length % colors.length]
      }]);
      setEditingVP(false);
      return;
    }

    // Placing focal point
    if (placingFocal) {
      setFocalPoints(prev => [...prev, { id: Date.now(), ...pt }]);
      setPlacingFocal(false);
      return;
    }

    // Select form
    if (activeTab === '3d-forms' && !placingForm && perspectiveSystem) {
      // Check if clicked on any form using hit testing
      let clickedFormIndex = null;
      let nearestDepth = Infinity;

      forms.forEach((form, index) => {
        try {
          if (!form || !form.getTransformedVertices) {
            console.error(`Form ${index} is invalid:`, form);
            return;
          }
          const vertices = form.getTransformedVertices();
          const projected = vertices.map(v => perspectiveSystem.project(v));

        // Calculate 2D bounding box
        const validPoints = projected.filter(p => p.visible);
        if (validPoints.length === 0) return;

        const bounds = {
          minX: Math.min(...validPoints.map(p => p.x)),
          maxX: Math.max(...validPoints.map(p => p.x)),
          minY: Math.min(...validPoints.map(p => p.y)),
          maxY: Math.max(...validPoints.map(p => p.y))
        };

        // Add padding for easier clicking
        const padding = 20;
        bounds.minX -= padding;
        bounds.maxX += padding;
        bounds.minY -= padding;
        bounds.maxY += padding;

        // Check if click is within bounds
        if (pt.x >= bounds.minX && pt.x <= bounds.maxX &&
            pt.y >= bounds.minY && pt.y <= bounds.maxY) {
          // Check depth to select nearest form
          const depth = form.position.z;
          if (depth < nearestDepth) {
            nearestDepth = depth;
            clickedFormIndex = index;
          }
        }
        } catch (error) {
          console.error(`Error checking form ${index}:`, error, form);
        }
      });

      // Boolean mode: multi-select
      if (booleanMode && clickedFormIndex !== null) {
        setBooleanSelection(prev => {
          if (prev.includes(clickedFormIndex)) {
            // Deselect
            return prev.filter(i => i !== clickedFormIndex);
          } else {
            // Select (max 2 for binary operations)
            if (prev.length < 2) {
              return [...prev, clickedFormIndex];
            }
            return prev;
          }
        });
      } else {
        setSelectedForm(clickedFormIndex);
      }
    }
  }, [placingForm, formType, perspectiveSystem, canvasSize, editingLandmark, editingVP, placingFocal, forms, activeTab, booleanMode, getPoint]);

  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    const pt = getPoint(e);
    setDragStart(pt);
    setIsDragging(true);

    // Check if dragging VP
    for (let i = 0; i < vanishingPoints.length; i++) {
      if (MathUtils.distance2D(pt, vanishingPoints[i]) < 20) {
        setDraggedVP(i);
        return;
      }
    }

    // Drawing gesture line
    if (activeTab === 'anatomy' && !editingLandmark) {
      setIsDrawingGesture(true);
      setGestureLine([pt]);
      return;
    }

    // Drawing perspective line
    if (activeTab === 'perspective' && !editingVP) {
      setDrawingPerspLine({ start: pt, end: pt });
      return;
    }

    // Measuring
    if (measuring) {
      setCurrentMeasure({ start: pt, end: pt });
      return;
    }

    // Manipulating selected form with gizmo
    if (selectedForm !== null && activeTab === '3d-forms' && perspectiveSystem) {
      const form = forms[selectedForm];
      if (form) {
        const gizmo = gizmoRef.current;
        const hitAxis = gizmo.hitTest(pt, form.position, perspectiveSystem);
        if (hitAxis) {
          setDraggedGizmoAxis(hitAxis);
          setGizmoDragStart(pt);
        }
      }
    }
  }, [activeTab, editingLandmark, editingVP, measuring, vanishingPoints, selectedForm, forms, perspectiveSystem, getPoint]);

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    const pt = getPoint(e);

    // Show form placement preview
    if (placingForm && perspectiveSystem) {
      setFormPreviewPos(pt);
    } else {
      setFormPreviewPos(null);
    }

    if (!isDragging) return;

    // Dragging VP
    if (draggedVP !== null) {
      setVanishingPoints(prev => prev.map((vp, i) =>
        i === draggedVP ? { ...vp, ...pt } : vp
      ));
      return;
    }

    // Drawing gesture
    if (isDrawingGesture) {
      setGestureLine(prev => [...prev, pt]);
      return;
    }

    // Drawing perspective line
    if (drawingPerspLine) {
      setDrawingPerspLine(prev => ({ ...prev, end: pt }));
      return;
    }

    // Measuring
    if (currentMeasure) {
      setCurrentMeasure(prev => ({ ...prev, end: pt }));
      return;
    }

    // Manipulating form with gizmo
    if (draggedGizmoAxis && gizmoDragStart && selectedForm !== null && perspectiveSystem) {
      const form = forms[selectedForm];
      if (form) {
        const gizmo = gizmoRef.current;
        const delta = gizmo.calculateDrag(gizmoDragStart, pt, draggedGizmoAxis, form.position, perspectiveSystem, manipulationMode);

        if (delta) {
          setForms(prev => prev.map((f, i) => {
            if (i !== selectedForm) return f;

            // Mutate directly - DO NOT SPREAD (preserves class methods)
            if (manipulationMode === 'move') {
              const newPos = f.position.add(delta);

              // Constrain to canvas bounds in 3D space
              const maxX = canvasSize.width / 2 - 50;
              const maxY = canvasSize.height / 2 - 50;
              const minZ = 50;  // Don't get too close to camera
              const maxZ = 1200; // Don't go too far

              f.position = new Vec3(
                Math.max(-maxX, Math.min(maxX, newPos.x)),
                Math.max(-maxY, Math.min(maxY, newPos.y)),
                Math.max(minZ, Math.min(maxZ, newPos.z))
              );
            } else if (manipulationMode === 'rotate') {
              f.rotation = new Vec3(
                f.rotation.x + delta.x,
                f.rotation.y + delta.y,
                f.rotation.z + delta.z
              );
            } else if (manipulationMode === 'scale') {
              // Constrain scale to reasonable values
              f.scale = new Vec3(
                Math.max(0.1, Math.min(5, f.scale.x * delta.x)),
                Math.max(0.1, Math.min(5, f.scale.y * delta.y)),
                Math.max(0.1, Math.min(5, f.scale.z * delta.z))
              );
            }
            return f;
          }));
          setGizmoDragStart(pt);
        }
      }
      return;
    }

    // Legacy manipulation removed - use gizmo only (preserves class methods)
  }, [isDragging, draggedVP, isDrawingGesture, drawingPerspLine, currentMeasure, selectedForm, dragStart, manipulationMode, placingForm, perspectiveSystem, getPoint]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setDraggedVP(null);
    setIsDrawingGesture(false);
    setDraggedGizmoAxis(null);
    setGizmoDragStart(null);

    if (drawingPerspLine && MathUtils.distance2D(drawingPerspLine.start, drawingPerspLine.end) > 15) {
      const newLine = { ...drawingPerspLine, id: Date.now() };
      setPerspectiveLines(prev => [...prev, newLine]);

      // If in Found Perspective mode, add to detection system
      if (foundPerspectiveMode && foundPerspectiveRef.current) {
        foundPerspectiveRef.current.addLine(drawingPerspLine.start, drawingPerspLine.end);
        // Auto-detect vanishing points
        const detectedVPs = foundPerspectiveRef.current.detectVanishingPoints(50);
        // Convert detected VPs to vanishing points for display
        if (detectedVPs.length > 0) {
          const colors = ['#ff5555', '#55ff55', '#5555ff', '#ffff55', '#ff55ff'];
          const newVPs = detectedVPs.map((vp, i) => ({
            id: `detected-${Date.now()}-${i}`,
            x: vp.x,
            y: vp.y,
            color: colors[i % colors.length],
            confidence: vp.confidence
          }));
          setVanishingPoints(newVPs);
        }
      }
    }
    setDrawingPerspLine(null);

    if (currentMeasure && MathUtils.distance2D(currentMeasure.start, currentMeasure.end) > 10) {
      setMeasurements(prev => [...prev, { ...currentMeasure, id: Date.now() }]);
    }
    setCurrentMeasure(null);
  }, [drawingPerspLine, currentMeasure, foundPerspectiveMode]);

  // Foreshortening controls
  const toggleForeshorten = (limbId, toward) => {
    setForeshortening(prev => {
      const current = prev[limbId];
      if (current?.toward === toward) {
        const { [limbId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [limbId]: { toward, amount: 0.5 } };
    });
  };

  const setForeshortenAmount = (limbId, amount) => {
    setForeshortening(prev => ({
      ...prev,
      [limbId]: { ...prev[limbId], amount }
    }));
  };

  // Mouse wheel for camera zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomSensitivity = 0.5;
    const delta = e.deltaY * zoomSensitivity;
    setCameraDistance(prev => Math.max(100, Math.min(2000, prev + delta)));
  }, []);

  // Generate volumetric forms from landmark connections
  // Stores form data for rendering (not Primitive3D objects - we render these specially)
  const [anatomyFormData, setAnatomyFormData] = useState([]);

  useEffect(() => {
    if (!autoGenerateForms || Object.keys(landmarks).length < 2) {
      setLandmarkForms([]);
      setAnatomyFormData([]);
      return;
    }

    const currentSegments = anatomyMode === 'human' ? HumanLimbSegments : QuadrupedLimbSegments;
    const generatedFormData = [];

    // Generate forms for predefined segments
    currentSegments.forEach(seg => {
      const p1 = landmarks[seg.from];
      const p2 = landmarks[seg.to];

      if (p1 && p2) {
        // Store form data for custom volumetric rendering
        const thickness = (seg.thickness || 0.25) * 100; // Much larger base thickness
        generatedFormData.push({
          id: seg.id,
          name: seg.name,
          from: seg.from,
          to: seg.to,
          p1: { x: p1.x, y: p1.y, z: p1.z || 300 },
          p2: { x: p2.x, y: p2.y, z: p2.z || 300 },
          thickness1: thickness,
          thickness2: thickness * 0.85, // Slight taper
          color: seg.color || '#66aaff'
        });
      }
    });

    setAnatomyFormData(generatedFormData);
    setLandmarkForms([]); // Clear old primitive forms - we use custom rendering now
  }, [landmarks, anatomyMode, autoGenerateForms]);

  // Main render effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');
    const { width, height } = canvasSize;

    // Clear
    ctx.fillStyle = useBlankCanvas ? canvasColor : '#111';
    ctx.fillRect(0, 0, width, height);
    octx.clearRect(0, 0, width, height);

    // CRITICAL: Clip all drawing to canvas bounds - nothing should go off canvas
    octx.save();
    octx.beginPath();
    octx.rect(0, 0, width, height);
    octx.clip();

    // Draw image if exists
    if (image && !useBlankCanvas) {
      ctx.drawImage(image, 0, 0, width, height);
    }

    // Draw perspective grid
    if (showPerspectiveGrid && perspectiveSystem) {
      drawPerspectiveGrid(octx, width, height);
    }

    // Draw 3D forms (always render if forms exist)
    if (forms.length > 0) {
      draw3DForms(octx, width, height);
    }

    // Draw anatomy forms (volumetric 3D cylinders between landmarks)
    if (Object.keys(landmarks).length > 1 && autoGenerateForms) {
      drawAnatomyForms(octx, width, height);
    }

    // Draw anatomy (skeleton, landmarks, proportions)
    if (Object.keys(landmarks).length > 0) {
      drawAnatomy(octx, width, height);
    }

    // Draw gesture line (always render if exists)
    if (showGesture && gestureLine.length > 1) {
      octx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
      octx.lineWidth = 4;
      octx.lineCap = 'round';
      octx.lineJoin = 'round';
      octx.beginPath();
      octx.moveTo(gestureLine[0].x, gestureLine[0].y);
      gestureLine.forEach(p => octx.lineTo(p.x, p.y));
      octx.stroke();
    }

    // Draw composition overlays (always render if enabled)
    if (compOverlay !== 'none' || showGoldenSpiral || showDynamicSymmetry || showArmature || focalPoints.length > 0) {
      drawComposition(octx, width, height);
    }

    // Draw perspective tools (always render VPs, lines, etc.)
    if (vanishingPoints.length > 0 || perspectiveLines.length > 0 || drawingPerspLine) {
      drawPerspectiveTools(octx, width, height);
    }

    // Draw measurements
    drawMeasurements(octx, width, height);

    // Draw focal points
    focalPoints.forEach(fp => {
      octx.strokeStyle = '#ff2266';
      octx.lineWidth = 2;
      octx.beginPath();
      octx.arc(fp.x, fp.y, 25, 0, Math.PI * 2);
      octx.stroke();
      octx.beginPath();
      octx.moveTo(fp.x - 30, fp.y);
      octx.lineTo(fp.x + 30, fp.y);
      octx.moveTo(fp.x, fp.y - 30);
      octx.lineTo(fp.x, fp.y + 30);
      octx.stroke();
    });

    // Restore canvas state (end clipping region)
    octx.restore();

  }, [
    canvasSize, image, useBlankCanvas, canvasColor, activeTab,
    showPerspectiveGrid, perspectiveSystem, forms, selectedForm,
    landmarks, foreshortening, showSkeleton, showMasses, showProportions,
    showCrossSections, gestureLine, showGesture, compOverlay,
    showGoldenSpiral, spiralFlip, vanishingPoints, perspectiveLines,
    drawingPerspLine, measurements, currentMeasure, focalPoints,
    show3DAxes, showConstruction, horizonY, gridDensity,
    showDynamicSymmetry, showArmature, anatomyMode, placingForm,
    formPreviewPos, formType, autoGenerateForms, anatomyFormData,
    landmarkForms, cameraDistance, perspectiveType, anatomyFormStyle,
    showCrossContours, mannequin, formRenderer
  ]);

  // Drawing functions
  const drawPerspectiveGrid = (ctx, w, h) => {
    if (!perspectiveSystem) return;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;

    // For fisheye mode, use finer grid for visible curvature
    const spacing = perspectiveType === 'fisheye' ? 50 : 100;
    const grid = perspectiveSystem.generateGrid(spacing, 1500);

    grid.forEach(line => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      line.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });

    ctx.restore();

    // Draw dynamic horizon line derived from vanishing points
    // The horizon passes through all horizontal VPs (not static!)
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 5]);

    if (perspectiveType === 'fisheye') {
      // Curved horizon line for fisheye
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const projected = perspectiveSystem.project(new Vec3(x - w/2, 0, 300));
        if (x === 0) {
          ctx.moveTo(projected.x, projected.y);
        } else {
          ctx.lineTo(projected.x, projected.y);
        }
      }
      ctx.stroke();
    } else {
      // Dynamic horizon from VPs - mark horizontal VPs and draw line through them
      const horizontalVPs = vanishingPoints.filter(vp => vp.type === 'horizontal' || !vp.type);
      const dynamicHorizon = HorizonLine.fromVanishingPoints(
        horizontalVPs.map(vp => new VanishingPoint(vp.x, vp.y, { type: 'horizontal' })),
        w, h
      );

      // Draw the horizon line that passes through VPs
      ctx.beginPath();
      if (dynamicHorizon.points.length >= 2) {
        ctx.moveTo(dynamicHorizon.points[0].x, dynamicHorizon.points[0].y);
        ctx.lineTo(dynamicHorizon.points[1].x, dynamicHorizon.points[1].y);
      } else {
        // Fallback to static horizon
        ctx.moveTo(0, horizonY);
        ctx.lineTo(w, horizonY);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Label showing dynamic behavior
    const labelY = vanishingPoints.length > 0
      ? Math.max(...vanishingPoints.filter(vp => !vp.type || vp.type === 'horizontal').map(vp => vp.y), horizonY) - 8
      : horizonY - 8;
    ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(vanishingPoints.length > 0 ? 'DYNAMIC HORIZON (through VPs)' : 'HORIZON LINE', 10, Math.max(20, Math.min(h - 20, labelY)));
  };

  const draw3DForms = (ctx, w, h) => {
    if (!perspectiveSystem) return;

    // Draw ground plane
    if (showGroundPlane) {
      ctx.fillStyle = 'rgba(80, 80, 100, 0.15)';
      ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
      ctx.lineWidth = 1;

      // Draw ground grid in perspective
      const gridLines = perspectiveSystem.generateGrid(100, 1200);
      gridLines.forEach(line => {
        if (line.type === 'across' && line.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(line.points[0].x, line.points[0].y);
          line.points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      });

      // Fill ground plane polygon (simplified)
      const groundCorners = [
        perspectiveSystem.project(new Vec3(-800, 0, 0)),
        perspectiveSystem.project(new Vec3(800, 0, 0)),
        perspectiveSystem.project(new Vec3(800, 0, 1200)),
        perspectiveSystem.project(new Vec3(-800, 0, 1200))
      ].filter(p => p.visible);

      if (groundCorners.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(groundCorners[0].x, groundCorners[0].y);
        groundCorners.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
      }
    }

    // Combine regular forms with landmark-generated forms
    const allForms = [...forms, ...landmarkForms];

    // Depth sort forms for proper occlusion
    const cameraPos = new Vec3(0, 0, -cameraDistance);
    const formsToRender = useDepthSorting
      ? DepthSorter.sortByDepth(allForms, cameraPos)
      : allForms.map((form, index) => ({ form, index }));

    formsToRender.forEach(({ form, index }) => {
      const isLandmarkForm = form.landmarkSegment !== undefined;
      const isSelected = index === selectedForm && !isLandmarkForm; // Can't select landmark forms
      const isBooleanSelected = booleanSelection.includes(index) && !isLandmarkForm;
      const transformed = form.getTransformedVertices();

      // Project vertices
      const projected = transformed.map(v => perspectiveSystem.project(v));

      // Draw faces (if defined)
      if (form.faces && form.faces.length > 0 && showConstruction) {
        let fillColor = 'rgba(150, 150, 150, 0.05)';
        if (isLandmarkForm) fillColor = 'rgba(100, 255, 200, 0.15)'; // Cyan for landmark forms
        if (isSelected) fillColor = 'rgba(100, 150, 255, 0.15)';
        if (isBooleanSelected) fillColor = 'rgba(255, 150, 100, 0.15)';

        ctx.fillStyle = fillColor;
        form.faces.forEach(face => {
          ctx.beginPath();
          ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
          for (let i = 1; i < face.length; i++) {
            ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
          }
          ctx.closePath();
          ctx.fill();
        });
      }

      // Draw edges (curved for fisheye) with clear selection indicators
      let strokeColor = '#ffffff';
      let lineWidth = 2;

      if (isLandmarkForm) {
        strokeColor = '#00ffaa'; // Cyan for landmark forms
        lineWidth = 2;
      } else if (isSelected) {
        strokeColor = '#00ffff';
        lineWidth = 4;
      } else if (isBooleanSelected) {
        strokeColor = '#ffaa00';
        lineWidth = 3;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;

      const useCurvedEdges = perspectiveType === 'fisheye';

      form.edges.forEach(([i1, i2]) => {
        if (useCurvedEdges) {
          // Subdivide edge for visible curvature
          const curvedPoints = perspectiveSystem.subdivideCurvedEdge(
            transformed[i1],
            transformed[i2],
            12 // More segments = smoother curve
          );

          if (curvedPoints.length > 0 && curvedPoints[0].visible) {
            ctx.beginPath();
            ctx.moveTo(curvedPoints[0].x, curvedPoints[0].y);
            for (let i = 1; i < curvedPoints.length; i++) {
              if (curvedPoints[i].visible) {
                ctx.lineTo(curvedPoints[i].x, curvedPoints[i].y);
              }
            }
            ctx.stroke();
          }
        } else {
          // Straight edges for linear perspective
          const p1 = projected[i1];
          const p2 = projected[i2];
          if (p1.visible && p2.visible) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      // Draw vertices
      if (showConstruction) {
        projected.forEach((p, i) => {
          if (!p.visible) return;
          ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, isSelected ? 4 : 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw shadow on ground plane
      if (showShadows && showGroundPlane) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;

        // Project shadow vertices (y=0, ground plane)
        const shadowVertices = transformed.map(v => {
          // Simple shadow projection: flatten to y=0
          return perspectiveSystem.project(new Vec3(v.x, 0, v.z));
        });

        // Draw shadow edges
        form.edges.forEach(([i1, i2]) => {
          const p1 = shadowVertices[i1];
          const p2 = shadowVertices[i2];
          if (p1.visible && p2.visible) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        // Fill shadow faces
        if (form.faces && form.faces.length > 0) {
          form.faces.forEach(face => {
            ctx.beginPath();
            ctx.moveTo(shadowVertices[face[0]].x, shadowVertices[face[0]].y);
            for (let i = 1; i < face.length; i++) {
              ctx.lineTo(shadowVertices[face[i]].x, shadowVertices[face[i]].y);
            }
            ctx.closePath();
            ctx.fill();
          });
        }
      }

      // Draw gizmo if selected
      if (isSelected) {
        const origin = perspectiveSystem.project(form.position);
        const gizmo = gizmoRef.current;
        gizmo.draw(ctx, form.position, origin, perspectiveSystem);
      }

      // Draw measurements if enabled
      if (showMeasurements) {
        const bounds = form.getTransformedVertices().reduce((acc, v) => ({
          minX: Math.min(acc.minX, v.x),
          maxX: Math.max(acc.maxX, v.x),
          minY: Math.min(acc.minY, v.y),
          maxY: Math.max(acc.maxY, v.y),
          minZ: Math.min(acc.minZ, v.z),
          maxZ: Math.max(acc.maxZ, v.z)
        }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity });

        const width = Math.abs(bounds.maxX - bounds.minX);
        const height = Math.abs(bounds.maxY - bounds.minY);
        const depth = Math.abs(bounds.maxZ - bounds.minZ);

        const formCenter = perspectiveSystem.project(form.position);
        if (formCenter.visible) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 3;
          ctx.font = 'bold 11px monospace';
          const measurements = `W:${width.toFixed(0)} H:${height.toFixed(0)} D:${depth.toFixed(0)}`;
          ctx.strokeText(measurements, formCenter.x - 50, formCenter.y - 80);
          ctx.fillText(measurements, formCenter.x - 50, formCenter.y - 80);
        }
      }
    });

    // Draw form intersections
    if (showIntersections && forms.length > 1) {
      const intersections = IntersectionDetector.getAllIntersections(forms);

      intersections.forEach(({ form1Index, form2Index }) => {
        try {
          const viz = IntersectionDetector.getIntersectionVisualization(
            forms[form1Index],
            forms[form2Index],
            perspectiveSystem
          );

          if (viz.circlePoints.length > 2) {
            // Draw intersection line
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 4;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(viz.circlePoints[0].x, viz.circlePoints[0].y);
            viz.circlePoints.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.stroke();

            // Draw intersection badge
            if (viz.midpoint.visible) {
              ctx.fillStyle = 'rgba(255, 170, 0, 0.9)';
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 2;
              ctx.font = 'bold 12px sans-serif';
              ctx.beginPath();
              ctx.arc(viz.midpoint.x, viz.midpoint.y, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#000';
              ctx.fillText('⚡', viz.midpoint.x - 5, viz.midpoint.y + 5);
            }
          }
        } catch (e) {
          // Skip if intersection calculation fails
          console.warn('Intersection calc failed:', e);
        }
      });

      // Show intersection count
      if (intersections.length > 0) {
        ctx.fillStyle = 'rgba(255, 170, 0, 0.9)';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 14px sans-serif';
        const countText = `${intersections.length} Intersection${intersections.length > 1 ? 's' : ''}`;
        ctx.strokeText(countText, 10, h - 20);
        ctx.fillText(countText, 10, h - 20);
      }
    }

    // Show placement preview when user is placing a form
    if (placingForm) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Click to place ${formType}`, 10, 30);

      // Draw ghost preview of form at cursor
      if (formPreviewPos) {
        const previewForm = new Primitive3D(
          formType,
          new Vec3(formPreviewPos.x - w / 2, -(formPreviewPos.y - h / 2), 200),
          new Vec3(0, 0, 0),
          new Vec3(1, 1, 1)
        );

        const transformed = previewForm.getTransformedVertices();
        const projected = transformed.map(v => perspectiveSystem.project(v));

        // Draw ghost form
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        previewForm.edges.forEach(([i1, i2]) => {
          const p1 = projected[i1];
          const p2 = projected[i2];
          if (p1.visible && p2.visible) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        ctx.setLineDash([]);

        // Draw placement crosshair
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(formPreviewPos.x - 15, formPreviewPos.y);
        ctx.lineTo(formPreviewPos.x + 15, formPreviewPos.y);
        ctx.moveTo(formPreviewPos.x, formPreviewPos.y - 15);
        ctx.lineTo(formPreviewPos.x, formPreviewPos.y + 15);
        ctx.stroke();
      }
    }
  };

  // Helper: Project landmark for rendering (supports 2D and 3D)
  const projectLandmark = (pt) => {
    if (!pt) return null;

    // If landmark has depth and perspective system exists, project it
    if (pt.z !== undefined && perspectiveSystem) {
      // Landmarks are already in world coordinates, just project them
      const vec3 = new Vec3(pt.x, pt.y, pt.z);
      const projected = perspectiveSystem.project(vec3);
      // Always return projection even if not "visible" - landmarks should always show
      return {
        x: projected.x,
        y: projected.y,
        scale: projected.scale || 1
      };
    }

    // Otherwise use 2D coordinates directly (legacy 2D mode)
    return { x: pt.x, y: pt.y, scale: 1 };
  };

  // Draw volumetric 3D forms between landmarks using new renderer
  const drawAnatomyForms = (ctx, w, h) => {
    if (!autoGenerateForms || !perspectiveSystem) return;

    const currentSegments = anatomyMode === 'human' ? HumanLimbSegments : QuadrupedLimbSegments;

    // Use new FormRenderer for proper 3D rendering with lighting
    if (formRenderer) {
      formRenderer.showCrossContours = showCrossContours;

      if (anatomyFormStyle === 'bridgman' && mannequin && anatomyMode === 'human') {
        // Bridgman style: render mannequin with proper anatomical forms
        formRenderer.renderMannequin(ctx, mannequin, {
          color: '#6699cc',
          opacity: 0.8,
          showConstruction: showConstruction
        });
      } else {
        // Basic style: render simple limb segments
        formRenderer.renderAnatomyFromLandmarks(ctx, landmarks, currentSegments, {
          color: '#7799cc',
          opacity: 0.85,
          showEndCaps: true
        });
      }
    }
  };

  const drawAnatomy = (ctx, w, h) => {
    const currentLandmarks = anatomyMode === 'human' ? HumanLandmarks : QuadrupedLandmarks;
    const currentSegments = anatomyMode === 'human' ? HumanLimbSegments : QuadrupedLimbSegments;

    // Check if we have minimum landmarks
    const hasMinimum = anatomyMode === 'human'
      ? (landmarks.crown && landmarks.chin)
      : (landmarks.skull && landmarks.withers);

    if (!hasMinimum) {
      // Just draw placed landmarks
      Object.entries(landmarks).forEach(([key, pt]) => {
        const projected = projectLandmark(pt);
        if (!projected) return;

        const cfg = currentLandmarks.find(l => l.key === key);
        const radius = 6 * projected.scale;
        ctx.fillStyle = cfg?.color || '#fff';
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `${10 * projected.scale}px sans-serif`;
        ctx.fillText(cfg?.name || key, projected.x + 10, projected.y + 4);
      });
      return;
    }

    // Calculate reference unit in WORLD space (3D distance for head unit)
    let worldHeadUnit = 100; // Default
    let projectedHeadUnit = 100;

    if (anatomyMode === 'human' && landmarks.crown && landmarks.chin) {
      // Calculate 3D distance in world space
      const dx = landmarks.chin.x - landmarks.crown.x;
      const dy = landmarks.chin.y - landmarks.crown.y;
      const dz = (landmarks.chin.z || 300) - (landmarks.crown.z || 300);
      worldHeadUnit = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Also calculate projected distance for rendering
      const crownProj = projectLandmark(landmarks.crown);
      const chinProj = projectLandmark(landmarks.chin);
      if (crownProj && chinProj) {
        projectedHeadUnit = Math.sqrt(
          (crownProj.x - chinProj.x) ** 2 +
          (crownProj.y - chinProj.y) ** 2
        );
      }
    } else if (anatomyMode === 'quadruped' && landmarks.skull && landmarks.withers) {
      const dx = landmarks.withers.x - landmarks.skull.x;
      const dy = landmarks.withers.y - landmarks.skull.y;
      const dz = (landmarks.withers.z || 300) - (landmarks.skull.z || 300);
      worldHeadUnit = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const skullProj = projectLandmark(landmarks.skull);
      const withersProj = projectLandmark(landmarks.withers);
      if (skullProj && withersProj) {
        projectedHeadUnit = Math.sqrt(
          (skullProj.x - withersProj.x) ** 2 +
          (skullProj.y - withersProj.y) ** 2
        );
      }
    }

    // Keep refUnit for backward compatibility (used elsewhere)
    const refUnit = projectedHeadUnit;

    // Draw proportion grid (perspective-aware)
    if (showProportions && anatomyMode === 'human' && landmarks.crown) {
      const crownProj = projectLandmark(landmarks.crown);
      if (crownProj) {
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1 * crownProj.scale;
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.font = `${10 * crownProj.scale}px monospace`;

        const labels = ['0-Crown', '1-Chin', '2-Nipple', '3-Navel', '4-Crotch', '5', '6-Knee', '7', '8-Feet'];

        // Draw grid lines that respect perspective
        for (let i = 0; i <= 8; i++) {
          // Calculate 3D position for this proportion level
          if (landmarks.crown.z !== undefined && perspectiveSystem) {
            // In 3D mode, project the horizontal line at each level
            // Use world coordinates: Y decreases as we go DOWN the figure
            const z = landmarks.crown.z;
            const baseY = landmarks.crown.y;
            const levelY = baseY - i * worldHeadUnit; // SUBTRACT to go down in world space

            // Sample points across the width for the grid line
            ctx.beginPath();
            for (let x = -w/2; x <= w/2; x += 50) {
              const pt3d = new Vec3(x, levelY, z);
              const proj = perspectiveSystem.project(pt3d);
              if (proj.visible) {
                if (x === -w/2) {
                  ctx.moveTo(proj.x, proj.y);
                } else {
                  ctx.lineTo(proj.x, proj.y);
                }
              }
            }
            ctx.stroke();

            // Label on left side
            const labelPt3d = new Vec3(-w/2 + 80, levelY, z);
            const labelProj = perspectiveSystem.project(labelPt3d);
            if (labelProj.visible) {
              ctx.fillText(labels[i], labelProj.x, labelProj.y - 4);
            }
          } else {
            // 2D fallback - Y increases downward on screen
            const y = crownProj.y + i * projectedHeadUnit;
            if (y >= 0 && y <= h) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(w, y);
              ctx.stroke();
              ctx.fillText(labels[i], 5, y - 4);
            }
          }
        }
        ctx.setLineDash([]);
      }
    }

    // Draw skeleton
    if (showSkeleton) {
      ctx.lineCap = 'round';

      if (anatomyMode === 'human') {
        // Spine
        const spineKeys = ['crown', 'chin', 'c7', 'sternumBottom'];
        const spine = [];
        spineKeys.forEach(key => {
          if (landmarks[key]) {
            const proj = projectLandmark(landmarks[key]);
            if (proj) spine.push(proj);
          }
        });

        // Add shoulder center
        if (landmarks.shoulderL && landmarks.shoulderR) {
          const mid = AnatomyUtils.midpoint(landmarks.shoulderL, landmarks.shoulderR);
          const proj = projectLandmark(mid);
          if (proj) spine.push(proj);
        }

        // Add hip center
        if (landmarks.hipL && landmarks.hipR) {
          const mid = AnatomyUtils.midpoint(landmarks.hipL, landmarks.hipR);
          const proj = projectLandmark(mid);
          if (proj) spine.push(proj);
        }

        if (spine.length > 1) {
          ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
          ctx.lineWidth = 3 * spine[0].scale;
          ctx.beginPath();
          ctx.moveTo(spine[0].x, spine[0].y);
          spine.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }

        // Shoulder line
        if (landmarks.shoulderL && landmarks.shoulderR) {
          const pL = projectLandmark(landmarks.shoulderL);
          const pR = projectLandmark(landmarks.shoulderR);
          if (pL && pR) {
            ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
            ctx.lineWidth = 3 * pL.scale;
            ctx.beginPath();
            ctx.moveTo(pL.x, pL.y);
            ctx.lineTo(pR.x, pR.y);
            ctx.stroke();
          }
        }

        // Hip line
        if (landmarks.hipL && landmarks.hipR) {
          const pL = projectLandmark(landmarks.hipL);
          const pR = projectLandmark(landmarks.hipR);
          if (pL && pR) {
            ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
            ctx.lineWidth = 3 * pL.scale;
            ctx.beginPath();
            ctx.moveTo(pL.x, pL.y);
            ctx.lineTo(pR.x, pR.y);
            ctx.stroke();
          }
        }

        // Limbs
        currentSegments.forEach(seg => {
          if (landmarks[seg.from] && landmarks[seg.to]) {
            const p1 = projectLandmark(landmarks[seg.from]);
            const p2 = projectLandmark(landmarks[seg.to]);
            if (p1 && p2) {
              const avgScale = (p1.scale + p2.scale) / 2;
              const avgDepth = ((landmarks[seg.from].z || 300) + (landmarks[seg.to].z || 300)) / 2;
              const depthAlpha = Math.max(0.3, Math.min(1.0, 1.0 - (avgDepth - 200) / 400));

              ctx.strokeStyle = `rgba(0, 255, 200, ${depthAlpha * 0.9})`;
              ctx.lineWidth = 2.5 * avgScale;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });
      } else {
        // Quadruped skeleton
        // Spine
        const spineKeys = ['skull', 'c1', 'withers', 'midBack', 'croup', 'tailBase'];
        const spine = [];
        spineKeys.forEach(key => {
          if (landmarks[key]) {
            const proj = projectLandmark(landmarks[key]);
            if (proj) spine.push(proj);
          }
        });

        if (spine.length > 1) {
          ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
          ctx.lineWidth = 3 * spine[0].scale;
          ctx.beginPath();
          ctx.moveTo(spine[0].x, spine[0].y);
          spine.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }

        // Legs
        currentSegments.forEach(seg => {
          if (landmarks[seg.from] && landmarks[seg.to]) {
            const p1 = projectLandmark(landmarks[seg.from]);
            const p2 = projectLandmark(landmarks[seg.to]);
            if (p1 && p2) {
              const avgScale = (p1.scale + p2.scale) / 2;
              const avgDepth = ((landmarks[seg.from].z || 300) + (landmarks[seg.to].z || 300)) / 2;
              const depthAlpha = Math.max(0.3, Math.min(1.0, 1.0 - (avgDepth - 200) / 400));

              ctx.strokeStyle = `rgba(0, 255, 200, ${depthAlpha * 0.9})`;
              ctx.lineWidth = 2.5 * avgScale;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });
      }
    }

    // Draw masses
    if (showMasses) {
      // For each limb segment with both endpoints
      currentSegments.forEach(seg => {
        if (!landmarks[seg.from] || !landmarks[seg.to]) return;

        const p1 = projectLandmark(landmarks[seg.from]);
        const p2 = projectLandmark(landmarks[seg.to]);
        if (!p1 || !p2) return;

        const avgScale = (p1.scale + p2.scale) / 2;
        const avgDepth = ((landmarks[seg.from].z || 300) + (landmarks[seg.to].z || 300)) / 2;
        const depthAlpha = Math.max(0.2, Math.min(0.8, 1.0 - (avgDepth - 200) / 400));

        ctx.fillStyle = `rgba(150, 200, 255, ${depthAlpha * 0.3})`;
        ctx.strokeStyle = `rgba(150, 200, 255, ${depthAlpha * 0.9})`;
        ctx.lineWidth = 2 * avgScale;

        const angle = AnatomyUtils.angle(p1, p2);
        const perpAngle = angle + Math.PI / 2;
        const width = refUnit * (seg.thickness || 0.2) * avgScale;
        const width2 = width * 0.8;

        // Draw tapered cylinder
        const tl = { x: p1.x + Math.cos(perpAngle) * width, y: p1.y + Math.sin(perpAngle) * width };
        const tr = { x: p1.x - Math.cos(perpAngle) * width, y: p1.y - Math.sin(perpAngle) * width };
        const bl = { x: p2.x + Math.cos(perpAngle) * width2, y: p2.y + Math.sin(perpAngle) * width2 };
        const br = { x: p2.x - Math.cos(perpAngle) * width2, y: p2.y - Math.sin(perpAngle) * width2 };

        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cross-sections for foreshortening
        if (showCrossSections && foreshortening[seg.id]) {
          const fs = foreshortening[seg.id];
          ctx.strokeStyle = fs.toward ? 'rgba(255,150,50,0.9)' : 'rgba(50,150,255,0.9)';
          ctx.lineWidth = 2;

          for (let i = 0; i <= 3; i++) {
            const t = i / 3;
            const center = {
              x: p1.x + (p2.x - p1.x) * t,
              y: p1.y + (p2.y - p1.y) * t
            };
            const currentWidth = width + (width2 - width) * t;
            const compression = 0.3 + (1 - fs.amount) * 0.5;

            ctx.save();
            ctx.translate(center.x, center.y);
            ctx.rotate(angle);
            ctx.scale(1, compression);
            ctx.beginPath();
            ctx.arc(0, 0, currentWidth, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Arrow
          const mid = AnatomyUtils.midpoint(p1, p2);
          ctx.fillStyle = fs.toward ? '#ff9933' : '#3399ff';
          ctx.strokeStyle = fs.toward ? '#ff9933' : '#3399ff';
          ctx.lineWidth = 3;
          const arrowDir = fs.toward ? angle + Math.PI : angle;
          const arrowLen = 25;
          const arrowEnd = {
            x: mid.x + Math.cos(arrowDir) * arrowLen,
            y: mid.y + Math.sin(arrowDir) * arrowLen
          };

          ctx.beginPath();
          ctx.moveTo(mid.x, mid.y);
          ctx.lineTo(arrowEnd.x, arrowEnd.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(arrowEnd.x, arrowEnd.y);
          ctx.lineTo(arrowEnd.x - 10 * Math.cos(arrowDir - 0.4), arrowEnd.y - 10 * Math.sin(arrowDir - 0.4));
          ctx.lineTo(arrowEnd.x - 10 * Math.cos(arrowDir + 0.4), arrowEnd.y - 10 * Math.sin(arrowDir + 0.4));
          ctx.closePath();
          ctx.fill();

          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(fs.toward ? 'TOWARD' : 'AWAY', mid.x + 15, mid.y - 18);
        }
      });
    }

    // Draw gesture line
    if (showGesture && gestureLine.length > 1) {
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.9)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(gestureLine[0].x, gestureLine[0].y);
      gestureLine.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Draw landmarks
    Object.entries(landmarks).forEach(([key, pt]) => {
      const projected = projectLandmark(pt);
      if (!projected) return;

      const cfg = currentLandmarks.find(l => l.key === key);
      const radius = 6 * projected.scale;

      ctx.fillStyle = cfg?.color || '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `${10 * projected.scale}px sans-serif`;
      ctx.fillText(cfg?.name || key, projected.x + 10, projected.y + 4);
    });

    // Update analysis notes
    const notes = AnatomyUtils.analyzeProportions(landmarks, anatomyMode);
    setAnalysisNotes(notes);
  };

  const drawComposition = (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(255, 200, 50, 0.7)';
    ctx.lineWidth = 1.5;

    // Rule of thirds
    if (compOverlay === 'thirds') {
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(w * i / 3, 0);
        ctx.lineTo(w * i / 3, h);
        ctx.moveTo(0, h * i / 3);
        ctx.lineTo(w, h * i / 3);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
      for (let i = 1; i < 3; i++) {
        for (let j = 1; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(w * i / 3, h * j / 3, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Golden ratio
    if (compOverlay === 'golden') {
      const phi = 1.618;
      ctx.beginPath();
      ctx.moveTo(w / phi, 0);
      ctx.lineTo(w / phi, h);
      ctx.moveTo(w - w / phi, 0);
      ctx.lineTo(w - w / phi, h);
      ctx.moveTo(0, h / phi);
      ctx.lineTo(w, h / phi);
      ctx.moveTo(0, h - h / phi);
      ctx.lineTo(w, h - h / phi);
      ctx.stroke();
    }

    // Diagonal
    if (compOverlay === 'diagonal') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
    }

    // Golden spiral
    if (showGoldenSpiral) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2.5;

      const phi = 1.618;
      let sw = w, sh = h;
      let sx = spiralFlip.h ? w : 0;
      let sy = spiralFlip.v ? h : 0;

      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const nw = sw / phi;
        const nh = sh / phi;
        const base = (spiralFlip.h ? 2 : 0) + (spiralFlip.v ? 1 : 0);
        const q = (base + i) % 4;

        let cx, cy, start;
        if (q === 0) {
          cx = sx + sw - nw;
          cy = sy + sh;
          start = -Math.PI / 2;
        } else if (q === 1) {
          cx = sx;
          cy = sy + sh - nh;
          start = 0;
        } else if (q === 2) {
          cx = sx + nw;
          cy = sy;
          start = Math.PI / 2;
        } else {
          cx = sx + sw;
          cy = sy + nh;
          start = Math.PI;
        }

        ctx.arc(cx, cy, Math.min(nw, nh), start, start + Math.PI / 2);

        if (q === 0) sx += sw - nw;
        else if (q === 1) sy += sh - nh;

        sw = nw;
        sh = nh;
      }
      ctx.stroke();
    }

    // Visual weight analyzer
    if (compOverlay === 'weight') {
      // Analyze visual weight based on forms and landmarks
      const weights = [];

      // Forms contribute weight based on size and position
      forms.forEach((form, i) => {
        if (!perspectiveSystem) return;
        const projected = perspectiveSystem.project(form.position);
        if (projected.visible) {
          const size = form.scale.x * form.scale.y * form.scale.z;
          weights.push({
            x: projected.x,
            y: projected.y,
            weight: size * 20,
            label: `F${i+1}`
          });
        }
      });

      // Landmarks contribute weight
      Object.entries(landmarks).forEach(([key, pt]) => {
        weights.push({
          x: pt.x,
          y: pt.y,
          weight: 15,
          label: key.slice(0, 3)
        });
      });

      // Draw weight visualization
      weights.forEach(w => {
        const radius = Math.sqrt(w.weight) * 3;
        ctx.fillStyle = `rgba(255, 100, 100, ${Math.min(0.3, w.weight / 100)})`;
        ctx.beginPath();
        ctx.arc(w.x, w.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Calculate center of weight
      if (weights.length > 0) {
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        const centerX = weights.reduce((sum, w) => sum + w.x * w.weight, 0) / totalWeight;
        const centerY = weights.reduce((sum, w) => sum + w.y * w.weight, 0) / totalWeight;

        // Draw center of visual weight
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY);
        ctx.lineTo(centerX + 20, centerY);
        ctx.moveTo(centerX, centerY - 20);
        ctx.lineTo(centerX, centerY + 20);
        ctx.stroke();

        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('CENTER OF WEIGHT', centerX + 25, centerY + 4);
      }
    }

    // Balance analyzer
    if (compOverlay === 'balance') {
      // Calculate balance line (vertical center of mass)
      const weights = [];
      forms.forEach(form => {
        if (!perspectiveSystem) return;
        const projected = perspectiveSystem.project(form.position);
        if (projected.visible) {
          const size = form.scale.x * form.scale.y * form.scale.z;
          weights.push({ x: projected.x, weight: size * 20 });
        }
      });

      Object.values(landmarks).forEach(pt => {
        weights.push({ x: pt.x, weight: 15 });
      });

      if (weights.length > 0) {
        const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
        const balanceX = weights.reduce((sum, w) => sum + w.x * w.weight, 0) / totalWeight;

        // Draw balance line
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(balanceX, 0);
        ctx.lineTo(balanceX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Show offset from center
        const offset = balanceX - w/2;
        const offsetPercent = (offset / w * 100).toFixed(1);
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`BALANCE: ${offsetPercent}% ${offset > 0 ? 'RIGHT' : 'LEFT'}`, 10, 30);

        // Draw canvas center for comparison
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Flow analyzer (directional movement)
    if (compOverlay === 'flow') {
      // Analyze directional flow from gesture lines and form arrangements
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      // Draw gesture line flow
      if (gestureLine.length > 1) {
        ctx.strokeStyle = 'rgba(255, 100, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(gestureLine[0].x, gestureLine[0].y);
        gestureLine.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();

        // Draw flow arrows
        for (let i = 0; i < gestureLine.length - 1; i += 10) {
          const p1 = gestureLine[i];
          const p2 = gestureLine[Math.min(i + 10, gestureLine.length - 1)];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const arrowX = p2.x;
          const arrowY = p2.y;
          const arrowSize = 15;

          ctx.fillStyle = 'rgba(255, 100, 255, 0.9)';
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }

      // Analyze form arrangement flow
      if (forms.length > 1 && perspectiveSystem) {
        const centers = forms.map(f => perspectiveSystem.project(f.position))
          .filter(p => p.visible);

        if (centers.length > 1) {
          // Find general flow direction
          const avgDx = centers.slice(1).reduce((sum, p, i) => sum + (p.x - centers[i].x), 0) / (centers.length - 1);
          const avgDy = centers.slice(1).reduce((sum, p, i) => sum + (p.y - centers[i].y), 0) / (centers.length - 1);
          const flowAngle = Math.atan2(avgDy, avgDx);

          ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
          ctx.lineWidth = 3;
          centers.forEach((c, i) => {
            if (i > 0) {
              ctx.beginPath();
              ctx.moveTo(centers[i-1].x, centers[i-1].y);
              ctx.lineTo(c.x, c.y);
              ctx.stroke();
            }
          });

          // Draw flow direction indicator
          const centerX = centers.reduce((sum, p) => sum + p.x, 0) / centers.length;
          const centerY = centers.reduce((sum, p) => sum + p.y, 0) / centers.length;
          const flowLength = 80;

          ctx.strokeStyle = 'rgba(100, 200, 255, 1.0)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(
            centerX + flowLength * Math.cos(flowAngle),
            centerY + flowLength * Math.sin(flowAngle)
          );
          ctx.stroke();

          // Arrow head
          const arrowX = centerX + flowLength * Math.cos(flowAngle);
          const arrowY = centerY + flowLength * Math.sin(flowAngle);
          ctx.fillStyle = 'rgba(100, 200, 255, 1.0)';
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - 15 * Math.cos(flowAngle - Math.PI / 6),
            arrowY - 15 * Math.sin(flowAngle - Math.PI / 6)
          );
          ctx.lineTo(
            arrowX - 15 * Math.cos(flowAngle + Math.PI / 6),
            arrowY - 15 * Math.sin(flowAngle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#66ccff';
          ctx.font = 'bold 12px monospace';
          const flowDegrees = ((flowAngle * 180 / Math.PI + 360) % 360).toFixed(0);
          ctx.fillText(`FLOW: ${flowDegrees}°`, 10, 30);
        }
      }
    }

    // Dynamic symmetry
    if (showDynamicSymmetry) {
      ctx.strokeStyle = 'rgba(100, 255, 150, 0.5)';
      ctx.lineWidth = 1;

      // Root 2 rectangle diagonals
      const sqrt2 = Math.sqrt(2);
      const rw = Math.min(w, h * sqrt2);
      const rh = rw / sqrt2;
      const ox = (w - rw) / 2;
      const oy = (h - rh) / 2;

      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + rw, oy + rh);
      ctx.moveTo(ox + rw, oy);
      ctx.lineTo(ox, oy + rh);
      ctx.stroke();
    }

    // Armature
    if (showArmature) {
      ctx.strokeStyle = 'rgba(255, 100, 255, 0.6)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    }
  };

  const drawPerspectiveTools = (ctx, w, h) => {
    // Draw vanishing points
    vanishingPoints.forEach((vp, i) => {
      ctx.strokeStyle = vp.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(vp.x - 20, vp.y);
      ctx.lineTo(vp.x + 20, vp.y);
      ctx.moveTo(vp.x, vp.y - 20);
      ctx.lineTo(vp.x, vp.y + 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(vp.x, vp.y, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = vp.color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`VP${i + 1}`, vp.x + 18, vp.y - 15);

      // Draw convergence lines if enabled
      if (showPerspectiveGrid) {
        ctx.strokeStyle = vp.color + '20';
        ctx.lineWidth = 1;

        for (let a = 0; a < 360; a += 360 / gridDensity) {
          const rad = a * Math.PI / 180;
          const len = Math.max(w, h) * 3;
          ctx.beginPath();
          ctx.moveTo(vp.x, vp.y);
          ctx.lineTo(vp.x + Math.cos(rad) * len, vp.y + Math.sin(rad) * len);
          ctx.stroke();
        }
      }
    });

    // Draw perspective lines
    [...perspectiveLines, drawingPerspLine].filter(Boolean).forEach(line => {
      const isDrawing = line === drawingPerspLine;
      ctx.strokeStyle = isDrawing ? 'rgba(255, 255, 0, 0.9)' : 'rgba(100, 200, 255, 0.8)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();

      // Extend line
      ctx.strokeStyle = isDrawing ? 'rgba(255, 255, 0, 0.3)' : 'rgba(100, 200, 255, 0.3)';
      const dx = line.end.x - line.start.x;
      const dy = line.end.y - line.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len > 0) {
        const ext = Math.max(w, h) * 2;
        ctx.beginPath();
        ctx.moveTo(line.start.x - (dx / len) * ext, line.start.y - (dy / len) * ext);
        ctx.lineTo(line.end.x + (dx / len) * ext, line.end.y + (dy / len) * ext);
        ctx.stroke();
      }
    });
  };

  const drawMeasurements = (ctx, w, h) => {
    [...measurements, currentMeasure].filter(Boolean).forEach(m => {
      const isTemp = m === currentMeasure;
      const dist = MathUtils.distance2D(m.start, m.end);
      const angle = MathUtils.angle2D(m.start, m.end);

      ctx.strokeStyle = isTemp ? 'rgba(255, 255, 0, 0.9)' : 'rgba(0, 255, 255, 0.9)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(m.start.x, m.start.y);
      ctx.lineTo(m.end.x, m.end.y);
      ctx.stroke();

      // End caps
      const perp = angle + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(m.start.x + Math.cos(perp) * 10, m.start.y + Math.sin(perp) * 10);
      ctx.lineTo(m.start.x - Math.cos(perp) * 10, m.start.y - Math.sin(perp) * 10);
      ctx.moveTo(m.end.x + Math.cos(perp) * 10, m.end.y + Math.sin(perp) * 10);
      ctx.lineTo(m.end.x - Math.cos(perp) * 10, m.end.y - Math.sin(perp) * 10);
      ctx.stroke();

      if (dist > 15) {
        ctx.fillStyle = isTemp ? '#ffff00' : '#00ffff';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${Math.round(dist)}px`, (m.start.x + m.end.x) / 2 + 10, (m.start.y + m.end.y) / 2 - 8);
      }
    });
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="title">ARTIST'S 3D TOOLKIT</h1>
        <div className="header-controls">
          <label className="file-upload">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            Upload Image
          </label>
          <button
            className={`btn ${useBlankCanvas ? 'btn-active' : ''}`}
            onClick={() => setUseBlankCanvas(!useBlankCanvas)}
          >
            {useBlankCanvas ? 'Blank Canvas' : 'Show Image'}
          </button>
          {useBlankCanvas && (
            <input
              type="color"
              value={canvasColor}
              onChange={(e) => setCanvasColor(e.target.value)}
              title="Canvas Color"
            />
          )}
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Tabs */}
          <nav className="tabs">
            <button
              className={`tab ${activeTab === '3d-forms' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('3d-forms')}
            >
              3D FORMS
            </button>
            <button
              className={`tab ${activeTab === 'perspective' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('perspective')}
            >
              PERSPECTIVE
            </button>
            <button
              className={`tab ${activeTab === 'anatomy' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('anatomy')}
            >
              ANATOMY
            </button>
            <button
              className={`tab ${activeTab === 'composition' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('composition')}
            >
              COMPOSITION
            </button>
            <button
              className={`tab ${activeTab === 'measure' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('measure')}
            >
              MEASURE
            </button>
          </nav>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === '3d-forms' && (
              <Forms3DPanel
                formType={formType}
                setFormType={setFormType}
                placingForm={placingForm}
                setPlacingForm={setPlacingForm}
                forms={forms}
                selectedForm={selectedForm}
                setSelectedForm={setSelectedForm}
                setForms={setForms}
                manipulationMode={manipulationMode}
                setManipulationMode={setManipulationMode}
                show3DAxes={show3DAxes}
                setShow3DAxes={setShow3DAxes}
                showConstruction={showConstruction}
                setShowConstruction={setShowConstruction}
                showGroundPlane={showGroundPlane}
                setShowGroundPlane={setShowGroundPlane}
                showShadows={showShadows}
                setShowShadows={setShowShadows}
                showMeasurements={showMeasurements}
                setShowMeasurements={setShowMeasurements}
                showIntersections={showIntersections}
                setShowIntersections={setShowIntersections}
                useDepthSorting={useDepthSorting}
                setUseDepthSorting={setUseDepthSorting}
                lightDirection={lightDirection}
                setLightDirection={setLightDirection}
                booleanMode={booleanMode}
                setBooleanMode={setBooleanMode}
                booleanSelection={booleanSelection}
                setBooleanSelection={setBooleanSelection}
                booleanOperation={booleanOperation}
                setBooleanOperation={setBooleanOperation}
              />
            )}

            {activeTab === 'perspective' && (
              <PerspectivePanel
                perspectiveType={perspectiveType}
                setPerspectiveType={setPerspectiveType}
                editingVP={editingVP}
                setEditingVP={setEditingVP}
                vanishingPoints={vanishingPoints}
                setVanishingPoints={setVanishingPoints}
                showPerspectiveGrid={showPerspectiveGrid}
                setShowPerspectiveGrid={setShowPerspectiveGrid}
                gridDensity={gridDensity}
                setGridDensity={setGridDensity}
                horizonY={horizonY}
                setHorizonY={setHorizonY}
                canvasHeight={canvasSize.height}
                perspectiveLines={perspectiveLines}
                setPerspectiveLines={setPerspectiveLines}
                fisheyeStrength={fisheyeStrength}
                setFisheyeStrength={setFisheyeStrength}
                foundPerspectiveMode={foundPerspectiveMode}
                setFoundPerspectiveMode={setFoundPerspectiveMode}
                foundPerspectiveRef={foundPerspectiveRef}
                cameraDistance={cameraDistance}
                setCameraDistance={setCameraDistance}
              />
            )}

            {activeTab === 'anatomy' && (
              <AnatomyPanel
                anatomyMode={anatomyMode}
                setAnatomyMode={setAnatomyMode}
                quadrupedType={quadrupedType}
                setQuadrupedType={setQuadrupedType}
                landmarks={landmarks}
                setLandmarks={setLandmarks}
                editingLandmark={editingLandmark}
                setEditingLandmark={setEditingLandmark}
                landmarkDepth={landmarkDepth}
                setLandmarkDepth={setLandmarkDepth}
                showSkeleton={showSkeleton}
                setShowSkeleton={setShowSkeleton}
                showMasses={showMasses}
                setShowMasses={setShowMasses}
                showProportions={showProportions}
                setShowProportions={setShowProportions}
                showCrossSections={showCrossSections}
                setShowCrossSections={setShowCrossSections}
                showGesture={showGesture}
                setShowGesture={setShowGesture}
                gestureLine={gestureLine}
                setGestureLine={setGestureLine}
                foreshortening={foreshortening}
                toggleForeshorten={toggleForeshorten}
                setForeshortenAmount={setForeshortenAmount}
                analysisNotes={analysisNotes}
                proportionSystem={proportionSystem}
                setProportionSystem={setProportionSystem}
                autoGenerateForms={autoGenerateForms}
                setAutoGenerateForms={setAutoGenerateForms}
                anatomyFormStyle={anatomyFormStyle}
                setAnatomyFormStyle={setAnatomyFormStyle}
                showCrossContours={showCrossContours}
                setShowCrossContours={setShowCrossContours}
              />
            )}

            {activeTab === 'composition' && (
              <CompositionPanel
                compOverlay={compOverlay}
                setCompOverlay={setCompOverlay}
                showGoldenSpiral={showGoldenSpiral}
                setShowGoldenSpiral={setShowGoldenSpiral}
                spiralFlip={spiralFlip}
                setSpiralFlip={setSpiralFlip}
                showDynamicSymmetry={showDynamicSymmetry}
                setShowDynamicSymmetry={setShowDynamicSymmetry}
                showArmature={showArmature}
                setShowArmature={setShowArmature}
                placingFocal={placingFocal}
                setPlacingFocal={setPlacingFocal}
                focalPoints={focalPoints}
                setFocalPoints={setFocalPoints}
              />
            )}

            {activeTab === 'measure' && (
              <MeasurePanel
                measuring={measuring}
                setMeasuring={setMeasuring}
                measurements={measurements}
                setMeasurements={setMeasurements}
              />
            )}
          </div>
        </aside>

        {/* Canvas */}
        <main className="canvas-container">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="canvas-base"
            />
            <canvas
              ref={overlayRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="canvas-overlay"
              onClick={handleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
            {!image && useBlankCanvas && (
              <div className="canvas-hint">
                <p>Blank canvas mode - start drawing!</p>
                <p className="hint-sub">Use tools on the left to add forms, perspective, anatomy</p>
              </div>
            )}
            {(editingLandmark || editingVP || placingFocal || placingForm) && (
              <div className="canvas-status">
                {editingLandmark && `Place: ${HumanLandmarks.find(l => l.key === editingLandmark)?.name || editingLandmark}`}
                {editingVP && 'Click to place Vanishing Point'}
                {placingFocal && 'Click to place Focal Point'}
                {placingForm && `Place ${formType}`}
              </div>
            )}

            {/* Educational Panel removed */}

            {/* Color Palette */}
            {showColorPalette && colorPalette.length > 0 && (
              <div className="color-palette">
                <div className="color-palette-header">
                  <span>🎨 Color Palette</span>
                  <button
                    className="btn-close-small"
                    onClick={() => setShowColorPalette(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="color-swatches">
                  {colorPalette.map((color, i) => (
                    <div
                      key={i}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      title={color}
                      onClick={() => navigator.clipboard.writeText(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Image Analysis */}
            {showImageAnalysis && imageAnalysis && (
              <div className="image-analysis">
                <div className="analysis-header">
                  <span>🔍 Image Analysis</span>
                  <button
                    className="btn-close-small"
                    onClick={() => setShowImageAnalysis(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="analysis-content">
                  <div><strong>Contrast:</strong> {imageAnalysis.values.contrast.toFixed(0)}</div>
                  <div><strong>Avg Value:</strong> {imageAnalysis.values.average.toFixed(0)}</div>
                  <div><strong>Light Source:</strong> {imageAnalysis.lightSource.angle.toFixed(2)}rad</div>
                </div>
              </div>
            )}

            {/* Quick tip removed */}
          </div>
        </main>
      </div>
    </div>
  );
}

// Panel Components
function Forms3DPanel({ formType, setFormType, placingForm, setPlacingForm, forms, selectedForm, setSelectedForm, setForms, manipulationMode, setManipulationMode, show3DAxes, setShow3DAxes, showConstruction, setShowConstruction, showGroundPlane, setShowGroundPlane, showShadows, setShowShadows, showMeasurements, setShowMeasurements, showIntersections, setShowIntersections, useDepthSorting, setUseDepthSorting, lightDirection, setLightDirection, booleanMode, setBooleanMode, booleanSelection, setBooleanSelection, booleanOperation, setBooleanOperation }) {
  const formTypes = ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'wedge', 'torus', 'capsule', 'octahedron'];

  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Add Form</h3>
        <div className="form-grid">
          {formTypes.map(type => (
            <button
              key={type}
              className={`btn-form ${formType === type ? 'btn-form-active' : ''}`}
              onClick={() => setFormType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <button
          className={`btn btn-primary ${placingForm ? 'btn-active' : ''}`}
          onClick={() => setPlacingForm(!placingForm)}
        >
          {placingForm ? 'Click to Place...' : `Add ${formType}`}
        </button>
      </div>

      <div className="panel-section">
        <h3>Boolean Operations</h3>
        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
          Combine forms (union, subtract, intersect)
        </p>
        <button
          className={`btn ${booleanMode ? 'btn-active' : ''}`}
          onClick={() => {
            setBooleanMode(!booleanMode);
            setBooleanSelection([]);
            setBooleanOperation(null);
          }}
        >
          {booleanMode ? '✓ Boolean Mode Active' : 'Enable Boolean Mode'}
        </button>

        {booleanMode && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
              Selected: {booleanSelection.length}/2 forms
              {booleanSelection.length > 0 && ` (${booleanSelection.map(i => i + 1).join(', ')})`}
            </div>

            {booleanSelection.length === 2 && (
              <div className="btn-group" style={{ flexDirection: 'column', gap: '4px' }}>
                <button
                  className={`btn btn-secondary btn-sm ${booleanOperation === 'union' ? 'btn-active' : ''}`}
                  onClick={() => setBooleanOperation(booleanOperation === 'union' ? null : 'union')}
                >
                  Union (Merge)
                </button>
                <button
                  className={`btn btn-secondary btn-sm ${booleanOperation === 'subtract' ? 'btn-active' : ''}`}
                  onClick={() => setBooleanOperation(booleanOperation === 'subtract' ? null : 'subtract')}
                >
                  Subtract (Cut)
                </button>
                <button
                  className={`btn btn-secondary btn-sm ${booleanOperation === 'intersect' ? 'btn-active' : ''}`}
                  onClick={() => setBooleanOperation(booleanOperation === 'intersect' ? null : 'intersect')}
                >
                  Intersect (Overlap)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedForm !== null && (
        <div className="panel-section">
          <h3>Manipulate Form {selectedForm + 1}</h3>
          <div className="btn-group">
            <button
              className={`btn ${manipulationMode === 'move' ? 'btn-active' : ''}`}
              onClick={() => setManipulationMode('move')}
            >
              Move
            </button>
            <button
              className={`btn ${manipulationMode === 'rotate' ? 'btn-active' : ''}`}
              onClick={() => setManipulationMode('rotate')}
            >
              Rotate
            </button>
            <button
              className={`btn ${manipulationMode === 'scale' ? 'btn-active' : ''}`}
              onClick={() => setManipulationMode('scale')}
            >
              Scale
            </button>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => {
              setForms(prev => prev.filter((_, i) => i !== selectedForm));
              setSelectedForm(null);
            }}
          >
            Delete Form
          </button>
        </div>
      )}

      <div className="panel-section">
        <h3>Display</h3>
        <label className="checkbox">
          <input type="checkbox" checked={showConstruction} onChange={e => setShowConstruction(e.target.checked)} />
          Construction Lines
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showGroundPlane} onChange={e => setShowGroundPlane(e.target.checked)} />
          Ground Plane
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showShadows} onChange={e => setShowShadows(e.target.checked)} />
          Shadows
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showMeasurements} onChange={e => setShowMeasurements(e.target.checked)} />
          Measurements
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showIntersections} onChange={e => setShowIntersections(e.target.checked)} />
          Show Intersections
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={useDepthSorting} onChange={e => setUseDepthSorting(e.target.checked)} />
          Depth Sorting
        </label>
      </div>

      {showShadows && (
        <div className="panel-section">
          <h3>Lighting</h3>
          <label className="slider-label">
            Light Direction X
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={lightDirection.x}
              onChange={e => setLightDirection(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
            />
            <span>{lightDirection.x.toFixed(1)}</span>
          </label>
          <label className="slider-label">
            Light Direction Y
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={lightDirection.y}
              onChange={e => setLightDirection(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
            />
            <span>{lightDirection.y.toFixed(1)}</span>
          </label>
          <label className="slider-label">
            Light Direction Z
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={lightDirection.z}
              onChange={e => setLightDirection(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
            />
            <span>{lightDirection.z.toFixed(1)}</span>
          </label>
        </div>
      )}

      {forms.length > 0 && (
        <div className="panel-section">
          <h3>Forms ({forms.length})</h3>
          <div className="form-list">
            {forms.map((form, i) => (
              <button
                key={i}
                className={`btn btn-list ${selectedForm === i ? 'btn-active' : ''}`}
                onClick={() => setSelectedForm(i === selectedForm ? null : i)}
              >
                {form.type} {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PerspectivePanel({ perspectiveType, setPerspectiveType, editingVP, setEditingVP, vanishingPoints, setVanishingPoints, showPerspectiveGrid, setShowPerspectiveGrid, gridDensity, setGridDensity, horizonY, setHorizonY, canvasHeight, perspectiveLines, setPerspectiveLines, fisheyeStrength, setFisheyeStrength, foundPerspectiveMode, setFoundPerspectiveMode, foundPerspectiveRef, cameraDistance, setCameraDistance }) {
  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Perspective Mode</h3>
        <select value={perspectiveType} onChange={e => setPerspectiveType(e.target.value)} className="select">
          <option value="1pt">1-Point (1 VP center)</option>
          <option value="2pt">2-Point (2 VPs horizontal)</option>
          <option value="3pt">3-Point (3 VPs + vertical)</option>
          <option value="fisheye">Fisheye / Curvilinear</option>
        </select>
        <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
          Mode sets default VPs. Add more below or drag to reposition.
        </p>
      </div>

      <div className="panel-section">
        <h3>Camera</h3>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
          Use mouse wheel to zoom
        </div>
        <label className="slider-label">
          Zoom Distance
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={cameraDistance}
            onChange={e => setCameraDistance(parseInt(e.target.value))}
            className="slider"
          />
          <span>{cameraDistance}</span>
        </label>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCameraDistance(500)}
        >
          Reset Camera
        </button>
      </div>

      {perspectiveType === 'fisheye' && (
        <div className="panel-section">
          <h3>Curvilinear Distortion</h3>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={fisheyeStrength}
            onChange={e => setFisheyeStrength(+e.target.value)}
            className="slider"
          />
          <span className="slider-value">{fisheyeStrength.toFixed(1)} (Subtle → Extreme)</span>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            Higher values create more dramatic curvature in forms
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3>Found Perspective</h3>
        <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
          Draw parallel lines in your reference to auto-detect vanishing points
        </p>
        <button
          className={`btn btn-primary ${foundPerspectiveMode ? 'btn-active' : ''}`}
          onClick={() => setFoundPerspectiveMode(!foundPerspectiveMode)}
        >
          {foundPerspectiveMode ? '✓ Drawing Lines...' : 'Enable Found Perspective'}
        </button>
        {perspectiveLines.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '11px', color: '#888' }}>
              {perspectiveLines.length} line{perspectiveLines.length !== 1 ? 's' : ''} drawn
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                setPerspectiveLines([]);
                if (foundPerspectiveRef.current) {
                  foundPerspectiveRef.current.clear();
                }
                setVanishingPoints([]);
              }}
              style={{ marginTop: '4px' }}
            >
              Clear Lines & VPs
            </button>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>Vanishing Points</h3>
        <button
          className={`btn btn-primary ${editingVP ? 'btn-active' : ''}`}
          onClick={() => setEditingVP(!editingVP)}
        >
          {editingVP ? 'Click to place...' : 'Add Vanishing Point'}
        </button>
        {vanishingPoints.length > 0 && (
          <div className="vp-list">
            {vanishingPoints.map((vp, i) => (
              <div key={vp.id} className="vp-item">
                <span style={{ color: vp.color }}>VP{i + 1}</span>
                <span className="vp-coords">({Math.round(vp.x)}, {Math.round(vp.y)})</span>
              </div>
            ))}
            <button className="btn btn-danger btn-sm" onClick={() => setVanishingPoints([])}>Clear All</button>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>Horizon Line</h3>
        <input
          type="range"
          min="0"
          max={canvasHeight}
          value={horizonY}
          onChange={e => setHorizonY(+e.target.value)}
          className="slider"
        />
        <span className="slider-value">{Math.round(horizonY)}px</span>
      </div>

      <div className="panel-section">
        <h3>Grid</h3>
        <label className="checkbox">
          <input type="checkbox" checked={showPerspectiveGrid} onChange={e => setShowPerspectiveGrid(e.target.checked)} />
          Show Grid
        </label>
        {showPerspectiveGrid && (
          <>
            <label className="slider-label">Density: {gridDensity}</label>
            <input
              type="range"
              min="8"
              max="32"
              value={gridDensity}
              onChange={e => setGridDensity(+e.target.value)}
              className="slider"
            />
          </>
        )}
      </div>

      <div className="panel-section">
        <h3>Perspective Lines</h3>
        <p className="hint">Drag on canvas to draw lines</p>
        {perspectiveLines.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => setPerspectiveLines([])}>
            Clear Lines ({perspectiveLines.length})
          </button>
        )}
      </div>
    </div>
  );
}

function AnatomyPanel({ anatomyMode, setAnatomyMode, quadrupedType, setQuadrupedType, landmarks, setLandmarks, editingLandmark, setEditingLandmark, landmarkDepth, setLandmarkDepth, showSkeleton, setShowSkeleton, showMasses, setShowMasses, showProportions, setShowProportions, showCrossSections, setShowCrossSections, showGesture, setShowGesture, gestureLine, setGestureLine, foreshortening, toggleForeshorten, setForeshortenAmount, analysisNotes, proportionSystem, setProportionSystem, autoGenerateForms, setAutoGenerateForms, anatomyFormStyle, setAnatomyFormStyle, showCrossContours, setShowCrossContours }) {
  const currentLandmarks = anatomyMode === 'human' ? HumanLandmarks : QuadrupedLandmarks;
  const currentSegments = anatomyMode === 'human' ? HumanLimbSegments : QuadrupedLimbSegments;
  const availableLimbs = currentSegments.filter(seg => landmarks[seg.from] && landmarks[seg.to]);

  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Anatomy Type</h3>
        <div className="btn-group">
          <button
            className={`btn ${anatomyMode === 'human' ? 'btn-active' : ''}`}
            onClick={() => setAnatomyMode('human')}
          >
            Human
          </button>
          <button
            className={`btn ${anatomyMode === 'quadruped' ? 'btn-active' : ''}`}
            onClick={() => setAnatomyMode('quadruped')}
          >
            Animal
          </button>
        </div>
        {anatomyMode === 'quadruped' && (
          <select value={quadrupedType} onChange={e => setQuadrupedType(e.target.value)} className="select">
            <option value={QuadrupedTypes.HORSE}>Horse</option>
            <option value={QuadrupedTypes.DOG}>Dog</option>
            <option value={QuadrupedTypes.CAT}>Cat</option>
            <option value={QuadrupedTypes.DEER}>Deer</option>
            <option value={QuadrupedTypes.LION}>Lion</option>
          </select>
        )}
      </div>

      {anatomyMode === 'human' && (
        <div className="panel-section">
          <h3>Proportions</h3>
          <select value={proportionSystem} onChange={e => setProportionSystem(e.target.value)} className="select">
            <option value="8-head-heroic">8 Head (Heroic)</option>
            <option value="7.5-head-ideal">7.5 Head (Ideal)</option>
            <option value="7-head-normal">7 Head (Normal)</option>
            <option value="6-head-stylized">6 Head (Stylized)</option>
          </select>
        </div>
      )}

      {anatomyMode === 'human' && (
        <div className="panel-section">
          <h3>Pose Templates</h3>
          <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
            Load pre-made poses with 3D landmarks
          </p>
          <div className="btn-group" style={{ flexDirection: 'column', gap: '4px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setLandmarks(PoseTemplates.human.tPose.landmarks)}
            >
              T-Pose (Neutral)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setLandmarks(PoseTemplates.human.actionPose.landmarks)}
            >
              Action (Running)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setLandmarks(PoseTemplates.human.contrapposto.landmarks)}
            >
              Contrapposto (Classical)
            </button>
          </div>
        </div>
      )}

      <div className="panel-section">
        <h3>Landmarks</h3>
        <div style={{ padding: '8px', background: 'rgba(100, 200, 255, 0.1)', borderRadius: '4px', marginBottom: '8px', fontSize: '11px' }}>
          <div>Active Landmarks: <strong>{Object.keys(landmarks).length}</strong></div>
          <div>Skeleton: <span style={{ color: showSkeleton ? '#00ff00' : '#ff4444' }}>{showSkeleton ? 'ON' : 'OFF'}</span></div>
          <div>Masses: <span style={{ color: showMasses ? '#00ff00' : '#ff4444' }}>{showMasses ? 'ON' : 'OFF'}</span></div>
        </div>
        <p className="hint">{anatomyMode === 'human' ? 'Start with Crown + Chin' : 'Start with Skull + Withers'}</p>

        <label className="slider-label">
          Placement Depth
          <input
            type="range"
            min="100"
            max="600"
            step="10"
            value={landmarkDepth}
            onChange={e => setLandmarkDepth(parseInt(e.target.value))}
          />
          <span>{landmarkDepth}</span>
        </label>

        <div className="landmark-grid">
          {currentLandmarks.map(lm => (
            <button
              key={lm.key}
              className={`btn-landmark ${editingLandmark === lm.key ? 'btn-landmark-editing' : landmarks[lm.key] ? 'btn-landmark-placed' : ''}`}
              style={{ borderLeftColor: lm.color }}
              onClick={() => setEditingLandmark(editingLandmark === lm.key ? null : lm.key)}
            >
              {lm.name}
            </button>
          ))}
        </div>
        {Object.keys(landmarks).length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => setLandmarks({})}>Clear All</button>
        )}
      </div>

      <div className="panel-section">
        <h3>Display</h3>
        <label className="checkbox">
          <input type="checkbox" checked={showProportions} onChange={e => setShowProportions(e.target.checked)} />
          Proportion Grid
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showSkeleton} onChange={e => setShowSkeleton(e.target.checked)} />
          Skeleton
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showMasses} onChange={e => setShowMasses(e.target.checked)} />
          Masses
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showCrossSections} onChange={e => setShowCrossSections(e.target.checked)} />
          Cross-Sections
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showGesture} onChange={e => setShowGesture(e.target.checked)} />
          Gesture Line
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={autoGenerateForms} onChange={e => setAutoGenerateForms(e.target.checked)} />
          Auto-Generate 3D Forms
        </label>

        {autoGenerateForms && (
          <div style={{ marginLeft: '8px', marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid rgba(100, 150, 255, 0.3)' }}>
            <h4 style={{ fontSize: '11px', marginBottom: '6px', color: '#8899cc' }}>Form Style</h4>
            <div className="btn-group" style={{ marginBottom: '8px' }}>
              <button
                className={`btn btn-sm ${anatomyFormStyle === 'basic' ? 'btn-active' : ''}`}
                onClick={() => setAnatomyFormStyle('basic')}
                title="Simple capsule forms"
              >
                Basic
              </button>
              <button
                className={`btn btn-sm ${anatomyFormStyle === 'bridgman' ? 'btn-active' : ''}`}
                onClick={() => setAnatomyFormStyle('bridgman')}
                title="Bridgman/Loomis style anatomical forms"
              >
                Bridgman
              </button>
            </div>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>
              {anatomyFormStyle === 'basic' ? 'Simple tapered cylinders between landmarks' : 'Bridgman/Loomis style volumetric forms with proper anatomical shapes'}
            </div>
            <label className="checkbox">
              <input type="checkbox" checked={showCrossContours} onChange={e => setShowCrossContours(e.target.checked)} />
              Show Cross-Contours
            </label>
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px', marginBottom: '8px' }}>
          {autoGenerateForms ? 'Forms generated between connected landmarks' : 'Enable to automatically build 3D forms'}
        </div>
        {gestureLine.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => setGestureLine([])}>Clear Gesture</button>
        )}
      </div>

      {availableLimbs.length > 0 && (
        <div className="panel-section">
          <h3>Foreshortening</h3>
          <div className="foreshorten-list">
            {availableLimbs.map(seg => {
              const fs = foreshortening[seg.id];
              return (
                <div key={seg.id} className="foreshorten-item">
                  <p className="foreshorten-name">{seg.name}</p>
                  <div className="btn-group">
                    <button
                      className={`btn btn-sm ${fs?.toward === true ? 'btn-active' : ''}`}
                      onClick={() => toggleForeshorten(seg.id, true)}
                    >
                      ← Toward
                    </button>
                    <button
                      className={`btn btn-sm ${fs?.toward === false ? 'btn-active' : ''}`}
                      onClick={() => toggleForeshorten(seg.id, false)}
                    >
                      Away →
                    </button>
                  </div>
                  {fs && (
                    <div className="foreshorten-slider">
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={fs.amount}
                        onChange={e => setForeshortenAmount(seg.id, +e.target.value)}
                        className="slider"
                      />
                      <span className="slider-value">{(fs.amount * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysisNotes.length > 0 && (
        <div className="panel-section">
          <h3>Analysis</h3>
          <div className="analysis-notes">
            {analysisNotes.map((note, i) => (
              <p key={i} className={`analysis-note ${note.type}`}>
                {note.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompositionPanel({ compOverlay, setCompOverlay, showGoldenSpiral, setShowGoldenSpiral, spiralFlip, setSpiralFlip, showDynamicSymmetry, setShowDynamicSymmetry, showArmature, setShowArmature, placingFocal, setPlacingFocal, focalPoints, setFocalPoints }) {
  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Composition Overlay</h3>
        <select value={compOverlay} onChange={e => setCompOverlay(e.target.value)} className="select">
          <option value="none">None</option>
          <option value="thirds">Rule of Thirds</option>
          <option value="golden">Golden Ratio</option>
          <option value="diagonal">Diagonal</option>
          <option value="weight">Visual Weight</option>
          <option value="balance">Balance Analyzer</option>
          <option value="flow">Flow & Movement</option>
        </select>
        {compOverlay === 'weight' && (
          <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
            Shows visual weight distribution and center of gravity
          </p>
        )}
        {compOverlay === 'balance' && (
          <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
            Displays left/right balance line and offset percentage
          </p>
        )}
        {compOverlay === 'flow' && (
          <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
            Analyzes directional movement and gesture flow
          </p>
        )}
      </div>

      <div className="panel-section">
        <h3>Golden Spiral</h3>
        <label className="checkbox">
          <input type="checkbox" checked={showGoldenSpiral} onChange={e => setShowGoldenSpiral(e.target.checked)} />
          Show Spiral
        </label>
        {showGoldenSpiral && (
          <div className="spiral-controls">
            <label className="checkbox">
              <input type="checkbox" checked={spiralFlip.h} onChange={e => setSpiralFlip(f => ({ ...f, h: e.target.checked }))} />
              Flip Horizontal
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={spiralFlip.v} onChange={e => setSpiralFlip(f => ({ ...f, v: e.target.checked }))} />
              Flip Vertical
            </label>
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>Advanced</h3>
        <label className="checkbox">
          <input type="checkbox" checked={showDynamicSymmetry} onChange={e => setShowDynamicSymmetry(e.target.checked)} />
          Dynamic Symmetry
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={showArmature} onChange={e => setShowArmature(e.target.checked)} />
          Armature
        </label>
      </div>

      <div className="panel-section">
        <h3>Focal Points</h3>
        <button
          className={`btn btn-primary ${placingFocal ? 'btn-active' : ''}`}
          onClick={() => setPlacingFocal(!placingFocal)}
        >
          {placingFocal ? 'Click to place...' : 'Add Focal Point'}
        </button>
        {focalPoints.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={() => setFocalPoints([])}>
            Clear All ({focalPoints.length})
          </button>
        )}
      </div>
    </div>
  );
}

function MeasurePanel({ measuring, setMeasuring, measurements, setMeasurements }) {
  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Measurements</h3>
        <button
          className={`btn btn-primary ${measuring ? 'btn-active' : ''}`}
          onClick={() => setMeasuring(!measuring)}
        >
          {measuring ? 'Drag to measure...' : 'Start Measuring'}
        </button>
        <p className="hint">Drag on canvas to measure distances</p>
      </div>

      {measurements.length > 0 && (
        <div className="panel-section">
          <h3>Measurements ({measurements.length})</h3>
          <div className="measurement-list">
            {measurements.map((m, i) => {
              const dist = MathUtils.distance2D(m.start, m.end);
              return (
                <p key={m.id} className="measurement-item">
                  Line {i + 1}: {Math.round(dist)}px
                </p>
              );
            })}
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setMeasurements([])}>Clear All</button>
        </div>
      )}
    </div>
  );
}
