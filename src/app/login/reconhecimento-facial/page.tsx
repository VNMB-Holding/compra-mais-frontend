"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Icon } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import styles from "./reconhecimento-facial.module.css";

export default function ReconhecimentoFacialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { faceLogin, isLoading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Este navegador não oferece suporte à câmera para reconhecimento facial.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setCameraError("Não foi possível acessar a câmera. Verifique a permissão do navegador.");
      }
    }

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return;

    setAuthError("");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.86);

    try {
      await faceLogin(image);
      const requested = searchParams.get("redirect");
      window.location.href = requested || "/dashboard";
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Não foi possível validar seu rosto. Tente novamente.",
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <button type="button" className={styles.backButton} onClick={() => router.push("/login")}>
          <Icon name="chevron-left" size={16} /> Voltar
        </button>

        <div className={styles.header}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logo} />
          <div className={styles.iconBadge}>
            <Icon name="face-id" size={28} />
          </div>
          <h1>Reconhecimento facial</h1>
          <p>Posicione seu rosto no centro da câmera para entrar com sua identidade VNMB.</p>
        </div>

        <div className={styles.cameraBox}>
          {cameraError ? (
            <div className={styles.cameraFallback}>
              <Icon name="camera-off" size={32} />
              <span>{cameraError}</span>
            </div>
          ) : (
            <>
              <video ref={videoRef} className={styles.video} playsInline muted />
              <div className={styles.faceFrame} aria-hidden="true" />
            </>
          )}
        </div>

        {authError && <div className={styles.errorMessage}>{authError}</div>}

        <Button
          type="button"
          variant="primary"
          className={styles.captureButton}
          onClick={handleCapture}
          loading={isLoading}
          loadingText="Validando rosto..."
          disabled={!cameraReady || Boolean(cameraError)}
        >
          <Icon name="scan" size={18} /> Entrar com reconhecimento facial
        </Button>

        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </div>
  );
}
