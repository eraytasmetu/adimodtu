const Topic = require('../models/Topic');
const Unit = require('../models/Unit');

exports.getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find()
      .populate('unit', 'title')
      .populate({
        path: 'unit',
        populate: { path: 'class', select: 'name' }
      })
      .sort({ createdAt: 'asc' });

    // Map the response to match frontend expectations
    const topicsWithInfo = topics.map(topic => ({
      _id: topic._id,
      title: topic.title,
      content: topic.content,
      unit: topic.unit._id,
      unitName: topic.unit.title,
      className: topic.unit.class.name,
      hasAudio: !!topic.audio,
      audioSize: topic.audio?.size,
      audioFilename: topic.audio?.filename,
      hasTitleAudio: !!topic.titleAudio,
      titleAudioSize: topic.titleAudio?.size,
      titleAudioFilename: topic.titleAudio?.filename
    }));

    res.json(topicsWithInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.createTopic = async (req, res) => {
  const { title, content, unit: unitId } = req.body;
  const audioFile = req.files?.['audio']?.[0];
  const titleAudioFile = req.files?.['titleAudio']?.[0];

  try {
    const parentUnit = await Unit.findById(unitId);
    if (!parentUnit) {
      return res.status(404).json({ msg: 'İlgili ünite bulunamadı' });
    }

    if (!audioFile) {
      return res.status(400).json({ msg: 'Audio dosyası gerekli' });
    }

    const newTopic = new Topic({
      title,
      content,
      audio: {
        data: audioFile.buffer,
        contentType: audioFile.mimetype,
        filename: audioFile.originalname,
        size: audioFile.size
      },
      titleAudio: titleAudioFile ? {
        data: titleAudioFile.buffer,
        contentType: titleAudioFile.mimetype,
        filename: titleAudioFile.originalname,
        size: titleAudioFile.size
      } : undefined,
      unit: unitId,
    });

    const savedTopic = await newTopic.save();

    // Return topic without audio data to reduce response size
    const topicResponse = {
      _id: savedTopic._id,
      title: savedTopic.title,
      content: savedTopic.content,
      unit: savedTopic.unit,
      hasAudio: true,
      audioSize: savedTopic.audio.size,
      audioFilename: savedTopic.audio.filename,
      hasTitleAudio: !!savedTopic.titleAudio,
      titleAudioSize: savedTopic.titleAudio?.size,
      titleAudioFilename: savedTopic.titleAudio?.filename
    };

    res.status(201).json(topicResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ msg: 'Konu bulunamadı' });
    }

    // Removed topic listening tracking

    // Return topic without audio data
    const topicResponse = {
      _id: topic._id,
      title: topic.title,
      content: topic.content,
      unit: topic.unit,
      hasAudio: true,
      audioSize: topic.audio.size,
      audioFilename: topic.audio.filename,
      hasTitleAudio: !!topic.titleAudio,
      titleAudioSize: topic.titleAudio?.size,
      titleAudioFilename: topic.titleAudio?.filename
    };

    res.json(topicResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getTopicsByUnit = async (req, res) => {
  console.log('getTopicsByUnit called with query:', req.query);
  try {
    const { unit } = req.query;

    if (!unit) {
      console.log('No unit ID provided');
      return res.status(400).json({ msg: 'Unit ID gerekli' });
    }

    console.log('Looking for topics with unit ID:', unit);
    const topics = await Topic.find({ unit }).select('title content audio.size audio.filename titleAudio.size titleAudio.filename');
    console.log('Found topics:', topics.length);

    // Map the response to match frontend expectations
    const topicsWithDescription = topics.map(topic => ({
      _id: topic._id,
      name: topic.title,
      description: topic.content,
      hasAudio: true,
      audioSize: topic.audio.size,
      audioFilename: topic.audio.filename,
      hasTitleAudio: !!topic.titleAudio,
      titleAudioSize: topic.titleAudio?.size,
      titleAudioFilename: topic.titleAudio?.filename
    }));

    console.log('Sending response:', topicsWithDescription);
    res.json(topicsWithDescription);
  } catch (err) {
    console.error('Error in getTopicsByUnit:', err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

// New endpoint to serve audio files
exports.getTopicAudio = async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ msg: 'Konu bulunamadı' });
    }

    // Check if we are requesting title audio
    const isTitleAudio = req.path.includes('title-audio');
    const audioData = isTitleAudio ? topic.titleAudio : topic.audio;

    if (!audioData || !audioData.data) {
      return res.status(404).json({ msg: 'Audio dosyası bulunamadı' });
    }

    // Set appropriate headers for audio streaming
    res.set({
      'Content-Type': audioData.contentType,
      'Content-Length': audioData.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000'
    });

    // Send audio data
    res.send(audioData.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.updateTopic = async (req, res) => {
  const { title, content } = req.body;
  const audioFile = req.files?.['audio']?.[0];
  const titleAudioFile = req.files?.['titleAudio']?.[0];

  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ msg: 'Konu bulunamadı' });
    }

    // Update scalar fields
    if (typeof title === 'string') topic.title = title;
    if (typeof content === 'string') topic.content = content;

    // Only replace audio if a new file is provided, otherwise preserve existing audio
    if (audioFile) {
      topic.audio = {
        data: audioFile.buffer,
        contentType: audioFile.mimetype,
        filename: audioFile.originalname,
        size: audioFile.size
      };
    }

    if (titleAudioFile) {
      topic.titleAudio = {
        data: titleAudioFile.buffer,
        contentType: titleAudioFile.mimetype,
        filename: titleAudioFile.originalname,
        size: titleAudioFile.size
      };
    }

    const saved = await topic.save();

    const topicResponse = {
      _id: saved._id,
      title: saved.title,
      content: saved.content,
      unit: saved.unit,
      hasAudio: !!saved.audio,
      audioSize: saved.audio?.size,
      audioFilename: saved.audio?.filename,
      hasTitleAudio: !!saved.titleAudio,
      titleAudioSize: saved.titleAudio?.size,
      titleAudioFilename: saved.titleAudio?.filename
    };

    res.json(topicResponse);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const topicToDelete = await Topic.findById(req.params.id);

    if (!topicToDelete) {
      return res.status(404).json({ msg: 'Konu bulunamadı' });
    }

    await topicToDelete.deleteOne();

    res.json({ msg: 'Konu başarıyla silindi' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};