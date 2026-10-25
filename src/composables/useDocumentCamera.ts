import { ref, onUnmounted } from 'vue';

export function useDocumentCamera() {
  const isStreaming = ref(false);
  const isTorchSupported = ref(false);
  const isTorchOn = ref(false);
  const currentFacingMode = ref<'environment' | 'user'>('environment');
  const errorMessage = ref<string | null>(null);

  let mediaStream: MediaStream | null = null;
  let videoTrack: MediaStreamTrack | null = null;

  async function startCamera(videoElement: HTMLVideoElement, facingMode: 'environment' | 'user' = 'environment') {
    stopCamera(videoElement);
    errorMessage.value = null;
    currentFacingMode.value = facingMode;

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
        },
      };

      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');
      videoElement.autoplay = true;
      videoElement.muted = true;

      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      videoTrack = mediaStream.getVideoTracks()[0] ?? null;

      videoElement.srcObject = mediaStream;
      await videoElement.play();

      isStreaming.value = true;

      // Check for torch capability
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        isTorchSupported.value = Boolean(capabilities?.torch);
      }
    } catch (err) {
      isStreaming.value = false;
      errorMessage.value = `Gagal mengakses kamera: ${(err as Error).message}`;
      console.error('Camera error:', err);
    }
  }

  async function toggleCamera(videoElement: HTMLVideoElement) {
    const nextMode = currentFacingMode.value === 'environment' ? 'user' : 'environment';
    await startCamera(videoElement, nextMode);
  }

  async function toggleTorch() {
    if (!videoTrack || !isTorchSupported.value) return;
    try {
      const nextState = !isTorchOn.value;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      isTorchOn.value = nextState;
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  }

  function captureFrame(videoElement: HTMLVideoElement): ImageData | null {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function stopCamera(videoElement?: HTMLVideoElement | null) {
    if (isTorchOn.value && videoTrack) {
      (videoTrack as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
      isTorchOn.value = false;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      mediaStream = null;
    }

    videoTrack = null;
    isStreaming.value = false;
    isTorchSupported.value = false;

    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  onUnmounted(() => {
    stopCamera();
  });

  return {
    isStreaming,
    isTorchSupported,
    isTorchOn,
    currentFacingMode,
    errorMessage,
    startCamera,
    stopCamera,
    toggleCamera,
    toggleTorch,
    captureFrame,
  };
}
