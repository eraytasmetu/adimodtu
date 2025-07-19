const Unit = require('../models/Unit');
const Class = require('../models/Class');
const Topic = require('../models/Topic');
const Test = require('../models/Test');

exports.createUnit = async (req, res) => {
  const { title, class: classId } = req.body;

  try {
    const parentClass = await Class.findById(classId);
    if (!parentClass) {
      return res.status(404).json({ msg: 'İlgili sınıf bulunamadı' });
    }

    const newUnit = new Unit({
      title,
      class: classId,
    });

    const savedUnit = await newUnit.save();
    res.status(201).json(savedUnit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getUnitsForClass = async (req, res) => {
  try {
    const units = await Unit.find({ class: req.params.classId }).sort({ createdAt: 'asc' });
    res.json(units);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ msg: 'Ünite bulunamadı' });
    }

    const topicsInUnit = await Topic.find({ unit: req.params.id }).sort({ createdAt: 'asc' });
    const testsInUnit = await Test.find({ unit: req.params.id }).sort({ createdAt: 'asc' });

    res.json({ unit, topics: topicsInUnit, tests: testsInUnit });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.updateUnit = async (req, res) => {
  const { title } = req.body;

  try {
    const updatedUnit = await Unit.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );

    if (!updatedUnit) {
      return res.status(404).json({ msg: 'Ünite bulunamadı' });
    }
    res.json(updatedUnit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const unitId = req.params.id;
    const unitToDelete = await Unit.findById(unitId);

    if (!unitToDelete) {
      return res.status(404).json({ msg: 'Ünite bulunamadı' });
    }
    
    await Topic.deleteMany({ unit: unitId });
    await Test.deleteMany({ unit: unitId });
    await unitToDelete.deleteOne();

    res.json({ msg: 'Ünite ve içeriğindeki tüm konular/testler başarıyla silindi' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};