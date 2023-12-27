import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('myCanvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);
// document.body.appendChild(renderer.domElement);

// Загрузка текстуры Земли
const loader = new THREE.TextureLoader();
const earthTexture = loader.load('/ea.jpg');

// Создание сферы с текстурой Земли
const sphereGeometry = new THREE.SphereGeometry(5, 64, 64);
const sphereMaterial = new THREE.MeshBasicMaterial({ map: earthTexture });
const earthSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(earthSphere);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 10;
controls.maxDistance = 50;
controls.enablePan = false;

let currentRedDot = null;
let sumLatitudeLongitude = 0;

function addOrUpdateRedDot(at) {
  if (currentRedDot) {
    scene.remove(currentRedDot);
  }
  const dotGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const dot = new THREE.Mesh(dotGeometry, dotMaterial);
  dot.position.copy(at);
  scene.add(dot);
  currentRedDot = dot;
}

function updateSumDisplay() {
  document.getElementById('sumDisplay').innerText = `Ускорение свободного падения: ${sumLatitudeLongitude.toFixed(2)}`;
}

function g(phi) {
  function R(phi) {
    return Math.cos(phi) * (6378.1 - 6356.8) + 6356.8
  }
  return ((39.834574 * (10 ** 13) / (R(phi) ** 2))) / 1e6;

}

document.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

  const mouse = new THREE.Vector2(mouseX, mouseY);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(earthSphere);
  if (intersects.length > 0) {
    const point = intersects[0].point;
    addOrUpdateRedDot(point);

    const spherical = new THREE.Spherical().setFromVector3(point);
    const latitude = THREE.MathUtils.radToDeg(Math.PI / 2 - spherical.phi);
    const longitude = THREE.MathUtils.radToDeg(spherical.theta);

    document.getElementById('latitudeInput').value = latitude;
    document.getElementById('longitudeInput').value = longitude;

    sumLatitudeLongitude = g(latitude);
    updateSumDisplay();
  }
});

document.getElementById('updateButton').addEventListener('click', () => {
  const latitudeValue = parseFloat(document.getElementById('latitudeInput').value);
  const longitudeValue = parseFloat(document.getElementById('longitudeInput').value);

  if (isNaN(latitudeValue) || isNaN(longitudeValue)) {
    console.error('Введите корректные числа для широты и долготы');
    return;
  }

  const phi = THREE.MathUtils.degToRad(90 - latitudeValue);
  const theta = THREE.MathUtils.degToRad(longitudeValue);

  const position = new THREE.Vector3().setFromSphericalCoords(5, phi, theta);
  addOrUpdateRedDot(position);

  sumLatitudeLongitude = g(latitude);
  document.querySelector('#sumDisplay').value = sumLatitudeLongitude
  updateSumDisplay();
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
camera.position.z = 15;