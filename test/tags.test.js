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

describe.only('Noteful API - Tags', function() {

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
  
  describe('GET /api/tags', function() {

    it('should return the correct number of tags', function() {
      const dbPromise = Tag.find({userId: user.id});
      const apiPromise = chai.request(app)
        .get('/api/tags')
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
      const dbPromise = Tag.find({userId: user.id});
      const apiPromise = chai.request(app)
        .get('/api/tags')
        .set('Authorization', `Bearer ${token}`);
  
      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          res.body.forEach(function (tag) {
            expect(tag).to.be.a('object');
            expect(tag).to.have.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          });
        });
    });
  });

  describe('GET /api/tags/:id', function() {

    it('should return the correct tag', function() {
      let data;
      return Tag.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`)
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

  describe('POST /api/tags', function() {

    it('should create a new tag', function() {
      const newTag = {name: 'thisTag'}
      let data;
      return chai.request(app)
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send(newTag)
        .then(res => {
          data = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(data).to.be.a('object');
          expect(data).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          return Tag.findOne({ _id: data.id, userId: user.id });
        })
        .then(res => {
          expect(data.id).to.equal(res.id);
          expect(data.name).to.equal(res.name);
          expect(data.userId).to.equal(res.userId.toString());
        })
    });
  });

  describe('PUT /api/tags/:id', function() {

    it('should update a tag', function() {
      const updateTag = {name: 'newName'}
      let data;
      return Tag.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .put(`/api/tags/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateTag)
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.all.keys('id', 'name', 'userId', 'createdAt', 'updatedAt');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(updateTag.name);
          expect(res.body.userId).to.equal(data.userId.toString());
        })
    });
  });

  describe('DELETE /api/tags/:id', function() {

    it('should delete an existing tag', function() {
      let data;
      return Tag.findOne({userId: user.id})
        .then(_data => {
          data = _data;
          return chai.request(app)
            .delete(`/api/tags/${data.id}`)
            .set('Authorization', `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(204);
          expect(res.body).to.be.empty;
        })
    });
  });
});