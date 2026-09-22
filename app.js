const camera = document.querySelector('#camera');
const stage = document.querySelector('#stage');
const object = document.querySelector('#object');
const welcome = document.querySelector('#welcome');
const enterButton = document.querySelector('#enterButton');
const startButton = document.querySelector('#startButton');
const status = document.querySelector('#status');
const help = document.querySelector('#help');
const helpButton = document.querySelector('#helpButton');
const closeHelp = document.querySelector('#closeHelp');
const captureButton = document.querySelector('#captureButton');
const captureCanvas = document.querySelector('#captureCanvas');
const capturePreview = document.querySelector('#capturePreview');
const capturedImage = document.querySelector('#capturedImage');
const shareCapture = document.querySelector('#shareCapture');
const downloadCapture = document.querySelector('#downloadCapture');
const retakeCapture = document.querySelector('#retakeCapture');
const closeCapture = document.querySelector('#closeCapture');
const shareStatus = document.querySelector('#shareStatus');
const mnemonicImage = document.querySelector('.face-front img');
const surfacePanel = document.querySelector('#surfacePanel');
const surfaceModel = document.querySelector('#surfaceModel');
const surfaceLoader = document.querySelector('#surfaceLoader');
const surfaceRetry = document.querySelector('#surfaceRetry');

const state = {
  rotateX: -4,
  rotateY: 0,
  scale: 1,
  velocityX: 0,
  velocityY: 0,
  lastTap: 0,
  pointers: new Map(),
  pinchDistance: 0,
  pinchScale: 1,
  stream: null,
  captureBlob: null,
  captureUrl: '',
};

let animationFrame;
let arSessionStarted = false;

function render() {
  object.style.transform = `rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) scale(${state.scale})`;
}

function resetObject() {
  state.rotateX = -4;
  state.rotateY = 0;
  state.scale = 1;
  state.velocityX = 0;
  state.velocityY = 0;
  render();
}

function animateInertia() {
  cancelAnimationFrame(animationFrame);
  const tick = () => {
    state.velocityX *= 0.93;
    state.velocityY *= 0.93;
    state.rotateY += state.velocityX;
    state.rotateX = Math.max(-70, Math.min(70, state.rotateX - state.velocityY));
    render();
    if (Math.abs(state.velocityX) > 0.02 || Math.abs(state.velocityY) > 0.02) {
      animationFrame = requestAnimationFrame(tick);
    }
  };
  animationFrame = requestAnimationFrame(tick);
}

function distanceBetweenPointers() {
  const points = [...state.pointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

stage.addEventListener('pointerdown', (event) => {
  cancelAnimationFrame(animationFrame);
  stage.setPointerCapture(event.pointerId);
  state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  const now = performance.now();
  if (state.pointers.size === 1 && now - state.lastTap < 280) resetObject();
  state.lastTap = now;

  if (state.pointers.size === 2) {
    state.pinchDistance = distanceBetweenPointers();
    state.pinchScale = state.scale;
  }
});

stage.addEventListener('pointermove', (event) => {
  const previous = state.pointers.get(event.pointerId);
  if (!previous) return;

  if (state.pointers.size === 1) {
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    state.velocityX = dx * 0.38;
    state.velocityY = dy * 0.32;
    state.rotateY += state.velocityX;
    state.rotateX = Math.max(-70, Math.min(70, state.rotateX - state.velocityY));
  }

  state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (state.pointers.size === 2) {
    const distance = distanceBetweenPointers();
    if (state.pinchDistance > 0) {
      state.scale = Math.max(0.55, Math.min(1.65, state.pinchScale * distance / state.pinchDistance));
    }
  }
  render();
});

function releasePointer(event) {
  state.pointers.delete(event.pointerId);
  if (state.pointers.size === 0) animateInertia();
  if (state.pointers.size === 1) {
    const remaining = [...state.pointers.values()][0];
    state.pinchDistance = 0;
    state.pinchScale = state.scale;
    state.pointers = new Map([[...state.pointers.keys()][0], remaining]);
  }
}

stage.addEventListener('pointerup', releasePointer);
stage.addEventListener('pointercancel', releasePointer);

async function startCamera() {
  status.textContent = '';
  startButton.classList.remove('is-visible');
  captureButton.classList.remove('is-visible');

  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = 'Camera access is not supported in this browser. You can still interact with the mnemonic.';
    startButton.classList.add('is-visible');
    startButton.textContent = 'Try camera again';
    return;
  }

  try {
    state.stream?.getTracks().forEach((track) => track.stop());
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    camera.srcObject = state.stream;
    await camera.play();
    camera.classList.add('is-live');
    captureButton.classList.add('is-visible');
  } catch (error) {
    camera.classList.remove('is-live');
    captureButton.classList.remove('is-visible');
    status.textContent = 'Camera permission was not available. Allow camera access in your browser settings, then tap “Try camera again”.';
    startButton.textContent = 'Try camera again';
    startButton.classList.add('is-visible');
  }
}

function drawCameraCover(context, source, width, height) {
  const sourceRatio = source.videoWidth / source.videoHeight;
  const targetRatio = width / height;
  let sourceWidth = source.videoWidth;
  let sourceHeight = source.videoHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = source.videoHeight * targetRatio;
    sourceX = (source.videoWidth - sourceWidth) / 2;
  } else {
    sourceHeight = source.videoWidth / targetRatio;
    sourceY = (source.videoHeight - sourceHeight) / 2;
  }

  context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function drawMnemonic(context, width, height) {
  const stageRect = stage.getBoundingClientRect();
  const centerX = stageRect.left + stageRect.width / 2;
  const centerY = stageRect.top + stageRect.height / 2;
  const baseSize = object.offsetWidth * state.scale;
  const imageRatio = mnemonicImage.naturalWidth / mnemonicImage.naturalHeight;
  let drawWidth = baseSize;
  let drawHeight = baseSize;

  if (imageRatio > 1) drawHeight = baseSize / imageRatio;
  else drawWidth = baseSize * imageRatio;

  const depthX = Math.max(.06, Math.abs(Math.cos(state.rotateY * Math.PI / 180)));
  const depthY = Math.max(.18, Math.abs(Math.cos(state.rotateX * Math.PI / 180)));

  context.save();
  context.translate(centerX, centerY);
  context.scale(depthX, depthY);
  context.shadowColor = 'rgba(0,0,0,.35)';
  context.shadowBlur = 24;
  context.shadowOffsetY = 18;
  context.drawImage(mnemonicImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
}

async function capturePhoto() {
  if (!camera.videoWidth || !camera.videoHeight) {
    status.textContent = 'The camera is still starting. Please try again in a moment.';
    return;
  }

  if (!mnemonicImage.complete) await mnemonicImage.decode();

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  captureCanvas.width = Math.round(width * pixelRatio);
  captureCanvas.height = Math.round(height * pixelRatio);
  const context = captureCanvas.getContext('2d');
  context.scale(pixelRatio, pixelRatio);
  drawCameraCover(context, camera, width, height);

  const shade = context.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(0,0,0,.22)');
  shade.addColorStop(.26, 'rgba(0,0,0,0)');
  shade.addColorStop(.72, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,.22)');
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);
  drawMnemonic(context, width, height);

  const blob = await new Promise((resolve) => captureCanvas.toBlob(resolve, 'image/png', 1));
  if (!blob) {
    status.textContent = 'The photo could not be created. Please try again.';
    return;
  }

  if (state.captureUrl) URL.revokeObjectURL(state.captureUrl);
  state.captureBlob = blob;
  state.captureUrl = URL.createObjectURL(blob);
  capturedImage.src = state.captureUrl;
  downloadCapture.href = state.captureUrl;
  shareStatus.textContent = '';
  capturePreview.hidden = false;
}

async function sharePhoto() {
  if (!state.captureBlob) return;
  const file = new File([state.captureBlob], 'kfc-20-years-moment.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'KFC Bangladesh — 20 Years',
        text: 'Celebrating 20 years of KFC Bangladesh!',
      });
      shareStatus.textContent = 'Photo shared.';
    } catch (error) {
      if (error.name !== 'AbortError') shareStatus.textContent = 'Sharing was unavailable. You can download the photo instead.';
    }
    return;
  }

  shareStatus.textContent = 'Direct sharing is not supported here. Download the photo and share it from your gallery.';
}

