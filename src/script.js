import { API_KEY, SPEAKER_NUMBER, CHARACTOR_DISCRIPTION } from './const.js';

const app = Vue.createApp({
    data() {
        return {
            OPEN_AI_API_URL: 'https://api.openai.com/v1/chat/completions',
            VOICEVOX_AUDIO_QUERY_API_URL: 'http://localhost:50021/audio_query',
            VOICEVOX_SYNTHESIS_API_URL: 'http://localhost:50021/synthesis',
            userInputText: '',
        }
    },
    methods: {
        /**
         * ユーザーの音声を認識
         */
        async recognizeVoice() {
            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'ja';
            recognition.onresult = async ({ results }) => {
                this.userInputText = results[0][0].transcript;
                await this.charactorSpeak(results[0][0].transcript);
            };
            recognition.start();
        },

        /**
         * ユーザーが入力したテキストを送信
         */
        async submitText() {
            await this.charactorSpeak(this.userInputText);
        },

        /**
         * 入力したテキストに対するOpenAIからの回答を、VOICEBOXのキャラクターに喋ってもらう
         * @param {string}
         */
        async charactorSpeak(text) {
            const aiResponse = await this.requestAi(text);
            const audioQuery = await this.createAudioQuery(aiResponse);
            const synthesizedVoice = await this.synthesisVoice(audioQuery);

            const audio = document.querySelector('.audio');
            audio.src = URL.createObjectURL(synthesizedVoice);
            audio.play();
        },

        /**
         * OpenAIのAPIへ回答を求める
         * @param {string}
         * @returns {string} - OpenAIのAPIからの回答
         */
        async requestAi(text) {
            const response = await axios.post(
                this.OPEN_AI_API_URL,
                {
                    model: 'gpt-3.5-turbo',
                    max_tokens: 500,
                    messages: [
                        {role: 'user',   content: text},
                        {role: 'system', content: CHARACTOR_DISCRIPTION},
                    ],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${API_KEY}`,
                    }
                }
            );

            return response.data.choices[0].message.content;
        },

        /**
         * VOICEBOXのAPIで音声合成用のクエリを取得
         * @param {string}
         * @returns {string} - 音声合成用クエリ
         */
        async createAudioQuery(aiResponse) {
            const response = await axios.post(
                `${this.VOICEVOX_AUDIO_QUERY_API_URL}?speaker=${SPEAKER_NUMBER}&text=${aiResponse}`
            );
            return response.data;
        },

        /**
         * VOICEBOXのAPIで合成した音声データを取得
         * @param {string}
         * @returns {string} - 音声データ
         */
        async synthesisVoice(audioQuery) {
            const response = await axios.post(
                `${this.VOICEVOX_SYNTHESIS_API_URL}?speaker=${SPEAKER_NUMBER}`,
                audioQuery,
                { responseType: 'blob' }
            );
            return response.data;
        },
    }
});

const vm = app.mount('#app');