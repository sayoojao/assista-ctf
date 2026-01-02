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
    const [quizStatus, setQuizStatus] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkQuizStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Check if quiz is active
                const statusRes = await axios.get('https://odoo-ctf.easyinstance.com/api/admin/quiz-status', { headers });
                setQuizStatus(statusRes.data);

                if (!statusRes.data.is_active) {
                    setLoading(false);
                    return;
                }

                // Calculate time remaining
                // Ensure server time is treated as UTC
                let timeStr = statusRes.data.start_time;
                if (timeStr && !timeStr.endsWith('Z')) {
                    timeStr = timeStr.replace(' ', 'T') + 'Z';
                }
                const startTime = new Date(timeStr).getTime();
                const duration = statusRes.data.duration_minutes * 60 * 1000;
                const endTime = startTime + duration;
                const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

                setTimeRemaining(remaining); // Always set logic, even if 0

                if (remaining === 0) {
                    setLoading(false);
                    return;
                }

                // Start Session
                const startRes = await axios.post('https://odoo-ctf.easyinstance.com/api/quiz/start', {}, { headers });
                setSessionId(startRes.data.sessionId);

                // Fetch Questions
                const qRes = await axios.get('https://odoo-ctf.easyinstance.com/api/questions');
                let qs = qRes.data;
                qs = qs.sort(() => 0.5 - Math.random());
                setQuestions(qs);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert(err.response?.data || 'Failed to start quiz');
                setLoading(false);
            }
        };
        checkQuizStatus();
    }, [navigate]);

    // Periodic Quiz Status Check (Detects Admin Stop / Expiration)
    useEffect(() => {
        if (!quizStatus?.is_active || isFinished) return;

        const statusChecker = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://odoo-ctf.easyinstance.com/api/admin/quiz-status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // If quiz was stopped by admin or expired
                if (!res.data.is_active) {
                    setQuizStatus(res.data);
                    alert('Quiz has been stopped by the administrator or time has expired');
                    navigate('/');
                }
            } catch (err) {
                console.error('Status check failed:', err);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(statusChecker);
    }, [quizStatus, isFinished, navigate]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining === 0 || isFinished) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishQuiz();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, isFinished]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleAnswer = async (optionId) => {
        // Prevent answering if quiz is inactive or time expired
        if (!quizStatus?.is_active || timeRemaining === 0) {
            alert('Quiz is not active or time has expired');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const currentQ = questions[currentQIndex];

            await axios.post('https://odoo-ctf.easyinstance.com/api/quiz/answer', {
                sessionId,
                questionId: currentQ.id,
                optionId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(currentQIndex + 1);
            } else {
                finishQuiz();
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                alert(err.response.data.error || 'Action forbidden');
                navigate('/');
            }
        }
    };

    const finishQuiz = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('https://odoo-ctf.easyinstance.com/api/quiz/finish', { sessionId }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setScore(res.data.totalScore);
            setIsFinished(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-10 text-neon-blue animate-pulse font-mono">Loading Neural Interface...</div>;

    if (!quizStatus || !quizStatus.is_active) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-cyber-gray border border-neon-purple rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-neon-purple font-mono">Quiz Not Active</h2>
                <p className="text-xl text-gray-300">The quiz has not been started by the admin yet. Please wait for the admin to activate the quiz.</p>
            </div>
        );
    }

    if (timeRemaining === 0) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-cyber-gray border border-red-500 rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-red-400 font-mono">Quiz Ended</h2>
                <p className="text-xl text-gray-300">The quiz time has expired.</p>
            </div>
        );
    }

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
            {/* Prominent Timer Display */}
            {timeRemaining !== null && (
                <div className={`mb-6 p-6 rounded-lg text-center border-2 ${timeRemaining < 300
                    ? 'bg-red-900/30 border-red-500 animate-pulse'
                    : timeRemaining < 600
                        ? 'bg-yellow-900/30 border-yellow-500'
                        : 'bg-blue-900/30 border-blue-500'
                    }`}>
                    <div className="text-sm font-mono text-gray-400 mb-2">TIME REMAINING</div>
                    <div className={`text-5xl font-bold font-mono ${timeRemaining < 300
                        ? 'text-red-400'
                        : timeRemaining < 600
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`}>
                        ⏱ {formatTime(timeRemaining)}
                    </div>
                    {timeRemaining < 300 && (
                        <div className="text-sm font-mono text-red-400 mt-2 animate-pulse">
                            ⚠️ HURRY! TIME RUNNING OUT!
                        </div>
                    )}
                </div>
            )}

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
                        disabled={!quizStatus?.is_active || timeRemaining === 0}
                        className={`p-4 text-left border border-gray-700 rounded bg-dark-bg text-gray-300 transition-all font-mono group
                            ${!quizStatus?.is_active || timeRemaining === 0
                                ? 'opacity-50 cursor-not-allowed border-red-900/50'
                                : 'hover:border-neon-blue hover:text-neon-blue hover:bg-gray-800'
                            }`}
                    >
                        <span className={`mr-2 ${!quizStatus?.is_active || timeRemaining === 0 ? 'text-gray-600' : 'text-gray-600 group-hover:text-neon-blue'}`}>&gt;</span> {opt.content}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Quiz;
