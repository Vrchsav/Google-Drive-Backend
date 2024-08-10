// activityController.js

const Activity = require('../models/Activity');
const User = require('../models/User');

// Log an activity
exports.logActivity = async (req, res) => {
  try {
    const { action, targetId, targetType } = req.body;

    if (!action || !targetId || !targetType) {
      return res.status(400).json({ message: 'Action, targetId, and targetType are required' });
    }

    const activity = new Activity({
      user: req.user._id,
      action,
      target: targetId,
      targetModel: targetType
    });

    await activity.save();

    res.status(201).json({ message: 'Activity logged successfully', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error logging activity', error: error.message });
  }
};

// Get user's activities
exports.getUserActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('target', 'name')
      .lean();

    const totalActivities = await Activity.countDocuments({ user: req.user._id });

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(totalActivities / limit),
      totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};

// Get activity details
exports.getActivityDetails = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('user', 'name email')
      .populate('target', 'name');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this activity' });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity details', error: error.message });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this activity' });
    }

    await Activity.deleteOne({ _id: req.params.id });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting activity', error: error.message });
  }
};

// Get activities for admin (assuming admin role exists)
exports.getAdminActivities = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.query.userId;

    let query = {};
    if (userId) {
      query.user = userId;
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .populate('target', 'name')
      .lean();

    const totalActivities = await Activity.countDocuments(query);

    res.json({
      activities,
      currentPage: page,
      totalPages: Math.ceil(totalActivities / limit),
      totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin activities', error: error.message });
  }
};

// Get activity statistics
exports.getActivityStatistics = async (req, res) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    const stats = await Activity.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity statistics', error: error.message });
  }
};