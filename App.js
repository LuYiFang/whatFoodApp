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
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AntDesign } from "@expo/vector-icons";
import { Button, PaperProvider, Dialog, Portal } from "react-native-paper";
import _ from "lodash";
import {
  EXIST_FILE_PREFIX,
  deleteFile,
  findExistedFileList,
  paresCsv,
  readExistedCsv,
  readFile,
  writeFile,
  appendToExistedCsv,
} from "./handleFiles";
import AddItemDialog from "./components/AddItemDialog";
import * as DocumentPicker from "expo-document-picker";
import DeleteDialog from "./components/DeleteDialog";

const MULTI_DRAW_NUM = 5;
const MAX_LIST = 11;
const TOP_OFFSET = 16;

// sample CSV content for development
const SAMPLE_CSV_1 = `Sushi Place\nRamen House\nIzakaya\nCafe Latte\nBurger Joint`;

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
          <Text style={styles.iconButton}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const LongPressButton = ({ disabled, filename, handleSwitchFiles, handleLongPress }) => {
  const displayName = (filename || "").replace(EXIST_FILE_PREFIX, "").replace(".csv", "");
  const active = !disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleSwitchFiles(filename)}
      onLongPress={() => handleLongPress(filename)}
      style={[styles.tabButtonWrapper]}
    >
      <View style={[styles.tabButton, active ? styles.tabButtonActive : null]}>
        <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]} numberOfLines={1}>
          {displayName || "內建"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function App() {
  // avoid calling useSafeAreaInsets here to prevent using the hook
  // outside of SafeAreaProvider (which could cause a crash/blank screen)
  const [data, setData] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [groupItems, setGroupItems] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [currentDataFilename, setCurrentDataFilename] = useState("");
  const [longPressFilename, setLongPressFilename] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItemText, setNewItemText] = useState("");

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
     console.log('newFileList', newFileList)
    setFileList(newFileList);
    if (newFileList.length <= 0) {
      // no files found — use in-memory dummy data for development (do not write files)
      const csvData = paresCsv(SAMPLE_CSV_1);
      setData(csvData);
      setCurrentDataFilename("");
      return csvData;
    }

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
    setIsActionDialogOpen(true);
  };

  const openAddDialog = () => {
    setIsActionDialogOpen(false);
    setNewItemText("");
    setIsAddDialogOpen(true);
  };

  const openDeleteConfirm = () => {
    setIsActionDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleAddConfirm = async () => {
    if (!longPressFilename || !newItemText) return;
    const ok = await appendToExistedCsv(longPressFilename, newItemText);
    if (ok) {
      if (currentDataFilename === longPressFilename) {
        setData((prev) => [...prev, newItemText]);
      }
    }
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
    <SafeAreaProvider>
      <PaperProvider>
        <SafeAreaView style={styles.container}>
        <View style={[styles.uploadContainer, { top: 32 }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleUpload()}
            style={[styles.smallButton, styles.smallUploadButton]}
          >
            <AntDesign name="upload" style={styles.uploadIcon} />
            <Text style={styles.smallButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabContainer, { top: 32 + 48 + TOP_OFFSET }]}>
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

        <View style={[styles.listContainer, { paddingTop: 32 + 48 + 48 + TOP_OFFSET + 8 }]}>
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
            contentStyle={styles.buttonContent}
            onPress={() => handleDraw(1, data)}
          >
            1 抽
          </Button>
          <Button
            mode="contained"
            labelStyle={styles.buttonText}
            style={styles.button}
            contentStyle={styles.buttonContent}
            onPress={() => handleDraw(MULTI_DRAW_NUM, data)}
          >
            {`${MULTI_DRAW_NUM}`} 抽
          </Button>
          <TouchableOpacity onPress={handleReload}>
            <Text style={styles.iconButton}>⟲</Text>
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
        <AddItemDialog
          visible={isAddDialogOpen}
          onDismiss={() => setIsAddDialogOpen(false)}
          value={newItemText}
          onChangeText={setNewItemText}
          onConfirm={handleAddConfirm}
        />

        <Portal>
          <Dialog
            visible={isActionDialogOpen}
            onDismiss={() => setIsActionDialogOpen(false)}
          >
            <Dialog.Title>Choose action</Dialog.Title>
            <Dialog.Content>
              <Text style={{ fontSize: 16 }}>
                {`File: ${(longPressFilename || "").replace(
                  EXIST_FILE_PREFIX,
                  "",
                )}`}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setIsActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onPress={() => {
                  openAddDialog();
                }}
              >
                Add Item
              </Button>
              <Button
                onPress={() => {
                  openDeleteConfirm();
                }}
              >
                Delete File
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabScrollContainer: {},
  uploadContainer: {
    backgroundColor: "#E5E7EB",
    display: "flex",
    padding: 4,
    paddingTop: 0,
    paddingRight: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 48,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.04)",
  },
  tabContainer: {
    backgroundColor: "#E5E7EB",
    display: "flex",
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 48,
    position: "absolute",
    top: 48 + TOP_OFFSET,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(17,24,39,0.04)",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    display: "flex",
    padding: 16,
  },
  listContainer: {
    flex: 1,
    width: "100%",
    padding: 12,
    paddingTop: 48 + 48 + TOP_OFFSET,
    paddingBottom: 88,
  },
  itemAnimated: {},
  listItem: {
    padding: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  itemText: {
    fontSize: 18,
    color: "#111827",
  },
  buttonContainer: {
    backgroundColor: "transparent",
    display: "flex",
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
    zIndex: 10,
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 16,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    marginLeft: 6,
    marginRight: 6,
  },
  buttonContent: {
    height: 52,
    justifyContent: "center",
    paddingVertical: 0,
  },
  smallButton: {
    height: 40,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    alignSelf: "center",
  },
  smallButtonText: {
    color: "#111827",
    fontSize: 13,
    marginLeft: 6,
  },
  uploadIcon: {
    fontSize: 14,
    color: "#111827",
  },
  smallUploadButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  /* primary uploadButton removed to avoid name collision; use `button` for primary buttons */
  iconButton: {
    fontSize: 22,
    color: "#2563EB",
  },
  tabButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "rgba(17,24,39,0.06)",
    borderRadius: 999,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonWrapper: {
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: "#111827",
  },
  tabButtonText: {
    color: "#111827",
    fontSize: 14,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  
});
