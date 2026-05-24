import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
// @ts-expect-error – no TS declarations
import { Text } from 'troika-three-text';
import { QuantumCharacter } from './objects/quantumCharacter';
import { Photon } from './objects/photon';
import { DeviceFilter } from './objects/deviceFilter';
import type { Basis, Bit } from './types/quantum';

// pentru textul floating
interface TroikaText extends THREE.Object3D { text: string; color: string; fontSize: number; sync(): void; }

// la fiecare pas mutam camera mai in fata pe axa z
interface Step { cameraZ: number; panelId: string; targetX: number; targetZ: number; }
const STEPS: Step[] = [
  { cameraZ:  5,   panelId: 'panel-welcome',     targetX:  0,    targetZ:   0  },
  { cameraZ: -12,  panelId: 'panel-alice',        targetX:  1.5,  targetZ: -20  },
  { cameraZ: -28,  panelId: 'panel-photon',       targetX:  3,    targetZ: -36  },
  { cameraZ: -32,  panelId: 'panel-polarization', targetX: -0.5,  targetZ: -42  },
  { cameraZ: -48,  panelId: 'panel-filter',       targetX:  0.5,  targetZ: -58  },
  { cameraZ: -66,  panelId: 'panel-exchange',     targetX:  1,    targetZ: -78  },
  { cameraZ: -84,  panelId: 'panel-bob',          targetX:  1,    targetZ: -94  },
  { cameraZ: -98,  panelId: 'panel-sifting',      targetX:  0.6,  targetZ: -108 },  // 7
  { cameraZ: -118, panelId: 'panel-eve',          targetX:  1.5,  targetZ: -128 },  // 8
  { cameraZ: -138, panelId: 'panel-error-check', targetX:  1.5,  targetZ: -148 },  // 9
  { cameraZ: -158, panelId: 'panel-key',         targetX:  1.5,  targetZ: -168 },  // 10
];


const canvas  = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02010a);
scene.fog = new THREE.FogExp2(0x02010a, 0.028);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1, STEPS[0].cameraZ);

// Orbit controls: pt rotirea camerei
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance   = 2;
controls.maxDistance   = 30;
controls.maxPolarAngle = Math.PI * 0.80;   // nu vreau sa se duca cu susu n jos
controls.target.set(STEPS[0].targetX, 0, STEPS[0].targetZ);

// Lumini
scene.add(new THREE.AmbientLight(0x1a0d40, 3));
const keyLight = new THREE.DirectionalLight(0x9977ff, 2);
keyLight.position.set(4, 6, 4);
scene.add(keyLight);


// config pentru textul floating
function makeLabel(text: string, x: number, y: number, z: number, color: string): typeof Text {
  const label = new Text();
  label.text      = text;
  label.fontSize  = 0.32;
  label.color     = color;
  label.anchorX   = 'center';
  label.anchorY   = 'bottom';
  label.position.set(x, y, z);
  label.sync();
  return label;
}

// stelele care apar pe ecran
function buildStarfield(): THREE.Points {
  const count = 2500;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 70;           
    pos[i * 3 + 1] = (Math.random() - 0.5) * 40;          
    pos[i * 3 + 2] =  10 - Math.random() * 185;            
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xbbaaf0, size: 0.07, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}


scene.add(buildStarfield());

// STEP 1: Alice
const aliceChar = new QuantumCharacter('ALICE');
aliceChar.setPosition(-1.8, -1.5, -20);
aliceChar.mesh.scale.set(2.4, 2.4, 2.4);
aliceChar.mesh.scale.set(0, 0, 0);           // ca sa o ascund inainte

const aliceLight = new THREE.PointLight(0x44ffaa, 0, 18);
aliceLight.position.set(-1.8, 1, -20);

scene.add(aliceChar.mesh, aliceLight);

// STEP 2: Foton 
const introPhoton = new Photon('DIAGONAL', 1);
introPhoton.setPosition(0, 0, -36);
introPhoton.mesh.scale.set(0, 0, 0);         

const photonLight = new THREE.PointLight(0x4488ff, 0, 22);
photonLight.position.set(0, 0, -36);

scene.add(introPhoton.mesh, photonLight);

// STEP 3: fotonii polarizati cu toate cele 4 posibilitati
const POLAR_CONFIGS: Array<{ basis: Basis; bit: Bit; label: string; color: string }> = [
  { basis: 'RECTILINEAR', bit: 1, label: 'Vertical  |',  color: 'red' },
  { basis: 'RECTILINEAR', bit: 0, label: 'Horizontal —', color: 'red' },
  { basis: 'DIAGONAL',    bit: 1, label: 'Diagonal +45°', color: 'blue' },
  { basis: 'DIAGONAL',    bit: 0, label: 'Diagonal −45°', color: 'blue' },
];

const POLAR_Z       = -42;
const POLAR_SCALE   = 3.2;
const POLAR_SPACING = 3.8;

const polarGroup = new THREE.Group();
POLAR_CONFIGS.forEach(({ basis, bit, label, color }, i) => {
  const xPos = (i - 1.5) * POLAR_SPACING;
  const ph = new Photon(basis, bit);
  ph.setPosition(xPos, 0, 0);
  ph.mesh.scale.setScalar(POLAR_SCALE);
  polarGroup.add(ph.mesh);
  polarGroup.add(makeLabel(label, xPos, 2.0, 0, color));
});
polarGroup.position.set(-3.5, 0, POLAR_Z);
polarGroup.scale.setScalar(0);   

const polarLight = new THREE.PointLight(0x8899ff, 0, 30);
polarLight.position.set(-3.5, 1, POLAR_Z);

scene.add(polarGroup, polarLight);

// STEP 4: Tipurile de filtre
const FILTER_Z     = -58;
const FILTER_SCALE = 4;

const filterGroup = new THREE.Group();

