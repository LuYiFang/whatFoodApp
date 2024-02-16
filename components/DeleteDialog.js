import { View } from "react-native";
import {
  Dialog,
  Portal,
  Text,
  Button,
  PaperProvider,
} from "react-native-paper";

const DeleteDialog = ({ visible, onDismiss, msg, onAction }) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Alert</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">Delete {msg}?</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button
            onPress={() => {
              onAction();
              onDismiss();
            }}
          >
            Yes
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
export default DeleteDialog;
