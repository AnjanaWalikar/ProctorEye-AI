import React from 'react';
import { Grid, Typography, Button, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from '../../../components/shared/BlankCard';
import ExamCard from './ExamCard';
import { useGetExamsQuery } from 'src/slices/examApiSlice';

const Exams = () => {
  // Fetch exam data from the backend using useGetExamsQuery
  const { data: userExams, isLoading, isError, refetch } = useGetExamsQuery();
  console.log('Exam USer ', userExams);

  const sampleExams = [
    {
      _id: 'mock-1',
      examId: 'mock-exam-1',
      examName: 'Sample Exam — Basic',
      examType: 'mcq',
      totalQuestions: 10,
      duration: 30,
    },
    {
      _id: 'mock-2',
      examId: 'mock-exam-2',
      examName: 'Sample Exam — Advanced',
      examType: 'both',
      totalQuestions: 20,
      duration: 60,
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>; // You can replace this with a loading spinner component
  }

  if (isError) {
    // Show fallback mock exams and allow retrying the network request
    return (
      <PageContainer title="Exams" description="List of exams (offline fallback)">
        <Box sx={{ mb: 2 }}>
          <Typography color="error" variant="body1">
            Error fetching exams from the server — showing sample exams. Please ensure the backend is running.
          </Typography>
          <Button sx={{ mt: 1 }} variant="contained" onClick={() => refetch()}>
            Retry
          </Button>
        </Box>

        <Grid container spacing={3}>
          {sampleExams.map((exam) => (
            <Grid item sm={6} md={4} lg={3} key={exam._id}>
              <BlankCard>
                <ExamCard exam={exam} />
              </BlankCard>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    );
  }

  const examsToRender = Array.isArray(userExams) ? userExams : [];

  return (
    <PageContainer title="Exams" description="List of exams">
      <Grid container spacing={3}>
        {examsToRender.length === 0 ? (
          <Grid item xs={12}>
            <Typography>No exams available. Please check your connection or log in again.</Typography>
          </Grid>
        ) : (
          examsToRender.map((exam) => (
            <Grid item sm={6} md={4} lg={3} key={exam._id || exam.examId || Math.random()}>
              <BlankCard>
                <ExamCard exam={exam} />
              </BlankCard>
            </Grid>
          ))
        )}
      </Grid>
    </PageContainer>
  );
};

export default Exams;
