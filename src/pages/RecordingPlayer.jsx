import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/apiClient";

export default function RecordingPlayer() {

  const { recordingId, videoId } = useParams();
  const iframeRef = useRef(null);

  useEffect(() => {

    api
      .get(`/courses/recordings/${recordingId}/progress/`)
      .then(res => {

        const startTime = res.data.last_position || 0;

        iframeRef.current.src =
          `https://iframe.mediadelivery.net/embed/${import.meta.env.VITE_BUNNY_LIBRARY_ID || "615730"}/${videoId}?start=${Math.floor(startTime)}`;

      })
      .catch(() => {

        iframeRef.current.src =
          `https://iframe.mediadelivery.net/embed/${import.meta.env.VITE_BUNNY_LIBRARY_ID || "615730"}/${videoId}`;

      });

  }, [recordingId, videoId]);

  return (

    <div style={{ padding: "20px" }}>

      <iframe
        ref={iframeRef}
        width="100%"
        height="600"
        allow="autoplay; fullscreen"
        allowFullScreen
        style={{ border: "none", borderRadius: "10px" }}
      />

    </div>

  );

}