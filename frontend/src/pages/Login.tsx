import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    Alert,
    IconButton,
    InputAdornment,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { ENV } from "../configs/env";

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await API.post("/auth/login", {
                email,
                password,
            });

            const token = response.data.token;

            localStorage.setItem("token", token);

            navigate("/dashboard");
        } catch (error) {
            setError("Invalid email or password");
        }
    };
    const handleGoogleLogin = (): void => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
};
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={10}
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        backdropFilter: "blur(10px)",
                        backgroundColor: "rgba(255,255,255,0.95)",
                    }}
                >
                    {/* Title */}
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        textAlign="center"
                        gutterBottom
                    >
                        Welcome Back
                    </Typography>

                    <Typography textAlign="center" sx={{ mb: 4, color: "gray" }}>
                        Sign in to continue to {ENV.APP_NAME}
                    </Typography>

                    {/* Error message */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <Box component="form" onSubmit={handleLogin}>
                        <TextField
                            label="Email"
                            fullWidth
                            required
                            margin="normal"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <TextField
                            label="Password"
                            fullWidth
                            required
                            margin="normal"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 3,
                                borderRadius: "30px",
                                py: 1.5,
                                fontWeight: 600,
                            }}
                        >
                            Login
                        </Button>
                    </Box>

                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        sx={{
                            mt: 2,
                            borderRadius: "30px",
                            py: 1.3,
                            textTransform: "none",
                            fontWeight: 500,
                        }}
                    >
                        Continue with Google
                    </Button>

                    {/* Footer text */}
                    <Typography textAlign="center" sx={{ mt: 3 }}>
                        Don't have an account?{" "}
                        <span
                            style={{ color: "#667eea", cursor: "pointer" }}
                            onClick={() => navigate("/signup")}
                        >
                            Sign up
                        </span>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
