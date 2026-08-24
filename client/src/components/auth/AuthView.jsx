export default function AuthView({
  authMode,
  setAuthMode,
  form,
  setForm,
  submitAuth,
  busy,
}) {
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));

  return (
    <section className="auth">
      <span className="kicker">Your account</span>
      <h2>
        {authMode === "login" ? "Welcome back." : "Make an account."}
      </h2>
      <form onSubmit={submitAuth}>
        {authMode === "register" && (
          <input
            required
            placeholder="Full name"
            value={form.name || ""}
            onChange={(e) => set("name", e.target.value)}
          />
        )}
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email || ""}
          onChange={(e) => set("email", e.target.value)}
        />
        <input
          required
          minLength="8"
          type="password"
          placeholder="Password"
          value={form.password || ""}
          onChange={(e) => set("password", e.target.value)}
        />
        <button className="primary" disabled={busy}>
          {busy
            ? "Working..."
            : authMode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
      <button
        className="link"
        onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
      >
        {authMode === "login"
          ? "Create an account"
          : "I already have an account"}
      </button>
    </section>
  );
}
