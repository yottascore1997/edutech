# Battle Quiz API Documentation

## Overview
This document describes the real-time battle quiz system API endpoints and WebSocket events for creating, joining, and participating in live battle quizzes.

## Features
- **Real-time Battle Rooms**: Create and join battle rooms
- **2-Player Battles**: Head-to-head quiz competitions
- **5 Questions per Battle**: Each battle consists of 5 questions
- **10-Second Timer**: Each question has a 10-second time limit
- **Live Scoreboard**: Real-time score tracking
- **Battle Results**: Final standings and winner announcement

## API Endpoints

### Battle Room Management

#### 1. Create Battle Room
```http
POST /api/battle/create-room
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Room Name"
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": "room_123",
    "name": "Room Name",
    "players": [
      {
        "id": "user_123",
        "name": "Player Name",
        "score": 0,
        "isReady": false,
        "isOnline": true
      }
    ],
    "maxPlayers": 2,
    "status": "waiting"
  }
}
```

#### 2. Get Available Battle Rooms
```http
GET /api/battle/rooms
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "rooms": [
    {
      "id": "room_123",
      "name": "Room Name",
      "players": [...],
      "maxPlayers": 2,
      "status": "waiting"
    }
  ]
}
```

#### 3. Join Battle Room
```http
POST /api/battle/join-room/{roomId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "room": {
    "id": "room_123",
    "name": "Room Name",
    "players": [...],
    "maxPlayers": 2,
    "status": "waiting"
  }
}
```

#### 4. Leave Battle Room
```http
POST /api/battle/leave-room/{roomId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Left room successfully"
}
```

#### 5. Player Ready
```http
POST /api/battle/ready/{roomId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Player is ready"
}
```

#### 6. Submit Answer
```http
POST /api/battle/submit-answer/{roomId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "questionIndex": 0,
  "answerIndex": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Answer submitted"
}
```

## WebSocket Events

### Client to Server Events

#### 1. Create Battle Room
```javascript
socket.emit('create_battle_room', {
  name: 'Room Name'
});
```

#### 2. Join Battle Room
```javascript
socket.emit('join_battle_room', {
  roomId: 'room_123'
});
```

#### 3. Leave Battle Room
```javascript
socket.emit('leave_battle_room', {
  roomId: 'room_123'
});
```

#### 4. Player Ready
```javascript
socket.emit('player_ready', {
  roomId: 'room_123'
});
```

#### 5. Submit Answer
```javascript
socket.emit('submit_answer', {
  roomId: 'room_123',
  questionIndex: 0,
  answerIndex: 2
});
```

### Server to Client Events

#### 1. Battle Room Created
```javascript
socket.on('battle_room_created', (data) => {
  console.log('Room created:', data.room);
});
```

#### 2. Battle Room Joined
```javascript
socket.on('battle_room_joined', (data) => {
  console.log('Joined room:', data.room);
});
```

#### 3. Battle Room Left
```javascript
socket.on('battle_room_left', (data) => {
  console.log('Left room:', data.roomId);
});
```

#### 4. Player Joined
```javascript
socket.on('player_joined', (data) => {
  console.log('Player joined:', data.player);
});
```

#### 5. Player Left
```javascript
socket.on('player_left', (data) => {
  console.log('Player left:', data.playerId);
});
```

#### 6. Player Ready
```javascript
socket.on('player_ready', (data) => {
  console.log('Player ready:', data.playerId);
});
```

#### 7. Battle Started
```javascript
socket.on('battle_started', (data) => {
  console.log('Battle started with questions:', data.questions);
});
```

#### 8. Question Started
```javascript
socket.on('question_started', (data) => {
  console.log('Question started:', {
    questionIndex: data.questionIndex,
    timeLimit: data.timeLimit
  });
});
```

#### 9. Question Ended
```javascript
socket.on('question_ended', (data) => {
  console.log('Question ended:', {
    questionIndex: data.questionIndex,
    correctAnswer: data.correctAnswer,
    scores: data.scores
  });
});
```

