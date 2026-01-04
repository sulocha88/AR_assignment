let activeRing = null;
let originalCameraRigPosition = { x: 0, y: 1, z: 0 };
let isAnimating = false;
let focusSpotlight = null;

const GlobalState = {
  get isBusy() {
    return activeRing !== null || isAnimating;
  },
  get focusedRing() {
    return activeRing;
  },
  setFocused(ringEntity) {
    activeRing = ringEntity;
  },
  clearFocused() {
    activeRing = null;
  },
  canInteract() {
    return !this.isBusy;
  },
};

function animatePosition(element, targetPos, duration, onComplete) {
  const startPos = {
    x: element.object3D.position.x,
    y: element.object3D.position.y,
    z: element.object3D.position.z,
  };
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    element.object3D.position.x =
      startPos.x + (targetPos.x - startPos.x) * eased;
    element.object3D.position.y =
      startPos.y + (targetPos.y - startPos.y) * eased;
    element.object3D.position.z =
      startPos.z + (targetPos.z - startPos.z) * eased;
    if (progress < 1) requestAnimationFrame(animate);
    else {
      if (onComplete) onComplete();
    }
  }
  animate();
}

function animateScale(element, targetScale, duration, onComplete) {
  const startScale = {
    x: element.object3D.scale.x,
    y: element.object3D.scale.y,
    z: element.object3D.scale.z,
  };
  const startTime = Date.now();
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    element.object3D.scale.x =
      startScale.x + (targetScale.x - startScale.x) * eased;
    element.object3D.scale.y =
      startScale.y + (targetScale.y - startScale.y) * eased;
    element.object3D.scale.z =
      startScale.z + (targetScale.z - startScale.z) * eased;
    if (progress < 1) requestAnimationFrame(animate);
    else {
      if (onComplete) onComplete();
    }
  }
  animate();
}

function animateRotation(element, targetRot, duration, onComplete) {
  const startRot = {
    x: element.object3D.rotation.x,
    y: element.object3D.rotation.y,
    z: element.object3D.rotation.z,
  };
  const startTime = Date.now();
  const targetRadians = {
    x: (targetRot.x * Math.PI) / 180,
    y: (targetRot.y * Math.PI) / 180,
    z: (targetRot.z * Math.PI) / 180,
  };
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased =
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    element.object3D.rotation.x =
      startRot.x + (targetRadians.x - startRot.x) * eased;
    element.object3D.rotation.y =
      startRot.y + (targetRadians.y - startRot.y) * eased;
    element.object3D.rotation.z =
      startRot.z + (targetRadians.z - startRot.z) * eased;
    if (progress < 1) requestAnimationFrame(animate);
    else {
      if (onComplete) onComplete();
    }
  }
  animate();
}

function createFocusSpotlight() {
  if (focusSpotlight) return focusSpotlight;
  const scene = document.querySelector("a-scene");
  focusSpotlight = document.createElement("a-entity");
  focusSpotlight.setAttribute("light", {
    type: "spot",
    color: "#FFFFFF",
    intensity: 2.0,
    distance: 10,
    angle: 45,
    penumbra: 0.3,
    castShadow: false,
  });
  focusSpotlight.setAttribute("position", "0 2 3");
  focusSpotlight.setAttribute("id", "focusSpotlight");
  focusSpotlight.setAttribute("visible", false);
  const rimLight = document.createElement("a-entity");
  rimLight.setAttribute("light", {
    type: "point",
    color: "#FFE4B5",
    intensity: 1.5,
    distance: 5,
    decay: 2,
  });
  rimLight.setAttribute("position", "0 1.5 1.5");
  rimLight.setAttribute("id", "rimLight");
  rimLight.setAttribute("visible", false);
  const fillLight = document.createElement("a-entity");
  fillLight.setAttribute("light", {
    type: "point",
    color: "#FFF",
    intensity: 0.8,
    distance: 4,
    decay: 2,
  });
  fillLight.setAttribute("position", "1.5 1 2.5");
  fillLight.setAttribute("id", "fillLight");
  fillLight.setAttribute("visible", false);
  scene.appendChild(focusSpotlight);
  scene.appendChild(rimLight);
  scene.appendChild(fillLight);
  return focusSpotlight;
}

function updateSpotlightTarget(ringPosition) {
  if (!focusSpotlight) return;
  const spotlightPos = {
    x: ringPosition.x,
    y: ringPosition.y + 1.5,
    z: ringPosition.z + 1.0,
  };
  focusSpotlight.object3D.position.set(
    spotlightPos.x,
    spotlightPos.y,
    spotlightPos.z
  );
  focusSpotlight.object3D.lookAt(
    ringPosition.x,
    ringPosition.y,
    ringPosition.z
  );
  const rimLight = document.querySelector("#rimLight");
  if (rimLight) {
    rimLight.object3D.position.set(
      ringPosition.x,
      ringPosition.y + 0.7,
      ringPosition.z - 1.0
    );
  }
  const fillLight = document.querySelector("#fillLight");
  if (fillLight) {
    fillLight.object3D.position.set(
      ringPosition.x + 1.0,
      ringPosition.y,
      ringPosition.z + 0.5
    );
  }
}

