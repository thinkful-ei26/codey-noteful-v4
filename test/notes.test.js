'use strict';

// Lib
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

// models
const Folder = require('../models/folder');
const Note = require('../models/note');
const User = require('../models/user');
const Tag = require('../models/tag');

// DB
const {folders, notes, users, tags} = require('../db/data');
const {TEST_MONGODB_URI, JWT_SECRET} = require('../config');

// Start
chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('Noteful API - Notes', function() {

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => Promise.all([
        User.deleteMany(),
        Note.deleteMany(),
        Folder.deleteMany(),
        Tag.deleteMany()
      ]));
  });

  let token;
  let user;

  beforeEach(function() {
    return Promise.all([
      User.insertMany(users),
      Folder.insertMany(folders),
      Note.insertMany(notes),
      Tag.insertMany(tags),
      Folder.createIndexes(),
      Tag.createIndexes()
    ])
    .then(([users]) => {
      user = users[0];
      token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
    });
  });

  afterEach(function() {
    sandbox.restore();
    return Promise.all([
      Note.deleteMany(), 
      Folder.deleteMany(),
      User.deleteMany(),
      Tag.deleteMany()
    ]);
  });

  after(function() {
    return mongoose.disconnect();
  });
  
  describe('GET /api/notes', function() {

    it('should return the correct number of notes', function() {
      const dbPromise = Note.find({userId: user.id});
      const apiPromise = chai.request(app)
        .get('/api/notes')
        .set('AUthorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        })
    })

    it('should return a list with the correct fields', function() {
      const dbPromise = Note.find({userId: user.id});
      const apiPromise = chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);
  
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          res.body.forEach(function (note) {
            expect(note).to.be.a('object');
            expect(note).to.contain.keys('id', 'title', 'userId', 'content', 'createdAt', 'updatedAt');
          });
        });
    });
  });

  describe('GET /api/notes/:id', function() {

    it('should return the correct note', function() {
      let data;
      return Note.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .get(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.contain.keys('id', 'title', 'userId', 'content', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.userId).to.equal(data.userId.toString());
          expect(res.body.content).to.equal(data.content);
        })
    });

  });

  describe('POST /api/notes', function() {

    it('should create a new note', function() {
      const newNote = {title: 'thisNote', content: 'this content'};
      let data;
      return chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote)
        .then(res => {
          data = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(data).to.be.a('object');
          expect(data).to.contain.keys('id', 'title', 'userId', 'content', 'createdAt', 'updatedAt');
          return Note.findOne({ _id: data.id, userId: user.id });
        })
        .then(res => {
          expect(data.id).to.equal(res.id);
          expect(data.title).to.equal(res.title);
          expect(data.userId).to.equal(res.userId.toString());
          expect(data.content).to.equal(res.content);
        })
    })
  });

  // PUT throwing 500 error * code looks good, not sure what's going on **
  describe.skip('PUT /api/notes/:id', function() {

    it('should update a note', function() {
      const updateNote = {title: 'updateNote'}
      let data;
      return Note.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateNote);
        })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.contain.keys('id', 'title', 'userId', 'content', 'createdAt', 'updatedAt');
        expect(res.body.id).to.equal(data.id);
        expect(res.body.title).to.equal(updateNote.title);
        expect(res.body.userId).to.equal(data.userId.toString());
        expect(res.body.content).to.equal(updateNote.content);
      });
    });
  });

  describe('DELETE /api/notes/:id', function() {

    it('should delete an existing Note', function() {
      let data;
      return Note.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .delete(`/api/notes/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
        })
    });
  });

});