#### 10. Battle Ended
```javascript
socket.on('battle_ended', (data) => {
  console.log('Battle ended:', data.results);
});
```

#### 11. Time Update
```javascript
socket.on('time_update', (data) => {
  console.log('Time remaining:', data.timeRemaining);
});
```

## Data Structures

### Battle Room
```typescript
interface BattleRoom {
  id: string;
  name: string;
  players: BattlePlayer[];
  maxPlayers: number;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  currentQuestion?: number;
  timeRemaining?: number;
  questions?: BattleQuestion[];
}
```

### Battle Player
```typescript
interface BattlePlayer {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  isReady: boolean;
  isOnline: boolean;
}
```

### Battle Question
```typescript
interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}
```

### Battle Results
```typescript
interface BattleResults {
  players: {
    id: string;
    name: string;
    score: number;
    isWinner: boolean;
    answers: {
      questionIndex: number;
      answerIndex: number;
      isCorrect: boolean;
      timeTaken: number;
    }[];
  }[];
  totalQuestions: number;
  battleDuration: number;
}
```

## Battle Flow

1. **Room Creation**: Player creates a battle room
2. **Player Joining**: Second player joins the room
3. **Ready Up**: Both players mark themselves as ready
4. **Battle Start**: Server starts the battle with 5 questions
5. **Question Display**: Each question is shown for 10 seconds
6. **Answer Submission**: Players submit answers within time limit
7. **Score Calculation**: Points awarded for correct answers and speed
8. **Battle End**: Final results displayed with winner announcement

## Scoring System

- **Correct Answer**: 10 points
- **Speed Bonus**: Up to 5 additional points based on answer speed
- **No Answer**: 0 points
- **Wrong Answer**: 0 points

## Error Handling

### Common Error Responses

#### Room Full
```json
{
  "success": false,
  "error": "Room is full"
}
```

#### Room Not Found
```json
{
  "success": false,
  "error": "Room not found"
}
```

#### Battle Already Started
```json
{
  "success": false,
  "error": "Battle already in progress"
}
```

#### Invalid Answer
```json
{
  "success": false,
  "error": "Invalid answer index"
}
```

#### Time Expired
```json
{
  "success": false,
  "error": "Time limit exceeded"
}
```

## Implementation Notes

### Backend Requirements
1. **WebSocket Server**: Handle real-time communication
2. **Room Management**: Track active battle rooms
3. **Question Database**: Store and retrieve quiz questions
4. **Timer Management**: Handle 10-second question timers
5. **Score Calculation**: Real-time score updates
6. **Player State**: Track player readiness and online status

### Frontend Requirements
1. **Real-time Updates**: Listen to WebSocket events
2. **Timer Display**: Show countdown timer with animations
3. **Answer Selection**: Handle multiple choice answers
4. **Score Display**: Show live scoreboard
5. **Battle States**: Handle waiting, active, and finished states
6. **Error Handling**: Display appropriate error messages

### Security Considerations
1. **Authentication**: Verify user tokens for all requests
2. **Room Access**: Ensure only authorized players can join rooms
3. **Answer Validation**: Prevent multiple submissions per question
4. **Rate Limiting**: Prevent spam and abuse
5. **Input Sanitization**: Validate all user inputs

## Example Implementation

### Frontend Battle Component
```typescript
// Example usage in React Native
const BattleRoom = () => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isInBattle, setIsInBattle] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  
  useEffect(() => {
    // Listen to WebSocket events
    socket.on('battle_started', handleBattleStarted);
    socket.on('question_started', handleQuestionStarted);
    socket.on('time_update', handleTimeUpdate);
    
    return () => {
      socket.off('battle_started');
      socket.off('question_started');
      socket.off('time_update');
    };
  }, []);
  
  const submitAnswer = (answerIndex: number) => {
    socket.emit('submit_answer', {
      roomId: currentRoom.id,
      questionIndex: currentQuestionIndex,
      answerIndex: answerIndex
    });
  };
  
  // Render battle UI
};
```

This battle quiz system provides a complete real-time multiplayer quiz experience with proper state management, scoring, and user interaction.