function focusRing(ringGroup) {
  if (activeRing || isAnimating) return;
  isAnimating = true;
  activeRing = ringGroup;
  ringGroup.setAttribute("visible", true);
  document.querySelectorAll(".ring-group").forEach((r) => {
    if (r !== ringGroup) {
      r.setAttribute("visible", false);
    }
  });
  const focusScaleStr = ringGroup.dataset.focusScale || "0.15 0.15 0.15";
  const focusPositionStr = ringGroup.dataset.focusPosition || "0 0.8 2.5";
  const focusRotationStr = ringGroup.dataset.focusRotation || "0 45 0";
  const cameraBackDistance = parseFloat(ringGroup.dataset.cameraBack || "0.8");
  const focusScaleParts = focusScaleStr.split(" ").map(parseFloat);
  const focusScale = {
    x: focusScaleParts[0],
    y: focusScaleParts[1],
    z: focusScaleParts[2],
  };
  const focusPosParts = focusPositionStr.split(" ").map(parseFloat);
  const focusPosition = {
    x: focusPosParts[0],
    y: focusPosParts[1],
    z: focusPosParts[2],
  };
  const focusRotParts = focusRotationStr.split(" ").map(parseFloat);
  const focusRotation = {
    x: focusRotParts[0],
    y: focusRotParts[1],
    z: focusRotParts[2],
  };
  const cameraRig = document.querySelector("#cameraRig");
  const camera = document.querySelector("#mainCamera");
  const lookControlsComponent = camera.components["look-controls"];
  if (lookControlsComponent) lookControlsComponent.pause();
  const newCameraPos = {
    x: originalCameraRigPosition.x,
    y: originalCameraRigPosition.y,
    z: originalCameraRigPosition.z + cameraBackDistance,
  };
  animatePosition(cameraRig, newCameraPos, 800, null);
  createFocusSpotlight();
  setTimeout(() => {
    if (focusSpotlight) {
      focusSpotlight.setAttribute("visible", true);
      updateSpotlightTarget(focusPosition);
    }
    const rimLight = document.querySelector("#rimLight");
    if (rimLight) rimLight.setAttribute("visible", true);
    const fillLight = document.querySelector("#fillLight");
    if (fillLight) fillLight.setAttribute("visible", true);
  }, 400);
  let animationsComplete = 0;
  const totalAnimations = 3;
  const checkComplete = () => {
    animationsComplete++;
    if (animationsComplete === totalAnimations) {
      ringGroup.setAttribute("drag-rotate-active", "");
      isAnimating = false;
    }
  };
  animatePosition(ringGroup, focusPosition, 800, checkComplete);
  animateScale(ringGroup, focusScale, 800, checkComplete);
  animateRotation(ringGroup, focusRotation, 800, checkComplete);
  document.getElementById("closeButton").style.display = "block";
}

function closeRing() {
  if (!activeRing || isAnimating) return;
  isAnimating = true;
  activeRing.setAttribute("visible", true);
  activeRing.removeAttribute("drag-rotate-active");
  if (focusSpotlight) focusSpotlight.setAttribute("visible", false);
  const rimLight = document.querySelector("#rimLight");
  if (rimLight) rimLight.setAttribute("visible", false);
  const fillLight = document.querySelector("#fillLight");
  if (fillLight) fillLight.setAttribute("visible", false);
  const originPosStr = activeRing.dataset.origin;
  const originScaleStr = activeRing.dataset.scale;
  const originRotationStr = activeRing.dataset.originRotation || "0 0 0";
  const originPosParts = originPosStr.split(" ").map(parseFloat);
  const originPosition = {
    x: originPosParts[0],
    y: originPosParts[1],
    z: originPosParts[2],
  };
  const originScaleParts = originScaleStr.split(" ").map(parseFloat);
  const originScale = {
    x: originScaleParts[0],
    y: originScaleParts[1],
    z: originScaleParts[2],
  };
  const originRotParts = originRotationStr.split(" ").map(parseFloat);
  const originRotation = {
    x: originRotParts[0],
    y: originRotParts[1],
    z: originRotParts[2],
  };
  const cameraRig = document.querySelector("#cameraRig");
  const camera = document.querySelector("#mainCamera");
  animatePosition(cameraRig, originalCameraRigPosition, 800, null);
  const ringToReturn = activeRing;
  let animationsComplete = 0;
  const totalAnimations = 3;
  const checkComplete = () => {
    animationsComplete++;
    if (animationsComplete === totalAnimations) {
      setTimeout(() => {
        document.querySelectorAll(".ring-group").forEach((r) => {
          r.setAttribute("visible", true);
        });
        document.getElementById("closeButton").style.display = "none";
        const lookControlsComponent = camera.components["look-controls"];
        if (lookControlsComponent) lookControlsComponent.play();
        activeRing = null;
        isAnimating = false;
      }, 100);
    }
  };
  animatePosition(ringToReturn, originPosition, 800, checkComplete);
  animateScale(ringToReturn, originScale, 800, checkComplete);
  animateRotation(ringToReturn, originRotation, 800, checkComplete);
}

