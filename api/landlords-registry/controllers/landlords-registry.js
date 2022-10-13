"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const date_keys = [
  "contract_date",
  "state_registration_date",
  "assessment_date",
  "state_act_date",
  "passport_date",
];

module.exports = {
  async exportFromFile(ctx) {
    const data = require("../../../public/output.json");
    for (let i = 0; i < data.length; i++) {
      let element = data[i];
      Object.keys(element).forEach((key) => {
        if (date_keys.includes(key)) {
          element[key] =
            element[key] && !isNaN(new Date(element[key]).getTime())
              ? new Date(element[key])
              : null;
          // console.log("DATE", element[key]);
        } else {
          element[key] = element[key].toString();
        }
      });
      await strapi.services["landlords-registry"].create(element);
      console.log(`${i + 1} / ${data.length}`);
    }
    ctx.send("OK");
  },
};
