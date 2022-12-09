"use strict";
const xlsx = require("xlsx");
const path = require("path");

const export_fields = [
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
  // OWNER
  {
    name: "ПІБ",
    key: "owner_fullname",
    width: 50,
  },
  {
    name: "Контактний телефон",
    key: "owner_phone",
    width: 30,
  },
  {
    name: "Дата народження",
    key: "owner_birthdate",
    width: 30,
  },
  {
    name: "Електронна пошта",
    key: "owner_mail",
    width: 30,
  },
  {
    name: "Адреса",
    key: "owner_address",
    width: 30,
  },
  {
    name: "Примітка",
    key: "owner_note",
    width: 30,
  },
  // Contract
  {
    name: "Договір",
    key: "contract_name",
    width: 30,
  },
  {
    name: "Дата укладання",
    key: "contract_start",
    width: 30,
  },
  {
    name: "Дійсний до",
    key: "contract_due",
    width: 30,
  },
  {
    name: "Примiтки",
    key: "contract_note",
    width: 30,
  },
];

module.exports = {
  async exportFields() {
    const data = await strapi.query("field").find({ _limit: -1 }, []);
    const fileName = `fields-export.xlsx`;
    const workBook = xlsx.utils.book_new();
    await this.addSheet(
      "Поля",
      export_fields.map((f) => f.name),
      (el) => export_fields.map((f) => el[f.key] || " "),
      data,
      workBook,
      export_fields.map((f) => f.width)
    );
    xlsx.writeFile(
      workBook,
      path.resolve("public", "uploads", "exports", fileName)
    );
    return { status: "OK", path: path.join("uploads", "exports", fileName) };
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
