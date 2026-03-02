import { Box, Typography, Container, Grid, Card, CardContent, } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import MapIcon from "@mui/icons-material/Map";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";

const features = [
  {
    icon: <CameraAltIcon sx={{ fontSize: 40 }} />,
    title: "AI Damage Detection",
    description:
      "Upload road images and instantly classify potholes, cracks, and severity using deep learning.",
  },
  {
    icon: <MapIcon sx={{ fontSize: 40 }} />,
    title: "Smart Geo Mapping",
    description:
      "Pin exact damage location using interactive map integration.",
  },
  {
    icon: <ThumbUpIcon sx={{ fontSize: 40 }} />,
    title: "Priority by Community",
    description:
      "Reports gain priority dynamically based on AI severity and citizen upvotes.",
  },
];

const Features = () => {
  return (
    <Box sx={{ py: 12, backgroundColor: "#f9fafc" }}>
      <Container>
        <Typography
          variant="h3"
          fontWeight={800}
          textAlign="center"
          gutterBottom
        >
          Built for Smarter Cities
        </Typography>

        <Typography
          variant="h6"
          textAlign="center"
          sx={{ mb: 8, color: "gray" }}
        >
          Combining AI intelligence with civic engagement
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid key={index} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  p: 4,
                  borderRadius: 4,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      p: 2,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>

                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {feature.title}
                  </Typography>

                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Features;