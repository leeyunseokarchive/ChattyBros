const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // 포트 변경

app.use(express.json());
app.use(cors());

// 간단한 테스트 라우트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

app.post('/chat', (req, res) => {
  console.log('Received message:', req.body.user_message);
  
  // 임시 응답
  res.json({
    responses: {
      F: '테스트 응답이야 😊',
      T: '서버 연결이 정상 작동합니다.',
      E: '와! 드디어 연결됐네! 🎉',
      N: '어떤 메시지를 보낸 거야?'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});
