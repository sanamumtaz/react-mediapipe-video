import "./App.css"
import React, { useRef, useEffect } from "react"
import Webcam from "react-webcam"
import { FaceMesh } from "@mediapipe/face_mesh"
import { Camera } from "@mediapipe/camera_utils"

function App() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const filterImgRef = useRef({ current: null })

  function onResults(results) {
    const videoWidth = webcamRef.current.video.videoWidth
    const videoHeight = webcamRef.current.video.videoHeight

    canvasRef.current.width = videoWidth
    canvasRef.current.height = videoHeight
    const canvasElement = canvasRef.current
    const canvasCtx = canvasElement.getContext("2d")
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    )
    if (results.multiFaceLandmarks.length > 0) {
      const keypoints = results.multiFaceLandmarks[0]

      const maskWidth = Math.abs(
        keypoints[234].x * videoWidth - keypoints[454].x * videoWidth
      )
      const maskHeight =
        Math.abs(
          keypoints[234].y * videoHeight - keypoints[152].y * videoHeight
        ) + 10
      filterImgRef.current.width = `${maskWidth}`
      filterImgRef.current.height = `${maskHeight}`

      canvasCtx.drawImage(
        filterImgRef.current,
        keypoints[234].x * videoWidth,
        keypoints[234].y * videoHeight - 10,
        maskWidth,
        maskHeight
      )
    }
  }

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      },
    })

    faceMesh.setOptions({
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    faceMesh.onResults(onResults)

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      const maskFilterImage = document.createElement("img", {
        ref: filterImgRef,
      })
      maskFilterImage.objectFit = "contain"
      maskFilterImage.onload = function () {
        filterImgRef.current = maskFilterImage
        webcamRef.current.video.crossOrigin = "anonymous"

        const camera = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            await faceMesh.send({ image: webcamRef.current.video })
          },
          width: 640,
          height: 480,
        })
        camera.start()
      }
      maskFilterImage.src = "images/mask.png"
    }
  }, [])

  return (
    <div className="App">
      <h2>Mediapipe Implementation</h2>
      <Webcam
        ref={webcamRef}
        videoConstraints={{
          facingMode: "user",
        }}
      />
      <canvas ref={canvasRef} className="output_canvas"></canvas>
    </div>
  )
}

export default App
