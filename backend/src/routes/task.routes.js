const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTaskSchema,
  updateTaskSchema,
  listTaskSchema,
  taskIdSchema,
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask
} = require('../controllers/task.controller');

const router = express.Router();
router.use(auth);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: List tasks with pagination/filter/search
 *   post:
 *     summary: Create a new task
 */
router.get('/', validate(listTaskSchema), listTasks);
router.post('/', validate(createTaskSchema), createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by id
 *   patch:
 *     summary: Update task by id
 *   delete:
 *     summary: Delete task by id
 */
router.get('/:id', validate(taskIdSchema), getTask);
router.patch('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', validate(taskIdSchema), deleteTask);

module.exports = router;
