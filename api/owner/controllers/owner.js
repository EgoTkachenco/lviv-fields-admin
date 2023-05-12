"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async exportToXLSX(ctx) {
    try {
      return await strapi.services.export.exportOwners(ctx.query);
    } catch (error) {
      console.log(error);
    }
  },
};
