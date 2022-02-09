const http = require('http');
const express = require('express');
const yup = require('yup');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const hostName = 'fm_mongo' ; //'172.17.0.3';

mongoose.connect(`mongodb://${hostName}:27017/fm_mongoose`).catch((error) => {
  console.log(error);
  process.exit(1);
});

const emailSchema = yup.string().email().required();

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'must be !'],
      validate: {
        validator: (v) => /[A-Z][a-z\s]{5,200}/.test(v),
        message: '{VALUE} must be !',
      },
    },
    isDone: { type: Boolean, default: false },
    dateAt: { type: Date, default: Date.now },
    author: {
      name: { type: String, required: true },
      age: {
        type: Number,
        default: null,
        validate: {
          validator: (v) => v > 0,
          message: '{VALUE} must be great than 0',
        },
      },
      email: {
        type: String,
        required: true,
        validate: { validator: (v) => emailSchema.isValid(v) },
      },
    },
  },
  { versionKey: false, timestamps: true }
);

const commentSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
  },
  { versionKey: false }
);

const Task = mongoose.model('Task', taskSchema);
const Comment = mongoose.model('Comment', commentSchema);

const app = express();
app.use(express.json());

app.post('/', async (req, res, next) => {
  try {
    const { body } = req;
    const newTask = await Task.create(body);
    res.status(201).send(newTask);
  } catch (error) {
    next(error);
  }
});
app.get('/', async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).send(tasks);
  } catch (error) {
    next(error);
  }
});
app.patch('/:taskId', async (req, res, next) => {
  try {
    const {
      body,
      params: { taskId },
    } = req;
    const updatedTask = await Task.findOneAndUpdate({ _id: taskId }, body, {
      new: true,
    });
    res.send(updatedTask);
  } catch (error) {
    next(error);
  }
});
app.delete('/:taskId', async (req, res, next) => {
  try {
    const {
      params: { taskId },
    } = req;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (deletedTask) {
      res.send(deletedTask);
    } else {
      res.sendStatus(404, 'Task not found');
    }
  } catch (error) {
    next(error);
  }
});
app.post('/:taskId/comments', async (req, res, next) => {
  try {
    const {
      body,
      params: { taskId },
    } = req;
    const newComment = await Comment.create({ ...body, task: taskId });
    res.status(201).send(newComment);
  } catch (error) {
    next(error);
  }
});
app.get('/:taskId/comments', async (req, res, next) => {
  try {
    const {
      params: { taskId },
    } = req;
    const comments = await Comment.find({ task: taskId });
    res.status(200).send(comments);
  } catch (error) {
    next(error);
  }
});
app.get('/comments', async (req, res, next) => {
  try {
    Comment.find()
      .populate('task')
      .exec((error, comments) => {
        if (error) {
          throw error;
        }
        res.send(comments);
      });
  } catch (error) {
    next(error);
  }
});

const server = http.createServer(app);
const PORT = process.env.PORT || 8080;
console.log(PORT);
server.listen(PORT, () => {
  console.log('Server started on PORT = ', PORT);
});
