

import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  Stars,
  Environment,
  ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export const GAME_NAME = "Doraemon's Art Atelier";

const DIFFICULTIES = {
  easy:   { label: 'Novice', icon: 'bi-palette', time: 35, shapes: 3, shuffleSlots: false },
  medium: { label: 'Artist', icon: 'bi-brush', time: 20, shapes: 4, shuffleSlots: true  },
  hard:   { label: 'Maestro', icon: 'bi-award', time: 10, shapes: 5, shuffleSlots: true  },
};


const SHAPE_DEFS = [
  { id: 'sphere',      label: 'Canvas',    color: '#FF5C8A', emissive: '#ff1a5c' },
  { id: 'cube',        label: 'Frame',     color: '#FFD54F', emissive: '#ffb300' },
  { id: 'torus',       label: 'Palette',   color: '#4FC3F7', emissive: '#0288d1' },
  { id: 'cone',        label: 'Brush',     color: '#69F0AE', emissive: '#00c853' },
  { id: 'octahedron',  label: 'Gem',       color: '#CE93D8', emissive: '#ab47bc' },
];


function ShapeGeo({ type, args }) {
  if (type === 'sphere')     return <sphereGeometry     args={args || [0.48, 48, 48]} />;
  if (type === 'cube')       return <boxGeometry         args={args || [0.78, 0.78, 0.78]} />;
  if (type === 'torus')      return <torusGeometry       args={args || [0.34, 0.14, 20, 48]} />;
  if (type === 'cone')       return <coneGeometry        args={args || [0.42, 0.86, 24]} />;
  if (type === 'octahedron') return <octahedronGeometry  args={args || [0.52, 0]} />;
  return null;
}


function Slot({ type, position, snapped, color }) {
  const ringRef = useRef();
  useFrame((_, dt) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += dt * (snapped ? 0.4 : 1.1);
      ringRef.current.rotation.x += dt * 0.3;
    }
  });

  return (
    <group position={position}>
     
      <mesh>
        <ShapeGeo type={type} />
        <meshStandardMaterial
          color="#1a2a5e"
          transparent opacity={snapped ? 0 : 0.55}
          roughness={0.95}
          emissive={snapped ? '#000' : '#0d1b4a'}
          emissiveIntensity={0.3}
        />
      </mesh>

      {!snapped && (
        <mesh ref={ringRef} position={[0, 0, 0]}>
          <torusGeometry args={[0.72, 0.028, 8, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.2}
            transparent opacity={0.7}
          />
        </mesh>
      )}

    
      {snapped && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
          <torusGeometry args={[0.62, 0.04, 8, 48]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.9} />
        </mesh>
      )}

    
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.56, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.06, 48]} />
        <meshStandardMaterial color="#0d1b4a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

function DraggableShape({ shapeDef, targetPos, onSnap, disabled }) {
  const { size, viewport } = useThree();
  const [snapped, setSnapped] = useState(false);
  const [held, setHeld]       = useState(false);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState([targetPos[0], -2.5, 1.2]);
  const [scale, setScale] = useState([1, 1, 1]);
  const meshRef = useRef();

  const initX = targetPos[0];
  const initY = -2.5;


  useFrame((state) => {
    if (!meshRef.current || snapped || held || dragging) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y += 0.008;
    meshRef.current.rotation.x = Math.sin(t * 0.6 + initX) * 0.12;
  });

  const handlePointerDown = (event) => {
    if (snapped || disabled) return;
    event.stopPropagation();
    event.target.setPointerCapture(event.pointerId);
    setHeld(true);
    setDragging(true);
    setScale([1.08, 1.08, 1.08]);
  };

  const handlePointerMove = (event) => {
    if (!dragging || snapped || disabled) return;
    const point = event.point;
    setPosition([point.x, point.y, 1.8]);
  };

  const handlePointerUp = (event) => {
    if (!dragging || snapped || disabled) return;
    event.target.releasePointerCapture(event.pointerId);
    setDragging(false);
    setHeld(false);

    const point = event.point;
    const dx = point.x - targetPos[0];
    const dy = point.y - targetPos[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.55) {
      setSnapped(true);
      setPosition([targetPos[0], targetPos[1], 0.1]);
      setScale([1.12, 1.12, 1.12]);
      onSnap();
    } else {
      setPosition([initX, initY, 1.2]);
      setScale([1, 1, 1]);
    }
  };

  const col = new THREE.Color(shapeDef.color);

  return (
    <mesh
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      position={position}
      scale={scale}
      castShadow
    >
      <ShapeGeo type={shapeDef.id} />
      <meshStandardMaterial
        color={col}
        roughness={0.12}
        metalness={0.25}
        emissive={col}
        emissiveIntensity={held ? 0.65 : snapped ? 0.55 : 0.25}
        envMapIntensity={1.2}
      />
    </mesh>
  );
}

//  DORAEMON SVG  CHARACTER 
function DoraemonCharacter({ position = [-5.5, -0.8, -1] }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.09;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.07;
  });

  const blue  = '#1565C0';
  const white = '#FAFAFA';
  const red   = '#EF5350';
  const gold  = '#FFD54F';

  return (
    <group ref={groupRef} position={position} scale={0.78}>
    
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.95, 32, 28]} />
        <meshStandardMaterial color={blue} roughness={0.3} metalness={0.05} />
      </mesh>
    
      <mesh position={[0, -0.05, 0.72]}>
        <sphereGeometry args={[0.62, 28, 24]} />
        <meshStandardMaterial color={white} roughness={0.5} />
      </mesh>
     
      <mesh position={[0, -0.28, 0.95]} rotation={[0.15, 0, 0]}>
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial color="#0d47a1" side={THREE.DoubleSide} />
      </mesh>
    
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.9, 32, 28]} />
        <meshStandardMaterial color={blue} roughness={0.3} metalness={0.05} />
      </mesh>
     
      <mesh position={[0, 1.55, 0.65]}>
        <sphereGeometry args={[0.66, 28, 24]} />
        <meshStandardMaterial color={white} roughness={0.5} />
      </mesh>
      
      {[[-0.22, 1.77], [0.22, 1.77]].map(([ex, ey], i) => (
        <group key={i}>
          <mesh position={[ex, ey, 1.16]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color={white} roughness={0.2} />
          </mesh>
          <mesh position={[ex, ey, 1.27]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.3} />
          </mesh>
          <mesh position={[ex + 0.03, ey + 0.03, 1.31]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={white} />
          </mesh>
        </group>
      ))}
      
      <mesh position={[0, 1.48, 1.22]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color={red} roughness={0.2} emissive={red} emissiveIntensity={0.2} />
      </mesh>
     
      <mesh position={[0, 1.3, 1.18]} rotation={[0.1, 0, 0]}>
        <torusGeometry args={[0.22, 0.022, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
     
      {[-1, 1].map(side => (
        [[-0.06, 0], [0.04, 0], [0.14, 0]].map(([wy], j) => (
          <mesh key={`w${side}${j}`} position={[side * 0.58, 1.44 + wy, 1.05]} rotation={[0, 0, Math.PI / 2 + (side * 0.07 * (j - 1))]}>
            <cylinderGeometry args={[0.008, 0.008, 0.42, 6]} />
            <meshStandardMaterial color="#666" roughness={0.9} />
          </mesh>
        ))
      ))}
    
      <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.085, 8, 40]} />
        <meshStandardMaterial color={red} roughness={0.3} emissive={red} emissiveIntensity={0.15} />
      </mesh>
  
      <mesh position={[0, 0.52, 0.65]}>
        <sphereGeometry args={[0.115, 16, 14]} />
        <meshStandardMaterial color={gold} roughness={0.08} metalness={0.85} emissive={gold} emissiveIntensity={0.4} />
      </mesh>
    
      {[-1, 1].map(side => (
        <group key={`arm${side}`}>
          <mesh position={[side * 1.0, 0.25, 0.1]} rotation={[0, 0, side * (Math.PI / 2.6)]}>
            <cylinderGeometry args={[0.13, 0.11, 0.75, 14]} />
            <meshStandardMaterial color={blue} roughness={0.3} />
          </mesh>
          <mesh position={[side * 1.5, -0.1, 0.1]}>
            <sphereGeometry args={[0.21, 18, 16]} />
            <meshStandardMaterial color={white} roughness={0.45} />
          </mesh>
        </group>
      ))}
     
      {[-1, 1].map(side => (
        <group key={`leg${side}`}>
          <mesh position={[side * 0.4, -1.05, 0.05]}>
            <cylinderGeometry args={[0.17, 0.14, 0.5, 14]} />
            <meshStandardMaterial color={blue} roughness={0.3} />
          </mesh>
          <mesh position={[side * 0.4, -1.38, 0.14]} scale={[1, 0.52, 1.45]}>
            <sphereGeometry args={[0.23, 16, 14]} />
            <meshStandardMaterial color={white} roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
}


function ArtDeco() {
  const items = useRef([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    items.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.x = t * 0.3 + i;
      m.rotation.y = t * 0.5 + i * 1.2;
      m.position.y += Math.sin(t * 0.6 + i * 2) * 0.0015;
    });
  });

  const decos = [
    { pos: [4.5, 2.0, -2], color: '#FF5C8A', type: 'torus' },
    { pos: [-4, 1.5, -2.5], color: '#FFD54F', type: 'octahedron' },
    { pos: [5, -0.5, -3], color: '#4FC3F7', type: 'sphere' },
    { pos: [-3.5, -1.5, -2], color: '#CE93D8', type: 'cube' },
    { pos: [3, 3, -4], color: '#69F0AE', type: 'cone' },
    { pos: [-5, 3, -4], color: '#FF5C8A', type: 'cube' },
  ];

  return (
    <>
      {decos.map((d, i) => (
        <mesh
          key={i}
          ref={el => (items.current[i] = el)}
          position={d.pos}
          scale={0.28}
        >
          <ShapeGeo type={d.type} />
          <meshStandardMaterial
            color={d.color}
            emissive={d.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.55}
            roughness={0.1}
          />
        </mesh>
      ))}
    </>
  );
}

// CANVAS 
function SceneBackground() {
  return (
    <>
      <Stars radius={60} depth={50} count={2500} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#0a0520', 12, 35]} />
    </>
  );
}


function Stage() {
  return (
    <group>
     
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.62, 0]}>
        <circleGeometry args={[7.5, 64]} />
        <meshStandardMaterial color="#0d1b4a" roughness={0.5} metalness={0.4} />
      </mesh>
  
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.59, 0]}>
        <torusGeometry args={[7.4, 0.06, 8, 96]} />
        <meshStandardMaterial color="#4FC3F7" emissive="#4FC3F7" emissiveIntensity={1.5} />
      </mesh>
     
      {[-3, -1.5, 0, 1.5, 3].map(v => (
        <group key={v}>
          <mesh position={[v, -2.57, 0]}>
            <boxGeometry args={[0.02, 0.01, 14]} />
            <meshStandardMaterial color="#4FC3F7" emissive="#4FC3F7" emissiveIntensity={0.35} transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, -2.57, v]}>
            <boxGeometry args={[14, 0.01, 0.02]} />
            <meshStandardMaterial color="#4FC3F7" emissive="#4FC3F7" emissiveIntensity={0.35} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
 
      <ContactShadows position={[0, -2.58, 0]} opacity={0.6} scale={14} blur={2.5} far={4} />
    </group>
  );
}


