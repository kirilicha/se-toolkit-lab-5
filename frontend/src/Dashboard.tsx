import { useEffect, useState, FormEvent } from "react";
import "./App.css";
import { Dashboard, ScoreBucket } from "./Dashboard";

const STORAGE_KEY = "api_token";

interface Item {
  id: number;
  title: string;
  type: string;
  parent_id: number | null;
  created_at: string;
  description: string | null;
}

type Page = "items" | "dashboard";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [scores, setScores] = useState<ScoreBucket[]>([]);
  const [page, setPage] = useState<Page>("items");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    fetch("/items", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Item[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });

    fetch("/analytics/scores?lab=lab-04", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ScoreBucket[]) => setScores(data))
      .catch(() => {});
  }, [token]);

  function handleConnect(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setToken(trimmed);
  }

  function handleDisconnect() {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setDraft("");
    setItems([]);
    setScores([]);
    setError(null);
    setPage("items");
  }

  if (!token) {
    return (
      <form className="token-form" onSubmit={handleConnect}>
        <h1>API Token</h1>
        <p>Enter your API token to connect.</p>
        <input
          type="password"
          placeholder="Token"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit">Connect</button>
      </form>
    );
  }

  return (
    <div>
      <header className="app-header">
        <h1>{page === "items" ? "Items" : "Dashboard"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPage("items")}>Items</button>
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button className="btn-disconnect" onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      </header>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      {page === "dashboard" && <Dashboard scores={scores} />}

      {page === "items" && !loading && !error && (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Title</th>
              <th>Created at</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.type}</td>
                <td>{item.title}</td>
                <td>{item.created_at}</td>
                <td>{item.description ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
