import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import api from "../api/apiClient";
import ClassroomUI from "../components/live/ClassroomUI";

const cacheKey = (id) => `livekit_session_${id}`;

function readCache(id) {
  try {
    const raw = sessionStorage.getItem(cacheKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const payload = JSON.parse(atob(parsed.token.split(".")[1]));
    if (payload.exp * 1000 > Date.now() + 30_000) return parsed;
    sessionStorage.removeItem(cacheKey(id));
    return null;
  } catch {
    sessionStorage.removeItem(cacheKey(id));
    return null;
  }
}

export default function TeacherLiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const joiningRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    if (joiningRef.current) return;
    joiningRef.current = true;

    const join = async () => {
      // Reuse cached token on refresh — teacher stays in session
      const cached = readCache(id);
      if (cached) {
        setSessionData(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.post(`/livestream/sessions/${id}/join/`);
        sessionStorage.setItem(cacheKey(id), JSON.stringify(res.data));
        setSessionData(res.data);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.detail || "Unable to join session.");
      } finally {
        setLoading(false);
      }
    };

    join();
  }, [id]);

  // Called when teacher intentionally leaves — clears cache
  const handleLeave = () => {
    sessionStorage.removeItem(cacheKey(id));
    navigate(-1);
  };

  if (loading) return <div style={{ padding: 20 }}>Connecting...</div>;

  if (error || !sessionData?.token) {
    return (
      <div style={{ padding: 20 }}>
        <p>{error || "Session unavailable"}</p>
        <button onClick={() => {
          sessionStorage.removeItem(cacheKey(id));
          joiningRef.current = false;
          window.location.reload();
        }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={sessionData.livekit_url}
      token={sessionData.token}
      connect={true}
      video
      audio
    >
      <ClassroomUI
        role={sessionData.role}
        sessionId={id}
        onLeave={handleLeave}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
