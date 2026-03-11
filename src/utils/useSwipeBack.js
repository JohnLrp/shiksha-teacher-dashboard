import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

export default function useSwipeBack() {
  const navigate = useNavigate();

  return useSwipeable({
    onSwipedRight: (eventData) => {
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) return;

      const startX = eventData.initial[0];
      const deltaX = eventData.deltaX;
      const deltaY = Math.abs(eventData.deltaY);

      if (startX < 30 && deltaX > 80 && deltaY < 60) {
        navigate(-1);
      }
    },
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
  });
}