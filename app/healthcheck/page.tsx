export default function HealthCheck() {
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h1>tile-chatter healthcheck</h1>
      <p>If you can see this, the server is working.</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
