import * as FileSystem from "expo-file-system";
import { parse } from "papaparse";
import _ from "lodash";

export const EXIST_FILE_PREFIX = "foodFile_";

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

export const readExistedFile = async (filename) => {
  const filePath = FileSystem.documentDirectory + filename;
  return await readFile(filePath);
};

export const readExistedCsv = async (filename) => {
  const fileContent = await readExistedFile(filename);
  if (!fileContent) return;

  return paresCsv(fileContent);
};

export const findExistedFileList = async () => {
  const fileList = await FileSystem.readDirectoryAsync(
    FileSystem.documentDirectory,
  );

  return _.filter(
    fileList,
    (v) => _.startsWith(v, EXIST_FILE_PREFIX) && _.endsWith(v, ".csv"),
  );
};

export const paresCsv = (fileContent) => {
  try {
    const csv = parse(fileContent, { header: false, skipEmptyLines: true });
    const csvData = _.map(csv?.data || [], (v) => v[0]);
    return csvData;
  } catch (error) {
    console.error("Error parsing CSV file:", error);
    return [];
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
    const filename = EXIST_FILE_PREFIX + path;
    const filePath = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(filePath, content);
    return filename;
  } catch (error) {
    console.error("Error writing file:", error);
    return null;
  }
};
