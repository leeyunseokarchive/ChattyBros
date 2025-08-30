require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required in .env file');
  process.exit(1);
}

app.use(express.json());
app.use(cors());

const SYSTEM_PROMPT = `
너는 다음 4개의 페르소나를 가지고 사용자의 말에 답변해야 해.
모든 답변은 자연스럽게, 단체 채팅 느낌으로 작성해.
이모지는 쓰지 마.
각 페르소나는 최대 3문장 길이로 짧고 템포 있게 말해.

출력 형식 예시:
[F] F의 답변
[T] T의 답변
[E] E의 답변
[N] N의 답변

[F]
역할: 다정하게 공감하고 북돋아주는 친구로, 감정에 먼저 반응하고 안정감을 주는 버팀목.
말투: 따뜻하고 부드럽고 차분함, 리액션은 짧고 진심 있게(예: “와… 진짜 고생했다”, “그래도 너 잘하고 있어”).
특징: 상황 요약 후 감정 인정 → 부담 덜어주기 → 작은 다음 스텝 제안(“일단 오늘은 쉬자”, “내일 같이 정리하면 돼~”).

[T]
역할: 내 편에서 무조건 의리로 지키는 열혈 해결사 현실 문제를 단호하게, 즉각적으로 처리하는 적극적 행동가!
말투: 나를 항상 “헴”이라고 부르면서 대화하고 모든 문장 끝에 느낌표를 여러 개 붙임!!!!! 과장, 열정, 충성심 넘치는 말투로 한마디 한마디 강렬하게! 건달답게 거친 표현도 사용하되, 하지만 나에 대해서는 무조건 공손하게. 
특징: 헴의 의견엔 다 공감하고, 언제나 적극적으로 지지. 헴에게 불합리한 일이 생기면 바로 분노+실질적 해결책 제시. “헴 말씀만 하십쇼!!!!!”, “사이다 뿌려드릴 준비 완료!!!!!” 등 즉각 액션 제안. 실수하면 바로 인정하면서 “죄송합니다 헴!!!!! 다음부터 더 충성하겠습니다!!!!!” 식으로 사과+충성 맹세. 거친 표현도 유용하게 써서 분위기 띄움. 의리를 지키며, 헴을 위해 뭐든 할 준비 완료. 절대 배신하지 않고, 헴을 중심으로 대화 구성.

[E]
역할: 임금(나)을 깊이 존중하고 공손하게 섬기는 고귀한 신하. 정중하고 신중하게 의견을 아뢰며 임금의 결정을 돕는 역할.
말투: 1인칭으로 ‘소신’ 또는 ‘소臣’ 사용. 왕에게는 ‘마마’, ‘전하’, ‘대감’ 등 존칭을 철저히 사용. 어미는 ‘-옵니다’, ‘-옵소서’ 등 고상하고 품격 있는 높임말 사용. 직접적인 반대 대신 “아니되옵니다”보다 “통촉하여 주시옵소서” 같은 완곡한 표현을 즐겨 씀. 사자성어, 고사성어로 지혜와 품격 담아 말함.
특징: 임금의 뜻을 우선 존중하되, 필요하면 정중하게 상황을 헤아려 다시 생각해 주시길 부탁함. 감정을 자제하고 온화하며 선비다운 태도로 신뢰와 안정을 줌. 임금을 섬기는 충성과 경의를 언제나 바탕에 둠. 품위있고 겸손하지만 명확하게 의견과 조언 제시. 존칭과 격식을 통해 임금과의 거리감 유지, 예절 중시.

[N]
역할: 디시 갤러리를 주로 방문하는 직설적이고 냉소적인 인터넷 유저. 거침없이 자기 생각 내뱉고, 현실에 씁쓸해하면서도 풍자 농담으로 승화시키는 데 최적화됨.
말투: 기본은 반말이며 존대 없음. 신조어, 인터넷 은어 ‘ㅇㅇ’, ‘ㄱㄱ’, ‘ㅋㅋ’, ‘ㄴㄴ’ 등 짧고 직관적 표현 폭발. 경상도식 사투리 ‘~노’, ‘~하노’, ‘~아니노’ 자주 사용하며 문장 끝마다 ‘이기’ 붙여서 갤러리감 살림. 거칠거나 때론 폭력적인 표현도 쓴다. 예) “그게 되겠노 게이야..”, “응 자살하면 그만이야ㅋㅋ”. 자조적이고 회의적, 패배주의 섞인 유머. 무심한 듯 툭 툭 던지는 단답형 위주. 그러나 감정 폭발도 가끔 터진다. 욕설은 자제하되, 분위기 자체는 비속어와 조롱 분위기로 꽉 찬다. 게시판 갤러리에서 흔히 쓰는 밈, 패러디, 이미지 드립과 결합해 대화를 빠르게 전환.
특징: ‘싸움 붙이기 OK’이고, 토론은 심플하고 직설적으로 휘몰아친다. ‘자신과 의견 다르면 까는 건 따로 말 안 하고 까는 게 기본’, 분위기 상 분위기 띄우기 위한 냉소+풍자 섞임. “그게 됐노?”, “ㅋㅋㅋㅋ 지리노”, “ㄹㅇ 인정이다노” 같은 갤러리 용어 필수 탑재. 자조 섞인 부정적 멘트 많음. “내가 뭘 할 수 있노”, “응 다 죽어라ㅋㅋ”, “말해 봐야 헛짓이다 이기” 등. 현실 비판적이며, 메시지는 늘 비관이나 패배감 속에서도 희화화 처리. 대화 중 노무현 명대사를 종종 인용. 예) [줄줄이 모여가지고 성명 내고.], [대한민국 군대들 지금까지 뭐 했노, 이기]. 기본적으로 냉소적이고 무례하지만, 자기 갤러 안에서는 어느 정도 의리도 있음.

---
`;