const rectiFilter = new DeviceFilter('RECTILINEAR', 1);  
rectiFilter.setPosition(-3, 0, 0);
rectiFilter.mesh.scale.setScalar(FILTER_SCALE);
filterGroup.add(rectiFilter.mesh, makeLabel('Rectilinear Basis', -3, 3.2, 0, '0xffdd44'));

const diagFilter = new DeviceFilter('DIAGONAL', 1);     
diagFilter.setPosition(3, 0, 0);
diagFilter.mesh.scale.setScalar(FILTER_SCALE);
filterGroup.add(diagFilter.mesh, makeLabel('Diagonal Basis', 3, 3.2, 0, '0x66aaff'));

filterGroup.position.set(-2.5, 0, FILTER_Z);
filterGroup.scale.setScalar(0);   

const filterLight = new THREE.PointLight(0xffdd88, 0, 35);
filterLight.position.set(-2.5, 2, FILTER_Z);

scene.add(filterGroup, filterLight);

// STEP 5: Interactiunea dintre Bob si Alice cu filtrele
const EXCHANGE_Z = -78;

const exchangeAlice = new QuantumCharacter('ALICE');
exchangeAlice.setPosition(-5, -0.5, 0);
exchangeAlice.mesh.scale.setScalar(1.8);

const aliceExFilter = new DeviceFilter('RECTILINEAR', 1);
aliceExFilter.setPosition(-2, 0, 0);
aliceExFilter.mesh.scale.setScalar(3);
aliceExFilter.mesh.rotation.y = Math.PI / 2;   

// Avem 2 filtre pentru Bob care sunt schimbate de user
const bobFilterMatch = new DeviceFilter('RECTILINEAR', 1);   
bobFilterMatch.setPosition(2, 0, 0);
bobFilterMatch.mesh.scale.setScalar(3);
bobFilterMatch.mesh.rotation.y = Math.PI / 2;

const bobFilterDiff = new DeviceFilter('DIAGONAL', 1);       
bobFilterDiff.setPosition(2, 0, 0);
bobFilterDiff.mesh.scale.setScalar(0);           // il ascund default
bobFilterDiff.mesh.rotation.y = Math.PI / 2;

const exchangeBob = new QuantumCharacter('BOB');
exchangeBob.setPosition(5, -0.5, 0);
exchangeBob.mesh.scale.setScalar(1.8);

// fotonul care zboara de la Alice la Bob
const flyingPhoton = new Photon('RECTILINEAR', 1);
flyingPhoton.mesh.position.set(-2, 0, 0);
flyingPhoton.mesh.scale.setScalar(0);             // il ascund pana cand e declansat

const exchangeGroup = new THREE.Group();
exchangeGroup.add(
  exchangeAlice.mesh, aliceExFilter.mesh,
  bobFilterMatch.mesh, bobFilterDiff.mesh,
  exchangeBob.mesh, flyingPhoton.mesh,
);
exchangeGroup.position.set(-2, 0, EXCHANGE_Z);
exchangeGroup.scale.setScalar(0);                 

const exchangeLight = new THREE.PointLight(0x8888ff, 0, 40);
exchangeLight.position.set(-2, 2, EXCHANGE_Z);

const resultFlashLight = new THREE.PointLight(0xffffff, 0, 14);
resultFlashLight.position.set(0, 0, EXCHANGE_Z);

scene.add(exchangeGroup, exchangeLight, resultFlashLight);

// STEP 6: Alegerea lui Bob pt filtre
const BOB_INTRO_Z = -94;

const bobIntroChar = new QuantumCharacter('BOB');
bobIntroChar.setPosition(2, -0.5, 0);
bobIntroChar.mesh.scale.setScalar(2);

const bobIntroFilterR = new DeviceFilter('RECTILINEAR', 1);   
bobIntroFilterR.setPosition(-1.5, 1, 0);
bobIntroFilterR.mesh.scale.setScalar(3);

const bobIntroFilterD = new DeviceFilter('DIAGONAL', 1);      
bobIntroFilterD.setPosition(-1.5, 1, 0);
bobIntroFilterD.mesh.scale.setScalar(0);                      

const bobIntroGroup = new THREE.Group();
bobIntroGroup.add(
  bobIntroChar.mesh,
  bobIntroFilterR.mesh,
  bobIntroFilterD.mesh);
bobIntroGroup.position.set(-2, 0, BOB_INTRO_Z);
bobIntroGroup.scale.setScalar(0);                             

const bobIntroLight = new THREE.PointLight(0x44aaff, 0, 22);
bobIntroLight.position.set(-2, 2, BOB_INTRO_Z);

scene.add(bobIntroGroup, bobIntroLight);

// schimbarea filtrului lui Bob cand ia o decizie
let bobFilterTimeout: ReturnType<typeof setTimeout> | null = null;
let bobShowingRecti = true;

function scheduleBobFilterToggle(): void {
  const delay = 800;          
  bobFilterTimeout = setTimeout(() => {
    bobShowingRecti = !bobShowingRecti;
    const show = bobShowingRecti ? bobIntroFilterR.mesh : bobIntroFilterD.mesh;
    const hide = bobShowingRecti ? bobIntroFilterD.mesh : bobIntroFilterR.mesh;
    gsap.to(hide.scale, { x: 0, y: 0, z: 0, duration: 0.22 });
    gsap.to(show.scale, { x: 3, y: 3, z: 3, duration: 0.22, delay: 0.18 });
    scheduleBobFilterToggle();
  }, delay);
}

// STEP 7: 5 fotoni trimisi de alice
const SIFT_Z = -108;

