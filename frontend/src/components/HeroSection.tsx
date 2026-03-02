import { Box, Typography, Button, Container } from "@mui/material";

const Hero = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <Container>
        <Typography variant="h2" fontWeight={800} gutterBottom>
          AI-Powered Civic Intelligence
        </Typography>

        <Typography variant="h6" sx={{ mb: 4, maxWidth: 600 }}>
          Detect potholes and road damage instantly using AI.
          Empower citizens. Prioritize repairs. Improve cities.
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={{
            borderRadius: "30px",
            px: 4,
            py: 1.5,
            backgroundColor: "white",
            color: "black",
          }}
        >
          Get Started
        </Button>
      </Container>
    </Box>
  );
};

export default Hero;