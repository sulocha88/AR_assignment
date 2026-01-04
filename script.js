// =================================================================
// GLOBAL STATE MANAGER
// =================================================================
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
    }
};

// =================================================================
// SMOOTH ANIMATION HELPER
// =================================================================
function animatePosition(element, targetPos, duration, onComplete) {
    const startPos = {
        x: element.object3D.position.x,
        y: element.object3D.position.y,
        z: element.object3D.position.z
    };
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.object3D.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
        element.object3D.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
        element.object3D.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }
    
    animate();
}

function animateScale(element, targetScale, duration, onComplete) {
    const startScale = {
        x: element.object3D.scale.x,
        y: element.object3D.scale.y,
        z: element.object3D.scale.z
    };
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.object3D.scale.x = startScale.x + (targetScale.x - startScale.x) * eased;
        element.object3D.scale.y = startScale.y + (targetScale.y - startScale.y) * eased;
        element.object3D.scale.z = startScale.z + (targetScale.z - startScale.z) * eased;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }
    
    animate();
}

function animateRotation(element, targetRot, duration, onComplete) {
    const startRot = {
        x: element.object3D.rotation.x,
        y: element.object3D.rotation.y,
        z: element.object3D.rotation.z
    };
    const startTime = Date.now();
    
    const targetRadians = {
        x: targetRot.x * Math.PI / 180,
        y: targetRot.y * Math.PI / 180,
        z: targetRot.z * Math.PI / 180
    };
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.object3D.rotation.x = startRot.x + (targetRadians.x - startRot.x) * eased;
        element.object3D.rotation.y = startRot.y + (targetRadians.y - startRot.y) * eased;
        element.object3D.rotation.z = startRot.z + (targetRadians.z - startRot.z) * eased;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }
    
    animate();
}

// =================================================================
// CREATE FOCUS SPOTLIGHT
// =================================================================
function createFocusSpotlight() {
    if (focusSpotlight) return focusSpotlight;
    
    const scene = document.querySelector('a-scene');
    
    // Main spotlight from front-top
    focusSpotlight = document.createElement('a-entity');
    focusSpotlight.setAttribute('light', {
        type: 'spot',
        color: '#FFFFFF',
        intensity: 2.0,
        distance: 10,
        angle: 45,
        penumbra: 0.3,
        castShadow: false
    });
    focusSpotlight.setAttribute('position', '0 2 3');
    focusSpotlight.setAttribute('id', 'focusSpotlight');
    focusSpotlight.setAttribute('visible', false);
    
    // Rim light from back (creates nice edge lighting)
    const rimLight = document.createElement('a-entity');
    rimLight.setAttribute('light', {
        type: 'point',
        color: '#FFE4B5',
        intensity: 1.5,
        distance: 5,
        decay: 2
    });
    rimLight.setAttribute('position', '0 1.5 1.5');
    rimLight.setAttribute('id', 'rimLight');
    rimLight.setAttribute('visible', false);
    
    // Fill light from side (softens shadows)
    const fillLight = document.createElement('a-entity');
    fillLight.setAttribute('light', {
        type: 'point',
        color: '#FFF',
        intensity: 0.8,
        distance: 4,
        decay: 2
    });
    fillLight.setAttribute('position', '1.5 1 2.5');
    fillLight.setAttribute('id', 'fillLight');
    fillLight.setAttribute('visible', false);
    
    scene.appendChild(focusSpotlight);
    scene.appendChild(rimLight);
    scene.appendChild(fillLight);
    
    console.log('Focus lighting system created');
    
    return focusSpotlight;
}

// =================================================================
// UPDATE SPOTLIGHT POSITION
// =================================================================
function updateSpotlightTarget(ringPosition) {
    if (!focusSpotlight) return;
    
    // Position spotlight to aim at ring
    const spotlightPos = {
        x: ringPosition.x,
        y: ringPosition.y + 1.5,
        z: ringPosition.z + 1.0
    };
    
    focusSpotlight.object3D.position.set(spotlightPos.x, spotlightPos.y, spotlightPos.z);
    focusSpotlight.object3D.lookAt(ringPosition.x, ringPosition.y, ringPosition.z);
    
    // Update rim light
    const rimLight = document.querySelector('#rimLight');
    if (rimLight) {
        rimLight.object3D.position.set(
            ringPosition.x,
            ringPosition.y + 0.7,
            ringPosition.z - 1.0
        );
    }
    
    // Update fill light
    const fillLight = document.querySelector('#fillLight');
    if (fillLight) {
        fillLight.object3D.position.set(
            ringPosition.x + 1.0,
            ringPosition.y,
            ringPosition.z + 0.5
        );
    }
}