const SIFT_CONFIGS: Array<{ ab: Basis; av: Bit; bb: Basis; match: boolean }> = [
  { ab: 'RECTILINEAR', av: 1, bb: 'RECTILINEAR', match: true  },
  { ab: 'RECTILINEAR', av: 0, bb: 'DIAGONAL',    match: false },
  { ab: 'DIAGONAL',    av: 1, bb: 'DIAGONAL',    match: true  },
  { ab: 'DIAGONAL',    av: 0, bb: 'RECTILINEAR', match: false },
  { ab: 'RECTILINEAR', av: 0, bb: 'RECTILINEAR', match: true  },
];

interface SiftColRefs {
  photon: THREE.Group; aFilter: THREE.Group; bFilter: THREE.Group;
  hlMat: THREE.MeshBasicMaterial; keyLabel: object | null; match: boolean; bit: Bit;
}
const siftCols: SiftColRefs[] = [];
const siftingGroup = new THREE.Group();

// pt fiecare construiesc un foton, 2 filtre (alice si bob), fundalul care o sa se
//coloreze rosu/verde in functie de match, cifra bitului
SIFT_CONFIGS.forEach(({ ab, av, bb, match }, i) => {
  const x = (i - 2) * 2.2;                      

  const ph = new Photon(ab, av);
  ph.setPosition(x, 2.5, 0);
  ph.mesh.scale.setScalar(1.2);

  const af = new DeviceFilter(ab, av);
  af.setPosition(x, 0.5, 0);
  af.mesh.scale.setScalar(1.8);

  const bf = new DeviceFilter(bb, 1);
  bf.setPosition(x, -1.5, 0);
  bf.mesh.scale.setScalar(1.8);

  const hlMat = new THREE.MeshBasicMaterial({
    color: match ? 0x44ff88 : 0xff4444,
    transparent: true, opacity: 0, side: THREE.DoubleSide,
  });
  const hlPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5.8), hlMat);
  hlPlane.position.set(x, 0.5, -0.15);

  const keyLabel = match ? makeLabel(String(av), x, -3.2, 0, '#4ecca3') : null;
  if (keyLabel) { keyLabel.scale.set(0, 0, 0); siftingGroup.add(keyLabel); }

  siftCols.push({ photon: ph.mesh, aFilter: af.mesh, bFilter: bf.mesh, hlMat, keyLabel, match, bit: av });
  siftingGroup.add(ph.mesh, af.mesh, bf.mesh, hlPlane);
});

siftingGroup.add(makeLabel('Alice', -6.2, 0.5,  0, '#4ecca3'));
siftingGroup.add(makeLabel('Bob',   -6.2, -1.5, 0, '#66aaff'));

siftingGroup.position.set(-1, 0, SIFT_Z);
siftingGroup.scale.setScalar(0);

const siftingLight = new THREE.PointLight(0x8888ff, 0, 40);
siftingLight.position.set(-1, 2, SIFT_Z);

scene.add(siftingGroup, siftingLight);

//STEP 8: eve intercepteaza mesajul
const EVE_Z = -128;

const eveAlice = new QuantumCharacter('ALICE');
eveAlice.setPosition(-4.5, -0.5, 0);
eveAlice.mesh.scale.setScalar(1.6);

const eveAliceFilter = new DeviceFilter('RECTILINEAR', 1);
eveAliceFilter.setPosition(-2.5, 0, 0);
eveAliceFilter.mesh.scale.setScalar(2.5);
eveAliceFilter.mesh.rotation.y = Math.PI / 2;

const eveChar = new QuantumCharacter('EVE');
eveChar.setPosition(0, -0.5, -2);
eveChar.mesh.scale.setScalar(1.6);

// eve are 2 filtre care sunt schimbate de user
const eveFilterD = new DeviceFilter('DIAGONAL', 1);
eveFilterD.setPosition(0, 0, 0);
eveFilterD.mesh.scale.setScalar(2.5);
eveFilterD.mesh.rotation.y = Math.PI / 2;

const eveFilterR = new DeviceFilter('RECTILINEAR', 1);
eveFilterR.setPosition(0, 0, 0);
eveFilterR.mesh.scale.setScalar(0);               // e ascuns pana cand userul il schimba
eveFilterR.mesh.rotation.y = Math.PI / 2;

const eveBobChar = new QuantumCharacter('BOB');
eveBobChar.setPosition(4.5, -0.5, 0);
eveBobChar.mesh.scale.setScalar(1.6);

const eveBobFilter = new DeviceFilter('RECTILINEAR', 1);
eveBobFilter.setPosition(2.5, 0, 0);
eveBobFilter.mesh.scale.setScalar(2.5);
eveBobFilter.mesh.rotation.y = Math.PI / 2;

// 4 fotoni 
const evePhoton1  = new Photon('RECTILINEAR', 1);  // Alice -> Eve 
const evePhoton2R  = new Photon('RECTILINEAR', 1); // Eve -> Bob (corect)
const evePhoton2D1 = new Photon('DIAGONAL', 1);    // Eve -> Bob (gresit, +45°)
const evePhoton2D0 = new Photon('DIAGONAL', 0);    // Eve -> Bob (gresit, -45°)

evePhoton1.mesh.position.set(-2.5, 0, 0);
[evePhoton1, evePhoton2R, evePhoton2D1, evePhoton2D0].forEach(p => {
  p.mesh.position.set(p === evePhoton1 ? -2.5 : 0, 0, 0);
  p.mesh.scale.setScalar(0);
});

const eveGroup = new THREE.Group();
eveGroup.add(
  eveAlice.mesh, eveAliceFilter.mesh,
  eveChar.mesh,  eveFilterD.mesh, eveFilterR.mesh,
  eveBobChar.mesh, eveBobFilter.mesh,
  evePhoton1.mesh, evePhoton2R.mesh, evePhoton2D1.mesh, evePhoton2D0.mesh,
);
eveGroup.position.set(-1.5, 0, EVE_Z);
eveGroup.scale.setScalar(0);

