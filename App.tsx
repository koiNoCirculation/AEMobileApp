import Start from './Start';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';

export default function App() {
  return <SQLiteProvider databaseName="itempanel.db" assetSource={{ assetId: require('./assets/itempanel.db') }}>
    <GestureHandlerRootView style={styles.container}><Start></Start></GestureHandlerRootView>
  </SQLiteProvider>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

