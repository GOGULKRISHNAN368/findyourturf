import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Home,
  Check,
  Minus,
  Plus,
  Zap,
  Users,
  Wallet,
  Smartphone,
  CreditCard,
  Camera,
  Video,
  Dumbbell,
  Star,
} from "lucide-react";
import {
  createBooking,
  getAddons,
  getAddonAvailabilityBatch,
  getBookingQuote,
} from "../services/api";
import { getProfile, saveProfile, addLocalBooking } from "../services/profile";
import { getTurfImage } from "../utils/sportsImages";
import Navbar from "../components/Navbar";

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", Icon: Smartphone, hint: "GPay / PhonePe / Paytm" },
  { id: "Card", label: "Card", Icon: CreditCard, hint: "Credit / Debit" },
  { id: "Venue", label: "Pay at Venue", Icon: Wallet, hint: "Cash on arrival" },
];

const ADDON_META = {
  photography: { icon: Camera, title: "Photography", emoji: "📸" },
  videography: { icon: Video, title: "Videography", emoji: "🎥" },
  coach: { icon: Users, title: "Coach", emoji: "🏃" },
  equipment: { icon: Dumbbell, title: "Sports Equipment", emoji: "🏏" },
};

// Prices come straight from the DB-fetched service objects — nothing hard-coded.
function computePrice(turf, { players, useFloodlight, equipmentNames, addonLines }) {
  const hours = Math.max(1, (turf.slotDurationMinutes || 60) / 60);
  const base = Math.round((turf.pricePerHour || 0) * hours);
  const floodlightAmount = useFloodlight
    ? Math.round((turf.floodlightChargePerHour || 0) * hours)
    : 0;

  const catalogue = turf.equipment || [];
  let equipmentAmount = 0;
  const equipmentSelected = [];
  (equipmentNames || []).forEach((name) => {
    const item = catalogue.find((e) => e.name === name);
    if (item) {
      equipmentAmount += item.rentalCharge || 0;
      equipmentSelected.push({ label: item.name, amount: item.rentalCharge || 0 });
    }
  });

  const addonsAmount = (addonLines || []).reduce((s, l) => s + (l.lineTotal || 0), 0);
  const total = base + floodlightAmount + equipmentAmount + addonsAmount;
  const safePlayers = Math.max(1, players);
  return {
    hours,
    base,
    floodlightAmount,
    equipmentAmount,
    equipmentSelected,
    addonsAmount,
    total,
    perPerson: Math.ceil(total / safePlayers),
  };
}

