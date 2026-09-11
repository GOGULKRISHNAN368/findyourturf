import { useState, useEffect, useCallback, useMemo } from "react";
import { socket } from "../services/socket";
import Modal from "../components/common/Modal";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconMapPin,
  IconClock,
  IconCheck,
  IconX,
} from "../components/common/Icons";
import { getTurfs, createTurf, updateTurf, deleteTurf } from "../services/api";

const ROOF_TYPES = ["Not verified", "Open", "Closed", "Partial"];

const BLANK_FORM = {
  name: "",
  location: "",
  address: "",
  sports: "",
  pricePerHour: "",
  floodlightChargePerHour: "",
  roofType: "Not verified",
  openingTime: "",
  closingTime: "",
  slotDurationMinutes: 60,
  contactNumber: "",
  facilities: "",
  latitude: "",
  longitude: "",
  weatherLocation: "",
  description: "",
  status: "Active",
};

function money(v) {
  return v === null || v === undefined || v === "" ? "Not verified" : `₹${v}`;
}

function hours(t) {
  if (!t.openingTime && !t.closingTime) return "Not verified";
  return `${t.openingTime || "—"} – ${t.closingTime || "—"}`;
}

function toForm(turf) {
  return {
    name: turf.name || "",
    location: turf.location || "",
    address: turf.address || "",
    sports: (turf.sports || []).join(", "),
    pricePerHour: turf.pricePerHour ?? "",
    floodlightChargePerHour: turf.floodlightChargePerHour ?? "",
    roofType: turf.roofType || "Not verified",
    openingTime: turf.openingTime || "",
    closingTime: turf.closingTime || "",
    slotDurationMinutes: turf.slotDurationMinutes || 60,
    contactNumber: turf.contactNumber || "",
    facilities: (turf.facilities || []).join(", "),
    latitude: turf.latitude ?? "",
    longitude: turf.longitude ?? "",
    weatherLocation: turf.weatherLocation || "",
    description: turf.description || "",
    status: turf.status || (turf.available === false ? "Inactive" : "Active"),
  };
}

