const Test = require('../models/Test');
const Unit = require('../models/Unit');
const User = require('../models/user');

exports.createTest = async (req, res) => {
  const { title, unit: unitId, questions } = req.body;

  try {
    const parentUnit = await Unit.findById(unitId);
    if (!parentUnit) {
      return res.status(404).json({ msg: 'İlgili ünite bulunamadı' });
    }

    const newTest = new Test({
      title,
      unit: unitId,
      questions,
    });

    const savedTest = await newTest.save();
    res.status(201).json(savedTest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).select('-questions.correctAnswer');

    if (!test) {
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }
    res.json(test);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.checkQuestionAnswer = async (req, res) => {
  const { testId, questionId } = req.params;
  const { userAnswer } = req.body;

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }

    const question = test.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ msg: 'Soru bulunamadı' });
    }

    const isCorrect = question.correctAnswer === userAnswer;

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};


exports.completeTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { completedTests: testId },
    });

    res.json({ msg: 'Test başarıyla tamamlandı olarak işaretlendi.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.updateTest = async (req, res) => {
  const { title, questions } = req.body;
  try {
    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      { title, questions },
      { new: true }
    );
    if (!updatedTest) {
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }
    res.json(updatedTest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const testToDelete = await Test.findById(req.params.id);
    if (!testToDelete) {
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }
    await testToDelete.deleteOne();
    res.json({ msg: 'Test başarıyla silindi' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};