const eveSceneLight     = new THREE.PointLight(0xaa44ff, 0, 50);
const eveInterceptLight = new THREE.PointLight(0xff6600, 0, 16);
const eveBobLight       = new THREE.PointLight(0xffffff, 0, 16);
eveSceneLight.position.set(-1.5, 2, EVE_Z);
eveInterceptLight.position.set(-1.5, 0, EVE_Z);   // lumina la filtrului lui eve
eveBobLight.position.set(1, 0, EVE_Z);            // lumina la filtrul lui bob

scene.add(eveGroup, eveSceneLight, eveInterceptLight, eveBobLight);

//STEP 9: compararea bitilor
const ALICE_BITS: Bit[]    = [1, 0, 1, 1, 0, 1, 0, 1];
const BOB_BITS_EVE: Bit[]  = [1, 0, 0, 1, 0, 1, 1, 1];  // erorile la index 2 si 6

const ERR_Z       = -148;
const ERR_SPACING = 1.3;

interface ErrColRefs {
  bobMat: THREE.MeshStandardMaterial;
  bobLabel: object;
  matchLabel: object;
  mismatchLabel: object;
  isError: boolean;
}
const errCols: ErrColRefs[] = [];
const errorGroup = new THREE.Group();

// pt fiecare bit:
// sferele pt alice si bob
// bitii pt alice is bob
// tick sau cross daca au nimerit sau nu
ALICE_BITS.forEach((aliceBit, i) => {
  const x = (i - 3.5) * ERR_SPACING;

  const aliceMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, emissive: 0x3b1d8a, emissiveIntensity: 0.3 });
  const aliceSph = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), aliceMat);
  aliceSph.position.set(x, 1.5, 0);
  const aliceLabel = makeLabel(String(aliceBit), x, 2.1, 0.1, '#a78bfa');

  const bobMat = new THREE.MeshStandardMaterial({ color: 0x4a4a6a, emissive: 0x1a1a3a, emissiveIntensity: 0.2 });
  const bobSph  = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), bobMat);
  bobSph.position.set(x, -1.5, 0);
  const bobLabel = makeLabel('?', x, -2.5, 0.1, '#888888');

  const matchLbl    = makeLabel('✓', x, -0.15, 0.1, '#44ff88');
  const mismatchLbl = makeLabel('✗', x, -0.15, 0.1, '#ff4444');
  (matchLbl    as unknown as THREE.Object3D).scale.setScalar(0);
  (mismatchLbl as unknown as THREE.Object3D).scale.setScalar(0);

  errCols.push({
    bobMat, bobLabel, matchLabel: matchLbl, mismatchLabel: mismatchLbl,
    isError: BOB_BITS_EVE[i] !== aliceBit,
  });
  errorGroup.add(aliceSph, aliceLabel, bobSph, bobLabel, matchLbl, mismatchLbl);
});

errorGroup.add(makeLabel('Alice', -5.5, 1.5, 0, '#a78bfa'));
errorGroup.add(makeLabel('Bob',   -5.5, -1.5, 0, '#4ecca3'));

errorGroup.position.set(0, 0, ERR_Z);
errorGroup.scale.setScalar(0);

const errorLight = new THREE.PointLight(0x8888ff, 0, 50);
errorLight.position.set(0, 2, ERR_Z);

scene.add(errorGroup, errorLight);

// STEP10: au aceeasi cheie
const KEY_Z    = -168;
const KEY_BITS: Bit[] = [1, 1, 0];

const keyAlice = new QuantumCharacter('ALICE');
keyAlice.setPosition(-4, -0.5, 0);
keyAlice.mesh.scale.setScalar(1.8);

const keyBob = new QuantumCharacter('BOB');
keyBob.setPosition(4, -0.5, 0);
keyBob.mesh.scale.setScalar(1.8);

// un cilindru leage alice si bob
const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 7, 8);
beamGeo.rotateZ(Math.PI / 2);
const beamMat = new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00aa66, emissiveIntensity: 1.0, transparent: true, opacity: 0.7 });
const keyBeam = new THREE.Mesh(beamGeo, beamMat);
keyBeam.position.set(0, 0.5, 0);
keyBeam.scale.set(0, 1, 1); 

// sferele pentru fiecare bit din shared key
const keyBitMeshes: THREE.Mesh[] = [];
const keyBitLabels: object[]     = [];
KEY_BITS.forEach((bit, i) => {
  const x   = (i - 1) * 2.2;
  const col = bit === 1 ? 0x00ffaa : 0x9966ff;
  const emi = bit === 1 ? 0x00aa66 : 0x5533aa;
  const sph = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: col, emissive: emi, emissiveIntensity: 0.7 }),
  );
  sph.position.set(x, 0.5, 0);
  sph.scale.setScalar(0);

  const lbl = makeLabel(String(bit), x, 1.6, 0.1, bit === 1 ? '#4ecca3' : '#c4b5fd');
  (lbl as unknown as THREE.Object3D).scale.setScalar(0);

  keyBitMeshes.push(sph);
  keyBitLabels.push(lbl);
});

//mesajul de secure key established
const secureLabel = makeLabel('SECURE KEY ESTABLISHED', 0, 3.5, 0.1, '#4ecca3');
(secureLabel as TroikaText).fontSize = 0.28;
(secureLabel as TroikaText).sync();
(secureLabel as unknown as THREE.Object3D).scale.setScalar(0);

const keyGroup = new THREE.Group();
keyGroup.add(keyAlice.mesh, keyBob.mesh, keyBeam, secureLabel as unknown as THREE.Object3D);
keyBitMeshes.forEach((m, i) => keyGroup.add(m, keyBitLabels[i] as THREE.Object3D));

keyGroup.position.set(-1.5, 0, KEY_Z);
keyGroup.scale.setScalar(0);

