"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 1280,
  height: 720,
};

const WebcamCapture = () => {
  const webcamRef = useRef<any>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<any>(null);

  const [deviceId, setDeviceId] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current?.stream || null, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
    mediaRecorderRef.current.start();
  }, [webcamRef, setCapturing]);

  const handleDataAvailable = useCallback(({ data }: any) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  }, [setRecordedChunks]);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setCapturing(false);
  }, [mediaRecorderRef, setCapturing]);

  const handleDownload = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      a.download = "react-webcam-stream-capture.webm";
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  const handleDeviceChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDeviceId(event.target.value);
    const constraints = {
      video: {
        deviceId: event.target.value ? { exact: event.target.value } : undefined,
        facingMode,
        height: 720,
        width: 1280,
      },
    };

    if (webcamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      webcamRef.current.srcObject = stream;
    }
  }, [facingMode]);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-black w-full p-4 md:p-8">
      <div className="mb-4">
        <select
          value={deviceId}
          onChange={handleDeviceChange}
          className="bg-gray-800 border border-gray-600 text-white font-bold py-2 px-4 rounded-full mb-4"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Device ${devices.indexOf(device) + 1}`}
            </option>
          ))}
        </select>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          height={360}
          width={640}
          videoConstraints={{
            ...videoConstraints,
            facingMode,
            deviceId: deviceId ? { exact: deviceId } : undefined,
          }}
        />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => {
            const imageSrc = webcamRef.current?.getScreenshot();
            setImageSrc(imageSrc);
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Capture Photo
        </button>
        <button
          onClick={() => setFacingMode(facingMode === "user" ? "environment" : "user")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
        >
          Change Camera
        </button>
        {capturing ? (
          <button
            onClick={handleStopCaptureClick}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Stop Capture
          </button>
        ) : (
          <button
            onClick={handleStartCaptureClick}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Start Capture
          </button>
        )}
        {imageSrc && (
          <button
            onClick={() => setImageSrc(null)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Clear
          </button>
        )}
      </div>
      {imageSrc && (
        <div className="mt-4">
          <img src={imageSrc} alt="captured" className="w-full max-w-md rounded-lg shadow-lg" />
        </div>
      )}
      {recordedChunks.length > 0 && (
        <div className="mt-4 flex flex-col items-center">
          <video controls className="w-full max-w-md rounded-lg shadow-lg">
            <source src={URL.createObjectURL(new Blob(recordedChunks, { type: "video/webm" }))} type="video/webm" />
          </video>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
            >
              Download
            </button>
            <button
              onClick={() => setRecordedChunks([])}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
