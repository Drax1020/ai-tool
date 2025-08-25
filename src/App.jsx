import { useEffect, useRef, useState } from 'react';
import './App.css';
import { URL } from './constants';
import RecentSearch from './components/RecentSearch';
import QuesstionAnswer from './components/QuesstionAnswer';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState([]);
  const [recentHistory, setRecentHistory] = useState(JSON.parse(localStorage.getItem('history')));
  const [selectedHistory, setSelectedHistory] = useState('');
  const [loader, setLoader] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [language, setLanguage] = useState('en-US');

  const scrollToAns = useRef();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;



  const supportedLanguages = {
    'English': 'en-US',
    'Hindi': 'hi-IN',
    'Korean': 'ko-KR',
    'Kannada': 'kn-IN',
    'Tamil': 'ta-IN',
    'Telugu': 'te-IN'
  };

  const startVoiceInput = () => {
    if (!recognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      setSelectedHistory('');
      setIsListening(false);
      setTimeout(() => {
        askQuestion();
      }, 300);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      alert('Voice input failed. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const speakAnswer = (text) => {
    if (!voiceOutputEnabled || !'speechSynthesis' in window) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const askQuestion = async () => {



    if (!question && !selectedHistory) return;

    if (question) {
      const existing = localStorage.getItem('history');
      const history = existing ? JSON.parse(existing) : [];
      const newHistory = [question, ...history];
      localStorage.setItem('history', JSON.stringify(newHistory));
      setRecentHistory(newHistory);
    }

    const payloadData = question || selectedHistory;
    const payload = {
      contents: [{
        parts: [{ text: payloadData }]
      }]
    };

    setLoader(true);

    let response = await fetch(URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    response = await response.json();
    let dataString = response.candidates[0].content.parts[0].text;
    dataString = dataString.split("*").map(item => item.trim());

    const finalQuestion = question || selectedHistory;
    const newAnswer = { type: 'a', text: dataString };
    const newResult = [
      ...result,
      { type: 'q', text: finalQuestion },
      newAnswer,
    ];

    setResult(newResult);
    setQuestion('');
    speakAnswer(dataString.join(' '));


    setTimeout(() => {
      scrollToAns.current.scrollTop = scrollToAns.current.scrollHeight;
    }, 500);

    setLoader(false);
  };

  const isEnter = (event) => {
    if (event.key === 'Enter') askQuestion();

  };

  useEffect(() => {
    if (selectedHistory) askQuestion();
  }, [selectedHistory]);

  useEffect(() => {
    const cancelSpeech = () => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
    };
    window.addEventListener('beforeunload', cancelSpeech);
    return () => {
      cancelSpeech();
      window.removeEventListener('beforeunload', cancelSpeech);
    };
  }, []);

  // Dark mode feature
  const [darkMode, setDarkMode] = useState('dark');

  useEffect(() => {
    if (darkMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={darkMode === 'dark' ? 'dark' : 'light'}>
      <div className='grid grid-cols-5 h-screen text-center'>
        {/* Theme selector */}
        <select onChange={(e) => setDarkMode(e.target.value)} className='fixed bottom-0 p-5 border text-zinc-700 dark:text-white'>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>

        {/* Language selector */}
        <select onChange={(e) => setLanguage(e.target.value)} value={language} className='fixed bottom-20 left-40 p-3 border bg-white dark:bg-zinc-800 text-black dark:text-white'>
          {Object.entries(supportedLanguages).map(([label, code]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>

        {/* Sidebar history */}
        <RecentSearch recentHistory={recentHistory} setRecentHistory={setRecentHistory} setSelectedHistory={setSelectedHistory} />

        {/* Main content */}
        <div className='col-span-4 p-10'>
          <h1 className='text-2xl bg-clip-text text-transparent bg-gradient-to-r from-pink-700 to-violet-700'>
            Hello User, Ask me Anything
          </h1>

          {
            loader ?
              <div role="status">
                <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-purple-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div> : null
          }

          <div ref={scrollToAns} className='container h-110 overflow-auto dark:text-zinc-300 text-zinc-800'>
            <ul>
              {result.map((item, index) => (
                <QuesstionAnswer key={index} item={item} index={index} />
              ))}
            </ul>
          </div>

          {/* Input section */}
          <div className='relative dark:bg-zinc-800 bg-red-100 w-1/2 p-1 pr-5 dark:text-white text-zinc-800 m-auto rounded-4xl border border-zinc-700 flex h-16 items-center gap-2'>
            <input
              type='text'
              value={question}
              onKeyDown={isEnter}
              onChange={(event) => setQuestion(event.target.value)}
              className='w-full h-full p-3 outline-none bg-transparent'
              placeholder='Type or speak...'
            />

            <button
              onClick={startVoiceInput}
              disabled={isListening}
              title='Start voice input'
              className={`p-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-emerald-950'} text-white`}
            >
              🎤
            </button>

            <button
              onClick={askQuestion}
              className='bg-gray-800 text-white px-4 py-2 rounded hover:bg-cyan-950'
            >
              Ask
            </button>

            {isListening && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded shadow-lg animate-bounce">
                Listening...
              </div>
            )}
          </div>
        </div>

        {/* Voice Output Toggle */}
        <label className="fixed bottom-36 left-9 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={voiceOutputEnabled}
            onChange={(e) => setVoiceOutputEnabled(e.target.checked)}
          />
          <span className="text-white">Voice Output</span>
        </label>
      </div>
    </div>
  );
}

export default App;
