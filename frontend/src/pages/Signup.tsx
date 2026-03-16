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
import { Visibility, VisibilityOff, Google } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { ENV } from "../configs/env";

const Signup = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await API.post("/auth/register", {
                name,
                email,
                password,
            });

            const token = response.data.token;

            localStorage.setItem("token", token);

            navigate("/dashboard");
        } catch (err) {
            setError("Signup failed. Try again.");
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        textAlign="center"
                        gutterBottom
                    >
                        Create Account
                    </Typography>

                    <Typography
                        textAlign="center"
                        sx={{ mb: 4, color: "gray" }}
                    >
                        Join {ENV.APP_NAME} today
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSignup}>
                        <TextField
                            label="Full Name"
                            fullWidth
                            required
                            margin="normal"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            required
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            fullWidth
                            required
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Confirm Password"
                            type="password"
                            fullWidth
                            required
                            margin="normal"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
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
                            Sign Up
                        </Button>

                        {/* Google signup */}
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Google />}
                            sx={{
                                mt: 2,
                                borderRadius: "30px",
                                py: 1.3,
                                textTransform: "none",
                            }}
                        >
                            Continue with Google
                        </Button>
                    </Box>

                    <Typography
                        textAlign="center"
                        sx={{ mt: 3, color: "gray" }}
                    >
                        Already have an account?{" "}
                        <span
                            style={{
                                color: "#667eea",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </span>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
};

export default Signup;