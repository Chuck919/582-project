import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Login from "./Login";
import SignUp from "./SignUp";
import "./Auth.css";

const headerStyle = {
  display: "flex",
  alignItems: "center",
};

export default function AuthHeader() {
  const { user, signOut, isLoggedIn, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  const openLogin = () => { setShowLogin(true); setShowSignUp(false); };
  const openSignUp = () => { setShowSignUp(true); setShowLogin(false); };
  const closeLogin = () => setShowLogin(false);
  const closeSignUp = () => setShowSignUp(false);

  if (loading) return null;

  return (
    <>
      <header style={headerStyle}>
        <div className="auth-header-wrap">
          {isLoggedIn ? (
            <>
              <span className="auth-header-user" title={user?.email}>
                {user?.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="auth-header-btn auth-header-btn-ghost"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="auth-header-btn auth-header-btn-ghost"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={openSignUp}
                className="auth-header-btn auth-header-btn-primary"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="auth-overlay" onClick={closeLogin}>
          <div onClick={(e) => e.stopPropagation()}>
            <Login
              onClose={closeLogin}
              onSwitchToSignUp={() => { closeLogin(); openSignUp(); }}
            />
          </div>
        </div>
      )}
      {showSignUp && (
        <div className="auth-overlay" onClick={closeSignUp}>
          <div onClick={(e) => e.stopPropagation()}>
            <SignUp
              onClose={closeSignUp}
              onSwitchToLogin={() => { closeSignUp(); openLogin(); }}
            />
          </div>
        </div>
      )}
    </>
  );
}
