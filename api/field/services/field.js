"use strict";
const xlsx = require("xlsx");
const path = require("path");

module.exports = {
  async exportFields() {
    const data = await strapi.query("field").find({ _limit: -1 }, []);
    const fileName = `fields-export.xlsx`;
    const workBook = xlsx.utils.book_new();
    await this.addSheet(
      "Поля",
      ["Кадастровий номер", "Площа", "Розташування"],
      (el) => {
        return [el?.cadastr || " ", el?.size || " ", el?.location || " "];
      },
      data,
      workBook,
      [30, 20, 30]
    );
    xlsx.writeFile(
      workBook,
      path.resolve("public", "uploads", "exports", fileName)
    );
    return "OK";
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
