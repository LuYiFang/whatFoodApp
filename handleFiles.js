import * as FileSystem from "expo-file-system";
import { parse } from "papaparse";
import _ from "lodash";

export const readFile = async (filePath) => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileContent;
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

export const paresCsv = (fileContent) => {
  try {
    const csv = parse(fileContent, { header: false, skipEmptyLines: true });
    const csvData = _.map(csv?.data || [], (v) => v[0]);
    return csvData;
  } catch (error) {
    console.error("Error parsing CSV file:", error);
  }
};

export const copyFile = async (from, to) => {
  await FileSystem.copyAsync({
    from: from,
    to: to,
  });
};

export const writeFile = async (path, content) => {
  try {
    const filePath = FileSystem.documentDirectory + path;
    await FileSystem.writeAsStringAsync(filePath, content);
    return filePath;
  } catch (error) {
    console.error("Error writing file:", error);
    return null;
  }
};
