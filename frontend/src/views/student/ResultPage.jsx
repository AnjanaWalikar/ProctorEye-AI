import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Code, Visibility, VisibilityOff, Search, CheckCircle } from '@mui/icons-material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import axiosInstance from '../../axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const ResultPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all exams first
        const examsResponse = await axiosInstance.get('/api/users/exam', {
          withCredentials: true,
        });
        setExams(examsResponse.data);

        // Fetch results based on user role
        if (userInfo?.role === 'teacher') {
          // For teachers, fetch all results
          const resultsResponse = await axiosInstance.get('/api/users/results/all', {
            withCredentials: true,
          });
          setResults(resultsResponse.data.data);
        } else {
          // For students, fetch only their visible results
          const resultsResponse = await axiosInstance.get('/api/users/results/user', {
            withCredentials: true,
          });
          setResults(resultsResponse.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userInfo]);

  const handleToggleVisibility = async (resultId) => {
    try {
      await axiosInstance.put(
        `/api/users/results/${resultId}/toggle-visibility`,
        {},
        {
          withCredentials: true,
        },
      );
      toast.success('Visibility updated successfully');
      // Refresh results
      const response = await axiosInstance.get('/api/users/results/all', {
        withCredentials: true,
      });
      setResults(response.data.data);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const handleViewCode = (result) => {
    setSelectedResult(result);
    setCodeDialogOpen(true);
  };

  const handleExamChange = async (examId) => {
    setSelectedExam(examId);
    try {
      setLoading(true);
      const url = examId === 'all'
        ? userInfo?.role === 'teacher'
          ? '/api/users/results/all'
          : '/api/users/results/user'
        : userInfo?.role === 'teacher'
          ? `/api/users/results/exam/${examId}`
          : `/api/users/results/user/exam/${examId}`;
      const response = await axiosInstance.get(url, {
        withCredentials: true,
      });
      setResults(response.data.data);
    } catch (err) {
      console.error('Error fetching exam results:', err);
      setError(err.response?.data?.message || 'Failed to fetch exam results');
      toast.error('Failed to fetch exam results');
    } finally {
      setLoading(false);
    }
  };

  const getExamId = (result) => {
    if (typeof result.examId === 'object' && result.examId !== null) {
      return result.examId.examId; // Return the UUID string, not _id
    }
    return result.examId;
  };

  const getExamName = (result) => {
    if (typeof result.examId === 'object' && result.examId !== null) {
      return result.examId.examName || 'Exam';
    }

    return exams.find((e) => e.examId === result.examId)?.examName || result.examId || 'Exam';
  };

  const getExamType = (result) => {
    if (typeof result.examId === 'object' && result.examId !== null) {
      return result.examId.examType || 'mcq';
    }
    return exams.find((e) => e.examId === result.examId)?.examType || 'mcq';
  };

  const filteredResults = results.filter((result) => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch =
      result.userId?.name?.toLowerCase().includes(searchValue) ||
      result.userId?.email?.toLowerCase().includes(searchValue) ||
      getExamName(result).toLowerCase().includes(searchValue) ||
      getExamType(result).toLowerCase().includes(searchValue);
    const examId = getExamId(result);
    const matchesExam = selectedExam === 'all' || examId === selectedExam;
    return matchesSearch && matchesExam;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Student View
  if (userInfo?.role === 'student') {
    return (
      <PageContainer title="My Exam Results" description="View your exam results">
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Exams Taken
                </Typography>
                <Typography variant="h3">{results.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h3">
                  {results.length > 0
                    ? `${(
                        results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
                      ).toFixed(1)}%`
                    : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Submissions
                </Typography>
                <Typography variant="h3">
                  {results.reduce((acc, curr) => acc + (curr.codingSubmissions?.length || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Results Table */}
          <Grid item xs={12}>
            <DashboardCard title="My Results">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Exam Name</TableCell>
                      <TableCell>Exam Type</TableCell>
                      <TableCell>MCQ Score</TableCell>
                      <TableCell>Coding Submissions</TableCell>
                      <TableCell>Total Score</TableCell>
                      <TableCell>Submission Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.length > 0 ? (
                      results.map((result) => {
                        const examType = getExamType(result);
                        return (
                          <TableRow key={result._id}>
                            <TableCell>{getExamName(result)}</TableCell>
                            <TableCell>
                              <Chip label={examType.toUpperCase()} color="primary" size="small" />
                            </TableCell>
                            <TableCell>
                              {(examType === 'mcq' || examType === 'both') ? (
                                <Chip
                                  label={`${result.percentage.toFixed(1)}%`}
                                  color={result.percentage >= 70 ? 'success' : 'warning'}
                                />
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {(examType === 'coding' || examType === 'both') && result.codingSubmissions?.length > 0 ? (
                                <Typography variant="body2">{result.codingSubmissions.length}</Typography>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  N/A
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                Total: {result.totalMarks}
                              </Typography>
                            </TableCell>
                            <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {result.codingSubmissions?.length > 0 && (
                                <IconButton onClick={() => handleViewCode(result)}>
                                  <Code />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="textSecondary">No results available yet</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DashboardCard>
          </Grid>
        </Grid>

        {/* Code View Dialog */}
        <Dialog
          open={codeDialogOpen}
          onClose={() => setCodeDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>My Code Submissions</DialogTitle>
          <DialogContent>
            {selectedResult?.codingSubmissions?.map((submission, index) => (
              <Box key={index} mb={3}>
                <Typography variant="h6" gutterBottom>
                  Question {index + 1}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Language: {submission.language}
                </Typography>
                <SyntaxHighlighter language={submission.language} style={docco}>
                  {submission.code}
                </SyntaxHighlighter>
                <Box mt={1}>
                  <Chip icon={<CheckCircle />} label="Success" color="success" />
                  {submission.executionTime && (
                    <Chip label={`Execution Time: ${submission.executionTime}ms`} sx={{ ml: 1 }} />
                  )}
                </Box>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    );
  }

  // Teacher View
  return (
    <PageContainer title="Results Dashboard" description="View and manage exam results">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Students
              </Typography>
              <Typography variant="h3">{filteredResults.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h3">
                {filteredResults.length > 0
                  ? `${(
                      filteredResults.reduce((acc, curr) => acc + curr.percentage, 0) /
                      filteredResults.length
                    ).toFixed(1)}%`
                  : '0%'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h3">
                {filteredResults.reduce(
                  (acc, curr) => acc + (curr.codingSubmissions?.length || 0),
                  0,
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Table */}
        <Grid item xs={12}>
          <DashboardCard title="Exam Results">
            {/* Exam Filter and Search */}
            <Box mb={3} display="flex" gap={2} flexWrap="wrap">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={(e) => handleExamChange(e.target.value)}
                  label="Select Exam"
                >
                  <MenuItem value="all">All Exams</MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam.examId}>
                      {exam.examName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Search students or exams"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {filteredResults.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Exam</TableCell>
                      <TableCell>Exam Type</TableCell>
                      <TableCell>MCQ Score</TableCell>
                      <TableCell>Coding Submissions</TableCell>
                      <TableCell>Total Score</TableCell>
                      <TableCell>Submission Date</TableCell>
                      <TableCell>Visibility</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredResults.map((result) => {
                      const examType = getExamType(result);
                      return (
                        <TableRow key={result._id}>
                          <TableCell>{result.userId?.name}</TableCell>
                          <TableCell>{result.userId?.email}</TableCell>
                          <TableCell>{getExamName(result)}</TableCell>
                          <TableCell>
                            <Chip label={examType.toUpperCase()} color="primary" size="small" />
                          </TableCell>
                          <TableCell>
                            {examType === 'mcq' || examType === 'both' ? (
                              <Chip
                                label={`${result.percentage.toFixed(1)}%`}
                                color={result.percentage >= 70 ? 'success' : 'warning'}
                              />
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {(examType === 'coding' || examType === 'both') &&
                            result.codingSubmissions?.length > 0 ? (
                              <Typography variant="body2">{result.codingSubmissions.length}</Typography>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              Total: {result.totalMarks}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={result.showToStudent ? 'Visible' : 'Hidden'}
                              color={result.showToStudent ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <IconButton
                                onClick={() => handleToggleVisibility(result._id)}
                                size="small"
                                title={result.showToStudent ? 'Hide from student' : 'Show to student'}
                              >
                                {result.showToStudent ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                              </IconButton>
                              {result.codingSubmissions?.length > 0 && (
                                <IconButton
                                  onClick={() => handleViewCode(result)}
                                  size="small"
                                  title="View code"
                                >
                                  <Code fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No results match your search criteria.</Typography>
            )}
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Code View Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Student Code Submissions</DialogTitle>
        <DialogContent>
          {selectedResult?.codingSubmissions?.map((submission, index) => (
            <Box key={index} mb={3}>
              <Typography variant="h6" gutterBottom>
                Question {index + 1}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Language: {submission.language}
              </Typography>
              <SyntaxHighlighter language={submission.language} style={docco}>
                {submission.code}
              </SyntaxHighlighter>
              <Box mt={1}>
                <Chip icon={<CheckCircle />} label="Success" color="success" />
                {submission.executionTime && (
                  <Chip label={`Execution Time: ${submission.executionTime}ms`} sx={{ ml: 1 }} />
                )}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ResultPage;