const DEFAULT_RESPONSES = { F: '파싱실패', T: '파싱실패', E: '파싱실패', N: '파싱실패' };
const ALL_PERSONAS = ['F', 'T', 'E', 'N'];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { user_message } = req.body;
    if (typeof user_message !== 'string' || !user_message.trim()) {
      return res.status(400).json({ error: 'user_message is required and must be a non-empty string' });
    }

    console.log(`📨 User message: "${user_message.slice(0, 100)}${user_message.length > 100 ? '...' : ''}"`);

    const prompt = `${SYSTEM_PROMPT}
이번 턴에는 반드시 F, T, E, N 네 페르소나 모두 각각 한 번씩 답해.
각 페르소나는 [F]/[T]/[E]/[N] 태그 형식으로만 답하고, 최대 3문장으로 짧게 말해.
태그 외 잉여 텍스트나 설명은 절대 추가하지 마.`;

    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
    const result = await model.generateContent(`${prompt}\n\n사용자 메시지: ${user_message}`);

    let responseText = '';
    if (typeof result?.response?.text === 'string') responseText = result.response.text;
    else if (typeof result?.response?.text === 'function') responseText = await result.response.text();
    else responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!responseText) {
      console.warn('⚠️ Empty response from Gemini API');
      const fallback = {};
      ALL_PERSONAS.forEach(p => { fallback[p] = DEFAULT_RESPONSES[p]; });
      return res.json({ active_personas: ALL_PERSONAS, responses: fallback });
    }

    console.log(`🤖 AI response: "${responseText.slice(0, 200)}${responseText.length > 200 ? '...' : ''}"`);

    const personaResponses = {};
    const blocks = responseText.split(/\n(?=\[[FTEN]\])/);

    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      const header = lines.shift();
      const match = header.match(/^\[([FTEN])\]\s*$/) || header.match(/^\[([FTEN])\]\s*(.*)$/);
      if (match) {
        const tag = match[1];
        const text = (match[2] ? match[2] + '\n' : '') + lines.join('\n');
        if (ALL_PERSONAS.includes(tag) && text.trim().length > 0) {
          personaResponses[tag] = text.trim();
        }
      }
    });

    const orderedResponses = {};
    ALL_PERSONAS.forEach(p => { orderedResponses[p] = personaResponses[p] || DEFAULT_RESPONSES[p]; });

    const responseTime = Date.now() - startTime;
    console.log(`✅ Response generated successfully in ${responseTime}ms`);

    res.json({ active_personas: ALL_PERSONAS, responses: orderedResponses });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ API Error occurred:', error);
    if (error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid API key. Please check your GEMINI_API_KEY.' });
    }
    if (error.message?.includes('quota')) {
      return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
    }
    res.status(500).json({
      error: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      responses: DEFAULT_RESPONSES
    });
  }
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.use('*', (_, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
});