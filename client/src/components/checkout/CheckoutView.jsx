import { useState } from "react";
import { money } from "../../utils/formatters.js";

export default function CheckoutView({
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  addressForm,
  setAddressForm,
  createAddress,
  cart,
  checkout,
  busy,
}) {
  const [showAddForm, setShowAddForm] = useState(addresses.length === 0);

  return (
    <section className="split">
      <div className="list">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>Delivery address</h2>
          {addresses.length > 0 && (
            <button
              type="button"
              className="link"
              onClick={() => setShowAddForm((prev) => !prev)}
            >
              {showAddForm ? "Cancel" : "+ Add new address"}
            </button>
          )}
        </div>

        {showAddForm && (
          <form className="address-form" onSubmit={async (e) => {
            await createAddress(e);
            setShowAddForm(false);
          }}>
            <h3 style={{ marginBottom: "1rem" }}>Add new delivery address</h3>
            {[
              { key: "fullName", placeholder: "Full Name" },
              { key: "phone", placeholder: "Phone Number" },
              { key: "line1", placeholder: "Address Line 1" },
              { key: "city", placeholder: "City" },
              { key: "state", placeholder: "State" },
              { key: "postalCode", placeholder: "Postal / PIN Code" },
              { key: "country", placeholder: "Country" },
            ].map((field) => (
              <input
                key={field.key}
                required
                placeholder={field.placeholder}
                value={addressForm[field.key] || ""}
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    [field.key]: event.target.value,
                  })
                }
              />
            ))}
            <button className="primary" disabled={busy}>
              {busy ? "Saving..." : "Save address"}
            </button>
          </form>
        )}

        {addresses.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "1rem" }}>
            {addresses.map((address) => {
              const currentId = address.id || address._id;
              const isSelected = selectedAddressId === currentId;
              return (
                <div
                  className={`address ${isSelected ? "selected-address" : ""}`}
                  key={currentId}
                  onClick={() => setSelectedAddressId(currentId)}
                  style={{
                    cursor: "pointer",
                    border: isSelected ? "2px solid var(--ink, #000)" : "1px solid var(--line, #e2e8f0)",
                    borderRadius: "6px",
                    padding: "16px",
                    background: isSelected ? "var(--bg-accent, #f8fafc)" : "inherit",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>{address.fullName}</b>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: isSelected ? "var(--accent, #863bff)" : "inherit" }}>
                      {isSelected ? "● Selected" : "○ Click to select"}
                    </span>
                  </div>
                  <span>
                    {address.line1}, {address.city}, {address.state} {address.postalCode}
                  </span>
                  <small style={{ color: "var(--muted, #64748b)" }}>Phone: {address.phone}</small>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="summary">
        <span className="kicker">Final total</span>
        <div className="grand">
          <span>Due today</span>
          <b>{money(cart?.totals?.finalTotal)}</b>
        </div>
        <button
          className="primary"
          disabled={busy || (!selectedAddressId && !addresses.length)}
          onClick={checkout}
        >
          {busy ? "Placing order..." : "Place order"}
        </button>
      </aside>
    </section>
  );
}
