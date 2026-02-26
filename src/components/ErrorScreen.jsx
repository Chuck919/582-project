function ErrorScreen({ title, message }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100vw",
      height: "100vh",
      backgroundColor: "#242424",
      color: "rgba(255, 255, 255, 0.87)",
      fontFamily: "inherit",
      textAlign: "center",
      padding: "2rem",
      boxSizing: "border-box",
    }}>
      <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>{title}</h1>
      <p style={{ fontSize: "1rem", maxWidth: "480px", lineHeight: "1.6" }}>{message}</p>
    </div>
  );
}

export default ErrorScreen;