AFRAME.registerComponent("ring-click", {
  init: function () {
    this.handleClick = this.handleClick.bind(this);
    this.el.addEventListener("click", this.handleClick);
  },
  handleClick: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    const ringGroup = this.el.parentElement;
    focusRing(ringGroup);
  },
  remove: function () {
    this.el.removeEventListener("click", this.handleClick);
  },
});

AFRAME.registerComponent("ring-interaction", { init: function () {} });

AFRAME.registerComponent("drag-rotate-y", { init: function () {} });

AFRAME.registerComponent("drag-rotate-active", {
  init: function () {
    this.isDragging = false;
    this.previousX = 0;
    this.previousY = 0;
    this.cumulativeRotationY = this.el.object3D.rotation.y;
    this.cumulativeRotationX = this.el.object3D.rotation.x;
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    const sceneEl = this.el.sceneEl;
    sceneEl.addEventListener("mousedown", this.onDown);
    sceneEl.addEventListener("mousemove", this.onMove);
    sceneEl.addEventListener("mouseup", this.onUp);
    sceneEl.addEventListener("touchstart", this.onDown, { passive: false });
    sceneEl.addEventListener("touchmove", this.onMove, { passive: false });
    sceneEl.addEventListener("touchend", this.onUp);
  },
  onDown: function (e) {
    if (e.target.id === "closeButton") return;
    e.preventDefault();
    this.isDragging = true;
    this.previousX = e.clientX || (e.touches && e.touches[0].clientX);
    this.previousY = e.clientY || (e.touches && e.touches[0].clientY);
  },
  onMove: function (e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const currentX = e.clientX || (e.touches && e.touches[0].clientX);
    const currentY = e.clientY || (e.touches && e.touches[0].clientY);
    const deltaX = currentX - this.previousX;
    const deltaY = currentY - this.previousY;
    this.previousX = currentX;
    this.previousY = currentY;
    this.cumulativeRotationY += deltaX * 0.01;
    this.cumulativeRotationX -= deltaY * 0.01;
    const maxPitch = Math.PI / 2;
    this.cumulativeRotationX = Math.max(
      -maxPitch,
      Math.min(maxPitch, this.cumulativeRotationX)
    );
    this.el.object3D.rotation.x = this.cumulativeRotationX;
    this.el.object3D.rotation.y = this.cumulativeRotationY;
    this.el.object3D.rotation.z = 0;
  },
  onUp: function (e) {
    this.isDragging = false;
  },
  remove: function () {
    const sceneEl = this.el.sceneEl;
    sceneEl.removeEventListener("mousedown", this.onDown);
    sceneEl.removeEventListener("mousemove", this.onMove);
    sceneEl.removeEventListener("mouseup", this.onUp);
    sceneEl.removeEventListener("touchstart", this.onDown);
    sceneEl.removeEventListener("touchmove", this.onMove);
    sceneEl.removeEventListener("touchend", this.onUp);
  },
});

document.addEventListener("DOMContentLoaded", function () {
  const closeBtn = document.getElementById("closeButton");
  if (closeBtn) {
    closeBtn.addEventListener("click", function (evt) {
      evt.stopPropagation();
      evt.preventDefault();
      closeRing();
    });
    closeBtn.addEventListener("touchstart", function (evt) {
      evt.stopPropagation();
    });
  }
});

if (document.querySelector("a-scene")) initScene();
else document.addEventListener("DOMContentLoaded", initScene);

function initScene() {
  const scene = document.querySelector("a-scene");
  if (!scene) return;
  const assets = document.querySelector("a-assets");
  if (assets) {
    assets.addEventListener("loaded", function () {
      setTimeout(() => {
        const loadingMsg = document.getElementById("loadingMessage");
        if (loadingMsg) loadingMsg.style.display = "none";
        document.querySelectorAll(".ring-group").forEach((r) => {
          r.setAttribute("visible", true);
        });
      }, 500);
    });
  }
  setTimeout(() => {
    const loadingMsg = document.getElementById("loadingMessage");
    if (loadingMsg) loadingMsg.style.display = "none";
  }, 3000);

  scene.addEventListener("loaded", function () {
    const rings = document.querySelectorAll(".ring-group");
    rings.forEach((ring, index) => {
      const modelEl = ring.querySelector("[gltf-model]");
      if (modelEl) {
        modelEl.addEventListener("model-loaded", function () {
          const mesh = modelEl.getObject3D("mesh");
          if (mesh) {
            mesh.traverse(function (node) {
              if (node.isMesh && node.material) {
                node.material.metalness = 0.95;
                node.material.roughness = 0.2;
                node.material.needsUpdate = true;
              }
            });
          }
        });
      }
    });
  });
}