// =================================================================
// FOCUS RING FUNCTION
// =================================================================
function focusRing(ringGroup) {
    if (activeRing || isAnimating) {
        console.log('Already focusing a ring or animating');
        return;
    }
    
    isAnimating = true;
    activeRing = ringGroup;
    console.log('Focusing ring:', ringGroup.id);
    
    ringGroup.setAttribute('visible', true);
    
    document.querySelectorAll('.ring-group').forEach(r => {
        if (r !== ringGroup) {
            r.setAttribute('visible', false);
        }
    });
    
    const focusScaleStr = ringGroup.dataset.focusScale || '0.15 0.15 0.15';
    const focusPositionStr = ringGroup.dataset.focusPosition || '0 0.8 2.5';
    const focusRotationStr = ringGroup.dataset.focusRotation || '0 45 0';
    const cameraBackDistance = parseFloat(ringGroup.dataset.cameraBack || '0.8');
    
    const focusScaleParts = focusScaleStr.split(' ').map(parseFloat);
    const focusScale = { x: focusScaleParts[0], y: focusScaleParts[1], z: focusScaleParts[2] };
    
    const focusPosParts = focusPositionStr.split(' ').map(parseFloat);
    const focusPosition = { x: focusPosParts[0], y: focusPosParts[1], z: focusPosParts[2] };
    
    const focusRotParts = focusRotationStr.split(' ').map(parseFloat);
    const focusRotation = { x: focusRotParts[0], y: focusRotParts[1], z: focusRotParts[2] };
    
    const cameraRig = document.querySelector('#cameraRig');
    const camera = document.querySelector('#mainCamera');
    
    const lookControlsComponent = camera.components['look-controls'];
    if (lookControlsComponent) {
        lookControlsComponent.pause();
        console.log('Look controls paused');
    }
    
    const newCameraPos = {
        x: originalCameraRigPosition.x,
        y: originalCameraRigPosition.y,
        z: originalCameraRigPosition.z + cameraBackDistance
    };
    
    console.log('Moving camera rig to', newCameraPos);
    
    animatePosition(cameraRig, newCameraPos, 800, null);
    
    // FIXED: Create and enable focus lighting
    createFocusSpotlight();
    
    // Show focus lights with fade-in
    setTimeout(() => {
        if (focusSpotlight) {
            focusSpotlight.setAttribute('visible', true);
            updateSpotlightTarget(focusPosition);
        }
        
        const rimLight = document.querySelector('#rimLight');
        if (rimLight) rimLight.setAttribute('visible', true);
        
        const fillLight = document.querySelector('#fillLight');
        if (fillLight) fillLight.setAttribute('visible', true);
        
        console.log('Focus lighting activated');
    }, 400);
    
    let animationsComplete = 0;
    const totalAnimations = 3;
    
    const checkComplete = () => {
        animationsComplete++;
        if (animationsComplete === totalAnimations) {
            ringGroup.setAttribute('drag-rotate-active', '');
            isAnimating = false;
            console.log('Focus animation complete - 3D rotation enabled');
        }
    };
    
    animatePosition(ringGroup, focusPosition, 800, checkComplete);
    animateScale(ringGroup, focusScale, 800, checkComplete);
    animateRotation(ringGroup, focusRotation, 800, checkComplete);
    
    document.getElementById('closeButton').style.display = 'block';
}

