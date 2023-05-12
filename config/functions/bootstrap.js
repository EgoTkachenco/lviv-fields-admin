"use strict";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */

module.exports = () => {
  // strapi.services.field.exportFields();
  // migrationFields();
  // migrationRegistry();
};

const migrationFields = async () => {
  console.log("migrationFields start");
  const fields = await strapi.query("field").find({ _limit: -1 });
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const isOwner = !!field.owner_fullname;
    const data = { files: [] };
    if (isOwner) {
      let owner = {
        avatar: field.owner_avatar?.id || null,
        full_name: field.owner_fullname,
        birth_date: field.owner_birthdate,
        phone: field.owner_phone,
        email: field.owner_mail,
        address: field.owner_address,
        note: field.owner_note,
        isCurrentOwner: true,
        field: field.id,
        cadastr: field.cadastr,
      };
      owner = await strapi.query("owner").create(owner);
      data.owners = [owner.id];
    }
    if (field.contract_files && field.contract_files.length > 0)
      data.files = [...data.files, ...field.contract_files.map((f) => f.id)];
    if (field.owner_files && field.owner_files.length > 0)
      data.files = [...data.files, ...field.owner_files.map((f) => f.id)];

    try {
      await strapi.query("field").update({ id: field.id }, data);
      // console.log(data);
    } catch (error) {
      console.log("field migration error: ", error.message);
    }
  }
  console.log("migrationFields end");
};
const migrationRegistry = async () => {
  const landlords = await strapi
    .query("landlords-registry")
    .find({ _limit: -1 });
  console.log(landlords.length);

  for (let i = 0; i < landlords.length; i++) {
    const landlord = landlords[i];
    let field;
    if (landlord.cadastr)
      field = await strapi
        .query("field")
        .findOne({ cadastr: landlord.cadastr });

    if (!field) {
      console.log("cadastr not found: ", landlord.cadastr);
      continue;
    }

    // console.log(, field);
    const owner = field.owners.length > 0 ? field.owners[0] : null;
    const isOwner = !!owner;
    const isSame =
      isOwner && owner.full_name === landlord.landlord_by_public_cadastral;

    if (isOwner && isSame) {
      console.log("update owner");
      await strapi.query("owner").update(
        { id: owner.id },
        {
          passport: landlord.passport,
          passport_who: landlord.passport_who,
          passport_date: landlord.passport_date,
          iin: landlord.identifier_code,
        }
      );
      await strapi
        .query("field")
        .update({ id: field.id }, { plant_year: landlord.plant_year });
    } else if (isOwner && !isSame) {
      console.log("add owner to history");
      await strapi.query("owner").create({
        full_name: landlord.landlord_by_public_cadastral,
        note: landlord.note,
        passport: landlord.passport,
        passport_who: landlord.passport_who,
        passport_date: landlord.passport_date,
        iin: landlord.identifier_code,
        field: field.id,
        cadastr: field.cadastr,
        isCurrentOwner: false,
      });
      await strapi
        .query("field")
        .update({ id: field.id }, { plant_year: landlord.plant_year });
    } else if (!isOwner && !isSame) {
      console.log("add current owner");
      await strapi.query("owner").create({
        full_name: landlord.landlord_by_public_cadastral,
        note: landlord.note,
        passport: landlord.passport,
        passport_who: landlord.passport_who,
        passport_date: landlord.passport_date,
        iin: landlord.identifier_code,
        field: field.id,
        cadastr: field.cadastr,
        isCurrentOwner: true,
      });
      await strapi
        .query("field")
        .update({ id: field.id }, { plant_year: landlord.plant_year });
    }
  }
};
