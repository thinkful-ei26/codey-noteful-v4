'use strict';

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');
const User = require('../models/user');

<<<<<<< HEAD
const { folders, notes, tags } = require('../db/data');
=======
const { folders, notes, tags, users } = require('../db/data');
>>>>>>> solution/3-multiuser

console.log(`Connecting to mongodb at ${MONGODB_URI}`);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
  .then(() => {
<<<<<<< HEAD
    console.info('Deleting Data...');
=======
    console.info('Delete Data');
>>>>>>> solution/3-multiuser
    return Promise.all([
      Note.deleteMany(),
      Folder.deleteMany(),
      Tag.deleteMany(),
<<<<<<< HEAD
=======
      User.deleteMany()
>>>>>>> solution/3-multiuser
    ]);
  })
  .then(() => {
    console.info('Seeding Database...');
    return Promise.all([
      Note.insertMany(notes),
      Folder.insertMany(folders),
<<<<<<< HEAD
      Tag.insertMany(tags)
=======
      Tag.insertMany(tags),
      User.insertMany(users)
>>>>>>> solution/3-multiuser
    ]);
  })
  .then(results => {
    console.log('Inserted', results);
<<<<<<< HEAD
    console.info('Disconnecting...');
=======
    console.info('Disconnecting');
>>>>>>> solution/3-multiuser
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });
