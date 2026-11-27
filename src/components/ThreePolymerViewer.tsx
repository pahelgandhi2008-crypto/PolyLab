import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RotateCcw, ChevronDown, ChevronUp, Play, Pause } from 'lucide-react';
import { Atom3D, ElementSymbol, PolymerData } from '../types/polymer';

interface ThreePolymerViewerProps {
  polymer: PolymerData;
}

type RenderMode = 'ball-stick' | 'space-fill' | 'chain-helix';

const CPK_STYLE: Record<
  ElementSymbol,
  { color: number; covalentR: number; vdwR: number; label: string; atomicMass: string }
> = {
  C: { color: 0x262d36, covalentR: 0.34, vdwR: 0.85, label: 'Carbon (C)', atomicMass: '12.011 u' },
  H: { color: 0xf1f5f9, covalentR: 0.21, vdwR: 0.56, label: 'Hydrogen (H)', atomicMass: '1.008 u' },
  O: { color: 0xdc2626, covalentR: 0.33, vdwR: 0.78, label: 'Oxygen (O)', atomicMass: '15.999 u' },
  N: { color: 0x2563eb, covalentR: 0.33, vdwR: 0.80, label: 'Nitrogen (N)', atomicMass: '14.007 u' },
  S: { color: 0xeab308, covalentR: 0.42, vdwR: 0.94, label: 'Sulfur (S)', atomicMass: '32.06 u' },
  Cl: { color: 0x16a34a, covalentR: 0.40, vdwR: 0.90, label: 'Chlorine (Cl)', atomicMass: '35.45 u' },
  F: { color: 0x10b981, covalentR: 0.31, vdwR: 0.74, label: 'Fluorine (F)', atomicMass: '18.998 u' },
  I: { color: 0x7c3aed, covalentR: 0.48, vdwR: 1.04, label: 'Iodine (I)', atomicMass: '126.90 u' },
  P: { color: 0xea580c, covalentR: 0.41, vdwR: 0.92, label: 'Phosphorus (P)', atomicMass: '30.974 u' },
};

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const ThreePolymerViewer: React.FC<ThreePolymerViewerProps> = ({ polymer }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('ball-stick');
  const [repeatUnits, setRepeatUnits] = useState<number>(3);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [inspectedAtom, setInspectedAtom] = useState<{
    atom: Atom3D;
    unitIndex: number;
  } | null>(null);
  const [webglError, setWebglError] = useState<boolean>(false);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const autoRotateRef = useRef<boolean>(autoRotate);
  autoRotateRef.current = autoRotate;

  const rebuildMolecule = useCallback(
    (
      group: THREE.Group,
      data: PolymerData,
      mode: RenderMode,
      units: number,
      camera: THREE.PerspectiveCamera,
      controls: OrbitControls
    ) => {
      // Dispose old children cleanly
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.geometry?.dispose();
            if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
            else m.material?.dispose();
          }
        });
      }

      const atoms = data.atoms3D && data.atoms3D.length > 0 ? data.atoms3D : [];
      if (atoms.length === 0) return;

      const stepVec = new THREE.Vector3(
        data.chainStepVector?.[0] || 3.2,
        data.chainStepVector?.[1] || 0,
        data.chainStepVector?.[2] || 0
      );

      // Material cache per element for low draw overhead
      const atomMaterials = new Map<ElementSymbol, THREE.MeshPhysicalMaterial>();
      (Object.keys(CPK_STYLE) as ElementSymbol[]).forEach((el) => {
        const spec = CPK_STYLE[el];
        atomMaterials.set(
          el,
          new THREE.MeshPhysicalMaterial({
            color: spec.color,
            roughness: el === 'C' ? 0.38 : 0.25,
            metalness: el === 'I' || el === 'S' ? 0.12 : 0.04,
            clearcoat: 0.75,
            clearcoatRoughness: 0.18,
          })
        );
      });

      const bondMaterial = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.35,
        metalness: 0.45,
      });

      const aromaticMaterial = new THREE.MeshStandardMaterial({
        color: 0x0891b2,
        roughness: 0.3,
        metalness: 0.3,
      });

      const sphereGeo = new THREE.SphereGeometry(1, 28, 22);
      const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 16);

      const totalOffset = stepVec.clone().multiplyScalar((units - 1) / 2);
      const upVec = new THREE.Vector3(0, 1, 0);

      // Collect atom positions per unit to draw inter-unit polymer backbone bridges
      const unitAtomWorldPositions: THREE.Vector3[][] = [];

      for (let u = 0; u < units; u++) {
        const unitGroup = new THREE.Group();
        const shift = stepVec.clone().multiplyScalar(u).sub(totalOffset);
        // Subtle helical twist in chain-helix mode
        const twistAngle = mode === 'chain-helix' ? u * 0.35 : (u % 2 === 1 ? 0.14 : 0);
        const positionsForUnit: THREE.Vector3[] = [];

        atoms.forEach((atom) => {
          const el = CPK_STYLE[atom.element] ? atom.element : 'C';
          const spec = CPK_STYLE[el];
          const radius =
            mode === 'space-fill'
              ? spec.vdwR
              : mode === 'chain-helix'
              ? spec.covalentR * 0.85
              : spec.covalentR;

          const localPos = new THREE.Vector3(atom.x, atom.y, atom.z);
          localPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), twistAngle);
          localPos.add(shift);
          positionsForUnit[atom.id] = localPos.clone();

          const mesh = new THREE.Mesh(sphereGeo, atomMaterials.get(el));
          mesh.scale.setScalar(radius);
          mesh.position.copy(localPos);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.layers.enable(1); // Raycast inspection layer
          mesh.userData = { atom, unitIndex: u + 1 };
          unitGroup.add(mesh);
        });

        unitAtomWorldPositions.push(positionsForUnit);

        // Intra-unit covalent bonds
        if (mode !== 'space-fill') {
          data.bonds3D.forEach((bond) => {
            const p1 = positionsForUnit[bond.from];
            const p2 = positionsForUnit[bond.to];
            if (!p1 || !p2) return;
            const dir = p2.clone().sub(p1);
            const len = dir.length();
            if (len < 0.05) return;

            const mid = p1.clone().add(p2).multiplyScalar(0.5);
            const quat = new THREE.Quaternion().setFromUnitVectors(upVec, dir.clone().normalize());

            const addCylinder = (offsetVec: THREE.Vector3, r: number, mat: THREE.Material) => {
              const bMesh = new THREE.Mesh(cylGeo, mat);
              bMesh.scale.set(r, len, r);
              bMesh.position.copy(mid).add(offsetVec);
              bMesh.quaternion.copy(quat);
              bMesh.castShadow = true;
              unitGroup.add(bMesh);
            };

            const perp = new THREE.Vector3(0, 0, 1);
            if (Math.abs(dir.clone().normalize().dot(perp)) > 0.9) {
              perp.set(0, 1, 0);
            }
            perp.crossVectors(dir, perp).normalize();

            if (bond.order === 2) {
              addCylinder(perp.clone().multiplyScalar(0.075), 0.055, bondMaterial);
              addCylinder(perp.clone().multiplyScalar(-0.075), 0.055, bondMaterial);
            } else if (bond.order === 3) {
              addCylinder(new THREE.Vector3(0, 0, 0), 0.05, bondMaterial);
              addCylinder(perp.clone().multiplyScalar(0.1), 0.045, bondMaterial);
              addCylinder(perp.clone().multiplyScalar(-0.1), 0.045, bondMaterial);
            } else if (bond.order === 1.5) {
              addCylinder(perp.clone().multiplyScalar(0.05), 0.065, bondMaterial);
              addCylinder(perp.clone().multiplyScalar(-0.07), 0.045, aromaticMaterial);
            } else {
              addCylinder(new THREE.Vector3(0, 0, 0), 0.08, bondMaterial);
            }
          });
        }

        group.add(unitGroup);

        // Inter-unit polymer covalent bridge between tail of unit (u-1) and head of unit u
        if (u > 0 && mode !== 'space-fill') {
          const prevPos = unitAtomWorldPositions[u - 1][data.tailAtomIndex];
          const currPos = positionsForUnit[data.headAtomIndex];
          if (prevPos && currPos) {
            const dir = currPos.clone().sub(prevPos);
            const len = dir.length();
            if (len > 0.05) {
              const bridge = new THREE.Mesh(cylGeo, aromaticMaterial);
              bridge.scale.set(0.095, len, 0.095);
              bridge.position.copy(prevPos).add(currPos).multiplyScalar(0.5);
              bridge.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
              group.add(bridge);
            }
          }
        }
      }

      // Smooth backbone spline in chain-helix mode
      if (mode === 'chain-helix' && unitAtomWorldPositions.length >= 2) {
        const pts: THREE.Vector3[] = [];
        unitAtomWorldPositions.forEach((posArr) => {
          const h = posArr[data.headAtomIndex];
          const t = posArr[data.tailAtomIndex];
          if (h) pts.push(h.clone());
          if (t && t !== h) pts.push(t.clone());
        });
        if (pts.length >= 2) {
          const curve = new THREE.CatmullRomCurve3(pts);
          const tubeGeo = new THREE.TubeGeometry(curve, pts.length * 14, 0.14, 12, false);
          const tubeMat = new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            roughness: 0.25,
            metalness: 0.15,
            transparent: true,
            opacity: 0.55,
          });
          group.add(new THREE.Mesh(tubeGeo, tubeMat));
        }
      }

      // Fit bounding box comfortably inside camera view
      const box = new THREE.Box3().setFromObject(group);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      group.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z, 3);
      const fovRad = THREE.MathUtils.degToRad(camera.fov);
      const dist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.45;
      camera.position.set(dist * 0.35, dist * 0.28, dist);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    []
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120);
    scene.fog = new THREE.FogExp2(0x0b1120, 0.015);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(4, 3, 12);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 42;
    controlsRef.current = controls;

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(8, 12, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-8, -4, -10);
    scene.add(rimLight);

    // Subtle ground coordinate plane for spatial grounding
    const grid = new THREE.GridHelper(32, 32, 0x1e293b, 0x162032);
    grid.position.y = -4.2;
    scene.add(grid);

    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    moleculeGroupRef.current = moleculeGroup;

    rebuildMolecule(moleculeGroup, polymer, renderMode, repeatUnits, camera, controls);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycaster for atom inspection
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();

    const onPointerClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(moleculeGroup.children, true);
      if (hits.length > 0 && hits[0].object.userData?.atom) {
        setInspectedAtom({
          atom: hits[0].object.userData.atom as Atom3D,
          unitIndex: hits[0].object.userData.unitIndex as number,
        });
      } else {
        setInspectedAtom(null);
      }
    };
    renderer.domElement.addEventListener('click', onPointerClick);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let isDisposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const requestRender = () => {
      if (isDisposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (isDisposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', requestRender);

    const tick = () => {
      if (isDisposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (autoRotateRef.current && !isSoftwareGl) {
        moleculeGroup.rotation.y += dt * 0.35;
      }
      controls.update();
      renderer.render(scene, camera);
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      requestRender();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('click', onPointerClick);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // Initialize WebGL scene once per polymer/mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polymer.id]);

  // Update 3D geometry cleanly when renderMode or repeatUnits change without tearing down WebGL
  useEffect(() => {
    if (moleculeGroupRef.current && cameraRef.current && controlsRef.current) {
      rebuildMolecule(
        moleculeGroupRef.current,
        polymer,
        renderMode,
        repeatUnits,
        cameraRef.current,
        controlsRef.current
      );
      requestRenderRef.current?.();
    }
  }, [polymer, renderMode, repeatUnits, rebuildMolecule]);

  const handleResetView = () => {
    if (moleculeGroupRef.current && cameraRef.current && controlsRef.current) {
      moleculeGroupRef.current.rotation.set(0, 0, 0);
      rebuildMolecule(
        moleculeGroupRef.current,
        polymer,
        renderMode,
        repeatUnits,
        cameraRef.current,
        controlsRef.current
      );
      requestRenderRef.current?.();
    }
  };

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0B1120]">
      {/* Isolated WebGL Mount Node (Zero React Children) */}
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center text-slate-200">
          <p className="font-display text-base font-semibold">3D WebGL Context Unavailable</p>
          <p className="mt-1 text-xs text-slate-400">
            Repeat Unit: {polymer.repeatUnitFormula}
          </p>
        </div>
      )}

      {/* Minimal Top-Left Spec Readout (Solid rgba, no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-start justify-between gap-3">
        <div className="rounded-lg border border-slate-700/80 bg-[#0F172A]/90 px-3.5 py-2 text-xs text-slate-200">
          <div className="font-mono font-semibold text-cyan-400">{polymer.shortName} · 3D Chain</div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-400">
            Click any atom to inspect hybridization &amp; role · Drag to orbit
          </div>
        </div>

        {/* Atom Inspection Readout */}
        {inspectedAtom && (
          <div className="rounded-lg border border-cyan-500/40 bg-[#0F172A]/95 px-3.5 py-2 text-xs text-slate-100">
            <div className="font-mono font-semibold text-cyan-300">
              {CPK_STYLE[inspectedAtom.atom.element]?.label ?? inspectedAtom.atom.element} · Unit #{inspectedAtom.unitIndex}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-300">
              {inspectedAtom.atom.hybridization || 'sp³'} · {inspectedAtom.atom.role || 'Polymer atom'} ·{' '}
              {CPK_STYLE[inspectedAtom.atom.element]?.atomicMass}
            </div>
          </div>
        )}
      </div>

      {/* Unified Collapsible Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 z-10 w-[min(760px,94%)] -translate-x-1/2">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-slate-700 bg-[#0F172A]/95 px-3 py-1 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show 3D Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-[#0F172A]/95 px-4 py-2.5 text-xs text-slate-200">
            {/* Render Mode Segmented Buttons */}
            <div className="flex items-center gap-1 rounded-md bg-slate-800 p-1">
              {(
                [
                  { id: 'ball-stick', label: 'Ball & Stick' },
                  { id: 'space-fill', label: 'Space-Filling' },
                  { id: 'chain-helix', label: 'Backbone Tube' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRenderMode(m.id)}
                  className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    renderMode === m.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Repeat Units Slider */}
            <label className="flex items-center gap-2 font-mono text-[11px] text-slate-300 whitespace-nowrap">
              <span>Units (n={repeatUnits})</span>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={repeatUnits}
                onChange={(e) => setRepeatUnits(Number(e.target.value))}
                className="w-20 accent-cyan-500 cursor-pointer"
              />
            </label>

            {/* Rotation & Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {autoRotate ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>{autoRotate ? 'Pause' : 'Spin'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
