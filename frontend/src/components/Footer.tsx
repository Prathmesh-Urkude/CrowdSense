import { Box, Container, Grid, Typography, Link } from "@mui/material";

const Footer = () => {
  return (
    <Box sx={{ backgroundColor: "#111827", color: "#fff", py: 8 }}>
      <Container>
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              CrowdSense
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              AI-powered civic intelligence platform for smarter cities.
              Empowering citizens and authorities with real-time road damage
              detection.
            </Typography>
          </Grid>

          {/* Product */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Product
            </Typography>
            <Link href="#" underline="none" color="inherit" display="block">
              Features
            </Link>
            <Link href="#" underline="none" color="inherit" display="block">
              Dashboard
            </Link>
            <Link href="#" underline="none" color="inherit" display="block">
              Report Issue
            </Link>
          </Grid>

          {/* Company */}
          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Company
            </Typography>
            <Link href="#" underline="none" color="inherit" display="block">
              About
            </Link>
            <Link href="#" underline="none" color="inherit" display="block">
              Contact
            </Link>
          </Grid>

          {/* Legal */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Legal
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              © {new Date().getFullYear()} CrowdSense. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;