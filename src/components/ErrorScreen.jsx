import "./ErrorScreen.css";

function ErrorScreen({ title, message }) {
  return (
    <div className="error-screen">
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  );
}

export default ErrorScreen;
