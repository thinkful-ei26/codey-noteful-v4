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

// DB
const {folders, notes, users} = require('../db/data');
const {TEST_MONGODB_URI, JWT_SECRET} = require('../config');

// Start
chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe('Noteful API - Folders', function() {

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => Promise.all([
        User.deleteMany(),
        Note.deleteMany(),
        Folder.deleteMany()
      ]));
  });

  let token;
  let user;

  beforeEach(function() {
    return Promise.all([
      User.insertMany(users),
      Folder.insertMany(folders),
      Note.insertMany(notes),
      Folder.createIndexes()
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
      User.deleteMany()
    ]);
  });

  after(function() {
    return mongoose.disconnect();
  });
  
  describe('GET /api/folders', function() {

    it('should return the correct number of folders', function() {
      const dbPromise = Folder.find({userId: user.id});
      const apiPromise = chai.request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`);

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return a list with the correct fields', function() {
      const dbPromise = Folder.find({userId: user.id});
      const apiPromise = chai.request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`);
  
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          res.body.forEach(function (folder) {
            expect(folder).to.be.a('object');
            expect(folder).to.have.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          });
        });
    });
  });

  describe('GET /api/folders/:id', function() {

    it('should return the correct folder', function() {
      let data;
      return Folder.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/folders/${data.id}`)
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(res.body.userId).to.equal(data.userId.toString());
        })
    });
  });

  describe('POST /api/folders', function() {

    it('should create a new folder', function() {
      const newFolder = {name: 'thisFolder'}
      let data;
      return chai.request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send(newFolder)
        .then(res => {
          data = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(data).to.be.a('object');
          expect(data).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          return Folder.findOne({ _id: data.id, userId: user.id });
        })
        .then(res => {
          expect(data.id).to.equal(res.id);
          expect(data.name).to.equal(res.name);
          expect(data.userId).to.equal(res.userId.toString());
        })
    });
  });

  describe('PUT /api/folders/:id', function() {

    it('should update a folder', function() {
      const updateFolder = {name: 'newName'}
      let data;
      return Folder.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/folders/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateFolder)
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateFolder.name);
          expect(res.body.userId).to.equal(data.userId.toString());
        })
    });
  });

  describe('DELETE /api/folders/:id', function() {

    it('should delete an existing folder', function() {
      let data;
      return Folder.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .delete(`/api/folders/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
        })
    });
  });

});
