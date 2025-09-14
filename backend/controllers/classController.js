const Class = require('../models/Class');
const Unit = require('../models/Unit');

exports.createClass = async (req, res) => {
  const { name } = req.body;

  try {
    const existingClass = await Class.findOne({ name });
    if (existingClass) {
      return res.status(400).json({ msg: 'Bu isimde bir sınıf zaten mevcut' });
    }

    const newClass = new Class({
      name,
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 'asc' });
    res.json(classes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ msg: 'Sınıf bulunamadı' });
    }

    const unitsInClass = await Unit.find({ class: req.params.id }).sort({ createdAt: 'asc' });

    res.json({ class: classData, units: unitsInClass });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.updateClass = async (req, res) => {
  const { name } = req.body;

  try {
    let classToUpdate = await Class.findById(req.params.id);
    if (!classToUpdate) {
      return res.status(404).json({ msg: 'Sınıf bulunamadı' });
    }

    classToUpdate.name = name || classToUpdate.name;

    const updatedClass = await classToUpdate.save();
    res.json(updatedClass);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classToDelete = await Class.findById(req.params.id);
    if (!classToDelete) {
      return res.status(404).json({ msg: 'Sınıf bulunamadı' });
    }
    
    await classToDelete.deleteOne();
    res.json({ msg: 'Sınıf başarıyla silindi' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Sunucu Hatası');
  }
};