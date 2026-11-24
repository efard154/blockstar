import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TabBar, type TabKey } from './src/components/TabBar';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { RoutinesScreen } from './src/screens/RoutinesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { EventsProvider } from './src/events';
import { ReminderSync } from './src/components/ReminderSync';
import { WidgetSync } from './src/widgets/WidgetSync';
import { HomeScreen } from './src/screens/HomeScreen';
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
  const [tab, setTab] = useState<TabKey>('home');
  const { theme, welcomeSeen, setWelcomeSeen } = useSettings();

  if (!welcomeSeen) {
    return (
      <>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
          <WelcomeScreen
            onDone={() => {
              setTab('home');
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
          {tab === 'home' && <HomeScreen onOpenTimeline={() => setTab('timeline')} />}
          {tab === 'timeline' && <TimelineScreen />}
          {tab === 'routines' && <RoutinesScreen />}
          {tab === 'stats' && <StatsScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </View>
        <TabBar active={tab} onChange={setTab} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
