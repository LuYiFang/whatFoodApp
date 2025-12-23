import React from "react";
import { View } from "react-native";
import { Dialog, Portal, Button, TextInput } from "react-native-paper";

const AddItemDialog = ({ visible, onDismiss, value, onChangeText, onConfirm }) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Add Item</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="New item"
            value={value}
            onChangeText={onChangeText}
            mode="outlined"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            onPress={() => {
              onConfirm();
              onDismiss();
            }}
          >
            OK
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default AddItemDialog;
