import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PageOverlay } from './src/components/PageOverlay';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { RoutinesScreen } from './src/screens/RoutinesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { EventsProvider } from './src/events';
import { ReminderSync } from './src/components/ReminderSync';
import { WidgetSync } from './src/widgets/WidgetSync';
import { SettingsProvider, useSettings } from './src/settings';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SettingsProvider>
          <EventsProvider>
            <Root />
          </EventsProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Root() {
  const [page, setPage] = useState<'routines' | 'settings' | null>(null);
  const closePage = () => setPage(null);
  const { theme, welcomeSeen, setWelcomeSeen } = useSettings();

  if (!welcomeSeen) {
    return (
      <>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
          <WelcomeScreen
            onDone={() => {
              setPage(null);
              setWelcomeSeen(true);
            }}
          />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      {/* Mounted after the welcome screen so the permission prompt doesn't interrupt it */}
      <ReminderSync />
      <WidgetSync />
      <SafeAreaView
        style={[styles.root, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.content}>
          <TimelineScreen onOpenRoutines={() => setPage('routines')} onOpenSettings={() => setPage('settings')} />

          <PageOverlay visible={page === 'routines'} onClose={closePage}>
            <SafeAreaView style={styles.root} edges={['bottom']}>
              <RoutinesScreen onClose={closePage} />
            </SafeAreaView>
          </PageOverlay>

          <PageOverlay visible={page === 'settings'} onClose={closePage}>
            <SafeAreaView style={styles.root} edges={['bottom']}>
              <SettingsScreen onClose={closePage} />
            </SafeAreaView>
          </PageOverlay>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