function SceneLights() {
  const fillRef = useRef();
  useFrame((state) => {
    if (fillRef.current) {
      const t = state.clock.elapsedTime;
      fillRef.current.intensity = 1.4 + Math.sin(t * 0.9) * 0.3;
    }
  });
  return (
    <>
      <ambientLight intensity={0.55} color="#6688cc" />
      <directionalLight position={[5, 10, 6]} intensity={1.3} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={30} color="#ffffff" />
      <pointLight ref={fillRef} position={[-4, 4, 3]} intensity={1.4} color="#4FC3F7" distance={18} />
      <pointLight position={[4, -2, -3]} intensity={1.0} color="#FF5C8A" distance={14} />
      <pointLight position={[0, 6, 0]} intensity={0.6} color="#FFD54F" distance={12} />
    </>
  );
}

function GameScene({ shapes, slots, onSnap, resetKey, gameActive }) {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.x = Math.sin(t * 0.08) * 0.35;
    state.camera.position.y = 2 + Math.sin(t * 0.12) * 0.2;
  });

  return (
    <>
      <SceneLights />
      <SceneBackground />
      <Stage />
      <ArtDeco />
      <DoraemonCharacter position={[-5.6, -0.9, -0.5]} />

      
      {slots.map((slot) => (
        <Slot
          key={`slot-${slot.id}`}
          type={slot.type}
          position={[slot.x, 0.45, 0]}
          snapped={slot.snapped}
          color={SHAPE_DEFS.find(s => s.id === slot.type)?.color ?? '#fff'}
        />
      ))}


      {gameActive && shapes.map((shape) => (
        <DraggableShape
          key={`shape-${shape.id}-${resetKey}`}
          shapeDef={shape.def}
          targetPos={[slots.find(s => s.type === shape.def.id && !s.snapped)?.x ?? shape.initX, 0.45, 0]}
          onSnap={() => onSnap(shape.id, shape.def.id)}
          resetKey={resetKey}
          disabled={!gameActive}
        />
      ))}
    </>
  );
}


