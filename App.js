import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Button as PaperButton } from "react-native-paper";
import _ from "lodash";
import { paresCsv, readFile, writeFile } from "./handleFiles";
import * as DocumentPicker from "expo-document-picker";

const MULTI_DRAW_NUM = 5;
const MAX_LIST = 11;

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

export default function App() {
  const [data, setData] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [groupItems, setGroupItems] = useState([]);

  const handleReload = () => {
    getRestaurants();
    setRestaurants([]);
  };

  const handleDraw = (num = 1) => {
    let newRestaurants = null;

    if (num >= MULTI_DRAW_NUM) {
      newRestaurants = _.sampleSize(data, MULTI_DRAW_NUM);
      setGroupItems(newRestaurants);
    } else {
      const pool = _.difference(data, restaurants);
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

      await writeFile(file.name, fileContent);
    } catch (error) {
      console.log("Error uploading file:", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.uploadContainer}>
        <PaperButton
          mode="contained"
          labelStyle={styles.buttonText}
          style={styles.button}
          onPress={() => handleUpload()}
        >
          Upload
        </PaperButton>
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
        <PaperButton
          mode="contained"
          labelStyle={styles.buttonText}
          style={styles.button}
          onPress={() => handleDraw(1)}
        >
          1 抽
        </PaperButton>
        <PaperButton
          mode="contained"
          labelStyle={styles.buttonText}
          style={styles.button}
          onPress={() => handleDraw(MULTI_DRAW_NUM)}
        >
          {`${MULTI_DRAW_NUM}`} 抽
        </PaperButton>
        <TouchableOpacity onPress={handleReload}>
          <AntDesign name="reload1" style={styles.iconButton} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadContainer: {
    backgroundColor: "#E3E294",
    display: "flex",
    padding: 8,
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 88,
    position: "absolute",
    top: 0,
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
    paddingTop: 88,
    paddingBottom: 72,
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
    height: 72,
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
  },
  buttonText: {
    fontSize: 18,
  },
  iconButton: {
    fontSize: 24,
    color: "#404078",
  },
});
