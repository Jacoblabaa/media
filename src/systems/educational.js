/**
 * Educational System for Artists
 *
 * Provides contextual help, tips, and explanations for drawing concepts
 */

export const EducationalContent = {
  // 3D Forms concepts
  forms: {
    cube: {
      title: "The Cube - Foundation of Form",
      description: "Master the cube to understand all rectangular forms. Everything from buildings to books can be simplified to cubes in perspective.",
      tips: [
        "Notice how parallel lines converge to vanishing points",
        "The cube helps establish the perspective of your entire scene",
        "Use cubes to block out complex objects before adding details"
      ],
      artistReference: "Scott Robertson teaches: 'If you can draw a cube in perspective, you can draw anything.'"
    },
    sphere: {
      title: "The Sphere - Curved Form Master",
      description: "Spheres show how form wraps around in 3D space. Essential for heads, joints, organic forms.",
      tips: [
        "Cross-contour lines wrap around the sphere's surface",
        "The sphere's silhouette changes based on viewpoint",
        "Use spheres to find the core shadow and terminator line"
      ],
      artistReference: "Kim Jung Gi builds complex forms from simple spheres and cylinders in his mind."
    },
    cylinder: {
      title: "The Cylinder - Form in Motion",
      description: "Cylinders are everywhere: arms, legs, tree trunks, columns. Master ellipses to master cylinders.",
      tips: [
        "Ellipses get wider as they move away from eye level",
        "The center line shows the cylinder's direction and tilt",
        "Stack cylinders to create complex tapered forms"
      ],
      artistReference: "Peter Han's Dynamic Sketching emphasizes cylinder construction for figure drawing."
    },
    cone: {
      title: "The Cone - Tapering Forms",
      description: "Cones create taper and convergence. Use for limbs, perspective tricks, and focal points.",
      tips: [
        "The cone's base follows the same ellipse rules as cylinders",
        "Cones can be truncated (cut off) for more variety",
        "Great for understanding foreshortening in limbs"
      ],
      artistReference: "Andrew Loomis used cone forms extensively in figure construction."
    },
    pyramid: {
      title: "The Pyramid - Angular Forms",
      description: "Pyramids create strong directional shapes. Useful for mountains, roofs, and stylized forms.",
      tips: [
        "The apex creates a strong focal point",
        "All edges converge to the tip",
        "Combine pyramids for complex angular structures"
      ],
      artistReference: "Classical perspective drawing uses pyramids to understand visual fields."
    },
    wedge: {
      title: "The Wedge - Sloped Surfaces",
      description: "Wedges create ramps, slopes, and transitions between forms.",
      tips: [
        "Perfect for understanding terrain and inclines",
        "Combines properties of cubes and pyramids",
        "Use to practice two-point perspective with slopes"
      ]
    },
    capsule: {
      title: "The Capsule - Organic Simplified",
      description: "Capsules (rounded cylinders) are perfect for limbs, fingers, and soft forms.",
      tips: [
        "The rounded ends eliminate complex cap construction",
        "Natural for figure drawing and character design",
        "Shows how organic forms simplify to basic shapes"
      ],
      artistReference: "Figure artists use capsules for quick gesture armatures."
    }
  },

  // Perspective concepts
  perspective: {
    onePoint: {
      title: "1-Point Perspective",
      description: "One vanishing point - perfect for corridors, roads, and frontal views.",
      tips: [
        "All horizontal lines going into depth converge to the VP",
        "Vertical lines stay vertical, horizontals across stay horizontal",
        "Creates strong sense of depth and focus"
      ],
      whenToUse: "Interior scenes, hallways, roads going into distance, frontal architectural views"
    },
    twoPoint: {
      title: "2-Point Perspective",
      description: "Two vanishing points - the most common perspective for general scenes.",
      tips: [
        "Vertical lines stay vertical",
        "Left and right sides converge to separate VPs",
        "Natural for eye-level views of objects and environments"
      ],
      whenToUse: "Most general scenes, buildings at an angle, objects on a table, city streets"
    },
    threePoint: {
      title: "3-Point Perspective",
      description: "Three vanishing points - adds dramatic angles by tilting verticals.",
      tips: [
        "Third VP is above (worm's eye) or below (bird's eye)",
        "Creates dramatic, dynamic compositions",
        "Nothing stays perfectly vertical or horizontal"
      ],
      whenToUse: "Dramatic angles, superhero shots, looking up at tall buildings, aerial views"
    },
    fisheye: {
      title: "Fisheye/Curvilinear Perspective",
      description: "Curved perspective mimicking extreme wide-angle lens or natural vision periphery.",
      tips: [
        "Lines curve away from the center of vision",
        "Creates immersive, enveloping space",
        "More realistic to actual human vision than linear perspective"
      ],
      whenToUse: "Kim Jung Gi-style drawings, dynamic action scenes, conveying spatial immersion"
    }
  },

  // Form Interaction concepts
  interactions: {
    intersection: {
      title: "Form Intersection",
      description: "Where forms meet and overlap in space. Critical for understanding complex objects.",
      tips: [
        "The intersection line follows the surface of both forms",
        "Helps establish spatial relationships",
        "Use to check if your perspective is consistent"
      ],
      exercise: "Place two cylinders crossing - notice how the intersection wraps around both"
    },
    stacking: {
      title: "Form Stacking & Depth",
      description: "Layering forms in space creates depth and complexity.",
      tips: [
        "Closer forms occlude (hide) further forms",
        "Overlap is a primary depth cue",
        "Use atmospheric perspective for distant forms"
      ],
      exercise: "Stack 5 cubes at different depths - observe how overlap creates depth hierarchy"
    },
    subtraction: {
      title: "Subtractive Forms",
      description: "Remove volume from forms to create complexity (holes, cutouts, negative space).",
      tips: [
        "Think like a sculptor removing material",
        "Helps understand negative space in drawing",
        "The cut surface reveals new planes"
      ],
      exercise: "Subtract a cylinder from a cube - creates a tunnel, reveals interior planes"
    }
  },

  // Drawing Techniques
  techniques: {
    construction: {
      title: "Construction Lines",
      description: "Light guidelines that establish structure before committing to final lines.",
      tips: [
        "Draw through forms to understand 3D structure",
        "Keep construction lines light and loose",
        "Don't erase them immediately - they show your thinking"
      ],
      kimJungGiNote: "Kim Jung Gi constructs entire scenes mentally before drawing - practice visualization!"
    },
    gesture: {
      title: "Gesture & Flow",
      description: "The energy and movement line that runs through your composition.",
      tips: [
        "Gesture comes FIRST - establishes rhythm",
        "Think of flow through the entire scene",
        "Gesture should be felt, not measured"
      ],
      reference: "Peter Han emphasizes gesture as the foundation of all drawing"
    },
    foreshortening: {
      title: "Foreshortening",
      description: "Forms appear compressed when pointing toward or away from the viewer.",
      tips: [
        "Ellipses get wider as forms point more toward you",
        "Use overlapping forms to show depth compression",
        "Cross-contours help visualize the compressed form"
      ],
      exercise: "Draw a cylinder pointing at you - the front circle is wide, the form compresses back"
    }
  },

  // Composition
  composition: {
    focal: {
      title: "Focal Points & Visual Hierarchy",
      description: "Guide the viewer's eye through strategic placement and emphasis.",
      tips: [
        "Primary focal point has highest contrast and detail",
        "Use leading lines to guide toward focal areas",
        "3-5 resting points keep the eye moving through composition"
      ]
    },
    rhythm: {
      title: "Rhythm & Repetition",
      description: "Repeating elements create visual music in your composition.",
      tips: [
        "Vary size and spacing to avoid monotony",
        "Rhythm can be geometric or organic",
        "Use rhythm to lead the eye"
      ]
    }
  }
};

