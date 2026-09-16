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
};

let animationFrame;

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
  } catch (error) {
    camera.classList.remove('is-live');
    status.textContent = 'Camera permission was not available. Allow camera access in your browser settings, then tap “Try camera again”.';
    startButton.textContent = 'Try camera again';
    startButton.classList.add('is-visible');
  }
}

enterButton.addEventListener('click', async () => {
  welcome.hidden = true;
  await startCamera();
});

startButton.addEventListener('click', startCamera);
helpButton.addEventListener('click', () => { help.hidden = false; });
closeHelp.addEventListener('click', () => { help.hidden = true; });
help.addEventListener('click', (event) => { if (event.target === help) help.hidden = true; });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) state.stream?.getTracks().forEach((track) => track.stop());
});

render();
