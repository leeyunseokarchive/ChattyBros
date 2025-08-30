import React, { useState, useRef } from 'react';
import {
  SafeAreaView, Text, TextInput, FlatList, View, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity
} from 'react-native';
import axios from 'axios';

const API_URL = Platform.select({
  ios: 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  default: 'http://127.0.0.1:3000',
});

// 24시간 포맷 함수 (초, AM/PM 없음)
const formatTime = (date = new Date()) =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

interface PersonaResponse { name: string; message: string; time: string; }
interface ChatMessage {
  id: string;
  isUser: boolean;
  content: string | PersonaResponse[];
  time: string;
}

const App = () => {
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  const timeoutIdsRef = useRef<number[]>([]);
  const axiosCancelSourceRef = useRef<any>(null);

  // 기존 대기 및 요청 취소
  const cancelPreviousActions = () => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    if (axiosCancelSourceRef.current) {
      axiosCancelSourceRef.current.cancel("New message sent, cancelling previous API request.");
      axiosCancelSourceRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!userMessage.trim()) return;

    cancelPreviousActions();

    const sendTime = formatTime();
    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      isUser: true,
      content: userMessage,
      time: sendTime,
    };
    setChatHistory(prev => [newUserMessage, ...prev]);
    setApiLoading(true);
    const messageToSend = userMessage;
    setUserMessage('');

    try {
      const source = axios.CancelToken.source();
      axiosCancelSourceRef.current = source;
      const response = await axios.post(
        `${API_URL}/chat`,
        { user_message: messageToSend },
        { cancelToken: source.token }
      );
      axiosCancelSourceRef.current = null;

      const personas = Object.entries(response.data.responses).map(([name, message]) => ({
        name,
        message,
        time: formatTime(),
      }));

      for (const persona of personas) {
        const delay = Math.random() * 1500 + 100;
        await new Promise<void>(resolve => {
          const timeoutId = setTimeout(() => {
            setChatHistory(prev => [
              {
                id: Math.random().toString(),
                isUser: false,
                content: [{ name: persona.name, message: persona.message, time: persona.time }],
                time: persona.time,
              },
              ...prev,
            ]);
            resolve();
          }, delay);
          timeoutIdsRef.current.push(timeoutId);
        });
      }
    } catch (e) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(),
        isUser: false,
        content: [{ name: "Error", message: "Failed to fetch response.", time: formatTime() }],
        time: formatTime(),
      };
      setChatHistory(prev => [errorMessage, ...prev]);
    } finally {
      setApiLoading(false);
      axiosCancelSourceRef.current = null;
      timeoutIdsRef.current = [];
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.isUser) {
      return (
        <View style={styles.userRow}>
          <View style={styles.userTimeBox}>
            <Text style={styles.sentText}>{item.time}</Text>
          </View>
          <View style={[styles.messageBubble, styles.userBubble]}>
            <Text style={styles.userText}>{item.content as string}</Text>
          </View>
        </View>
      );
    } else {
      const personaResponses = item.content as PersonaResponse[];
      return (
        <View style={styles.personaRow}>
          <View style={{ flexDirection: 'column', maxWidth: '80%' }}>
            <Text style={styles.personaName}>{personaResponses[0].name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <View style={[styles.messageBubble, styles.personaBubble]}>
                <Text style={styles.personaText}>{personaResponses[0].message}</Text>
              </View>
              <Text style={[styles.sentText, { marginLeft: 8, alignSelf: 'flex-end', marginBottom: 2 }]}>
                {personaResponses[0].time}
              </Text>
            </View>
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>ChattyBros</Text>
      <FlatList
        data={chatHistory}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        inverted
        style={styles.chatList}
      />
      {apiLoading && <ActivityIndicator size="small" color="#007AFF" style={styles.apiLoadingIndicator} />}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputContainerWrapper}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={userMessage}
            onChangeText={setUserMessage}
            placeholder="메시지를 입력하세요"
            editable
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, !userMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!userMessage.trim()}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 10, color: '#343a40' },
  chatList: { flex: 1, paddingHorizontal: 15 },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' },
  personaRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-end', marginBottom: 10 },
  userTimeBox: { marginRight: 8, justifyContent: 'flex-end', alignItems: 'center' },
  personaTimeBox: { marginLeft: 8, justifyContent: 'flex-end', alignItems: 'center' },
  sentText: { fontSize: 12, color: '#868e96' },
  messageBubble: { padding: 12, borderRadius: 20 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderTopRightRadius: 5 },
  userText: { color: '#fff', fontSize: 16 },
  personaBubble: { alignSelf: 'flex-start', backgroundColor: '#e9ecef', borderTopLeftRadius: 5 },
  personaName: { fontWeight: 'bold', marginBottom: 4, color: '#495057' },
  personaText: { color: '#212529', fontSize: 16 },
  inputContainerWrapper: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e9ecef' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, borderWidth: 1, borderColor: '#ced4daff', paddingHorizontal: 0 },
  input: { flex: 1, height: 40, fontSize: 16, paddingLeft: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  sendButtonDisabled: { backgroundColor: '#adb5bd' },
  apiLoadingIndicator: { position: 'absolute', bottom: 65, alignSelf: 'center' },
});

export default App;
