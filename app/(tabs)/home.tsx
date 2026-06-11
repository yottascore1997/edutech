import { apiFetchAuth } from '@/constants/api';
import { HomeTheme } from '@/constants/HomeTheme';
import { useAuth } from '@/context/AuthContext';
import { useCategory } from '@/context/CategoryContext';
import { useWallet } from '@/context/WalletContext';
import { applyExamFilters } from '@/utils/examFilter';
import {
  mergeJoinedLiveExamsIntoExamList,
  syncJoinedLiveExamIds,
} from '@/utils/joinedLiveExams';
import { useRouter } from 'expo-router';
import { useScreenLoadState } from '@/hooks/useScreenLoadState';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import HomeScreenUI from '../../components/home/HomeScreenUI';
import ExamNotificationsSection from '../../components/ExamNotificationsSection';
import HomePracticeSection from '../../components/home/HomePracticeSection';
import HomePyqBanner from '../../components/home/HomePyqBanner';
import QuestionOfTheDayPreview from '../../components/QuestionOfTheDayPreview';
import StudentSuccessStories from '../../components/StudentSuccessStories';
import TopPerformersSection from '../../components/TopPerformersSection';
import HomeFeatureGrid from '../../components/HomeFeatureGrid';
import StudentsSelectedBanner from '../../components/StudentsSelectedBanner';
import PreviousYearPapersPreview from '../../components/PreviousYearPapersPreview';
import HomeCurrentAffairsSection from '../../components/home/HomeCurrentAffairsSection';

export default function HomeScreen() {
  const { user } = useAuth();
  const { refreshWalletAmount } = useWallet();
  const { selectedCategory } = useCategory();
  const router = useRouter();

  const [exams, setExams] = useState<any[]>([]);
  const [joinedLiveExamIds, setJoinedLiveExamIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyToppersRefreshTrigger, setWeeklyToppersRefreshTrigger] = useState(0);
  const { beginFetch, endFetch } = useScreenLoadState();

  const examSliderRef = useRef<FlatList<any>>(null);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const autoScrollInterval = useRef<ReturnType<typeof setInterval>>(null);

  const activeExams = applyExamFilters(exams, {
    category: selectedCategory || undefined,
    includeExpired: false,
    userId: user?.id,
    joinedExamIds: joinedLiveExamIds,
  });
  const featuredExams = activeExams.slice(0, 5);

  const startAutoScroll = () => {
    autoScrollInterval.current = setInterval(() => {
      if (featuredExams.length > 1) {
        const nextIndex = (currentExamIndex + 1) % featuredExams.length;
        examSliderRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0,
        });
        setCurrentExamIndex(nextIndex);
      }
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  };

  const fetchExams = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      beginFetch(setLoading, setRefreshing, { refresh: exams.length > 0 });
      const response = await apiFetchAuth('/student/exams', user.token);
      const joinedIds = user.id
        ? await syncJoinedLiveExamIds(user.token, String(user.id))
        : [];
      setJoinedLiveExamIds(joinedIds);

      if (response.ok) {
        const list = Array.isArray(response.data) ? response.data : [];
        const merged = user.token
          ? await mergeJoinedLiveExamsIntoExamList(list, joinedIds, user.token)
          : list;
        setExams(merged);
      }
    } catch (error) {
          } finally {
      endFetch(setLoading, setRefreshing);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchExams();
      setWeeklyToppersRefreshTrigger((t) => t + 1);
    } catch (error) {
          } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshWalletAmount();
  }, [refreshWalletAmount]);

  useEffect(() => {
    fetchExams();
    if (featuredExams.length > 0) {
      startAutoScroll();
      return () => stopAutoScroll();
    }
  }, [user, featuredExams.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.token) fetchExams();
    }, 3600000);
    return () => clearInterval(interval);
  }, [user?.token]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[HomeTheme.primary]}
          tintColor={HomeTheme.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <HomeScreenUI
        userName={user?.name}
        selectedCategory={selectedCategory}
        exams={featuredExams}
        loading={loading}
        examSliderRef={examSliderRef}
        currentExamIndex={currentExamIndex}
        onExamIndexChange={setCurrentExamIndex}
        onScrollBeginDrag={stopAutoScroll}
        onScrollEndDrag={startAutoScroll}
        onStudyPartnerPress={() => router.push('/(tabs)/study-partner' as any)}
      />

      <QuestionOfTheDayPreview />

      <HomePracticeSection />

      <HomePyqBanner />

      <HomeFeatureGrid />

      <StudentsSelectedBanner />

      <TopPerformersSection refreshTrigger={weeklyToppersRefreshTrigger} />

      <StudentSuccessStories />

      <PreviousYearPapersPreview />

      <HomeCurrentAffairsSection />

      <ExamNotificationsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HomeTheme.bg,
  },
  content: {
    paddingBottom: 96,
  },
});
