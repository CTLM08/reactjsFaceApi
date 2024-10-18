import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function App() {
  const cameraRef = useRef();
  const canvasRef = useRef();
  const [emotions, setEmotions] = useState([]); // State to store detected emotions

  useEffect(() => {
    startVideo();
    cameraRef && loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        cameraRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      faceMyDetect();
    });
  };

  const faceMyDetect = () => {
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(
          cameraRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0) {
        // Get the dominant emotion for each face
        const detectedEmotions = detections.map((detection) => {
          const emotions = detection.expressions;
          const dominantEmotion = Object.keys(emotions).reduce((a, b) =>
            emotions[a] > emotions[b] ? a : b
          );
          return dominantEmotion;
        });
        setEmotions(detectedEmotions); // Store detected emotions in state
      }

      // Clear the previous drawings
      const canvas = canvasRef.current;
      const displaySize = {
        width: cameraRef.current.width,
        height: cameraRef.current.height,
      };

      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      // Clear the previous canvas content
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faces, landmarks, and expressions on the canvas
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 1000);
  };
  return (
    <div className="myapp">
      <h1>Face Detection</h1>
      <div className="appvide">
        <video
          crossOrigin="anonymous"
          className=""
          ref={cameraRef}
          autoPlay
          width="940"
          height="650"
        ></video>
      </div>
      <canvas ref={canvasRef} width="940" height="650" className="appcanvas " />

      {/* Displaying Detected Emotions */}
      <div>
        <h2>Detected Emotions</h2>
        {emotions.length > 0 ? (
          emotions.map((emotion, index) => (
            <div key={index}>
              <p>
                Person {index + 1}'s dominant emotion: {emotion}
              </p>
            </div>
          ))
        ) : (
          <p>No emotions detected yet.</p>
        )}
      </div>
    </div>
  );
}

export default App;
