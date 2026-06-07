import asyncHandler from "express-async-handler";
import Result from "../models/resultModel.js";
import Question from "../models/quesModel.js";
import CodingQuestion from "../models/codingQuestionModel.js";
import Exam from "../models/examModel.js";

const ensureTeacher = (req, res) => {
  if (!req.user || req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Not authorized to access this resource");
  }
};

// @desc    Save exam result
// @route   POST /api/results
// @access  Private
const saveResult = asyncHandler(async (req, res) => {
  const { examId, answers } = req.body;

  if (!examId || !answers) {
    res.status(400);
    throw new Error("Please provide examId and answers");
  }

  // Get all questions for this exam to calculate marks
  const questions = await Question.find({ examId });

  // Calculate marks
  let totalMarks = 0;
  let correctAnswers = 0;

  for (const question of questions) {
    const userAnswer = answers[question._id.toString()];
    if (userAnswer) {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption._id.toString() === userAnswer) {
        totalMarks += question.ansmarks || 1;
        correctAnswers++;
      }
    }
  }

  // Calculate percentage
  const totalQuestions = questions.length;
  const percentage =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  const result = await Result.create({
    examId,
    userId: req.user._id,
    answers: new Map(Object.entries(answers)),
    totalMarks,
    percentage,
    showToStudent: true, // Default to true so students can view their own results
  });

  res.status(201).json({
    success: true,
    data: result,
  });
});

// @desc    Get results for a specific exam (for teachers)
// @route   GET /api/results/exam/:examId
// @access  Private
const getResultsByExamId = asyncHandler(async (req, res) => {
  ensureTeacher(req, res);
  const { examId } = req.params;

  // Get exam details to include examType
  const exam = await Exam.findOne({ examId });

  // Get MCQ results
  const results = await Result.find({ examId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  // Get coding questions and submissions
  const codingQuestions = await CodingQuestion.find({ examId });

  // Combine MCQ and coding results
  const combinedResults = results.map((result) => {
    const studentCodingSubmissions = codingQuestions
      .filter(
        (q) =>
          q.submittedAnswer &&
          q.submittedAnswer.userId?.toString() === result.userId._id.toString()
      )
      .map((q) => ({
        question: q.question,
        code: q.submittedAnswer.code,
        language: q.submittedAnswer.language,
        status: q.submittedAnswer.status,
        executionTime: q.submittedAnswer.executionTime,
      }));

    return {
      ...result.toObject(),
      examId: {
        _id: exam?._id,
        examName: exam?.examName,
        examType: exam?.examType,
      },
      codingSubmissions: studentCodingSubmissions,
    };
  });

  res.status(200).json({
    success: true,
    data: combinedResults,
  });
});

// @desc    Get results for current user
// @route   GET /api/results/user
// @access  Private
const getUserResults = asyncHandler(async (req, res) => {
  const results = await Result.find({
    userId: req.user._id,
    showToStudent: true, // Only show results that are marked as visible
  }).sort({
    createdAt: -1,
  });

  // Get coding submissions for each exam
  const resultsWithCoding = await Promise.all(
    results.map(async (result) => {
      const exam = await Exam.findOne({ examId: result.examId });
      const codingQuestions = await CodingQuestion.find({
        examId: result.examId,
        "submittedAnswer.userId": req.user._id,
      }).select("question submittedAnswer");

      return {
        ...result.toObject(),
        examId: {
          examId: result.examId, // Keep the original UUID
          _id: exam?._id,
          examName: exam?.examName,
          examType: exam?.examType,
        },
        codingSubmissions: codingQuestions.map((q) => ({
          question: q.question,
          code: q.submittedAnswer.code,
          language: q.submittedAnswer.language,
          status: q.submittedAnswer.status,
        })),
      };
    })
  );

  res.status(200).json({
    success: true,
    data: resultsWithCoding,
  });
});

// @desc    Get results for current user for a specific exam
// @route   GET /api/results/user/exam/:examId
// @access  Private
const getUserResultsByExamId = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const results = await Result.find({
    userId: req.user._id,
    examId,
    showToStudent: true,
  }).sort({
    createdAt: -1,
  });

  const resultsWithCoding = await Promise.all(
    results.map(async (result) => {
      const exam = await Exam.findOne({ examId: result.examId });
      const codingQuestions = await CodingQuestion.find({
        examId: result.examId,
        "submittedAnswer.userId": req.user._id,
      }).select("question submittedAnswer");

      return {
        ...result.toObject(),
        examId: {
          examId: result.examId,
          _id: exam?._id,
          examName: exam?.examName,
          examType: exam?.examType,
        },
        codingSubmissions: codingQuestions.map((q) => ({
          question: q.question,
          code: q.submittedAnswer.code,
          language: q.submittedAnswer.language,
          status: q.submittedAnswer.status,
        })),
      };
    })
  );

  res.status(200).json({
    success: true,
    data: resultsWithCoding,
  });
});

// @desc    Toggle showToStudent for a result
// @route   PUT /api/results/:resultId/toggle-visibility
// @access  Private (Teacher only)
const toggleResultVisibility = asyncHandler(async (req, res) => {
  ensureTeacher(req, res);

  const { resultId } = req.params;

  const result = await Result.findById(resultId);
  if (!result) {
    res.status(404);
    throw new Error("Result not found");
  }

  result.showToStudent = !result.showToStudent;
  await result.save();

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Get all results (for teachers)
// @route   GET /api/results/all
// @access  Private (Teacher only)
const getAllResults = asyncHandler(async (req, res) => {
  ensureTeacher(req, res);

  const results = await Result.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  // Get coding questions and submissions
  const codingQuestions = await CodingQuestion.find();

  // Get all exams for mapping
  const exams = await Exam.find();
  const examMap = new Map(exams.map((exam) => [exam.examId, exam]));

  // Combine MCQ and coding results
  const combinedResults = results.map((result) => {
    const exam = examMap.get(result.examId);
    const studentCodingSubmissions = codingQuestions
      .filter(
        (q) =>
          q.submittedAnswer &&
          q.submittedAnswer.userId?.toString() === result.userId._id.toString()
      )
      .map((q) => ({
        question: q.question,
        code: q.submittedAnswer.code,
        language: q.submittedAnswer.language,
        status: q.submittedAnswer.status,
        executionTime: q.submittedAnswer.executionTime,
      }));

    return {
      ...result.toObject(),
      examId: {
        examId: result.examId, // Keep the original UUID
        _id: exam?._id,
        examName: exam?.examName,
        examType: exam?.examType,
      },
      codingSubmissions: studentCodingSubmissions,
    };
  });

  res.status(200).json({
    success: true,
    data: combinedResults,
  });
});

export {
  saveResult,
  getResultsByExamId,
  getUserResults,
  toggleResultVisibility,
  getAllResults,
};
