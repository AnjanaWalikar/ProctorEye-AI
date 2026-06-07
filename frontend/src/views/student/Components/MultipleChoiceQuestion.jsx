import React, { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useGetQuestionsQuery } from 'src/slices/examApiSlice';
import { useNavigate, useParams } from 'react-router';
import axiosInstance from '../../../axios';
import { toast } from 'react-toastify';

export default function MultipleChoiceQuestion({ questions, saveUserTestScore, submitTest, examType, examBlocked }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState(new Map());
  const navigate = useNavigate();
  const { examId } = useParams();

  const [isLastQuestion, setIsLastQuestion] = useState(false);

  useEffect(() => {
    if (questions && questions.length > 0) {
      setIsLastQuestion(currentQuestion === questions.length - 1);
    }
  }, [currentQuestion, questions]);

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleNextQuestion = async () => {
    const currentQuestionData = questions[currentQuestion];
    if (!currentQuestionData) {
      return;
    }

    let isCorrect = false;
    if (currentQuestionData.options) {
      const correctOption = currentQuestionData.options.find((option) => option.isCorrect);
      if (correctOption && selectedOption) {
        isCorrect = correctOption._id === selectedOption;
      }
    }

    const updatedAnswers = new Map(answers);
    if (currentQuestionData._id && selectedOption !== null) {
      updatedAnswers.set(currentQuestionData._id, selectedOption);
    }
    setAnswers(updatedAnswers);

    if (isCorrect) {
      setScore(score + 1);
      saveUserTestScore();
    }

    if (isLastQuestion) {
      try {
        const answersObject = Object.fromEntries(updatedAnswers);

        if (selectedOption && currentQuestionData._id) {
          answersObject[currentQuestionData._id] = selectedOption;
        }

        await axiosInstance.post(
          '/api/users/results',
          {
            examId,
            answers: answersObject,
          },
          {
            withCredentials: true,
          },
        );

        if (submitTest) {
          await submitTest();
        }
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save results');
      }
    }

    setSelectedOption(null);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <Card
      style={{
        width: '50%',
        boxShadow: '2px',
      }}
    >
      <CardContent
        style={{
          boxShadow: '4px',
          padding: '2px',
          paddingRight: '4px',
          margin: '3px',
        }}
      >
        {!questions || questions.length === 0 ? (
          <Typography variant="h6" color="textSecondary" align="center">
            No questions available for this exam.
          </Typography>
        ) : (
          <>
            <Typography variant="h4" mb={3}>
              Question {currentQuestion + 1}:
            </Typography>
            <Typography variant="body1" mb={3}>
              {questions[currentQuestion]?.question || 'Question not available'}
            </Typography>
        <Box mb={10}>
          <FormControl component="fieldset">
            <RadioGroup
              aria-label="quiz"
              name="quiz"
              value={selectedOption}
              onChange={handleOptionChange}
            >
              {questions[currentQuestion]?.options?.map((option) => (
                <FormControlLabel
                  key={option._id}
                  value={option._id}
                  control={<Radio />}
                  label={option.optionText}
                />
              )) || null}
            </RadioGroup>
          </FormControl>
        </Box>
        <Stack direction="column" spacing={2} justifyContent="space-between">
          {examBlocked && (
            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
              Exam blocked due to tab switching. You cannot continue this attempt.
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleNextQuestion}
            disabled={selectedOption === null || examBlocked}
            style={{ marginLeft: 'auto' }}
          >
            {isLastQuestion ? (examType === 'mcq' ? 'Submit Test' : 'Proceed to Coding') : 'Next Question'}
          </Button>
        </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