const keySceneLight = new THREE.PointLight(0x44ffcc, 0, 50);
const keyGlowLight  = new THREE.PointLight(0x00ffaa, 0, 25);
keySceneLight.position.set(-1.5, 3, KEY_Z);
keyGlowLight.position.set(-1.5, 0.5, KEY_Z);

scene.add(keyGroup, keySceneLight, keyGlowLight);


// NAVIGARE : muta camera la fiecare pas si schimba panoul din dreapta cu text
let currentStep = 0;

//o apleam la fiecare pas
function goToStep(target: number): void {
  const prevPanel = document.getElementById(STEPS[currentStep].panelId)!;
  const nextPanel = document.getElementById(STEPS[target].panelId)!;

  // scoatem clasa active de pe panoul de text anterior
  prevPanel.classList.remove('active');

  // timerul de la bob pt filtre, daca era activ, il stergem
  if (bobFilterTimeout !== null) { clearTimeout(bobFilterTimeout); bobFilterTimeout = null; }

  // dezactivam orbit controls cat se plimba camera si il activam dupa
  controls.enabled = false;
  gsap.to(camera.position, { x: 0, y: 1, z: STEPS[target].cameraZ, duration: 2.4, ease: 'power2.inOut' });
  gsap.to(controls.target,  {
    x: STEPS[target].targetX, z: STEPS[target].targetZ,
    duration: 2.4,
    ease: 'power2.inOut',
    onComplete: () => { controls.enabled = true; },
  });

  //tranzitii pe fiecare pas
  if (target === 1) {
    //alice apare dupa ce camera ajunge
    gsap.to(aliceChar.mesh.scale, { x: 2.4, y: 2.4, z: 2.4, duration: 0.9, delay: 1.4, ease: 'back.out(1.5)' });
    gsap.to(aliceLight, { intensity: 2.5, duration: 0.9, delay: 1.4 });
  }

  if (target === 2) {
    //alice dispare, fotonul apare
    gsap.to(aliceChar.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.6, ease: 'power2.in' });
    gsap.to(aliceLight, { intensity: 0, duration: 0.6 });

    gsap.to(introPhoton.mesh.scale, { x: 5, y: 5, z: 5, duration: 1.1, delay: 1.8, ease: 'elastic.out(1, 0.55)' });
    gsap.to(photonLight, { intensity: 4, duration: 1.1, delay: 1.8 });
  }

  if (target === 3) {
    //fotonul dispare, apar cele 4 stari de polarizare
    gsap.to(introPhoton.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(photonLight, { intensity: 0, duration: 0.7 });

    gsap.to(polarGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.4)' });
    gsap.to(polarLight, { intensity: 3, duration: 1.0, delay: 1.6 });
  }

  if (target === 4) {
    //diagrama de polarizare dispare, apar 2 filtre
    gsap.to(polarGroup.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(polarLight, { intensity: 0, duration: 0.7 });

    gsap.to(filterGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.4)' });
    gsap.to(filterLight, { intensity: 3, duration: 1.0, delay: 1.6 });
  }

  if (target === 5) {
    //filtrele dispar, apare scena de schimb de fotoni dintre alice si bob
    gsap.to(filterGroup.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(filterLight, { intensity: 0, duration: 0.7 });

    gsap.to(exchangeGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.3)' });
    gsap.to(exchangeLight, { intensity: 2.5, duration: 1.0, delay: 1.6 });
  }

  if (target === 6) {
    //scena de schimb dispare, apare scena lui Bob cu baze aleatoare
    // dupa ce apare complet, pornim animatia de toggle a filtrului
    gsap.to(exchangeGroup.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(exchangeLight, { intensity: 0, duration: 0.7 });

    gsap.to(bobIntroGroup.scale, {
      x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.3)',
      onComplete: () => scheduleBobFilterToggle(),
    });
    gsap.to(bobIntroLight, { intensity: 2.5, duration: 1.0, delay: 1.6 });
  }

  if (target === 7) {
    //scena lui Bob dispare, apare tabloul de comparare a bazelor
    gsap.to(bobIntroGroup.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(bobIntroLight,  { intensity: 0, duration: 0.7 });

    gsap.to(siftingGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.3)' });
    gsap.to(siftingLight,  { intensity: 3, duration: 1.0, delay: 1.6 });
  }

  if (target === 8) {
    // tabloul de comp dispare, apare scena cu eve care intercepteaza
    gsap.to(siftingGroup.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(siftingLight, { intensity: 0, duration: 0.7 });

    gsap.to(eveGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.3)' });
    gsap.to(eveSceneLight,  { intensity: 2.5, duration: 1.0, delay: 1.6 });
  }

  if (target === 9) {
    // scena cu eve dispare, apare tabloul de comparare a erorilor
    gsap.to(eveGroup.scale,  { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(eveSceneLight,   { intensity: 0, duration: 0.7 });

    gsap.to(errorGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.3)' });
    gsap.to(errorLight,       { intensity: 3, duration: 1.0, delay: 1.6 });
  }

  if (target === 10) {
    //tabloul de erori dispare, apare scena finala cu cheia stabilita
    gsap.to(errorGroup.scale, { x: 0, y: 0, z: 0, duration: 0.7, ease: 'power2.in' });
    gsap.to(errorLight,       { intensity: 0, duration: 0.7 });

    //alice si bob
    gsap.to(keyGroup.scale,  { x: 1, y: 1, z: 1, duration: 1.0, delay: 1.6, ease: 'back.out(1.3)' });
    gsap.to(keySceneLight,   { intensity: 2.5, duration: 1.0, delay: 1.6 });

    //cilindrul dintre alice si bob apare progresiv
    gsap.to(keyBeam.scale, { x: 1, duration: 1.4, delay: 3.0, ease: 'power2.inOut' });
    gsap.to(keyGlowLight,  { intensity: 2, duration: 1.4, delay: 3.0 });

    //apar bitii unul dupa altul pe beam
    KEY_BITS.forEach((_, i) => {
      const d = 4.8 + i * 0.45;
      gsap.to(keyBitMeshes[i].scale,                           { x: 2.5, y: 2.5, z: 2.5, duration: 0.55, delay: d, ease: 'elastic.out(1, 0.55)' });
      gsap.to((keyBitLabels[i] as THREE.Object3D).scale,       { x: 1,   y: 1,   z: 1,   duration: 0.4,  delay: d + 0.1, ease: 'back.out(1.5)' });
    });

    //bannerul cu secure key established apare ultimul
    gsap.to((secureLabel as unknown as THREE.Object3D).scale,  { x: 1, y: 1, z: 1, duration: 0.7, delay: 6.5, ease: 'back.out(1.4)' });
  }

  // adaugam panoul de text al pasului urmator
  nextPanel.classList.add('active');
  currentStep = target;
}

// Audio de fundal - porneste la primul click al utilizatorului
const bgAudio = new Audio('/audio/background.wav');
bgAudio.loop   = true;
bgAudio.volume = 0.5;

// EVENET LISTENERS pt next steps
document.getElementById('btn-start')!.addEventListener('click', () => {
  bgAudio.play().catch(() => {});
  goToStep(1);
});
document.getElementById('btn-to-photon')!.addEventListener('click',       () => goToStep(2));
document.getElementById('btn-to-polarization')!.addEventListener('click', () => goToStep(3));
document.getElementById('btn-to-filter')!.addEventListener('click',       () => goToStep(4));
document.getElementById('btn-to-exchange')!.addEventListener('click',     () => goToStep(5));
document.getElementById('btn-to-bob')!.addEventListener('click',          () => goToStep(6));
document.getElementById('btn-to-sifting')!.addEventListener('click',      () => goToStep(7));

//interactiunea de la pasul 7: comparare baze alice-bob
function runSiftingComparison(): void {
  const tl = gsap.timeline({
    onComplete() {
      // dupa animatie, afisam bitii cheii doar pentru coloanele cu baze identice
      siftCols.filter(c => c.match).forEach((c, i) => {
        if (!c.keyLabel) return;
        gsap.to((c.keyLabel as THREE.Object3D).scale, {
          x: 1, y: 1, z: 1, duration: 0.4, delay: i * 0.18, ease: 'back.out(1.5)',
        });
      });
      // aratam butonul de navigare catre pasul cu eve
      (document.getElementById('btn-to-eve') as HTMLElement).style.display = 'inline-flex';
    },
  });

  siftCols.forEach((col, i) => {
    const t = i * 0.35;
    // coloram fundalul coloanei: mai opac daca bazele se potrivesc
    tl.to(col.hlMat, { opacity: col.match ? 0.22 : 0.12, duration: 0.4 }, t);
    if (!col.match) {
      // daca bazele difera, micsoram fotonul si marim filtrele ca sa arate respingerea
      tl.to(col.photon.scale,  { x: 0.7, y: 0.7, z: 0.7, duration: 0.35 }, t + 0.1);
      tl.to(col.aFilter.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.35 }, t + 0.1);
      tl.to(col.bFilter.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.35 }, t + 0.1);
    }
  });
}

// butonul de compararea bazelor e dezactivat dupa primul click ca sa nu ruleze de doua ori
document.getElementById('btn-compare-bases')!.addEventListener('click', () => {
  (document.getElementById('btn-compare-bases') as HTMLButtonElement).disabled = true;
  runSiftingComparison();
});

document.getElementById('btn-to-eve')!.addEventListener('click',          () => goToStep(8));
document.getElementById('btn-to-error-check')!.addEventListener('click',   () => goToStep(9));
document.getElementById('btn-to-key')!.addEventListener('click',            () => goToStep(10));

//interactiunea de la pasul 8: eve intercepteaza
let isIntercepting    = false;
let eveWrongBasis     = true;   // implicit: eve foloseste baza gresita (diagonal)

// butonul care schimba baza lui eve intre corecta si gresita
document.getElementById('btn-toggle-eve-basis')!.addEventListener('click', () => {
  eveWrongBasis = !eveWrongBasis;
  const s = (v: number) => ({ x: v, y: v, z: v, duration: 0.3 });
  // afisam filtrul corespunzator bazei alese
  gsap.to(eveFilterD.mesh.scale, s(eveWrongBasis ? 2.5 : 0));
  gsap.to(eveFilterR.mesh.scale, s(eveWrongBasis ? 0 : 2.5));
  (document.getElementById('btn-toggle-eve-basis') as HTMLButtonElement).textContent =
    eveWrongBasis ? 'Eve: Wrong Basis' : 'Eve: Correct Basis';
});

// butonul de interceptare porneste animatia fotonului prin eve
document.getElementById('btn-intercept')!.addEventListener('click', runInterception);

// interactiunea de la pasul 9: verificare rata de erori
let isCheckingErrors       = false;
let eveInterceptedForCheck = true;   // implicit: scenariul cu eve activa

// comutam intre scenariul cu eve si cel fara eve pentru comparatie
document.getElementById('btn-toggle-eve-check')!.addEventListener('click', () => {
  eveInterceptedForCheck = !eveInterceptedForCheck;
  (document.getElementById('btn-toggle-eve-check') as HTMLButtonElement).textContent =
    eveInterceptedForCheck ? 'Scenario: With Eve' : 'Scenario: Without Eve';
});

// pornim verificarea erorilor si blocam butonul pe durata animatiei
document.getElementById('btn-check-errors')!.addEventListener('click', () => {
  if (isCheckingErrors) return;
  isCheckingErrors = true;
  (document.getElementById('btn-check-errors') as HTMLButtonElement).disabled = true;
  runErrorCheck();
});

function runErrorCheck(): void {
  const withEve  = eveInterceptedForCheck;
  const resultEl = document.getElementById('error-result')!;

  // resetam starea vizuala a coloanelor de la un run anterior
  resultEl.className = 'result-box';
  errCols.forEach(col => {
    col.bobMat.color.set(0x4a4a6a);
    col.bobMat.emissive.set(0x1a1a3a);
    (col.bobLabel as TroikaText).text  = '?';
    (col.bobLabel as TroikaText).color = '#888888';
    (col.bobLabel as TroikaText).sync();
    (col.matchLabel    as THREE.Object3D).scale.setScalar(0);
    (col.mismatchLabel as THREE.Object3D).scale.setScalar(0);
  });

  // numaram erorile: exista doar daca eve a interceptat
  const errCount = errCols.filter(c => withEve && c.isError).length;

  const tl = gsap.timeline({
    onComplete() {
      // calculam rata de erori si afisam rezultatul
      // daca depaseste 11% (pragul QKD), canalul e compromis
      const total = ALICE_BITS.length;
      const rate  = Math.round((errCount / total) * 100);
      resultEl.className = 'result-box ' + (rate > 11 ? 'no-match' : 'match');
      resultEl.innerHTML  = rate > 11
        ? `✗ ${errCount}/${total} errors — <strong>${rate}%</strong>. Above 11% threshold — <strong>Abort! Eve detected.</strong>`
        : `✓ ${errCount}/${total} errors — <strong>${rate}%</strong>. Below threshold — channel is secure.`;

      isCheckingErrors = false;
      (document.getElementById('btn-check-errors') as HTMLButtonElement).disabled = false;
      // aratam butonul de navigare catre cheia finala
      (document.getElementById('btn-to-key') as HTMLElement).style.display = 'inline-flex';
    },
  });

  errCols.forEach((col, i) => {
    const t      = i * 0.28;
    const isErr  = withEve && col.isError;
    const bobBit = withEve ? BOB_BITS_EVE[i] : ALICE_BITS[i];

    tl.call(() => {
      // coloram sfera lui bob: rosu daca e eroare, verde daca e ok
      col.bobMat.color.set(isErr ? 0xcc2200 : 0x22aa44);
      col.bobMat.emissive.set(isErr ? 0x661100 : 0x115522);
      (col.bobLabel as TroikaText).text  = String(bobBit);
      (col.bobLabel as TroikaText).color = isErr ? '#ff6666' : '#4ecca3';
      (col.bobLabel as TroikaText).sync();
    }, undefined, t);

    // afisam simbolul de match sau mismatch intre coloane
    const lbl = (isErr ? col.mismatchLabel : col.matchLabel) as THREE.Object3D;
    tl.to(lbl.scale, { x: 1, y: 1, z: 1, duration: 0.28, ease: 'back.out(1.5)' }, t + 0.05);
  });
}

function runInterception(): void {
  if (isIntercepting) return;   // evitam rularea simultana a doua interceptari
  isIntercepting = true;

  const interceptBtn = document.getElementById('btn-intercept') as HTMLButtonElement;
  const resultEl     = document.getElementById('eve-result')!;
  interceptBtn.disabled = true;
  resultEl.className    = 'result-box';

  // faza 1: fotonul lui alice zboara de la filtrul ei catre filtrul lui eve
  evePhoton1.mesh.position.x = -2.5;
  gsap.to(evePhoton1.mesh.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.2 });
  gsap.to(evePhoton1.mesh.position, {
    x: 0, duration: 1.2, ease: 'power1.inOut',
    onComplete() {
      // fotonul e absorbit de eve si apare un flash portocaliu la momentul interceptarii
      gsap.to(evePhoton1.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.15 });
      eveInterceptLight.color.set(0xff6600);
      gsap.to(eveInterceptLight, {
        intensity: 7, duration: 0.12, yoyo: true, repeat: 5,
        onComplete() {
          eveInterceptLight.intensity = 0;

          // faza 2: eve retrimite un foton nou catre bob
          // daca a folosit baza gresita, bitul retrimis este aleatoriu (0 sau 1)
          const disturbedBit: Bit = Math.random() < 0.5 ? 0 : 1;
          const photon2 = eveWrongBasis
            ? (disturbedBit === 1 ? evePhoton2D1 : evePhoton2D0)
            : evePhoton2R;

          photon2.mesh.position.x = 0;
          gsap.to(photon2.mesh.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.2 });
          gsap.to(photon2.mesh.position, {
            x: 2.5, duration: 1.2, ease: 'power1.inOut',
            onComplete() {
              // fotonul ajunge la bob si determinam rezultatul
              gsap.to(photon2.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.15 });

              // bob foloseste baza rectilineara (la fel ca alice)
              let cls: string;
              let html: string;
              if (!eveWrongBasis) {
                // baza corecta: eve retrimite fotonul intact, bob nu detecteaza eroare
                // dar eve cunoaste bitul si e periculos pt ca ea stie cheia
                eveBobLight.color.set(0xffbb00);
                cls  = 'warning';
                html = '⚠ No error — Bob reads <strong>1</strong> correctly. But Eve already knows the bit.';
              } else if (disturbedBit === 1) {
                // baza gresita, dar bob a ghicit din intamplare bitul corect
                eveBobLight.color.set(0xff8800);
                cls  = 'warning';
                html = 'Eve disturbed the photon, but Bob reads <strong>1</strong> by chance. Errors accumulate over many photons.';
              } else {
                // baza gresita, bob citeste un bit gresit deci e o eroare detectabila
                eveBobLight.color.set(0xff2200);
                cls  = 'no-match';
                html = '✗ State disturbed! Bob reads <strong>0</strong> — Alice sent <strong>1</strong>. Error detected.';
              }

              resultEl.className = 'result-box ' + cls;
              resultEl.innerHTML = html;
              // flash alb/colorat la filtrul lui bob la primirea fotonului
              gsap.to(eveBobLight, {
                intensity: 7, duration: 0.12, yoyo: true, repeat: 5,
                onComplete() { eveBobLight.intensity = 0; },
              });

              interceptBtn.disabled = false;
              isIntercepting        = false;
              // aratam butonul de navigare catre verificarea erorilor
              (document.getElementById('btn-to-error-check') as HTMLElement).style.display = 'inline-flex';
            },
          });
        },
      });
    },
  });
}

