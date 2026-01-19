# Artist's 3D Toolkit

A comprehensive, professional-grade artist's tool for analyzing composition, perspective, anatomy, and 3D forms. Built for artists like Kim Jung Gi, Scott Robertson, Peter Han, and anyone studying classical drawing methods.

## Features

### 🎨 **Blank Canvas Mode**
- Work without needing a reference image
- Customizable canvas background color
- Perfect for practice and learning

### 📐 **3D Forms System**
- **Primitive shapes**: Cube, Sphere, Cylinder, Cone, Pyramid
- **Full 3D manipulation**: Move, Rotate, Scale
- **Perspective projection**: All forms respect the current perspective system
- **Construction lines**: Toggle vertices, edges, and faces
- **3D axes**: Visual reference for X, Y, Z directions
- Place multiple forms and manipulate them in true 3D space

### 🌅 **Advanced Perspective**
Multiple perspective systems:
- **1-Point Perspective**: Single vanishing point
- **2-Point Perspective**: Two vanishing points (most common)
- **3-Point Perspective**: Three vanishing points (aerial views)
- **4-Point Perspective**: Four vanishing points
- **5-Point Perspective**: Five vanishing points (extreme wide angles)
- **Fisheye/Curvilinear**: Barrel distortion for ultra-wide views

Features:
- Draggable vanishing points
- Adjustable horizon line
- Perspective grid overlay with adjustable density
- Draw perspective construction lines
- Visual convergence guides

### 👤 **Human Anatomy**
Based on classical anatomy texts (Bridgman, Loomis, Goldfinger):

**Proportion Systems**:
- 8-Head Heroic (idealized superhero proportions)
- 7.5-Head Ideal (standard ideal proportions)
- 7-Head Normal (average human proportions)
- 6-Head Stylized (cartoony/chibi proportions)

**Features**:
- 30+ anatomical landmarks
- 8-head proportion grid overlay
- Skeleton visualization
- Anatomical masses (rib cage, pelvis, muscle groups)
- Gesture line drawing
- **Foreshortening analysis**: Mark limbs as foreshortened "toward" or "away"
- Cross-section ellipses showing foreshortening compression
- Automatic proportion analysis and feedback

### 🐴 **Animal Anatomy (Quadrupeds)**
Study animal anatomy with templates for:
- Horse
- Dog
- Cat
- Deer
- Lion

Features:
- Complete skeletal structure
- Leg segments (shoulder, elbow, knee, hock, fetlock, hoof)
- Spine (withers, croup, tail base)
- Anatomical masses
- Proper quadruped proportions

### 🎭 **Composition Tools**

**Grid Overlays**:
- Rule of Thirds (power points)
- Golden Ratio (φ = 1.618)
- Diagonal armature
- Dynamic Symmetry (root rectangles)
- Full armature (diagonals + center lines)

**Golden Spiral**:
- Adjustable Fibonacci spiral
- Flip horizontal/vertical
- Follows golden ratio construction

**Focal Points**:
- Place multiple focal points
- Visual emphasis markers

### 📏 **Measurement Tools**
- Click-and-drag to measure distances
- Pixel measurements with end caps
- Multiple simultaneous measurements
- Perfect for checking proportions

## How to Use

### Installation

```bash
npm install
npm run dev
```

The application will open in your browser at `http://localhost:3000`

### Basic Workflow

#### 1. **Start with Blank Canvas or Upload Image**
- Click "Blank Canvas" to work from scratch
- Or upload a reference image to analyze

#### 2. **Choose Your Tool Mode**
- **3D FORMS**: Place and manipulate 3D primitives
- **PERSPECTIVE**: Set up vanishing points and grid
- **ANATOMY**: Place anatomical landmarks (human or animal)
- **COMPOSITION**: Add compositional overlays
- **MEASURE**: Take measurements

#### 3. **Set Up Perspective (Optional)**
- Click "PERSPECTIVE" tab
- Choose perspective type (1pt, 2pt, 3pt, etc.)
- Click "Add Vanishing Point" and place on canvas
- Adjust horizon line height
- Toggle perspective grid for visual guides

#### 4. **Add 3D Forms**
- Click "3D FORMS" tab
- Select a form type (cube, sphere, etc.)
- Click "Add [form]" then click on canvas to place
- Use Move/Rotate/Scale modes to manipulate
- All forms automatically project with current perspective

#### 5. **Analyze Anatomy**
- Click "ANATOMY" tab
- Choose "Human" or "Animal"
- For humans: Start by placing **Crown** and **Chin**
- Click landmark buttons, then click canvas to place
- Use foreshortening controls for limbs coming toward/away from viewer
- Toggle skeleton, masses, cross-sections

#### 6. **Apply Composition**
- Click "COMPOSITION" tab
- Choose grid overlay (Rule of Thirds, Golden Ratio, etc.)
- Enable Golden Spiral and adjust flip
- Place focal points

### Pro Tips

**3D Forms**:
- Forms respect the perspective system - set up perspective first for accurate projection
- Use construction lines to see internal structure
- Rotate forms in all three axes for complex angles
- Layer multiple forms to build complex objects

**Perspective**:
- Place vanishing points off-canvas for natural looking perspective
- Use 2-point perspective for most scenes
- 3-point perspective adds drama (looking up or down)
- Fisheye is great for ultra-wide shots

**Anatomy**:
- Always start with Crown + Chin for humans (establishes head unit)
- Use the 8-head grid to check proportions
- Foreshortening: Mark limbs as "toward viewer" or "away from viewer"
  - Adjust amount slider to control compression
  - Cross-sections show ellipse compression visually
- Gesture line captures the energy and flow of the pose

**Animal Anatomy**:
- Start with Skull + Withers
- Study how leg joints bend (horses have different joint angles than dogs)
- Notice how spine curvature differs between species

**Composition**:
- Power points (rule of thirds intersections) are strong focal areas
- Golden spiral leads the eye through the image
- Dynamic symmetry creates harmonious divisions
- Place focal points at areas of highest interest

**Workflow for Learning**:
1. Upload master artwork
2. Analyze perspective (find vanishing points)
3. Trace gesture lines
4. Mark anatomical landmarks
5. Check proportions
6. Note compositional structure
7. Practice by recreating on blank canvas

## Technical Details

- Built with React + Vite
- Custom 3D math (no Three.js - full control)
- Manual artist-controlled tools (no AI/ML dependencies)
- 2D canvas with 3D projection mathematics
- Responsive design

## Artist References

This tool implements techniques from:
- **Kim Jung Gi**: Gesture, spatial reasoning, form construction
- **Scott Robertson**: Perspective grids, 3D forms, technical drawing
- **Peter Han**: Dynamic sketching, gesture, energy
- **Andrew Loomis**: Figure proportions, construction
- **George Bridgman**: Anatomical masses, foreshortening
- **Elliot Goldfinger**: Animal anatomy
- **Classical methods**: Dynamic symmetry, golden ratio, compositional armature

## License

MIT

---

*"Drawing is not what you see, but what you can make others see." - Edgar Degas*
