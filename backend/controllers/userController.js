const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    user = new User({ name, email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Geçersiz kullanıcı bilgileri' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Geçersiz kullanıcı bilgileri' });
    }

    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.trackTopicListening = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    // Ensure listenedTopics array exists
    if (!req.user.listenedTopics) {
      req.user.listenedTopics = [];
    }
    
    // Check if topic is already tracked
    const existingEntry = req.user.listenedTopics.find(
      entry => entry.topicId.toString() === topicId
    );
    
    if (!existingEntry) {
      req.user.listenedTopics.push({
        topicId: topicId,
        listenedAt: new Date()
      });
      await req.user.save();
    }
    
    res.json({ msg: 'Topic listening tracked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.trackQuestionCompletion = async (req, res) => {
  try {
    const { questionId, testId, isCorrect } = req.body;
    
    // Ensure completedQuestions array exists
    if (!req.user.completedQuestions) {
      req.user.completedQuestions = [];
    }
    
    // Check if question is already tracked
    const existingEntry = req.user.completedQuestions.find(
      entry => entry.questionId.toString() === questionId
    );
    
    if (!existingEntry) {
      req.user.completedQuestions.push({
        questionId: questionId,
        testId: testId,
        isCorrect: isCorrect,
        completedAt: new Date()
      });
      await req.user.save();
    }
    
    res.json({ msg: 'Question completion tracked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getUserProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('listenedTopics.topicId', 'title')
      .populate('completedQuestions.questionId', 'text')
      .populate('completedQuestions.testId', 'title');
    
    // Ensure progress arrays exist (for existing users)
    const progress = {
      listenedTopics: user.listenedTopics || [],
      completedQuestions: user.completedQuestions || [],
      completedTests: user.completedTests || [],
      completedTopics: user.completedTopics || []
    };
    
    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};