"use strict";
const { parseMultipartData } = require("strapi-utils");
const _ = require("lodash");

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.message.search(ctx.query);
    } else {
      entities = await strapi.services.message.find(ctx.query);
    }

    return entities.map((entity) =>
      _.pick(entity, [
        "id",
        "content",
        "type",
        "sender.id",
        "sender.username",
        "created_at",
        "file",
      ])
    );
  },
  async create(ctx) {
    let entity;
    ctx.request.body.sender = ctx.state.user.id;
    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.message.create(data, { files });
    } else {
      entity = await strapi.services.message.create(ctx.request.body);
    }
    entity.sender = ctx.state.user;
    return _.pick(entity, [
      "id",
      "content",
      "type",
      "sender.id",
      "sender.username",
      "created_at",
      "file",
    ]);
  },
};
