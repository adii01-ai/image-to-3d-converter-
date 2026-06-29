import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const container = document.getElementById("viewer");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111827);

const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);

camera.position.set(2, 2, 2);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);

container.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 2));

const light1 = new THREE.DirectionalLight(0xffffff, 2);
light1.position.set(5, 5, 5);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xffffff, 2);
light2.position.set(-5, 5, -5);
scene.add(light2);

// Grid
scene.add(new THREE.GridHelper(10, 10));

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = false;

// Loader
const loader = new GLTFLoader();

let currentModel = null;

window.loadModel = function (url) {

    if (currentModel) {

        scene.remove(currentModel);

    }

    loader.load(

        url,

        (gltf) => {

            currentModel = gltf.scene;

            scene.add(currentModel);

            const box = new THREE.Box3().setFromObject(currentModel);

            const center = box.getCenter(new THREE.Vector3());

            const size = box.getSize(new THREE.Vector3());

            currentModel.position.sub(center);

            const max = Math.max(size.x, size.y, size.z);

            camera.position.set(max * 1.8, max * 1.5, max * 1.8);

            controls.target.set(0, 0, 0);

            controls.update();

        },

        undefined,

        (err) => {

            console.error(err);

            alert("Unable to load 3D Model.");

        }

    );

};

function animate() {

    requestAnimationFrame(animate);

    if (currentModel) {

        currentModel.rotation.y += 0.002;

    }

    controls.update();

    renderer.render(scene, camera);

}

animate();

window.addEventListener("resize", () => {

    camera.aspect =
        container.clientWidth /
        container.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );

});