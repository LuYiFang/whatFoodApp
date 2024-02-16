import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Button, PaperProvider } from "react-native-paper";
import _ from "lodash";
import {
  EXIST_FILE_PREFIX,
  deleteFile,
  findExistedFileList,
  paresCsv,
  readExistedCsv,
  readExistedFile,
  readFile,
  writeFile,
} from "./handleFiles";
import * as DocumentPicker from "expo-document-picker";
import DeleteDialog from "./components/DeleteDialog";

const MULTI_DRAW_NUM = 5;
const MAX_LIST = 11;
const TOP_OFFSET = 16;
const FUNCTION_BLOCK_HEIGHT = 72;

const RestaurantItem = ({
  item,
  index,
  deleteRestaurant,
  restaurants,
  animatedLatestOnly = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  let delay = index * 100;
  if (animatedLatestOnly) delay = 0;

  Animated.timing(animatedValue, {
    toValue: 1,
    duration: 300,
    delay: delay,
    useNativeDriver: true,
  }).start(() => {});

  const isAnimated = animatedLatestOnly
    ? index === restaurants.length - 1
    : true;

  const animatedStyles = isAnimated
    ? {
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-300, 0],
            }),
          },
        ],
      }
    : {};
  return (
    <Animated.View style={[styles.itemAnimated, animatedStyles]}>
      <View style={styles.listItem}>
        <Text style={styles.itemText}>{item}</Text>
        <TouchableOpacity
          onPress={() => {
            deleteRestaurant(item);
          }}
        >
          <AntDesign name="closecircle" style={styles.iconButton} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const LongPressButton = ({
  disabled,
  filename,
  handleSwitchFiles,
  handleLongPress,
}) => {
  const displayName = (filename || "")
    .replace(EXIST_FILE_PREFIX, "")
    .replace(".csv", "");

  return (
    <>
      <TouchableOpacity
        onPress={() => handleSwitchFiles(filename)}
        onLongPress={() => {
          handleLongPress(filename);
        }}
      >
        <Button
          key={displayName}
          mode="contained"
          labelStyle={styles.buttonText}
          style={{ marginRight: 5 }}
          disabled={disabled}
        >
          {displayName}
        </Button>
      </TouchableOpacity>
    </>
  );
};

export default function App() {
  const [data, setData] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [groupItems, setGroupItems] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [currentDataFilename, setCurrentDataFilename] = useState("");
  const [longPressFilename, setLongPressFilename] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    initRead().then((newData) => {
      handleDraw(MULTI_DRAW_NUM, newData);
    });
  }, []);

  useEffect(() => {
    if (!data || data.length <= 0) return;

    handleDraw(MULTI_DRAW_NUM, data);
  }, [data]);

  const initRead = async () => {
    const newFileList = await findExistedFileList();
    setFileList(newFileList);
    if (newFileList.length <= 0) return [];

    const newData = await readExistedCsv(newFileList[0]);
    setData(newData);
    setCurrentDataFilename(newFileList[0]);
    return newData;
  };

  const handleReload = async () => {
    const newData = await initRead();
    handleDraw(MULTI_DRAW_NUM, newData);
  };

  const handleDraw = (num = 1, targetData) => {
    let newRestaurants = null;

    if (num >= MULTI_DRAW_NUM) {
      newRestaurants = _.sampleSize(targetData, MULTI_DRAW_NUM);
      setGroupItems(newRestaurants);
    } else {
      const pool = _.difference(targetData, restaurants);
      if (pool.length <= 0) return;

      const newPrizeNumber = Math.floor(Math.random() * pool.length);
      newRestaurants = [...restaurants, pool[newPrizeNumber]];
      if (newRestaurants.length >= MAX_LIST) {
        newRestaurants = newRestaurants.slice(1);
      }
      setGroupItems([]);
    }

    setRestaurants(newRestaurants);
  };

  const deleteRestaurant = (restaurant) => {
    setRestaurants(_.without(restaurants, restaurant));
    setData(_.filter(data, (v) => v !== restaurant));
  };

  const handleUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
      });

      const file = res.assets[0];
      if (!file) return;

      const fileContent = await readFile(file.uri);
      if (!fileContent) return;

      const csv = paresCsv(fileContent);
      setData(csv);

      const filename = await writeFile(file.name, fileContent);
      setFileList(_.uniq([...fileList, filename]));
      setCurrentDataFilename(filename);

      handleDraw(MULTI_DRAW_NUM, csv);
    } catch (error) {
      console.log("Error uploading file:", error.message);
    }
  };

  const handleSwitchFiles = async (filename) => {
    const newData = await readExistedCsv(filename);
    setData(newData);
    setCurrentDataFilename(filename);
  };

  const handleLongPress = (filename) => {
    setLongPressFilename(filename);
    setIsDeleteDialogOpen(true);
  };

  const handleCleanFile = async () => {
    deleteFile(longPressFilename);

    const newFileList = _.filter(fileList, (v) => v !== longPressFilename);
    setFileList(newFileList);
    if (newFileList.length <= 0) {
      setData([]);
      setCurrentDataFilename("");
      return;
    }

    const newData = await readExistedCsv(newFileList[0]);
    setData(newData);
    setCurrentDataFilename(newFileList[0]);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.uploadContainer}>
          <Button
            mode="contained"
            labelStyle={styles.buttonText}
            style={[styles.button, styles.uploadButton]}
            onPress={() => handleUpload()}
          >
            Upload
          </Button>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.tabScrollContainer}
            showsHorizontalScrollIndicator={false}
          >
            {_.map(fileList, (filename) => {
              return (
                <LongPressButton
                  key={filename}
                  disabled={currentDataFilename !== filename}
                  filename={filename}
                  handleSwitchFiles={handleSwitchFiles}
                  handleLongPress={handleLongPress}
                  handleCleanFile={handleCleanFile}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={restaurants}
            keyExtractor={(item) => item}
            style={{ fontSize: 18 }}
            renderItem={({ item, index }) => {
              return (
                <RestaurantItem
                  item={item}
                  index={index}
                  deleteRestaurant={deleteRestaurant}
                  restaurants={restaurants}
                  animatedLatestOnly={groupItems.length !== restaurants.length}
                />
              );
            }}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            labelStyle={styles.buttonText}
            style={styles.button}
            onPress={() => handleDraw(1, data)}
          >
            1 抽
          </Button>
          <Button
            mode="contained"
            labelStyle={styles.buttonText}
            style={styles.button}
            onPress={() => handleDraw(MULTI_DRAW_NUM, data)}
          >
            {`${MULTI_DRAW_NUM}`} 抽
          </Button>
          <TouchableOpacity onPress={handleReload}>
            <AntDesign name="reload1" style={styles.iconButton} />
          </TouchableOpacity>
        </View>

        <DeleteDialog
          visible={isDeleteDialogOpen}
          onDismiss={() => setIsDeleteDialogOpen(false)}
          msg={(longPressFilename || "")
            .replace(EXIST_FILE_PREFIX, "")
            .replace(".csv", "")}
          onAction={() => {
            handleCleanFile();
          }}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  tabScrollContainer: {},
  uploadContainer: {
    backgroundColor: "#ffffff",
    display: "flex",
    padding: 8,
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: FUNCTION_BLOCK_HEIGHT + TOP_OFFSET,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  tabContainer: {
    backgroundColor: "#E3E294",
    display: "flex",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: FUNCTION_BLOCK_HEIGHT,
    position: "absolute",
    top: FUNCTION_BLOCK_HEIGHT + TOP_OFFSET,
    left: 0,
    right: 0,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    padding: 16,
  },
  listContainer: {
    flex: 1,
    width: "100%",
    padding: 16,
    paddingTop: FUNCTION_BLOCK_HEIGHT * 2 + TOP_OFFSET,
    paddingBottom: FUNCTION_BLOCK_HEIGHT,
  },
  itemAnimated: {},
  listItem: {
    padding: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderStyle: "solid",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: "#94C5E3",
  },
  itemText: {
    fontSize: 18,
    color: "#000000",
  },
  buttonContainer: {
    backgroundColor: "#E3E294",
    display: "flex",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: FUNCTION_BLOCK_HEIGHT,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    height: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#404078",
    width: "fit-content",
    marginLeft: 3,
    marginRight: 3,
  },
  buttonText: {
    fontSize: 18,
  },
  uploadButton: {
    backgroundColor: "#7373D9",
  },
  iconButton: {
    fontSize: 24,
    color: "#404078",
  },
});
