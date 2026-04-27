"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTables } from "@/lib/realtimeRefresh";

const normalizeRole = (role) => {
  const value = String(role || "").toLowerCase().trim();

  if (["combat", "fighter", "combat ship", "gunship", "military"].includes(value)) return "Combat";
  if (["racing", "race", "racer"].includes(value)) return "Racing";
  if (["cargo", "freight", "hauling", "hauler", "transport"].includes(value)) return "Cargo";
  if (["mining", "miner", "industrial mining"].includes(value)) return "Mining";
  if (["medical", "medic", "hospital"].includes(value)) return "Medical";
  if (["exploration", "explorer", "pathfinder"].includes(value)) return "Exploration";
  if (["salvage", "salvager"].includes(value)) return "Salvage";
  if (["support", "utility", "support ship"].includes(value)) return "Support";
  if (["multi-role", "multirole", "multi role"].includes(value)) return "Multi-role";

  return role || "No Role";
};

export default function FleetPage() {
  const [ships, setShips] = useState([]);
  const [shipCatalog, setShipCatalog] = useState([]);

  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("Checking access...");

  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [showRoleBreakdown, setShowRoleBreakdown] = useState(false);

  const [editingShip, setEditingShip] = useState(null);
  const [editForm, setEditForm] = useState({
    custom_ship_name: "",
    quantity: 1,
    status: "Active",
    notes: "",
  });

  const [form, setForm] = useState({
    ship_name: "",
    custom_ship_name: "",
    role: "",
    quantity: 1,
    status: "Active",
    notes: "",
  });

  useEffect(() => {
  loadPage();

  const unsubscribe = subscribeToTables(
    "fleet-live",
    ["fleet", "ship_catalog", "members"],
    () => {
      fetchShips();
      fetchShipCatalog();
    }
  );

  return unsubscribe;
}, []);

  useEffect(() => {
    if (!message || message === "Checking access...") return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4500);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    document.body.style.overflow = editingShip ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingShip]);

  const manufacturers = useMemo(() => {
    return [
      ...new Set(
        shipCatalog
          .map((ship) => ship.manufacturer)
          .filter(Boolean)
          .sort()
      ),
    ];
  }, [shipCatalog]);

  const availableShips = useMemo(() => {
    if (!selectedManufacturer) return [];

    return shipCatalog
      .filter((ship) => ship.manufacturer === selectedManufacturer)
      .sort((a, b) => a.ship_name.localeCompare(b.ship_name));
  }, [shipCatalog, selectedManufacturer]);

  const selectedCatalogShip = useMemo(() => {
    return shipCatalog.find(
      (ship) =>
        ship.ship_name === form.ship_name &&
        ship.manufacturer === selectedManufacturer
    );
  }, [shipCatalog, form.ship_name, selectedManufacturer]);

  const canNameSelectedShip = selectedCatalogShip?.naming_license === true;

  const totalShips = useMemo(
    () => ships.reduce((total, ship) => total + Number(ship.quantity || 0), 0),
    [ships]
  );

  const namedShips = useMemo(
    () =>
      ships.filter(
        (ship) =>
          ship.custom_ship_name && ship.custom_ship_name.trim().length > 0
      ).length,
    [ships]
  );

  const totalOwners = useMemo(
    () => new Set(ships.map((ship) => ship.rsi_handle)).size,
    [ships]
  );

  const roles = useMemo(() => {
    return [
      "All",
      ...new Set(ships.map((ship) => normalizeRole(ship.role)).filter(Boolean)),
    ];
  }, [ships]);

  const roleBreakdown = useMemo(() => {
    const totals = {};

    ships.forEach((ship) => {
      const role = normalizeRole(ship.role);
      totals[role] = (totals[role] || 0) + Number(ship.quantity || 0);
    });

    return Object.entries(totals)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [ships]);

  const filteredShips = useMemo(() => {
    return ships
      .filter((ship) => {
        const query = search.toLowerCase();

        const normalizedShipRole = normalizeRole(ship.role);
        const normalizedFilterRole = normalizeRole(roleFilter);

        const matchesRole =
          roleFilter === "All" || normalizedShipRole === normalizedFilterRole;

        const matchesSearch =
          ship.ship_name?.toLowerCase().includes(query) ||
          ship.custom_ship_name?.toLowerCase().includes(query) ||
          ship.rsi_handle?.toLowerCase().includes(query);

        return matchesRole && matchesSearch;
      })
      .sort((a, b) =>
        String(a.ship_name || "").localeCompare(String(b.ship_name || ""))
      );
  }, [ships, roleFilter, search]);

  async function loadPage() {
    setMessage("Checking access...");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    setUser(currentUser);

    if (!currentUser) {
      setAllowed(false);
      setMessage("You must be logged in to view the org fleet.");
      return;
    }

    const { data: memberData, error } = await supabase
      .from("members")
      .select("*")
      .eq("email", currentUser.email)
      .maybeSingle();

    if (error || !memberData || memberData.approved !== true) {
      setAllowed(false);
      setMessage(
        "Access denied. You must be an approved UCOR member to view the org fleet."
      );
      return;
    }

    const { data: adminRow } = await supabase
      .from("admins")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();

    setIsOwner(adminRow?.role?.toLowerCase() === "owner");

    setMember(memberData);
    setAllowed(true);
    setMessage("");

    await fetchShipCatalog();
    await fetchShips();
  }

  async function fetchShipCatalog() {
    const { data, error } = await supabase
      .from("ship_catalog")
      .select("ship_name, manufacturer, role, naming_license, image_url")
      .order("manufacturer", { ascending: true });

    if (error) {
      console.log("Ship catalog error:", error.message);
      return;
    }

    setShipCatalog(data || []);
  }

  async function fetchShips() {
    const { data, error } = await supabase
      .from("fleet")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setShips(data || []);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function handleManufacturerChange(value) {
    setSelectedManufacturer(value);

    setForm((current) => ({
      ...current,
      ship_name: "",
      custom_ship_name: "",
      role: "",
    }));
  }

  function handleShipChange(shipName) {
    const selectedShip = shipCatalog.find(
      (ship) =>
        ship.ship_name === shipName &&
        ship.manufacturer === selectedManufacturer
    );

    setForm((current) => ({
      ...current,
      ship_name: shipName,
      custom_ship_name: "",
      role: selectedShip?.role || "",
    }));
  }

  function shipCanBeNamed(shipName) {
    return shipCatalog.some(
      (catalogShip) =>
        catalogShip.ship_name === shipName &&
        catalogShip.naming_license === true
    );
  }

  function getCatalogShip(shipName) {
    return shipCatalog.find((catalogShip) => catalogShip.ship_name === shipName);
  }

  function canManageShip(ship) {
    return user && (ship.user_id === user.id || isOwner);
  }

  async function addShip(event) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("You must be logged in to add ships.");
      return;
    }

    if (!member || member.approved !== true) {
      setMessage("You must be an approved UCOR member to add ships.");
      return;
    }

    const finalCustomName = canNameSelectedShip
      ? form.custom_ship_name.trim()
      : "";

    const hasCustomName = finalCustomName.length > 0;
    const finalQuantity = hasCustomName ? 1 : Number(form.quantity);

    const { error } = await supabase.from("fleet").insert([
      {
        user_id: user.id,
        rsi_handle: member.rsi_handle,
        ship_name: form.ship_name,
        custom_ship_name: finalCustomName || null,
        role: normalizeRole(form.role),
        quantity: finalQuantity,
        status: form.status,
        notes: form.notes,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ship added successfully.");

    setSelectedManufacturer("");

    setForm({
      ship_name: "",
      custom_ship_name: "",
      role: "",
      quantity: 1,
      status: "Active",
      notes: "",
    });

    await fetchShips();
  }

  function openEditShip(ship) {
    setEditingShip(ship);
    setMessage("");

    setEditForm({
      custom_ship_name: ship.custom_ship_name || "",
      quantity: ship.quantity || 1,
      status: ship.status || "Active",
      notes: ship.notes || "",
    });
  }

  function closeEditShip() {
    setEditingShip(null);

    setEditForm({
      custom_ship_name: "",
      quantity: 1,
      status: "Active",
      notes: "",
    });
  }

  async function saveEditedShip(event) {
    event.preventDefault();
    setMessage("");

    if (!editingShip) return;

    const canName = shipCanBeNamed(editingShip.ship_name);

    const finalCustomName = canName
      ? editForm.custom_ship_name.trim()
      : "";

    const hasCustomName = finalCustomName.length > 0;
    const finalQuantity = hasCustomName ? 1 : Number(editForm.quantity);

    const query = supabase
      .from("fleet")
      .update({
        custom_ship_name: finalCustomName || null,
        quantity: finalQuantity,
        status: editForm.status,
        notes: editForm.notes,
      })
      .eq("id", editingShip.id);

    if (!isOwner) {
      query.eq("user_id", user.id);
    }

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ship updated.");
    closeEditShip();
    await fetchShips();
  }

  async function deleteShip(ship) {
    const confirmed = window.confirm(`Delete ${ship.ship_name} from the fleet?`);
    if (!confirmed) return;

    const query = supabase.from("fleet").delete().eq("id", ship.id);

    if (!isOwner) {
      query.eq("user_id", user.id);
    }

    const { error } = await query;

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ship deleted.");
    await fetchShips();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-red-900 bg-black/70 p-8 text-center shadow-2xl shadow-red-950/30">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
              Umbra Corporation
            </p>

            <h1 className="mt-4 text-3xl font-black">
              Fleet Access Restricted
            </h1>

            <p className="mt-4 text-zinc-400">{message}</p>

            <div className="mt-6 flex justify-center gap-3">
              <a
                href="/"
                className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Home
              </a>

              {!user && (
                <a
                  href="/login"
                  className="rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600"
                >
                  Login
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
                Umbra Corporation
              </p>

              <h1 className="mt-3 text-5xl font-black">Org Fleet</h1>

              <p className="mt-3 max-w-2xl text-zinc-400">
                View UCOR’s fleet strength, named ships, member-owned ships,
                operational roles, and active contributions.
              </p>

              {user && (
                <p className="mt-4 text-sm text-zinc-500">
                  Logged in as: {user.email}
                </p>
              )}

              {member && (
                <p className="mt-1 text-sm font-bold text-red-400">
                  RSI Handle: {member.rsi_handle}
                </p>
              )}

              {isOwner && (
                <p className="mt-2 inline-block rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200">
                  Owner Controls Enabled
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Home
              </a>

              <a href="/fleet" className="rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600">
                Org Fleet
              </a>

              <a href="/my-fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                My Fleet
              </a>

              <a href="/admin" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Admin
              </a>

              <button
                onClick={logout}
                className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <StatCard label="Total Ships" value={totalShips} />
            <StatCard label="Named Ships" value={namedShips} />
            <StatCard label="Members Contributing" value={totalOwners} />
            <StatCard label="Fleet Roles" value={roles.length - 1} />
          </div>

          {roleBreakdown.length > 0 && (
            <div className="mt-6 rounded-3xl border border-zinc-800 bg-black/50 p-5">
              <button
                type="button"
                onClick={() => setShowRoleBreakdown(!showRoleBreakdown)}
                className="flex w-full items-center justify-between text-left"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Role Breakdown
                </p>

                <span className="rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-300">
                  {showRoleBreakdown ? "Hide ▲" : "Show ▼"}
                </span>
              </button>

              {showRoleBreakdown && (
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {roleBreakdown.map((item) => (
                    <div
                      key={item.role}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <p className="text-sm font-bold text-zinc-300">
                        {item.role}
                      </p>
                      <p className="mt-2 text-3xl font-black text-red-400">
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={addShip}
          className="h-fit rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10"
        >
          <h2 className="text-2xl font-black">Add Ship</h2>

          <p className="mt-2 text-sm text-zinc-500">
            Custom ship names only unlock for ships marked as RSI naming-license eligible.
          </p>

          {message && (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200 transition">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <select
              value={selectedManufacturer}
              onChange={(e) => handleManufacturerChange(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              required
            >
              <option value="">Select Manufacturer</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>

            <select
              value={form.ship_name}
              onChange={(e) => handleShipChange(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700 disabled:opacity-50"
              required
              disabled={!selectedManufacturer}
            >
              <option value="">
                {selectedManufacturer
                  ? "Select Ship"
                  : "Select Manufacturer First"}
              </option>

              {availableShips.map((ship) => (
                <option
                  key={`${ship.manufacturer}-${ship.ship_name}`}
                  value={ship.ship_name}
                >
                  {ship.ship_name}
                  {ship.naming_license ? " — Nameable" : ""}
                </option>
              ))}
            </select>

            {selectedCatalogShip?.image_url && (
              <img
                src={selectedCatalogShip.image_url}
                alt={form.ship_name}
                className="h-40 w-full rounded-2xl border border-zinc-800 object-cover"
              />
            )}

            <input
              value={form.role}
              readOnly
              placeholder="Role auto-fills from ship catalog"
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-400 outline-none"
            />

            {form.ship_name && canNameSelectedShip && (
              <input
                placeholder="RSI Ship Name (optional)"
                value={form.custom_ship_name}
                onChange={(e) => updateForm("custom_ship_name", e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              />
            )}

            {form.ship_name && !canNameSelectedShip && (
              <p className="rounded-xl border border-zinc-800 bg-black/50 p-3 text-sm text-zinc-500">
                This ship is not marked as RSI ship-naming eligible.
              </p>
            )}

            <input
              type="number"
              min="1"
              value={
                canNameSelectedShip && form.custom_ship_name.trim().length > 0
                  ? 1
                  : form.quantity
              }
              disabled={
                canNameSelectedShip && form.custom_ship_name.trim().length > 0
              }
              onChange={(e) => updateForm("quantity", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              required
            />

            {canNameSelectedShip && form.custom_ship_name.trim().length > 0 && (
              <p className="text-xs text-zinc-500">
                Named ships are counted as one individual vehicle.
              </p>
            )}

            <select
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            >
              <option>Active</option>
              <option>Loaner</option>
              <option>Concept</option>
              <option>Stored</option>
              <option>Sold</option>
              <option>Melted</option>
            </select>

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <button
              type="submit"
              className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600"
            >
              Add Ship
            </button>
          </div>
        </form>

        <div>
          <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black">Fleet Registry</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Search ships, custom ship names, or owners.
              </p>
            </div>

            <input
              placeholder="Search ship, name, or owner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>

          {filteredShips.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
              No ships found.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredShips.map((ship) => {
                const catalogShip = getCatalogShip(ship.ship_name);
                const isOwnShip = user && ship.user_id === user.id;

                return (
                  <div
                    key={ship.id}
                    className={`rounded-3xl border bg-black/60 p-5 transition ${
                      isOwnShip
                        ? "border-red-800 shadow-lg shadow-red-950/30"
                        : "border-zinc-800 hover:border-red-900"
                    }`}
                  >
                    {catalogShip?.image_url && (
                      <img
                        src={catalogShip.image_url}
                        alt={ship.ship_name}
                        className="mb-4 h-36 w-full rounded-2xl border border-zinc-800 object-cover"
                      />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {isOwnShip && (
                          <p className="mb-2 inline-block rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-red-200">
                            Your Ship
                          </p>
                        )}

                        {ship.custom_ship_name && (
                          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-500">
                            {ship.custom_ship_name}
                          </p>
                        )}

                        <h3 className="mt-1 text-2xl font-black">
                          {ship.ship_name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          Owner: {ship.rsi_handle}
                        </p>
                      </div>

                      <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm font-bold text-red-200">
                        Qty {ship.quantity}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {ship.custom_ship_name && (
                        <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm text-red-200">
                          Named Ship
                        </span>
                      )}

                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-zinc-300">
                        {normalizeRole(ship.role)}
                      </span>

                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-zinc-300">
                        {ship.status}
                      </span>
                    </div>

                    {ship.notes && (
                      <p className="mt-5 border-t border-zinc-900 pt-4 text-sm leading-6 text-zinc-400">
                        {ship.notes}
                      </p>
                    )}

                    {canManageShip(ship) && (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          onClick={() => openEditShip(ship)}
                          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-200 hover:border-red-900 hover:bg-zinc-800"
                        >
                          Edit Ship
                        </button>

                        <button
                          onClick={() => deleteShip(ship)}
                          className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
                        >
                          Delete Ship
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {editingShip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <form
            onSubmit={saveEditedShip}
            className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/40 transition"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
                  Edit Ship
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {editingShip.ship_name}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Owner: {editingShip.rsi_handle}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditShip}
                className="rounded-xl border border-zinc-800 bg-black px-4 py-2 font-bold hover:bg-zinc-900"
              >
                X
              </button>
            </div>

            <div className="grid gap-4">
              {shipCanBeNamed(editingShip.ship_name) ? (
                <input
                  placeholder="RSI Ship Name (optional)"
                  value={editForm.custom_ship_name}
                  onChange={(e) =>
                    updateEditForm("custom_ship_name", e.target.value)
                  }
                  className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
                />
              ) : (
                <p className="rounded-xl border border-zinc-800 bg-black/50 p-3 text-sm text-zinc-500">
                  This ship is not marked as RSI ship-naming eligible.
                </p>
              )}

              <input
                type="number"
                min="1"
                value={
                  shipCanBeNamed(editingShip.ship_name) &&
                  editForm.custom_ship_name.trim().length > 0
                    ? 1
                    : editForm.quantity
                }
                disabled={
                  shipCanBeNamed(editingShip.ship_name) &&
                  editForm.custom_ship_name.trim().length > 0
                }
                onChange={(e) => updateEditForm("quantity", e.target.value)}
                className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />

              {shipCanBeNamed(editingShip.ship_name) &&
                editForm.custom_ship_name.trim().length > 0 && (
                  <p className="text-xs text-zinc-500">
                    Named ships are counted as one individual vehicle.
                  </p>
                )}

              <select
                value={editForm.status}
                onChange={(e) => updateEditForm("status", e.target.value)}
                className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
              >
                <option>Active</option>
                <option>Loaner</option>
                <option>Concept</option>
                <option>Stored</option>
                <option>Sold</option>
                <option>Melted</option>
              </select>

              <textarea
                placeholder="Notes"
                value={editForm.notes}
                onChange={(e) => updateEditForm("notes", e.target.value)}
                className="min-h-28 rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="submit"
                  className="rounded-xl bg-red-700 px-5 py-3 font-black hover:bg-red-600"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={closeEditShip}
                  className="rounded-xl border border-zinc-800 px-5 py-3 font-black hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black text-red-400">{value}</p>
    </div>
  );
}