function AddonPickCard({ service, selected, disabled, reason, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle()}
      style={{
        width: "100%",
        display: "flex",
        gap: 10,
        alignItems: "stretch",
        padding: 10,
        textAlign: "left",
        borderRadius: 12,
        border: `1.5px solid ${selected ? "var(--primary)" : "var(--border-default, #e5e7eb)"}`,
        background: selected ? "rgba(64,88,245,0.06)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {service.image ? (
        <img
          src={service.image}
          alt=""
          style={{ width: 62, height: 62, borderRadius: 8, objectFit: "cover", flex: "0 0 auto" }}
        />
      ) : null}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
          <strong style={{ fontSize: "0.92rem" }}>{service.name}</strong>
          <strong style={{ whiteSpace: "nowrap" }}>
            ₹{service.price}
            {service.priceUnit ? <span style={{ fontWeight: 400, fontSize: "0.75rem" }}> / {service.priceUnit}</span> : null}
          </strong>
        </span>
        <span style={{ display: "block", fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: 2 }}>
          {service.sport ? `${service.sport} · ` : ""}
          {service.experienceYears != null ? `${service.experienceYears} yrs exp · ` : ""}
          {service.durationLabel || service.specialization || service.packageDetails || service.description || ""}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: "0.74rem" }}>
          {service.rating != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "#b45309" }}>
              <Star size={11} fill="#f59e0b" color="#f59e0b" /> {service.rating}
            </span>
          )}
          {disabled ? (
            <span style={{ color: "#b91c1c", fontWeight: 600 }}>{reason || "Not available for this slot"}</span>
          ) : selected ? (
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>Added</span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Tap to add</span>
          )}
        </span>
      </span>
      <span
        style={{
          alignSelf: "center",
          width: 20,
          height: 20,
          flex: "0 0 auto",
          borderRadius: "50%",
          border: "2px solid",
          borderColor: selected ? "var(--primary)" : "#cbd5e1",
          background: selected ? "var(--primary)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <Check size={12} color="#fff" />}
      </span>
    </button>
  );
}

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const turf = state?.turf;
  const startMinutes = state?.startMinutes ?? 0;
  const isEveningSlot = startMinutes >= 18 * 60;

  const [players, setPlayers] = useState(10);
  const [useFloodlight, setUseFloodlight] = useState(
    Boolean(turf?.floodlightChargePerHour) && isEveningSlot
  );
  const [equipmentNames, setEquipmentNames] = useState([]);
  const [payMode, setPayMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("");

  // --- Add-ons ---
  const [addonsByType, setAddonsByType] = useState({ photography: [], videography: [], coach: [], equipment: [] });
  const [addonAvail, setAddonAvail] = useState({}); // serviceId -> {available, remaining, reason}
  const [pick, setPick] = useState({ photography: null, videography: null, coach: null }); // serviceId
  const [equipQty, setEquipQty] = useState({}); // serviceId -> qty

  const [profile, setProfile] = useState(() => getProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(() => !getProfile());
  const [profileForm, setProfileForm] = useState(() => ({
    name: getProfile()?.name || "",
    phone: getProfile()?.phone || "",
    email: getProfile()?.email || "",
  }));

  const dateStr = state?.date;
  const slotStr = state?.slot;

  useEffect(() => {
    if (!turf) return;
    let active = true;
    (async () => {
      const list = await getAddons({ turfSports: turf.sports || [] });
      if (!active) return;
      const grouped = { photography: [], videography: [], coach: [], equipment: [] };
      list.forEach((s) => grouped[s.type] && grouped[s.type].push(s));
      setAddonsByType(grouped);
      if (dateStr && slotStr) {
        const avail = await getAddonAvailabilityBatch({ date: dateStr, startTime: slotStr });
        if (active) setAddonAvail(avail || {});
      }
    })();
    return () => {
      active = false;
    };
  }, [turf, dateStr, slotStr]);

  // Selected add-on line items (priced from the DB service objects).
  const addonLines = useMemo(() => {
    const lines = [];
    const flat = [
      ...addonsByType.photography,
      ...addonsByType.videography,
      ...addonsByType.coach,
      ...addonsByType.equipment,
    ];
    const byId = Object.fromEntries(flat.map((s) => [s._id, s]));

    ["photography", "videography", "coach"].forEach((t) => {
      const id = pick[t];
      const s = id && byId[id];
      if (s) lines.push({ serviceId: s._id, type: t, name: s.name, unitPrice: s.price, quantity: 1, lineTotal: s.price });
    });
    Object.entries(equipQty).forEach(([id, qty]) => {
      const s = byId[id];
      if (s && qty > 0) lines.push({ serviceId: id, type: "equipment", name: s.name, unitPrice: s.price, quantity: qty, lineTotal: s.price * qty });
    });
    return lines;
  }, [addonsByType, pick, equipQty]);

  const price = useMemo(
    () => (turf ? computePrice(turf, { players, useFloodlight, equipmentNames, addonLines }) : null),
    [turf, players, useFloodlight, equipmentNames, addonLines]
  );

  if (!state || !turf) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ padding: "60px 16px", textAlign: "center" }}>
            <h2>Invalid Booking Session</h2>
            <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
              Please select a turf and time slot before proceeding to checkout.
            </p>
            <button className="fyt-btn-primary" onClick={() => navigate("/turfs")}>
              Browse Turfs
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { date, slot, endSlot } = state;
  const turfImage = getTurfImage(turf, 0);
  const prettyDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const togglePick = (type, id) =>
    setPick((p) => ({ ...p, [type]: p[type] === id ? null : id }));

  const setQty = (id, qty, max) =>
    setEquipQty((q) => {
      const next = { ...q };
      const v = Math.max(0, Math.min(max ?? 20, qty));
      if (v === 0) delete next[id];
      else next[id] = v;
      return next;
    });

  const addonPayload = addonLines.map((l) => ({ serviceId: l.serviceId, quantity: l.quantity }));

  const handleSaveProfileInline = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setError("Name and 10-digit mobile number are required.");
      return;
    }
    if (!/^\d{10}$/.test(profileForm.phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    const saved = saveProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
    });
    setProfile(saved);
    setIsEditingProfile(false);
    setError("");
  };

  const startPayment = async () => {
    if (!profile || !profile.name || !profile.phone) {
      setIsEditingProfile(true);
      setError("Please add your name and phone number first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Server confirms the total + re-checks add-on availability before pay.
      const q = await getBookingQuote({
        turf: turf._id,
        players,
        useFloodlight,
        equipment: equipmentNames,
        addons: addonPayload,
        date,
        startTime: slot,
      });
      if (q && q.totalAmount != null) {
        setConfirmed({ serverTotal: q.totalAmount, serverPerPerson: q.perPersonAmount });
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || "One of your add-ons is no longer available. Please adjust and retry.");
      return;
    }
    setLoading(false);
    setPayMode(true);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  };

  const handlePay = async () => {
    if (paymentMethod === "UPI" && upiId && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      setError("Enter a valid UPI ID (e.g. name@okhdfc) or leave it blank.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await new Promise((r) => setTimeout(r, 1400)); // simulated gateway

      const res = await createBooking({
        turf: turf._id,
        bookingDate: date,
        startTime: slot,
        endTime: endSlot || slot,
        players,
        useFloodlight,
        equipment: equipmentNames,
        addons: addonPayload,
        paymentMethod,
        contact: { name: profile.name, phone: profile.phone, email: profile.email },
        status: "Confirmed",
      });

      const booking = res.booking || {};
      addLocalBooking({
        bookingId: booking._id,
        turfId: turf._id,
        turfName: turf.name,
        turfLocation: turf.location,
        date,
        slot,
        endSlot: endSlot || slot,
        players: booking.players || players,
        perPersonAmount: booking.perPersonAmount ?? price.perPerson,
        baseAmount: booking.baseAmount ?? price.base,
        floodlightAmount: booking.floodlightAmount ?? price.floodlightAmount,
        addonsAmount: booking.addonsAmount ?? price.addonsAmount,
        totalAmount: booking.totalAmount ?? price.total,
        addons: addonLines.map((l) => ({ name: l.name, quantity: l.quantity, lineTotal: l.lineTotal })),
        status: "Confirmed",
        bookedBy: profile.name,
        phone: profile.phone,
        paymentMethod,
      });

      setConfirmed({
        total: booking.totalAmount ?? price.total,
        perPerson: booking.perPersonAmount ?? price.perPerson,
        players: booking.players || players,
        addons: addonLines,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.status === 409
          ? err.message || "That slot / add-on was just taken. Please go back and adjust."
          : err.message || "Payment could not be completed. Please try again."
      );
      setPayMode(true);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SUCCESS ----------------
  if (success && confirmed) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ maxWidth: 640, padding: "40px 16px" }}>
            <div className="fyt-success-screen">
              <div className="fyt-success-icon-badge">
                <CheckCircle2 size={48} />
              </div>
              <span className="fyt-success-badge-pill">
                <Sparkles size={14} /> Booking Confirmed
              </span>
              <h1 className="fyt-success-title">Get Ready to Play!</h1>
              <p className="fyt-success-subtitle">
                Your slot at <strong>{turf.name}</strong> is locked in. Confirmation sent to{" "}
                <strong>+91 {profile?.phone}</strong>.
              </p>

              <div className="fyt-receipt-card">
                <div className="fyt-receipt-header">
                  <img src={turfImage} alt={turf.name} className="fyt-receipt-thumb" />
                  <div>
                    <h3 className="fyt-receipt-turf-name">{turf.name}</h3>
                    <div className="fyt-receipt-loc">
                      <MapPin size={13} /> <span>{turf.address || `${turf.location}, Coimbatore`}</span>
                    </div>
                  </div>
                </div>

                <div className="fyt-receipt-divider" />

                <div className="fyt-receipt-grid">
                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Play Date</span>
                    <strong className="fyt-receipt-val">{prettyDate}</strong>
                  </div>
                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Time Slot</span>
                    <strong className="fyt-receipt-val">{endSlot ? `${slot} – ${endSlot}` : slot}</strong>
                  </div>
                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Players</span>
                    <strong className="fyt-receipt-val">{confirmed.players}</strong>
                  </div>
                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Total Paid</span>
                    <strong className="fyt-receipt-val" style={{ color: "var(--primary)" }}>
                      ₹{confirmed.total}
                    </strong>
                  </div>
                </div>

                {(confirmed.addons || []).length > 0 && (
                  <div style={{ padding: "10px 14px", fontSize: "0.82rem" }}>
                    <strong>Add-ons: </strong>
                    {confirmed.addons.map((a) => `${a.name}${a.quantity > 1 ? ` ×${a.quantity}` : ""}`).join(", ")}
                  </div>
                )}

                <div
                  className="fyt-receipt-status-banner"
                  style={{ background: "#ecfdf5", color: "#047857", justifyContent: "center", fontWeight: 700 }}
                >
                  <Users size={15} />
                  <span>
                    Split {confirmed.players} ways · <strong>₹{confirmed.perPerson} per person</strong>
                  </span>
                </div>

                <div className="fyt-receipt-status-banner">
                  <span className="fyt-confirmed-dot" />
                  <span>
                    Status: <strong>Confirmed &amp; Paid ({paymentMethod})</strong>
                  </span>
                </div>
              </div>

              <div className="fyt-success-actions">
                <button className="fyt-btn-primary" onClick={() => navigate("/profile")} style={{ width: "100%" }}>
                  View in My Bookings
                </button>
                <button
                  className="fyt-btn-secondary"
                  onClick={() => navigate("/turfs")}
                  style={{ width: "100%", marginTop: 10 }}
                >
                  <Home size={16} /> <span>Book Another Turf</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------- CHECKOUT ----------------
  const renderPicker = (type) => {
    const items = addonsByType[type] || [];
    if (!items.length) return null;
    const meta = ADDON_META[type];
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.9rem" }}>
          <span>{meta.emoji}</span> {meta.title}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((s) => {
            const av = addonAvail[s._id];
            const unavailable = av && av.available === false;
            return (
              <AddonPickCard
                key={s._id}
                service={s}
                selected={pick[type] === s._id}
                disabled={unavailable}
                reason={av?.reason}
                onToggle={() => togglePick(type, s._id)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const equipItems = addonsByType.equipment || [];

  return (
    <div className="fyt-app-shell fyt-has-sticky-cta">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 100 }}>
        <div className="fyt-container" style={{ maxWidth: 900 }}>
          <div className="fyt-td-nav-bar">
            <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
              <ArrowLeft size={18} />
              <span>Back to Details</span>
            </button>
            <h2 className="fyt-checkout-header-title">Add-ons &amp; Split Payment</h2>
          </div>

          <div className="fyt-checkout-grid">
            {/* LEFT */}
            <div className="fyt-checkout-left">
              {/* Venue summary */}
              <div className="fyt-card fyt-checkout-venue-card">
                <div className="fyt-cvc-header">
                  <img src={turfImage} alt={turf.name} className="fyt-cvc-img" />
                  <div className="fyt-cvc-info">
                    <span className="fyt-badge-tag">{(turf.sports && turf.sports[0]) || turf.sportType || "Turf"}</span>
                    <h3 className="fyt-cvc-name">{turf.name}</h3>
                    <div className="fyt-cvc-loc">
                      <MapPin size={14} className="fyt-loc-pin" />
                      <span>{turf.address || `${turf.location}, Coimbatore`}</span>
                    </div>
                  </div>
                </div>
                <div className="fyt-cvc-details-grid">
                  <div className="fyt-cvc-item">
                    <span className="fyt-cvc-label"><Calendar size={13} /> Date</span>
                    <strong className="fyt-cvc-val">{prettyDate}</strong>
                  </div>
                  <div className="fyt-cvc-item">
                    <span className="fyt-cvc-label"><Clock size={13} /> Slot</span>
                    <strong className="fyt-cvc-val">{endSlot ? `${slot} – ${endSlot}` : slot}</strong>
                  </div>
                </div>
              </div>

              {/* Players */}
              <div className="fyt-card">
                <div className="fyt-card-head">
                  <div className="fyt-card-head-title">
                    <Users size={18} />
                    <h3>How many players are coming?</h3>
                  </div>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 12px" }}>
                  The total (turf + add-ons) is split equally between everyone.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button className="fyt-action-circle" onClick={() => setPlayers((p) => Math.max(1, p - 1))} aria-label="Fewer players">
                    <Minus size={18} />
                  </button>
                  <strong style={{ fontSize: "1.8rem", minWidth: 48, textAlign: "center" }}>{players}</strong>
                  <button className="fyt-action-circle" onClick={() => setPlayers((p) => Math.min(40, p + 1))} aria-label="More players">
                    <Plus size={18} />
                  </button>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Per person</span>
                    <strong style={{ fontSize: "1.15rem", color: "var(--primary)" }}>₹{price.perPerson}</strong>
                  </div>
                </div>
              </div>

              {/* Turf add-ons: floodlight */}
              {turf.floodlightChargePerHour > 0 && (
                <div className="fyt-card">
                  <div className="fyt-card-head">
                    <div className="fyt-card-head-title">
                      <Zap size={18} />
                      <h3>Floodlights</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setUseFloodlight((v) => !v)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      border: `1.5px solid ${useFloodlight ? "var(--primary)" : "var(--border-default, #e5e7eb)"}`,
                      background: useFloodlight ? "rgba(64,88,245,0.06)" : "transparent",
                      borderRadius: 12,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ textAlign: "left" }}>
                      <strong style={{ display: "block" }}>Add floodlights</strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {isEveningSlot ? "Recommended for this evening slot" : "For night visibility"}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>+₹{Math.round(turf.floodlightChargePerHour * price.hours)}</strong>
                      <span
                        style={{
                          width: 18, height: 18, borderRadius: "50%", border: "2px solid",
                          borderColor: useFloodlight ? "var(--primary)" : "#cbd5e1",
                          background: useFloodlight ? "var(--primary)" : "transparent",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        {useFloodlight && <Check size={11} color="#fff" />}
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {/* Venue equipment (turf-provided) */}
              {(turf.equipment || []).length > 0 && (
                <div className="fyt-card">
                  <div className="fyt-card-head">
                    <div className="fyt-card-head-title">
                      <Dumbbell size={18} />
                      <h3>Venue Equipment</h3>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {turf.equipment.map((eq, idx) => {
                      const on = equipmentNames.includes(eq.name);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setEquipmentNames((cur) =>
                              cur.includes(eq.name) ? cur.filter((n) => n !== eq.name) : [...cur, eq.name]
                            )
                          }
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 12px",
                            border: `1.5px solid ${on ? "var(--primary)" : "var(--border-default, #e5e7eb)"}`,
                            background: on ? "rgba(64,88,245,0.06)" : "transparent",
                            borderRadius: 10, cursor: "pointer",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Dumbbell size={15} className="fyt-loc-pin" /> {eq.name}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <strong style={{ color: eq.rentalCharge > 0 ? "inherit" : "#16a34a" }}>
                              {eq.rentalCharge > 0 ? `+₹${eq.rentalCharge}` : "Free"}
                            </strong>
                            <span
                              style={{
                                width: 16, height: 16, borderRadius: 5, border: "2px solid",
                                borderColor: on ? "var(--primary)" : "#cbd5e1",
                                background: on ? "var(--primary)" : "transparent",
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                              }}
                            >
                              {on && <Check size={10} color="#fff" />}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Session Add-ons */}
              <div className="fyt-card">
                <div className="fyt-card-head">
                  <div className="fyt-card-head-title">
                    <Sparkles size={18} />
                    <h3>Session Add-ons</h3>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Optional</span>
                </div>

                {renderPicker("photography")}
                {renderPicker("videography")}
                {renderPicker("coach")}

                {equipItems.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: "0.9rem" }}>
                      <span>🏏</span> Sports Equipment
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {equipItems.map((s) => {
                        const av = addonAvail[s._id];
                        const remaining = av && av.remaining != null ? av.remaining : s.stock;
                        const qty = equipQty[s._id] || 0;
                        const outOfStock = remaining <= 0 && qty === 0;
                        return (
                          <div
                            key={s._id}
                            style={{
                              display: "flex", alignItems: "center", gap: 10, padding: 10,
                              border: `1.5px solid ${qty > 0 ? "var(--primary)" : "var(--border-default, #e5e7eb)"}`,
                              borderRadius: 10,
                              background: qty > 0 ? "rgba(64,88,245,0.06)" : "transparent",
                              opacity: outOfStock ? 0.5 : 1,
                            }}
                          >
                            {s.image ? (
                              <img src={s.image} alt="" style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", flex: "0 0 auto" }} />
                            ) : null}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ fontSize: "0.88rem" }}>{s.name}</strong>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                ₹{s.price}{s.priceUnit ? ` / ${s.priceUnit}` : ""} ·{" "}
                                {outOfStock ? <span style={{ color: "#b91c1c" }}>Out of stock this slot</span> : `${remaining} available`}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                              <button
                                type="button"
                                className="fyt-action-circle"
                                style={{ width: 30, height: 30 }}
                                onClick={() => setQty(s._id, qty - 1, remaining)}
                                disabled={qty === 0}
                                aria-label={`Fewer ${s.name}`}
                              >
                                <Minus size={14} />
                              </button>
                              <strong style={{ minWidth: 18, textAlign: "center" }}>{qty}</strong>
                              <button
                                type="button"
                                className="fyt-action-circle"
                                style={{ width: 30, height: 30 }}
                                onClick={() => setQty(s._id, qty + 1, remaining)}
                                disabled={qty >= remaining}
                                aria-label={`More ${s.name}`}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!addonsByType.photography.length &&
                  !addonsByType.videography.length &&
                  !addonsByType.coach.length &&
                  !equipItems.length && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "10px 0 0" }}>
                      No add-on services available for this turf right now.
                    </p>
                  )}
              </div>

              {/* Player info */}
              <div className="fyt-card fyt-customer-card">
                <div className="fyt-card-head">
                  <div className="fyt-card-head-title">
                    <User size={18} />
                    <h3>Your Details</h3>
                  </div>
                  {profile && !isEditingProfile && (
                    <button className="fyt-edit-link" onClick={() => setIsEditingProfile(true)}>Change</button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfileInline} className="fyt-inline-form">
                    <div className="fyt-form-group">
                      <label>Full Name *</label>
                      <input type="text" placeholder="e.g. Rahul Sharma" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="fyt-input" required />
                    </div>
                    <div className="fyt-form-group">
                      <label>10-Digit Mobile Number *</label>
                      <input type="tel" placeholder="e.g. 9876543210" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="fyt-input" required />
                    </div>
                    <div className="fyt-form-group">
                      <label>Email (optional)</label>
                      <input type="email" placeholder="e.g. rahul@example.com" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="fyt-input" />
                    </div>
                    <button type="submit" className="fyt-btn-primary" style={{ marginTop: 8 }}>Save Details</button>
                  </form>
                ) : (
                  <div className="fyt-saved-profile-box">
                    <div className="fyt-sp-row"><span className="fyt-sp-label">Name:</span><strong>{profile.name}</strong></div>
                    <div className="fyt-sp-row"><span className="fyt-sp-label">Contact:</span><strong>+91 {profile.phone}</strong></div>
                    {profile.email && <div className="fyt-sp-row"><span className="fyt-sp-label">Email:</span><span>{profile.email}</span></div>}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: breakdown + payment */}
            <div className="fyt-checkout-right">
              <div className="fyt-card fyt-price-breakdown-card">
                <h3 className="fyt-pbc-title">Price Breakdown</h3>

                <div className="fyt-price-line">
                  <span>Turf Booking ({price.hours} hr)</span>
                  <strong>₹{price.base}</strong>
                </div>

                {price.floodlightAmount > 0 && (
                  <div className="fyt-price-line">
                    <span><Zap size={13} style={{ verticalAlign: "middle" }} /> Floodlight</span>
                    <strong>₹{price.floodlightAmount}</strong>
                  </div>
                )}

                {price.equipmentSelected.map((it) => (
                  <div className="fyt-price-line" key={it.label}>
                    <span>{it.label}</span>
                    <strong>{it.amount > 0 ? `₹${it.amount}` : "Free"}</strong>
                  </div>
                ))}

                {addonLines.map((l) => (
                  <div className="fyt-price-line" key={l.serviceId}>
                    <span>
                      {ADDON_META[l.type]?.emoji} {l.name}
                      {l.quantity > 1 ? ` ×${l.quantity}` : ""}
                    </span>
                    <strong>₹{l.lineTotal}</strong>
                  </div>
                ))}

                <div className="fyt-price-line-total">
                  <span>Total</span>
                  <span className="fyt-price-total-val">₹{price.total}</span>
                </div>

                <div style={{ marginTop: 10, padding: "12px 14px", background: "#f5f3ff", borderRadius: 12, border: "1px solid #ddd6fe" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>Members</span>
                    <strong>{players}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>Each person pays</span>
                    <strong style={{ fontSize: "1.4rem", color: "var(--primary)" }}>₹{price.perPerson}</strong>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: "6px 0 0" }}>
                    ₹{price.total} ÷ {players} = ₹{price.perPerson} each
                  </p>
                </div>

                {error && <div className="fyt-error-banner" style={{ marginTop: 12 }}>{error}</div>}

                {!payMode ? (
                  <button className="fyt-btn-pay" onClick={startPayment} disabled={loading} style={{ marginTop: 14 }}>
                    {loading ? "Checking availability…" : `Proceed to Payment · ₹${price.total}`}
                  </button>
                ) : (
                  <div style={{ marginTop: 14 }}>
                    <span className="fyt-bp-label" style={{ marginBottom: 8, display: "block" }}>Choose payment method</span>
                    <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                      {PAYMENT_METHODS.map(({ id, label, Icon, hint }) => (
                        <button
                          key={id}
                          onClick={() => setPaymentMethod(id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                            border: `1.5px solid ${paymentMethod === id ? "var(--primary)" : "var(--border-default, #e5e7eb)"}`,
                            background: paymentMethod === id ? "rgba(64,88,245,0.06)" : "transparent",
                            borderRadius: 10, cursor: "pointer", textAlign: "left",
                          }}
                        >
                          <Icon size={18} color={paymentMethod === id ? "var(--primary)" : "currentColor"} />
                          <span>
                            <strong style={{ display: "block" }}>{label}</strong>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{hint}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    {paymentMethod === "UPI" && (
                      <div className="fyt-form-group">
                        <label>UPI ID (optional for this demo)</label>
                        <input type="text" className="fyt-input" placeholder="yourname@okhdfc" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                      </div>
                    )}

                    <button className="fyt-btn-pay" onClick={handlePay} disabled={loading} style={{ marginTop: 6 }}>
                      {loading ? "Processing payment…" : `Pay ₹${price.total} & Confirm`}
                    </button>
                    <button className="fyt-btn-secondary" onClick={() => setPayMode(false)} disabled={loading} style={{ width: "100%", marginTop: 8 }}>
                      Back to review
                    </button>
                  </div>
                )}

                <div className="fyt-checkout-guarantees">
                  <div className="fyt-cg-item"><ShieldCheck size={16} /> <span>Slot &amp; add-ons held on payment · No double booking</span></div>
                  <div className="fyt-cg-item"><Check size={16} /> <span>Free cancellation up to 4 hrs before play</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fyt-sticky-mobile-bottom">
        <div className="fyt-smb-info">
          <div className="fyt-smb-price">
            <strong>₹{price.total}</strong>
            <span>total</span>
          </div>
          <span className="fyt-smb-slot-indicator">
            <Users size={12} style={{ verticalAlign: "middle" }} /> {players} · ₹{price.perPerson}/person
          </span>
        </div>
        <button className="fyt-smb-btn" onClick={payMode ? handlePay : startPayment} disabled={loading}>
          {loading ? "…" : payMode ? `Pay ₹${price.total}` : "Proceed to Payment"}
        </button>
      </div>
    </div>
  );
}