// interactiunea de la pasul 5: trimiterea fotonului de la alice la bob

let bobMatchesAlice = true;   // implicit: bob foloseste aceeasi baza ca alice
let isSending       = false;

// schimbam baza lui bob intre identica cu alice si diferita
document.getElementById('btn-toggle-basis')!.addEventListener('click', () => {
  bobMatchesAlice = !bobMatchesAlice;
  const s = (v: number) => ({ x: v, y: v, z: v, duration: 0.35 });
  gsap.to(bobFilterMatch.mesh.scale, s(bobMatchesAlice ? 3 : 0));
  gsap.to(bobFilterDiff.mesh.scale,  s(bobMatchesAlice ? 0 : 3));
  (document.getElementById('btn-toggle-basis') as HTMLButtonElement).textContent =
    bobMatchesAlice ? 'Bob: Same Basis' : 'Bob: Different Basis';
});

// trimitem fotonul de la alice la bob si afisam rezultatul masuratorii
document.getElementById('btn-send-photon')!.addEventListener('click', () => {
  if (isSending) return;   // blocat daca o animatie e deja in curs
  isSending = true;

  const sendBtn  = document.getElementById('btn-send-photon') as HTMLButtonElement;
  const resultEl = document.getElementById('result-display')!;
  sendBtn.disabled = true;
  resultEl.className = 'result-box';   // resetam ce era afisat anterior

  // repozitionam fotonul la filtrul lui alice si il facem vizibil
  flyingPhoton.mesh.position.x = -2;
  gsap.to(flyingPhoton.mesh.scale, { x: 2, y: 2, z: 2, duration: 0.2 });

  // animam fotonul de la alice (x=-2) la bob (x=+2)
  gsap.to(flyingPhoton.mesh.position, {
    x: 2,
    duration: 1.5,
    ease: 'power1.inOut',
    onComplete() {
      // fotonul e absorbit de filtrul lui bob
      gsap.to(flyingPhoton.mesh.scale, { x: 0, y: 0, z: 0, duration: 0.18 });

      if (bobMatchesAlice) {
        // baze identice: bob masoara corect bitul trimis de alice
        resultFlashLight.color.set(0x44ff88);
        resultEl.className = 'result-box match';
        resultEl.innerHTML = '✓ Same basis — Bob correctly reads bit <strong>1</strong>';
      } else {
        // baze diferite: rezultatul e aleatoriu, bitul poate fi orice
        resultFlashLight.color.set(0xff4444);
        const rand = Math.random() < 0.5 ? 0 : 1;
        resultEl.className = 'result-box no-match';
        resultEl.innerHTML = `✗ Wrong basis — result is random: bit <strong>${rand}</strong>`;
      }

      // flash de lumina la filtrul lui bob
      gsap.to(resultFlashLight, {
        intensity: 7, duration: 0.12,
        yoyo: true, repeat: 5,
        onComplete: () => { resultFlashLight.intensity = 0; },
      });

      sendBtn.disabled = false;
      isSending = false;
    },
  });
});

