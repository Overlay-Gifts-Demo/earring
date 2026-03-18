/* ============================= */
/* JEWELS AI — SINGLE EARRING MODE */
/* ============================= */

const API_KEY = "AIzaSyAXG3iG2oQjUA_BpnO8dK8y-MHJ7HLrhyE";

/* ONLY ONE FOLDER */

const DRIVE_FOLDERS = {
  earrings: "1eftKhpOHbCj8hzO11-KioFv03g0Yn61n"
};


/* GLOBAL STATE */

window.JewelsState = {
  active: { earrings: null },
  currentType: "earrings"
};


const JEWELRY_ASSETS = {};
const IMAGE_CACHE = {};


/* DOM */

const videoElement = document.getElementById("webcam");
const canvasElement = document.getElementById("overlay");
const canvasCtx = canvasElement.getContext("2d");


/* ============================= */
/* LOAD FROM DRIVE */
/* ============================= */

async function fetchCategoryData(category) {

  const url =
    "https://www.googleapis.com/drive/v3/files?q='" +
    DRIVE_FOLDERS[category] +
    "' in parents and mimeType contains 'image/'&fields=files(id,name,thumbnailLink)&key=" +
    API_KEY;

  const res = await fetch(url);
  const data = await res.json();

  /* ONLY FIRST IMAGE */

  JEWELRY_ASSETS[category] =
    data.files.slice(0, 1).map(file => ({

      id: file.id,

      name: file.name,

      thumbSrc:
        file.thumbnailLink.replace(/=s\d+$/, "=s400"),

      fullSrc:
        file.thumbnailLink.replace(/=s\d+$/, "=s2000")

    }));


  return JEWELRY_ASSETS[category];

}



/* ============================= */
/* LOAD IMAGE */
/* ============================= */

function loadAsset(src, id) {

  return new Promise(resolve => {

    if (IMAGE_CACHE[id]) {
      resolve(IMAGE_CACHE[id]);
      return;
    }

    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      IMAGE_CACHE[id] = img;
      resolve(img);
    };

    img.src = src;

  });

}



/* ============================= */
/* APPLY IMAGE */
/* ============================= */

async function applyAsset(asset) {

  const img = await loadAsset(
    asset.fullSrc,
    asset.id
  );

  window.JewelsState.active.earrings = img;

}



/* ============================= */
/* SELECT TYPE */
/* ============================= */

async function selectJewelryType(type) {

  const assets =
    await fetchCategoryData("earrings");

  if (!assets.length) return;

  await applyAsset(assets[0]);

}



/* ============================= */
/* CAMERA */
/* ============================= */

async function startCamera() {

  const stream =
    await navigator.mediaDevices.getUserMedia({
      video: true
    });

  videoElement.srcObject = stream;

  videoElement.onloadeddata = () => {
    detectLoop();
  };

}



/* ============================= */
/* DETECT LOOP */
/* ============================= */

async function detectLoop() {

  if (videoElement.readyState >= 2) {

    await faceMesh.send({
      image: videoElement
    });

  }

  requestAnimationFrame(detectLoop);

}



/* ============================= */
/* MEDIAPIPE */
/* ============================= */

const faceMesh =
  new FaceMesh({

    locateFile: file =>
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/" +
      file

  });



faceMesh.setOptions({

  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5

});



faceMesh.onResults(results => {

  const img =
    window.JewelsState.active.earrings;

  if (!img) return;

  const w = videoElement.videoWidth;
  const h = videoElement.videoHeight;

  canvasElement.width = w;
  canvasElement.height = h;

  canvasCtx.save();

  canvasCtx.translate(w, 0);
  canvasCtx.scale(-1, 1);

  canvasCtx.drawImage(
    videoElement,
    0,
    0,
    w,
    h
  );


  if (
    results.multiFaceLandmarks &&
    results.multiFaceLandmarks[0]
  ) {

    const lm =
      results.multiFaceLandmarks[0];

    const leftEar = {
      x: lm[132].x * w,
      y: lm[132].y * h
    };

    const rightEar = {
      x: lm[361].x * w,
      y: lm[361].y * h
    };


    const size =
      Math.hypot(
        rightEar.x - leftEar.x,
        rightEar.y - leftEar.y
      ) * 0.25;


    const h2 =
      (img.height / img.width) *
      size;


    canvasCtx.drawImage(
      img,
      leftEar.x - size / 2,
      leftEar.y,
      size,
      h2
    );

    canvasCtx.drawImage(
      img,
      rightEar.x - size / 2,
      rightEar.y,
      size,
      h2
    );

  }

  canvasCtx.restore();

});



/* ============================= */
/* SNAPSHOT */
/* ============================= */

function takeSnapshot() {

  const data =
    canvasElement.toDataURL();

  const a =
    document.createElement("a");

  a.href = data;

  a.download =
    "jewels.png";

  a.click();

}



/* ============================= */
/* INIT */
/* ============================= */

window.onload = async () => {

  await startCamera();

  await selectJewelryType("earrings");

};