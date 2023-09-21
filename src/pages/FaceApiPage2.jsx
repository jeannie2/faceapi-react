import { useEffect, useState, useRef } from 'react'
import * as faceapi from 'face-api.js'

import "../css/main.css"

const FaceApiPage = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [webcamRunning, setWebcamRunning] = useState(false)
  const [errorMsg, setErrorMsg] = useState({
    errorStatus: false,
    errorMessage: ''
  })

  const canvasRef = useRef()
  const videoRef = useRef()
  const videoHeight = 480
  const videoWidth = 640
  let predictedAges = []

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),

      ]).then(setModelsLoaded(true))
    }
    loadModels()
  }, [])

  useEffect(() => {
    startWebcam()
    // eslint-disable-next-line
  }, [])

  const startWebcam = () => {
    // setCaptureVideo(true);
    if(!webcamRunning) {
      // setWebcamRunning(true)
      navigator.mediaDevices.getUserMedia({ video:true })
        .then(stream => {
          setWebcamRunning(true)
          if(videoRef.current) {
            let video = videoRef.current
            video.srcObject = stream
            video.play()
          }
        })
        .catch(err => {
          setErrorMsg( {
            errorStatus: true,
            errorMessage: err.message
          })
        })
    }
  }

  const interpolateAgePredictions = (age) => {
    let sum = 0
    const maxPredictions = 40
    const updatedPredictions = [age].concat(predictedAges)
    const trimmedPredictions = updatedPredictions.slice(0, maxPredictions)

    for (let i = 0; i < trimmedPredictions.length; i++) {
      sum += trimmedPredictions[i]
    }
    const avgPredictedAge = sum / trimmedPredictions.length
    return avgPredictedAge
  }

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvas(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        }

        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender()

        if (detection) {
          const dims = faceapi.matchDimensions(canvasRef.current, displaySize)
          const resizedDetections = faceapi.resizeResults(detection, dims)

          canvasRef && canvasRef.current && canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight)
          canvasRef && canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections)

          const { age } = resizedDetections // destructure object
          const interpolatedAge = interpolateAgePredictions(age)

          new faceapi.draw.DrawTextField(
            [ `AGE: ${faceapi.utils.round(interpolatedAge, 0)} years`],
            detection.detection.box.bottomLeft
          ).draw(canvasRef.current)
        }
      }
    }, 50)
  }

  return (
    <>
      { errorMsg.errorStatus ? ( <h3 id="error-text"> Error: {errorMsg.errorMessage} </h3> ) : null }
      {
        webcamRunning ? (
          modelsLoaded ? (
            <div id="container">
              <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay}/>
              <canvas ref={canvasRef} />
            </div>
          ) : (
            <div>Loading...</div>
          )
        ) : null
      }
    </>
  );
}

export default FaceApiPage
