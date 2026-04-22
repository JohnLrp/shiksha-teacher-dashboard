import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import * as privateSession from "../api/privateSessionService";
import "../styles/privateSessions.css";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00","15","30","45"];

/* ── Parse date string → { month, day, year } ── */
function parseReqDate(str) {
  if (!str) return null;
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const parts = str.trim().split(" ");
  const monStr = parts.length >= 3 ? parts[1] : parts[0];
  const dayStr = parts.length >= 3 ? parts[2] : parts[1];
  const month = months[monStr?.replace(",","")];
  const day = parseInt(dayStr);
  const year = new Date().getFullYear();
  if (month === undefined || isNaN(day)) return null;
  return { year, month, day };
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR PICKER
═══════════════════════════════════════════════════════════ */
function CalendarPicker({ selectedDate, onSelect, originalDate }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(selectedDate?.year  || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.month || today.getMonth());
  const orig = parseReqDate(originalDate);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isOriginal = (d) => orig && orig.year === viewYear && orig.month === viewMonth && orig.day === d;
  const isSelected = (d) => selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
  const isPast = (d) => {
    const date = new Date(viewYear, viewMonth, d); date.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return date < t;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="tps__calPopup">
      <div className="tps__calHeader">
        <button className="tps__calNav" onClick={prevMonth}>‹</button>
        <span className="tps__calLabel">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="tps__calNav" onClick={nextMonth}>›</button>
      </div>
      <div className="tps__calDayLabels">
        {DAY_LABELS.map(d => <div key={d} className="tps__calDayLabel">{d}</div>)}
      </div>
      <div className="tps__calGrid">
        {cells.map((d, i) => (
          <div
            key={i}
            className={[
              "tps__calCell",
              !d ? "tps__calEmpty" : "",
              d && isPast(d) ? "tps__calPast" : "",
              d && isOriginal(d) ? "tps__calOriginal" : "",
              d && isSelected(d) ? "tps__calSelected" : "",
            ].join(" ")}
            onClick={() => d && !isPast(d) && onSelect({ year: viewYear, month: viewMonth, day: d })}
          >
            {d || ""}
          </div>
        ))}
      </div>
      <div className="tps__calLegend">
        <span className="tps__calDot tps__calDot--orig" /> Student&apos;s date
        <span className="tps__calDot tps__calDot--new" style={{ marginLeft: 12 }} /> New date
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TIME PICKER
═══════════════════════════════════════════════════════════ */
function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(value?.hour || 2);
  const [minute, setMinute] = useState(value?.minute || "00");
  const [period, setPeriod] = useState(value?.period || "PM");
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const apply = (h, m, p) => {
    setHour(h); setMinute(m); setPeriod(p);
    onChange({ hour: h, minute: m, period: p, display: `${h}:${m} ${p}` });
  };

  const displayVal = value?.display || `${hour}:${minute} ${period}`;

  return (
    <div className="tps__timeWrap" ref={ref}>
      <div className="tps__timeTrigger" onClick={() => setOpen(!open)}>
        <span>🕐</span>
        <span>{displayVal}</span>
      </div>
      {open && (
        <div className="tps__timePopup">
          <div className="tps__timeTitle">Select Time</div>
          <div className="tps__timeBody">
            <div className="tps__timeCol">
              <div className="tps__timeColLabel">Hour</div>
              <div className="tps__timeScroll">
                {HOURS.map(h => (
                  <div key={h} className={`tps__timeOpt ${hour === h ? "selected" : ""}`} onClick={() => apply(h, minute, period)}>{h}</div>
                ))}
              </div>
            </div>
            <div className="tps__timeCol">
              <div className="tps__timeColLabel">Min</div>
              <div className="tps__timeScroll">
                {MINUTES.map(m => (
                  <div key={m} className={`tps__timeOpt ${minute === m ? "selected" : ""}`} onClick={() => apply(hour, m, period)}>{m}</div>
                ))}
              </div>
            </div>
            <div className="tps__timeCol">
              <div className="tps__timeColLabel">AM/PM</div>
              <div className="tps__timeScroll">
                {["AM","PM"].map(p => (
                  <div key={p} className={`tps__timeOpt ${period === p ? "selected" : ""}`} onClick={() => apply(hour, minute, p)}>{p}</div>
                ))}
              </div>
            </div>
          </div>
          <button className="tps__timeDone" onClick={() => setOpen(false)}>Done</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function PrivateRequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // Get request data from navigation state or fallback
  const req = location.state?.request;

  const [view, setView] = useState("detail");
  const [showCal, setShowCal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [reschedDur, setReschedDur] = useState("60 min");
  const [reschedNote, setReschedNote] = useState("");
  const [error, setError] = useState("");
  const calRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!req) {
    return (
      <div style={{ padding: 20 }}>
        <p>Request not found.</p>
        <button onClick={() => navigate("/teacher/private-sessions")}>← Back</button>
      </div>
    );
  }

  const handleAccept = async () => {
    await privateSession.acceptRequest(req.id);
    alert("✅ Session accepted! The student has been notified.");
    navigate("/teacher/private-sessions");
  };

  const handleDecline = async () => {
    await privateSession.declineRequest(req.id);
    alert("❌ Session declined. The student has been notified.");
    navigate("/teacher/private-sessions");
  };

  const handleSendReschedule = async () => {
    if (!selectedDate) { setError("Please select a new date."); return; }
    if (!selectedTime) { setError("Please select a new time."); return; }
    setError("");
    const dateStr = `${MONTH_NAMES[selectedDate.month].slice(0,3)} ${selectedDate.day}, ${selectedDate.year}`;
    await privateSession.rescheduleRequest(req.id, {
      new_date: dateStr,
      new_time: selectedTime.display,
      duration: reschedDur,
      note: reschedNote,
    });
    alert("🔁 Reschedule request sent! The student must confirm the new time.");
    navigate("/teacher/private-sessions");
  };

  const formatSelectedDate = (d) => d ? `${MONTH_NAMES[d.month].slice(0,3)} ${d.day}, ${d.year}` : "Select date";

  const goBack = () => {
    if (view === "reschedule") setView("detail");
    else navigate("/teacher/private-sessions");
  };

  return (
    <div className="tps__page">
      <div className="tps__headerBox">
        <button className="tps__backBtn" onClick={goBack}>← Back</button>
      </div>

      <div className="tps__bodyBox">
        <div className="tps__detailCard">
          <div className="tps__detailCardTitle">Private Session Request</div>
          <div className="tps__detailDivider" />

          {/* ── DETAIL VIEW ── */}
          {view === "detail" && (
            <>
              <div className="tps__detailGroupTitle">{req.course} – {req.subject} – Group ({req.students.length})</div>
              <div className="tps__detailGroupSub">
                Requested by <strong>{req.requestedBy}</strong>
                {req.students.length > 1 && ` & ${req.students.length - 1} other${req.students.length - 1 !== 1 ? "s" : ""}`}
                <span className="tps__detailAgo"> · {req.submittedAgo}</span>
              </div>

              <div className="tps__detailTiming">
                <div className="tps__timingBox"><div className="tps__timingLabel">Date</div><div className="tps__timingVal">{req.date}</div></div>
                <div className="tps__timingBox"><div className="tps__timingLabel">Time</div><div className="tps__timingVal">{req.time}</div></div>
                <div className="tps__timingBox"><div className="tps__timingLabel">Duration</div><div className="tps__timingVal">{req.duration}</div></div>
              </div>

              {req.note && <div className="tps__studentNote"><strong>Student note –</strong> {req.note}</div>}

              <div className="tps__studentsLabel">Students ({req.students.length})</div>
              <div className="tps__studentsGrid">
                {req.students.map((s, i) => (
                  <div key={i} className="tps__studentChip">
                    <div className="tps__studentChipAvatar">
                      {s.name.split(" ").map(w => w[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <div className="tps__studentChipName">{s.name}</div>
                      <div className="tps__studentChipId">
                        {s.id}
                        {s.id === req.requestedById && <span className="tps__requesterTag"> · requester</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="tps__detailActions">
                <button className="tps__btnAccept" onClick={handleAccept}>Accept</button>
                <button className="tps__btnDecline" onClick={handleDecline}>Decline</button>
                <button className="tps__btnReschedule" onClick={() => setView("reschedule")}>Reschedule</button>
              </div>
            </>
          )}

          {/* ── RESCHEDULE VIEW ── */}
          {view === "reschedule" && (
            <>
              <div className="tps__reschedTitle">Reschedule</div>
              <div className="tps__reschedSub">Proposing a new time will notify the student to re-confirm</div>

              <div className="tps__reschedPickers">
                {/* Date */}
                <div className="tps__reschedBlock" ref={calRef}>
                  <div className="tps__reschedLabel">Date</div>
                  <div
                    className={`tps__reschedTrigger ${selectedDate ? "has-value" : ""}`}
                    onClick={() => setShowCal(!showCal)}
                  >
                    <span>📅</span>
                    <span>{formatSelectedDate(selectedDate)}</span>
                  </div>
                  {showCal && (
                    <CalendarPicker
                      selectedDate={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setShowCal(false); }}
                      originalDate={req.date}
                    />
                  )}
                </div>

                {/* Time */}
                <div className="tps__reschedBlock">
                  <div className="tps__reschedLabel">Time</div>
                  <TimePicker value={selectedTime} onChange={setSelectedTime} />
                </div>

                {/* Duration */}
                <div className="tps__reschedBlock">
                  <div className="tps__reschedLabel">Duration</div>
                  <select className="tps__reschedSelect" value={reschedDur} onChange={(e) => setReschedDur(e.target.value)}>
                    <option>30 min</option>
                    <option>60 min</option>
                    <option>90 min</option>
                    <option>180 min</option>
                    <option>Indefinite</option>
                  </select>
                </div>
              </div>

              <div className="tps__reschedNoteLabel">Additional Note (Optional)</div>
              <textarea
                className="tps__reschedTextarea"
                placeholder="Anything you'd like the students to know..."
                value={reschedNote}
                onChange={(e) => setReschedNote(e.target.value)}
              />

              {error && <p className="tps__error">⚠️ {error}</p>}
              <button className="tps__btnSendResched" onClick={handleSendReschedule}>Send reschedule request</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}