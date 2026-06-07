import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card } from '@mui/material';
import swal from 'sweetalert';
import { UploadClient } from '@uploadcare/upload-client';

const client = new UploadClient({ publicKey: 'e69ab6e5db6d4a41760b' });

export default function Home({ cheatingLog, updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastDetectionTime, setLastDetectionTime] = useState({});
  const [screenshots, setScreenshots] = useState([]);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  // Prohibited objects list for reference
  const PROHIBITED_OBJECTS = ['book', 'laptop'];

  // Initialize screenshots array when component mounts
  useEffect(() => {
    if (cheatingLog && cheatingLog.screenshots) {
      setScreenshots(cheatingLog.screenshots);
    }
  }, [cheatingLog]);

  const captureScreenshotAndUpload = async (type) => {
    const video = webcamRef.current?.video;

    if (
      !video ||
      video.readyState !== 4 || // ensure video is ready
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.warn('Video not ready for screenshot');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    const file = dataURLtoFile(dataUrl, `cheating_${Date.now()}.jpg`);

    try {
      const result = await client.uploadFile(file);
      console.log('✅ Uploaded to Uploadcare:', result.cdnUrl);
      
      const screenshot = {
        url: result.cdnUrl,
        type: type,
        detectedAt: new Date()
      };

      // Update local screenshots state
      setScreenshots(prev => [...prev, screenshot]);
      
      return screenshot;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }
  };

  const handleDetection = async (type) => {
    const now = Date.now();
    const lastTime = lastDetectionTime[type] || 0;

    if (now - lastTime >= 3000) {
      setLastDetectionTime((prev) => ({ ...prev, [type]: now }));

      // Capture and upload screenshot if possible
      const screenshot = await captureScreenshotAndUpload(type);

      const updatedLog = {
        ...cheatingLog,
        [`${type}Count`]: (cheatingLog[`${type}Count`] || 0) + 1,
        screenshots: screenshot
          ? [...(cheatingLog.screenshots || []), screenshot]
          : cheatingLog.screenshots || [],
      };

      console.log(`Detected ${type}:`, updatedLog);
      updateCheatingLog(updatedLog);

      switch (type) {
        case 'noFace':
          swal('Face Not Visible', 'Warning Recorded', 'warning');
          break;
        case 'multipleFace':
          swal('Multiple Faces Detected', 'Warning Recorded', 'warning');
          break;
        case 'cellPhone':
          swal('Cell Phone Detected', 'This is a violation! Warning Recorded', 'warning');
          break;
        case 'prohibitedObject':
          swal('Prohibited Object Detected (Book/Laptop)', 'Warning Recorded', 'warning');
          break;
        case 'externalNoise':
          swal('External Noise Detected', 'Microphone Issue or Background Noise', 'warning');
          break;
        default:
          break;
      }
    }
  };

  const runCoco = async () => {
    try {
      const net = await cocossd.load();
      console.log('AI model loaded.');
      setInterval(() => detect(net), 1000);
    } catch (error) {
      console.error('Error loading model:', error);
      swal('Error', 'Failed to load AI model. Please refresh the page.', 'error');
    }
  };

  const checkAudioLevel = () => {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const NOISE_THRESHOLD = 50; // Adjust threshold for sensitivity

    if (average > NOISE_THRESHOLD) {
      // High noise/audio detected - likely external sound
      handleDetection('externalNoise');
    }
  };

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamAudioSource(stream);
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
    } catch (error) {
      console.warn('Microphone access denied or unavailable:', error);
    }
  };

  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const obj = await net.detect(video);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawRect(obj, ctx);

        let person_count = 0;
        let faceDetected = false;

        obj.forEach((element) => {
          const detectedClass = element.class;
          console.log('Detected:', detectedClass);

          // Cell phone detection (separate from prohibited objects)
          if (detectedClass === 'cell phone') handleDetection('cellPhone');
          
          // Prohibited objects detection (book, laptop)
          if (PROHIBITED_OBJECTS.includes(detectedClass)) {
            handleDetection('prohibitedObject');
          }
          
          if (detectedClass === 'person') {
            faceDetected = true;
            person_count++;
            if (person_count > 1) handleDetection('multipleFace');
          }
        });

        if (!faceDetected) handleDetection('noFace');
        
        // Check for external noise
        if (analyser) checkAudioLevel();
      } catch (error) {
        console.error('Error during detection:', error);
      }
    }
  };

  useEffect(() => {
    runCoco();
    initAudio();
  }, []);

  return (
    <Box>
      <Card variant="outlined" sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user',
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        />
      </Card>
    </Box>
  );
}

// Helper to convert base64 to File
function dataURLtoFile(dataUrl, fileName) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}