export default function TurfManagement() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [form, setForm] = useState(BLANK_FORM);
  const [equipment, setEquipment] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchTurfs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTurfs();
      setTurfs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load turfs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTurfs();
    const refresh = () => fetchTurfs();
    socket.on("turf:created", refresh);
    socket.on("turf:updated", refresh);
    socket.on("turf:deleted", refresh);
    return () => {
      socket.off("turf:created", refresh);
      socket.off("turf:updated", refresh);
      socket.off("turf:deleted", refresh);
    };
  }, [fetchTurfs]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return turfs;
    return turfs.filter((t) => (t.status || "Active") === statusFilter);
  }, [turfs, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(BLANK_FORM);
    setEquipment([]);
    setError("");
    setIsModalOpen(true);
  }

  function openEdit(turf) {
    setEditingId(turf._id);
    setForm(toForm(turf));
    setEquipment((turf.equipment || []).map((e) => ({ name: e.name, rentalCharge: e.rentalCharge ?? 0 })));
    setError("");
    setIsModalOpen(true);
  }

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  function buildPayload() {
    const numOrNull = (v) => (v === "" || v === null ? null : Number(v));
    return {
      name: form.name.trim(),
      location: form.location.trim(),
      address: form.address.trim(),
      sports: form.sports.split(",").map((s) => s.trim()).filter(Boolean),
      pricePerHour: numOrNull(form.pricePerHour),
      floodlightChargePerHour: numOrNull(form.floodlightChargePerHour),
      roofType: form.roofType,
      openingTime: form.openingTime.trim() || null,
      closingTime: form.closingTime.trim() || null,
      slotDurationMinutes: Number(form.slotDurationMinutes) || 60,
      contactNumber: form.contactNumber.trim(),
      facilities: form.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      latitude: numOrNull(form.latitude),
      longitude: numOrNull(form.longitude),
      weatherLocation: form.weatherLocation.trim(),
      description: form.description.trim(),
      status: form.status,
      equipment: equipment
        .map((e) => ({ name: (e.name || "").trim(), rentalCharge: Math.max(0, Number(e.rentalCharge) || 0) }))
        .filter((e) => e.name),
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError("Turf name and area/location are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateTurf(editingId, payload);
        setNotice("Turf updated.");
      } else {
        await createTurf(payload);
        setNotice("Turf added.");
      }
      setIsModalOpen(false);
      setEditingId(null);
      await fetchTurfs();
    } catch (err) {
      setError(err.message || "Unable to save turf.");
    } finally {
      setSaving(false);
    }
  };

  async function toggleStatus(turf) {
    const next = (turf.status || "Active") === "Active" ? "Inactive" : "Active";
    setBusyId(turf._id);
    setError("");
    try {
      await updateTurf(turf._id, { status: next });
      setNotice(`"${turf.name}" is now ${next}.`);
      await fetchTurfs();
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(turf) {
    if (!window.confirm(`Delete "${turf.name}"? This cannot be undone.`)) return;
    setBusyId(turf._id);
    setError("");
    try {
      await deleteTurf(turf._id);
      setNotice("Turf deleted.");
      setTurfs((prev) => prev.filter((t) => t._id !== turf._id));
      await fetchTurfs();
    } catch (err) {
      if (err.status === 409) {
        if (window.confirm(`${err.message}\n\nForce delete anyway?`)) {
          try {
            await deleteTurf(turf._id, { force: true });
            setNotice("Turf force-deleted.");
            await fetchTurfs();
          } catch (err2) {
            setError(err2.message || "Unable to delete turf.");
          }
        }
      } else {
        setError(err.message || "Unable to delete turf.");
      }
    } finally {
      setBusyId("");
    }
  }

  const counts = {
    all: turfs.length,
    active: turfs.filter((t) => (t.status || "Active") === "Active").length,
    inactive: turfs.filter((t) => t.status === "Inactive").length,
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>Turf Management</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            {counts.all} turfs · {counts.active} active · {counts.inactive} inactive
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <IconPlus size={16} /> Add Turf
        </button>
      </div>

      <div className="filter-pills-group" style={{ marginBottom: 16 }}>
        {["ALL", "Active", "Inactive"].map((s) => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? "active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="alert-banner error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && !error && (
        <div className="alert-banner" role="status" style={{ marginBottom: 12, background: "#ecfdf5", color: "#047857" }}>
          {notice}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Loading turfs…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
            <IconMapPin size={40} style={{ opacity: 0.4 }} />
            <h3>No turfs</h3>
            <p>Add a turf to get started.</p>
          </div>
        ) : (
          <div className="matches-grid" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {filtered.map((turf) => {
              const active = (turf.status || "Active") === "Active";
              return (
                <div
                  key={turf._id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 14,
                    opacity: busyId === turf._id ? 0.5 : 1,
                    background: active ? "#fff" : "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                    <h4 style={{ margin: "0 0 2px" }}>{turf.name}</h4>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: active ? "#dcfce7" : "#fee2e2",
                        color: active ? "#166534" : "#991b1b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {turf.status || "Active"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    <IconMapPin size={12} /> {turf.location}
                  </div>

                  <div style={{ fontSize: 12.5, marginTop: 10, display: "grid", gap: 3, color: "#334155" }}>
                    <span>Sports: {(turf.sports && turf.sports.length ? turf.sports.join(", ") : turf.sportType) || "Not verified"}</span>
                    <span>Price: <strong>{money(turf.pricePerHour)}</strong>{turf.pricePerHour ? " / hr" : ""}</span>
                    <span>Floodlight: {money(turf.floodlightChargePerHour)}{turf.floodlightChargePerHour ? " / hr" : ""}</span>
                    <span>Roof: {turf.roofType || "Not verified"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconClock size={12} /> {hours(turf)}</span>
                    <span>Facilities: {(turf.facilities && turf.facilities.length) ? turf.facilities.join(", ") : "Not verified"}</span>
                    <span>Equipment: {(turf.equipment && turf.equipment.length) ? turf.equipment.map((e) => e.name).join(", ") : "Not verified"}</span>
                    <span>Contact: {turf.contactNumber || "Not verified"}</span>
                    <span>Weather: {turf.weatherLocation || "Coimbatore"}{turf.latitude != null ? " (GPS set)" : ""}</span>
                  </div>

                  <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                    <button className="btn btn-outline btn-sm" disabled={busyId === turf._id} onClick={() => openEdit(turf)}>
                      <IconEdit size={13} /> Edit
                    </button>
                    <button className="btn btn-outline btn-sm" disabled={busyId === turf._id} onClick={() => toggleStatus(turf)}>
                      {active ? <><IconX size={13} /> Deactivate</> : <><IconCheck size={13} /> Activate</>}
                    </button>
                    <button className="btn btn-outline-danger btn-sm" disabled={busyId === turf._id} onClick={() => handleDelete(turf)}>
                      <IconTrash size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Turf" : "Add Turf"}
        maxWidth="720px"
      >
        <form onSubmit={handleSubmit} className="admin-form">
          {error && <div className="alert-banner error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

          <div className="form-group">
            <label>Turf Name *</label>
            <input name="name" value={form.name} onChange={change} required className="form-control" placeholder="e.g. 5th Yard - Football Turf" />
          </div>

          <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Area / Location *</label>
              <input name="location" value={form.location} onChange={change} required className="form-control" placeholder="e.g. Singanallur" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Status</label>
              <select name="status" value={form.status} onChange={change} className="form-control">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Full Address <span style={{ color: "#94a3b8" }}>(blank if not verified)</span></label>
            <input name="address" value={form.address} onChange={change} className="form-control" />
          </div>

          <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Sports <span style={{ color: "#94a3b8" }}>(comma separated)</span></label>
              <input name="sports" value={form.sports} onChange={change} className="form-control" placeholder="Football, Cricket" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Contact Number</label>
              <input name="contactNumber" value={form.contactNumber} onChange={change} className="form-control" placeholder="+91 …" />
            </div>
          </div>

          <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Base Price / hr <span style={{ color: "#94a3b8" }}>(blank = not verified)</span></label>
              <input type="number" min="0" name="pricePerHour" value={form.pricePerHour} onChange={change} className="form-control" placeholder="Not verified" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Floodlight Charge / hr <span style={{ color: "#94a3b8" }}>(blank = not verified)</span></label>
              <input type="number" min="0" name="floodlightChargePerHour" value={form.floodlightChargePerHour} onChange={change} className="form-control" placeholder="Not verified" />
            </div>
          </div>

          <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Roof Type</label>
              <select name="roofType" value={form.roofType} onChange={change} className="form-control">
                {ROOF_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Slot Length (mins)</label>
              <input type="number" min="15" step="5" name="slotDurationMinutes" value={form.slotDurationMinutes} onChange={change} className="form-control" />
            </div>
          </div>

          <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Opening Time <span style={{ color: "#94a3b8" }}>(HH:MM, blank = not verified)</span></label>
              <input type="time" name="openingTime" value={form.openingTime} onChange={change} className="form-control" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Closing Time <span style={{ color: "#94a3b8" }}>(HH:MM)</span></label>
              <input type="time" name="closingTime" value={form.closingTime} onChange={change} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label>Facilities <span style={{ color: "#94a3b8" }}>(comma separated)</span></label>
            <input name="facilities" value={form.facilities} onChange={change} className="form-control" placeholder="Floodlights, Parking, Washroom" />
          </div>

          <div className="form-group">
            <label>Equipment (name + rental charge, 0 = free)</label>
            <div style={{ display: "grid", gap: 6 }}>
              {equipment.map((eq, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-control"
                    placeholder="Equipment name"
                    value={eq.name}
                    onChange={(e) => setEquipment((list) => list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    style={{ maxWidth: 120 }}
                    placeholder="₹"
                    value={eq.rentalCharge}
                    onChange={(e) => setEquipment((list) => list.map((x, j) => (j === i ? { ...x, rentalCharge: e.target.value } : x)))}
                  />
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setEquipment((list) => list.filter((_, j) => j !== i))}>
                    <IconX size={13} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" style={{ justifySelf: "start" }} onClick={() => setEquipment((list) => [...list, { name: "", rentalCharge: 0 }])}>
                <IconPlus size={13} /> Add equipment
              </button>
            </div>
          </div>

          <div className="form-row" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Latitude <span style={{ color: "#94a3b8" }}>(optional)</span></label>
              <input type="number" step="any" name="latitude" value={form.latitude} onChange={change} className="form-control" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Longitude <span style={{ color: "#94a3b8" }}>(optional)</span></label>
              <input type="number" step="any" name="longitude" value={form.longitude} onChange={change} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label>Weather Location <span style={{ color: "#94a3b8" }}>(shown on the forecast)</span></label>
            <input name="weatherLocation" value={form.weatherLocation} onChange={change} className="form-control" placeholder="Singanallur, Coimbatore, Tamil Nadu" />
          </div>

          <div className="form-group">
            <label>Notes / Description</label>
            <textarea name="description" value={form.description} onChange={change} className="form-control" rows={2} />
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Turf"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
