import CommonHeader from '@/components/CommonHeader';
import CustomTabBar from '@/components/CustomTabBar';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

function TabLayout() {
  return (
    <View style={styles.container}>
      <CommonHeader 
        showMainOptions={false}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Exam',
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          href: null, // Temporarily hidden - will be added back in next launch
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: null, // Temporarily hidden - will be added back in next launch
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'Timetable',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
        }}
      />
      <Tabs.Screen
        name="my-exams"
        options={{
          title: 'My Exams',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="my-certificates"
        options={{
          title: 'My Certificates',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="exam-notifications"
        options={{
          title: 'Exam Notifications',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="exam-notification"
        options={{
          title: 'Exam Notification',
          href: null, // Hide from tab bar (detail stack)
        }}
      />
      <Tabs.Screen
        name="practice-exam"
        options={{
          title: 'Practice Exam',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="exam-category"
        options={{
          title: 'Exam Category',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="exam-category-new"
        options={{
          title: 'Exam Category New',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="practice-categories"
        options={{
          title: 'Practice Categories',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="user-profile"
        options={{
          title: 'User Profile',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="chat-screen"
        options={{
          title: 'Chat Screen',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="spy-game"
        options={{
          title: 'Spy Game',
          href: null,
        }}
      />
      <Tabs.Screen
        name="spy-room"
        options={{
          title: 'Spy Room',
          href: null,
        }}
      />
      <Tabs.Screen
        name="book-store"
        options={{
          title: 'Books',
        }}
      />
      <Tabs.Screen
        name="current-affairs"
        options={{
          title: 'Current Affairs',
          href: null,
        }}
      />
      <Tabs.Screen
        name="book-details"
        options={{
          title: 'Book Details',
          href: null,
        }}
      />
      <Tabs.Screen
        name="live-quiz-categories"
        options={{
          title: 'Live Quiz Categories',
          href: null,
        }}
      />
      <Tabs.Screen
        name="live-quiz-play"
        options={{
          title: 'Live Quiz Play',
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-partner"
        options={{
          title: 'Study Partner',
          href: null, // Navigate via home screen card
        }}
      />
      <Tabs.Screen
        name="study-partner-profile"
        options={{
          title: 'Study Partner Profile',
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-partner-discover"
        options={{
          title: 'Study Partner Discover',
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-partner-matches"
        options={{
          title: 'Study Partner Matches',
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-partner-who-liked-you"
        options={{
          title: 'Who Liked You',
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-partner-liked-user"
        options={{
          title: 'Liked User',
          href: null,
        }}
      />
      <Tabs.Screen
        name="study-partner-match"
        options={{
          title: 'Match',
          href: null,
        }}
      />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TabLayout; 
