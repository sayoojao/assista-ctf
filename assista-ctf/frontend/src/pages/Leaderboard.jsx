import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('https://odoo-ctf.easyinstance.com/api/quiz/leaderboard');
                setLeaders(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLeaderboard();
    }, []);

    const formatTime = (seconds) => {
        if (!seconds) return '00:00:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className="max-w-3xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6 text-center text-neon-blue font-mono">Global_Leaderboard</h1>
            <div className="bg-cyber-gray rounded-lg shadow-xl overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-dark-bg border-b border-gray-700 text-neon-purple font-mono uppercase text-sm tracking-wider">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Operative</th>
                            <th className="p-4 text-right">Score</th>
                            <th className="p-4 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 font-mono">
                        {leaders.map((user, index) => (
                            <tr key={index} className="hover:bg-dark-bg/50 transition-colors">
                                <td className="p-4 text-gray-400">#{index + 1}</td>
                                <td className="p-4 font-semibold text-white">{user.username}</td>
                                <td className="p-4 text-right text-neon-blue">{user.grand_total}</td>
                                <td className="p-4 text-right text-neon-purple">{formatTime(user.total_time_seconds)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
