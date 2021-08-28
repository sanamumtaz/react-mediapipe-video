import React, { useRef, useEffect, useState } from "react"
import Webcam from "react-webcam"
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation"
import { Camera } from "@mediapipe/camera_utils"

export const AlterBackground = () => {
  const selfieSegmentationRef = useRef(null)
  const [isVirtualBg, setVirtualBg] = useState(false)
  const isVirtualBgRef = useRef(isVirtualBg)
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const backgroundImgRef = useRef({ current: null })

  function onResults(results) {
    const videoWidth = webcamRef.current.video.videoWidth
    const videoHeight = webcamRef.current.video.videoHeight

    canvasRef.current.width = videoWidth
    canvasRef.current.height = videoHeight
    const canvasElement = canvasRef.current
    const canvasCtx = canvasElement.getContext("2d")

    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)

    canvasCtx.globalCompositeOperation = "copy"
    canvasCtx.filter = `blur(4px)`
    canvasCtx.drawImage(
      results.segmentationMask,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    )

    canvasCtx.globalCompositeOperation = "source-in"
    canvasCtx.filter = "none"
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    )

    canvasCtx.globalCompositeOperation = "destination-over"
    canvasCtx.filter = isVirtualBgRef.current ? "none" : "blur(5px)"
    canvasCtx.drawImage(
      isVirtualBgRef.current ? backgroundImgRef.current : results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    )

    canvasCtx.restore()
  }

  useEffect(() => {
    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      },
    })
    selfieSegmentationRef.current = selfieSegmentation

    selfieSegmentation.setOptions({
      modelSelection: 1,
    })

    selfieSegmentation.onResults(onResults)

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      const maskFilterImage = document.createElement("img", {
        ref: backgroundImgRef,
      })
      maskFilterImage.objectFit = "contain"
      maskFilterImage.onload = function () {
        backgroundImgRef.current = maskFilterImage
        webcamRef.current.video.crossOrigin = "anonymous"

        const camera = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            webcamRef.current &&
              (await selfieSegmentation.send({
                image: webcamRef.current.video,
              }))
          },
          width: 640,
          height: 480,
        })
        camera.start()
      }
      maskFilterImage.src = "images/clear.jpg"
    }
  }, [])

  const cleanUpFunc = () => {
    selfieSegmentationRef && selfieSegmentationRef.current.close()
  }

  useEffect(() => {
    return () => {
      cleanUpFunc()
    }
  }, [])

  useEffect(() => {
    isVirtualBgRef.current = isVirtualBg
  }, [isVirtualBg])

  const handleOptionChange = (e) => {
    switch (e.target.value) {
      case "blur":
        setVirtualBg(false)
        break
      case "virtual":
        setVirtualBg(true)
        break
      default:
        setVirtualBg(false)
        break
    }
  }

  return (
    <>
      <div className="select-bg">
        <label>
          <input
            type="radio"
            value="blur"
            checked={!isVirtualBg}
            onChange={handleOptionChange}
          />
          Blur Background
        </label>
        <label>
          <input
            type="radio"
            value="virtual"
            checked={isVirtualBg}
            onChange={handleOptionChange}
          />
          Virtual Background
        </label>
      </div>
      <Webcam
        ref={webcamRef}
        videoConstraints={{
          facingMode: "user",
        }}
      />
      <canvas ref={canvasRef} className="output_canvas"></canvas>
    </>
  )
}