// =================================================================
// CLOSE RING FUNCTION
// =================================================================
function closeRing() {
    if (!activeRing || isAnimating) {
        console.log('No active ring or already animating');
        return;
    }
    
    isAnimating = true;
    console.log('Closing ring:', activeRing.id);
    
    activeRing.setAttribute('visible', true);
    activeRing.removeAttribute('drag-rotate-active');
    
    // FIXED: Hide focus lighting
    if (focusSpotlight) {
        focusSpotlight.setAttribute('visible', false);
    }
    
    const rimLight = document.querySelector('#rimLight');
    if (rimLight) rimLight.setAttribute('visible', false);
    
    const fillLight = document.querySelector('#fillLight');
    if (fillLight) fillLight.setAttribute('visible', false);
    
    console.log('Focus lighting deactivated');
    
    const originPosStr = activeRing.dataset.origin;
    const originScaleStr = activeRing.dataset.scale;
    const originRotationStr = activeRing.dataset.originRotation || '0 0 0';
    
    const originPosParts = originPosStr.split(' ').map(parseFloat);
    const originPosition = { x: originPosParts[0], y: originPosParts[1], z: originPosParts[2] };
    
    const originScaleParts = originScaleStr.split(' ').map(parseFloat);
    const originScale = { x: originScaleParts[0], y: originScaleParts[1], z: originScaleParts[2] };
    
    const originRotParts = originRotationStr.split(' ').map(parseFloat);
    const originRotation = { x: originRotParts[0], y: originRotParts[1], z: originRotParts[2] };
    
    console.log('Returning to:', originPosition, originScale, originRotation);
    
    const cameraRig = document.querySelector('#cameraRig');
    const camera = document.querySelector('#mainCamera');
    
    console.log('Returning camera rig to', originalCameraRigPosition);
    
    animatePosition(cameraRig, originalCameraRigPosition, 800, null);
    
    const ringToReturn = activeRing;
    
    let animationsComplete = 0;
    const totalAnimations = 3;
    
    const checkComplete = () => {
        animationsComplete++;
        console.log(`Return animation ${animationsComplete}/${totalAnimations} complete`);
        
        if (animationsComplete === totalAnimations) {
            setTimeout(() => {
                document.querySelectorAll('.ring-group').forEach(r => {
                    r.setAttribute('visible', true);
                });
                
                document.getElementById('closeButton').style.display = 'none';
                
                const lookControlsComponent = camera.components['look-controls'];
                if (lookControlsComponent) {
                    lookControlsComponent.play();
                    console.log('Look controls resumed');
                }
                
                activeRing = null;
                isAnimating = false;
                console.log('Close complete');
            }, 100);
        }
    };
    
    animatePosition(ringToReturn, originPosition, 800, checkComplete);
    animateScale(ringToReturn, originScale, 800, checkComplete);
    animateRotation(ringToReturn, originRotation, 800, checkComplete);
}

// =================================================================
// RING CLICK COMPONENT
// =================================================================
AFRAME.registerComponent('ring-click', {
    init: function() {
        this.handleClick = this.handleClick.bind(this);
        this.el.addEventListener('click', this.handleClick);
        console.log('Ring click handler attached to:', this.el.parentElement.id);
    },
    
    handleClick: function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        
        const ringGroup = this.el.parentElement;
        console.log('Hitbox clicked for ring:', ringGroup.id);
        
        focusRing(ringGroup);
    },
    
    remove: function() {
        this.el.removeEventListener('click', this.handleClick);
    }
});

// =================================================================
// RING INTERACTION COMPONENT
// =================================================================
AFRAME.registerComponent('ring-interaction', {
    init: function() {
        console.log('Ring interaction component initialized for:', this.el.id);
    }
});

// =================================================================
// DRAG ROTATE Y COMPONENT
// =================================================================
AFRAME.registerComponent('drag-rotate-y', {
    init: function() {
        console.log('Drag rotate component registered for:', this.el.id);
    }
});

