import "./LoadingScreen.css";

function LoadingScreen({ message }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner large"></div>
      <p>{message || "Loading..."}</p>
    </div>
  );
}

export default LoadingScreen;