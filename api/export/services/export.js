"use strict";
const xlsx = require("xlsx");
const path = require("path");

const FIELD_TYPES = {
  owned: "Власні ділянки",
  rented: "Орендовані ділянки",
  subrent: "Cуборендовані ділянки",
};

const FIELD_CATEGORIES = {
  free: "Вільні ділянки",
  planted: "Засаджені ділянки",
};

const field_columns = [
  {
    name: "Кадастровий номер",
    key: "cadastr",
    width: 30,
  },
  {
    name: "Площа",
    key: "size",
    width: 20,
  },
  {
    name: "Розташування",
    key: "location",
    width: 30,
  },
  {
    name: "Тип",
    key: "type",
    width: 30,
  },
  {
    name: "Клас",
    key: "category",
    width: 30,
  },
];
const owner_columns = [
  {
    name: "Кадастровий номер",
    key: "cadastr",
    width: 30,
  },
  {
    name: "Власність (№договору, дата, дод.угода)",
    key: "owner_contract",
    width: 50,
  },
  {
    name: "Оренда(№договору, дата, дод.угода)",
    key: "rent_contract",
    width: 50,
  },
  {
    name: "Суборенда (№договору, дата, дод.угода)",
    key: "sub_contract",
    width: 50,
  },
  {
    name: "ПІБ",
    key: "full_name",
    width: 30,
  },
  {
    name: "Дата народження",
    key: "birth_date",
    width: 30,
  },
  {
    name: "Паспорт/ІПН",
    key: "passport",
    width: 30,
  },
  {
    name: "Місце реєстрації",
    key: "registration_address",
    width: 30,
  },
  {
    name: "Місце проживання",
    key: "address",
    width: 30,
  },
  {
    name: "Телефон",
    key: "phone",
    width: 30,
  },
  {
    name: "Примітка(родинний зв'язок, телефон)",
    key: "note",
    width: 30,
  },
];
const plantation_columns = [
  {
    name: "Кадастровий номер",
    key: "cadastr",
    width: 30,
  },
  {
    name: "№ поля",
    key: "area",
    width: 20,
  },
  {
    name: "Сорт/к-сть рядів",
    key: "varieties",
    width: 60,
  },
  {
    name: "Врожай (рік/кг)",
    key: "harvest",
    width: 30,
  },
  {
    name: "Клас (рік/I,II,III)",
    key: "category",
    width: 30,
  },
];

const getFilename = (name) =>
  name +
  "-" +
  new Date().toISOString().slice(0, 19).split(":").join("_") +
  ".xlsx";

module.exports = {
  async exportFields(query) {
    let data = await strapi.query("field").find({ ...query, _limit: -1 }, []);
    data = data.map((el) => ({
      ...el,
      type: FIELD_TYPES[el.type],
      category: FIELD_CATEGORIES[el.category],
    }));
    const filename = getFilename("field");
    return await this.exportToFile(
      data,
      field_columns,
      "Реєстр земельних ділянок",
      filename
    );
  },
  async exportOwners(query) {
    let data = await strapi
      .query("owner")
      .find({ ...query, _limit: -1 }, ["field"]);

    const contract_keys = {
      owned: "owner_contract",
      rented: "rent_contract",
      "sub-rent": "sub_contract",
      risk: "sub_contract",
    };
    data = data.map((el) => {
      const result = { cadastr: el?.field?.cadastr };
      if (el.field.type) {
        const contract = [];
        if (el.field.contract_name) contract.push(el.field.contract_name);
        if (el.field.contract_start) contract.push(el.field.contract_start);
        if (el.field.contract_note) contract.push(el.field.contract_note);
        result[contract_keys[el.field.type]] = contract.join(", ");
      }
      return { ...el, ...result };
    });
    const filename = getFilename("owners");
    return await this.exportToFile(
      data,
      owner_columns,
      "Реєстр орендодавців",
      filename
    );
  },
  async exportPlantations(query) {
    let data = await strapi
      .query("field")
      .find({ ...query, _limit: -1 }, [
        "area",
        "plantations",
        "plantations.variety",
      ]);

    data = data.map((el) => ({
      cadastr: el?.cadast,
      area: el?.area?.name,
      varieties: el.plantations.map(
        (plantation) =>
          `${plantation?.variety?.name || "Невідомо"}(${plantation.size || 0})`
      ),
    }));
    const filename = getFilename("plantations");
    return await this.exportToFile(
      data,
      plantation_columns,
      "Реєстр врожаю",
      filename
    );
  },
  async exportToFile(data, columns, sheetName, filename) {
    const workBook = xlsx.utils.book_new();
    await this.addSheet(
      sheetName,
      columns.map((f) => f.name),
      (el) => columns.map((f) => el[f.key] || " "),
      data,
      workBook,
      columns.map((f) => f.width)
    );
    xlsx.writeFile(
      workBook,
      path.resolve("public", "uploads", "exports", filename)
    );
    return { status: "OK", path: path.join("/uploads", "exports", filename) };
  },
  async addSheet(tabName, titles, format, data, workBook, widthes) {
    const workSheetColumnNames = titles;
    let workSheetData = [];
    for (let i = 0; i < data.length; i++) {
      const element = await format(data[i]);
      workSheetData.push(element);
    }
    workSheetData = [workSheetColumnNames, ...workSheetData];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, tabName);

    if (widthes && widthes.length > 0)
      workSheet["!cols"] = widthes.map((w) => ({ width: w }));
  },
};
