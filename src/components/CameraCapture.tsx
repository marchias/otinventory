import React, { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import { compressImageFromDataUrl } from '../utils/imageUtils';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Zoom state
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [minZoom, setMinZoom] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);
  const [zoomStep, setZoomStep] = useState<number>(0.1);

  // Torch state
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Pinch-to-zoom refs
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number | null>(null);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const applyZoomValue = (value: number) => {
    const track = trackRef.current;
    if (!track || !zoomSupported) return;

    const clamped = clamp(value, minZoom, maxZoom);

    // Some browsers only support advanced constraints for zoom
    track
      .applyConstraints({ advanced: [{ zoom: clamped }] as any })
      .catch(err => {
        console.warn('Failed to apply zoom constraints:', err);
      });
  };

  const handleTouchStart = (e: TouchEvent<HTMLVideoElement>) => {
    if (!zoomSupported) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const distance = Math.hypot(dx, dy);
      pinchStartDistanceRef.current = distance;
      pinchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLVideoElement>) => {
    if (!zoomSupported) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      const startDistance = pinchStartDistanceRef.current;
      const startZoom = pinchStartZoomRef.current;
      if (startDistance == null || startZoom == null) return;

      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const distance = Math.hypot(dx, dy);

      const scale = distance / startDistance;
      const newZoom = clamp(startZoom * scale, minZoom, maxZoom);

      setZoom(newZoom);
      applyZoomValue(newZoom);
    }
  };

  const handleTouchEnd = () => {
    if (pinchStartDistanceRef.current != null) {
      pinchStartDistanceRef.current = null;
      pinchStartZoomRef.current = null;
    }
  };

  // Start / restart camera whenever currentDeviceIndex or device list changes
  useEffect(() => {
    const startCamera = async () => {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        trackRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = 'Camera API not supported in this browser or context.';
        console.error(msg);
        setError(msg);
        return;
      }

      try {
        setError(null);

        // Build constraints based on known devices (if we have them)
        let constraints: MediaStreamConstraints;
        if (videoDevices.length > 0 && currentDeviceIndex < videoDevices.length) {
          const deviceId = videoDevices[currentDeviceIndex].deviceId;
          constraints = {
            video: { deviceId: { exact: deviceId } },
            audio: false
          };
        } else {
          // First run: just ask for any camera
          constraints = {
            video: true,
            audio: false
          };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const videoTrack = stream.getVideoTracks()[0];
        trackRef.current = videoTrack;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              if (err?.name === 'AbortError') {
                console.warn(
                  'video.play() was aborted (likely StrictMode). Ignoring.'
                );
                return;
              }
              console.error('Error calling video.play():', err);
              setError(`Error starting video: ${err?.name ?? 'Error'}`);
            });
          }
        }

        // Capabilities for zoom / torch
        try {
          const caps = (videoTrack.getCapabilities() || {}) as any;

          // Zoom support
          if (caps.zoom) {
            setZoomSupported(true);
            const zMin = typeof caps.zoom.min === 'number' ? caps.zoom.min : 1;
            const zMax =
              typeof caps.zoom.max === 'number' ? caps.zoom.max : zMin;
            const zStep =
              typeof caps.zoom.step === 'number' ? caps.zoom.step : 0.1;
            setMinZoom(zMin);
            setMaxZoom(zMax);
            setZoomStep(zStep);

            const settings = (videoTrack.getSettings() || {}) as any;
            const initialZoom =
              typeof settings.zoom === 'number' ? settings.zoom : zMin;
            setZoom(initialZoom);
            applyZoomValue(initialZoom);
          } else {
            setZoomSupported(false);
          }

          // Torch support
          if (typeof caps.torch === 'boolean') {
            setTorchSupported(true);
            setTorchOn(false);
            } else {
            setTorchSupported(false);
            setTorchOn(false);
            }
        } catch (capErr) {
          console.warn('Error reading track capabilities:', capErr);
          setZoomSupported(false);
          setTorchSupported(false);
          setTorchOn(false);
        }

        // After we have a stream, discover available cameras
        if (navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const vids = devices.filter(d => d.kind === 'videoinput');
            setVideoDevices(vids);
            setHasMultipleCameras(vids.length > 1);

            // Ensure currentDeviceIndex stays in range
            if (vids.length > 0 && currentDeviceIndex >= vids.length) {
              setCurrentDeviceIndex(0);
            }
          } catch (devErr) {
            console.warn('enumerateDevices failed:', devErr);
          }
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        const name = err?.name || 'UnknownError';
        const message = err?.message || String(err);
        setError(`Error accessing camera (${name}): ${message}`);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        trackRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDeviceIndex, videoDevices.length]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const compressedDataUrl = await compressImageFromDataUrl(rawDataUrl);
    onCapture(compressedDataUrl);
    onClose();
  };

  const handleFlipCamera = () => {
    if (videoDevices.length < 2) return;
    setTorchOn(false); // ensure UI resets
    setCurrentDeviceIndex(prev => (prev + 1) % videoDevices.length);
  };

  const handleToggleTorch = async () => {
    const track = trackRef.current;
    if (!track || !torchSupported) return;

    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next }] as any
      });
      setTorchOn(next);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ margin: 0 }}>Take Photo</h3>
          <div style={styles.headerButtons}>
            {hasMultipleCameras && !error && (
              <button
                type="button"
                onClick={handleFlipCamera}
                style={styles.smallButton}
              >
                🔄 Switch Camera
              </button>
            )}
            {torchSupported && !error && (
              <button
                type="button"
                onClick={handleToggleTorch}
                style={styles.smallButton}
              >
                {torchOn ? '🔦 Torch Off' : '🔦 Torch On'}
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p style={{ color: '#e53e3e', whiteSpace: 'pre-wrap' }}>{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              style={styles.video}
              autoPlay
              playsInline
              muted
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            />
            {zoomSupported && (
              <div style={styles.zoomRow}>
                <label style={styles.zoomLabel}>
                  Zoom
                  <input
                    type="range"
                    min={minZoom}
                    max={maxZoom}
                    step={zoomStep}
                    value={zoom}
                    onChange={e => {
                      const value = Number(e.target.value);
                      setZoom(value);
                      applyZoomValue(value);
                    }}
                    style={styles.zoomSlider}
                  />
                </label>
              </div>
            )}
          </>
        )}

        <div style={styles.buttonsRow}>
          <button type="button" onClick={onClose} style={styles.secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            style={styles.primaryButton}
            disabled={!!error}
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    maxWidth: '480px',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  headerButtons: {
    display: 'flex',
    gap: 8
  },
  video: {
    width: '100%',
    borderRadius: '4px',
    backgroundColor: '#000'
  },
  buttonsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  },
  primaryButton: {
    padding: '6px 12px',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#f5f5f5'
  },
  smallButton: {
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: 4,
    border: '1px solid #ccc',
    background: '#f5f5f5',
    fontSize: '0.8rem'
  },
  zoomRow: {
    marginTop: 8,
    marginBottom: 4
  },
  zoomLabel: {
    fontSize: '0.8rem',
    display: 'block'
  },
  zoomSlider: {
    width: '100%',
    marginTop: 4
  }
};

export default CameraCapture;
