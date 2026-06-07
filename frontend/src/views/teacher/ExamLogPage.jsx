import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Typography, Grid, Card, CardContent } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import CheatingTable from './components/CheatingTable';

const ExamLogPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [totalSuspiciousActivities, setTotalSuspiciousActivities] = useState(0);

  if (!userInfo || userInfo.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageContainer title="Exam Log Page" description="Monitor suspicious activities during exams">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Suspicious Activities
              </Typography>
              <Typography variant="h3">{totalSuspiciousActivities}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <DashboardCard title="Exam Cheating Logs">
            <CheatingTable onTotalChange={setTotalSuspiciousActivities} />
          </DashboardCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

  if (!userInfo || userInfo.role !== 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageContainer title="Exam Log Page" description="Monitor suspicious activities during exams">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Suspicious Activities
              </Typography>
              <Typography variant="h3">{totalSuspiciousActivities}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <DashboardCard title="Exam Cheating Logs">
            <CheatingTable onExamSelect={setSelectedExamId} />
          </DashboardCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ExamLogPage;
