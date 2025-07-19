const Topic = require('../models/Topic');
const Unit = require('../models/Unit');

exports.createTopic = async (req, res) => {
  const { title, content, audioUrl, unit: unitId } = req.body;

  try {
    const parentUnit = await Unit.findById(unitId);
    if (!parentUnit) {
      return res.status(404).json({ msg: 'İlgili ünite bulunamadı' });
    }

    const newTopic = new Topic({
      title,
      content,
      audioUrl,
      unit: unitId,
    });

    const savedTopic = await newTopic.save();
    res.status(201).json(savedTopic);
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
    res.json(topic);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.updateTopic = async (req, res) => {
  const { title, content, audioUrl } = req.body;

  try {
    const updatedTopic = await Topic.findByIdAndUpdate(
      req.params.id,
      { title, content, audioUrl },
      { new: true }
    );

    if (!updatedTopic) {
      return res.status(404).json({ msg: 'Konu bulunamadı' });
    }
    res.json(updatedTopic);
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