import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const KanbanQuiz = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');

    // Values: 'ALL', 'UNANSWERED', 'CORRECT', 'INCORRECT' (optional filter?) 
    // User asked for Cat and Diff filters.

    // Modal
    const [selectedQ, setSelectedQ] = useState(null);
    const [modalMessage, setModalMessage] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [qRes, cRes] = await Promise.all([
                axios.get('http://localhost:5000/api/questions', { headers }),
                axios.get('http://localhost:5000/api/questions/categories')
            ]);

            setQuestions(qRes.data);
            setCategories(cRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            navigate('/login');
        }
    };

    const handleCardClick = (q) => {
        // Allow re-viewing answered questions? Yes.
        // Allow re-answering? Backend blocks it.
        setSelectedQ(q);
        setModalMessage('');
    };

    const submitAnswer = async (optionId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/quiz/answer', {
                questionId: selectedQ.id,
                optionId
            }, { headers: { 'Authorization': `Bearer ${token}` } });

            // Update local state
            setModalMessage(res.data.isCorrect ? 'Correct! +Points' : 'Incorrect.');

            // Refresh main list status
            setQuestions(prev => prev.map(q =>
                q.id === selectedQ.id ? { ...q, status: res.data.isCorrect ? 'CORRECT' : 'INCORRECT' } : q
            ));

            // Close modal after delay? Or let user close.
            setTimeout(() => setSelectedQ(null), 1500);
        } catch (err) {
            setModalMessage(err.response?.data || 'Error submitting');
        }
    };

    // Filter Logic
    const filteredQuestions = questions.filter(q => {
        const matchCat = filterCategory ? q.category_name === filterCategory || q.category_id == filterCategory : true; // API returns category_name in 'category' field? check backend.
        // Backend: q.category = q.category_name.
        const matchDiff = filterDifficulty ? q.difficulty === filterDifficulty : true;
        return matchCat && matchDiff;
    });

    if (loading) return <div className="text-center text-neon-blue mt-10 animate-pulse font-mono">Scanning neural network...</div>;

    return (
        <div className="max-w-7xl mx-auto mt-6 px-4">
            <h1 className="text-3xl text-neon-blue font-mono mb-6 text-center">Tactical_Mission_Board</h1>

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
                                    // Disable if already answered (Correct or Incorrect)
                                    disabled={selectedQ.status !== 'UNANSWERED'}
                                    className={`
                                        w-full p-4 text-left border rounded transition-all font-mono
                                        ${selectedQ.status !== 'UNANSWERED'
                                            ? 'cursor-not-allowed opacity-50 border-gray-700 text-gray-500'
                                            : 'border-gray-600 bg-dark-bg text-gray-300 hover:border-neon-blue hover:text-white hover:bg-gray-800'}
                                    `}
                                >
                                    <span className="mr-3 text-neon-blue">&gt;</span>{opt.content}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default KanbanQuiz;