function ComboFlash({ value }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="combo-flash">
      <i className="bi bi-stars combo-icon" aria-hidden="true" />
      +{value}
    </div>
  );
}


function Modal({ state, score, level, onStart, onRestart, snapped, total }) {
  if (state === 'playing') return null;

  const isStart = state === 'idle';
  const isWon   = state === 'won';

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-icon">
          <i className={`bi ${isStart ? 'bi-palette' : isWon ? 'bi-trophy-fill' : 'bi-clock-fill'}`} aria-hidden="true" />
        </div>
        <h2 className="modal-title">
          {isStart
            ? "Doraemon's Art Atelier"
            : isWon
            ? 'Masterpiece Complete!'
            : 'Time Ran Out!'}
        </h2>
        <p className="modal-body">
          {isStart
            ? 'Drag glowing art gadgets into their matching shadow slots before Doraemon\'s pocket closes! Complete all 5 gallery levels!'
            : isWon
            ? `Gallery Level ${level} cleared! You've scored ${score.toLocaleString()} pts. The atelier grows ever more magnificent!`
            : `You matched ${snapped} of ${total} pieces in Level ${level}. The muse waits , try again!`}
        </p>
        <div className="modal-btn-row">
          {isStart
            ? <button className="mbtn primary" onClick={onStart}><i className="bi bi-play-fill" aria-hidden="true" /> Enter the Atelier</button>
            : <>
                <button className="mbtn primary" onClick={onRestart}><i className="bi bi-arrow-repeat" aria-hidden="true" /> Try Again</button>
                {isWon && <button className="mbtn secondary" onClick={onRestart}>Next Level <i className="bi bi-arrow-right" aria-hidden="true" /></button>}
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ROOT APP
export default function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [gameState,  setGameState]  = useState('idle');   
  const [score,      setScore]      = useState(0);
  const [level,      setLevel]      = useState(1);
  const [timeLeft,   setTimeLeft]   = useState(35);
  const [maxTime,    setMaxTime]    = useState(35);
  const [shapes,     setShapes]     = useState([]);
  const [slots,      setSlots]      = useState([]);
  const [snappedCount, setSnappedCount] = useState(0);
  const [resetKey,   setResetKey]   = useState(0);
  const [combo,      setCombo]      = useState(null);

  const timerRef = useRef(null);


  const buildLevel = (diff = difficulty) => {
    const cfg = DIFFICULTIES[diff];
    const pool = SHAPE_DEFS.slice(0, cfg.shapes);
    const spacing = Math.min(2.2, 9 / (cfg.shapes + 1));
    const startX  = -((cfg.shapes - 1) * spacing) / 2;

    const newShapes = pool.map((def, i) => ({
      id:    `${def.id}-${Date.now()}-${i}`,
      def,
      initX: startX + i * spacing,
    }));

    let slotOrder = [...pool];
    if (cfg.shuffleSlots) slotOrder = slotOrder.sort(() => Math.random() - 0.5);

    const newSlots = slotOrder.map((def, i) => ({
      id:      `slot-${def.id}-${i}`,
      type:    def.id,
      x:       startX + i * spacing,
      snapped: false,
    }));

    setShapes(newShapes);
    setSlots(newSlots);
    setSnappedCount(0);
    setResetKey(k => k + 1);
    setTimeLeft(cfg.time);
    setMaxTime(cfg.time);
  };

  // Start game
  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameState('playing');
    buildLevel(difficulty);
  };

  //  Restart current level 
  const restartLevel = () => {
    setGameState('playing');
    buildLevel(difficulty);
  };

  //  Timer 
  useEffect(() => {
    if (gameState !== 'playing') { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameState('lost');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState, resetKey]);

  const handleSnap = (shapeId, shapeType) => {
    setSlots(prev =>
      prev.map(s => s.type === shapeType && !s.snapped ? { ...s, snapped: true } : s)
    );

    const pts = Math.max(20, Math.floor((timeLeft / maxTime) * 150) + 60);
    setScore(s => s + pts);
    setCombo({ value: pts, key: Date.now() });

    setSnappedCount(prev => {
      const next = prev + 1;
      const total = DIFFICULTIES[difficulty].shapes;
      if (next >= total) {
        clearInterval(timerRef.current);
        const newLevel = level + 1;
        if (newLevel > 5) {
          setGameState('won');
        } else {
          setTimeout(() => {
            setLevel(newLevel);
         
            const diffKeys = Object.keys(DIFFICULTIES);
            const nextDiff = diffKeys[Math.min(newLevel - 1, diffKeys.length - 1)];
            setDifficulty(nextDiff);
            buildLevel(nextDiff);
            setGameState('playing');
          }, 900);
        }
      }
      return next;
    });
  };

  // Difficulty button 
  const handleDiffChange = (d) => {
    setDifficulty(d);
    if (gameState === 'playing') {
      buildLevel(d);
    }
  };

  const timerPct = (timeLeft / maxTime) * 100;
  const timerColor =
    timerPct > 60 ? '#4FC3F7' :
    timerPct > 30 ? '#FFD54F' : '#FF5252';

  return (
    <div className="app-root">

      <Canvas
        camera={{ position: [0, 2, 9], fov: 58 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        className="three-canvas"
      >
        <Suspense fallback={null}>
          <Environment preset="night" />
          <GameScene
            shapes={shapes}
            slots={slots}
            onSnap={handleSnap}
            resetKey={resetKey}
            gameActive={gameState === 'playing'}
          />
        </Suspense>
      </Canvas>

      <div className="hud">
       
        <header className="hud-header">
          <div className="hud-title">
            <span className="title-icon">D</span>
            <span className="title-text">
              Doraemon's <em>Art Atelier</em>
            </span>
          </div>
          <div className="hud-stats">
            <div className="stat-chip">
              <span className="stat-label">SCORE</span>
              <span className="stat-val">{score.toLocaleString()}</span>
            </div>
            <div className={`stat-chip timer-chip ${timerPct < 30 ? 'danger' : ''}`}>
              <span className="stat-label">TIME</span>
              <span className="stat-val">{timeLeft}s</span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">LEVEL</span>
              <span className="stat-val">{level}/5</span>
            </div>
          </div>
        </header>

      
        <div className="timer-bar-track">
          <div
            className="timer-bar-fill"
            style={{ width: `${timerPct}%`, background: timerColor }}
          />
        </div>

  
        <div className="progress-dots">
          {slots.map((s, i) => (
            <div key={i} className={`dot ${s.snapped ? 'done' : ''}`}
              style={{ '--dot-color': SHAPE_DEFS.find(d => d.id === s.type)?.color }} />
          ))}
        </div>

      
        <p className="hint-text">DRAG art pieces to their matching shadow slots</p>

      
        <div className="diff-row">
          {Object.entries(DIFFICULTIES).map(([key, cfg]) => (
            <button
              key={key}
              className={`diff-btn ${difficulty === key ? 'active' : ''}`}
              onClick={() => handleDiffChange(key)}
            >
              <i className={`bi ${cfg.icon} diff-icon`} aria-hidden="true" />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      
      <div className="combo-container">
        {combo && <ComboFlash key={combo.key} value={combo.value} />}
      </div>

   
      <Modal
        state={gameState}
        score={score}
        level={level}
        snapped={snappedCount}
        total={DIFFICULTIES[difficulty].shapes}
        onStart={startGame}
        onRestart={gameState === 'won' ? restartLevel : restartLevel}
      />
    </div>
  );
}