// actualizam dimensiunea camerei si renderer-ului la resize de fereastra
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// RENDER LOOP
const startTime = performance.now();

function animate(): void {
  requestAnimationFrame(animate);
  const t = (performance.now() - startTime) / 1000;   // timp in secunde de la start

  controls.update(); 

  // alice: miscare usoara de idle (sus-jos + rotatie capului)
  aliceChar.mesh.position.y = -1.5 + Math.sin(t * 0.9) * 0.06;
  aliceChar.mesh.rotation.y = Math.sin(t * 0.4) * 0.12;

  // primul foton: rotatie lenta + pulsatie a luminii
  introPhoton.mesh.rotation.y += 0.008;
  introPhoton.mesh.rotation.z += 0.004;
  photonLight.intensity = photonLight.intensity > 0
    ? 4 + Math.sin(t * 2.2) * 0.8
    : 0;

  // grupul de fotoni: leganaare lenta pe axa y
  polarGroup.rotation.y = Math.sin(t * 0.25) * 0.18;


  // grupul de filtre: rotatie alternativa lenta pentru a arata cele doua orientari
  filterGroup.rotation.y = Math.sin(t * 0.2) * 0.15;

  // bob intro: miscare similara cu alice
  bobIntroChar.mesh.position.y = -0.5 + Math.sin(t * 0.7 + 1) * 0.05;
  bobIntroChar.mesh.rotation.y = Math.sin(t * 0.35 + 0.5) * 0.1;

  // scena cheii finale: alice si bob se misca, beam-ul pulseza, sferele se rotesc
  keyAlice.mesh.position.y = -0.5 + Math.sin(t * 0.85 + 0.4) * 0.05;
  keyBob.mesh.position.y   = -0.5 + Math.sin(t * 0.85 + 1.9) * 0.05;
  beamMat.opacity          = 0.55 + Math.sin(t * 1.6) * 0.15;
  keyGlowLight.intensity   = keyGlowLight.intensity > 0
    ? 2 + Math.sin(t * 1.6) * 0.6
    : 0;
  keyBitMeshes.forEach((m, i) => { m.rotation.y = t * 0.4 + i * 0.9; });

  renderer.render(scene, camera);
}

animate();
