import { AppBar, Toolbar, Typography, Button, Box, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255,255,255,0.8)",
        color: "black",
      }}
    >
      <Container>
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 700, cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            CrowdSense
          </Typography>

          <Box>
            <Button onClick={() => navigate("/login")}>Login</Button>
            <Button
              variant="contained"
              sx={{ ml: 2, borderRadius: "20px" }}
            >
              Report Issue
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;