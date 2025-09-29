const Test = require('../models/Test');
const Unit = require('../models/Unit');
// const User = require('../models/User');

exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('unit', 'title')
      .populate({
        path: 'unit',
        populate: { path: 'class', select: 'name' }
      })
      .sort({ createdAt: 'asc' });
    
    // Map the response to match frontend expectations
    const testsWithInfo = tests.map(test => ({
      _id: test._id,
      title: test.title,
      unit: test.unit._id,
      unitName: test.unit.title,
      className: test.unit.class.name,
      questions: test.questions.map(q => ({
        _id: q._id,
        text: q.text,
        options: q.options.map(o => ({
          _id: o._id,
          text: o.text
        })),
        correctAnswer: q.correctAnswer,
        solutionText: q.solutionText
      })),
      questionCount: test.questions.length,
      hasAudio: test.questions.some(q => q.questionAudio || q.options.some(o => o.audio) || q.solutionAudio)
    }));
    
    res.json(testsWithInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.createTest = async (req, res) => {
  const { title, unit: unitId, questions } = req.body;

  try {
    const parentUnit = await Unit.findById(unitId);
    if (!parentUnit) {
      return res.status(404).json({ msg: 'İlgili ünite bulunamadı' });
    }

    // Validate questions include required structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ msg: 'En az bir soru gereklidir' });
    }
    
    for (const [index, q] of questions.entries()) {
      if (!q || typeof q.text !== 'string' || q.text.trim().length === 0) {
        return res.status(400).json({ msg: `Soru ${index + 1} için 'text' alanı zorunludur` });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ msg: `Soru ${index + 1} için en az iki seçenek gereklidir` });
      }
      // Ensure each option has text
      for (const [optIdx, opt] of q.options.entries()) {
        if (!opt || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
          return res.status(400).json({ msg: `Soru ${index + 1} - Seçenek ${optIdx + 1} için 'text' zorunludur` });
        }
      }
      if (!q.correctAnswer || !q.options.some(o => o.text === q.correctAnswer)) {
        return res.status(400).json({ msg: `Soru ${index + 1} için 'correctAnswer' seçeneklerden biri olmalıdır` });
      }
      // solutionText and solutionAudio are optional
    }

    const newTest = new Test({
      title,
      unit: unitId,
      questions,
    });

    const savedTest = await newTest.save();
    
    // Return test without audio data to reduce response size
    const testResponse = {
      _id: savedTest._id,
      title: savedTest.title,
      unit: savedTest.unit,
      questionCount: savedTest.questions.length,
      hasAudio: savedTest.questions.some(q => q.questionAudio || q.options.some(o => o.audio) || q.solutionAudio)
    };
    
    res.status(201).json(testResponse);
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
    
    // Return test without audio data
    const testResponse = {
      _id: test._id,
      title: test.title,
      unit: test.unit,
      questions: test.questions.map(q => ({
        _id: q._id,
        text: q.text,
        hasQuestionAudio: !!q.questionAudio,
        options: q.options.map(o => ({
          _id: o._id,
          text: o.text,
          hasAudio: !!o.audio
        })),
        hasSolutionText: !!q.solutionText,
        hasSolutionAudio: !!q.solutionAudio,
        solutionText: q.solutionText
      })),
      hasAudio: test.questions.some(q => q.questionAudio || q.options.some(o => o.audio) || q.solutionAudio)
    };
    
    res.json(testResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getTestsByUnit = async (req, res) => {
  console.log('getTestsByUnit called with query:', req.query);
  try {
    const { unit } = req.query;
    
    if (!unit) {
      console.log('No unit ID provided');
      return res.status(400).json({ msg: 'Unit ID gerekli' });
    }

    console.log('Looking for tests with unit ID:', unit);
    const tests = await Test.find({ unit }).select('title questions');
    console.log('Found tests:', tests.length);
    
    // Map the response to match frontend expectations
    const testsWithCount = tests.map(test => ({
      _id: test._id,
      name: test.title,
      description: `Test: ${test.title}`,
      questionCount: test.questions.length,
      hasAudio: test.questions.some(q => q.questionAudio || q.options.some(o => o.audio) || q.solutionAudio)
    }));

    console.log('Sending response:', testsWithCount);
    res.json(testsWithCount);
  } catch (err) {
    console.error('Error in getTestsByUnit:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};


exports.getQuestionAudio = async (req, res) => {
  try {
    const { testId, questionId, audioType } = req.params;
    console.log('getQuestionAudio called with params:', req.params);
    
    const test = await Test.findById(testId);
    
    if (!test) {
      console.log('Test not found:', testId);
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }

    console.log('Test found:', { title: test.title, questionCount: test.questions.length });

    const question = test.questions.id(questionId);
    if (!question) {
      console.log('Question not found:', questionId);
      console.log('Available question IDs:', test.questions.map(q => q._id));
      return res.status(404).json({ msg: 'Soru bulunamadı' });
    }

    console.log('Question found:', { 
      id: question._id, 
      text: question.text, 
      hasQuestionAudio: !!question.questionAudio,
      hasSolutionAudio: !!question.solutionAudio,
      questionAudioData: question.questionAudio ? {
        hasData: !!question.questionAudio.data,
        contentType: question.questionAudio.contentType,
        size: question.questionAudio.size
      } : null
    });

    let audioData = null;
    let contentType = null;
    let size = 0;

    switch (audioType) {
      case 'question':
        if (question.questionAudio) {
          audioData = question.questionAudio.data;
          contentType = question.questionAudio.contentType;
          size = question.questionAudio.size;
          console.log('Question audio data:', { 
            hasData: !!audioData, 
            contentType, 
            size,
            dataLength: audioData ? audioData.length : 0
          });
        } else {
          console.log('Question audio object is null/undefined');
        }
        break;
      case 'solution':
        if (question.solutionAudio) {
          audioData = question.solutionAudio.data;
          contentType = question.solutionAudio.contentType;
          size = question.solutionAudio.size;
          console.log('Solution audio data:', { 
            hasData: !!audioData, 
            contentType, 
            size,
            dataLength: audioData ? audioData.length : 0
          });
        } else {
          console.log('Solution audio object is null/undefined');
        }
        break;
      default:
        console.log('Invalid audio type:', audioType);
        return res.status(400).json({ msg: 'Geçersiz audio tipi' });
    }

    if (!audioData) {
      console.log('No audio data found for type:', audioType);
      return res.status(404).json({ msg: 'Audio dosyası bulunamadı' });
    }

    console.log('Sending audio data:', size || audioData.length, 'bytes');

    // Set appropriate headers for audio streaming
    res.set({
      'Content-Type': contentType || 'audio/mpeg',
      'Content-Length': size || audioData.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    });

    // Send audio data
    res.send(audioData);
  } catch (err) {
    console.error('Error in getQuestionAudio:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getOptionAudio = async (req, res) => {
  try {
    console.log('getOptionAudio called with params:', req.params);
    const { testId, questionId, optionId } = req.params;
    const test = await Test.findById(testId);
    
    if (!test) {
      console.log('Test not found:', testId);
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }

    const question = test.questions.id(questionId);
    if (!question) {
      console.log('Question not found:', questionId);
      return res.status(404).json({ msg: 'Soru bulunamadı' });
    }

    console.log('Question options:', question.options.map((opt, idx) => ({ index: idx, id: opt._id, text: opt.text, hasAudio: !!opt.audio })));

    // Now options have IDs, so we can find by ID
    const option = question.options.id(optionId);

    if (!option) {
      console.log('Option not found for optionId:', optionId);
      return res.status(404).json({ msg: 'Seçenek bulunamadı' });
    }

    console.log('Found option:', { id: option._id, text: option.text, hasAudio: !!option.audio });

    if (!option.audio || !option.audio.data) {
      console.log('Option audio not found for option:', option.text);
      return res.status(404).json({ msg: 'Audio dosyası bulunamadı' });
    }

    console.log('Option audio found:', { contentType: option.audio.contentType, size: option.audio.size });

    // Set appropriate headers for audio streaming
    res.set({
      'Content-Type': option.audio.contentType || 'audio/mpeg',
      'Content-Length': option.audio.size || option.audio.data.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    });

    console.log('Sending option audio data:', option.audio.size || option.audio.data.length, 'bytes');
    // Send audio data
    res.send(option.audio.data);
  } catch (err) {
    console.error('Error in getOptionAudio:', err.message);
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

    // Removed completedQuestions tracking

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

// Removed completed test tracking feature

exports.updateTest = async (req, res) => {
  const { title, questions } = req.body;
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ msg: 'Test bulunamadı' });
    }

    if (typeof title === 'string') {
      test.title = title;
    }
    if (Array.isArray(questions)) {
      const existingById = new Map(test.questions.map(q => [q._id.toString(), q]));

      const mergedQuestions = questions.map(incoming => {
        const incomingId = incoming && incoming._id ? incoming._id.toString() : null;
        const existing = incomingId ? existingById.get(incomingId) : null;

        // Start with either clone of existing or empty structure
        const merged = existing ? existing.toObject() : {};

        // Basic fields
        if (typeof incoming.text === 'string') merged.text = incoming.text;
        if (typeof incoming.correctAnswer === 'string') merged.correctAnswer = incoming.correctAnswer;
        if (typeof incoming.solutionText === 'string' || incoming.solutionText === null) merged.solutionText = incoming.solutionText;

        // questionAudio: replace only if incoming contains a non-empty audio object with data
        if (incoming.questionAudio && incoming.questionAudio.data) {
          merged.questionAudio = incoming.questionAudio;
        } else if (existing && existing.questionAudio) {
          merged.questionAudio = existing.questionAudio;
        } else {
          merged.questionAudio = undefined;
        }

        // solutionAudio: same rule
        if (incoming.solutionAudio && incoming.solutionAudio.data) {
          merged.solutionAudio = incoming.solutionAudio;
        } else if (existing && existing.solutionAudio) {
          merged.solutionAudio = existing.solutionAudio;
        } else {
          merged.solutionAudio = undefined;
        }

        // Options: preserve per option audio if not provided
        if (Array.isArray(incoming.options)) {
          const existingOptionsById = existing ? new Map(existing.options.map(o => [o._id.toString(), o])) : new Map();
          merged.options = incoming.options.map(opt => {
            const optId = opt && opt._id ? opt._id.toString() : null;
            const existingOpt = optId ? existingOptionsById.get(optId) : null;
            const mergedOpt = existingOpt ? existingOpt.toObject() : {};
            if (typeof opt.text === 'string') mergedOpt.text = opt.text;
            if (opt.audio && opt.audio.data) {
              mergedOpt.audio = opt.audio;
            } else if (existingOpt && existingOpt.audio) {
              mergedOpt.audio = existingOpt.audio;
            } else {
              mergedOpt.audio = undefined;
            }
            return mergedOpt;
          });
        } else if (existing) {
          merged.options = existing.options;
        }

        return merged;
      });

      // Assign merged questions (replace entire array with merged content)
      test.questions = mergedQuestions;
    }

    const saved = await test.save();

    const testResponse = {
      _id: saved._id,
      title: saved.title,
      unit: saved.unit,
      questionCount: saved.questions.length,
      hasAudio: saved.questions.some(q => q.questionAudio || q.options.some(o => o.audio) || q.solutionAudio)
    };

    res.json(testResponse);
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