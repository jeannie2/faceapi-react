import * as faceapi from 'face-api.js'
import { useEffect, useState, useRef } from 'react'

import "../css/main.css"

const FaceApiPage = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false)
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
    startWebcam()
    loadModels()
    runFaceDetection()
    // eslint-disable-next-line
  }, [])

  const startWebcam = () => {
    navigator.mediaDevices.getUserMedia({ video:true })
    .then(stream => {
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

  const loadModels = async () => {
    const MODEL_URL = '/models'

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),

    ])
    setModelsLoaded(true)
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

  const runFaceDetection = () => {
    const interval = setInterval(async () => {
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

    return () => clearInterval(interval)
  }

  return (
    <>
      <h2>Face-api age estimation project</h2>
      { errorMsg.errorStatus ? ( <h4 id="error-text"> Error: {errorMsg.errorMessage} </h4> ) : null }
      {
        modelsLoaded ? (
          <div id="container">
            <video ref={videoRef} height={videoHeight} width={videoWidth}/>
            <canvas ref={canvasRef} />
          </div>
        ) : (
          <div>Loading...</div>
        )
      }
    </>
  )
}

export default FaceApiPage
