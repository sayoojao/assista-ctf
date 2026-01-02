import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const KanbanQuiz = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');

    // Quiz Status & Timer State
    const [quizStatus, setQuizStatus] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isFinished, setIsFinished] = useState(false);

    // Modal
    const [selectedQ, setSelectedQ] = useState(null);
    const [modalMessage, setModalMessage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            await checkQuizStatus();
            await fetchData();
        };
        init();
    }, []);

    // Periodic Quiz Status Check (Detects Admin Stop / Expiration)
    useEffect(() => {
        if (!quizStatus?.is_active) return;

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
    }, [quizStatus, navigate]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining === 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const checkQuizStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Check if quiz is active
            const statusRes = await axios.get('https://odoo-ctf.easyinstance.com/api/admin/quiz-status', { headers });
            setQuizStatus(statusRes.data);

            if (!statusRes.data.is_active) {
                return; // Will verify loading state later or redirect
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

        } catch (err) {
            console.error(err);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [qRes, cRes] = await Promise.all([
                axios.get('https://odoo-ctf.easyinstance.com/api/questions', { headers }),
                axios.get('https://odoo-ctf.easyinstance.com/api/questions/categories')
            ]);

            setQuestions(qRes.data);
            setCategories(cRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            navigate('/login');
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleCardClick = (q) => {
        // Allow re-viewing answered questions? Yes.
        // Allow re-answering? Backend blocks it.
        // Block if quiz inactive/expired
        if (!quizStatus?.is_active || timeRemaining === 0) {
            alert('Mission Control: Quiz is offline or time has expired.');
            return;
        }
        setSelectedQ(q);
        setModalMessage('');
    };

    const submitAnswer = async (optionId) => {
        // Prevent answering if quiz is inactive or time expired
        if (!quizStatus?.is_active || timeRemaining === 0) {
            setModalMessage('FAILED: Quiz inactive or time expired.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('https://odoo-ctf.easyinstance.com/api/quiz/answer', {
                questionId: selectedQ.id,
                optionId
            }, { headers: { 'Authorization': `Bearer ${token}` } });

            // Update local state
            setModalMessage(res.data.isCorrect ? 'Correct! +Points' : 'Incorrect.');

            // Refresh main list status
            setQuestions(prev => prev.map(q =>
                q.id === selectedQ.id ? { ...q, status: res.data.isCorrect ? 'CORRECT' : 'INCORRECT' } : q
            ));

            // Close modal after delay
            setTimeout(() => setSelectedQ(null), 1500);
        } catch (err) {
            setModalMessage(err.response?.data || 'Error submitting');
            if (err.response?.status === 403) {
                setTimeout(() => {
                    setSelectedQ(null);
                    navigate('/');
                }, 2000);
            }
        }
    };

    // Filter Logic
    const filteredQuestions = questions.filter(q => {
        const matchCat = filterCategory ? q.category_name === filterCategory || q.category_id == filterCategory : true;
        const matchDiff = filterDifficulty ? q.difficulty === filterDifficulty : true;
        return matchCat && matchDiff;
    });

    if (loading) return <div className="text-center text-neon-blue mt-10 animate-pulse font-mono">Scanning neural network...</div>;

    if (!quizStatus || !quizStatus.is_active) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-cyber-gray border border-neon-purple rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-neon-purple font-mono">Mission Offline</h2>
                <p className="text-xl text-gray-300">Tactical operations are currently suspended. Stand by for command.</p>
            </div>
        );
    }

    if (timeRemaining === 0) {
        return (
            <div className="max-w-xl mx-auto mt-10 p-8 bg-cyber-gray border border-red-500 rounded-xl shadow-2xl text-center">
                <h2 className="text-3xl font-bold mb-4 text-red-400 font-mono">Mission Failed</h2>
                <p className="text-xl text-gray-300">Time limit exceeded. Operations terminated.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto mt-6 px-4">
            <h1 className="text-3xl text-neon-blue font-mono mb-2 text-center">Tactical_Mission_Board</h1>

            {/* Prominent Timer Display */}
            {timeRemaining !== null && (
                <div className={`mb-8 mx-auto max-w-2xl p-4 rounded-lg text-center border-2 ${timeRemaining < 300
                    ? 'bg-red-900/30 border-red-500 animate-pulse'
                    : timeRemaining < 600
                        ? 'bg-yellow-900/30 border-yellow-500'
                        : 'bg-blue-900/30 border-blue-500'
                    }`}>
                    <div className="text-xs font-mono text-gray-400 mb-1">MISSION CLOCK</div>
                    <div className={`text-4xl font-bold font-mono ${timeRemaining < 300
                        ? 'text-red-400'
                        : timeRemaining < 600
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`}>
                        ⏱ {formatTime(timeRemaining)}
                    </div>
                    {timeRemaining < 300 && (
                        <div className="text-xs font-mono text-red-400 mt-1 animate-pulse">
                            ⚠️ CRITICAL TIME WARNING
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center font-mono">
                <select className="bg-dark-bg border border-neon-blue/50 text-white p-2 rounded focus:outline-none focus:border-neon-blue"
                    value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="">[ All Categories ]</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <select className="bg-dark-bg border border-neon-blue/50 text-white p-2 rounded focus:outline-none focus:border-neon-blue"
                    value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                    <option value="">[ All Difficulties ]</option>
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuestions.map(q => (
                    <div
                        key={q.id}
                        onClick={() => handleCardClick(q)}
                        className={`
                            relative p-6 rounded-xl border cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-xl
                            ${q.status === 'CORRECT' ? 'bg-green-900/10 border-green-500/50 hover:shadow-green-500/20' :
                                q.status === 'INCORRECT' ? 'bg-red-900/10 border-red-500/50 hover:shadow-red-500/20' :
                                    'bg-cyber-gray border-neon-blue/30 hover:border-neon-blue hover:shadow-neon-blue/20'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-4 font-mono text-xs">
                            <span className="text-gray-400 uppercase">{q.category}</span>
                            <span className={`px-2 py-1 rounded ${q.difficulty === 'HARD' ? 'text-red-400 bg-red-900/20' :
                                q.difficulty === 'MEDIUM' ? 'text-yellow-400 bg-yellow-900/20' :
                                    'text-green-400 bg-green-900/20'
                                }`}>{q.difficulty}</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-100 mb-4 line-clamp-3 font-mono">{q.content}</h3>

                        <div className="absolute bottom-4 right-4 text-neon-purple font-bold font-mono text-xl">
                            {q.points} <span className="text-xs text-gray-500">PTS</span>
                        </div>

                        {/* Status Validations */}
                        {q.status === 'CORRECT' && <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center rounded-xl backdrop-blur-sm pointer-events-none">
                            <span className="text-green-400 font-bold text-2xl border-4 border-green-400 p-2 rounded rotate-[-12deg] shadow-lg">SOLVED</span>
                        </div>}
                        {q.status === 'INCORRECT' && <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center rounded-xl backdrop-blur-sm pointer-events-none">
                            <span className="text-red-400 font-bold text-2xl border-4 border-red-400 p-2 rounded rotate-[12deg] shadow-lg">FAILED</span>
                        </div>}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {selectedQ && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-cyber-gray border border-neon-blue p-8 rounded-xl max-w-2xl w-full shadow-2xl relative">
                        <button onClick={() => setSelectedQ(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl">&times;</button>

                        <div className="mb-6 border-b border-gray-700 pb-4">
                            <div className="flex justify-between items-center text-sm font-mono text-gray-400 mb-2">
                                <span>{selectedQ.category} // {selectedQ.difficulty}</span>
                                <span>{selectedQ.points} PTS</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white font-mono">{selectedQ.content}</h2>
                        </div>

                        <div className="space-y-3">
                            {selectedQ.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => submitAnswer(opt.id)}
                                    // Disable if already answered (Correct or Incorrect) OR Quiz Status check
                                    disabled={selectedQ.status !== 'UNANSWERED' || !quizStatus?.is_active || timeRemaining === 0}
                                    className={`
                                        w-full p-4 text-left border rounded transition-all font-mono
                                        ${selectedQ.status !== 'UNANSWERED'
                                            ? 'cursor-not-allowed opacity-50 border-gray-700 text-gray-500'
                                            : (!quizStatus?.is_active || timeRemaining === 0)
                                                ? 'cursor-not-allowed opacity-50 border-red-900/50 text-gray-500'
                                                : 'border-gray-600 bg-dark-bg text-gray-300 hover:border-neon-blue hover:text-white hover:bg-gray-800'}
                                    `}
                                >
                                    <span className={`mr-3 ${(!quizStatus?.is_active || timeRemaining === 0) ? 'text-gray-600' : 'text-neon-blue'}`}>&gt;</span>{opt.content}
                                </button>
                            ))}
                        </div>

                        {modalMessage && (
                            <div className={`mt-6 p-4 rounded text-center font-bold text-xl font-mono ${modalMessage.includes('Correct') ? 'bg-green-900/50 text-green-400 border border-green-500' : 'bg-red-900/50 text-red-400 border border-red-500'
                                }`}>
                                {modalMessage}
                            </div>
                        )}

                        {selectedQ.status !== 'UNANSWERED' && (
                            <div className="mt-4 text-center text-gray-500 text-sm font-mono">
                                [ This module has already been processed ]
                            </div>
                        )}
                        {(!quizStatus?.is_active || timeRemaining === 0) && (
                            <div className="mt-4 text-center text-red-500 text-sm font-mono animate-pulse">
                                [ SYSTEM OFFLINE: CANNOT EXECUTE ]
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanQuiz;
