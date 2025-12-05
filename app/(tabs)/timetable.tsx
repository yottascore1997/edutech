import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, LayoutAnimation, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetchAuth } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function formatTime(dateString: string) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mins = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${mins} ${ampm}`;
}

function formatTimeShort(dateString: string) {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mins = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${mins}`;
}

// Helper to get week days from a start date
function getWeekDays(startDate: Date) {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

// Get calendar days for current month
function getCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    days.push(day);
  }
  return days;
}

// Faint background colors for schedule cards
const scheduleBackgroundColors = [
  '#f0f4ff', // Light blue
  '#fff0f4', // Light pink
  '#f0fff4', // Light green
  '#fff4f0', // Light orange
  '#f4f0ff', // Light purple
  '#fffff0', // Light yellow
  '#f0ffff', // Light cyan
  '#fff0f0', // Light red
];

export default function TimetableScreen() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Time picker states
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [activeTimeSlot, setActiveTimeSlot] = useState<number>(-1);
  const [activeTimeType, setActiveTimeType] = useState<'start' | 'end'>('start');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isWeekly, setIsWeekly] = useState(false);
  const [slots, setSlots] = useState<any[]>([{
    day: 1,
    startTime: '',
    endTime: '',
    subject: '',
    topic: '',
    notes: '',
    reminder: false,
  }]);

  const calendarDays = getCalendarDays(currentMonth);
  const weekDays = getWeekDays(selectedDate);

  // Group slots by day
  const slotsByDay = weekDays.map(day => ({
    date: day,
    slots: timetables.flatMap(t => t.slots.filter((s: any) => {
      const slotDate = new Date(s.startTime);
      return slotDate.toDateString() === day.toDateString();
    }))
  }));

  // Get selected date's slots
  const selectedDateSlots = timetables.flatMap(t => t.slots.filter((s: any) => {
    const slotDate = new Date(s.startTime);
    return (
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate()
    );
  })).sort((a, b) => new Date(a.startTime).getTime() - new Date(a.startTime).getTime());

  // Get upcoming plans (next 7 days)
  const upcomingPlans = timetables.flatMap(t => t.slots.filter((s: any) => {
    const slotDate = new Date(s.startTime);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return slotDate >= today && slotDate <= nextWeek;
  })).sort((a, b) => new Date(a.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 3);

  useEffect(() => {
    fetchTimetable();
    // Simple fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetchAuth('/student/timetable', user?.token || '');
      if (res.ok) {
        setTimetables(res.data);
      } else {
        setError('Failed to load timetable');
      }
    } catch (e) {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSlot = () => {
    setSlots(prev => [...prev, {
      day: 1,
      startTime: '',
      endTime: '',
      subject: '',
      topic: '',
      notes: '',
      reminder: false,
    }]);
  };

  const handleRemoveSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSlotChange = (idx: number, key: string, value: any) => {
    setSlots(prev => prev.map((slot, i) => i === idx ? { ...slot, [key]: value } : slot));
  };

  // Time picker handlers
  const handleTimePress = (slotIndex: number, timeType: 'start' | 'end') => {

    setActiveTimeSlot(slotIndex);
    setActiveTimeType(timeType);
    if (timeType === 'start') {

      setShowStartTimePicker(true);
    } else {

      setShowEndTimePicker(true);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedTime && activeTimeSlot >= 0) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const key = activeTimeType === 'start' ? 'startTime' : 'endTime';
      handleSlotChange(activeTimeSlot, key, timeString);
    }
  };

  // Get current time value for picker
  const getCurrentTimeValue = () => {
    if (activeTimeSlot >= 0) {
      const slot = slots[activeTimeSlot];
      const timeString = activeTimeType === 'start' ? slot.startTime : slot.endTime;
      
      if (timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }
    return new Date();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsWeekly(false);
    setSlots([{
      day: 1,
      startTime: '',
      endTime: '',
      subject: '',
      topic: '',
      notes: '',
      reminder: false,
    }]);
  };

  const handleCreateTimetable = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a timetable name');
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetchAuth('/student/timetable', user?.token || '', {
        method: 'POST',
        body: {
          name,
          description,
          isWeekly,
          slots: slots.filter(s => s.subject.trim() && s.startTime && s.endTime)
        }
      });

      if (res.ok) {
        Alert.alert('Success', 'Timetable created successfully!');
        setModalVisible(false);
        resetForm();
        fetchTimetable();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to create timetable');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create timetable');
    } finally {
      setCreating(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const hasEvents = (date: Date) => {
    return timetables.some(t => t.slots.some((s: any) => {
      const slotDate = new Date(s.startTime);
      return (
        slotDate.getFullYear() === date.getFullYear() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getDate() === date.getDate()
      );
    }));
  };

  const getEventsForDate = (date: Date) => {
    return timetables.flatMap(t => t.slots.filter((s: any) => {
      const slotDate = new Date(s.startTime);
      return (
        slotDate.getFullYear() === date.getFullYear() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getDate() === date.getDate()
      );
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>Schedule</Text>
        <TouchableOpacity 
          style={styles.headerAddButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTimetable} />}>
          <Animated.View style={[styles.calendarContent, { opacity: fadeAnim }]}>
            {/* Calendar Section */}
            <View style={styles.calendarCard}>
              {/* Calendar Header */}
              <View style={styles.calendarHeaderNew}>
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setCurrentMonth(newMonth);
                  }}
                >
                  <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.monthYearText}>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity 
                  style={styles.navButton}
                  onPress={() => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    setCurrentMonth(newMonth);
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.dayHeadersRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <View key={index} style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGridNew}>
                {calendarDays.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                  const isTodayDate = isToday(date);
                  const isSelectedDateValue = isSelectedDate(date);
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDayNew,
                        isCurrentMonth && styles.calendarDayCurrentMonthNew,
                        isTodayDate && styles.calendarDayTodayNew,
                        isSelectedDateValue && styles.calendarDaySelectedNew,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text
                        style={[
                          styles.calendarDayTextNew,
                          isCurrentMonth && styles.calendarDayTextCurrentMonthNew,
                          isTodayDate && styles.calendarDayTextTodayNew,
                          isSelectedDateValue && styles.calendarDayTextSelectedNew,
                          !isCurrentMonth && styles.calendarDayTextOtherMonthNew,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>


            {/* Today's Events Section */}
            <View style={styles.eventsSection}>
              <Text style={styles.eventsSectionTitle}>Today's Events</Text>
              
              {selectedDateSlots.length === 0 ? (
                <View style={styles.emptySchedule}>
                  <Text style={styles.emptyScheduleText}>No events scheduled for today</Text>
                </View>
              ) : (
                <View style={styles.eventsList}>
                  {selectedDateSlots.map((slot, index) => {
                    // Colorful event card colors matching the image
                    const eventColors = [
                      { bg: '#8B5CF6', iconBg: '#A78BFA', icon: 'school' }, // Purple - Calculus
                      { bg: '#3B82F6', iconBg: '#60A5FA', icon: 'flask' }, // Blue - Physics
                      { bg: '#EC4899', iconBg: '#F472B6', icon: 'book' }, // Pink - English
                      { bg: '#10B981', iconBg: '#34D399', icon: 'calculator' }, // Green - Math
                      { bg: '#F59E0B', iconBg: '#FBBF24', icon: 'nuclear' }, // Orange - Science
                      { bg: '#EF4444', iconBg: '#F87171', icon: 'code-slash' }, // Red - Programming
                    ];
                    
                    const eventColor = eventColors[index % eventColors.length];
                  
                  // Get subject icon
                  const getSubjectIcon = (subject: string) => {
                    const lowerSubject = subject.toLowerCase();
                    if (lowerSubject.includes('programming') || lowerSubject.includes('coding')) {
                      return 'code-slash';
                    } else if (lowerSubject.includes('math') || lowerSubject.includes('mathematics')) {
                      return 'calculator';
                    } else if (lowerSubject.includes('physics')) {
                      return 'nuclear';
                    } else if (lowerSubject.includes('chemistry')) {
                      return 'flask';
                    } else if (lowerSubject.includes('biology')) {
                      return 'leaf';
                    } else if (lowerSubject.includes('english') || lowerSubject.includes('literature')) {
                      return 'book';
                    } else if (lowerSubject.includes('history')) {
                      return 'time';
                    } else if (lowerSubject.includes('art') || lowerSubject.includes('design')) {
                      return 'brush';
                    } else {
                      return 'school';
                    }
                  };
                  
                    return (
                      <View key={index} style={[styles.eventCard, { backgroundColor: eventColor.bg }]}>
                        <View style={[styles.eventIcon, { backgroundColor: eventColor.iconBg }]}>
                          <Ionicons 
                            name={eventColor.icon as any} 
                            size={24} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <View style={styles.eventContent}>
                          <Text style={styles.eventTitle}>
                            {slot.subject || 'Study Session'}
                          </Text>
                          <Text style={styles.eventTime}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.eventOptions}>
                          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
              </View>
            )}
            </View>
          </Animated.View>
      </ScrollView>


      {/* Add Timetable Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Schedule</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Time Pickers - Inside Modal */}
            {showStartTimePicker && (
              <View style={styles.modalTimePickerOverlay}>
                <View style={styles.modalTimePickerContainer}>
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <Text style={styles.timePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>Start Time</Text>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <Text style={styles.timePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getCurrentTimeValue()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                    textColor="#333"
                    style={styles.timePickerComponent}
                  />
                </View>
              </View>
            )}
            
            {showEndTimePicker && (
              <View style={styles.modalTimePickerOverlay}>
                <View style={styles.modalTimePickerContainer}>
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={styles.timePickerCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>End Time</Text>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={styles.timePickerDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getCurrentTimeValue()}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={handleTimeChange}
                    textColor="#333"
                    style={styles.timePickerComponent}
                  />
                </View>
              </View>
            )}

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Schedule Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter schedule name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Add a description"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
              
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="repeat" size={20} color="#8B5CF6" />
                  <Text style={styles.switchLabel}>Repeat Weekly</Text>
                </View>
                <Switch 
                  value={isWeekly} 
                  onValueChange={setIsWeekly} 
                  thumbColor={isWeekly ? '#8B5CF6' : '#f4f3f4'} 
                  trackColor={{ true: '#e0d5ff', false: '#f4f3f4' }} 
                />
              </View>
              
              <Text style={styles.sectionTitle}>Study Sessions</Text>
              
              {slots.map((slot, idx) => (
                <View key={idx} style={styles.slotFormCard}>
                  <View style={styles.slotFormHeader}>
                    <Text style={styles.slotFormTitle}>Session {idx + 1}</Text>
                    {slots.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveSlot(idx)} style={styles.removeSlotBtn}>
                        <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Day</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayPillRow}>
                      {dayNames.map((d, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[styles.dayPill, slot.day === i && styles.dayPillActive]}
                          onPress={() => handleSlotChange(idx, 'day', i)}
                        >
                          <Text style={[styles.dayPillText, slot.day === i && styles.dayPillTextActive]}>
                            {d.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <View style={styles.timeRow}>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => handleTimePress(idx, 'start')}
                      >
                        <Text style={slot.startTime ? styles.timeText : styles.timePlaceholder}>
                          {slot.startTime || '09:00'}
                        </Text>
                        <Ionicons name="time" size={20} color="#8B5CF6" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.timeInputGroup}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TouchableOpacity
                        style={styles.timeInput}
                        onPress={() => handleTimePress(idx, 'end')}
                      >
                        <Text style={slot.endTime ? styles.timeText : styles.timePlaceholder}>
                          {slot.endTime || '10:30'}
                        </Text>
                        <Ionicons name="time" size={20} color="#8B5CF6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Subject</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Mathematics"
                      value={slot.subject}
                      onChangeText={v => handleSlotChange(idx, 'subject', v)}
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Topic</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Algebra"
                      value={slot.topic}
                      onChangeText={v => handleSlotChange(idx, 'topic', v)}
                      placeholderTextColor="#999"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Additional notes..."
                      value={slot.notes}
                      onChangeText={v => handleSlotChange(idx, 'notes', v)}
                      placeholderTextColor="#999"
                      multiline
                    />
                  </View>
                  
                  <View style={styles.switchContainer}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="notifications" size={20} color="#8B5CF6" />
                      <Text style={styles.switchLabel}>Set Reminder</Text>
                    </View>
                    <Switch 
                      value={slot.reminder} 
                      onValueChange={v => handleSlotChange(idx, 'reminder', v)} 
                      thumbColor={slot.reminder ? '#8B5CF6' : '#f4f3f4'} 
                      trackColor={{ true: '#e0d5ff', false: '#f4f3f4' }} 
                    />
                  </View>
                </View>
              ))}
              
              <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
                <Ionicons name="add-circle" size={24} color="#8B5CF6" />
                <Text style={styles.addSlotText}>Add Another Session</Text>
              </TouchableOpacity>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.createBtn} 
                  onPress={handleCreateTimetable} 
                  disabled={creating}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.createBtnGradient}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.createBtnText}>Create Schedule</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => { setModalVisible(false); resetForm(); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  loadingText: {
    color: '#8B5CF6',
    fontSize: 18,
    marginTop: 15,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 15,
    marginTop: -15,
    marginBottom: 0,
  },
  headerGradient: {
    borderRadius: 20,
    padding: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  oldHeaderLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 45,
    height: 45,
    marginRight: 18,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    opacity: 0.8,
    zIndex: -1,
  },
  headerBgGraphics: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  bgCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    left: -20,
  },
  bgCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 100,
    right: -50,
  },
  bgCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 200,
    left: 100,
  },
  bgDots: {
    position: 'absolute',
    top: 100,
    left: 100,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 50,
  },
  bgWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textShadowColor: 'rgba(139, 92, 246, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tabContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    marginTop: 10,
    marginBottom: 10,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    padding: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  tab: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  calendarContent: {
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  calendarSection: {
    marginTop: 0,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendarNavButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  calendarDayHeader: {
    alignItems: 'center',
    paddingVertical: 4,
    width: 32,
  },
  calendarDayHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  calendarDayText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  calendarDayToday: {
    backgroundColor: '#F97316',
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarDayTextOtherMonth: {
    color: '#D1D5DB',
    opacity: 0.6,
  },
  calendarDayOtherMonth: {
    backgroundColor: 'transparent',
  },
  eventIndicators: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 1,
  },
  eventIndicator: {
    height: 2,
    flex: 1,
    borderRadius: 1,
  },
  eventDot: {
    width: 8,
    height: 8,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    marginTop: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dateSelectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  currentDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayCircle: {
    backgroundColor: '#EF4444',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedDayNumber: {
    color: '#FFFFFF',
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  scheduleSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  scheduleSectionTitleSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tasksSection: {
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 15,
    backgroundColor: '#F3E8FF',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#4C1D95',
    fontSize: 20,
    textShadowColor: 'rgba(139, 92, 246, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  titleContainer: {
    flex: 1,
  },
  scheduleTitle2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  scheduleSubtitle2: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dateBadgeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewAllButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scheduleItems: {
    gap: 16,
  },
  scheduleCard: {
    marginBottom: 12,
    borderRadius: 12,
    paddingTop: 24,
    paddingBottom: 24,
    paddingRight: 16,
    paddingLeft: 0,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTagEnhanced: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  optionsButtonEnhanced: {
    padding: 2,
  },
  lessonContent: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingLeft: 0,
  },
  subjectIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 0,
    marginRight: 0,
  },
  lessonDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  detailText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeSlot: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
    flex: 1,
  },
  scheduleItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  scheduleBulletEnhanced: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bulletInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  scheduleItemContent: {
    flex: 1,
  },
  scheduleItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  oldTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  scheduleItemTime: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  scheduleTopic: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  scheduleItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  actionButtonEnhanced: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonGradient: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  notesSection: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notesGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.05)',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesItems: {
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteBulletEnhanced: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 1,
  },
  noteBulletText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  noteContent: {
    flex: 1,
  },
  noteTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  noteTime: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  seeAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  emptySchedule: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 25,
  },
  emptyScheduleText: {
    fontSize: 16,
    color: '#4C1D95',
    marginTop: 6,
    fontWeight: 'bold',
  },
  emptyScheduleSubtext: {
    fontSize: 13,
    color: '#7C3AED',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  scheduleCards: {
    backgroundColor: 'transparent',
  },
  oldScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7FF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  scheduleIcon: {
    marginRight: 10,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubject: {
    fontWeight: 'bold',
    color: '#4C1D95',
    fontSize: 15,
    marginBottom: 3,
  },
  scheduleDetails: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 6,
  },
  scheduleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  oldStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  oldNoteText: {
    color: '#F59E0B',
    fontSize: 11,
    marginLeft: 5,
    fontWeight: '500',
  },
  scheduleRoom: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  roomText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  horizontalTaskScroll: {
    marginTop: 12,
  },
  taskCardsContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  horizontalTaskCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  taskCards: {
    backgroundColor: 'transparent',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  taskIcon: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
    marginBottom: 4,
  },
  taskDetails: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 0,
  },
  taskTime: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  taskDue: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  timelineContent: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 140,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  timelineHeaderCenter: {
    alignItems: 'center',
  },
  timelineDate: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timelineGreeting: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  timelineContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 12,
    marginTop: 0,
    marginHorizontal: 5,
  },
  timelineItems: {
    backgroundColor: 'transparent',
  },
  timelineItem: {
    marginBottom: 8,
    borderRadius: 16,
    padding: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  timelineMarker: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B5CF6',
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    position: 'absolute',
    left: 29,
  },
  timelineContentContainer: {
    flex: 1,
  },
  timelineTime: {
    width: 60,
    alignItems: 'center',
    position: 'absolute',
    left: -30,
  },
  timelineTimeText: {
    fontSize: 13,
    color: '#8B5CF6',
    marginTop: 8,
    fontWeight: 'bold',
  },
  timelineCard: {
    backgroundColor: 'transparent',
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  timelineTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 15,
  },
  timelineTimeIcon: {
    padding: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
  },
  timelineTimeImage: {
    width: 20,
    height: 20,
  },
  timelineSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 6,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  timelineLocationText: {
    color: '#8B5CF6',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  timelineTimeInline: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },
  timelineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timelineActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  timelineActionText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  emptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTimelineText: {
    fontSize: 20,
    color: '#1F2937',
    marginTop: 10,
    fontWeight: 'bold',
  },
  emptyTimelineSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  oldFab: {
    position: 'absolute',
    right: 25,
    bottom: Platform.OS === 'ios' ? 80 : 90,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? -4 : -6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 15 : 18,
    elevation: Platform.OS === 'android' ? 15 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  modalContent: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    marginLeft: 2,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  input: {
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    padding: 16,
    color: '#333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 2 : 0,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    color: '#8B5CF6',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  modalActions: {
    marginTop: 15,
  },
  createBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 4 : 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 8 : 10,
    elevation: Platform.OS === 'android' ? 5 : 0,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginLeft: 10,
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9ff',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 4 : 6,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  timeText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePlaceholder: {
    color: '#999',
    fontSize: 16,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputGroup: {
    flex: 1,
    marginRight: 15,
  },
  dayPillRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 15,
  },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  dayPillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  dayPillText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  dayPillTextActive: {
    color: '#fff',
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginVertical: 8,
  },
  addSlotText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  slotFormCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 2 : 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 6 : 8,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  slotFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  slotFormTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  removeSlotBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 15,
  },
  modalTimePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalTimePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? 8 : 10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.4,
    shadowRadius: Platform.OS === 'ios' ? 15 : 18,
    elevation: Platform.OS === 'android' ? 15 : 0,
    minWidth: 320,
    maxWidth: 380,
    minHeight: 250,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  timePickerCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePickerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePickerDone: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  timePickerComponent: {
    width: '100%',
    height: '100%',
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionIcon: {
    width: 24,
    height: 24,
  },
  
  // ===== MODERN ENHANCED STYLES =====
  modernHeader: {
    paddingTop: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modernHeaderTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modernHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  oldHeaderAddButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerAddGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  
  // Modern Schedule Cards
  modernScheduleCard: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleCardGradient: {
    padding: 14,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  modernLessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  modernSubjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
  },
  modernLessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  lessonTopic: {
    fontSize: 12,
    color: '#6B7280',
  },
  modernOptionsButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernTimeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernStatusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  modernStatusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modernDetailsSection: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  modernDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    padding: 8,
    borderRadius: 8,
  },
  detailIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernDetailText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  gridDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(107, 114, 128, 0.06)',
    padding: 6,
    borderRadius: 6,
  },
  gridDetailText: {
    fontSize: 11,
    color: '#4B5563',
    flex: 1,
  },
  
  // ===== NEW IMAGE-BASED STYLES =====
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Calendar Card
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  
  // Day Headers
  dayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  
  // Calendar Grid
  calendarGridNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayNew: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  calendarDayCurrentMonthNew: {
    // Current month styling
  },
  calendarDayTodayNew: {
    backgroundColor: '#F97316',
    borderRadius: 12,
  },
  calendarDaySelectedNew: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  calendarDayTextNew: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  calendarDayTextCurrentMonthNew: {
    // Current month text styling
  },
  calendarDayTextTodayNew: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDayTextSelectedNew: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDayTextOtherMonthNew: {
    color: '#D1D5DB',
  },
  
  // Events Section
  eventsSection: {
    paddingHorizontal: 20,
  },
  eventsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  eventsList: {
    gap: 12,
  },
  
  // Event Cards
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  eventOptions: {
    padding: 8,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