/**
 * Get contextual tip based on current tool/action
 */
export function getContextualTip(context) {
  const { tool, formType, perspectiveType, action } = context;

  if (tool === '3d-forms' && formType) {
    return EducationalContent.forms[formType];
  }

  if (tool === 'perspective' && perspectiveType) {
    const typeMap = {
      '1pt': 'onePoint',
      '2pt': 'twoPoint',
      '3pt': 'threePoint',
      'fisheye': 'fisheye'
    };
    return EducationalContent.perspective[typeMap[perspectiveType]];
  }

  if (action === 'intersection') {
    return EducationalContent.interactions.intersection;
  }

  return null;
}

/**
 * Quick tips that cycle through as user works
 */
export const QuickTips = [
  "Kim Jung Gi: 'I visualize the entire composition in 3D space before drawing a single line.'",
  "Scott Robertson: 'Master the fundamentals - everything is a cube, cylinder, sphere, or cone.'",
  "Peter Han: 'Draw with your whole arm, not just your wrist. Feel the gesture.'",
  "Draw THROUGH forms - understanding the hidden structure makes the visible parts confident.",
  "Practice drawing the same object from 5 different angles to truly understand its form.",
  "Ellipses are the key to cylindrical forms. Master them at every angle.",
  "Use construction lines fearlessly - they're the scaffolding, not the building.",
  "Foreshortening: the form doesn't shrink, it compresses into your viewpoint.",
  "Every form casts a shadow. Shadows reveal the ground plane and spatial relationships.",
  "Perspective is a tool, not a prison. Break rules deliberately after you understand them.",
  "Visual hierarchy: detail + contrast = attention. Direct it wisely.",
  "Draw from imagination, then check reference. Build your visual library.",
  "Gesture first, structure second, details last. This order builds solid drawings.",
  "Negative space shapes matter as much as positive forms.",
  "Atmospheric perspective: distant forms are lighter, cooler, less detailed."
];

/**
 * Get a random quick tip
 */
export function getRandomTip() {
  return QuickTips[Math.floor(Math.random() * QuickTips.length)];
}
