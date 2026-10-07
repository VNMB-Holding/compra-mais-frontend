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
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
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
      <div className={styles.left} />

      <main className={styles.right}>
        <div className={styles.logoWrapper}>
          <img src="/images/logo-compra-mais.svg" alt="Compra+" className={styles.logoImg} />
        </div>

        <section className={styles.card}>
          <button type="button" className={styles.backButton} onClick={() => router.push("/login")}>
            <Icon name="chevron-left" size={16} /> Voltar
          </button>

          <div className={styles.header}>
            <div>
              <h1>Reconhecimento facial</h1>
              <p>Posicione seu rosto no centro da câmera para entrar com sua identidade VNMB.</p>
            </div>
            <span className={cameraReady ? styles.statusReady : styles.statusWaiting}>
              <Icon name={cameraReady ? "check-circle" : "loader"} size={16} />
              {cameraReady ? "Câmera ativa" : "Aguardando câmera"}
            </span>
          </div>

          <div className={styles.cameraBox}>
            {cameraError ? (
              <div className={styles.cameraFallback}>
                <Icon name="camera-off" size={34} />
                <span>{cameraError}</span>
              </div>
            ) : (
              <>
                <video ref={videoRef} className={styles.video} playsInline muted />
                <div className={styles.faceFrame} aria-hidden="true" />
              </>
            )}
          </div>

          <div className={styles.footer}>
            <div className={styles.hint}>
              <Icon name="shield-check" size={18} />
              <span>A validação será enviada para a API VNMB Identity.</span>
            </div>

            <Button
              type="button"
              variant="primary"
              className={styles.captureButton}
              onClick={handleCapture}
              loading={isLoading}
              loadingText="Validando rosto..."
              disabled={!cameraReady || Boolean(cameraError)}
            >
              <Icon name="scan" size={18} /> Entrar
            </Button>
          </div>

          {authError && <div className={styles.errorMessage}>{authError}</div>}

          <canvas ref={canvasRef} className={styles.canvas} />
        </section>
      </main>
    </div>
  );
}