// =================================================================
// DRAG ROTATE ACTIVE COMPONENT - FULL 3D ROTATION WITH LIGHTING UPDATE
// =================================================================
AFRAME.registerComponent('drag-rotate-active', {
    init: function() {
        this.isDragging = false;
        this.previousX = 0;
        this.previousY = 0;
        
        this.cumulativeRotationY = this.el.object3D.rotation.y;
        this.cumulativeRotationX = this.el.object3D.rotation.x;
        
        console.log('Starting rotation - X:', this.cumulativeRotationX * (180 / Math.PI), 'Y:', this.cumulativeRotationY * (180 / Math.PI), 'degrees');
        
        this.onDown = this.onDown.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onUp = this.onUp.bind(this);
        
        const sceneEl = this.el.sceneEl;
        sceneEl.addEventListener('mousedown', this.onDown);
        sceneEl.addEventListener('mousemove', this.onMove);
        sceneEl.addEventListener('mouseup', this.onUp);
        sceneEl.addEventListener('touchstart', this.onDown, { passive: false });
        sceneEl.addEventListener('touchmove', this.onMove, { passive: false });
        sceneEl.addEventListener('touchend', this.onUp);
        
        console.log('3D Drag rotation ACTIVE for:', this.el.id);
    },
    
    onDown: function(e) {
        if (e.target.id === 'closeButton') {
            return;
        }
        
        e.preventDefault();
        this.isDragging = true;
        this.previousX = e.clientX || (e.touches && e.touches[0].clientX);
        this.previousY = e.clientY || (e.touches && e.touches[0].clientY);
        console.log('3D drag started');
    },
    
    onMove: function(e) {
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
        this.cumulativeRotationX = Math.max(-maxPitch, Math.min(maxPitch, this.cumulativeRotationX));
        
        this.el.object3D.rotation.x = this.cumulativeRotationX;
        this.el.object3D.rotation.y = this.cumulativeRotationY;
        this.el.object3D.rotation.z = 0;
        
        // FIXED: Update lighting to follow ring rotation
        // Lights stay in same world position, but we could add subtle movement
        // This ensures consistent lighting from all angles
    },
    
    onUp: function(e) {
        if (this.isDragging) {
            console.log('3D drag ended - X:', this.cumulativeRotationX * (180 / Math.PI), 'Y:', this.cumulativeRotationY * (180 / Math.PI), 'degrees');
        }
        this.isDragging = false;
    },
    
    remove: function() {
        const sceneEl = this.el.sceneEl;
        sceneEl.removeEventListener('mousedown', this.onDown);
        sceneEl.removeEventListener('mousemove', this.onMove);
        sceneEl.removeEventListener('mouseup', this.onUp);
        sceneEl.removeEventListener('touchstart', this.onDown);
        sceneEl.removeEventListener('touchmove', this.onMove);
        sceneEl.removeEventListener('touchend', this.onUp);
        
        console.log('3D Drag rotation DISABLED');
    }
});

// =================================================================
// CLOSE BUTTON HANDLER
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closeButton');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            closeRing();
        });
        
        closeBtn.addEventListener('touchstart', function(evt) {
            evt.stopPropagation();
        });
    }
});

// =================================================================
// SCENE INITIALIZATION
// =================================================================

if (document.querySelector('a-scene')) {
    initScene();
} else {
    document.addEventListener('DOMContentLoaded', initScene);
}

function initScene() {
    const scene = document.querySelector('a-scene');
    
    if (!scene) {
        console.error('A-Frame scene not found');
        return;
    }
    
    const assets = document.querySelector('a-assets');
    if (assets) {
        assets.addEventListener('loaded', function() {
            console.log('Assets loaded');
            setTimeout(() => {
                const loadingMsg = document.getElementById('loadingMessage');
                if (loadingMsg) {
                    loadingMsg.style.display = 'none';
                }
                console.log('Ready for interaction');
                
                document.querySelectorAll('.ring-group').forEach(r => {
                    r.setAttribute('visible', true);
                });
            }, 500);
        });
    }
    
    setTimeout(() => {
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            loadingMsg.style.display = 'none';
        }
    }, 3000);
    
    scene.addEventListener('loaded', function() {
        console.log('Scene loaded - Camera rig at:', document.querySelector('#cameraRig').object3D.position);
        
        const rings = document.querySelectorAll('.ring-group');
        rings.forEach((ring, index) => {
            const modelEl = ring.querySelector('[gltf-model]');
            if (modelEl) {
                modelEl.addEventListener('model-loaded', function() {
                    console.log(`Ring ${index + 1} model loaded`);
                    
                    const mesh = modelEl.getObject3D('mesh');
                    if (mesh) {
                        mesh.traverse(function(node) {
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

console.log('==============================================');
console.log('Luxury Jewelry Box System Initialized');
console.log('FULL 3D ROTATION + DYNAMIC LIGHTING');
console.log('3-Point Lighting System:');
console.log('  - Spotlight: Main illumination');
console.log('  - Rim Light: Edge definition');
console.log('  - Fill Light: Shadow softening');
console.log('==============================================');
