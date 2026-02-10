import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(() => {
        const storedToken = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");

        // Debugging: Log token and role on initialization
        console.log("AuthContext Init - Token:", storedToken);
        console.log("AuthContext Init - Role:", storedRole);

        if (storedToken && storedRole) {
            try {
                const decoded = jwtDecode(storedToken);
                console.log("AuthContext Init - Decoded:", decoded);

                if (decoded.exp * 1000 < Date.now()) {
                    console.warn("AuthContext Init - Token expired");
                    return null;
                }
                return { role: storedRole, ...decoded };
            } catch (error) {
                console.error("AuthContext Init - Error decoding token:", error);
                return null;
            }
        }
        return null;
    });

    const navigate = useNavigate();

    useEffect(() => {
        console.log("AuthContext useEffect - Token changed:", token);
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    console.warn("AuthContext useEffect - Token expired, logging out");
                    logout();
                } else {
                    // Ensure user state is consistent if token changes (e.g. login)
                    if (!user || user.sub !== decoded.sub) {
                        console.log("AuthContext useEffect - Updating user state");
                        setUser({ role: localStorage.getItem("role"), ...decoded });
                    }
                }
            } catch (error) {
                console.error("AuthContext useEffect - Error decoding token:", error);
                logout();
            }
        } else {
            setUser(null);
        }
    }, [token]);


    const login = async (email, password) => {
        try {
            const response = await axios.post("http://localhost:8080/api/auth/login", {
                email,
                password,
            });

            const { token, role } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            setToken(token);

            const decoded = jwtDecode(token);
            setUser({ role: role, ...decoded });

            // Navigation will be handled by the component listening to user state changes
            return role;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setToken(null);
        setUser(null);
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