function closePhotoPreview() {
  capturePreview.hidden = true;
  shareStatus.textContent = '';
}

function stopCamera() {
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
  camera.srcObject = null;
  camera.classList.remove('is-live');
  captureButton.classList.remove('is-visible');
}

function waitForModel() {
  if (surfaceModel.loaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('The AR artwork took too long to load.')), 15000);
    surfaceModel.addEventListener('load', () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
    surfaceModel.addEventListener('error', () => {
      window.clearTimeout(timeout);
      reject(new Error('The AR artwork could not be loaded.'));
    }, { once: true });
  });
}

async function launchSurfaceAR() {
  welcome.hidden = true;
  surfacePanel.hidden = false;
  surfaceLoader.hidden = false;
  surfaceLoader.textContent = 'Starting surface tracking…';
  surfaceRetry.hidden = true;
  status.textContent = '';
  stopCamera();

  try {
    if (!window.isSecureContext) throw new Error('Surface tracking requires a secure HTTPS page.');
    await customElements.whenDefined('model-viewer');
    await waitForModel();

    if (!surfaceModel.canActivateAR) {
      throw new Error('Surface tracking is not available on this phone or browser. Use Android Chrome with Google Play Services for AR installed.');
    }

    await surfaceModel.activateAR();
  } catch (error) {
    surfaceLoader.textContent = error.message || 'Surface tracking could not start. Please try again.';
    surfaceRetry.hidden = false;
  }
}

enterButton.addEventListener('click', async () => {
  await launchSurfaceAR();
});

startButton.addEventListener('click', startCamera);
surfaceRetry.addEventListener('click', launchSurfaceAR);
surfaceModel.addEventListener('ar-status', (event) => {
  const arStatus = event.detail.status;
  if (arStatus === 'session-started') {
    arSessionStarted = true;
    surfaceLoader.hidden = true;
  } else if (arStatus === 'object-placed') {
    surfaceLoader.hidden = true;
  } else if (arStatus === 'failed') {
    surfaceLoader.hidden = false;
    surfaceLoader.textContent = 'Surface tracking could not start. Check camera permission and try again.';
    surfaceRetry.hidden = false;
  } else if (arStatus === 'not-presenting' && arSessionStarted) {
    arSessionStarted = false;
    welcome.hidden = false;
    surfaceLoader.hidden = true;
  }
});
captureButton.addEventListener('click', capturePhoto);
shareCapture.addEventListener('click', sharePhoto);
retakeCapture.addEventListener('click', closePhotoPreview);
closeCapture.addEventListener('click', closePhotoPreview);
capturePreview.addEventListener('click', (event) => { if (event.target === capturePreview) closePhotoPreview(); });
helpButton.addEventListener('click', () => { help.hidden = false; });
closeHelp.addEventListener('click', () => { help.hidden = true; });
help.addEventListener('click', (event) => { if (event.target === help) help.hidden = true; });

window.addEventListener('pagehide', () => {
  stopCamera();
});

render();
