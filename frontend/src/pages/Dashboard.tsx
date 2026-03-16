import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { ENV } from "../configs/env";

interface Report {
  id: string;
  title: string;
  category: string;
  severity: number;
  upvotes: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await API.get("/reports");
      setReports(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* Navbar */}
      <AppBar
        position="static"
        sx={{
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            {ENV.APP_NAME} Dashboard
          </Typography>

          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Dashboard Content */}
      <Box sx={{ backgroundColor: "#f6f7fb", minHeight: "100vh", py: 5 }}>
        <Container>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 5,
            }}
          >
            <Typography variant="h4" fontWeight={700}>
              Road Damage Reports
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: "30px",
                px: 3,
              }}
            >
              Upload Report
            </Button>
          </Box>

          {/* Stats Section */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography color="text.secondary">
                    Total Reports
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {reports.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography color="text.secondary">
                    High Severity
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {
                      reports.filter((r) => r.severity > 0.7)
                        .length
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>
                  <Typography color="text.secondary">
                    Total Upvotes
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {reports.reduce(
                      (sum, r) => sum + r.upvotes,
                      0
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Reports List */}
          <Grid container spacing={3}>
            {reports.map((report) => (
              <Grid key={report.id} size={{ xs: 12, md: 6 }}>
                <Card
                  sx={{
                    borderRadius: 4,
                    transition: "0.2s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {report.title}
                    </Typography>

                    <Typography color="text.secondary">
                      Category: {report.category}
                    </Typography>

                    <Typography>
                      Severity: {report.severity}
                    </Typography>

                    <Typography>
                      Upvotes: {report.upvotes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default Dashboard;