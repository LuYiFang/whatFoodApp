import * as FS from "expo-file-system/legacy";
import { parse } from "papaparse";
import _ from "lodash";

export const EXIST_FILE_PREFIX = "foodFile_";

// hardcoded development data (in-memory)
const HARDCODED_FILENAME = "builtin.csv";
const HARDCODED_ITEMS = [
  "Sushi Place",
  "Ramen House",
  "Izakaya",
  "Cafe Latte",
  "Burger Joint",
  "Pizza Corner",
  "Pasta Bistro",
  "Salad Bar",
  "Taco Stand",
  "BBQ Grill",
];
let inMemoryData = [...HARDCODED_ITEMS];

export const readFile = async (filePath) => {
  try {
    const fileContent = await FS.readAsStringAsync(filePath, {
      encoding: FS.EncodingType.UTF8,
    });

    return fileContent;
  } catch (error) {
    console.error("Error reading file:", error);
  }
};

export const readExistedFile = async (filename) => {
  const filePath = FS.documentDirectory + filename;
  return await readFile(filePath);
};

export const readExistedCsv = async (filename) => {
  const fileContent = await readExistedFile(filename);
  if (!fileContent) return;

  return paresCsv(fileContent);
};

export const findExistedFileList = async () => {
  const fileList = await FS.readDirectoryAsync(
    FS.documentDirectory,
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
  await FS.copyAsync({
    from: from,
    to: to,
  });
};

export const writeFile = async (path, content) => {
  try {
    const filename = EXIST_FILE_PREFIX + path;
    // in dev mode, we won't persist to disk; update in-memory if writing builtin
    if (path === HARDCODED_FILENAME) {
      inMemoryData = (content || "").split(/\r?\n/).filter((v) => v);
    }
    try {
      await FS.writeAsStringAsync(FS.documentDirectory + filename, content);
    } catch (e) {
      // ignore write errors in dev
    }
    return filename;
  } catch (error) {
    console.error("Error writing file:", error);
    return null;
  }
};

export const deleteFile = async (filename) => {
  try {
    // if deleting builtin, clear in-memory data
    if (filename === EXIST_FILE_PREFIX + HARDCODED_FILENAME) {
      inMemoryData = [];
      return true;
    }
    const filePath = FS.documentDirectory + filename;
    await FS.deleteAsync(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

export const appendToExistedCsv = async (filename, newItem) => {
  try {
    // append to in-memory data for the builtin file
    if (filename === EXIST_FILE_PREFIX + HARDCODED_FILENAME) {
      const trimmed = (newItem || "").toString();
      inMemoryData.push(trimmed);
      return true;
    }
    // fallback: attempt to append to real file
    const filePath = FS.documentDirectory + filename;
    let content = "";
    try {
      content = await FS.readAsStringAsync(filePath, {
        encoding: FS.EncodingType.UTF8,
      });
    } catch (err) {
      content = "";
    }
    const trimmed = (newItem || "").toString();
    const newLine = trimmed.includes("\n") ? trimmed : `${trimmed}`;
    if (content && !content.endsWith("\n")) content = content + "\n";
    const newContent = content + newLine + "\n";
    await FS.writeAsStringAsync(filePath, newContent, {
      encoding: FS.EncodingType.UTF8,
    });
    return true;
  } catch (error) {
    console.error("Error appending to CSV:", error);
    return false;
  }
};
