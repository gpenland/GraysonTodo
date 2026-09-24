"use client";

import { useEffect, useState } from "react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  image_url: string | null;
  created_at: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dbMs, setDbMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error(`failed to load todos (${res.status})`);
      const data = await res.json();
      setTodos(data.todos);
      setDbMs(data.dbMs);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (file) {
        const presignRes = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });
        if (!presignRes.ok) throw new Error("failed to get upload URL");
        const { uploadUrl, objectUrl } = await presignRes.json();

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error("failed to upload image");
        imageUrl = objectUrl;
      }

      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image_url: imageUrl }),
      });
      if (!res.ok) throw new Error("failed to create todo");
      const data = await res.json();
      setTodos((prev) => [data.todo, ...prev]);
      setDbMs(data.dbMs);
      setText("");
      setFile(null);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleCompleted(todo: Todo) {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error("failed to update todo");
      const data = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? data.todo : t)));
      setDbMs(data.dbMs);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteTodo(id: string) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to delete todo");
      const data = await res.json();
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setDbMs(data.dbMs);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <h1>Todo</h1>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={addTodo} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New todo"
          style={{ flex: 1 }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={submitting}>
          Add
        </button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleCompleted(todo)}
            />
            <span
              style={{
                flex: 1,
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.text}
            </span>
            {todo.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={todo.image_url}
                alt=""
                style={{ width: 32, height: 32, objectFit: "cover" }}
              />
            )}
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <footer style={{ marginTop: 24, fontSize: 12, color: "#999" }}>
        {dbMs !== null && <span>db: {dbMs}ms</span>}
      </footer>
    </main>
  );
}
