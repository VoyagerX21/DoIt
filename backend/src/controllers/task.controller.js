const { z } = require('zod');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const taskBodySchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(600).optional().default(''),
  status: z.enum(['todo', 'in-progress', 'done']).optional().default('todo')
});

const createTaskSchema = z.object({
  body: taskBodySchema,
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

const updateTaskSchema = z.object({
  body: taskBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required to update'
  }),
  query: z.object({}).optional().default({}),
  params: z.object({ id: z.string().min(1) })
});

const listTaskSchema = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(50).optional().default(10),
    status: z.enum(['todo', 'in-progress', 'done']).optional(),
    search: z.string().optional()
  }),
  params: z.object({}).optional().default({})
});

const taskIdSchema = z.object({
  body: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  params: z.object({
    id: z.string().refine(
      (val) => mongoose.Types.ObjectId.isValid(val),
      { message: 'Invalid task ID format' }
    )
  })
});

const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user._id });
  return res.status(201).json({ success: true, data: task });
});

const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, status, search } = req.query;
  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter)
  ]);

  return res.status(200).json({
    success: true,
    data: tasks,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, {
    new: true,
    runValidators: true
  });

  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) throw new ApiError(404, 'Task not found');
  return res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  listTaskSchema,
  taskIdSchema,
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask
};
