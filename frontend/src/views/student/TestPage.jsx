import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  CircularProgress,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import axiosInstance from '../../axios';

const TestPage = () => {
  const { examId, testId } = useParams();
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const [examType, setExamType] = useState('mcq'); // mcq, coding, or both
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, resetCheatingLog } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMcqCompleted, setIsMcqCompleted] = useState(false);
  const [hasCodingQuestion, setHasCodingQuestion] = useState(false);

  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((exam) => exam.examId === examId);
      if (exam) {
        // Convert duration from minutes to seconds
        setExamDurationInSeconds(exam.duration);
        // Set exam type (default to 'mcq' if not set)
        setExamType(exam.examType || 'mcq');
        console.log('Exam duration (minutes):', exam.duration);
        console.log('Exam type:', exam.examType || 'mcq');
      }
    }
  }, [userExamdata, examId]);

  useEffect(() => {
    if (examType === 'both' || examType === 'coding') {
      const fetchCodingQuestions = async () => {
        try {
          const response = await axiosInstance.get(`/api/coding/questions/exam/${examId}`, {
            withCredentials: true,
          });
          setHasCodingQuestion(response.data.length > 0);
        } catch (error) {
          console.error('Error fetching coding questions:', error);
          setHasCodingQuestion(false);
        }
      };
      fetchCodingQuestions();
    }
  }, [examType, examId]);

  const [questions, setQuestions] = useState([]);
  const { data, isLoading, error, isError } = useGetQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const [tabViolationCount, setTabViolationCount] = useState(0);
  const [tabBlocked, setTabBlocked] = useState(false);
  const [tabWarningOpen, setTabWarningOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Exam ID:', examId);
    console.log('Questions data from API:', data);
    console.log('Questions loading:', isLoading);
    console.log('Questions error:', error);
    
    if (data) {
      setQuestions(data);
      console.log('Questions set to state:', data.length, 'questions');
    }
  }, [data, isLoading, error, examId]);

  const handleMcqCompletion = async () => {
    setIsMcqCompleted(true);
    
    // Check exam type and coding questions to determine next step
    if (examType === 'mcq' || (examType === 'both' && !hasCodingQuestion)) {
      // MCQ-only exam or Both but no coding question: submit the test immediately
      console.log('MCQ-only exam or no coding question, submitting...');
      await handleTestSubmission();
    } else if (examType === 'both' && hasCodingQuestion) {
      // Both MCQ and Coding: navigate to coding section
      console.log('Both exam type with coding question, navigating to coding...');
      resetCheatingLog(examId);
      navigate(`/exam/${examId}/codedetails`);
    }
    // If examType is 'coding', this page shouldn't be accessed at all
  };

  const handleTestSubmission = useCallback(async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      const updatedLog = {
        ...cheatingLog,
        username: userInfo.name,
        email: userInfo.email,
        examId: examId,
        noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
        multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
        cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
        prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
        externalNoiseCount: parseInt(cheatingLog.externalNoiseCount) || 0,
        tabSwitchCount: parseInt(cheatingLog.tabSwitchCount) || 0,
        screenshots: cheatingLog.screenshots || [],
      };

      console.log('Submitting cheating log:', updatedLog);

      const result = await saveCheatingLogMutation(updatedLog).unwrap();
      console.log('Cheating log saved:', result);

      toast.success('Test submitted successfully!');
      navigate('/success');
    } catch (error) {
      console.error('Error saving cheating log:', error);
      toast.error(
        error?.data?.message || error?.message || 'Failed to save test logs. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [cheatingLog, examId, navigate, saveCheatingLogMutation, userInfo, isSubmitting]);

  const saveUserTestScore = () => {
    setScore(score + 1);
  };

  const handleTabSwitchDetected = useCallback(() => {
    if (tabBlocked) return;

    setTabViolationCount((prev) => {
      const nextCount = prev + 1;
      updateCheatingLog({ tabSwitchCount: nextCount, examId });
      return nextCount;
    });
    setTabBlocked(true);
    if (!tabWarningOpen) {
      setTabWarningOpen(true);
      toast.error('Tab switching was detected. The exam has been blocked.');
    }
  }, [tabBlocked, tabWarningOpen, updateCheatingLog, examId]);

  const handleContinueExam = () => {
    setTabWarningOpen(false);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabSwitchDetected();
      }
    };

    const handleBlur = () => {
      if (document.hidden || document.visibilityState !== 'visible') {
        handleTabSwitchDetected();
      }
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleTabSwitchDetected]);

  if (isExamsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      <Box pt="3rem">
        {/* Debug Info - Remove after testing */}
        <Box p={2} bgcolor="lightyellow" mb={2}>
          <Typography variant="body2">
            <strong>Debug Info:</strong> Exam ID from URL: {examId} | Questions loaded: {questions?.length || 0} | Loading: {isLoading ? 'Yes' : 'No'}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={7} lg={7}>
            <BlankCard>
              <Box
                width="100%"
                minHeight="400px"
                boxShadow={3}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                {isLoading ? (
                  <CircularProgress />
                ) : isError ? (
                  <Box p={3}>
                    <Typography color="error" variant="h6">
                      Error loading questions: {error?.data?.message || error?.message}
                    </Typography>
                  </Box>
                ) : (
                  <MultipleChoiceQuestion
                    submitTest={isMcqCompleted ? handleTestSubmission : handleMcqCompletion}
                    questions={data || []}
                    saveUserTestScore={saveUserTestScore}
                    examType={examType}
                    examBlocked={tabBlocked}
                  />
                )}
              </Box>
            </BlankCard>
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    maxHeight="300px"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      justifyContent: 'center',
                      overflowY: 'auto',
                      height: '100%',
                    }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={isMcqCompleted ? handleTestSubmission : handleMcqCompletion}
                      examDurationInSeconds={examDurationInSeconds}
                    />
                  </Box>
                </BlankCard>
              </Grid>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    width="300px"
                    maxHeight="180px"
                    boxShadow={3}
                    display="flex"
                    flexDirection="column"
                    alignItems="start"
                    justifyContent="center"
                  >
                    <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} />
                  </Box>
                </BlankCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={tabWarningOpen} onClose={handleContinueExam} fullWidth maxWidth="sm">
        <DialogTitle>Exam Blocked</DialogTitle>
        <DialogContent>
          <Typography>
            The exam has been blocked because you switched tabs during the assessment. You may not continue this attempt.
          </Typography>
          <Typography sx={{ mt: 2 }} color="textSecondary">
            Violation count: {tabViolationCount}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/exam')} variant="contained" color="primary">
            Return to Exams
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default TestPage;
