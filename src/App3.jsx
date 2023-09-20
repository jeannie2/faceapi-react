// Uncaught (in promise) Error: createCanvasFromMedia - media has not finished loading yet
import * as faceapi from 'face-api.js';
import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  // const [captureVideo, setCaptureVideo] = useState(false);
  const [webcamRunning, setWebcamRunning] = useState(false);

  const videoRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = useRef();

useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';

      Promise.all([
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(setModelsLoaded(true));
    }
    loadModels();
  }, []);

  useEffect(() => {
    startWebcam()
    // eslint-disable-next-line
  }, [])

  const startWebcam = () => {
    // setCaptureVideo(true);
    if(!webcamRunning) {
      setWebcamRunning(true)
      navigator.mediaDevices
        .getUserMedia({ video: { width: 300 } })
        .then(stream => {
          let video = videoRef.current;
          video.srcObject = stream;
          video.play();
        })
        .catch(err => {
          console.error("error:", err);
        });
    }
  }

  let predictedAges = []

  function interpolateAgePredictions(age) {
      predictedAges = [age].concat(predictedAges).slice(0, 40) // 30
      const avgPredictedAge = predictedAges.reduce((total, a) => total + a) / predictedAges.length
      return avgPredictedAge
    }

  const handleVideoOnPlay = () => {
    // const canvas = faceapi.createCanvasFromMedia(videoRef)
    // document.body.append(canvas)

    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        // canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current); me: to resolve error
        canvasRef.current.innerHTML =  faceapi.createCanvas(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        }

        // faceapi.matchDimensions(canvasRef.current, displaySize); if put here box appears glitchy

        // const detectionWithAgeAndGender = await faceapi.detectSingleFace(input).withFaceLandmarks().withAgeAndGender() // official

        // let inputSize = 512 ?
        // let scoreThreshold = 0.5 ?
        // new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })

        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender() // withFaceLandmarks().
        // const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
        //  const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions(); //react faceapi example

        if (detection) {
          // faceapi.matchDimensions(canvasRef.current, displaySize); SUSHI
          // const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true)
          const dims = faceapi.matchDimensions(canvasRef.current, displaySize)

          const resizedDetections = faceapi.resizeResults(detection, dims)
          // const resizedDetections = faceapi.resizeResults(detection, displaySize); // const result SUSHI

        canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight); // update QQ
        canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        // canvasRef && canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        const { age } = resizedDetections;
        console.log(`AGE: ${age}`)
        // const age = resizedDetections[0].age;

        // canvasRef && canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
        // canvasRef && canvasRef.current && faceapi.draw.drawAgeGender(canvasRef.current, resizedDetections);

        const interpolatedAge = interpolateAgePredictions(age)

          new faceapi.draw.DrawTextField(
          [ `AGE: ${faceapi.utils.round(interpolatedAge, 0)} years`],
          detection.detection.box.bottomLeft
        ).draw(canvasRef.current)
          }
    //     resizedDetections.forEach((detection) => {
    // const box = detection.detection.box;
    // const drawBox = new faceapi.draw.DrawBox(box, {
    //   label: `${Math.round(detection.age)}y, ${detection.gender}`,
    // });
    // drawBox.draw(canvasRef.current);
  // });

    //     resizedDetections.forEach( detection => {
    //   const box = detection.detection.box
    //   const drawBox = new faceapi.draw.DrawBox(box, { label: Math.round(detection.age) + " year old " + detection.gender })
    //   drawBox.draw(canvas)
    // })
    //   resizedDetections.forEach(result => {
    //   const { age, gender, genderProbability } = result;
    //   new faceapi.draw.DrawTextField(
    //     [
    //       `${faceapi.round(age, 0)} years`,
    //       `${gender} (${faceapi.round(genderProbability)})`
    //     ],
    //     result.detection.box.bottomRight
    //   ).draw(canvas);
    // });

      }
    }, 50)
  }

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setWebcamRunning(false);
  }

  // captureVideo && modelsLoaded ?

        // captureVideo ?
        //   modelsLoaded ?
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px' }}>
        {/* {
          webcamRunning && modelsLoaded ?
            <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Close Webcam
            </button>
            :
            <button onClick={startWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Open Webcam
            </button>
        } */}
      </div>
      {
        webcamRunning ?
          modelsLoaded ?
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                {/* <video ref={videoRef} width={480} height={680} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px'}} /> */}
                {/* width: '640px', height: '480px' } */}
                <canvas ref={canvasRef} style={{ position: 'absolute' }} />
              </div>
            </div>
            :
            <div>loading...</div>
          :
          <>
          </>
      }
    </div>
  );
}

export default App;
