import React, { useState, useEffect, createContext } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});
{/*Hello */}
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyToken = () => {
      if (!token) {
        setUser(null);
        setChecking(false);
        return;
      }

      // If token exists, user should also exist in localStorage.
      // If not, logout.
      if (!user) {
        logout();
      }

      setChecking(false);
    };

    verifyToken();
  }, [token]);

  const login = (newUser, newToken) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    console.log("Login successful:", newUser.role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    navigate("/login");
  };

  if (checking) return null;

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
