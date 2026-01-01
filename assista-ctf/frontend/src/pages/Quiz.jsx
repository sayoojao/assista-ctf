import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Quiz = () => {
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const initQuiz = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // 1. Start Session
                const startRes = await axios.post('http://localhost:5000/api/quiz/start', {}, { headers });
                setSessionId(startRes.data.sessionId);

                // 2. Fetch Questions
                const qRes = await axios.get('http://localhost:5000/api/questions');
                let qs = qRes.data;
                // Shuffle
                qs = qs.sort(() => 0.5 - Math.random());
                setQuestions(qs);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert('Failed to start quiz');
                navigate('/');
            }
        };
        initQuiz();
    }, [navigate]);

    const handleAnswer = async (optionId) => {
        try {
            const token = localStorage.getItem('token');
            const currentQ = questions[currentQIndex];

            // Submit Answer
            await axios.post('http://localhost:5000/api/quiz/answer', {
                sessionId,
                questionId: currentQ.id,
                optionId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Next Question or Finish
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(currentQIndex + 1);
            } else {
                finishQuiz();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const finishQuiz = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/quiz/finish', { sessionId }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setScore(res.data.totalScore);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-10 text-neon-blue animate-pulse font-mono">Loading Neural Interface...</div>;

    if (isFinished) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-cyber-gray border border-neon-blue rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-white font-mono">Mission Complete</h2>
                <p className="text-xl mb-8 text-gray-300">Final Score: <span className="font-bold text-neon-blue text-4xl block mt-2">{score}</span></p>
                <button onClick={() => navigate('/leaderboard')} className="bg-neon-purple text-white px-8 py-3 rounded hover:bg-purple-600 transition-all font-bold font-mono">
                    View Rankings
                </button>
            </div>
        );
    }

    if (questions.length === 0) return <div className="text-center mt-10 text-red-500">No data packets found.</div>;

    const currentQ = questions[currentQIndex];

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-cyber-gray border border-gray-700 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4 font-mono">
                <span className="text-gray-400">Question {currentQIndex + 1} / {questions.length}</span>
                <span className={`px-3 py-1 rounded text-sm font-bold ${currentQ.difficulty === 'HARD' ? 'bg-red-900/50 text-red-400 border border-red-500' :
                        currentQ.difficulty === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-500' :
                            'bg-green-900/50 text-green-400 border border-green-500'
                    }`}>
                    {currentQ.difficulty} :: {currentQ.points} PTS
                </span>
            </div>

            <h2 className="text-2xl font-bold mb-8 text-white">{currentQ.content}</h2>

            <div className="grid gap-4">
                {currentQ.options && currentQ.options.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer(opt.id)}
                        className="p-4 text-left border border-gray-700 rounded bg-dark-bg text-gray-300 hover:border-neon-blue hover:text-neon-blue hover:bg-gray-800 transition-all font-mono group"
                    >
                        <span className="text-gray-600 group-hover:text-neon-blue mr-2">&gt;</span> {opt.content}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Quiz;
